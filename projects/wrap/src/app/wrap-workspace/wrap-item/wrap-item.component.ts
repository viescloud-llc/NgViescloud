import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Mode } from '../wrap-workspace.component';
import { Link, Wrap } from 'projects/viescloud-utils/src/lib/model/Wrap.model';
import { TrackByIndex } from 'projects/viescloud-utils/src/lib/directive/TrackByIndex';
import { MatDialog } from '@angular/material/dialog';
import { WrapDialog } from 'projects/viescloud-utils/src/lib/dialog/wrap-dialog/wrap-dialog.component';

@Component({
  selector: 'app-wrap-item',
  templateUrl: './wrap-item.component.html',
  styleUrls: ['./wrap-item.component.scss']
})
export class WrapItemComponent extends TrackByIndex implements OnInit {

  @Input()
  wrap!: Wrap;

  @Output()
  wrapChange: EventEmitter<Wrap> = new EventEmitter();

  @Input()
  mode!: Mode;

  @Output()
  modeChange: EventEmitter<Mode> = new EventEmitter();

  constructor(private matDialog: MatDialog) { 
    super();
  }

  ngOnInit() {
    if(!this.wrap.children)
      this.wrap.children = [];
  }

  edit(wrap: Wrap) {
    if(this.mode === Mode.Edit) {
      var dialog = this.matDialog.open(WrapDialog, {
        data: {
          wrap: wrap,
          title: 'Edit Wrap'
        },
        width: '100%'
      })
  
      dialog.afterClosed().subscribe({
        next: result => {
          if(result) {
            this.wrap = result;
            this.wrapChange.emit(result);
          }
        }
      })
    }
  }

  openLink(link: Link) {
    window.open(link.serviceUrl);
  }
}
