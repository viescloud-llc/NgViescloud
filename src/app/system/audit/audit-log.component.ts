import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NgComponentModule } from '../../../lib/module/ng-component.module';
import { ViesMatFormFieldMap } from '../../../lib/abtract/ViesMatFormFieldMap';
import { DialogUtils } from '../../../lib/util/Dialog.utils';
import { MatOption } from '../../../lib/model/mat.model';
import { APP_ROUTES } from '../../app.routes';
import { ChangeLog, ChangeLogDiffEntry, parseDiff } from '../../shared/model/audit.model';
import { emptyPage, ListPage } from '../../shared/model/list-page.model';
import { AuditService } from '../../shared/service/audit/audit.service';
import { ServerPagerComponent } from '../../shared/component/server-pager/server-pager.component';

// System → Audit log: every recorded change across the store, filterable by
// entity type, action, text (summary / label / actor) and date; newest first.
@Component({
  selector: 'app-audit-log',
  templateUrl: './audit-log.component.html',
  styleUrls: ['./audit-log.component.scss'],
  imports: [NgComponentModule, ServerPagerComponent]
})
export class AuditLogComponent extends ViesMatFormFieldMap implements OnInit {

  private readonly audit = inject(AuditService);
  private readonly dialogUtils = inject(DialogUtils);
  private readonly router = inject(Router);

  result = signal<ListPage<ChangeLog>>(emptyPage());
  entries = computed<ChangeLog[]>(() => this.result().content);
  loading = signal<boolean>(false);
  entityType = signal<string | null>(null);
  action = signal<string | null>(null);
  q = signal<string>('');
  from = signal<string>('');
  to = signal<string>('');
  page = signal<number>(0);
  size = signal<number>(25);
  private debounce?: ReturnType<typeof setTimeout>;

  typeOptions = signal<MatOption<string | null>[]>([{ value: null, valueLabel: 'All entities' }]);
  readonly actionOptions: MatOption<string | null>[] = [
    { value: null, valueLabel: 'All actions' },
    ...['CREATE', 'UPDATE', 'DELETE', 'REFUND', 'CAPTURE', 'CANCEL', 'RESTOCK', 'REVOKE_DOWNLOAD', 'RESTORE_DOWNLOAD'].map(a => ({ value: a as string | null, valueLabel: a }))
  ];

  ngOnInit(): void {
    this.audit.entityTypes().subscribe({
      next: ts => this.typeOptions.set([{ value: null, valueLabel: 'All entities' }, ...(ts ?? []).map(t => ({ value: t as string | null, valueLabel: t }))]),
      error: () => {}
    });
    this.load();
  }

  load() {
    this.loading.set(true);
    this.audit.search({ entityType: this.entityType() ?? undefined, action: this.action() ?? undefined, q: this.q().trim() || undefined,
      from: this.from() || undefined, to: this.to() || undefined, page: this.page(), size: this.size() }).subscribe({
      next: r => { this.result.set(r); this.loading.set(false); },
      error: err => { this.loading.set(false); this.dialogUtils.openErrorMessageFromError(err); }
    });
  }

  onQ(v: string) { this.q.set(v); clearTimeout(this.debounce); this.debounce = setTimeout(() => { this.page.set(0); this.load(); }, 350); }
  onType(v: string | null) { this.entityType.set(v); this.page.set(0); this.load(); }
  onAction(v: string | null) { this.action.set(v); this.page.set(0); this.load(); }
  onFrom(v: string) { this.from.set(v); this.page.set(0); this.load(); }
  onTo(v: string) { this.to.set(v); this.page.set(0); this.load(); }
  onPage(p: number) { this.page.set(Math.max(0, p)); this.load(); }
  onSize(s: number) { this.size.set(s); this.page.set(0); this.load(); }

  diffOf(e: ChangeLog): ChangeLogDiffEntry[] { return parseDiff(e); }
  when(iso: string): string { try { return new Date(iso).toLocaleString(); } catch { return iso; } }

  // Jump to the editor for the common entity types.
  open(e: ChangeLog) {
    const id = e.entityId;
    switch (e.entityType) {
      case 'Product': return this.router.navigate([APP_ROUTES.catalogProduct(id)]);
      case 'OrderFulfillment': return this.router.navigate([APP_ROUTES.commerceOrder(id)]);
      case 'ReturnRequest': return this.router.navigate([APP_ROUTES.commerceReturn(id)]);
      case 'Shipment': return this.router.navigate([APP_ROUTES.commerceShipment(id)]);
      case 'Discount': return this.router.navigate([APP_ROUTES.commerceDiscount(id)]);
      case 'ShippingRule': return this.router.navigate([APP_ROUTES.rulesShipping(id)]);
      case 'TaxRule': return this.router.navigate([APP_ROUTES.rulesTax(id)]);
      case 'Carrier': return this.router.navigate([APP_ROUTES.rulesCarrier(id)]);
      case 'Warehouse': return this.router.navigate([APP_ROUTES.inventoryWarehouse(id)]);
      default: return undefined;
    }
  }

  canOpen(e: ChangeLog): boolean {
    return e.action !== 'DELETE' && ['Product', 'OrderFulfillment', 'ReturnRequest', 'Shipment', 'Discount', 'ShippingRule', 'TaxRule', 'Carrier', 'Warehouse'].includes(e.entityType);
  }
}
