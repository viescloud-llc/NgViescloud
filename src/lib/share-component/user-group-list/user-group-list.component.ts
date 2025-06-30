import { Component } from '@angular/core';
import { RxJSUtils } from '../../util/RxJS.utils';
import { UserGroup } from '../../model/authenticator.model';
import { UserGroupService } from '../../service/user-group.service';

@Component({
  selector: 'app-user-group-list',
  templateUrl: './user-group-list.component.html',
  styleUrls: ['./user-group-list.component.scss'],
  standalone: false
})
export class UserGroupListComponent {

  blankUserGroup = new UserGroup();

  constructor(
    public userGroupService: UserGroupService,
    public rxjsUtils: RxJSUtils
  ) { }

  postOrPut(userGroup: UserGroup, service: UserGroupService) {
    return service?.postOrPut(userGroup.id, userGroup);
  }
}
