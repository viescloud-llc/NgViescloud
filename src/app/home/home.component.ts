import { Component, computed } from '@angular/core';
import { ViescloudUtilsModule } from '../../lib/viescloud-utils.module';
import { DockerService } from '../service/docker/docker.service';
import { DockerTagsResultResponse } from '../model/docker.model';
import { Pageable } from '../../lib/model/vies.model';
import { LazyPageChange } from '../../lib/util-component/mat-table-lazy/mat-table-lazy.component';
import { RxJSUtils } from '../../lib/util/RxJS.utils';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports: [ViescloudUtilsModule]
})
export class HomeComponent {
  dockerRegistryUrl = 'https://registry.hub.docker.com';
  dockerRepositoryUrl = 'https://hub.docker.com';
  dockerImage = '';
  dockerTag = '';
  dockerUsername = '';
  dockerPassword = '';

  DockerTagsResultResponsePage: Pageable<DockerTagsResultResponse> = new Pageable();
  blankDockerTagsResultResponse: DockerTagsResultResponse = new DockerTagsResultResponse();

  constructor(
    private dockerService: DockerService,
    private rxjsUtils: RxJSUtils
  ) { }

  onDockerSettingInputFocusout(lazyPageChange?: LazyPageChange) {
    if(this.dockerImage && this.dockerRegistryUrl) {
      let imagePath = this.dockerImage;
      if(!imagePath.includes('/')) {
        imagePath = 'library/' + imagePath;
      }

      this.dockerService.fetchDockerImageTags({
        dockerRegistryUrl: this.dockerRegistryUrl,
        dockerImage: imagePath,
        dockerUsername: this.dockerUsername,
        dockerPassword: this.dockerPassword,
        page: lazyPageChange?.pageIndex ?? 0,
        pageSize: lazyPageChange?.pageSize ?? 5
      }).pipe(this.rxjsUtils.waitLoadingSnackBar("fetching tags"))
      .subscribe({
        next: res => {
          this.DockerTagsResultResponsePage = res;
        }
      })
    }
  }

  onEditRow(dockerTagsResultResponse: DockerTagsResultResponse) {
    this.dockerTag = dockerTagsResultResponse.name;
  }
}
