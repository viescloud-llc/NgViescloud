import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { first } from 'rxjs';
import { RouteDialog, RouteDialogData } from './route-dialog/route-dialog.component';
import { Route, SwaggerMethodName, SwaggerPath, Swaggers, UserRole } from 'projects/viescloud-utils/src/lib/model/Authenticator.model';
import { AuthenticatorService } from 'projects/viescloud-utils/src/lib/service/authenticator.service';
import { UtilsService } from 'projects/viescloud-utils/src/lib/service/utils.service';
import { InputDialog } from 'projects/viescloud-utils/src/lib/dialog/input-dialog/input-dialog.component';

@Component({
  selector: 'app-auto-route',
  templateUrl: './auto-route.component.html',
  styleUrls: ['./auto-route.component.scss']
})
export class AutoRouteComponent implements OnInit {

  swaggers!: Swaggers[];
  routes!: Route[]; //original
  tempRoutes!: Route[]; //to be change
  userRoles: UserRole[] = [];
  searchText: string = '';
  blankPath: SwaggerPath = new SwaggerPath();

  constructor(private authenticatorService: AuthenticatorService, private matDialog: MatDialog, private utils: UtilsService) { }

  ngOnInit() {
    this.authenticatorService.getSwagger().pipe(UtilsService.waitLoadingDialog(this.matDialog)).subscribe({
      next: res => {
        this.swaggers = res;
      }
    });

    this.authenticatorService.getRoutes().pipe(UtilsService.waitLoadingDialog(this.matDialog)).subscribe({
      next: res => {
        this.routes = res ?? [];
        this.tempRoutes = structuredClone(this.routes);
      }
    });

    this.updateUserRoles();
  }

  private updateUserRoles() {
    this.authenticatorService.getUserRoles().pipe(UtilsService.waitLoadingDialog(this.matDialog)).subscribe({
      next: res => {
        this.userRoles = res;
      }
    });
  }

  processPath(paths: SwaggerPath[]): SwaggerPath[] {
    let newPaths: SwaggerPath[] = [];

    paths.forEach(e => {
      if(!newPaths.some(path => path.path === e.path))
        newPaths.push(e);
    })
    
    return newPaths;
  }

  containIgnoreCase(target: string, text: string) {
    return target.toLowerCase().match(text.toLowerCase());
  }

  getRoutes(absolutePath: string): Route[] {
    return  this.tempRoutes.filter(e => e.path === absolutePath)
  }

  editGlobalRule(prefix: string) {
    console.log(this.tempRoutes);
    console.log(this.routes);
    if(prefix.charAt(0) !== '/')
      prefix = `/${prefix}`;

    let absolutePath = `${prefix}/.*`;
    let swaggerMethods: string[] = [];
    for(let method in SwaggerMethodName) 
      swaggerMethods.push(method);
    
    this.editRule(absolutePath, swaggerMethods);
  }

  editRuleFromSwaggerPath(swaggerPath: SwaggerPath) {
    let methods: string[] = [];
    swaggerPath.method?.forEach(e => methods.push(e.name!));
    this.editRule(swaggerPath.path!, methods, swaggerPath);
  }

  editRule(path: string, swaggerMethods: string[], swaggerPath?: SwaggerPath) {
    let selectedRoutes = this.getRoutes(path);
    let routeDialogData: RouteDialogData = {
      absolutePath: path,
      selectedRoutes: selectedRoutes,
      userRoles: this.userRoles,
      swaggerMethods: swaggerMethods,
      swaggerPath: swaggerPath
    }

    let dialog = this.matDialog.open(RouteDialog, {data: {routeDialogData}, width: "100%"});

    dialog.afterClosed().subscribe({
      next: res => {
        let newRoutes: Route[] = res;
        swaggerMethods.forEach(method => {
          let index1 = newRoutes.findIndex(e => e ? e.path === path && e.method === method : false);
          let index2 = this.tempRoutes.findIndex(e => e.path === path && e.method === method);
          if(index1 >= 0) {
            if(index2 >= 0)
              this.tempRoutes[index2] = newRoutes[index1];
            else
              this.tempRoutes.push(newRoutes[index1]);
          }
          else {
            if(index2 >= 0)
              this.tempRoutes.splice(index2, 1);
          }
        })
      }
    })
  }

  isRouteChange() {
    return UtilsService.isNotEqual(this.routes, this.tempRoutes);
  }

  exportRoute() {
    let dialog = this.matDialog.open(InputDialog, {
      width: '100%',
      data: { title: 'Save as', label: 'File Name', defaultValue: 'RouteList', input: 'Route'} 
    })
    
    dialog.afterClosed().pipe(first()).subscribe(
      res => {
        if (res)
          this.utils.saveFile(res + '.json', "application/json", JSON.stringify(this.tempRoutes));
      }
    );
  }

  async importRoutes() {
    let file = await this.utils.uploadFile('application/json');
    if(file.type === 'application/json') {
      let newRoutes: Route[] = JSON.parse(file.value);
      this.tempRoutes = structuredClone(newRoutes);
    }
  }

  revert() {
    this.tempRoutes = structuredClone(this.routes);
  }

  save() {
    this.authenticatorService.syncRoutes(this.tempRoutes).pipe(UtilsService.waitLoadingDialog(this.matDialog)).subscribe({
      next: res => {
        this.updateUserRoles();
        this.routes = res;
        this.tempRoutes = structuredClone(res);
      }
    });
  }
}

