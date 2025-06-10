import { AfterContentInit, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, forwardRef } from '@angular/core';
import { MatFormFieldComponent } from '../mat-form-field/mat-form-field.component';
import { DateTime } from '../../model/mat.model';
import { AuthenticatorService } from '../../service/authenticator.service';
import { ThemePalette } from '@angular/material/core';
import { DialogUtils } from '../../util/Dialog.utils';

export const TYPE = {DATE: 'DATE', TIME: 'TIME', DATE_TIME: 'DATE_TIME'};

@Component({
  selector: 'app-mat-form-field-input-time',
  templateUrl: './mat-form-field-input-time.component.html',
  styleUrls: ['./mat-form-field-input-time.component.scss'],
  providers: [{provide: MatFormFieldComponent, useExisting: forwardRef(() => MatFormFieldInputTimeComponent)}],
})
export class MatFormFieldInputTimeComponent extends MatFormFieldComponent {

  @Input()
  override value!: DateTime;
  override valueCopy!: DateTime;

  @Input()
  toValue!: DateTime;
  toValueCopy!: DateTime;

  startDate?: Date;
  endDate?: Date;

  display: string = '';

  @Input()
  timeWidth = 15;

  @Input()
  timeZone = 'EST';

  @Output()
  override valueChange: EventEmitter<DateTime> = new EventEmitter();

  @Output()
  tovalueChange: EventEmitter<DateTime> = new EventEmitter();

  @Input()
  type: string = TYPE.DATE;

  @Input()
  range: boolean = false;

  constructor(
    private authenticatorSerice: AuthenticatorService,
    protected override cd: ChangeDetectorRef,
    protected override dialogUtils: DialogUtils
  ) {
    super(cd, dialogUtils);
  }

  override ngOnInit() {
    super.ngOnInit();
    if(this.value) {
      this.startDate = new Date();
      this.startDate?.setFullYear(this.value.year!);
      this.startDate?.setMonth(this.value.month! - 1);
      this.startDate?.setDate(this.value.day!);

      if(this.toValue) {
        this.endDate = new Date();
        this.endDate?.setFullYear(this.toValue.year!);
        this.endDate?.setMonth(this.toValue.month! - 1);
        this.endDate?.setDate(this.toValue.day!);
      }
      this.displayDatePicked();
    }
  }

  async now() {
    let time = await this.authenticatorSerice.getTime();
    this.value = time; 
    this.valueCopy = structuredClone(time);
    this.toValue = structuredClone(time);
    this.toValueCopy = structuredClone(time);
  }

  displayDatePicked() {
    if(!this.value)
      return;

    let newDisplay = `${this.value.month}/${this.value.day}/${this.value.year} at ${this.value.hour}:${this.value.minute}:${this.value.second} ${this.timeZone}`;
  
    if(this.range) {
      newDisplay += '\nUntil\n'
      newDisplay += `${this.toValue.month}/${this.toValue.day}/${this.toValue.year} at ${this.toValue.hour}:${this.toValue.minute}:${this.toValue.second} ${this.timeZone}`;
    }

    if(JSON.stringify(newDisplay) !== JSON.stringify(this.display)) {
      this.display = newDisplay;
      this.valueChange.emit(this.value);
      this.tovalueChange.emit(this.toValue);
    }
  }

  async changeStartDate() {
    if(this.value === undefined || this.value === null || this.toValue === undefined || this.toValue === null)
      await this.now();

    this.value.year = this.startDate!.getFullYear();
    this.value.month = this.startDate!.getMonth() + 1;
    this.value.day = this.startDate!.getDate();
    this.displayDatePicked();
  }

  async changeEndDate() {
    if(this.value === undefined || this.value === null || this.toValue === undefined || this.toValue === null)
      await this.now();

    this.toValue.year = this.endDate!.getFullYear();
    this.toValue.month = this.endDate!.getMonth() + 1;
    this.toValue.day = this.endDate!.getDate();
    this.displayDatePicked();
  }
}
