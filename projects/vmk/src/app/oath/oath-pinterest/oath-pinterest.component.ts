import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { PinterestOathTokenService } from 'projects/viescloud-utils/src/lib/service/affiliateMarketing.service';
import { UtilsService } from 'projects/viescloud-utils/src/lib/service/utils.service';

@Component({
  selector: 'app-oath-pinterest',
  templateUrl: './oath-pinterest.component.html',
  styleUrls: ['./oath-pinterest.component.scss']
})
export class OathPinterestComponent implements OnInit {

  error = "";

  constructor(
    private matDialog: MatDialog,
    private router: Router, 
    private pinterestOathTokenService: PinterestOathTokenService
  ) { }

  ngOnInit() {
    let queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    let code = urlParams.get("code");
    let state = urlParams.get("state");
    let redirectUri = this.pinterestOathTokenService.getRedirectUri();

    if(code && state) {
      this.pinterestOathTokenService.post({code: code, state: state, redirectUri: redirectUri}).pipe(UtilsService.waitLoadingDialog(this.matDialog)).subscribe({
        next: (data) => {
          this.pinterestOathTokenService.pinterestOathToken = data;
          this.router.navigate(['/connected-service']);
        },
        error: (error) => {
          this.error = 'server encounter unknown error please try again latter';
        }
      })
    }
    else
      this.error = "Can't login to Pinterest service, Please try again latter";
  }

}
