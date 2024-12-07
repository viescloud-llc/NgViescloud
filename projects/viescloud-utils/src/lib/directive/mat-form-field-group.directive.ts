import { AfterContentChecked, AfterContentInit, AfterViewChecked, AfterViewInit, ChangeDetectorRef, ContentChild, ContentChildren, Directive, DoCheck, EventEmitter, Input, OnDestroy, Output, QueryList, ViewChild, ViewChildren, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { MatFormFieldComponent } from '../util-component/mat-form-field/mat-form-field.component';
import { MatButton } from '@angular/material/button';

@Directive({
  selector: '[appMatFormFieldGroup]'
})
export class MatFormFieldGroupDirective implements AfterContentInit, AfterContentChecked, OnDestroy {

  @Output()
  onAllInputCheck: EventEmitter<boolean> = new EventEmitter();

  @Output()
  onFormSummit: EventEmitter<void> = new EventEmitter();

  @Input()
  formSummitClick?: HTMLButtonElement | MatButton;

  @ContentChildren(MatFormFieldComponent, { descendants: true })
  matFormFields!: QueryList<MatFormFieldComponent>;

  subscriptions: Subscription[] = []

  constructor() {
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(e => {
      e.unsubscribe();
    })
  }

  ngAfterContentChecked(): void {
    this.validateAllInput();
  }

  ngAfterContentInit(): void {
    this.subscriptions = [];

    this.matFormFields.forEach(e => {
      this.subscriptions.push(
        e.onEnter.subscribe(
          res => {
            this.onFormSummit.emit()
            if(this.formSummitClick && !this.formSummitClick.disabled) {
              if(this.formSummitClick instanceof HTMLButtonElement)
                this.formSummitClick.click();
              else
                this.formSummitClick._elementRef.nativeElement.click();
            }
          }
        )
      )
    })
  }

  validateAllInput(): boolean {
    let valid = true;

    if(this.matFormFields) {
      this.matFormFields.forEach(e => {
        if (!valid)
          return;

        valid = e.isValidInput();
      });
    }

    this.onAllInputCheck.emit(valid);
    return valid;
  }

  emitAllvalueChange(): void {
    if(this.matFormFields) {
      this.matFormFields.forEach(e => {
        e.emitValue();
      });
    }
  }
}
