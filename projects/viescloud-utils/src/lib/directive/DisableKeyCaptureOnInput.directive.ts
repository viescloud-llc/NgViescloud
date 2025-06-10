import { Directive, ElementRef, HostListener, OnDestroy } from '@angular/core';
import { KeyCaptureService } from '../service/key-capture.service';

@Directive({
  selector: '[appDisableKeyCaptureOnInput]'
})
export class DisableKeyCaptureOnInputDirective implements OnDestroy {

  constructor(private el: ElementRef, private keyCaptureService: KeyCaptureService) {}

  // Listen for focus on input elements
  @HostListener('focusin', ['$event'])
  onFocus(event: FocusEvent) {
    if (this.isInputElement(event.target as HTMLElement)) {
      this.keyCaptureService.disableCapture();
    }
  }

  // Listen for blur event to re-enable key capture when focus leaves the input
  @HostListener('focusout', ['$event'])
  onBlur(event: FocusEvent) {
    if (this.isInputElement(event.target as HTMLElement)) {
      this.keyCaptureService.enableCapture();
    }
  }

  // Helper method to determine if the target is an input element
  private isInputElement(target: HTMLElement): boolean {
    return (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.hasAttribute('contenteditable') ||
      target.tagName === 'SELECT'
    );
  }

  ngOnDestroy() {
    // Ensure key capturing is enabled when the directive is destroyed
    this.keyCaptureService.enableCapture();
  }
}
