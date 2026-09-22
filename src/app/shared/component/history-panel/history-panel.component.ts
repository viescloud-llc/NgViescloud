import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { AuthenticatorService } from '../../../../lib/service/authenticator.service';
import { ViesService } from '../../../../lib/service/rest.service';
import { ChangeLog, ChangeLogDiffEntry, parseDiff } from '../../model/audit.model';
import { AuditService } from '../../service/audit/audit.service';

// "History" for one entity: who changed what, when, with the field-level
// before → after. Drop into any editor with [entityType] + [entityId]; loads
// lazily and hides itself without audit:read.
@Component({
  selector: 'app-history-panel',
  imports: [MatButtonModule],
  template: `
    @if (canRead()) {
      <div class="history">
        <div class="head">
          <h3 class="section-title">History ({{ total() }})</h3>
          <button matButton (click)="load()" [disabled]="loading()" type="button">Refresh</button>
        </div>
        @if (entries().length === 0 && !loading()) { <p class="hint">No changes recorded yet.</p> }
        @for (e of entries(); track e.id) {
          <div class="entry" [class.action]="e.action !== 'UPDATE' && e.action !== 'CREATE' && e.action !== 'DELETE'">
            <div class="meta">
              <span class="badge">{{ e.action }}</span>
              <strong>{{ e.actorName || 'system' }}</strong>
              <span class="when">{{ when(e.at) }}</span>
            </div>
            @if (e.summary && diffOf(e).length === 0) { <div class="summary">{{ e.summary }}</div> }
            @if (diffOf(e).length > 0) {
              <table class="diff">
                <tbody>
                  @for (d of diffOf(e); track d.field) {
                    <tr>
                      <td class="field">{{ d.field }}</td>
                      <td class="from">{{ d.from ?? '—' }}</td>
                      <td class="arrow">→</td>
                      <td class="to">{{ d.to ?? '—' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          </div>
        }
        @if (hasMore()) { <button matButton (click)="more()" [disabled]="loading()" type="button">Show older</button> }
      </div>
    }
  `,
  styles: [`
    .history { margin-top: 0.75rem; }
    .head { display: flex; justify-content: space-between; align-items: center; }
    .section-title { margin: 0.5rem 0; }
    .hint { font-size: 0.85rem; opacity: 0.75; }
    .entry { padding: 0.5rem 0; border-bottom: 1px dashed var(--mat-sys-outline-variant, rgba(255,255,255,0.1)); &.action .badge { background: var(--mat-sys-primary-container, rgba(124,77,255,0.25)); } }
    .meta { display: flex; gap: 0.5rem; align-items: center; font-size: 0.85rem; .when { opacity: 0.7; } }
    .badge { padding: 0 0.4rem; border-radius: 4px; font-size: 0.7rem; background: var(--mat-sys-tertiary-container, rgba(255,214,128,0.25)); }
    .summary { margin-top: 0.25rem; font-size: 0.9rem; }
    .diff { margin-top: 0.25rem; border-collapse: collapse; font-size: 0.85rem; td { padding: 0.1rem 0.4rem; vertical-align: top; } .field { font-family: monospace; opacity: 0.85; white-space: nowrap; } .from { color: var(--mat-sys-error, #f28b82); text-decoration: line-through; max-width: 320px; word-break: break-word; } .to { color: var(--mat-sys-primary, #81c995); max-width: 320px; word-break: break-word; } .arrow { opacity: 0.5; } }
  `]
})
export class HistoryPanelComponent {
  entityType = input.required<string>();
  entityId = input<string | null | undefined>(null);

  private audit = inject(AuditService);
  private authenticatorService = inject(AuthenticatorService);

  entries = signal<ChangeLog[]>([]);
  total = signal<number>(0);
  page = signal<number>(0);
  loading = signal<boolean>(false);
  canRead = computed<boolean>(() => this.authenticatorService.hasAuthorityOrAdmin('audit:read'));
  hasMore = computed<boolean>(() => this.entries().length < this.total());

  constructor() {
    effect(() => {
      const id = this.entityId();
      const type = this.entityType();
      if (!id || !type || ViesService.isNotCSR() || !this.canRead()) { this.entries.set([]); this.total.set(0); return; }
      this.page.set(0);
      this.fetch(type, id, 0, false);
    });
  }

  load() { const id = this.entityId(); if (id) { this.page.set(0); this.fetch(this.entityType(), id, 0, false); } }
  more() { const id = this.entityId(); if (!id) return; const next = this.page() + 1; this.page.set(next); this.fetch(this.entityType(), id, next, true); }

  private fetch(type: string, id: string, page: number, append: boolean) {
    this.loading.set(true);
    this.audit.forEntity(type, id, page, 20).subscribe({
      next: r => { this.entries.set(append ? [...this.entries(), ...r.content] : r.content); this.total.set(r.totalElements); this.loading.set(false); },
      error: () => { this.loading.set(false); }
    });
  }

  diffOf(e: ChangeLog): ChangeLogDiffEntry[] { return parseDiff(e); }

  when(iso: string): string {
    try { return new Date(iso).toLocaleString(); } catch { return iso; }
  }
}
