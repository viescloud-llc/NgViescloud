import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { ObjectDialog, ObjectDialogData } from '../../object-dialog/object-dialog.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { first } from 'rxjs';
import { Organization, Role } from '../../../model/Organization.model';
import { OrganizationService } from '../../../service/Organization.service';

@Component({
  selector: 'app-organization-role-dialog',
  templateUrl: './organization-role-dialog.component.html',
  styleUrls: ['./organization-role-dialog.component.scss']
})
export class OrganizationRoleDialog extends ObjectDialog<Role, OrganizationService> {

  constructor(
    @Inject(MAT_DIALOG_DATA) data: {role: Role, organization: Organization},
    dialogRef: MatDialogRef<ObjectDialog>,
    cd: ChangeDetectorRef,
    organizationService: OrganizationService
  ) { 
    let dialogData: ObjectDialogData<Role, OrganizationService> = {
      id: data.role.id,
      service: organizationService,
      getFn: async (service: OrganizationService, id: number) => {
        return new Promise<Role>((resolve, reject) => {
          resolve(data.role);
        })
      },
      createFn: async (service: OrganizationService, role: Role) => {
        return new Promise<Role>((resolve, reject) => {
          let organization = structuredClone(data.organization);
          organization.roles?.push(role);
          service.patch(organization.id, organization).pipe(first()).subscribe({
              next: (res) => resolve(role),
              error: (error) => reject(error)
            })
        })
      },
      modifyFn: async (service: OrganizationService, role: Role) => {
        return new Promise<Role>((resolve, reject) => {
          let organization = structuredClone(data.organization);
          organization.roles!.map((r: Role) => {
            if(r.id === role.id)
              return role;
            else
              return r
          });
          service.patch(organization.id, organization).pipe(first()).subscribe({
              next: (res) => resolve(role),
              error: (error) => reject(error)
            })
        })
      }
    }

    super(dialogData, dialogRef, cd);
  }
}
