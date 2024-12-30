import { Jwt } from './../../../../../viescloud-utils/src/lib/model/Authenticator.model';
import { Injectable, OnInit } from '@angular/core';
import { EnsibleService } from '../ensible/ensible.service';
import { HttpClient } from '@angular/common/http';
import { RxJSUtils } from 'projects/viescloud-utils/src/lib/util/RxJS.utils';
import { EnsibleUser } from '../../model/ensible.model';
import { firstValueFrom, Subject } from 'rxjs';
import { DialogUtils } from 'projects/viescloud-utils/src/lib/util/Dialog.utils';
import { FileUtils } from 'projects/viescloud-utils/src/lib/util/File.utils';
import { DataUtils } from 'projects/viescloud-utils/src/lib/util/Data.utils';

@Injectable({
  providedIn: 'root'
})
export class EnsibleAuthenticatorService extends EnsibleService {

  user?: EnsibleUser;
  private token: string = '';
  private initCheck = false;

  private onLoginSubject = new Subject<void>();
  private onLogOutSubject = new Subject<void>();
  onLogin$ = this.onLoginSubject.asObservable();
  onLogout$ = this.onLogOutSubject.asObservable();

  constructor(
    httpClient: HttpClient,
    private dialogUtils: DialogUtils
  ) {
    super(httpClient);
    this.fetchUserInterval();
  }

  ngOnInit(): void {
    let token = FileUtils.localStorageGetItem<string>('jwt');
    if(token) {
      this.token = token;
      this.getUser().pipe(RxJSUtils.waitLoadingDialog()).subscribe({
        next: res2 => {
          this.setLoginUser(res2);
          this.initCheck = true;
        },
        error: err => {
          this.logout();
          this.initCheck = true;
        }
      })
    }
    else {
      this.initCheck = true;
    }
  }

  doneInitCheck() {
    let token = FileUtils.localStorageGetItem<string>('jwt');

    if(!token)
      return true;

    return this.initCheck;
  }

  private fetchUserInterval() {
    setInterval(() => {
      if(!this.token)
        return;

      this.getUser().pipe(RxJSUtils.waitLoadingDialog()).subscribe({
        next: res2 => {
          this.setLoginUser(res2);
        },
        error: err => {
          this.logout();
        }
      })
    }, 120000) //2 mins
  }

  protected override getPrefixes(): string[] {
    return ['api', 'v1', 'authenticators'];
  }

  private getUser() {
    return this.httpClient.get<EnsibleUser>(`${this.getPrefixUri()}/user`);
  }

  login(username: string, password: string) {
    return this.httpClient.post<{jwt: string}>(`${this.getPrefixUri()}/login`, {username, password});
  }

  async autoLogin(username: string, password: string) {
    return new Promise<void>((resolve, reject) => {
      this.login(username, password).pipe(RxJSUtils.waitLoadingDialog()).subscribe({
        next: res => {
          this.setToken(res.jwt);

          this.getUser().pipe(RxJSUtils.waitLoadingDialog()).subscribe({
            next: res2 => {
              this.setLoginUser(res2);
              FileUtils.localStorageSetItem('jwt', this.token);
              resolve();
            },
            error: err => {
              this.dialogUtils.openErrorMessage("Fail fetch login user", "Unkown Error fetching user");
              reject();
            }
          })
        },
        error: err => {
          this.dialogUtils.openErrorMessage("Login fail", "invalid username or password");
          reject();
        }
      });
    })
  }

  getToken() {
    return this.token;
  }

  setToken(jwt: string) {
    this.token = jwt;
  }

  isLogin() {
    return !!this.token && !!this.user;
  }

  logout() {
    this.token = '';
    this.user = undefined;
    FileUtils.localStorageRemoveItem('jwt');
    this.onLogOutSubject.next();
  }

  userHaveRole(name: string) {
    if(!this.isLogin())
      return false;

    return this.user?.userGroups.some(e => e.name === name);
  }

  private setLoginUser(user: EnsibleUser) {
    if(!this.user || this.user.id !== user.id) {
      this.onLoginSubject.next();
    }

    this.user = user;
  }

  changeCurrentLoginUserPassword(currentPassword: string, newPassword: string) {
    if(this.isLogin()) {
      return this.httpClient.put(`${this.getPrefixUri()}/user/password`, {currentPassword, newPassword});
    }
    else {
      throw new Error('Not login');
    }
  }

  changeCurrentLoginUserAlias(alias: string) {
    if(this.isLogin()) {
      return this.httpClient.put(`${this.getPrefixUri()}/user/alias`, {alias});
    }
    else {
      throw new Error('Not login');
    }
  }
}
