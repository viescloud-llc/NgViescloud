import { Component, EventEmitter, forwardRef, Input, Output, ViewChildren } from '@angular/core';
import { MatFormFieldComponent } from '../mat-form-field/mat-form-field.component';
import { AccessPermission, SharedGroup, SharedUser, UserAccess } from '../../model/Authenticator.model';

export enum UserAccessInputType {
  SHARED_USERS = 'sharedUsers',
  SHARED_GROUPS = 'sharedGroups',
  SHARED_OTHERS = 'sharedOthers',
  ALL = 'all'
}

@Component({
  selector: 'app-mat-form-field-input-user-access',
  templateUrl: './mat-form-field-input-user-access.component.html',
  styleUrls: ['./mat-form-field-input-user-access.component.scss'],
  providers: [{ provide: MatFormFieldComponent, useExisting: forwardRef(() => MatFormFieldInputUserAccessComponent) }]
})
export class MatFormFieldInputUserAccessComponent<T extends UserAccess | SharedUser[] | SharedGroup[] | AccessPermission[]> extends MatFormFieldComponent {

  override value!: T;
  override valueCopy!: T;
  override valueChange: EventEmitter<T> = new EventEmitter<T>;
  override label: string = 'User Access';

  @Input()
  inputType: UserAccessInputType[] | UserAccessInputType = UserAccessInputType.ALL;

  @Input()
  showOwnerUserId: boolean = true;

  @Input()
  expanded: boolean = false;

  @Output()
  expandedChange: EventEmitter<boolean> = new EventEmitter<boolean>();

  ownerUserId?: string;
  sharedUsers?: SharedUser[];
  sharedGroups?: SharedGroup[];
  sharedOthers?: AccessPermission[];

  sharedValues?: SharedUser[] | SharedGroup[] | AccessPermission[];

  blankSharedUsers: SharedUser[] = [new SharedUser()] as SharedUser[];
  blankSharedGroups: SharedGroup[] = [new SharedGroup()] as SharedGroup[];
  blankSharedOthers: AccessPermission[] = [AccessPermission.READ] as AccessPermission[];

  UserAccessInputType = UserAccessInputType;

  validForm = false;

  override ngOnInit(): void {
    if(this.value instanceof UserAccess) {
      this.ownerUserId = this.value.ownerUserId;
      this.sharedUsers = this.value.sharedUsers;
      this.sharedGroups = this.value.sharedGroups;
      this.sharedOthers = this.value.sharedOthers;
    }
    else if(Array.isArray(this.value)) {
      this.sharedValues = this.value;
    }
    else {

    }
  }

  isInputType(inputType: UserAccessInputType): boolean {
    return Array.isArray(this.inputType) ? this.inputType.includes(inputType) : this.inputType === inputType
  }
}
