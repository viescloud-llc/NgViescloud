import { AfterContentChecked, AfterContentInit, AfterViewChecked, AfterViewInit, ChangeDetectorRef, ContentChild, ContentChildren, Directive, DoCheck, EventEmitter, HostListener, Input, OnDestroy, Output, QueryList, ViewChild, ViewChildren, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { MatFormFieldComponent } from '../util-component/mat-form-field/mat-form-field.component';
import { MatButton } from '@angular/material/button';

@Directive({
  selector: '[appMatFormFieldGroup]',
  standalone: false
})
export class MatFormFieldGroupDirective implements AfterContentInit, AfterContentChecked, OnDestroy {

  @Output()
  onAllInputCheck: EventEmitter<boolean> = new EventEmitter();

  @Output()
  onFormSummit: EventEmitter<void> = new EventEmitter();

  @Input()
  formSummitButton?: HTMLButtonElement | MatButton;

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
            if(this.formSummitButton && !this.formSummitButton.disabled) {
              if(this.formSummitButton instanceof HTMLButtonElement)
                this.formSummitButton.click();
              else
                this.formSummitButton._elementRef.nativeElement.click();
            }
          }
        )
      )
    })
  }

  /**
   * Ctrl+S / Cmd+S saves the form when a `formSummitButton` is bound — the
   * keyboard twin of the enter-to-submit behavior above. preventDefault always
   * fires (even when the button is disabled) so the browser's save-page dialog
   * never appears while an editor group is on screen.
   */
  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(event: KeyboardEvent): void {
    if (!this.formSummitButton) return;
    if (!(event.ctrlKey || event.metaKey) || (event.key !== 's' && event.key !== 'S')) return;
    event.preventDefault();
    if (this.formSummitButton.disabled) return;
    if (this.formSummitButton instanceof HTMLButtonElement)
      this.formSummitButton.click();
    else
      this.formSummitButton._elementRef.nativeElement.click();
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
