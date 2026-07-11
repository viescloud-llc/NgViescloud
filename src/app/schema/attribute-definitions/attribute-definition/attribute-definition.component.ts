import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgComponentModule } from '../../../../lib/module/ng-component.module';
import { AttributeDefinition, AttributeOption, ProductAttributeType } from '../../../shared/model/attribute.model';
import { AttributeDefinitionService } from '../../../shared/service/attribute-definition/attribute-definition.service';
import { AttributeOptionService } from '../../../shared/service/attribute-option/attribute-option.service';
import { ViesRestApi } from '../../../../lib/abtract/ViesRestApi';
import { RouteUtils } from '../../../../lib/util/Route.utils';
import { MatOption } from '../../../../lib/model/mat.model';
import { APP_ROUTES } from '../../../app.routes';
import { AttributeOptionCreateDialog } from './attribute-option-create-dialog/attribute-option-create-dialog.component';

@Component({
  selector: 'app-attribute-definition',
  templateUrl: './attribute-definition.component.html',
  styleUrls: ['./attribute-definition.component.scss'],
  imports: [NgComponentModule]
})
export class AttributeDefinitionComponent extends ViesRestApi<AttributeDefinition, AttributeDefinitionService> implements OnInit {

  service = inject(AttributeDefinitionService);
  attributeOptionService = inject(AttributeOptionService);
  activatedRoute = inject(ActivatedRoute);
  validForm = signal<boolean>(false);

  // Expose enum to template for @if on value.type.
  readonly Type = ProductAttributeType;

  // When the admin arrives here via the "Create new attribute definition" button
  // on the product editor, a `?returnToProduct=<uuid>` query param is set. We
  // capture it once on init and surface a "Back to product" button so the admin
  // has a one-click return path even after saving the new definition.
  returnToProductId = signal<string | null>(null);

  // Blank instance for each new option added via the inline list editor.
  readonly blankOption = new AttributeOption();

  // Show the owned-options editor and the search/popup add controls only when
  // the type actually uses options.
  showOptions = computed(() => {
    const t = this.value()?.type;
    return t === ProductAttributeType.SELECT || t === ProductAttributeType.MULTI_SELECT;
  });

  // Global pool of existing AttributeOption records for the search-add picker.
  // Fetched once on init; admins can also create a new orphan option via the
  // popup, but the popup just adds locally — the global pool is only used as a
  // copy source for re-using existing labels across definitions.
  globalOptions = signal<AttributeOption[]>([]);
  globalMatOptions = computed<MatOption<AttributeOption>[]>(() =>
    this.globalOptions().map(opt => ({
      value: opt,
      valueLabel: opt.displayValue || opt.value
    }))
  );

  // Reset signal that lets us blank the search input after a pick.
  searchPick = signal<AttributeOption | null>(null);

  override getRouteId() {
    // URL is one of:
    //   /schema/attribute-definitions/new      → create mode, return null
    //   /schema/attribute-definitions/<uuid>   → edit mode, return the uuid
    const id = RouteUtils.getPathVariable('attribute-definitions');
    return id === 'new' ? null : id;
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.refreshGlobalOptions();

    // Pick up the one-time "return to product" hint from the query param. It
    // stays in the URL until the admin navigates elsewhere — so the "Back to
    // product" button remains available even after saving the new definition,
    // but is naturally forgotten as soon as they leave this page.
    const returnId = this.activatedRoute.snapshot.queryParamMap.get('returnToProduct');
    if (returnId) this.returnToProductId.set(returnId);
  }

  // Navigate back to the product editor that sent us here.
  backToProduct() {
    const id = this.returnToProductId();
    if (!id) return;
    this.router.navigate([APP_ROUTES.catalogProduct(id)]);
  }

  private refreshGlobalOptions() {
    this.attributeOptionService.getAll().subscribe({
      next: res => this.globalOptions.set(res),
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }

  // Force a new top-level reference so the `value` model signal actually fires —
  // the dynamic form mutates the bound object in place and re-emits the same
  // reference, which signal equality treats as a no-op. Without this spread,
  // changing Type (or any other field) wouldn't trigger the `showOptions`
  // computed and the options editor would stay hidden.
  onMainFormChange(v: AttributeDefinition) {
    this.value.set({ ...v });
  }

  // Handler for the search-add input. The picked option is shallow-cloned but
  // its `id` is PRESERVED — the backend dedupes by id on the cascade-save, so
  // the existing AttributeOption row gets attached rather than a duplicate being
  // created. We still spread (`{ ...picked }`) to break the reference to the
  // global-pool entry so subsequent inline edits don't mutate the shared object.
  addFromExisting(picked: AttributeOption | null | undefined) {
    if (!picked) return;
    const def = this.value();
    if (!def) return;
    if (!def.options) def.options = [];
    def.options.push({ ...picked });
    this.value.set({ ...def });
    this.searchPick.set(null);
  }

  // Open the focused-create popup. On save, the dialog returns a brand-new
  // AttributeOption (no id) that we push into local list. No backend roundtrip
  // — the cascade-save on the parent persists it as a fresh row.
  openCreateOptionDialog() {
    this.dialogUtils.matDialog
      .open(AttributeOptionCreateDialog, { width: '480px' })
      .afterClosed()
      .subscribe((opt: AttributeOption | undefined) => {
        if (!opt) return;
        const def = this.value();
        if (!def) return;
        if (!def.options) def.options = [];
        def.options.push({ ...opt });
        this.value.set({ ...def });
      });
  }

  // Normalize sortOrder to match the array's current order. Drag-reorder via
  // `<app-mat-form-field-input-list>` shuffles the array but doesn't touch the
  // sortOrder field; we make them consistent at save time so the next GET renders
  // in the same order the admin just arranged.
  override save() {
    const def = this._value.value();
    if (def?.options?.length) {
      def.options.forEach((opt, i) => opt.sortOrder = i);
    }
    super.save();
  }

  // Cascade-delete with the count of owned options surfaced in the prompt
  // (intent § 7.6). Then navigate back to the definitions list rather than the
  // default `/home`.
  override async remove() {
    if (!this.id()) return;
    const optionCount = this.value()?.options?.length ?? 0;
    const confirmed = await this.dialogUtils.openCascadeDeleteConfirm(
      'attribute definition',
      [{ label: 'option', count: optionCount }]
    );
    if (!confirmed) return;

    this.service.delete(this.id()).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: () => this.router.navigate([APP_ROUTES.schemaAttributeDefinitionList]),
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }
}
