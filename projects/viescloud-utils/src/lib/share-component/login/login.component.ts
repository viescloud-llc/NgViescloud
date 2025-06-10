import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { first } from 'rxjs';
import { AuthenticatorService } from '../../service/authenticator.service';
import { OpenIdService } from '../../service/open-id.service';

@Component({
  selector: 'viescloud-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  username: string = '';
  password: string = '';

  error: string = '';
  validForm: boolean = false;

  constructor(
    private fb: FormBuilder, 
    private router: Router, 
    private authenticatorService: AuthenticatorService,
    public openIdService: OpenIdService
  ) { }

  ngOnInit(): void {
  }

  login() {
    this.authenticatorService.login({username: this.username, password: this.password}).pipe(first()).subscribe(
      {
        next: async res => {
          await this.authenticatorService.autoUpdateUserWithJwt(res.jwt!); 
          this.router.navigate(['home'])
        },
        error: error => {this.error = 'invalid or wrong username or password'}
      }
    )

  }
}
