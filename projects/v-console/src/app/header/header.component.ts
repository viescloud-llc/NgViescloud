import { Component, Input, OnInit } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';
import { first } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { OpenIdService } from 'projects/viescloud-utils/src/lib/service/OpenId.service';
import { AuthenticatorService } from 'projects/viescloud-utils/src/lib/service/Authenticator.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {

  @Input()
  drawer?: MatDrawer;

  constructor(public openIdService: OpenIdService, public authenticatorService: AuthenticatorService, private router: Router) { }

  ngOnInit() {
    this.authenticatorService.isLoginCallWithReroute();
  }

  logout(): void {
    this.authenticatorService.logoutWithoutReroute();
    this.openIdService.logoutFlow();
  }

  getURL(): string {
    return document.URL;
  }

  getAlias(): string {
    if(this.authenticatorService.currentUser?.name)
      return this.authenticatorService.currentUser?.name;
    else if(this.authenticatorService.currentUser?.userProfile?.alias)
      return this.authenticatorService.currentUser?.userProfile?.alias;
    else if(this.authenticatorService.currentUser?.userProfile?.firstName && this.authenticatorService.currentUser?.userProfile?.lastName)
      return `${this.authenticatorService.currentUser?.userProfile?.firstName} ${this.authenticatorService.currentUser?.userProfile?.lastName}`
    else 
      return ""
  }
}
