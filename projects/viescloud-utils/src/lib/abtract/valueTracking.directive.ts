import { Directive, EventEmitter, Input, Output } from "@angular/core";
import { TrackByIndex } from "./TrackByIndex";
import { FixChangeDetection } from "./FixChangeDetection";
import { DataUtils } from "../util/Data.utils";
import { UtilsService } from "../service/utils.service";
import { RgbColor } from "../model/rgb.model";

type Value<T> = T | null | undefined;

@Directive({
    selector: '[valueTracking]',
    standalone: false
})
export class ValueTracking<T> extends FixChangeDetection implements TrackByIndex {

    @Input()
    value: Value<T>;
    valueCopy: T | null | undefined;

    @Output()
    valueChange = new EventEmitter<T>();

    public updateValue(value?: Value<T>) {
        if(value) {
            this.value = value;
            this.valueCopy = structuredClone(value);
        }
        else {
            this.value = structuredClone(this.value);
            this.valueCopy = structuredClone(this.value);
        }
    }

    public trackByIndex(index: number, obj: any): any {
        return index;
    }

    public isValueChange() {
        return DataUtils.isNotEqual(this.value, this.valueCopy);
    }

    public isValueNotChange() {
        return DataUtils.isEqual(this.value, this.valueCopy);
    }

    public isValueEnum(): boolean {
        return UtilsService.isEnum(this.value);
    }

    public isValueString(): boolean {
        return typeof this.value === 'string';
    }

    public isValueMultipleStringLine(): boolean {
        return typeof this.value === 'string' && this.value.includes("\n");
    }

    public isValueNonMultipleStringLine(): boolean {
        return typeof this.value === 'string' && !this.value.includes("\n");
    }

    public isValueNumber(): boolean {
        return typeof this.value === 'number';
    }

    public isValueBoolean(): boolean {
        return typeof this.value === 'boolean';
    }

    public resetValue(): void {
        this.value = structuredClone(this.valueCopy);
    }

    public isValueArray(): boolean {
        return Array.isArray(this.value);
    }

    public isValueObject(): boolean {
        return typeof this.value === 'object';
    }

    public isValuePrimitive(): boolean {
        if (this.isValueArray() || this.isValueObject())
            return false;
        else
            return true;
    }
}