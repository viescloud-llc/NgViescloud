import { AfterContentChecked, ChangeDetectorRef, Directive, inject } from '@angular/core';

@Directive({
  selector: '[appFixChangeDetection]'
})
export class FixChangeDetection implements AfterContentChecked {

  private cd: ChangeDetectorRef = inject(ChangeDetectorRef);

  constructor() { }

  ngAfterContentChecked(): void {
    this.cd.detectChanges();
  }
}
