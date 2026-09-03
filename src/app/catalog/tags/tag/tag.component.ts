import { Component, inject, signal } from '@angular/core';
import { NgComponentModule } from '../../../../lib/module/ng-component.module';
import { ViesRestApi } from '../../../../lib/abtract/ViesRestApi';
import { RouteUtils } from '../../../../lib/util/Route.utils';
import { APP_ROUTES } from '../../../app.routes';
import { Tag } from '../../../shared/model/product.model';
import { TagService } from '../../../shared/service/tag/tag.service';

@Component({
  selector: 'app-tag',
  templateUrl: './tag.component.html',
  styleUrls: ['./tag.component.scss'],
  imports: [NgComponentModule]
})
export class TagComponent extends ViesRestApi<Tag, TagService> {

  service = inject(TagService);
  validForm = signal<boolean>(false);

  override getRouteId() {
    // URL is /catalog/tags/new (create) or /catalog/tags/<uuid> (edit).
    const id = RouteUtils.getPathVariable('tags');
    return id === 'new' ? null : id;
  }

  // After a create, leave /new for the entity's real edit URL so
  // refresh/bookmark/back work.
  protected override afterSave(res: Tag, wasCreate: boolean): void {
    if (wasCreate && res.id) {
      this.router.navigate([APP_ROUTES.catalogTag(res.id)]);
    }
  }

  // Tags have no owned children, so no dep counts to surface. Route through the
  // cascade-confirm helper anyway for the consistent prompt, then navigate back
  // to the tag list rather than the default `/home`.
  override async remove() {
    if (!this.id()) return;
    const confirmed = await this.dialogUtils.openCascadeDeleteConfirm('tag', []);
    if (!confirmed) return;

    this.service.delete(this.id()).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: () => this.router.navigate([APP_ROUTES.catalogTagList]),
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }
}
