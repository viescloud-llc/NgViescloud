import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { WrapDialog } from 'projects/viescloud-utils/src/lib/dialog/wrap-dialog/wrap-dialog.component';
import { Wrap, WrapType } from 'projects/viescloud-utils/src/lib/model/wrap.model';
import { UtilsService } from 'projects/viescloud-utils/src/lib/service/utils.service';

@Component({
  selector: 'app-wrap-plus-button',
  templateUrl: './wrap-plus-button.component.html',
  styleUrls: ['./wrap-plus-button.component.scss']
})
export class WrapPlusButtonComponent implements OnInit {

  @Input()
  adviceWrapType: WrapType = WrapType.GROUP;

  @Output()
  onNewWrap: EventEmitter<Wrap> = new EventEmitter();

  constructor(
    private matDialog: MatDialog
  ) { }

  ngOnInit() {

  }

  openDialog() {
    let wrap = UtilsService.purgeArray(new Wrap());
    wrap.type = this.adviceWrapType;
    let dialog = this.matDialog.open(WrapDialog, {
      data: {
        wrap: wrap,
        title: 'Add new Wrap'
      },
      width: '100%',
    })

    dialog.afterClosed().subscribe(result => {
      if(result) {
        this.onNewWrap.emit(result);
      }
    })
  }

}
