import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { NgComponentModule } from '../../../lib/module/ng-component.module';
import { ViesMatFormFieldMap } from '../../../lib/abtract/ViesMatFormFieldMap';
import { RxJSUtils } from '../../../lib/util/RxJS.utils';
import { DialogUtils } from '../../../lib/util/Dialog.utils';
import { SnackBarUtils } from '../../../lib/util/SnackBar.utils';
import { AuthenticatorService } from '../../../lib/service/authenticator.service';
import { ViesService } from '../../../lib/service/rest.service';
import { MailEvent, MailEventSetting } from '../../shared/model/mail.model';
import { MailSettingsService } from '../../shared/service/mail-settings/mail-settings.service';

// Settings → Email notifications: per-event on/off, subject override, preview
// of the rendered sample, and "send test" to an address (synchronous, so SMTP
// errors show). Mail goes through the default SMTP provider (Settings → SMTP).
@Component({
  selector: 'app-mail-settings',
  templateUrl: './mail-settings.component.html',
  styleUrls: ['./mail-settings.component.scss'],
  imports: [NgComponentModule, MatSlideToggleModule]
})
export class MailSettingsComponent extends ViesMatFormFieldMap implements OnInit {

  private readonly rxjsUtils = inject(RxJSUtils);
  private readonly dialogUtils = inject(DialogUtils);
  private readonly mailSettings = inject(MailSettingsService);
  private readonly authenticatorService = inject(AuthenticatorService);
  private readonly sanitizer = inject(DomSanitizer);

  settings = signal<MailEventSetting[]>([]);
  subjectDrafts = signal<Record<string, string>>({});
  recipientDrafts = signal<Record<string, string>>({});
  previewEvent = signal<MailEvent | null>(null);
  previewHtml = signal<SafeHtml | null>(null);
  testTo = signal<string>('');
  busy = signal<string>('');

  canUpdate = computed<boolean>(() => this.authenticatorService.hasAuthorityOrAdmin('smtp:update'));
  canSend = computed<boolean>(() => this.authenticatorService.hasAuthorityOrAdmin('smtp:send'));

  ngOnInit(): void {
    if (ViesService.isNotCSR()) return;
    this.testTo.set(this.authenticatorService.currentUser?.email ?? '');
    this.load();
  }

  load() {
    this.mailSettings.list().pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: res => {
        this.settings.set(res ?? []);
        const drafts: Record<string, string> = {};
        const rec: Record<string, string> = {};
        (res ?? []).forEach(s => { drafts[s.event] = s.subjectOverride ?? ''; rec[s.event] = s.recipients ?? ''; });
        this.subjectDrafts.set(drafts);
        this.recipientDrafts.set(rec);
      },
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }

  toggle(s: MailEventSetting, enabled: boolean) {
    this.mailSettings.update(s.event, { enabled }).subscribe({
      next: saved => this.replace(saved),
      error: err => { this.dialogUtils.openErrorMessageFromError(err); this.load(); }
    });
  }

  onSubjectDraft(event: MailEvent, v: string) {
    this.subjectDrafts.set({ ...this.subjectDrafts(), [event]: v });
  }

  subjectDirty(s: MailEventSetting): boolean {
    return (this.subjectDrafts()[s.event] ?? '') !== (s.subjectOverride ?? '');
  }

  saveSubject(s: MailEventSetting) {
    this.mailSettings.update(s.event, { subjectOverride: this.subjectDrafts()[s.event] ?? '' }).subscribe({
      next: saved => { this.replace(saved); SnackBarUtils.openSnackBar(this.rxjsUtils.snackBar, 'Subject saved', 'Dismiss', 3000); },
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }

  preview(s: MailEventSetting) {
    this.busy.set('preview:' + s.event);
    this.mailSettings.preview(s.event).subscribe({
      next: html => { this.busy.set(''); this.previewEvent.set(s.event); this.previewHtml.set(this.sanitizer.bypassSecurityTrustHtml(html)); },
      error: err => { this.busy.set(''); this.dialogUtils.openErrorMessageFromError(err); }
    });
  }

  sendTest(s: MailEventSetting) {
    const to = this.testTo().trim();
    if (!to) return;
    this.busy.set('test:' + s.event);
    this.mailSettings.sendTest(s.event, to).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: r => { this.busy.set(''); SnackBarUtils.openSnackBar(this.rxjsUtils.snackBar, `Sent "${r.subject}" to ${r.to}`, 'Dismiss', 6000); },
      error: err => { this.busy.set(''); this.dialogUtils.openErrorMessageFromError(err); }
    });
  }

  onRecipientsDraft(event: MailEvent, v: string) { this.recipientDrafts.set({ ...this.recipientDrafts(), [event]: v }); }
  recipientsDirty(s: MailEventSetting): boolean { return (this.recipientDrafts()[s.event] ?? '') !== (s.recipients ?? ''); }

  saveRecipients(s: MailEventSetting) {
    this.mailSettings.update(s.event, { recipients: this.recipientDrafts()[s.event] ?? '' }).subscribe({
      next: saved => { this.replace(saved); SnackBarUtils.openSnackBar(this.rxjsUtils.snackBar, 'Recipients saved', 'Dismiss', 3000); },
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }

  private replace(saved: MailEventSetting) {
    this.settings.set(this.settings().map(x => x.event === saved.event ? saved : x));
    this.subjectDrafts.set({ ...this.subjectDrafts(), [saved.event]: saved.subjectOverride ?? '' });
    this.recipientDrafts.set({ ...this.recipientDrafts(), [saved.event]: saved.recipients ?? '' });
  }
}
