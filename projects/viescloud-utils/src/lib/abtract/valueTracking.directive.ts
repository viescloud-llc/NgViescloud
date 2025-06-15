import { Directive } from "@angular/core";
import { TrackByIndex } from "./TrackByIndex";
import { FixChangeDetection } from "./FixChangeDetection";
import { DataUtils } from "../util/Data.utils";
import { UtilsService } from "../service/utils.service";
import { RgbColor } from "../model/rgb.model";

@Directive({
    selector: '[valueTracking]'
})
export abstract class ValueTracking<T> extends FixChangeDetection implements TrackByIndex {

    value: T | null | undefined;
    valueCopy: T | null | undefined;

    updateValue(value: T) {
        this.value = value;
        this.valueCopy = structuredClone(value);
    }

    trackByIndex(index: number, obj: any): any {
        return index;
    }

    isValueChange() {
        return DataUtils.isNotEqual(this.value, this.valueCopy);
    }

    isValueNotChange() {
        return DataUtils.isEqual(this.value, this.valueCopy);
    }

    isValueEnum(): boolean {
        return UtilsService.isEnum(this.value);
    }

    isValueString(): boolean {
        return typeof this.value === 'string';
    }

    isValueMultipleStringLine(): boolean {
        return typeof this.value === 'string' && this.value.includes("\n");
    }

    isValueNonMultipleStringLine(): boolean {
        return typeof this.value === 'string' && !this.value.includes("\n");
    }

    isValueNumber(): boolean {
        return typeof this.value === 'number';
    }

    isValueBoolean(): boolean {
        return typeof this.value === 'boolean';
    }

    resetValue(): void {
        this.value = structuredClone(this.valueCopy);
    }

    isValueArray(): boolean {
        return Array.isArray(this.value);
    }

    isValueObject(): boolean {
        return typeof this.value === 'object';
    }

    isValuePrimitive(): boolean {
        if (this.isValueArray() || this.isValueObject())
            return false;
        else
            return true;
    }
}