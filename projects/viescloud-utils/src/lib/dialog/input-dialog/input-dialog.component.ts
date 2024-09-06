import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-input-dialog',
  templateUrl: './input-dialog.component.html',
  styleUrls: ['./input-dialog.component.scss']
})
export class InputDialog implements OnInit {

  yes: string = 'Save';
  no: string = 'Cancel';
  input: string = '';
  label: string = 'Input';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { title: string, label?: string, yes?: string, no?: string, multipleLine: boolean, input?: string }
  ) { }

  ngOnInit() {
    if (this.data.yes)
      this.yes = this.data.yes;

    if (this.data.no || this.data.no === '')
      this.no = this.data.no;

    if(this.data.input)
      this.input = this.data.input;

    this.label = this.data.label ?? 'Input';
  }

  getWidth(): number {
    if (this.input.length < 20)
      return 20;
    else
      return this.input.length;
  }

}
