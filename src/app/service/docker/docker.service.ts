import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DockerTagsResponse, DockerTagsResultResponse } from '../../model/docker.model';
import { HttpParamsBuilder } from '../../../lib/model/utils.model';
import { map, reduce } from 'rxjs';
import { Pageable } from '../../../lib/model/vies.model';

@Injectable({
  providedIn: 'root'
})
export class DockerService {

  constructor(
    private httpClient: HttpClient
  ) { }

  fetchDockerImageTags(request: {dockerRegistryUrl: string, dockerImage: string, page?: number, pageSize?: number, dockerUsername?: string, dockerPassword?: string}) {
    let page = request.page && request.page >= 0 ? request.page : 1;
    let size = request.pageSize && request.pageSize > 0 ? request.pageSize : 10;
    
    let dockerImage = request.dockerImage;
    let dockerRegistryUrl = request.dockerRegistryUrl;

    while(dockerImage.startsWith('/') && dockerImage.length > 1) {
      dockerImage = dockerImage.substring(1);
    }

    while(dockerRegistryUrl.endsWith('/') && dockerRegistryUrl.length > 1) {
      dockerRegistryUrl = dockerRegistryUrl.substring(0, dockerRegistryUrl.length - 1);
    }

    let params = new HttpParamsBuilder();
    params.setIfValid("page_size", size);
    params.setIfValid("page", page);

    // if(request.dockerUsername && request.dockerPassword) {
    //   return this.httpClient.get<DockerTagsResponse>(`${dockerRegistryUrl}/v2/repositories/${dockerImage}/tags`, {params: params.build()});
    // }
    // else {
    //   return this.httpClient.get<DockerTagsResponse>(`${dockerRegistryUrl}/v2/repositories/${dockerImage}/tags`, {params: params.build()})
    //   .pipe(
    //     map(res => {
    //       let pageable = new Pageable<DockerTagsResponse>()

    //       return pageable;
    //     })
    //   );
    // }

    return this.httpClient.get<DockerTagsResponse>(`${dockerRegistryUrl}/v2/repositories/${dockerImage}/tags`, {params: params.build()})
    .pipe(
      map(res => {
        let pageable = new Pageable<DockerTagsResultResponse>()
        pageable._metadata.pageNumber = page;
        pageable._metadata.pageSize = size;
        pageable._metadata.totalElement = res.count;
        pageable._metadata.totalPage = res.count / size;
        pageable.content = [...res.results];
        return pageable;
      })
    );
  }
}

