import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-copy-to-clipboard-util',
  templateUrl: './copy-to-clipboard-util.component.html',
  styleUrls: ['./copy-to-clipboard-util.component.scss']
})
export class CopyToClipboardUtilComponent implements OnInit {

  @Input()
  copyValue: string = '';

  @Input()
  displayMessage: string = '';

  @Input()
  matIcon: string = 'file_copy'

  constructor() { }

  ngOnInit() {
  }

}
