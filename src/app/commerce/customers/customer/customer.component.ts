import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgComponentModule } from '../../../../lib/module/ng-component.module';
import { ViesMatFormFieldMap } from '../../../../lib/abtract/ViesMatFormFieldMap';
import { RxJSUtils } from '../../../../lib/util/RxJS.utils';
import { DialogUtils } from '../../../../lib/util/Dialog.utils';
import { AuthenticatorService } from '../../../../lib/service/authenticator.service';
import { APP_ROUTES } from '../../../app.routes';
import { Address } from '../../../shared/model/address.model';
import { OrderFulfillment, ReturnRequest } from '../../../shared/model/commerce.model';
import { CustomerDetail } from '../../../shared/model/customer.model';
import { CustomerService } from '../../../shared/service/customer/customer.service';

// Customer page at /commerce/customers/:userId — identity, KPIs, addresses,
// order history (links to the order editor), returns, reviews, staff notes.
// Read-only apart from notes; identity edits stay in Settings → Users.
@Component({
  selector: 'app-customer',
  templateUrl: './customer.component.html',
  styleUrls: ['./customer.component.scss'],
  imports: [NgComponentModule]
})
export class CustomerComponent extends ViesMatFormFieldMap implements OnInit {

  protected readonly rxjsUtils = inject(RxJSUtils);
  protected readonly dialogUtils = inject(DialogUtils);
  private readonly customerService = inject(CustomerService);
  private readonly authenticatorService = inject(AuthenticatorService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  userId = signal<string>('');
  detail = signal<CustomerDetail | null>(null);
  orders = signal<OrderFulfillment[]>([]);
  noteText = signal<string>('');
  canWriteNotes = computed<boolean>(() => this.authenticatorService.hasAuthorityOrAdmin('customers:update'));

  summary = computed(() => this.detail()?.summary ?? null);
  ltvEntries = computed<{ currency: string; amount: string }[]>(() =>
    Object.entries(this.summary()?.lifetimeValueByCurrency ?? {}).map(([currency, v]) => ({ currency, amount: Number(v).toFixed(2) }))
  );

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('userId') ?? '';
    this.userId.set(id);
    if (!id) return;
    this.load();
  }

  load() {
    const id = this.userId();
    this.customerService.get(id).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: d => this.detail.set(d),
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
    this.customerService.orders(id).subscribe({ next: os => this.orders.set(os ?? []), error: () => this.orders.set([]) });
  }

  addressLine(a: Address): string {
    return [a.company, a.street, a.suite, a.city, a.state, a.postalCode, a.country].filter(Boolean).join(', ');
  }

  when(d?: { date?: string; time?: string } | null): string {
    return d?.date ? `${d.date}${d.time ? ' ' + d.time.slice(0, 5) : ''}` : '—';
  }

  openOrdersList() {
    this.router.navigate([APP_ROUTES.commerceOrderList], { queryParams: { customerId: this.userId() } });
  }

  openOrder(o: OrderFulfillment) {
    if (o.id) this.router.navigate([APP_ROUTES.commerceOrder(o.id)]);
  }

  openReturn(r: ReturnRequest) {
    if (r.id) this.router.navigate([APP_ROUTES.commerceReturn(r.id)]);
  }

  addNote() {
    const text = this.noteText().trim();
    const id = this.userId();
    if (!text || !id) return;
    this.customerService.addNote(id, text).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: note => {
        this.noteText.set('');
        const d = this.detail();
        if (d) this.detail.set({ ...d, notes: [note, ...(d.notes ?? [])] });
      },
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }

  async deleteNote(noteId: string) {
    const id = this.userId();
    const ok = await this.dialogUtils.openConfirmDialog('Delete note?', 'This staff note will be removed.', 'Delete', 'Cancel').catch(() => false);
    if (!ok || !id) return;
    this.customerService.deleteNote(id, noteId).subscribe({
      next: () => { const d = this.detail(); if (d) this.detail.set({ ...d, notes: d.notes.filter(n => n.id !== noteId) }); },
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }

  backToList() {
    this.router.navigate([APP_ROUTES.commerceCustomerList]);
  }
}
