import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { Organization, Role, User, UserProfile } from '../../../model/Organization.model';
import { OrganizationService } from '../../../service/Organization.service';
import { ObjectDialog, ObjectDialogData } from '../../object-dialog/object-dialog.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { first } from 'rxjs';
import { MatOption } from '../../../model/Mat.model';

export interface OrganizationUserDialogData {
  user: User,
  organization: Organization
}

@Component({
  selector: 'app-organization-user-dialog',
  templateUrl: './organization-user-dialog.component.html',
  styleUrls: ['./organization-user-dialog.component.scss']
})
export class OrganizationUserDialog extends ObjectDialog<User, OrganizationService> {
  
  userProfileBlank: UserProfile = new UserProfile();
  options: MatOption<any>[] = [];
  defineRoles: Role[] = [];
  roleBlank = new Role();

  constructor(
    @Inject(MAT_DIALOG_DATA) data: OrganizationUserDialogData,
    dialogRef: MatDialogRef<ObjectDialog>,
    cd: ChangeDetectorRef,
    organizationService: OrganizationService
  ) {
    let dialogData: ObjectDialogData<User, OrganizationService> = {
      id: data.user.id,
      service: organizationService,
      getFn: async (service: OrganizationService, id: number) => {
        return new Promise<User>((resolve, reject) => {
          resolve(data.user);
        })
      },
      createFn: async (service: OrganizationService, user: User) => {
        return new Promise<User>((resolve, reject) => {
          let organization = structuredClone(data.organization);
          organization.users?.push(user)
          service.patch(organization.id, organization).pipe(first()).subscribe({
              next: (res) => resolve(user),
              error: (error) => reject(error)
            })
        })
      },
      modifyFn: async (service: OrganizationService, user: User) => {
        return new Promise<User>((resolve, reject) => {
          let organization = structuredClone(data.organization);
          organization.users!.map((u: User) => {
            if(u.id === user.id)
              return user;
            else
              return u
          });
          service.patch(organization.id, organization).pipe(first()).subscribe({
              next: (res) => resolve(user),
              error: (error) => reject(error)
            })
        })
      }
    }
    super(dialogData, dialogRef, cd);
    let roles = data.organization.roles!;
    roles.forEach(e => {
      let option: MatOption<any> = {
        value: e,
        valueLabel: e.title!,
        disable: false
      }
      this.options.push(option);
    })
    this.defineRoles = data.user.defineRole!;
  }

}
