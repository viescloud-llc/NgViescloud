import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Wrap } from '../../model/Wrap.model';

@Component({
  selector: 'app-wrap-dialog',
  templateUrl: './wrap-dialog.component.html',
  styleUrls: ['./wrap-dialog.component.scss']
})
export class WrapDialog implements OnInit {

  wrap!: Wrap;
  blankObject: Wrap = new Wrap();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {wrap: Wrap, title?: string}
  ) { 
    this.wrap = this.data.wrap;
  }

  ngOnInit() {
  }

}
