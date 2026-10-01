import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NgComponentModule } from '../../../../lib/module/ng-component.module';
import { RxJSUtils } from '../../../../lib/util/RxJS.utils';
import { DialogUtils } from '../../../../lib/util/Dialog.utils';
import { APP_ROUTES } from '../../../app.routes';
import { PageRole, StorefrontPage } from '../../../shared/model/storefront.model';
import { StorefrontService } from '../../../shared/service/storefront/storefront.service';

// Storefront pages (/system/storefront/pages): decorator-driven table, click a row to edit.
@Component({
  selector: 'app-storefront-page-list',
  imports: [NgComponentModule],
  template: `
    <ul class="margin-center">
      <li><p class="tab-hint">System pages (home, terms, privacy, returns, shipping, contact, about, FAQ) exist once each and are placed by their <strong>role</strong> in the customer frontend; custom pages are free landing / info pages reached by slug. Edit the draft, then <strong>Publish</strong>; an unpublished system page simply is not shown.</p></li>
      <li><app-mat-table [matRows]="pages()" [blankObject]="blank" [showMatTooltip]="true" (onEditRow)="open($event)"></app-mat-table></li>
      <br>
      <li class="flex-row-container-auto"><button matButton="filled" (click)="add()" type="button">New custom page</button><button matButton (click)="refresh()" type="button">Refresh</button></li>
    </ul>`
})
export class StorefrontPageListComponent implements OnInit {
  private readonly rxjsUtils = inject(RxJSUtils);
  private readonly dialogUtils = inject(DialogUtils);
  private readonly sf = inject(StorefrontService);
  private readonly router = inject(Router);
  pages = signal<StorefrontPage[]>([]);
  readonly blank = new StorefrontPage();
  ngOnInit(): void { this.refresh(); }
  refresh() {
    // seeds the system-role pages (home, terms, privacy, …) on first visit
    const order = Object.values(PageRole);
    this.sf.allPages().pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: p => this.pages.set([...(p ?? [])].sort((a, b) => order.indexOf(a.role) - order.indexOf(b.role) || a.title.localeCompare(b.title))),
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }
  open(p: StorefrontPage) { if (p.id) this.router.navigate([APP_ROUTES.systemStorefrontPage(p.id)]); }
  add() { this.router.navigate([APP_ROUTES.systemStorefrontPage('new')]); }
}
