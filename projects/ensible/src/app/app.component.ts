import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { KeyCaptureService } from 'projects/viescloud-utils/src/lib/service/key-capture.service';
import { QuickSideDrawerMenu } from 'projects/viescloud-utils/src/lib/share-component/quick-side-drawer-menu/quick-side-drawer-menu.component';
import { EnsibleFsDir, EnsibleWorkSpace } from './model/ensible.parser.model';
import { DialogUtils } from 'projects/viescloud-utils/src/lib/util/Dialog.utils';
import { EnsibleFsService } from './service/ensible-fs/ensible-fs.service';
import { RxJSUtils } from 'projects/viescloud-utils/src/lib/util/RxJS.utils';
import { FsWriteMode } from './model/ensible.model';
import { EnsibleSetting } from './model/ensible.setting.model';
import { EnsibleSettingService } from './service/ensible-setting/ensible-setting.service';
import { AuthenticatorService } from 'projects/viescloud-utils/src/lib/service/authenticator.service';
import { environment } from 'projects/environments/environment.prod';
import { ViescloudApplication } from 'projects/viescloud-utils/src/lib/abtract/ViescloudApplication.directive';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent extends ViescloudApplication {

  menu: QuickSideDrawerMenu[] = [
    {
      title: 'Viescloud',
      children: [
        {
          title: 'Home',
          routerLink: environment.endpoint_home
        },
        {
          title: 'Login',
          routerLink: environment.endpoint_login,
          hideConditional: () => this.authenticatorService.isAuthenticatedSync(),
        },
        {
          title: 'logout',
          routerLink: '/logout',
          hideConditional: () => !this.authenticatorService.isAuthenticatedSync(),
          click: () => this.authenticatorService.logout()
        }
      ]
    },
    {
      title: 'Item',
      hideConditional: () => !this.authenticatorService.isAuthenticatedSync(),
      children: [
        {
          title: 'Ansibles',
          routerLink: '/item/playbooks/all'
        },
        {
          title: 'Ansible +',
          routerLink: '/item/playbooks/0'
        },
        {
          title: 'Shells',
          routerLink: '/item/shells/all'
        },
        {
          title: 'Shell +',
          routerLink: '/item/shells/0'
        }
      ]
    },
    {
      title: 'Roles',
      children: [],
      hideConditional: () => !this.authenticatorService.isAuthenticatedSync()
    },
    {
      title: 'Group vars',
      children: [],
      hideConditional: () => !this.authenticatorService.isAuthenticatedSync()
    },
    {
      title: 'Host vars',
      children: [],
      hideConditional: () => !this.authenticatorService.isAuthenticatedSync()
    },
    {
      title: 'Inventory',
      children: [],
      hideConditional: () => !this.authenticatorService.isAuthenticatedSync()
    },
    {
      title: 'Playbooks',
      children: [],
      hideConditional: () => !this.authenticatorService.isAuthenticatedSync()
    },
    {
      title: 'Secrets',
      children: [],
      hideConditional: () => !this.authenticatorService.isAuthenticatedSync()
    },
    {
      title: 'Passwords',
      children: [],
      hideConditional: () => !this.authenticatorService.isAuthenticatedSync()
    },
    {
      title: 'Shells',
      children: [],
      hideConditional: () => !this.authenticatorService.isAuthenticatedSync()
    },
    {
      title: 'Dockers',
      hideChildren: true,
      hideConditional: () => !this.authenticatorService.isAuthenticatedSync(),
      children: [
        {
          title: 'all',
          routerLink: '/docker/container/templates'
        },
        {
          title: 'add new',
          routerLink: '/docker/container/template/0'
        }
      ],
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
          hideConditional: () => !this.authenticatorService.isAuthenticatedSync()
        },
        {
          title: 'Users',
          routerLink: '/setting/users',
          hideConditional: () => !this.authenticatorService.hasUserGroup('ADMIN')
        },
        {
          title: 'User groups',
          routerLink: '/setting/user/groups',
          hideConditional: () => !this.authenticatorService.hasUserGroup('ADMIN')
        },
        {
          title: 'ansible.cfg',
          routerLink: '/setting/ansible.cfg',
          hideConditional: () => !this.authenticatorService.hasUserGroup('ADMIN')
        },
        {
          title: 'OpenId Provider',
          routerLink: '/setting/openid-provider',
          hideConditional: () => !this.authenticatorService.hasUserGroup('ADMIN')
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
    authenticatorService: AuthenticatorService,
    router: Router,
    private ensibleFsService: EnsibleFsService,
    private rxjsUtils: RxJSUtils
  ) {
    super(authenticatorService, settingService, keyCaptureService, matDialog, router);

    authenticatorService.onLogout(() => {
      this.router.navigate([environment.endpoint_login]);
    })

    authenticatorService.onLogin(user => {
      this.ensibleFsService.triggerFetchWorkspace();
    })

    ensibleFsService.onFetchWorkspace$.subscribe(ws => {
      this.parseWorkspaceToRolesMenu(ws);
      this.parseWorkspaceToMenu('Inventory', 'inventory', () => ws.inventory);
      this.parseWorkspaceToMenu('Playbooks', 'playbooks', () => ws.playbooks);
      this.parseWorkspaceToMenu('Secrets', 'secrets', () => ws.secrets);
      this.parseWorkspaceToMenu('Passwords', 'passwords', () => ws.passwords);
      this.parseWorkspaceToMenu('Group vars', 'group_vars', () => ws.groupVars);
      this.parseWorkspaceToMenu('Host vars', 'host_vars', () => ws.hostVars);
      this.parseWorkspaceToMenu('Shells', 'shells', () => ws.shells);
    })

    settingService.onGeneralSettingChange.subscribe({
      next: () => {
        this.ensibleFsService.triggerFetchWorkspace();
      }
    });
  }

  override async ngOnInit() {
    super.ngOnInit();
    // this.authenticatorService.ngOnInit();
    // this.ensibleFsService.triggerFetchWorkspace();
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
    return this.authenticatorService.getCurrentUserAliasOrUsername();
  }

  async addNewRole() {
    let name = await DialogUtils.openInputDialog(this.matDialog, 'Create new role', 'Role name', 'Create', 'Cancel');
    if(name) {
      let ws = await this.ensibleFsService.parseWorkspace();
      if(ws && !ws.isRoleExist(name)) {
        this.ensibleFsService.writeFile(`roles/${name}/tasks/main.yml`, '---', FsWriteMode.SKIP).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
          next: () => {
            this.ensibleFsService.triggerFetchWorkspace();
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
          this.ensibleFsService.triggerFetchWorkspace();
          this.router.navigate([environment.endpoint_home]);
        },
        error: (err) => {
          DialogUtils.openConfirmDialog(this.matDialog, 'Error', 'Error when deleting role', 'Ok', '');
        }
      });
    }
  }

}
