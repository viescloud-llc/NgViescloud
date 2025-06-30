import { Directive, Input, HostBinding } from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';

@Directive({
  selector: '[viescloudTooltip]',
  standalone: false
})
export class TooltipDirective {
  @Input('viescloudTooltip') tooltipText: string = '';
  
  // Automatically apply the multiline class
  @HostBinding('attr.matTooltip') get tooltip() {
    return this.tooltipText;
  }

  @HostBinding('attr.matTooltipClass') get tooltipClassName() {
    return 'tooltip-multiline';
  }
}
