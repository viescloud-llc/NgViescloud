import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { NgComponentModule } from '../../../lib/module/ng-component.module';
import { ViesMatFormFieldMap } from '../../../lib/abtract/ViesMatFormFieldMap';
import { ViesService } from '../../../lib/service/rest.service';
import { MaintenanceService, MaintenanceWindowService } from '../../../lib/service/maintenance.service';
import { MAINTENANCE_MANUAL_WINDOW_NAME, MaintenanceWindow } from '../../../lib/model/maintenance.model';
import { ViesDateTime } from '../../../lib/model/vies.model';
import { DialogUtils } from '../../../lib/util/Dialog.utils';
import { RxJSUtils } from '../../../lib/util/RxJS.utils';
import { DataUtils } from '../../../lib/util/Data.utils';

// Maintenance mode control room (/system/maintenance).
//   • Status card — what customers currently experience, plus the next
//     scheduled window.
//   • Manual switch — turn maintenance on/off right now with a message
//     (drives the reserved MANUAL_TOGGLE window on the backend).
//   • Scheduled windows — CRUD over MaintenanceWindow: name, message, manual
//     `active`, and a start/end schedule. The app is in maintenance while ANY
//     window is effective. Staff (maintenance:bypass / ADMIN) keep working;
//     customers get the maintenance page.
@Component({
  selector: 'app-maintenance-admin',
  templateUrl: './maintenance-admin.component.html',
  styleUrls: ['./maintenance-admin.component.scss'],
  imports: [NgComponentModule]
})
export class MaintenanceAdminComponent extends ViesMatFormFieldMap implements OnInit {

  readonly maintenance = inject(MaintenanceService);
  private windowService = inject(MaintenanceWindowService);
  private dialogUtils = inject(DialogUtils);
  private rxjsUtils = inject(RxJSUtils);

  readonly blankWindow = new MaintenanceWindow();

  windows = signal<MaintenanceWindow[]>([]);
  toggleMessage = signal<string>('');
  editing = signal<MaintenanceWindow | null>(null);
  editingValid = signal<boolean>(false);

  // Scheduled (non-manual) windows for the table.
  scheduledWindows = computed<MaintenanceWindow[]>(() =>
    this.windows().filter(w => w.name !== MAINTENANCE_MANUAL_WINDOW_NAME)
  );

  manualWindow = computed<MaintenanceWindow | null>(() =>
    this.windows().find(w => w.name === MAINTENANCE_MANUAL_WINDOW_NAME) ?? null
  );

  ngOnInit(): void {
    if (ViesService.isNotCSR()) return;
    this.refresh();
  }

  refresh() {
    this.maintenance.refreshStatus().subscribe({ error: () => { /* status card shows unknown */ } });
    this.windowService.getAll().subscribe({
      next: res => this.windows.set([...res]),
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }

  // ---- Manual switch -------------------------------------------------------

  async setActive(active: boolean) {
    const confirmed = await this.dialogUtils.openConfirmDialog(
      active ? 'Turn maintenance ON?' : 'Turn maintenance OFF?',
      active
        ? 'Every customer and anonymous request will be answered with the maintenance page immediately. Staff keep working.'
        : 'Customers regain access immediately (unless a scheduled window is still in effect).',
      active ? 'Turn ON' : 'Turn OFF', 'Cancel'
    ).catch(() => false);
    if (!confirmed) return;

    this.maintenance.toggle(active, this.toggleMessage().trim() || undefined)
      .pipe(this.rxjsUtils.waitLoadingDialog())
      .subscribe({
        next: () => this.refresh(),
        error: err => this.dialogUtils.openErrorMessageFromError(err)
      });
  }

  // ---- Scheduled windows ---------------------------------------------------

  newWindow() {
    const w = DataUtils.purgeValue(new MaintenanceWindow());
    const start = new Date(); start.setHours(start.getHours() + 1, 0, 0, 0);
    const end = new Date(start); end.setHours(end.getHours() + 1);
    w.name = 'Scheduled maintenance';
    w.message = 'We are performing scheduled maintenance. Please check back shortly.';
    w.active = false;
    w.startAt = ViesDateTime.fromJsDate(start);
    w.endAt = ViesDateTime.fromJsDate(end);
    this.editing.set(w);
  }

  edit(w: MaintenanceWindow) {
    this.editing.set(structuredClone(w));
  }

  cancelEdit() {
    this.editing.set(null);
  }

  onEditFormChange(w: MaintenanceWindow) {
    const current = this.editing();
    w.startAt = current?.startAt;
    w.endAt = current?.endAt;
    this.editing.set({ ...w });
  }

  onStartChange(dt: ViesDateTime) {
    const w = this.editing();
    if (!w) return;
    this.editing.set({ ...w, startAt: dt });
  }

  onEndChange(dt: ViesDateTime) {
    const w = this.editing();
    if (!w) return;
    this.editing.set({ ...w, endAt: dt });
  }

  clearSchedule() {
    const w = this.editing();
    if (!w) return;
    this.editing.set({ ...w, startAt: undefined, endAt: undefined });
  }

  saveEdit() {
    const w = this.editing();
    if (!w) return;
    const call = w.id ? this.windowService.put(w.id, w) : this.windowService.post(w);
    call.pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: () => { this.editing.set(null); this.refresh(); },
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }

  async deleteWindow(w: MaintenanceWindow) {
    if (!w.id) return;
    const confirmed = await this.dialogUtils.openConfirmDialog(
      'Delete maintenance window?', `Delete "${w.name}"? If it is currently effective, customers regain access.`,
      'Delete', 'Cancel').catch(() => false);
    if (!confirmed) return;
    this.windowService.delete(w.id).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: () => { if (this.editing()?.id === w.id) this.editing.set(null); this.refresh(); },
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }
}
