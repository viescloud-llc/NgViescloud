import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DockerTagsResponse, DockerTagsResultResponse } from '../../model/docker.model';
import { HttpParamsBuilder } from '../../../lib/model/utils.model';
import { map, of, reduce } from 'rxjs';
import { Pageable } from '../../../lib/model/vies.model';
import { ViesHttpClientService } from '../../../lib/service/vies.service';
import { ViesService } from '../../../lib/service/rest.service';

@Injectable({
  providedIn: 'root'
})
export class DockerService extends ViesService {

  dockerReady = false;

  protected override getPrefixes(): string[] {
    return ['api', 'v1', 'dockers'];
  }

  constructor(
    httpClient: HttpClient,
    private viesHttpClientService: ViesHttpClientService
  ) { 
    super(httpClient)
  }

  fetchDockerImageTags(request: {dockerRegistryUrl: string, dockerImage: string, page?: number, pageSize?: number, dockerUsername?: string, dockerPassword?: string}) {
    let page = request.page && request.page >= 0 ? request.page : 0;
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

    return this.viesHttpClientService.get<DockerTagsResponse>({url: `${dockerRegistryUrl}/v2/repositories/${dockerImage}/tags`, queryParams: params.toMap()})
    .pipe(
      map(res => {
        let body = res.body;
        let pageable = new Pageable<DockerTagsResultResponse>()
        pageable._metadata.pageNumber = page;
        pageable._metadata.pageSize = size;
        pageable._metadata.totalElement = body!.count;
        pageable._metadata.totalPage = (body!.count + size - 1);
        pageable.content = [...body!.results];
        return pageable;
      })
    );
  }

  getImage(filePath: string) {
    let params = new HttpParamsBuilder();
    params.setIfValid("filePath", filePath);

    return this.httpClient.get(
      `${this.getPrefixUri()}/image`,
      { 
        responseType: 'blob', 
        params: params.build()
      }
    )
  }

  pullImage(dockerPullRequest: {dockerHub: string, image: string, tag: string, username?: string, password?: string}) {
    return this.httpClient.put<{filePath: string}>(`${this.getPrefixUri()}/pull`, dockerPullRequest)
                          .pipe(
                            map(res => {
                              return {
                                filePath: res.filePath,
                                url: `${this.getPrefixUri()}/image?filePath=${res.filePath}`
                              }
                            }
                          ));
  }

  engineReady() {
    if(this,this.dockerReady) {
      return of(this.dockerReady);
    }

    return this.httpClient.get<{ready: boolean}>(`${this.getPrefixUri()}/engine/ready`).pipe(
      map(res => {
        if(res.ready) {
          this.dockerReady = true;
        }

        return res.ready;
      })
    );
  }

}