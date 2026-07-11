import { Component, inject, signal } from '@angular/core';
import { NgComponentModule } from "../../../../lib/module/ng-component.module";
import { AttributeOption } from '../../../shared/model/attribute.model';
import { AttributeOptionService } from '../../../shared/service/attribute-option/attribute-option.service';
import { RouteUtils } from '../../../../lib/util/Route.utils';
import { ViesRestApi } from '../../../../lib/abtract/ViesRestApi';
import { APP_ROUTES } from '../../../app.routes';

@Component({
  selector: 'app-attribute-option',
  templateUrl: './attribute-option.component.html',
  styleUrls: ['./attribute-option.component.scss'],
  imports: [NgComponentModule]
})
export class AttributeOptionComponent extends ViesRestApi<AttributeOption, AttributeOptionService> {

  service: AttributeOptionService = inject(AttributeOptionService);
  validForm = signal<boolean>(false);

  override getRouteId(): string | number | null | undefined {
    // URL is /schema/attribute-options/new (create) or /schema/attribute-options/<uuid> (edit).
    const id = RouteUtils.getPathVariable('attribute-options');
    return id === 'new' ? null : id;
  }

  // AttributeOption has no owned children, so no dep counts to surface. We still
  // route through the cascade helper for the consistent "Delete X?" prompt and
  // navigate back to the options list rather than the default `/home`.
  override async remove() {
    if (!this.id()) return;
    const confirmed = await this.dialogUtils.openCascadeDeleteConfirm('attribute option', []);
    if (!confirmed) return;

    this.service.delete(this.id()).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: () => this.router.navigate([APP_ROUTES.schemaAttributeOptionList]),
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }
}
