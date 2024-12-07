import { RxJSUtils } from './../../../../viescloud-utils/src/lib/util/RxJS.utils';
import { Component, OnInit } from '@angular/core';
import { RouteUtil } from 'projects/viescloud-utils/src/lib/util/Route.utils';
import { EnsibleFsService } from '../service/ensible-fs/ensible-fs.service';
import { ActivatedRoute } from '@angular/router';
import { RouteChangeSubcribe } from 'projects/viescloud-utils/src/lib/directive/RouteChangeSubcribe.directive';

@Component({
  selector: 'app-ensible-role',
  templateUrl: './ensible-role.component.html',
  styleUrls: ['./ensible-role.component.scss']
})
export class EnsibleRoleComponent extends RouteChangeSubcribe{

  fullSortedPath: string = '';
  roleName: string = '';
  roleCategoryName: string = '';
  fileName: string = '';

  error: string = '';

  fileContent: string = '';

  constructor(
    private ensibleFsService: EnsibleFsService,
    private rxJSUtils: RxJSUtils,
    route: ActivatedRoute
  ) {
    super(route);
  }

  override onRouteChange(): void {
    this.error = '';
    let pathSplits = RouteUtil.getCurrentUrl().split('/');
    if(pathSplits.length == 7) {
      this.roleName = pathSplits[pathSplits.length - 3];
      this.roleCategoryName = pathSplits[pathSplits.length - 2];
      this.fileName = pathSplits[pathSplits.length - 1];
      this.fullSortedPath = `/roles/${this.roleName}/${this.roleCategoryName}/${this.fileName}`;

      this.ensibleFsService.readFileAsString(this.fullSortedPath).pipe(this.rxJSUtils.waitLoadingDialog()).subscribe({
        next: data => {
          this.fileContent = data;
        },
        error: (err) => {
          this.error = err;
        }
      });
    }
    else
      this.error = 'Invalid roles path';
  }
}
