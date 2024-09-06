import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss']
})
export class ConfirmDialog implements OnInit {

  yes: string = 'Yes';
  no: string = 'No';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {title: string, message: string, yes?: string, no?: string}
    ) { }

  ngOnInit() 
  {
    if(this.data.yes)
      this.yes = this.data.yes;

    if(this.data.no || this.data.no === '')
      this.no = this.data.no;
  }

}
