import { AfterContentInit, AfterViewInit, ChangeDetectorRef, computed, Directive, effect, inject, model, OnInit, WritableSignal } from "@angular/core";
import { DialogUtils } from "../util/Dialog.utils";
import { RxJSUtils } from "../util/RxJS.utils";
import { ViesMatFormFieldMap } from "./ViesMatFormFieldMap";
import { ViesRestService } from "../service/rest.service";
import { ValueTracking } from "./valueTracking.directive";
import { DataUtils } from "../util/Data.utils";

@Directive({
  selector: '[ViesRestApi]',
  standalone: false,
})
export abstract class ViesRestApi<T extends Object | object, S extends ViesRestService<T>> extends ViesMatFormFieldMap implements OnInit, AfterContentInit, AfterViewInit {

    readonly rxjsUtils = inject(RxJSUtils);
    readonly dialogUtils = inject(DialogUtils);
    readonly cd: ChangeDetectorRef = inject(ChangeDetectorRef);

    value = model<T>();
    _value: ValueTracking<T | undefined> = ValueTracking.track<T | undefined>(this.value);
    blankValue!: T;

    id = computed(() => {
        return this._value && this._value.value() ? this.service.getIdFieldValue(this._value.value()!) : undefined;
    });

    constructor() {
        super();
    }

    abstract service: S;
    abstract getRouteId(): string | number | null | undefined;

    ngOnInit(): void {
        this.blankValue = this.service.newBlankObject();
        if(!this.value()) {
            this.value.set(DataUtils.purgeArray(this.service.newBlankObject()));
        }

        let id = this.getRouteId();
        if(!this.id() && id) {
            this.service.get(id).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
                next: res => {
                    this._value.set(res);
                },
                error: err => {
                    this.dialogUtils.openErrorMessageFromError(err);
                }
            })
        }
    }

    ngAfterContentInit(): void {

    }

    ngAfterContentChecked(): void {
        // this.cd.detectChanges();
    }

    ngAfterViewInit(): void {

    }
    
    save() {
        if(this.id() && this._value && this._value.value()) {
            this.service.put(this.id(), this._value.value()!).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
                next: res => {
                    this._value.set(res);
                },
                error: err => {
                    this.dialogUtils.openErrorMessageFromError(err);
                }
            })
            }
            else {
            this.service.post(this._value.value()!).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
                next: res => {
                    this._value.set(res);
                },
                error: err => {
                    this.dialogUtils.openErrorMessageFromError(err);
                }
            });
        }
    }   

    revert() {
        this._value.revert();
    }
} 