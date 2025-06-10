import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialog } from 'projects/viescloud-utils/src/lib/dialog/confirm-dialog/confirm-dialog.component';
import { Route, UserRole } from 'projects/viescloud-utils/src/lib/model/authenticator.model';
import { MatOption } from 'projects/viescloud-utils/src/lib/model/mat.model';
import { AuthenticatorService } from 'projects/viescloud-utils/src/lib/service/authenticator.service';
import { first } from 'rxjs';

@Component({
  selector: 'app-route-panel',
  templateUrl: './route-panel.component.html',
  styleUrls: ['./route-panel.component.scss']
})
export class RoutePanelComponent implements OnInit {

  options: MatOption<any>[] = [
    {value: '.*', valueLabel: 'Anything wild card'},
    {value: '[abc]', valueLabel: 'Matches a or b, or c.'},
    {value: '[^abc]', valueLabel: 'Negation, matches everything except a, b, or c.'},
    {value: '[a-c]', valueLabel: 'Range, matches a or b, or c.'},
    {value: '[a-c[f-h]]', valueLabel: 'Union, matches a, b, c, f, g, h.'},
    {value: '[a-c&&[b-c]]', valueLabel: 'Intersection, matches b or c.'},
    {value: '[a-c&&[^b-c]]', valueLabel: 'Subtraction, matches a.'},
    {value: '.', valueLabel: 'Any character.'},
    {value: '\\d', valueLabel: 'A digit: [0-9]'},
    {value: '\\D', valueLabel: 'A non-digit: [^0-9]'},
    {value: '\\s', valueLabel: 'A whitespace character: [ \\t\\n\\x0B\\f\\r]'},
    {value: '\\S', valueLabel: 'A non-whitespace character: [^\\s]'},
    {value: '\\w', valueLabel: 'A word character: [a-zA-Z_0-9]'},
    {value: '\\W', valueLabel: 'A non-word character: [^\\w]'},
    {value: '^', valueLabel: 'The beginning of a line.'},
    {value: '$', valueLabel: 'The end of a line.'},
    {value: '\\b', valueLabel: 'A word boundary.'},
    {value: '\\B', valueLabel: 'A non-word boundary.'},
    {value: '\\A', valueLabel: 'The beginning of the input.'},
    {value: '\\G', valueLabel: 'The end of the previous match.'},
    {value: '\\Z', valueLabel: 'The end of the input but for the final terminator, if any.'},
    {value: '\\z', valueLabel: 'The end of the input.'},
  ]

  @Input()
  route!: Route;

  routeCopy!: Route;

  @Input()
  userRoles!: UserRole[];

  @Input()
  displayPath = true;

  @Input()
  displayWildCard = true;

  @Input()
  displayFunctionalButton = true;

  @Input()
  disableMethodInput = false;

  @Output()
  onValueChange: EventEmitter<Route> = new EventEmitter();

  @Output()
  editEvent: EventEmitter<Route> = new EventEmitter();

  @Output()
  deleteEvent: EventEmitter<Route> = new EventEmitter();

  @Output()
  onDeleteMethod: EventEmitter<string> = new EventEmitter();

  wildCard: string = '';

  constructor(private authenticatorService: AuthenticatorService, private matDialog: MatDialog) { }

  ngOnInit() {
    if(!this.route.roles)
      this.route.roles = [];
    this.reset();
  }

  addNewRole(userRoles: UserRole[]): void {
    const random = Math.floor(Math.random() * this.userRoles.length);
    let role = structuredClone(this.userRoles[random]);
    userRoles.push(role);
  }

  isChange(): boolean {
    let isChange = JSON.stringify(this.route) !== JSON.stringify(this.routeCopy);

    if(isChange)
      this.onValueChange.emit(this.routeCopy);

    return isChange;
  }

  reset(): void {
    this.routeCopy = structuredClone(this.route);
    this.onValueChange.emit(this.routeCopy);
  }
  
  save(): void {
    this.authenticatorService.patchRoute(this.routeCopy).pipe(first()).subscribe(
      res => {
        this.route = res;
        this.editEvent.emit(this.route);
        this.reset();
      }
    );
  }

  remove(): void {
    let dialog = this.matDialog.open(ConfirmDialog, {data: {title: `Deleting route id: ${this.routeCopy.id}`, message: "Are you sure you want to delete this route?"}});

    dialog.afterClosed().pipe(first()).subscribe(
      res => {
        if(res) {
          this.deleteEvent.emit(this.route);
        }
      }
    );
  }

  removeRole(i: number): void {
    this.routeCopy.roles!.splice(i, 1);
  }

  addWildCard() {
    this.routeCopy.path += this.wildCard;
  }

  getRemainingRole() {
    let roles: UserRole[] = [];
    this.userRoles.forEach(role => {
      if(!this.route.roles?.some(e => e.id === role.id))
        roles.push(role);
    })

    return roles;
  }

  isUserRoleExist(userRole: UserRole) {
    return this.routeCopy.roles?.some(r => r.id === userRole.id);
  }
}
