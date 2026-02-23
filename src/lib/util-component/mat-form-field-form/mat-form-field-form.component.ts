import { Component, EventEmitter, forwardRef, inject, Inject, input, signal } from '@angular/core';
import { MatFormFieldComponent } from '../mat-form-field/mat-form-field.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldInputDynamicFormComponent } from '../mat-form-field-input-dynamic-form/mat-form-field-input-dynamic-form.component';

@Component({
  selector: 'app-mat-form-field-form',
  templateUrl: './mat-form-field-form.component.html',
  styleUrls: ['./mat-form-field-form.component.scss'],
  providers: [{ provide: MatFormFieldComponent, useExisting: forwardRef(() => MatFormFieldFormComponent) }],
  standalone: false
})
export class MatFormFieldFormComponent extends MatFormFieldComponent {

  isDialog = signal(false);

  saveLabel = input<string>('Save');
  revertLabel = input<string>('Revert');
  removeLabel = input<string>('Delete');

  onDelete: EventEmitter<void> = new EventEmitter<void>();
  onRevert: EventEmitter<void> = new EventEmitter<void>();
  onSave: EventEmitter<void> = new EventEmitter<void>();

  @Inject(MAT_DIALOG_DATA) dialogData?: any;
  dialogRef?: MatDialogRef<MatFormFieldInputDynamicFormComponent> = inject(MatDialogRef<MatFormFieldInputDynamicFormComponent>);

  override ngOnInit(): void {
    super.ngOnInit();
    this.value = structuredClone(this.value);

    if(this.dialogData) {
      this.isDialog.set(true);
    }
  }

  save(): void {
    this.valueChange.emit(this.value);
    this.valueCopy = structuredClone(this.value);
    this.onSave.emit();
  }
  revert(): void {
    this.value = structuredClone(this.valueCopy);
    this.onRevert.emit();
  }

  remove(): void {
    this.onDelete.emit();
  }
}
