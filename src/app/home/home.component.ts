import { Component, computed, OnInit } from '@angular/core';
import { ViescloudUtilsModule } from '../../lib/viescloud-utils.module';
import { DockerService } from '../service/docker/docker.service';
import { DockerTagsResultResponse } from '../model/docker.model';
import { Pageable } from '../../lib/model/vies.model';
import { LazyPageChange } from '../../lib/util-component/mat-table-lazy/mat-table-lazy.component';
import { RxJSUtils } from '../../lib/util/RxJS.utils';
import { FileUtils } from '../../lib/util/File.utils';
import { ViesService } from '../../lib/service/rest.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports: [ViescloudUtilsModule]
})
export class HomeComponent implements OnInit {
  dockerRegistryUrl = 'https://registry.hub.docker.com';
  dockerRepositoryUrl = 'https://hub.docker.com';
  dockerImage = '';
  dockerTag = '';
  dockerUsername = '';
  dockerPassword = '';

  DockerTagsResultResponsePage: Pageable<DockerTagsResultResponse> = new Pageable();
  blankDockerTagsResultResponse: DockerTagsResultResponse = new DockerTagsResultResponse();

  dockerReady = false;
  initLoading = false;

  constructor(
    private dockerService: DockerService,
    private rxjsUtils: RxJSUtils
  ) { }

  ngOnInit(): void {
    this.dockerService.engineReady()
    .pipe(this.rxjsUtils.waitLoadingDialog())
    .pipe(finalize(() => this.initLoading = true))
    .subscribe({
      next: res => {
        this.dockerReady = res;
      }
    })
  }

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

  pullDockerImage() {
    this.dockerService.pullImage({
      dockerHub: this.dockerRepositoryUrl,
      image: this.dockerImage,
      tag: this.dockerTag,
      username: this.dockerUsername,
      password: this.dockerPassword
    })
    .pipe(this.rxjsUtils.waitLoadingDialog())
    .subscribe({
      next: res => {
        const url = res.url;
        if(ViesService.isCSR()) {
          window.open(url, "_blank");
        }
      }
    })
  }
}
