import { Component, OnInit } from '@angular/core';
import { EnsibleAuthenticatorService } from '../service/ensible-authenticator/ensible-authenticator.service';
import { EnsibleUserService } from '../service/ensible-user/ensible-user.service';
import { EnsibleUser } from '../model/ensible.model';
import { RxJSUtils } from 'projects/viescloud-utils/src/lib/util/RxJS.utils';

@Component({
  selector: 'app-ensible-user',
  templateUrl: './ensible-user.component.html',
  styleUrls: ['./ensible-user.component.scss']
})
export class EnsibleUserComponent implements OnInit {
  users: EnsibleUser[] = [];
  blankUser = new EnsibleUser();

  selectedUser?: EnsibleUser;

  constructor(
    private ensibleUserService: EnsibleUserService,
    private rxjs: RxJSUtils
  ) { }

  ngOnInit(): void {
    this.ensibleUserService.getAll().pipe(this.rxjs.waitLoadingDialog()).subscribe({
      next: res => {
        this.users = res;
      }
    })
  }

  addUser() {
    this.selectedUser = new EnsibleUser();
  }
}
