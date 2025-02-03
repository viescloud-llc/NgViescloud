import { Component, EventEmitter, forwardRef, Input, Output, ViewChildren } from '@angular/core';
import { MatFormFieldComponent } from '../mat-form-field/mat-form-field.component';
import { AccessPermission, SharedGroup, SharedUser, UserAccess } from '../../model/Authenticator.model';
import { MatOption } from '../../model/Mat.model';
import { DataUtils } from '../../util/Data.utils';

export enum UserAccessInputType {
  SHARED_USERS = 'sharedUsers',
  SHARED_GROUPS = 'sharedGroups',
  SHARED_OTHERS = 'sharedOthers',
  OWNER_USER_ID = 'ownerUserId',
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
  expanded: boolean = false;

  @Input()
  showExpansionPanel: boolean = true;

  @Input()
  userIdOptions: MatOption<String>[] = [];

  @Input()
  groupIdOptions: MatOption<String>[] = [];

  @Output()
  expandedChange: EventEmitter<boolean> = new EventEmitter<boolean>();

  ownerUserId?: string;
  sharedUsers: SharedUser[] = [];
  sharedGroups: SharedGroup[] = [];
  sharedOthers: AccessPermission[] = [];

  blankSharedUsers: SharedUser[] = [new SharedUser()] as SharedUser[];
  blankSharedGroups: SharedGroup[] = [new SharedGroup()] as SharedGroup[];
  blankSharedOthers: AccessPermission[] = [AccessPermission.READ] as AccessPermission[];
  permissionOptions: MatOption<AccessPermission>[] = [
    { value: AccessPermission.READ, valueLabel: 'Read' },
    { value: AccessPermission.WRITE, valueLabel: 'Write' },
    { value: AccessPermission.DELETE, valueLabel: 'Delete' }
  ]

  UserAccessInputType = UserAccessInputType;

  validForm = false;

  override ngOnInit(): void {
    if(Array.isArray(this.value)) {
      this.sharedUsers = this.value as any;
      this.sharedGroups = this.value as any;
      this.sharedOthers = this.value as any;
    }
    else {
      this.ownerUserId = this.value.ownerUserId;
      this.sharedUsers = this.value.sharedUsers;
      this.sharedGroups = this.value.sharedGroups;
      this.sharedOthers = this.value.sharedOthers;
    }
  }

  isInputType(inputType: UserAccessInputType): boolean {
    return Array.isArray(this.inputType) ? this.inputType.includes(inputType) : this.inputType === inputType
  }

  addNewSharedUser() {
    this.sharedUsers?.push(new SharedUser());
  }

  addNewSharedGroup() {
    this.sharedGroups?.push(new SharedGroup());
  }

  removeSharedUser(index: number) {
    this.sharedUsers?.splice(index, 1);
  }

  removeSharedGroup(index: number) {
    this.sharedGroups?.splice(index, 1);
  }

  override isValidInput(): boolean {
    return this.validForm && super.isValidInput();
  }

  containInputType(type: UserAccessInputType): boolean {
    if(Array.isArray(this.inputType)) {
      return this.inputType.some(e => e === UserAccessInputType.ALL || e === type);
    }
    else {
      return this.inputType === UserAccessInputType.ALL || this.inputType === type;
    }
  }
}
