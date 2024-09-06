import { Directive, HostBinding, HostListener, Input } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import {Clipboard} from '@angular/cdk/clipboard';

@Directive({
  selector: '[appCopyToClipboard]'
})
export class CopyToClipboardDirective 
{

  @Input()
  copyToClipboardValue: any;

  @Input()
  copyMessage: string = '';

  @HostListener('click')
  onClick()
  {
    this.copyNotification(this.copyToClipboardValue);
  }

  constructor(private snackBar: MatSnackBar, private clipBoard: Clipboard) { }

  copyNotification(str: string): void
  {
    let message = this.copyMessage;
    if(!message)
      message = str;
    this.clipBoard.copy(str);
    this.snackBar.open(message + " copied to Clipboard!", 'ok',{
      duration: 1000
    })
  }

}
