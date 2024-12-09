import { EnsibleAuthenticatorService } from './service/ensible-authenticator/ensible-authenticator.service';
import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ViescloudApplicationMinimal } from 'projects/viescloud-utils/src/lib/directive/ViescloudApplicationMinimal.directive';
import { KeyCaptureService } from 'projects/viescloud-utils/src/lib/service/KeyCapture.service';
import { SettingService } from 'projects/viescloud-utils/src/lib/service/Setting.service';
import { QuickSideDrawerMenu } from 'projects/viescloud-utils/src/lib/share-component/quick-side-drawer-menu/quick-side-drawer-menu.component';
import { EnsibleWorkspaceParserService } from './service/ensible-workspace/ensible-workspace.service';
import { EnsibleRole, EnsibleRoleDir, EnsibleWorkSpace } from './model/ensible.parser.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent extends ViescloudApplicationMinimal {
  override getTitle(): string {
    return 'ensible';
  }

  menu: QuickSideDrawerMenu[] = [
    {
      title: 'Viescloud',
      children: [
        {
          title: 'Home',
          routerLink: '/home'
        },
        {
          title: 'Login',
          routerLink: '/login',
          hideConditional: () => this.isLogin(),
        },
        {
          title: 'logout',
          routerLink: '/logout',
          hideConditional: () => !this.isLogin(),
          click: () => this.ensibleAuthenticatorService.logout()
        }
      ]
    },
    {
      title: 'Roles',
      children: [],
      hideConditional: () => !this.isLogin(),
    },
    {
      title: 'Settings',
      children: [
        {
          title: 'Application Setting',
          routerLink: '/setting/application-setting'
        }
      ]
    },
    {
      title: 'About',
      children: [
        {
          title: 'Policy',
          routerLink: '/policy'
        }
      ]
    }
  ]

  constructor(
    settingService: SettingService,
    keyCaptureService: KeyCaptureService,
    matDialog: MatDialog,
    public ensibleAuthenticatorService: EnsibleAuthenticatorService,
    public router: Router,
    private ensibleWorkspaceParserService: EnsibleWorkspaceParserService
  ) {
    super(settingService, keyCaptureService, matDialog);
    ensibleWorkspaceParserService.onFetchWorkspace$.subscribe(ws => {
      this.parseWorkspaceToMenu(ws);
    })
    ensibleAuthenticatorService.onLogin$.subscribe(() => {
      this.ensibleWorkspaceParserService.triggerFetchWorkspace();
    })
  }

  override async ngOnInit() {
    super.ngOnInit();
    this.ensibleAuthenticatorService.ngOnInit();
    this.ensibleWorkspaceParserService.triggerFetchWorkspace();
  }

  parseWorkspaceToMenu(ws: EnsibleWorkSpace) {
    let index = this.menu.findIndex(e => e.title === 'Roles');
    let menu = this.menu[index];
    menu.children = [];

    ws.roles.forEach(e => {
      menu.children = [];

      menu.children.push({
        title: e.self.name,
        children: [
          ...this.putMenu(() => e.defaults!, e.self.name, 'defaults'),
          ...this.putMenu(() => e.files!, e.self.name, 'files'),
          ...this.putMenu(() => e.handlers!, e.self.name, 'handlers'),
          ...this.putMenu(() => e.meta!, e.self.name, 'meta'),
          ...this.putMenu(() => e.tasks!, e.self.name, 'tasks'),
          ...this.putMenu(() => e.templates!, e.self.name, 'templates'),
          ...this.putMenu(() => e.vars!, e.self.name, 'vars'),
        ]
      })

      menu.children.push({
        title: '+ new role',
        routerLink: '/roles/new'
      })
    })
  }

  private putMenu(supplier: () => EnsibleRoleDir, grandMenuName: string, menuName: string) {
    let menuChild: QuickSideDrawerMenu[] = [];
    supplier()?.child.forEach(value => {
      menuChild.push({
        title: value.name,
        routerLink: `/roles/${grandMenuName}/${menuName}/${value.name}`,
      });
    })

    let mainMenu: QuickSideDrawerMenu[] = [
      {
        title: menuName,
        children: [
          ...menuChild,
          {
            title: '+ new ' + menuName,
            routerLink: `/roles/${grandMenuName}/${menuName}/new`
          }
        ]
      }
    ];
    return mainMenu;
  }

  isLogin() {
    return this.ensibleAuthenticatorService.isLogin();
  }

  getUserAlias(): string {
    if(this.isLogin())
      return this.ensibleAuthenticatorService.user!.username;
    else
      return '';
  }

}
