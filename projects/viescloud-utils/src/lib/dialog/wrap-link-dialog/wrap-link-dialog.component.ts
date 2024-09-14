import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Link, Wrap } from '../../model/Wrap.model';

@Component({
  selector: 'app-wrap-link-dialog',
  templateUrl: './wrap-link-dialog.component.html',
  styleUrls: ['./wrap-link-dialog.component.scss']
})
export class WrapLinkDialog implements OnInit {

  wrap!: Wrap;
  blankObject: Wrap = new Wrap();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {wrap: Wrap}
  ) { 
    this.wrap = this.data.wrap;
  }

  ngOnInit() {
  }

  openLink(link: Link) {
    window.open(link.serviceUrl);
  }

}
