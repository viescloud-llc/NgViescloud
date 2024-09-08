import { Component, OnInit } from '@angular/core';
import { OpenIdService } from '../../service/OpenId.service';
import { AuthenticatorService } from '../../service/Authenticator.service';

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
