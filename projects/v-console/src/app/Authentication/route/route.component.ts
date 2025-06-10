import { Component, OnDestroy, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { InputDialog } from 'projects/viescloud-utils/src/lib/dialog/input-dialog/input-dialog.component';
import { Route, UserRole } from 'projects/viescloud-utils/src/lib/model/authenticator.model';
import { AuthenticatorService } from 'projects/viescloud-utils/src/lib/service/authenticator.service';
import { UtilsService } from 'projects/viescloud-utils/src/lib/service/utils.service';
import { first } from 'rxjs';

interface RecommendPath {
  path: string;
  fullPath: string;
}

@Component({
  selector: 'app-route',
  templateUrl: './route.component.html',
  styleUrls: ['./route.component.scss']
})
export class RouteComponent implements OnInit, OnDestroy {

  private setting = {
    element: {
      dynamicDownload: HTMLElement
    }
  }

  routes: Route[] = [];
  userRoles: UserRole[] = [];
  path: string = "/";

  intervalMs = 3000; //3s
  interval: any;

  constructor(
    private authenticatorService: AuthenticatorService,
    private utils: UtilsService,
    private matDialog: MatDialog
  ) { }

  ngOnDestroy(): void {
    clearInterval(this.interval);
  }

  ngOnInit() {
    this.updateRoutes();
    this.updateUserRoles();

    this.interval = setInterval(() => {
      this.updateRoutes();
      this.updateUserRoles();
    }, this.intervalMs);
  }

  updateUserRoles(): void {
    this.authenticatorService.getUserRoles().pipe(first()).subscribe(
      res => {
        this.userRoles = res
      }
    );
  }

  updateRoutes(): void {
    this.authenticatorService.getRoutes().pipe(first()).subscribe(
      res => {
        if(JSON.stringify(this.routes) !== JSON.stringify(res))
          this.routes = res;
      }
    );
  }

  getExactRoutes(): Route[] {
    let filterRoutes: Route[];
    let cPath = this.path.endsWith('/') ? this.path.substring(0, this.path.length - 1) : this.path;
    filterRoutes = this.routes.filter((r) => {
      return r.path === cPath;
    })
    return filterRoutes;
  }

  getFilterRoutes(): Route[] {
    let filterRoutes: Route[];
    filterRoutes = this.routes.filter((r) => {
      return r.path!.includes(this.path) && r.path !== this.path;
    })
    return filterRoutes;
  }

  getRecommendPath(): RecommendPath[] {
    let filterRoutes = this.getFilterRoutes();
    let recommendPaths: RecommendPath[] = [];
    let numberOfDash: number = this.path.split('/').length - 1;
    filterRoutes.forEach(e => {
      let splits = e.path!.split('/');
      while (splits.length > numberOfDash + 1)
        splits.pop();
      let rPath = splits[splits.length - 1];
      let fPath = splits.join('/');

      let recommendPath: RecommendPath = {
        path: rPath,
        fullPath: fPath
      }

      if (!recommendPaths.some(e => e.fullPath === recommendPath.fullPath))
        recommendPaths.push({ path: rPath, fullPath: fPath });

    })

    return recommendPaths;
  }

  moveToRoute(route: string): void {
    this.path = route + '/';
  }

  editRoute(route: Route): void {
    for (let i = 0; i < this.routes.length; i++) {
      if (this.routes[i].id === route.id) {
        this.routes[i] = route;
        break;
      }
    }
  }

  addNewRoute(): void {
    let cPath = this.path.endsWith('/') ? this.path.substring(0, this.path.length - 1) : this.path;

    let newRoute: Route = {
      path: cPath,
      method: 'GET',
      secure: false,
      roles: []
    };

    this.authenticatorService.postRoute(newRoute).pipe(first()).subscribe(
      res => {
        this.routes.push(res);
      }
    );
  }

  deleteRoute(route: Route): void {
    this.authenticatorService.deleteRoute(route.id!).pipe(first()).subscribe(
      res => {
        this.updateRoutes();
      }
    );
  }

  goBackRoute(): void {
    if (this.path.charAt(this.path.length - 1) === '/')
      this.path = this.path.substring(0, this.path.lastIndexOf("/"));

    this.path = this.path.substring(0, this.path.lastIndexOf("/")) + '/';

    if (this.path === '')
      this.path = '/';
  }

  validatorFn(value: string) {
    if (!value.startsWith('/'))
      return "Path need to start with /"

    return "";
  }

  exportRoute() {
    let dialog = this.matDialog.open(InputDialog, {
      width: '100%',
      data: { title: 'Save as', label: 'File Name', defaultValue: 'RouteList', input: 'Route'} 
    })
    
    dialog.afterClosed().pipe(first()).subscribe(
      res => {
        if (res)
          this.utils.saveFile(res + '.json', "application/json", JSON.stringify(this.routes));
      }
    );
  }

  async replaceRoutes() {
    let file = await this.utils.uploadFile('application/json');
    if(file.type === 'application/json') {
      let newRoutes: Route[] = JSON.parse(file.value);
      let matchRoutes: Route[] = [];

      //add new route
      await newRoutes.forEach(async e => {
        let match = this.routes.find(r => this.equal(e, r));
        if(match)
          matchRoutes.push(match);
        else
          await this.postRoute(e);
      })

      //remove not match route
      await this.routes.forEach(async e => {
        let match = matchRoutes.find(r => this.equal(e, r))
        if(!match)
          await this.removeRoute(e);
      })
    }
  }

  async patchAndAddRoutes() {
    let file = await this.utils.uploadFile('application/json');
    if(file.type === 'application/json') {
      let newRoutes: Route[] = JSON.parse(file.value);

      //add if missing
      await newRoutes.forEach(async e => {
        let match = this.routes.find(r => this.equal(e, r));
        let matchById = this.routes.find(r => r.id = e.id);

        if(matchById)
          await this.patchRoute(e);

        if(!match)
          await this.postRoute(e);
      })
    }
  }

  async addNewOnlyRoutes() {
    let file = await this.utils.uploadFile('application/json');
    if(file.type === 'application/json') {
      let newRoutes: Route[] = JSON.parse(file.value);

      //add if missing
      await newRoutes.forEach(async e => {
        let match = this.routes.find(r => this.equal(e, r));

        if(!match)
          await this.postRoute(e);
      })
    }
  }

  equal(route1: Route, route2: Route) {
    let r1 = structuredClone(route1);
    let r2 = structuredClone(route2);
    r1.id = 0;
    r2.id = 0;
    return JSON.stringify(r1) === JSON.stringify(r2);
  }

  async patchRoute(route: Route) {
    if(route.id) {
      return new Promise<void>((resolve, reject) => {
        this.authenticatorService.patchRoute(route).pipe(first()).subscribe(
          res => {},
          error => {},
          () => resolve()
        );
      })
    }
  }

  async postRoute(route: Route) {
    if(route.id) {
      return new Promise<void>((resolve, reject) => {
        this.authenticatorService.postRoute(route).pipe(first()).subscribe(
          res => {},
          error => {},
          () => resolve()
        );
      })
    }
  }

  async removeRoute(route: Route) {
    if(route.id) {
      return new Promise<void>((resolve, reject) => {
        this.authenticatorService.deleteRoute(route.id!).pipe(first()).subscribe(
          res => {},
          error => {},
          () => resolve()
        )
      })
    }
  }
  
}
