import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Link, Wrap } from '../../model/wrap.model';

@Component({
  selector: 'app-wrap-link-dialog',
  templateUrl: './wrap-link-dialog.component.html',
  styleUrls: ['./wrap-link-dialog.component.scss']
})
export class WrapLinkDialog implements OnInit {

  wrap!: Wrap;
  blankObject: Wrap = new Wrap();
  statusUrlMap?: Map<string, number>;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {wrap: Wrap, statusUrlMap?: Map<string, number>}
  ) { 
    this.wrap = this.data.wrap;
    this.statusUrlMap = this.data.statusUrlMap;
  }

  ngOnInit() {
  }

  openLink(link: Link) {
    window.open(link.serviceUrl);
  }

  getToolTip(link: Link) {
    if(this.statusUrlMap) {
      return `${this.statusUrlMap.get(link.statusCheckUrl) || ''} ${link.serviceUrl}`
    }
    else {
      return link.serviceUrl;
    }
  }

}
