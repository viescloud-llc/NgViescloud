import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ViesMatFormFieldMap } from '../../abtract/ViesMatFormFieldMap';
import { SmtpProvider } from '../../model/smtp.model';
import { SmtpProviderService, SmtpSenderService } from '../../service/smtp.service';
import { AuthenticatorService } from '../../service/authenticator.service';
import { ViesService } from '../../service/rest.service';
import { DialogUtils } from '../../util/Dialog.utils';
import { RxJSUtils } from '../../util/RxJS.utils';
import { DataUtils } from '../../util/Data.utils';

/**
 * Outbound-mail (SMTP) accounts administration — authority resource `smtp`.
 * Table of providers → editor (host/port/credentials/TLS flags/default flag)
 * with a "send a test email" panel that posts the CURRENT edit inline, so an
 * account can be verified before it is saved. Only one provider should be the
 * default; picking a new default clears the flag on the previous one after
 * the save (the backend keeps no such invariant).
 */
@Component({
  selector: 'app-smtp-provider-list',
  standalone: false,
  templateUrl: './smtp-provider-list.component.html',
  styleUrls: ['./smtp-provider-list.component.scss']
})
export class SmtpProviderListComponent extends ViesMatFormFieldMap implements OnInit {

  private providerService = inject(SmtpProviderService);
  private senderService = inject(SmtpSenderService);
  private authenticatorService = inject(AuthenticatorService);
  private dialogUtils = inject(DialogUtils);
  private rxjs = inject(RxJSUtils);

  readonly blankProvider = new SmtpProvider();

  providers = signal<SmtpProvider[]>([]);
  selected = signal<SmtpProvider | null>(null);
  private baseline = signal<SmtpProvider | null>(null);
  validForm = signal<boolean>(false);

  // Test-email panel.
  testTo = signal<string>('');
  testFrom = signal<string>('');
  testSubject = signal<string>('Test email from SMTP settings');
  testBody = signal<string>('If you can read this, the SMTP provider is configured correctly.');
  lastTest = signal<{ ok: boolean; message: string } | null>(null);

  isDirty = computed<boolean>(() => DataUtils.isNotEqual(this.selected(), this.baseline()));
  canSave = computed<boolean>(() => this.isDirty() && this.validForm() && this.hasCore());
  canSend = computed<boolean>(() => this.hasCore() && !!this.testTo().trim() && !!this.testFrom().trim());
  canSendUpdates = computed<boolean>(() => this.authenticatorService.hasAuthorityOrAdmin('smtp:send'));
  currentDefault = computed<SmtpProvider | null>(() => this.providers().find(p => p.defaultSmtpProviderForUserRecovery) ?? null);
  // Choosing this row as default while another row holds the flag.
  defaultWillMove = computed<boolean>(() => {
    const s = this.selected(); const d = this.currentDefault();
    return !!s?.defaultSmtpProviderForUserRecovery && !!d && d.id !== s.id;
  });

  ngOnInit(): void {
    if (ViesService.isNotCSR()) return;
    this.refresh();
  }

  refresh() {
    this.providerService.getAll().pipe(this.rxjs.waitLoadingDialog()).subscribe({
      next: res => this.providers.set([...(res ?? [])].sort((a, b) => (a.host || '').localeCompare(b.host || ''))),
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }

  addProvider() {
    const p = new SmtpProvider();
    p.id = '';
    // First account becomes the default automatically — there is nothing else to send from.
    p.defaultSmtpProviderForUserRecovery = this.providers().length === 0;
    this.select(p);
  }

  select(provider: SmtpProvider) {
    const copy = structuredClone(provider);
    this.selected.set(copy);
    this.baseline.set(structuredClone(copy));
    this.lastTest.set(null);
    if (!this.testFrom().trim() && copy.username?.includes('@')) this.testFrom.set(copy.username);
  }

  back() {
    this.selected.set(null);
    this.baseline.set(null);
    this.lastTest.set(null);
  }

  onFormChange(p: SmtpProvider) {
    // The dynamic form mutates in place and never renders password — keep it, force a new ref.
    p.password = this.selected()?.password ?? '';
    this.selected.set({ ...p });
    if (!this.testFrom().trim() && p.username?.includes('@')) this.testFrom.set(p.username);
  }

  onPasswordChange(password: string) {
    const p = this.selected();
    if (!p) return;
    this.selected.set({ ...p, password: password ?? '' });
  }

  revert() {
    const b = this.baseline();
    if (b) this.selected.set(structuredClone(b));
  }

  save() {
    const p = this.selected();
    if (!p || !this.canSave()) return;
    const previousDefault = this.defaultWillMove() ? this.currentDefault() : null;
    const call = p.id ? this.providerService.put(p.id, p) : this.providerService.post(p);
    call.pipe(this.rxjs.waitLoadingDialog()).subscribe({
      next: saved => {
        this.select(saved);
        if (previousDefault?.id) {
          // Keep "default" unique: clear it on the row that held it before.
          this.providerService.put(previousDefault.id, { ...previousDefault, defaultSmtpProviderForUserRecovery: false })
            .subscribe({ next: () => this.refresh(), error: err => { this.refresh(); this.dialogUtils.openErrorMessageFromError(err); } });
        } else {
          this.refresh();
        }
      },
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }

  async remove() {
    const p = this.selected();
    if (!p?.id) return;
    const ok = await this.dialogUtils.openConfirmDialog(
      'Delete SMTP provider?',
      `Delete ${p.username || p.host}? Anything configured to send through it stops working.`,
      'Delete', 'Cancel').catch(() => false);
    if (!ok) return;
    this.providerService.delete(p.id).pipe(this.rxjs.waitLoadingDialog()).subscribe({
      next: () => { this.back(); this.refresh(); },
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }

  /** Posts the CURRENT edit inline (unsaved settings are testable). Synchronous, so failures surface. */
  sendTest() {
    const p = this.selected();
    if (!p || !this.canSend()) return;
    const message = {
      from: this.testFrom().trim(),
      to: this.testTo().split(',').map(s => s.trim()).filter(s => s.length > 0),
      subject: this.testSubject().trim() || 'Test email',
      text: this.testBody()
    };
    this.lastTest.set(null);
    this.senderService.sendWith(p, message, { async: false, html: false }).pipe(this.rxjs.waitLoadingDialog()).subscribe({
      next: () => this.lastTest.set({ ok: true, message: `Sent to ${message.to.join(', ')} via ${p.host}:${p.port}.` }),
      error: err => this.lastTest.set({ ok: false, message: this.describeError(err) })
    });
  }

  private hasCore(): boolean {
    const p = this.selected();
    return !!p && !!p.host?.trim() && !!p.username?.trim() && !!p.password && Number(p.port) > 0;
  }

  private describeError(err: any): string {
    const body = err?.error;
    if (typeof body === 'string' && body.trim()) return body;
    return body?.message || body?.error || err?.message || 'Send failed';
  }
}
