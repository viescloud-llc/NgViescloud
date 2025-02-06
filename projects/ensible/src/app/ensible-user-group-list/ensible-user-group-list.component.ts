import { Component } from '@angular/core';
import { EnsibleUserGroupService } from '../service/ensible-user-group/ensible-user-group.service';
import { EnsibleUserGroup } from '../model/ensible.model';
import { RxJSUtils } from 'projects/viescloud-utils/src/lib/util/RxJS.utils';

@Component({
  selector: 'app-ensible-user-group-list',
  templateUrl: './ensible-user-group-list.component.html',
  styleUrls: ['./ensible-user-group-list.component.scss']
})
export class EnsibleUserGroupListComponent {

  blankUserGroup = new EnsibleUserGroup();

  constructor(
    public userGroupService: EnsibleUserGroupService,
    public rxjsUtils: RxJSUtils
  ) { }

  put(userGroup: EnsibleUserGroup, service: EnsibleUserGroupService) {
    return service?.put(userGroup.id, userGroup);
  }
}
