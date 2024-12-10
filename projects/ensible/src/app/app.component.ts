import { EnsibleAuthenticatorService } from './service/ensible-authenticator/ensible-authenticator.service';
import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ViescloudApplicationMinimal } from 'projects/viescloud-utils/src/lib/directive/ViescloudApplicationMinimal.directive';
import { KeyCaptureService } from 'projects/viescloud-utils/src/lib/service/KeyCapture.service';
import { SettingService } from 'projects/viescloud-utils/src/lib/service/Setting.service';
import { QuickSideDrawerMenu } from 'projects/viescloud-utils/src/lib/share-component/quick-side-drawer-menu/quick-side-drawer-menu.component';
import { EnsibleWorkspaceParserService } from './service/ensible-workspace/ensible-workspace.service';
import { EnsibleRole, EnsibleFsDir, EnsibleWorkSpace } from './model/ensible.parser.model';

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
          hideConditional: () => this.ensibleAuthenticatorService.isLogin(),
        },
        {
          title: 'logout',
          routerLink: '/logout',
          hideConditional: () => !this.ensibleAuthenticatorService.isLogin(),
          click: () => this.ensibleAuthenticatorService.logout()
        }
      ]
    },
    {
      title: 'Item',
      children: [
        {
          title: 'all',
          routerLink: '/item/all'
        },
        {
          title: 'setting',
          routerLink: '/item/setting'
        }
      ]
    },
    {
      title: 'Inventories',
      children: [],
      hideConditional: () => !this.ensibleAuthenticatorService.isLogin(),
    },
    {
      title: 'Playbooks',
      children: [],
      hideConditional: () => !this.ensibleAuthenticatorService.isLogin(),
    },
    {
      title: 'Roles',
      children: [],
      hideConditional: () => !this.ensibleAuthenticatorService.isLogin(),
    },
    {
      title: 'Secrets',
      children: [],
      hideConditional: () => !this.ensibleAuthenticatorService.isLogin(),
    },
    {
      title: 'Passwords',
      children: [],
      hideConditional: () => !this.ensibleAuthenticatorService.isLogin(),
    },
    {
      title: 'Settings',
      hideChildren: true,
      children: [
        {
          title: 'Application Setting',
          routerLink: '/setting/application-setting'
        },
        {
          title: 'Users',
          routerLink: '/setting/users',
          hideConditional: () => !this.ensibleAuthenticatorService.userHaveRole('ADMIN')
        }
      ]
    },
    {
      title: 'About',
      hideChildren: true,
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

    ensibleAuthenticatorService.onLogin$.subscribe(() => {
      this.ensibleWorkspaceParserService.triggerFetchWorkspace();
    })

    ensibleWorkspaceParserService.onFetchWorkspace$.subscribe(ws => {
      this.parseWorkspaceToRolesMenu(ws);
      this.parseWorkspaceToMenu('Inventories', 'inventories', () => ws.inventories);
      this.parseWorkspaceToMenu('Playbooks', 'playbooks', () => ws.playbooks);
      this.parseWorkspaceToMenu('Secrets', 'secrets', () => ws.secrets);
      this.parseWorkspaceToMenu('Passwords', 'passwords', () => ws.passwords);
    })
  }

  override async ngOnInit() {
    super.ngOnInit();
    this.ensibleAuthenticatorService.ngOnInit();
    this.ensibleWorkspaceParserService.triggerFetchWorkspace();
  }

  parseWorkspaceToRolesMenu(ws: EnsibleWorkSpace) {
    let index = this.menu.findIndex(e => e.title === 'Roles');
    let menu = this.menu[index];
    let hideChildren = menu.hideChildren;
    menu.hideChildren = hideChildren === false ? false : true;
    menu.children = [];

    ws.roles.forEach(e => {
      menu.children!.push({
        title: e.self.name,
        children: [
          ...this.putRoleChildMenu(() => e.defaults!, e.self.name, 'defaults'),
          ...this.putRoleChildMenu(() => e.files!, e.self.name, 'files'),
          ...this.putRoleChildMenu(() => e.handlers!, e.self.name, 'handlers'),
          ...this.putRoleChildMenu(() => e.meta!, e.self.name, 'meta'),
          ...this.putRoleChildMenu(() => e.tasks!, e.self.name, 'tasks'),
          ...this.putRoleChildMenu(() => e.templates!, e.self.name, 'templates'),
          ...this.putRoleChildMenu(() => e.vars!, e.self.name, 'vars'),
        ]
      })
    })

    menu.children!.push({
      title: '+ new role',
      routerLink: '/roles/new'
    })
  }

  private putRoleChildMenu(supplier: () => EnsibleFsDir, grandMenuName: string, menuName: string) {
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

  parseWorkspaceToMenu(title: string, routerLinkBase: string, producer: () => EnsibleFsDir) {
    let index = this.menu.findIndex(e => e.title === title);
    let menu = this.menu[index];
    let hideChildren = menu.hideChildren;
    menu.hideChildren = hideChildren === false ? false : true;
    menu.children = [];

    producer().child.forEach(e => {
      menu.children!.push({
        title: e.name,
        routerLink: `/${routerLinkBase}/${e.name}`
      })
    })

    menu.children!.push({
      title: '+ new',
      routerLink: `/${routerLinkBase}/new`
    })
  }

  getUserAlias(): string {
    if(this.ensibleAuthenticatorService.isLogin())
      return this.ensibleAuthenticatorService.user!.username;
    else
      return '';
  }

}
