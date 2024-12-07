import { Component, OnInit } from '@angular/core';
import { RouteUtil } from 'projects/viescloud-utils/src/lib/util/Route.utils';

@Component({
  selector: 'app-ensible-role',
  templateUrl: './ensible-role.component.html',
  styleUrls: ['./ensible-role.component.scss']
})
export class EnsibleRoleComponent implements OnInit {

  roleCategoryName: string = '';
  roleName: string = '';
  fileName: string = '';

  error: string = '';

  constructor() { }

  ngOnInit(): void {
    let pathSplits = RouteUtil.getCurrentUrl().split('/');
    if(pathSplits.length == 7) {
      this.roleCategoryName = pathSplits[pathSplits.length - 3];
      this.roleName = pathSplits[pathSplits.length - 2];
      this.fileName = pathSplits[pathSplits.length - 1];
    }
    else
      this.error = 'Invalid roles path';
  }
}
