import { AfterContentChecked, ChangeDetectorRef, Directive, inject } from '@angular/core';

@Directive({
  selector: '[appFixChangeDetection]',
  standalone: false
})
export class FixChangeDetection implements AfterContentChecked {

  protected cd: ChangeDetectorRef = inject(ChangeDetectorRef);

  constructor() { }

  ngAfterContentChecked(): void {
    this.cd.detectChanges();
  }
}
