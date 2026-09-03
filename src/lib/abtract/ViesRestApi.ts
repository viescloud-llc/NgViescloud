import { AfterContentInit, AfterViewInit, ChangeDetectorRef, computed, Directive, effect, inject, input, linkedSignal, model, OnInit, WritableSignal } from "@angular/core";
import { DialogUtils } from "../util/Dialog.utils";
import { RxJSUtils } from "../util/RxJS.utils";
import { ViesMatFormFieldMap } from "./ViesMatFormFieldMap";
import { ViesRestService } from "../service/rest.service";
import { ValueTracking } from "./valueTracking.directive";
import { DataUtils } from "../util/Data.utils";
import { Router } from "@angular/router";

@Directive({
  selector: '[ViesRestApi]',
  standalone: false,
})
export abstract class ViesRestApi<T extends Object | object, S extends ViesRestService<T>> extends ViesMatFormFieldMap implements OnInit, AfterContentInit, AfterViewInit {

    readonly rxjsUtils = inject(RxJSUtils);
    readonly dialogUtils = inject(DialogUtils);
    readonly router = inject(Router);
    readonly cd: ChangeDetectorRef = inject(ChangeDetectorRef);
    readonly deletePrompt = "Are you sure you want to delete this?";

    value = model<T>();
    _value: ValueTracking<T | undefined> = ValueTracking.track<T | undefined>(this.value);

    blankValue!: T;

    routePathAfterDelete = input<string | String>('/home');
    _routePathAfterDelete = linkedSignal(() => this.routePathAfterDelete());

    promptDeleteConfirmation = input<string | String | boolean>(this.deletePrompt);
    _promptDeleteConfirmation = linkedSignal(() => this.promptDeleteConfirmation());

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
                    this.afterSave(res, false);
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
                    this.afterSave(res, true);
                },
                error: err => {
                    this.dialogUtils.openErrorMessageFromError(err);
                }
            });
        }
    }

    /**
     * Called after a successful save. wasCreate is true when the save was a POST (new entity).
     * Default is a no-op; override e.g. to navigate to the created entity's edit URL.
     */
    protected afterSave(res: T, wasCreate: boolean): void {

    }

    revert() {
        this._value.revert();
    }

    async remove() {
        if(this.id()) {
            let confirm: string | boolean = true;
            
            if(this._promptDeleteConfirmation()) {
                let prompt: string = typeof this._promptDeleteConfirmation() === 'string' ? this._promptDeleteConfirmation().toString() : this.deletePrompt;
                confirm = await this.dialogUtils.openConfirmDialog('Delete', prompt, 'Yes', 'Cancel').catch(() => false);      
            }

            if(confirm) {
                this.service.delete(this.id()).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
                    next: res => {
                        this.router.navigate([this._routePathAfterDelete()]);
                    },
                    error: err => {
                        this.dialogUtils.openErrorMessageFromError(err);
                    }
                });
            }
        }
    }

    cancel() {
        this.router.navigate([this._routePathAfterDelete()]);
    }
} 