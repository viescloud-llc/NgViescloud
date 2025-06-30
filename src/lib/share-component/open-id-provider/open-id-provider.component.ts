import { Component, OnInit } from '@angular/core';
import { RxJSUtils } from '../../util/RxJS.utils';
import { DataUtils } from '../../util/Data.utils';
import { OpenIDProvider } from '../../model/open-id.model';
import { DialogUtils } from '../../util/Dialog.utils';
import { RouteUtils } from '../../util/Route.utils';
import { MatOption } from '../../model/mat.model';
import { FixChangeDetection } from '../../abtract/FixChangeDetection';
import { UserGroup } from '../../model/authenticator.model';
import { UserGroupService } from '../../service/user-group.service';
import { OpenIdProviderService } from '../../service/open-id-provider.service';

@Component({
  selector: 'app-open-id-provider',
  templateUrl: './open-id-provider.component.html',
  styleUrls: ['./open-id-provider.component.scss'],
  standalone: false
})
export class OpenIdProviderComponent extends FixChangeDetection implements OnInit {

  openIdProviders: OpenIDProvider[] = [];
  blankOpenIdProvider: OpenIDProvider = new OpenIDProvider();

  selectedOpenIdProvider?: OpenIDProvider;
  selectedOpenIdProviderCopy!: OpenIDProvider;

  userGroups: UserGroup[] = [];
  blankUserGroup = new UserGroup();
  userGroupsOptions: MatOption<UserGroup>[] = [];

  configurationURL: string = "";

  validForm = false;

  claimSupporteds: string[] = [];

  constructor(
    private openIdService: OpenIdProviderService,
    private rxjsUtils: RxJSUtils,
    private dialogUtils: DialogUtils,
    private UserGroupService: UserGroupService
  ) {
    super();
  }

  ngOnInit(): void {
    this.fetchUserGroups();
    this.openIdService.getAll().pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: res => {
        this.openIdProviders = res;
      }
    })
  }

  selectOpenIdProvider(openIdProvider: OpenIDProvider | undefined) {
    this.configurationURL = "";
    this.selectedOpenIdProvider = openIdProvider;

    if(openIdProvider)
      this.selectedOpenIdProviderCopy = structuredClone(openIdProvider);
  }

  addNewProvider() {
    this.selectOpenIdProvider(DataUtils.purgeValue(new OpenIDProvider()));
  }

  isValueChange() {
    return DataUtils.isNotEqual(this.selectedOpenIdProvider, this.selectedOpenIdProviderCopy);
  }

  save() {
    if(this.validForm) {
      this.openIdService.postOrPut(this.selectedOpenIdProvider?.id ,this.selectedOpenIdProvider!).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
        next: res => {
          this.selectOpenIdProvider(res);
          this.ngOnInit();
        },
        error: err => {
          this.dialogUtils.openErrorMessageFromError(err);
        }
      })
    }
  }

  revert() {
    this.selectedOpenIdProvider = structuredClone(this.selectedOpenIdProviderCopy);
  }

  async deleteProvider() {
    if(!this.selectedOpenIdProvider)
      return;

    let confirm = await this.dialogUtils.openConfirmDialog('Delete', 'Are you sure you want to delete this provider?', 'Yes', 'Cancel');
    if(!confirm)
      return;

    this.openIdService.delete(this.selectedOpenIdProvider!.id!).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: res => {
        this.selectOpenIdProvider(undefined);
        this.ngOnInit();
      }
    })
  }

  autoFill(force: boolean = false) {
    if(this.configurationURL && RouteUtils.isValidUrl(this.configurationURL)) {
      this.openIdService.getWellKnown(this.configurationURL).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
        next: res => {
          if(this.selectedOpenIdProvider) {

            if(!this.selectedOpenIdProvider.name || force)
              this.selectedOpenIdProvider.name = new URL(this.configurationURL).hostname;

            if(!this.selectedOpenIdProvider.description || force)
              this.selectedOpenIdProvider.description = "Auto fill from " + this.configurationURL;

            if(!this.selectedOpenIdProvider.authorizationEndpoint || force)
              this.selectedOpenIdProvider.authorizationEndpoint = res.authorization_endpoint ?? this.selectedOpenIdProvider.authorizationEndpoint;

            if(!this.selectedOpenIdProvider.tokenEndpoint || force)
            this.selectedOpenIdProvider.tokenEndpoint = res.token_endpoint ?? this.selectedOpenIdProvider.tokenEndpoint;

            if(!this.selectedOpenIdProvider.userInfoEndpoint || force)
            this.selectedOpenIdProvider.userInfoEndpoint = res.userinfo_endpoint ?? this.selectedOpenIdProvider.userInfoEndpoint;

            if(!this.selectedOpenIdProvider.endSessionEndpoint || force)
              this.selectedOpenIdProvider.endSessionEndpoint = res.end_session_endpoint ?? this.selectedOpenIdProvider.endSessionEndpoint;

            this.claimSupporteds = [...res.claims_supported ?? []];
          }
        },
        error: err => {
          this.dialogUtils.openErrorMessageFromError(err);
        }
      })
    }
    else {
      this.dialogUtils.openErrorMessage('Invalid URL', 'Please enter a valid URL');
    }
  }

  private fetchUserGroups() {
    this.UserGroupService.getAll().pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: res => {
        this.userGroups = res;
        this.userGroupsOptions = [];
        this.userGroups.forEach(userGroup => {
          this.userGroupsOptions.push({
            value: userGroup,
            valueLabel: userGroup.name
          });
        });
      }
    });
  }

  addUserGroup() {
    this.UserGroupService.openDialog(this.dialogUtils.matDialog, 0, this.blankUserGroup).subscribe({
      next: res => {
        this.fetchUserGroups();
      }
    });
  }
}
