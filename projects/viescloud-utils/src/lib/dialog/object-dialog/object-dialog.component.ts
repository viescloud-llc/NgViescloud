import { AfterViewChecked, ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface ObjectDialogData<T = object, S = object> {
  id: any, 
  service: S,
  title?: string, 
  getFn: (service: S, id: any) => Promise<T> | T, 
  createFn?: (service: S, value: T) => Promise<T>, 
  modifyFn?: (service: S, value: T) => Promise<T>,
  blankObject?: T;
}

@Component({
  selector: 'app-object-dialog',
  templateUrl: './object-dialog.component.html',
  styleUrls: ['./object-dialog.component.scss']
})
export class ObjectDialog<T = object, S = object> implements OnInit, AfterViewChecked {

  value!: T;
  valueCopy!: T;

  validForm: boolean = false;

  error: string = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ObjectDialogData<T, S>,
    private dialogRef: MatDialogRef<ObjectDialog>,
    private cd: ChangeDetectorRef
  ) { }

  async ngOnInit() {
    await this.init();
  }

  async init() {
    let result = await this.data.getFn(this.data.service, this.data.id);
    if(result) {
      this.value = result;
      this.valueCopy = structuredClone(result);
    }
    else {
      window.alert("We are experiencing technical difficulty at the moment please try again latter")
      this.closeDialog(null);
    }
  }

  getModifyLabel(): string {
    return !this.data.id && this.data.createFn ? 'Create' : 'Modify';
  }

  ngAfterViewChecked(): void {
    this.cd.detectChanges();
  }

  closeDialog(result: any): void {
    this.dialogRef.close(result);
  }

  triggerItemEvent() {
    if(!this.data.id && this.data.createFn) {
      this.data.createFn(this.data.service, this.value)
      .then(r => this.closeDialog(r))
      .catch(e => this.error = e.error.reason ?? "An unexpected error has occurred");
    }
    else if(this.data.modifyFn) {
      this.data.modifyFn(this.data.service, this.value)
      .then(r => this.closeDialog(r))
      .catch(e => this.error = e.error.reason ?? "An unexpected error has occurred");
    }
    else
      throw new Error("no modify or create function is available");
  }

  isValueChange() {
    return JSON.stringify(this.value) !== JSON.stringify(this.valueCopy);
  }

  revert() {
    this.value = structuredClone(this.valueCopy);
  }

  getTitle(): string {
    return this.data.title ?? 'ID: ' + this.data.id;
  }
}
