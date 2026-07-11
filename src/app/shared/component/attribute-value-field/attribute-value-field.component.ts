import { Component, computed, EventEmitter, Input, Output, signal, SimpleChanges } from '@angular/core';
import { NgComponentModule } from '../../../../lib/module/ng-component.module';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FormsModule } from '@angular/forms';
import { MatOption } from '../../../../lib/model/mat.model';
import { ViesDate, ViesDateTime, ViesTime } from '../../../../lib/model/vies.model';
import { ViesMatFormFieldMap } from '../../../../lib/abtract/ViesMatFormFieldMap';
import { DataUtils } from '../../../../lib/util/Data.utils';
import { AttributeDefinition, AttributeOption, AttributeValue, ProductAttributeType } from '../../model/attribute.model';

// The central polymorphic editor for AttributeValue, called out as a foundational
// reusable in `frontend-manager.md` § 7.2.
//
// Given an `AttributeDefinition`, it dispatches to the right lib primitive based on
// `definition.type`, binds to the matching slot in `AttributeValue`, and on every
// emit it ALWAYS produces a fresh AttributeValue with ONLY that slot populated —
// every other slot is undefined. This is the contract that prevents stale slot
// values from leaking back to the backend (the spec has no server-side validation
// for slot/type mismatch — § 4.2 of the backend spec).
//
// Usage:
//   <app-attribute-value-field
//     [definition]="def"
//     [value]="entity.attributeValue"
//     (valueChange)="entity.attributeValue = $event">
//   </app-attribute-value-field>
//
// Lives in src/app/shared/component/ rather than src/lib/ because the
// AttributeDefinition / AttributeValue / AttributeOption types are Venzora-specific.
// The underlying form primitives ARE in lib and do the heavy lifting.
@Component({
  selector: 'app-attribute-value-field',
  templateUrl: './attribute-value-field.component.html',
  styleUrls: ['./attribute-value-field.component.scss'],
  imports: [NgComponentModule, MatSlideToggleModule, FormsModule]
})
export class AttributeValueFieldComponent extends ViesMatFormFieldMap {

  @Input({ required: true }) definition!: AttributeDefinition;
  @Input() value: AttributeValue = new AttributeValue();

  @Output() valueChange = new EventEmitter<AttributeValue>();
  @Output() onValueChange = new EventEmitter<void>();

  // Expose enum to template.
  readonly Type = ProductAttributeType;

  // The view binds these via [(ngModel)] / [(value)] depending on the primitive.
  // We hold a working copy per-slot rather than reading from `this.value` directly so
  // the template stays simple and Angular CD doesn't have to compute `value?.textValue`
  // on every check.
  textCopy = signal<string>('');
  numberCopy = signal<string>('');
  booleanCopy = signal<boolean>(false);
  selectCopy = signal<AttributeOption | undefined>(undefined);
  multiSelectCopy = signal<AttributeOption[]>([]);
  dateTimeCopy = signal<ViesDateTime>(new ViesDateTime());

  // For SELECT / MULTI_SELECT, map AttributeOption[] → MatOption<AttributeOption>[]
  // for the lib's option/list-option primitives.
  matOptions = computed<MatOption<AttributeOption>[]>(() =>
    (this.definition.options ?? []).map(opt => ({
      value: opt,
      valueLabel: opt.displayValue || opt.value
    }))
  );

  // Pretty label: fall back to `name` if no displayName.
  label = computed<string>(() => this.definition.displayName || this.definition.name || '');

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value'] || changes['definition']) {
      this.syncFromValue();
    }
  }

  ngOnInit(): void {
    this.syncFromValue();
  }

  // Pull whatever's in the matching slot into the working copy so the right control
  // renders pre-populated. Other slots are intentionally ignored — they'll be cleared
  // on the next emit anyway.
  private syncFromValue(): void {
    const v = this.value ?? DataUtils.purgeValue(new AttributeValue());
    const type = this.definition.type;

    switch (type) {
      case ProductAttributeType.TEXT:
        this.textCopy.set(v.textValue ?? '');
        break;
      case ProductAttributeType.NUMBER:
        this.numberCopy.set(v.numberValue ?? '');
        break;
      case ProductAttributeType.BOOLEAN:
        this.booleanCopy.set(v.booleanValue ?? false);
        break;
      case ProductAttributeType.SELECT:
        this.selectCopy.set(v.selectValue);
        break;
      case ProductAttributeType.MULTI_SELECT:
        this.multiSelectCopy.set(v.multiSelectValues ?? []);
        break;
      case ProductAttributeType.DATE:
        this.dateTimeCopy.set(this.dateToDateTime(v.dateValue));
        break;
      case ProductAttributeType.TIME:
        this.dateTimeCopy.set(this.timeToDateTime(v.timeValue));
        break;
      case ProductAttributeType.DATE_TIME:
        this.dateTimeCopy.set(v.dateTimeValue ?? new ViesDateTime());
        break;
    }
  }

  // Emit a fresh AttributeValue with ONLY the matching slot populated. This is the
  // single chokepoint that enforces the "clear the other slots before write" rule.
  private emitSlot(slot: keyof AttributeValue, slotValue: any): void {
    const next = DataUtils.purgeValue(new AttributeValue());
    (next as any)[slot] = slotValue;
    this.value = next;
    this.valueChange.emit(next);
    this.onValueChange.emit();
  }

  onTextChange(v: string): void {
    this.textCopy.set(v ?? '');
    this.emitSlot('textValue', v ?? '');
  }

  onNumberChange(v: string | number): void {
    // BigDecimal-as-string convention; coerce numeric input to string defensively.
    const s = v === null || v === undefined ? '' : String(v);
    this.numberCopy.set(s);
    this.emitSlot('numberValue', s);
  }

  onBooleanChange(v: boolean): void {
    this.booleanCopy.set(!!v);
    this.emitSlot('booleanValue', !!v);
  }

  onSelectChange(opt: AttributeOption | undefined): void {
    this.selectCopy.set(opt);
    this.emitSlot('selectValue', opt);
  }

  onMultiSelectChange(opts: AttributeOption[]): void {
    const arr = opts ?? [];
    this.multiSelectCopy.set(arr);
    this.emitSlot('multiSelectValues', arr);
  }

  onDateChange(dt: ViesDateTime): void {
    this.dateTimeCopy.set(dt ?? new ViesDateTime());
    this.emitSlot('dateValue', this.dateTimeToDate(dt));
  }

  onTimeChange(dt: ViesDateTime): void {
    this.dateTimeCopy.set(dt ?? new ViesDateTime());
    this.emitSlot('timeValue', this.dateTimeToTime(dt));
  }

  onDateTimeChange(dt: ViesDateTime): void {
    this.dateTimeCopy.set(dt ?? new ViesDateTime());
    this.emitSlot('dateTimeValue', dt);
  }

  // ---- Conversion helpers between the polymorphic slot types and ViesDateTime ----
  // The lib's date/time picker is ViesDateTime-only; for the DATE and TIME slots we
  // round-trip the relevant fields.

  private dateToDateTime(d?: ViesDate): ViesDateTime {
    const dt = new ViesDateTime();
    if (d) {
      dt.year = d.year;
      dt.month = d.month;
      dt.day = d.day;
      dt.zoneId = d.zoneId;
    }
    return dt;
  }

  private timeToDateTime(t?: ViesTime): ViesDateTime {
    const dt = new ViesDateTime();
    if (t) {
      dt.hour = t.hour;
      dt.minute = t.minute;
      dt.second = t.second;
      dt.millis = t.millis;
      dt.zoneId = t.zoneId;
    }
    return dt;
  }

  private dateTimeToDate(dt?: ViesDateTime): ViesDate {
    const d = new ViesDate();
    if (dt) {
      d.year = dt.year;
      d.month = dt.month;
      d.day = dt.day;
      d.zoneId = dt.zoneId;
    }
    return d;
  }

  private dateTimeToTime(dt?: ViesDateTime): ViesTime {
    const t = new ViesTime();
    if (dt) {
      t.hour = dt.hour;
      t.minute = dt.minute;
      t.second = dt.second;
      t.millis = dt.millis;
      t.zoneId = dt.zoneId;
    }
    return t;
  }
}
