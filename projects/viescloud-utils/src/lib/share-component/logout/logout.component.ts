import { Component, OnInit } from '@angular/core';
import { OpenIdService } from '../../service/open-id.service';
import { AuthenticatorService } from '../../service/authenticator.service';

@Component({
  selector: 'viescloud-logout',
  templateUrl: './logout.component.html',
  styleUrls: ['./logout.component.scss']
})
export class LogoutComponent implements OnInit {

  constructor(
    private openIdService: OpenIdService,
    private authenticatorService: AuthenticatorService
  ) { }

  ngOnInit() {
    this.authenticatorService.logoutWithoutReroute();
    this.openIdService.logoutFlow();
  }

}
