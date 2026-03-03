import { Component, computed, forwardRef, inject, Inject, input, linkedSignal, Optional, output, signal } from '@angular/core';
import { MatFormFieldComponent } from '../mat-form-field/mat-form-field.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ReflectionUtils } from '../../util/Reflection.utils';

@Component({
  selector: 'app-mat-form-field-form',
  templateUrl: './mat-form-field-form.component.html',
  styleUrls: ['./mat-form-field-form.component.scss'],
  providers: [{ provide: MatFormFieldComponent, useExisting: forwardRef(() => MatFormFieldFormComponent) }],
  standalone: false
})
export class MatFormFieldFormComponent extends MatFormFieldComponent {

  isConfirmDelete = input<boolean>(true);
  _isConfirmDelete = linkedSignal(() => this.isConfirmDelete());

  isConfirmRevert = input<boolean>(false);
  _isConfirmRevert = linkedSignal(() => this.isConfirmRevert());

  isConfirmSave = input<boolean>(false);
  _isConfirmSave = linkedSignal(() => this.isConfirmSave());

  saveLabel = input<string>('Save');
  _saveLabel = linkedSignal(() => this.saveLabel());

  revertLabel = input<string>('Revert');
  _revertLabel = linkedSignal(() => this.revertLabel());

  removeLabel = input<string>('Delete');
  _removeLabel = linkedSignal(() => this.removeLabel());

  onDelete = output<void>();
  onRevert = output<void>();
  onSave = output<void>();

  //dialog
  isDialog = signal(false);
  dialogTitle = signal<string>('');
  dialogWidth = signal<string>('99%');
  dialogYes = computed(() => this._saveLabel());
  dialogNo = signal<string>('no');

  @Optional()
  @Inject(MAT_DIALOG_DATA) 
  dialogData?: any;
  dialogRef?: MatDialogRef<MatFormFieldFormComponent> = inject(MatDialogRef<MatFormFieldFormComponent>, { optional: true }) ?? undefined;
  
  override ngOnInit(): void {
    super.ngOnInit();

    if(this.dialogData) {
      this.isDialog.set(true);
      this.dialogData.value ? this.value = this.dialogData.value : undefined;
      this.dialogData.blankValue ? this.blankObject = this.dialogData.blankValue : undefined;
      this.dialogData.title ? this.dialogTitle.set(this.dialogData.title) : undefined;
      this.dialogData.width ? this.dialogWidth.set(this.dialogData.width) : undefined;
      this.dialogData.yes ? this._saveLabel.set(this.dialogData.yes) : undefined;
      this.dialogData.no ? this.dialogNo.set(this.dialogData.no) : undefined;
      ReflectionUtils.syncDialogData(this, this.dialogData);    
    }

    this.value = structuredClone(this.value);
  }

  save(): void {
    if(this._isConfirmSave()) {
      this.dialogUtils.openConfirmDialog("Save", "Are you sure you want to save?", "Yes", "No").then(res => {
        if(res) {
          this.valueChange.emit(this.value);
          this.valueCopy = structuredClone(this.value);
          this.onSave.emit();
        }
      });
    }
    else {
      this.valueChange.emit(this.value);
      this.valueCopy = structuredClone(this.value);
      this.onSave.emit();
    }
  }
  revert(): void {
    if(this._isConfirmRevert()) {
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
    if(this._isConfirmDelete()) {
      this.dialogUtils.openConfirmDialog("Delete", "Are you sure you want to delete?", "Yes", "No").then(res => {
        if(res) {
          this.onDelete.emit();
        }
      });
    }
    else {
      this.onDelete.emit();
    }
  }

  cancel() {
    if(this.isDialog() && this.dialogRef) {
      this.dialogRef.close();
    }
  }
}
