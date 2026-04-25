import { Component, computed, forwardRef, inject, Inject, input, linkedSignal, Optional, output, signal } from '@angular/core';
import { MatFormFieldComponent } from '../mat-form-field/mat-form-field.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ReflectionUtils } from '../../util/Reflection.utils';
import { DialogResponse } from '../../model/dialog.model';

@Component({
  selector: 'app-mat-form-field-form',
  templateUrl: './mat-form-field-form.component.html',
  styleUrls: ['./mat-form-field-form.component.scss'],
  providers: [{ provide: MatFormFieldComponent, useExisting: forwardRef(() => MatFormFieldFormComponent) }],
  standalone: false
})
export class MatFormFieldFormComponent extends MatFormFieldComponent {

  onDelete = output<void>();
  onRevert = output<void>();
  onSave = output<void>();

  //dialog
  isDialog = computed(() => this.getInputValue(this.inputKeys.isDialog));
  dialogData?: any;
  dialogRef?: MatDialogRef<MatFormFieldFormComponent> = inject(MatDialogRef<MatFormFieldFormComponent>, { optional: true }) ?? undefined;
  
  constructor(
    @Optional()
    @Inject(MAT_DIALOG_DATA) 
    // public data?: {title: string, message: string, yes?: string, no?: string},
    public data?: any
    ) { 
      super();
      this.dialogData = data;
    }

  override ngOnInit(): void {
    super.ngOnInit();

    if(this.dialogData) {
      this.dialogData.inputMap ? this.inputMap = this.dialogData.inputMap : undefined;
      this.setInputValue(this.inputKeys.isDialog, true);
      this.dialogData.value ? this.value = this.dialogData.value : undefined;
      this.dialogData.blankValue ? this.blankObject = this.dialogData.blankValue : undefined;
    }

    this.value = structuredClone(this.value);
  }

  save(): void {
    if(this.getInputValue(this.inputKeys.isConfirmSave)) {
      this.dialogUtils.openConfirmDialog("Save", "Are you sure you want to save?", "Yes", "No").then(res => {
        if(res) {
          this.valueChange.emit(this.value);
          this.valueCopy = structuredClone(this.value);
          this.onSave.emit();

          if(this.isDialog() && this.dialogRef) {
            this.dialogRef.close(DialogResponse.builder().result(this.value).save().build());
          }
        }
      });
    }
    else {
      this.valueChange.emit(this.value);
      this.valueCopy = structuredClone(this.value);
      this.onSave.emit();

      if(this.isDialog() && this.dialogRef) {
        this.dialogRef.close(DialogResponse.builder().result(this.value).save().build());
      }
    }
  }
  revert(): void {
    if(this.getInputValue(this.inputKeys.isConfirmRevert)) {
      this.dialogUtils.openConfirmDialog("Revert", "Are you sure you want to revert?", "Yes", "No").then(res => {
        if(res) {
          this.value = structuredClone(this.valueCopy);
          this.onRevert.emit();
        }
      });
    }
    else {
      this.value = structuredClone(this.valueCopy);
      this.onRevert.emit();
    }
  }

  remove(): void {
    if(this.getInputValue(this.inputKeys.isConfirmDelete)) {
      this.dialogUtils.openConfirmDialog("Delete", "Are you sure you want to delete?", "Yes", "No").then(res => {
        if(res) {
          this.onDelete.emit();

          if(this.isDialog() && this.dialogRef) {
            this.dialogRef.close(DialogResponse.builder().remove().build());
          }
        }
      });
    }
    else {
      this.onDelete.emit();

      if(this.isDialog() && this.dialogRef) {
        this.dialogRef.close(DialogResponse.builder().remove().build());
      }
    }
  }

  cancel() {
    if(this.isDialog() && this.dialogRef) {
      this.dialogRef.close(DialogResponse.builder().cancel().build());
    }
  }
}
