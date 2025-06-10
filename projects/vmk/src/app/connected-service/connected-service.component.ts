import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialog } from 'projects/viescloud-utils/src/lib/dialog/confirm-dialog/confirm-dialog.component';
import { PinterestOathTokenService } from 'projects/viescloud-utils/src/lib/service/affiliateMarketing.service';

@Component({
  selector: 'app-connected-service',
  templateUrl: './connected-service.component.html',
  styleUrls: ['./connected-service.component.scss']
})
export class ConnectedServiceComponent implements OnInit {

  constructor(
    private printerestOathTokenService: PinterestOathTokenService,
    private matDialog: MatDialog) { }

  ngOnInit() {

  }

  connectPinterest() {
    this.printerestOathTokenService.authorizeFlow();
  }

  reconnectPinterest() {
    let dialog = this.matDialog.open(ConfirmDialog, {data: {title: 'Reconnect', message: 'Do you want to reconnect your Pinterest account?', yes: 'Yes', no: 'No'}});
    dialog.afterClosed().subscribe({
      next: (res) => {
        if(res)
          this.connectPinterest();
      }
    })
  }

  isPinterestConnected() {
    return this.printerestOathTokenService.pinterestOathToken;
  }
}
