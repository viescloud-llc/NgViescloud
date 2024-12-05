import { Injectable, OnInit } from '@angular/core';
import { EnsibleService } from '../ensible/ensible.service';
import { HttpClient } from '@angular/common/http';
import { RxJSUtils } from 'projects/viescloud-utils/src/lib/util/RxJS.utils';
import { EnsibleUser } from '../../model/ensible.model';
import { firstValueFrom } from 'rxjs';
import { DialogUtils } from 'projects/viescloud-utils/src/lib/util/Dialog.utils';
import { FileUtils } from 'projects/viescloud-utils/src/lib/util/File.utils';

@Injectable({
  providedIn: 'root'
})
export class EnsibleAuthenticatorService extends EnsibleService implements OnInit {

  user?: EnsibleUser;
  private token: string = '';

  constructor(
    private httpClient: HttpClient,
    private dialogUtils: DialogUtils
  ) {
    super();
  }

  ngOnInit(): void {
    let token = FileUtils.localStorageGetItem<string>('jwt');
    if(token) {
      this.getUser().pipe(RxJSUtils.waitLoadingDialog()).subscribe({
        next: res2 => {
          this.user = res2;
          this.token = token!;
        }
      })
    }
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
              this.user = res2;
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
}
