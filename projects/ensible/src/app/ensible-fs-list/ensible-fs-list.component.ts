import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RouteChangeSubcribe } from 'projects/viescloud-utils/src/lib/directive/RouteChangeSubcribe.directive';
import { EnsibleFs, EnsibleFsDir, EnsibleWorkSpace } from '../model/ensible.parser.model';
import { RouteUtils } from 'projects/viescloud-utils/src/lib/util/Route.utils';
import { DataUtils } from 'projects/viescloud-utils/src/lib/util/Data.utils';
import { EnsibleFsService } from '../service/ensible-fs/ensible-fs.service';

@Component({
  selector: 'app-ensible-fs-list',
  templateUrl: './ensible-fs-list.component.html',
  styleUrls: ['./ensible-fs-list.component.scss']
})
export class EnsibleFsListComponent extends RouteChangeSubcribe {

  ensibleWorkspace!: EnsibleWorkSpace;
  ensibleFsDir?: EnsibleFsDir;
  blankEnsibleFs: EnsibleFs = new EnsibleFs();

  layers: string[] = [];

  constructor(
    route: ActivatedRoute,
    private ensibleFsService: EnsibleFsService,
    private router: Router
  ) {
    super(route);
  }

  override async onRouteChange() {
    this.layers = RouteUtils.getCurrentPath().split('/').splice(2);

    this.ensibleFsService.triggerFetchWorkspace(true).then((ws) => {
      this.ensibleWorkspace = ws;
      let rootLayer = this.layers[0];
      switch(rootLayer) {
        case 'roles':
          this.ensibleFsDir = this.getFsDirFromLayer() ?? DataUtils.purgeArray(new EnsibleFsDir());
          break;
        case 'inventory':
          this.ensibleFsDir = ws.inventory;
          break;
        case 'playbooks':
          this.ensibleFsDir = ws.playbooks;
          break;
        case 'secrets':
          this.ensibleFsDir = ws.secrets;
          break;
        case 'passwords':
          this.ensibleFsDir = ws.passwords;
          break;
        case 'group_vars':
          this.ensibleFsDir = ws.groupVars;
          break;
        case 'host_vars':
          this.ensibleFsDir = ws.hostVars;
          break;
        case 'shells':
          this.ensibleFsDir = ws.shells;
          break;
        default:
          this.ensibleFsDir = DataUtils.purgeArray(new EnsibleFsDir());
          break;
      }
    });
  }

  private getFsDirFromLayer() {
    let role = this.ensibleWorkspace.getRole(this.layers[1]);
    switch(this.layers[2]) {
      case 'defaults':
        return role?.defaults;
      case 'files':
        return role?.files;
      case 'handlers':
        return role?.handlers;
      case 'meta':
        return role?.meta;
      case 'tasks':
        return role?.tasks;
      case 'templates':
        return role?.templates;
      case 'vars':
        return role?.vars;
    }

    return undefined;
  }

  getLayerReverse(layer: number) {
    return this.layers[this.layers.length - 1 - layer];
  }

  onEditFs(fs: EnsibleFs) {
    let fullPath = '/file' + RouteUtils.formatValidUrlPath(this.layers.join('/') + '/' + fs.name);
    this.router.navigate([fullPath]);
  }

  onEditFsInNewTab(fs: EnsibleFs) {
    let fullPath = '/file' + RouteUtils.formatValidUrlPath(this.layers.join('/') + '/' + fs.name);
    window.open(fullPath, '_blank');
  }

  addNewFs() {
    let fullPath = '/file' + RouteUtils.formatValidUrlPath(this.layers.join('/') + '/new');
    this.router.navigate([fullPath]);
  }
}
