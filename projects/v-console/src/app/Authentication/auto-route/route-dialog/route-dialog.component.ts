import { AfterContentChecked, ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Route, SwaggerPath, UserRole } from 'projects/viescloud-utils/src/lib/model/Authenticator.model';
import { MatOption } from 'projects/viescloud-utils/src/lib/model/Mat.model';

export interface RouteDialogData {
  selectedRoutes: Route[];
  userRoles: UserRole[];
  absolutePath: string;
  swaggerMethods: string[];
  swaggerPath?: SwaggerPath;
}

@Component({
  selector: 'app-route-dialog',
  templateUrl: './route-dialog.component.html',
  styleUrls: ['./route-dialog.component.scss']
})
export class RouteDialog implements OnInit, AfterContentChecked {

  routeDialogData!: RouteDialogData;
  defaultRole!: UserRole;
  defaultSecure: boolean = true;
  userRoleOptions: MatOption<any>[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: {routeDialogData: RouteDialogData},
    private cd: ChangeDetectorRef,
  ) {}

  ngAfterContentChecked(): void {
    this.cd.detectChanges();
  }

  ngOnInit(): void {
    this.routeDialogData = this.data.routeDialogData;
    let userRoleIndex = this.routeDialogData.userRoles.findIndex(e => e.name?.toLowerCase() === 'normal' || e.level === 1);
    if(userRoleIndex < 0)
      userRoleIndex = 0;
    this.defaultRole = this.routeDialogData.userRoles[userRoleIndex];

    this.routeDialogData.userRoles.forEach(e => {
      this.userRoleOptions.push({
        value: e.id,
        valueLabel: e.name!
      })
    })
  }

  setDefaultRole(id: number) {
    this.routeDialogData.userRoles.forEach(e => {
      if(e.id === id) {
        this.defaultRole = e;
        return;
      }
    })
  }

  trackByIndex(index: number, obj: any): any {
    return index;
  }

  isMissingAnyMethod() {
    return this.routeDialogData.swaggerMethods.some(e => this.isMissingMethod(e));
  }

  isMissingMethod(name: string) {
    return !this.routeDialogData.selectedRoutes.some(e => e.method === name);
  }

  pushNewRoute(method: string) {
    let index = this.routeDialogData.swaggerMethods.findIndex(e => e === method);
    
    if (!this.routeDialogData.selectedRoutes.some(r => r.method === method)) {
      this.routeDialogData.selectedRoutes[index] = {
        id: 0,
        method: method,
        path: this.routeDialogData.absolutePath,
        secure: this.defaultSecure,
        roles: [this.defaultRole]
      };
    }
  }

  pushAllMissingRoute() {
    this.routeDialogData.swaggerMethods.forEach(method => {
      this.pushNewRoute(method);
    })
  }

  removeRoute(route: Route) {
    let index = this.routeDialogData.selectedRoutes.findIndex(e => e.method === route.method);
    this.routeDialogData.selectedRoutes.splice(index, 1);
  }

  getDescription(route: Route): string {
    let description = 'None';
    if(!this.routeDialogData.swaggerPath)
      return description;

    let method = route.method!;
    this.routeDialogData.swaggerPath.method?.forEach(e => {
      if(e.name === method) {
        description = e.summary ?? 'None';
        return;
      }
    })

    return description;
  }

  getOperationById(route: Route): string {
    let operationById = 'None';
    if(!this.routeDialogData.swaggerPath)
      return operationById;

    let method = route.method!;
    this.routeDialogData.swaggerPath.method?.forEach(e => {
      if(e.name === method) {
        operationById = e.operationId ?? 'None';
        return;
      }
    })

    return operationById;
  }
  
}
