import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DialogUtils } from '../../../../lib/util/Dialog.utils';
import { RxJSUtils } from '../../../../lib/util/RxJS.utils';
import { NgComponentModule } from '../../../../lib/module/ng-component.module';
import { ViesMatFormFieldMap } from '../../../../lib/abtract/ViesMatFormFieldMap';
import { APP_ROUTES } from '../../../app.routes';
import { Category } from '../../../shared/model/product.model';
import { CategoryService } from '../../../shared/service/category/category.service';

// Tree node — Category plus its computed children. The backend's `parentCategory`
// and `childrenCategories` fields are @Transient and may not be populated, so we
// build the tree client-side from the flat list using `parentCategoryId`.
export interface CategoryNode {
  category: Category;
  children: CategoryNode[];
}

@Component({
  selector: 'app-category-list',
  templateUrl: './category-list.component.html',
  styleUrls: ['./category-list.component.scss'],
  imports: [NgComponentModule]
})
export class CategoryListComponent extends ViesMatFormFieldMap implements OnInit {

  readonly categoryService = inject(CategoryService);
  readonly rxjsUtils = inject(RxJSUtils);
  readonly dialogUtils = inject(DialogUtils);
  readonly router = inject(Router);

  categories = signal<Category[]>([]);

  // Case-insensitive substring filter applied against `name`. Matching a node
  // includes all of its ancestors so the tree structure still makes sense
  // (matched node isn't stranded without its parents visible).
  searchTerm = signal<string>('');

  filteredCategories = computed<Category[]>(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const all = this.categories();
    if (!term) return all;

    const matched = new Set(
      all.filter(c => (c.name || '').toLowerCase().includes(term)).map(c => c.id)
    );

    // Include ancestors of every matched node so the tree still renders sensibly.
    const byId = new Map(all.map(c => [c.id, c]));
    const included = new Set(matched);
    for (const id of matched) {
      let current: Category | undefined = byId.get(id);
      while (current?.parentCategoryId) {
        included.add(current.parentCategoryId);
        current = byId.get(current.parentCategoryId);
      }
    }

    return all.filter(c => included.has(c.id));
  });

  // Build the tree from the (possibly filtered) list. Roots are categories with
  // no parentCategoryId. Orphans (parentCategoryId points to a missing row) are
  // collected under a "⚠ Orphaned" pseudo-root so they aren't invisible —
  // `parentCategoryId` is a plain column, not a FK, so the backend won't catch
  // dangling references.
  tree = computed<CategoryNode[]>(() => this.buildTree(this.filteredCategories()));

  // mat-tree childrenAccessor — modern (Angular 16+) API; avoids the older NestedTreeControl boilerplate.
  readonly getChildren = (node: CategoryNode) => node.children;
  readonly hasChild = (_: number, node: CategoryNode) => node.children.length > 0;

  ngOnInit(): void {
    this.refresh();
  }

  refresh() {
    this.categoryService.getAll().pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: res => this.categories.set([...res]),
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }

  addCategory() {
    this.router.navigate([APP_ROUTES.catalogCategoryNew]);
  }

  // Navigate to the "new category" form with the parent pre-selected via a
  // `parentId` query param. The CategoryComponent picks that up in its ngOnInit
  // and stamps `parentCategoryId` on the blank draft so the admin doesn't have
  // to re-pick the parent.
  createChild(parent: Category) {
    this.router.navigate([APP_ROUTES.catalogCategoryNew], {
      queryParams: { parentId: parent.id }
    });
  }

  selectCategory(cat: Category) {
    this.router.navigate([APP_ROUTES.catalogCategory(cat.id)]);
  }

  private buildTree(categories: Category[]): CategoryNode[] {
    const idSet = new Set(categories.map(c => c.id));
    const byParent = new Map<string, Category[]>();
    for (const cat of categories) {
      const parent = cat.parentCategoryId || '';
      if (!byParent.has(parent)) byParent.set(parent, []);
      byParent.get(parent)!.push(cat);
    }
    const buildNode = (cat: Category): CategoryNode => ({
      category: cat,
      children: (byParent.get(cat.id) ?? []).map(buildNode)
    });

    const roots = (byParent.get('') ?? []).map(buildNode);

    const orphans = categories
      .filter(cat => cat.parentCategoryId && !idSet.has(cat.parentCategoryId))
      .map(buildNode);
    if (orphans.length) {
      roots.push({
        category: { id: '__orphans__', name: '⚠ Orphaned (parent missing)', description: '', parentCategoryId: '' } as Category,
        children: orphans
      });
    }
    return roots;
  }
}
