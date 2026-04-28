import { Directive, effect, InjectionToken, isWritableSignal, model, Signal, signal, WritableSignal } from "@angular/core";
import { TrackByIndex } from "./TrackByIndex";
import { FixChangeDetection } from "./FixChangeDetection";
import { DataUtils } from "../util/Data.utils";
import { UtilsService } from "../service/utils.service";

// type Value<T> = T | null | undefined;

@Directive({
    selector: '[valueTracking]',
    standalone: false
})
export class ValueTracking<T> extends FixChangeDetection implements TrackByIndex {

    value = model.required<T>()
    valueCopy = signal<T | null | undefined>(null);

    public static track<T>(value: WritableSignal<T> | T) {
        let valueTracking = new ValueTracking<T>();
        valueTracking.updateValue(value);

        effect(() => {
            valueTracking.value.set(DataUtils.getAnyValue(value));
        });

        effect(() => {
            if(value && isWritableSignal(value)) {
                value.set(valueTracking.value());
            }
        });

        return valueTracking;
    }

    public updateValue(value?: Signal<T> | T) {
        this.value.set(DataUtils.getAnyValue(value));
        this.valueCopy.set(structuredClone(DataUtils.getAnyValue(value)));
        return this;
    }

    public trackByIndex(index: number, obj: any): any {
        return index;
    }

    public isValueChange() {
        return DataUtils.isNotEqual(this.value(), this.valueCopy());
    }

    public isValueNotChange() {
        return DataUtils.isEqual(this.value(), this.valueCopy());
    }

    public isValueEnum(): boolean {
        return UtilsService.isEnum(this.value());
    }

    public isValueString(): boolean {
        return typeof this.value() === 'string';
    }

    public isValueMultipleStringLine(): boolean {
        return (typeof this.value() === 'string' && this.value() && this.value()!.toString().includes("\n")) === true;
    }

    public isValueNonMultipleStringLine(): boolean {
        return (typeof this.value() === 'string' && this.value() && !this.value()!.toString().includes("\n")) === true;
    }

    public isValueNumber(): boolean {
        return typeof this.value() === 'number';
    }

    public isValueBoolean(): boolean {
        return typeof this.value() === 'boolean';
    }

    public resetValue(): void {
        this.value.set(structuredClone(this.valueCopy()!));
    }

    public isValueArray(): boolean {
        return Array.isArray(this.value());
    }

    public isValueObject(): boolean {
        return typeof this.value() === 'object';
    }

    public isValuePrimitive(): boolean {
        if (this.isValueArray() || this.isValueObject())
            return false;
        else
            return true;
    }

    public revert() {
        this.value.set(structuredClone(this.valueCopy()!));
    }
}