import { Component, EventEmitter, Input, Output, forwardRef } from '@angular/core';
import { MatFormFieldComponent } from '../mat-form-field/mat-form-field.component';
import { ConfirmDialog } from '../../dialog/confirm-dialog/confirm-dialog.component';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-mat-form-field-input-list',
  templateUrl: './mat-form-field-input-list.component.html',
  styleUrls: ['./mat-form-field-input-list.component.scss'],
  providers: [{provide: MatFormFieldComponent, useExisting: forwardRef(() => MatFormFieldInputListComponent)}],
})
export class MatFormFieldInputListComponent extends MatFormFieldComponent {

  @Input()
  override value!: any[];
  override valueCopy!: any[];

  @Output()
  override valueChange: EventEmitter<any[]> = new EventEmitter();

  @Input()
  showSizeInput: boolean = true;

  @Input()
  showRemoveItemButton: boolean = true;

  @Input()
  showAddItemButton: boolean = true;

  @Input()
  showDragAndDropButton: boolean = true;

  @Input()
  maxSize: number = 100;

  @Input()
  minSize: number = 0;

  listLength!: number;

  validForm: boolean = false;

  @Input()
  blankObjectType!: string;

  @Input()
  expanded: boolean = false;

  @Input()
  focusOutAutoFillFn?: (value: any, index: number) => any;

  @Output()
  expandedChange: EventEmitter<boolean> = new EventEmitter<boolean>();

  override ngOnInit() {
    super.ngOnInit();

    if(this.readonly) {
      this.showSizeInput = false;
      this.showRemoveItemButton = false;
      this.showAddItemButton = false;
      this.validForm = true;
      this.showDragAndDropButton = false;
    }

    this.listLength = this.value.length;
    this.updateBlankObjectType();
  }

  override isValidInput(): boolean {
    let superCheck = super.isValidInput();
    if(!superCheck)
      return superCheck;
    else if(this.value.length < this.minSize)
      return false;
    else
      return this.validForm;
  }

  updateListLength() {
    if(this.reachMaxSize())
      this.listLength = this.maxSize;

    while(this.value.length < this.listLength)
      this.value.push(this.cloneBlankObject());

    if(this.value.length > this.listLength) {
      let deleteSize = this.value.length - this.listLength
      this.value.splice(this.listLength - 1, deleteSize);
    }

    this.listLength = this.value.length;
  }

  addNewItem() {
    if(!this.reachMaxSize())
      this.value.push(this.cloneBlankObject());
    this.listLength = this.value.length;
  }

  clone(obj: any): any {
    return structuredClone(obj);
  }

  cloneBlankObject() {
    let clone = structuredClone(this.blankObject);
    if(this.blankObjectType === 'object')
      Object.setPrototypeOf(clone, this.blankObject);
    return clone;
  }

  remove(index: number): void {
    this.value.splice(index, 1);
  }

  removeWithWarning(index: number): void {
    let dialog = this.dialogUtils.matDialog.open(ConfirmDialog, {
      data: {
        title: 'Confirm delete',
        message: 'Are you sure you want to delete this item?',
        no: 'Cancel',
        yes: 'Delete'
      }
    })

    dialog.afterClosed().subscribe(result => {
      if(result)
        this.remove(index);
    })
  }

  reachMaxSize(): boolean {
    return this.value.length >= this.maxSize;
  }

  getKeyAndValueList(obj: Object) {
    let list = [];
    for (const [key, value] of Object.entries(obj)) {
      if(!Array.isArray(value) && typeof value !== 'object')
        list.push([key, value])
    }
    return list;
  }

  updateBlankObjectType() {
    if(Array.isArray(this.blankObject)) {
      if(this.blankObject.length > 0)
        this.blankObject = this.blankObject[0];
      this.blankObjectType = typeof this.blankObject;
    }
    else if(typeof this.blankObject === 'object')
      this.blankObjectType = 'object';
    else
      this.blankObjectType = typeof this.blankObject;
  }

  drop(event: CdkDragDrop<any[]>) {
    moveItemInArray(this.value, event.previousIndex, event.currentIndex);
  }

  getFocusOutAutoFillFn(index: number) {
    if(this.focusOutAutoFillFn)
      return (value: any) => this.focusOutAutoFillFn!(value, index);
    else
      return undefined;
  }
}


