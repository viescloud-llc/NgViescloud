import { Component, OnInit } from '@angular/core';
import { AuthenticatorService } from 'projects/viescloud-utils/src/lib/service/authenticator.service';
import { OpenIdService } from 'projects/viescloud-utils/src/lib/service/open-id.service';

@Component({
  selector: 'app-side-drawer',
  templateUrl: './side-drawer.component.html',
  styleUrls: ['./side-drawer.component.scss']
})
export class SideDrawerComponent implements OnInit {

  constructor(public authenticatorService: AuthenticatorService, public openIdService: OpenIdService) { }

  ngOnInit() {
  }

  logout() {
    this.authenticatorService.logoutWithoutReroute();
    this.openIdService.logoutFlow();
  }

}
