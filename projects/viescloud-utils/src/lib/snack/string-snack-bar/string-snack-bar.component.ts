import { Component, Inject, OnInit } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';
import { UtilsService } from '../../service/Utils.service';

@Component({
  selector: 'app-string-snack-bar',
  templateUrl: './string-snack-bar.component.html',
  styleUrls: ['./string-snack-bar.component.scss']
})
export class StringSnackBar {

  fullMessage: string;
  truncatedMessage: string;
  dismissLabel: string = '';
  viewFullOnHover: boolean = false;
  isHovered: boolean = false;

  constructor(
    private snackBarRef: MatSnackBarRef<StringSnackBar>,
    @Inject(MAT_SNACK_BAR_DATA) public data: { message: string , maxLength?: number, dismissLabel?: string, viewFullOnHover?: boolean}) {
    this.fullMessage = data.message;
    this.truncatedMessage = data.maxLength ? UtilsService.getMaxString(data.message, data.maxLength) : data.message;
    this.dismissLabel = data.dismissLabel ?? '';
    this.viewFullOnHover = data.viewFullOnHover ?? false;
  }

  onDismiss(): void {
    this.snackBarRef.dismiss();
  }
}
