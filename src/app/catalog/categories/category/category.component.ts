import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgComponentModule } from '../../../../lib/module/ng-component.module';
import { ViesRestApi } from '../../../../lib/abtract/ViesRestApi';
import { RouteUtils } from '../../../../lib/util/Route.utils';
import { MatOption } from '../../../../lib/model/mat.model';
import { APP_ROUTES } from '../../../app.routes';
import { Category } from '../../../shared/model/product.model';
import { CategoryService } from '../../../shared/service/category/category.service';
import { AttributeDefinition } from '../../../shared/model/attribute.model';
import { AttributeDefinitionService } from '../../../shared/service/attribute-definition/attribute-definition.service';
import { CategoryQuickAddDialog } from './category-quick-add-dialog/category-quick-add-dialog.component';

@Component({
  selector: 'app-category',
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.scss'],
  imports: [NgComponentModule]
})
export class CategoryComponent extends ViesRestApi<Category, CategoryService> implements OnInit {

  service = inject(CategoryService);
  attributeDefinitionService = inject(AttributeDefinitionService);
  activatedRoute = inject(ActivatedRoute);
  validForm = signal<boolean>(false);

  // All categories — used to build the parent picker (after excluding self +
  // descendants for cycle prevention) AND to count children for cascade-delete.
  allCategories = signal<Category[]>([]);

  // All attribute definitions — pool for the M2M `attributeDefinitions` multi-select.
  allAttributeDefinitions = signal<AttributeDefinition[]>([]);

  // Parent picker options as MatOption<Category>[]. Value is the whole Category
  // (not just the id) so the lib's `<app-mat-form-field-input>` autocomplete can
  // look up the display label via its `displayFn` fallback. Excludes self and
  // all descendants (intent § 5.2 — cycle guard is client-side because the
  // backend has no FK on parentCategoryId).
  parentOptions = computed<MatOption<Category>[]>(() => {
    const all = this.allCategories();
    const current = this.value();
    const excluded = new Set<string>();
    if (current?.id) {
      excluded.add(current.id);
      this.collectDescendantIds(current.id, all, excluded);
    }
    return all
      .filter(cat => cat.id && !excluded.has(cat.id))
      .map(cat => ({ value: cat, valueLabel: cat.name || '(unnamed)' }));
  });

  // Selected parent Category derived from the current form's parentCategoryId.
  // Feeds the autocomplete's `[value]` so it can display the label properly.
  selectedParent = computed<Category | null>(() => {
    const parentId = this.value()?.parentCategoryId;
    if (!parentId) return null;
    return this.allCategories().find(c => c.id === parentId) ?? null;
  });

  // Attribute-definition pool mapped to MatOption for the M2M multi-select.
  attributeDefinitionOptions = computed<MatOption<AttributeDefinition>[]>(() =>
    this.allAttributeDefinitions().map(def => ({
      value: def,
      valueLabel: def.displayName || def.name
    }))
  );

  // Count of direct children — surfaced in the cascade-delete confirmation so
  // the admin knows what they'll orphan.
  childCount = computed<number>(() => {
    const myId = this.id();
    if (!myId) return 0;
    return this.allCategories().filter(cat => cat.parentCategoryId === myId).length;
  });

  override getRouteId() {
    const id = RouteUtils.getPathVariable('categories');
    return id === 'new' ? null : id;
  }

  override ngOnInit(): void {
    super.ngOnInit();

    // "Create child" flow from the list view — reads the `parentId` query param
    // and stamps it on the blank draft so the admin doesn't have to re-pick the
    // parent they just clicked. Only applies in create mode (no route id).
    const parentIdParam = this.activatedRoute.snapshot.queryParamMap.get('parentId');
    if (parentIdParam && !this.id()) {
      const v = this.value();
      if (v) {
        v.parentCategoryId = parentIdParam;
        this.value.set({ ...v });
      }
    }

    this.refreshAllCategories();
    this.refreshAttributeDefinitions();
  }

  private refreshAllCategories() {
    this.service.getAll().subscribe({
      next: res => this.allCategories.set(res),
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }

  private refreshAttributeDefinitions() {
    this.attributeDefinitionService.getAll().subscribe({
      next: res => this.allAttributeDefinitions.set(res),
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }

  // Force a new top-level reference so the `value` model signal fires — same
  // signal-mutation workaround as elsewhere.
  onMainFormChange(v: Category) {
    this.value.set({ ...v });
  }

  onParentChange(parent: Category | null | undefined) {
    const cat = this.value();
    if (!cat) return;
    cat.parentCategoryId = parent?.id ?? '';
    this.value.set({ ...cat });
  }

  onAttributeDefinitionsChange(defs: AttributeDefinition[]) {
    const cat = this.value();
    if (!cat) return;
    cat.attributeDefinitions = defs ?? [];
    this.value.set({ ...cat });
  }

  // Open the quick-add popup for creating a NEW parent category. Unlike the
  // AttributeOption popup (which just adds to a local list because options
  // cascade-save with their parent), Category is a top-level entity — the new
  // parent must exist as its own row before we can reference it by id. So the
  // popup returns a draft, we POST it, then stamp the resulting id onto the
  // current form's parentCategoryId.
  openCreateParentDialog() {
    this.dialogUtils.matDialog
      .open(CategoryQuickAddDialog, { width: '480px' })
      .afterClosed()
      .subscribe((draft: Category | undefined) => {
        if (!draft) return;
        this.service.post(draft).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
          next: saved => {
            // Add to the global pool so it appears in the picker options.
            this.allCategories.update(all => [...all, saved]);
            // Set as parent of the current form.
            const current = this.value();
            if (current) {
              current.parentCategoryId = saved.id;
              this.value.set({ ...current });
            }
          },
          error: err => this.dialogUtils.openErrorMessageFromError(err)
        });
      });
  }

  // Cascade-delete surfaces immediate-child count in the prompt. Children become
  // orphans (parentCategoryId points at deleted row) — no FK so no server-side
  // cleanup. The list view surfaces orphans under a pseudo-root for re-parenting.
  override async remove() {
    if (!this.id()) return;
    const confirmed = await this.dialogUtils.openCascadeDeleteConfirm(
      'category',
      [{ label: 'direct child (will become orphan)', count: this.childCount() }]
    );
    if (!confirmed) return;

    this.service.delete(this.id()).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: () => this.router.navigate([APP_ROUTES.catalogCategoryList]),
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }

  // Walk the descendant tree from `rootId` and add every found id to `out`.
  private collectDescendantIds(rootId: string, all: Category[], out: Set<string>): void {
    const byParent = new Map<string, Category[]>();
    for (const cat of all) {
      const p = cat.parentCategoryId || '';
      if (!byParent.has(p)) byParent.set(p, []);
      byParent.get(p)!.push(cat);
    }
    const visit = (id: string) => {
      for (const child of byParent.get(id) ?? []) {
        if (!out.has(child.id)) {
          out.add(child.id);
          visit(child.id);
        }
      }
    };
    visit(rootId);
  }
}
