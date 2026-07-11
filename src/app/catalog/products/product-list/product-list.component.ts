import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RxJSUtils } from '../../../../lib/util/RxJS.utils';
import { DialogUtils } from '../../../../lib/util/Dialog.utils';
import { ProductService } from '../../../shared/service/product/product.service';
import { Product, ProductStatus } from '../../../shared/model/product.model';
import { NgComponentModule } from "../../../../lib/module/ng-component.module";
import { Router } from '@angular/router';
import { APP_ROUTES } from '../../../app.routes';
import { ViesMatFormFieldMap } from '../../../../lib/abtract/ViesMatFormFieldMap';
import { MatOption } from '../../../../lib/model/mat.model';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss'],
  imports: [NgComponentModule]
})
export class ProductListComponent extends ViesMatFormFieldMap implements OnInit {

  protected readonly rxjsUtils = inject(RxJSUtils);
  protected readonly dialogUtils = inject(DialogUtils);
  protected readonly productService = inject(ProductService);
  protected readonly router = inject(Router);

  products = signal<Product[]>([]);
  blankProduct = new Product();

  // Search filter (case-insensitive substring on `name`, `baseSku`) + status filter.
  // Kept client-side for the initial list view; if list grows huge we can switch to
  // `POST /matches` server-side filtering later.
  searchTerm = signal<string>('');
  statusFilter = signal<ProductStatus | null>(null);

  statusOptions: MatOption<ProductStatus | null>[] = [
    { value: null, valueLabel: 'All statuses' },
    { value: ProductStatus.DRAFT, valueLabel: 'Draft' },
    { value: ProductStatus.ACTIVE, valueLabel: 'Active' },
    { value: ProductStatus.INACTIVE, valueLabel: 'Inactive' },
    { value: ProductStatus.DISCONTINUED, valueLabel: 'Discontinued' }
  ];

  filteredProducts = computed<Product[]>(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const status = this.statusFilter();
    return this.products().filter(p => {
      if (status && p.status !== status) return false;
      if (!term) return true;
      return (p.name || '').toLowerCase().includes(term)
          || (p.baseSku || '').toLowerCase().includes(term);
    });
  });

  ngOnInit(): void {
    this.refresh();
  }

  refresh() {
    this.productService.getAll().pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: res => this.products.set(res),
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }

  addProduct() {
    this.router.navigate([APP_ROUTES.catalogProductNew]);
  }

  selectProduct(product: Product) {
    this.router.navigate([APP_ROUTES.catalogProduct(product.id)]);
  }
}
