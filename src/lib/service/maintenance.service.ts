import { HttpClient, HttpParams } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ViesRestService, ViesService } from './rest.service';
import { MaintenanceStatus, MaintenanceWindow } from '../model/maintenance.model';

/**
 * Maintenance mode (vies-spring-utils 6.5.0).
 *
 * `MaintenanceService` holds the last known status as a signal — refreshed by
 * `refreshStatus()` (call it on app start / on a timer) and updated by the
 * HTTP interceptor whenever a 503 maintenance rejection comes back — plus the
 * manual toggle. `MaintenanceWindowService` is the plain CRUD client for
 * scheduled windows.
 */
@Injectable({ providedIn: 'root' })
export class MaintenanceService {
  private http = inject(HttpClient);
  private baseUrl = `${ViesService.getUri()}/api/v1/maintenance`;

  private readonly _status = signal<MaintenanceStatus | null>(null);
  readonly status = this._status.asReadonly();
  readonly isActive = computed(() => !!this._status()?.active);
  readonly nextWindowMessage = computed(() => this._status()?.nextMessage ?? null);

  /** Public probe — works for anonymous callers and while held. */
  refreshStatus(): Observable<MaintenanceStatus> {
    return this.http.get<MaintenanceStatus>(`${this.baseUrl}/status`).pipe(
      tap(s => this._status.set(s))
    );
  }

  /** Called by the interceptor when any request is rejected with the maintenance 503. */
  applyRejectedStatus(status: MaintenanceStatus): void {
    this._status.set({ ...status, active: true });
  }

  /** Staff-only (`maintenance:update`): switch on/off right now. */
  toggle(active: boolean, message?: string): Observable<MaintenanceStatus> {
    let params = new HttpParams().set('active', String(active));
    if (message) params = params.set('message', message);
    return this.http.post<MaintenanceStatus>(`${this.baseUrl}/toggle`, null, { params }).pipe(
      tap(s => this._status.set(s))
    );
  }
}

@Injectable({ providedIn: 'root' })
export class MaintenanceWindowService extends ViesRestService<MaintenanceWindow> {

  protected override getPrefixes(): string[] {
    return ['api', 'v1', 'maintenance'];
  }

  override newBlankObject(): MaintenanceWindow {
    return new MaintenanceWindow();
  }
  override getIdFieldValue(object: MaintenanceWindow) {
    return object.id;
  }
  override setIdFieldValue(object: MaintenanceWindow, id: any): void {
    object.id = id;
  }
}
