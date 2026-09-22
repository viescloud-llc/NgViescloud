import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NgComponentModule } from '../../../../lib/module/ng-component.module';
import { ViesMatFormFieldMap } from '../../../../lib/abtract/ViesMatFormFieldMap';
import { RxJSUtils } from '../../../../lib/util/RxJS.utils';
import { DialogUtils } from '../../../../lib/util/Dialog.utils';
import { APP_ROUTES } from '../../../app.routes';
import { Discount } from '../../../shared/model/commerce.model';
import { DiscountService } from '../../../shared/service/discount/discount.service';
import { CsvImportExportComponent } from '../../../shared/component/csv-import-export/csv-import-export.component';
import { ImportExportService } from '../../../shared/service/import-export/import-export.service';
import { AuthenticatorService } from '../../../../lib/service/authenticator.service';

// Discount registry at /commerce/discounts/list. Free-text search on code.
@Component({
  selector: 'app-discount-list',
  templateUrl: './discount-list.component.html',
  styleUrls: ['./discount-list.component.scss'],
  imports: [NgComponentModule, CsvImportExportComponent]
})
export class DiscountListComponent extends ViesMatFormFieldMap implements OnInit {

  protected readonly rxjsUtils = inject(RxJSUtils);
  protected readonly dialogUtils = inject(DialogUtils);
  protected readonly discountService = inject(DiscountService);
  protected readonly router = inject(Router);

  private readonly io = inject(ImportExportService);
  private readonly authenticatorService = inject(AuthenticatorService);
  canUpdate = computed<boolean>(() => this.authenticatorService.hasAuthorityOrAdmin('discounts:update'));
  readonly exportDiscounts = () => this.io.exportDiscountsCsv();
  readonly importDiscounts = (csv: string, dryRun: boolean) => this.io.importDiscountsCsv(csv, dryRun);

  discounts = signal<Discount[]>([]);
  blankDiscount = new Discount();

  searchTerm = signal<string>('');

  filteredDiscounts = computed<Discount[]>(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.discounts();
    return this.discounts().filter(d =>
      (d.code || '').toLowerCase().includes(term)
      || (d.description || '').toLowerCase().includes(term)
    );
  });

  ngOnInit(): void {
    this.refresh();
  }

  refresh() {
    this.discountService.getAll().pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: res => this.discounts.set(res),
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }

  addDiscount() {
    this.router.navigate([APP_ROUTES.commerceDiscountNew]);
  }

  selectDiscount(discount: Discount) {
    if (!discount.id) return;
    this.router.navigate([APP_ROUTES.commerceDiscount(discount.id)]);
  }
}
