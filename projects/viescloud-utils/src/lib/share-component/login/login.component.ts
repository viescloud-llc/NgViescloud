import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { first } from 'rxjs';
import { AuthenticatorService } from '../../service/Authenticator.service';
import { OpenIdService } from '../../service/OpenId.service';

@Component({
  selector: 'viescloud-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  loginForm!: FormGroup;

  error: string = '';

  constructor(
    private fb: FormBuilder, 
    private router: Router, 
    private authenticatorService: AuthenticatorService,
    private openIdService: OpenIdService
  ) { }

  ngOnInit(): void {
    this.openIdService.authorizeFlow();
  }
}
