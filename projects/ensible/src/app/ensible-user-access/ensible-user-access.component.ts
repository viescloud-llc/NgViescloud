import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { EnsibleUserService } from '../service/ensible-user/ensible-user.service';
import { EnsibleUserGroupService } from '../service/ensible-user-group/ensible-user-group.service';
import { MatOption } from 'projects/viescloud-utils/src/lib/model/Mat.model';
import { RxJSUtils } from 'projects/viescloud-utils/src/lib/util/RxJS.utils';
import { MatFormFieldInputUserAccessComponent } from 'projects/viescloud-utils/src/lib/util-component/mat-form-field-input-user-access/mat-form-field-input-user-access.component';
import { UserAccess, SharedUser, SharedGroup, AccessPermission } from 'projects/viescloud-utils/src/lib/model/Authenticator.model';
import { DialogUtils } from 'projects/viescloud-utils/src/lib/util/Dialog.utils';

@Component({
  selector: 'app-ensible-user-access',
  templateUrl: '../../../../viescloud-utils/src/lib/util-component/mat-form-field-input-user-access/mat-form-field-input-user-access.component.html',
  styleUrls: ['../../../../viescloud-utils/src/lib/util-component/mat-form-field-input-user-access/mat-form-field-input-user-access.component.scss']
})
export class EnsibleUserAccessComponent<T extends UserAccess | SharedUser[] | SharedGroup[] | AccessPermission[]> extends MatFormFieldInputUserAccessComponent<T> {

  constructor(
    private ensibleUserGroupService: EnsibleUserGroupService,
    private ensibleUserService: EnsibleUserService,
    private rxjsUtils: RxJSUtils,
    cd: ChangeDetectorRef,
    dialogUtils: DialogUtils
  ) { 
    super(cd, dialogUtils);
  }
  
  override ngOnInit(): void {
    super.ngOnInit();
    this.ensibleUserGroupService.getAll().pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: res => {
        this.groupIdOptions = [];
        res.forEach(e => {
          this.groupIdOptions.push({
            value: e.id + '',
            valueLabel: e.name
          });
        });
      }
    })

    this.ensibleUserService.getAllPublicUser().pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: res => {
        this.userIdOptions = [];
        res.forEach(e => {
          this.userIdOptions.push({
            value: e.id + '',
            valueLabel: `id: ${e.id} - ${e.alias}`
          });
        });
      }
    })
  }
}
