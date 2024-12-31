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
import { DialogUtils } from 'projects/viescloud-utils/src/lib/util/Dialog.utils';
import { EnsibleFsService } from './service/ensible-fs/ensible-fs.service';
import { RxJSUtils } from 'projects/viescloud-utils/src/lib/util/RxJS.utils';
import { FsWriteMode } from './model/ensible.model';
import { EnsibleSetting } from './model/ensible.setting.model';
import { EnsibleSettingService } from './service/ensible-setting/ensible-setting.service';

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
      hideConditional: () => !this.ensibleAuthenticatorService.isLogin(),
      children: [
        {
          title: 'all',
          routerLink: '/item/all'
        },
        {
          title: 'add new',
          routerLink: '/item/0'
        }
      ]
    },
    {
      title: 'Roles',
      children: [],
      hideConditional: () => !this.ensibleAuthenticatorService.isLogin()
    },
    {
      title: 'Group vars',
      children: [],
      hideConditional: () => !this.ensibleAuthenticatorService.isLogin()
    },
    {
      title: 'Host vars',
      children: [],
      hideConditional: () => !this.ensibleAuthenticatorService.isLogin()
    },
    {
      title: 'Inventory',
      children: [],
      hideConditional: () => !this.ensibleAuthenticatorService.isLogin()
    },
    {
      title: 'Playbooks',
      children: [],
      hideConditional: () => !this.ensibleAuthenticatorService.isLogin()
    },
    {
      title: 'Secrets',
      children: [],
      hideConditional: () => !this.ensibleAuthenticatorService.isLogin()
    },
    {
      title: 'Passwords',
      children: [],
      hideConditional: () => !this.ensibleAuthenticatorService.isLogin()
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
          title: 'Account',
          routerLink: '/setting/account',
          hideConditional: () => !this.ensibleAuthenticatorService.isLogin()
        },
        {
          title: 'Users',
          routerLink: '/setting/users',
          hideConditional: () => !this.ensibleAuthenticatorService.userHaveRole('ADMIN')
        },
        {
          title: 'ansible.cfg',
          routerLink: '/setting/ansible.cfg',
          hideConditional: () => !this.ensibleAuthenticatorService.userHaveRole('ADMIN')
        }
      ]
    },
    // {
    //   title: 'About',
    //   hideChildren: true,
    //   children: [
    //     {
    //       title: 'Policy',
    //       routerLink: '/policy'
    //     }
    //   ]
    // }
  ]

  constructor(
    settingService: EnsibleSettingService,
    keyCaptureService: KeyCaptureService,
    matDialog: MatDialog,
    public ensibleAuthenticatorService: EnsibleAuthenticatorService,
    public router: Router,
    private ensibleWorkspaceParserService: EnsibleWorkspaceParserService,
    private ensibleFsService: EnsibleFsService,
    private rxjsUtils: RxJSUtils
  ) {
    super(settingService, keyCaptureService, matDialog);

    ensibleAuthenticatorService.onLogout$.subscribe(() => {
      this.router.navigate(['login']);
    })

    ensibleAuthenticatorService.onLogin$.subscribe(() => {
      this.ensibleWorkspaceParserService.triggerFetchWorkspace();
    })

    ensibleWorkspaceParserService.onFetchWorkspace$.subscribe(ws => {
      this.parseWorkspaceToRolesMenu(ws);
      this.parseWorkspaceToMenu('Inventory', 'inventory', () => ws.inventory);
      this.parseWorkspaceToMenu('Playbooks', 'playbooks', () => ws.playbooks);
      this.parseWorkspaceToMenu('Secrets', 'secrets', () => ws.secrets);
      this.parseWorkspaceToMenu('Passwords', 'passwords', () => ws.passwords);
      this.parseWorkspaceToMenu('Group vars', 'group_vars', () => ws.groupVars);
      this.parseWorkspaceToMenu('Host vars', 'host_vars', () => ws.hostVars);
    })

    settingService.onGeneralSettingChange.subscribe({
      next: () => {
        this.ensibleWorkspaceParserService.triggerFetchWorkspace();
      }
    });
  }

  override async ngOnInit() {
    super.ngOnInit();
    this.ensibleAuthenticatorService.ngOnInit();
    // this.ensibleWorkspaceParserService.triggerFetchWorkspace();
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
          {
            title: `-----------------------------------`,
            routerLink: '--',
            click: () => {}
          },
          {
            title: `- delete role ${e.self.name}`,
            routerLink: `/roles/${e.self.name}`,
            click: () => this.deleteRole(e.self.path)
          }
        ]
      })
    })

    menu.children!.push({
      title: '+ new role',
      routerLink: '/roles/new',
      click: () => this.addNewRole()
    })
  }

  private putRoleChildMenu(supplier: () => EnsibleFsDir, grandMenuName: string, menuName: string) {
    let menuChild: QuickSideDrawerMenu[] = [];
    let hideWorkspaceTree = this.settingService.getCopyOfGeneralSetting<EnsibleSetting>().hideWorkspaceTree;

    supplier()?.child.forEach(value => {
      menuChild.push({
        title: value.name,
        routerLink: `/file/roles/${grandMenuName}/${menuName}/${value.name}`,
      });
    })

    let mainMenu: QuickSideDrawerMenu[] = [
      {
        title: menuName,
        children: [
          ...hideWorkspaceTree ? [] : menuChild,
          {
            title: 'all',
            routerLink: `/files/roles/${grandMenuName}/${menuName}`,
          },
          {
            title: '+ new file',
            routerLink: `/file/roles/${grandMenuName}/${menuName}/new`
          }
        ]
      }
    ];
    return mainMenu;
  }

  parseWorkspaceToMenu(title: string, routerLinkBase: string, producer: () => EnsibleFsDir) {
    let index = this.menu.findIndex(e => e.title === title);
    let menu = this.menu[index];
    let hideWorkspaceTree = this.settingService.getCopyOfGeneralSetting<EnsibleSetting>().hideWorkspaceTree;

    let hideChildren = menu.hideChildren;
    menu.hideChildren = hideChildren === false ? false : true;
    menu.children = [];

    if(!hideWorkspaceTree) {
      producer().child.forEach(e => {
        menu.children!.push({
          title: e.name,
          routerLink: `/file/${routerLinkBase}/${e.name}`
        })
      })
    }

    menu.children!.push({
      title: 'all',
      routerLink: `/files/${routerLinkBase}`
    })

    menu.children!.push({
      title: '+ new file',
      routerLink: `/file/${routerLinkBase}/new`
    })
  }

  getUserAlias(): string {
    if(this.ensibleAuthenticatorService.isLogin()) {
      return this.ensibleAuthenticatorService.user!.alias ?? this.ensibleAuthenticatorService.user!.username;
    }
    else
      return '';
  }

  async addNewRole() {
    let name = await DialogUtils.openInputDialog(this.matDialog, 'Create new role', 'Role name', 'Create', 'Cancel');
    if(name) {
      let ws = await this.ensibleWorkspaceParserService.parseWorkspace();
      if(ws && !ws.isRoleExist(name)) {
        this.ensibleFsService.writeFile(`roles/${name}/tasks/main.yml`, '---', FsWriteMode.SKIP).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
          next: () => {
            this.ensibleWorkspaceParserService.triggerFetchWorkspace();
          },
          error: (err) => {
            DialogUtils.openConfirmDialog(this.matDialog, 'Error', 'Error writing file', 'Ok', '');
          }
        })
      }
      else {
        DialogUtils.openConfirmDialog(this.matDialog, 'Error', 'Role name already exist', 'Ok', '');
      }
    }
  }

  async deleteRole(rolePath: string) {
    let confirm = await DialogUtils.openConfirmDialog(this.matDialog, 'Delete', 'Are you sure you want to delete this role?\n!This cannot be undone!\n!All files under this role will be deleted!', 'Yes', 'Cancel');

    if(confirm) {
      this.ensibleFsService.deleteFile(rolePath).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
        next: () => {
          this.ensibleWorkspaceParserService.triggerFetchWorkspace();
          this.router.navigate(['home']);
        },
        error: (err) => {
          DialogUtils.openConfirmDialog(this.matDialog, 'Error', 'Error when deleting role', 'Ok', '');
        }
      });
    }
  }

}
