import { Component, OnInit } from '@angular/core';
import { EnsibleOpenIdProviderService } from '../service/ensible-open-id-provider/ensible-open-id-provider.service';
import { EnsibleOpenIDProvider, EnsibleUserGroup } from '../model/ensible.model';
import { RxJSUtils } from 'projects/viescloud-utils/src/lib/util/RxJS.utils';
import { DataUtils } from 'projects/viescloud-utils/src/lib/util/Data.utils';
import { FileUtils } from 'projects/viescloud-utils/src/lib/util/File.utils';
import { OpenIdWellKnown } from 'projects/viescloud-utils/src/lib/model/open-id.model';
import { DialogUtils } from 'projects/viescloud-utils/src/lib/util/Dialog.utils';
import { RouteUtils } from 'projects/viescloud-utils/src/lib/util/Route.utils';
import { MatOption } from 'projects/viescloud-utils/src/lib/model/mat.model';
import { EnsibleUserGroupService } from '../service/ensible-user-group/ensible-user-group.service';
import { FixChangeDetection } from 'projects/viescloud-utils/src/lib/directive/FixChangeDetection';

@Component({
  selector: 'app-ensible-open-id-provider',
  templateUrl: './ensible-open-id-provider.component.html',
  styleUrls: ['./ensible-open-id-provider.component.scss'],
})
export class EnsibleOpenIdProviderComponent extends FixChangeDetection implements OnInit {

  openIdProviders: EnsibleOpenIDProvider[] = [];
  blankOpenIdProvider: EnsibleOpenIDProvider = new EnsibleOpenIDProvider();

  selectedOpenIdProvider?: EnsibleOpenIDProvider;
  selectedOpenIdProviderCopy!: EnsibleOpenIDProvider;

  userGroups: EnsibleUserGroup[] = [];
  blankUserGroup = new EnsibleUserGroup();
  userGroupsOptions: MatOption<EnsibleUserGroup>[] = [];

  configurationURL: string = "";

  validForm = false;

  claimSupporteds: string[] = [];

  constructor(
    private openIdService: EnsibleOpenIdProviderService,
    private rxjsUtils: RxJSUtils,
    private dialogUtils: DialogUtils,
    private ensibleUserGroupService: EnsibleUserGroupService
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

  selectOpenIdProvider(openIdProvider: EnsibleOpenIDProvider | undefined) {
    this.configurationURL = "";
    this.selectedOpenIdProvider = openIdProvider;

    if(openIdProvider)
      this.selectedOpenIdProviderCopy = structuredClone(openIdProvider);
  }

  addNewProvider() {
    this.selectOpenIdProvider(DataUtils.purgeValue(new EnsibleOpenIDProvider()));
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
    this.ensibleUserGroupService.getAll().pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
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
    this.ensibleUserGroupService.openDialog(this.dialogUtils.matDialog, 0, this.blankUserGroup).subscribe({
      next: res => {
        this.fetchUserGroups();
      }
    });
  }
}
