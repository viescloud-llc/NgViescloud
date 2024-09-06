import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthenticatorService } from 'projects/viescloud-utils/src/lib/service/Authenticator.service';
import { first } from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  loginForm!: FormGroup;

  error: string = '';

  constructor(private fb: FormBuilder, private router: Router, private authenticatorService: AuthenticatorService) { }

  ngOnInit(): void 
  {
    this.authenticatorService.isLoginCallWithReroute("/home");
    this.loginForm = this.fb.group(
      {
        username: ['', [Validators.required]],
        password: ['', [Validators.required]]
      }
    )
  }
  
  login()
  {
    this.authenticatorService.login(this.loginForm.value).pipe(first()).subscribe(
      async res => {
        await this.authenticatorService.autoUpdateUserWithJwt(res.jwt!); 
        this.router.navigate(['home'])
      },
      error => {this.error = 'invalid or wrong username or password'}
    );
  }

  healthCheck(): void {
    this.authenticatorService.healthCheck().pipe(first()).subscribe(
      res => {
        console.log(res);
      }
    );
  }

}
