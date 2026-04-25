import { Component, EventEmitter, Input, Output, forwardRef, signal } from '@angular/core';
import { MatFormFieldComponent } from '../mat-form-field/mat-form-field.component';
import { ConfirmDialog } from '../../dialog/confirm-dialog/confirm-dialog.component';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-mat-form-field-input-list',
  templateUrl: './mat-form-field-input-list.component.html',
  styleUrls: ['./mat-form-field-input-list.component.scss'],
  providers: [{provide: MatFormFieldComponent, useExisting: forwardRef(() => MatFormFieldInputListComponent)}],
  standalone: false
})
export class MatFormFieldInputListComponent extends MatFormFieldComponent {

  @Input()
  declare value: any[];
  declare valueCopy: any[];

  @Output()
  override valueChange: EventEmitter<any[]> = new EventEmitter();

  listLength = signal<number>(0);

  validForm = signal(false);

  @Output()
  expandedChange: EventEmitter<boolean> = new EventEmitter<boolean>();

  override ngOnInit() {
    super.ngOnInit();

    if(this.getInputValue(this.inputKeys.readonly)) {
      this.setInputValue(this.inputKeys.showSizeInput, false);
      this.setInputValue(this.inputKeys.showRemoveItemButton, false);
      this.setInputValue(this.inputKeys.showAddItemButton, false);
      this.setInputValue(this.inputKeys.showDragAndDropButton, false);
      this.validForm.set(true);
    }

    this.listLength.set(this.value.length);
    this.updateBlankObjectType();
  }

  override isValidInput(): boolean {
    let superCheck = super.isValidInput();
    if(!superCheck)
      return superCheck;
    else if(this.value.length < this.getInputValue(this.inputKeys.minSize))
      return false;
    else
      return this.validForm();
  }

  updateListLength(length: number) {
    if(length > this.getInputValue(this.inputKeys.maxSize) || this.reachMaxSize()) {
      this.listLength.set(this.getInputValue(this.inputKeys.maxSize));
      length = this.getInputValue(this.inputKeys.maxSize);
    }

    this.listLength.set(length);

    while(this.value.length < this.listLength()) {
      this.value.push(this.cloneBlankObject());
    }

    while(this.value.length > this.listLength()) {
      let deleteSize = this.value.length - this.listLength()
      this.value.splice(this.listLength() - 1, deleteSize);
    }

    this.listLength.set(this.value.length);
  }

  addNewItem() {
    if(!this.reachMaxSize()) {
      this.value.push(this.cloneBlankObject());
    }
    this.listLength.set(this.value.length);
    // this.valueChange.emit(this.getValue());
    this.emitValue();
  }

  clone(obj: any): any {
    return structuredClone(obj);
  }

  cloneBlankObject() {
    let clone = structuredClone(this.blankObject);
    if(this.updateBlankObjectType() === 'object') {
      Object.setPrototypeOf(clone, this.blankObject);
    }
    return clone;
  }

  remove(index: number): void {
    this.value.splice(index, 1);
    this.value=[...this.value];
    this.valueChange.emit(this.value);
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
    return this.value.length >= this.getInputValue(this.inputKeys.maxSize);
  }

  getKeyAndValueList(obj: Object) {
    let list = [];
    for (const [key, value] of Object.entries(obj)) {
      if(!Array.isArray(value) && typeof value !== 'object')
        list.push([key, value])
    }
    return list;
  }

  drop(event: CdkDragDrop<any[]>) {
    moveItemInArray(this.value, event.previousIndex, event.currentIndex);
  }

  getFocusOutAutoFillFn(index: number) {
    if(this.getInputValue(this.inputKeys.listFocusOutAutoFillFn))
      return (value: any) => this.getInputValue(this.inputKeys.listFocusOutAutoFillFn)!(value, index);
    else
      return undefined;
  }
}


