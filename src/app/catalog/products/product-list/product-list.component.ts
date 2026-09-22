import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { emptyPage, ListPage } from '../../../shared/model/list-page.model';
import { SearchService } from '../../../shared/service/search/search.service';
import { ServerPagerComponent } from '../../../shared/component/server-pager/server-pager.component';
import { CsvImportExportComponent } from '../../../shared/component/csv-import-export/csv-import-export.component';
import { RxJSUtils } from '../../../../lib/util/RxJS.utils';
import { DialogUtils } from '../../../../lib/util/Dialog.utils';
import { SnackBarUtils } from '../../../../lib/util/SnackBar.utils';
import { AuthenticatorService } from '../../../../lib/service/authenticator.service';
import { ProductService } from '../../../shared/service/product/product.service';
import { Category, Product, ProductStatus, Tag } from '../../../shared/model/product.model';
import { NgComponentModule } from "../../../../lib/module/ng-component.module";
import { Router } from '@angular/router';
import { APP_ROUTES } from '../../../app.routes';
import { ViesMatFormFieldMap } from '../../../../lib/abtract/ViesMatFormFieldMap';
import { MatOption } from '../../../../lib/model/mat.model';
import { ImportExportService } from '../../../shared/service/import-export/import-export.service';
import { TagService } from '../../../shared/service/tag/tag.service';
import { CategoryService } from '../../../shared/service/category/category.service';
import { BulkAction, BulkProductRequest, BulkProductResult } from '../../../shared/model/bulk.model';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss'],
  imports: [NgComponentModule, ServerPagerComponent, CsvImportExportComponent, MatFormFieldModule, MatSelectModule, MatSlideToggleModule]
})
export class ProductListComponent extends ViesMatFormFieldMap implements OnInit {

  protected readonly rxjsUtils = inject(RxJSUtils);
  protected readonly dialogUtils = inject(DialogUtils);
  protected readonly productService = inject(ProductService);
  protected readonly router = inject(Router);
  private readonly authenticatorService = inject(AuthenticatorService);
  readonly io = inject(ImportExportService);
  private readonly tagService = inject(TagService);
  private readonly categoryService = inject(CategoryService);

  // Server-side (GET /products/search): q matches name, base SKU, variant SKUs
  // and scan-code aliases; status filter; paged, newest first.
  private readonly search = inject(SearchService);
  result = signal<ListPage<Product>>(emptyPage());
  products = computed<Product[]>(() => this.result().content);
  blankProduct = new Product();
  loading = signal<boolean>(false);

  searchTerm = signal<string>('');
  statusFilter = signal<ProductStatus | null>(null);
  page = signal<number>(0);
  size = signal<number>(25);
  private debounce?: ReturnType<typeof setTimeout>;

  statusOptions: MatOption<ProductStatus | null>[] = [
    { value: null, valueLabel: 'All statuses' },
    { value: ProductStatus.DRAFT, valueLabel: 'Draft' },
    { value: ProductStatus.ACTIVE, valueLabel: 'Active' },
    { value: ProductStatus.INACTIVE, valueLabel: 'Inactive' },
    { value: ProductStatus.DISCONTINUED, valueLabel: 'Discontinued' }
  ];

  // ---- Bulk actions (catalog:update): multi-select rows → preview (dry run) → apply ----
  canUpdate = computed<boolean>(() => this.authenticatorService.hasAuthorityOrAdmin('catalog:update'));
  selected = signal<Product[]>([]);
  bulkAction = signal<BulkAction>('SET_STATUS');
  bulkStatus = signal<ProductStatus>(ProductStatus.ACTIVE);
  bulkPercent = signal<string>('');
  bulkAmount = signal<string>('');
  bulkVariants = signal<boolean>(true);
  bulkTagIds = signal<string[]>([]);
  bulkCategoryId = signal<string>('');
  bulkPreview = signal<BulkProductResult | null>(null);
  bulkBusy = signal<boolean>(false);
  tags = signal<Tag[]>([]);
  categories = signal<Category[]>([]);
  readonly bulkActions: { value: BulkAction; label: string }[] = [
    { value: 'SET_STATUS', label: 'Set status' }, { value: 'ADJUST_PRICE', label: 'Adjust price' },
    { value: 'ADD_TAGS', label: 'Add tags' }, { value: 'REMOVE_TAGS', label: 'Remove tags' }, { value: 'MOVE_CATEGORY', label: 'Move to category' }
  ];
  readonly statusValues = Object.values(ProductStatus);
  bulkReady = computed<boolean>(() => {
    if (this.selected().length === 0) return false;
    switch (this.bulkAction()) {
      case 'SET_STATUS': return !!this.bulkStatus();
      case 'ADJUST_PRICE': return !!(Number(this.bulkPercent()) || Number(this.bulkAmount()));
      case 'ADD_TAGS': case 'REMOVE_TAGS': return this.bulkTagIds().length > 0;
      case 'MOVE_CATEGORY': return !!this.bulkCategoryId();
    }
  });

  ngOnInit(): void {
    this.refresh();
    if (this.canUpdate()) {
      this.tagService.getAll().subscribe({ next: t => this.tags.set(t ?? []), error: () => {} });
      this.categoryService.getAll().subscribe({ next: c => this.categories.set(c ?? []), error: () => {} });
    }
  }

  refresh() {
    this.loading.set(true);
    this.search.products({ q: this.searchTerm().trim() || undefined, status: this.statusFilter() ?? undefined, page: this.page(), size: this.size() })
      .subscribe({
        next: r => { this.result.set(r); this.loading.set(false); this.selected.set([]); this.bulkPreview.set(null); },
        error: err => { this.loading.set(false); this.dialogUtils.openErrorMessageFromError(err); }
      });
  }

  onSearchTerm(v: string) {
    this.searchTerm.set(v);
    clearTimeout(this.debounce);
    this.debounce = setTimeout(() => { this.page.set(0); this.refresh(); }, 350);
  }
  onStatus(v: ProductStatus | null) { this.statusFilter.set(v); this.page.set(0); this.refresh(); }
  onPage(p: number) { this.page.set(Math.max(0, p)); this.refresh(); }
  onSize(s: number) { this.size.set(s); this.page.set(0); this.refresh(); }

  addProduct() { this.router.navigate([APP_ROUTES.catalogProductNew]); }
  selectProduct(product: Product) { this.router.navigate([APP_ROUTES.catalogProduct(product.id)]); }

  onSelection(rows: Product[]) { this.selected.set(rows ?? []); this.bulkPreview.set(null); }
  onBulkAction(a: BulkAction) { this.bulkAction.set(a); this.bulkPreview.set(null); }

  private bulkRequest(dryRun: boolean): BulkProductRequest {
    return {
      ids: this.selected().map(p => p.id), action: this.bulkAction(), dryRun,
      status: this.bulkAction() === 'SET_STATUS' ? this.bulkStatus() : undefined,
      percent: this.bulkAction() === 'ADJUST_PRICE' && this.bulkPercent().trim() ? this.bulkPercent().trim() : undefined,
      amount: this.bulkAction() === 'ADJUST_PRICE' && this.bulkAmount().trim() ? this.bulkAmount().trim() : undefined,
      applyToVariants: this.bulkVariants(),
      tagIds: this.bulkAction() === 'ADD_TAGS' || this.bulkAction() === 'REMOVE_TAGS' ? this.bulkTagIds() : undefined,
      categoryId: this.bulkAction() === 'MOVE_CATEGORY' ? this.bulkCategoryId() : undefined
    };
  }

  bulkDryRun() {
    if (!this.bulkReady()) return;
    this.bulkBusy.set(true);
    this.io.bulkProducts(this.bulkRequest(true)).subscribe({
      next: r => { this.bulkBusy.set(false); this.bulkPreview.set(r); },
      error: err => { this.bulkBusy.set(false); this.dialogUtils.openErrorMessageFromError(err); }
    });
  }

  async bulkApply() {
    const p = this.bulkPreview();
    if (!p || p.count === 0) return;
    const ok = await this.dialogUtils.openConfirmDialog('Apply to products?', `${this.bulkActions.find(a => a.value === p.action)?.label} on ${p.count} product(s) — exactly the changes previewed.`, 'Apply', 'Cancel').catch(() => false);
    if (!ok) return;
    this.bulkBusy.set(true);
    this.io.bulkProducts(this.bulkRequest(false)).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: r => { this.bulkBusy.set(false); SnackBarUtils.openSnackBar(this.rxjsUtils.snackBar, `${r.count} product(s) updated`, 'Dismiss', 4000); this.refresh(); },
      error: err => { this.bulkBusy.set(false); this.dialogUtils.openErrorMessageFromError(err); }
    });
  }

  readonly exportProducts = () => this.io.exportProductsCsv();
  readonly importProducts = (csv: string, dryRun: boolean) => this.io.importProductsCsv(csv, dryRun);
}
