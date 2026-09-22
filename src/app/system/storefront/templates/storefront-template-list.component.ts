import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NgComponentModule } from '../../../../lib/module/ng-component.module';
import { ViesMatFormFieldMap } from '../../../../lib/abtract/ViesMatFormFieldMap';
import { MatOption } from '../../../../lib/model/mat.model';
import { ViesDateTime } from '../../../../lib/model/vies.model';
import { RxJSUtils } from '../../../../lib/util/RxJS.utils';
import { DialogUtils } from '../../../../lib/util/Dialog.utils';
import { SnackBarUtils } from '../../../../lib/util/SnackBar.utils';
import { AuthenticatorService } from '../../../../lib/service/authenticator.service';
import { APP_ROUTES } from '../../../app.routes';
import { dtToIso, isoToDt, StorefrontSchedule, StorefrontTemplate } from '../../../shared/model/storefront.model';
import { StorefrontScheduleService, StorefrontService, StorefrontTemplateService } from '../../../shared/service/storefront/storefront.service';

// Templates (saved looks) + the schedule that picks the live one. Both tables
// are decorator-driven; the new-window form uses the lib option / date-time /
// input widgets and posts through the schedule REST service.
@Component({
  selector: 'app-storefront-template-list',
  imports: [NgComponentModule],
  templateUrl: './storefront-template-list.component.html',
  styles: [`.row { display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; margin: 0.25rem 0; } .live { color: #4caf50; font-weight: 600; } .section-title { margin: 1rem 0 0.5rem; }`]
})
export class StorefrontTemplateListComponent extends ViesMatFormFieldMap implements OnInit {
  private readonly rxjsUtils = inject(RxJSUtils);
  private readonly dialogUtils = inject(DialogUtils);
  private readonly sf = inject(StorefrontService);
  private readonly templateService = inject(StorefrontTemplateService);
  private readonly scheduleService = inject(StorefrontScheduleService);
  private readonly authenticatorService = inject(AuthenticatorService);
  private readonly router = inject(Router);

  templates = signal<StorefrontTemplate[]>([]);
  schedules = signal<StorefrontSchedule[]>([]);
  activeId = signal<string | null>(null);
  readonly blankTemplate = new StorefrontTemplate();
  readonly blankSchedule = new StorefrontSchedule();
  canUpdate = computed<boolean>(() => this.authenticatorService.hasAuthorityOrAdmin('storefront:update'));
  canCreate = computed<boolean>(() => this.authenticatorService.hasAuthorityOrAdmin('storefront:create'));
  templateOptions = computed<MatOption<string>[]>(() => this.templates().map(t => ({ value: t.id, valueLabel: t.name + (t.publishedAt ? '' : ' (publish first)') })));
  activeName = computed<string>(() => this.templates().find(t => t.id === this.activeId())?.name ?? '');
  /** Rows carry the template name and a live marker for the table. */
  scheduleRows = computed(() => this.schedules().map(s => Object.assign(new StorefrontSchedule(), s, { name: `${this.isLive(s) ? '● ' : ''}${s.name || ''} — ${this.templates().find(t => t.id === s.templateId)?.name ?? s.templateId}` })));

  // new window
  newTemplateId = signal<string>('');
  newStart = signal<ViesDateTime | undefined>(undefined);
  newEnd = signal<ViesDateTime | undefined>(undefined);
  newPriority = signal<number>(10);
  newName = signal<string>('');

  ngOnInit(): void { this.refresh(); }
  refresh() {
    this.templateService.getAll().pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({ next: t => this.templates.set([...(t ?? [])].sort((a, b) => a.name.localeCompare(b.name))), error: err => this.dialogUtils.openErrorMessageFromError(err) });
    this.scheduleService.getAll().subscribe({ next: s => this.schedules.set([...(s ?? [])].sort((a, b) => b.startsAt.localeCompare(a.startsAt))), error: () => {} });
    this.sf.live().subscribe({ next: r => this.activeId.set(r.activeTemplate?.id ?? null), error: () => {} });
  }
  isLive(s: StorefrontSchedule): boolean { const now = Date.now(); return s.enabled && Date.parse(s.startsAt) <= now && (!s.endsAt || Date.parse(s.endsAt) > now); }

  open(t: StorefrontTemplate) { if (t.id) this.router.navigate([APP_ROUTES.systemStorefrontTemplate(t.id)]); }
  add() { this.router.navigate([APP_ROUTES.systemStorefrontTemplate('new')]); }
  async fromLive() {
    const name = await this.dialogUtils.openInputDialog('Save the live default look as a template', 'Name', 'Save', 'Cancel', false, 'Snapshot ' + new Date().toISOString().slice(0, 10)).catch(() => null);
    if (!name) return;
    this.sf.templateFromLive(String(name)).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({ next: t => this.open(t), error: err => this.dialogUtils.openErrorMessageFromError(err) });
  }
  addWindow() {
    const start = dtToIso(this.newStart()); if (!this.newTemplateId() || !start) return;
    const w = Object.assign(new StorefrontSchedule(), { templateId: this.newTemplateId(), name: this.newName().trim(), startsAt: start, endsAt: dtToIso(this.newEnd()), priority: Number(this.newPriority()) || 0, enabled: true });
    this.scheduleService.post(w).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: () => { this.newStart.set(undefined); this.newEnd.set(undefined); this.newName.set(''); this.refresh(); SnackBarUtils.openSnackBar(this.rxjsUtils.snackBar, 'Window scheduled', 'Dismiss', 3000); },
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }
  /** Row click: edit the window in the lib dynamic-form dialog (name, priority, enabled), or end / delete it. */
  async editWindow(row: StorefrontSchedule) {
    const s = this.schedules().find(x => x.id === row.id); if (!s) return;
    const choice = await this.dialogUtils.openConfirmDialog(`Window: ${s.name || 'unnamed'}`, this.isLive(s) ? 'This window is live now. End it now, or edit it?' : 'Edit this window, or delete it?', 'Edit', this.isLive(s) ? 'End now' : 'Delete').catch(() => null);
    if (choice === null) return;
    if (choice) {
      const res = await this.dialogUtils.openDynamicFormDialog(Object.assign(new StorefrontSchedule(), s), this.blankSchedule, { title: 'Edit window', yes: 'Save', no: 'Cancel' }).catch(() => null);
      if (!res || !res.sucess || !res.result) return;
      this.scheduleService.put(s.id, res.result).subscribe({ next: () => this.refresh(), error: err => this.dialogUtils.openErrorMessageFromError(err) });
    } else if (this.isLive(s)) {
      this.scheduleService.put(s.id, { ...s, endsAt: new Date().toISOString() } as StorefrontSchedule).subscribe({ next: () => this.refresh(), error: err => this.dialogUtils.openErrorMessageFromError(err) });
    } else {
      this.scheduleService.delete(s.id).subscribe({ next: () => this.refresh(), error: err => this.dialogUtils.openErrorMessageFromError(err) });
    }
  }
  preview() { this.router.navigate([APP_ROUTES.systemStorefrontPreview]); }
  readonly isoToDt = isoToDt;
}
