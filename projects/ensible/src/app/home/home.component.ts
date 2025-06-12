import { Component } from '@angular/core';
import { AuthenticatorService } from 'projects/viescloud-utils/src/lib/service/authenticator.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  constructor(
    public ensibleAuthenticatorService: AuthenticatorService
  ) { }
}
