import { Component, EventEmitter, forwardRef, input } from '@angular/core';
import { MatFormFieldComponent } from '../mat-form-field/mat-form-field.component';

@Component({
  selector: 'app-mat-form-field-form',
  templateUrl: './mat-form-field-form.component.html',
  styleUrls: ['./mat-form-field-form.component.scss'],
  providers: [{ provide: MatFormFieldComponent, useExisting: forwardRef(() => MatFormFieldFormComponent) }],
  standalone: false
})
export class MatFormFieldFormComponent extends MatFormFieldComponent {

  saveLabel = input<string>('Save');
  revertLabel = input<string>('Revert');
  removeLabel = input<string>('Delete');

  onDelete: EventEmitter<void> = new EventEmitter<void>();
  onRevert: EventEmitter<void> = new EventEmitter<void>();
  onSave: EventEmitter<void> = new EventEmitter<void>();

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
