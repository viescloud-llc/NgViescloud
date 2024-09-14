import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { WrapDialog } from 'projects/viescloud-utils/src/lib/dialog/wrap-dialog/wrap-dialog.component';
import { Wrap } from 'projects/viescloud-utils/src/lib/model/Wrap.model';

@Component({
  selector: 'app-wrap-plus-button',
  templateUrl: './wrap-plus-button.component.html',
  styleUrls: ['./wrap-plus-button.component.scss']
})
export class WrapPlusButtonComponent implements OnInit {

  @Output()
  onNewWrap: EventEmitter<Wrap> = new EventEmitter();

  constructor(
    private matDialog: MatDialog
  ) { }

  ngOnInit() {

  }

  openDialog() {
    let wrap = new Wrap();
    let dialog = this.matDialog.open(WrapDialog, {
      data: {
        wrap: wrap,
        title: 'Add new Wrap'
      },
      width: '100%'
    })

    dialog.afterClosed().subscribe(result => {
      if(result) {
        this.onNewWrap.emit(result);
      }
    })
  }

}