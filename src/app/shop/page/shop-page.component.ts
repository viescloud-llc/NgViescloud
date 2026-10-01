import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ViesService } from '../../../lib/service/rest.service';
import { NgComponentModule } from '../../../lib/module/ng-component.module';
import { PageView, ResolvedStorefront } from '../../shared/model/storefront.model';
import { StorefrontService } from '../../shared/service/storefront/storefront.service';
import { StorefrontRendererComponent } from '../../shared/component/storefront/storefront-renderer.component';

// Storefront content page: /shop/pages/:slug — the storefront chrome plus the
// page's published sections (through the active template when it affects the role).
@Component({
  selector: 'app-shop-page',
  imports: [NgComponentModule, StorefrontRendererComponent],
  template: `<div class="shop-page">@if (data(); as d) { @if (page(); as p) { <app-storefront-renderer [data]="d" [page]="p"></app-storefront-renderer> } @else if (missing()) { <p>This page is not published.</p> } } @else { <p>Loading…</p> }</div>`
})
export class ShopPageComponent implements OnInit {
  private readonly sf = inject(StorefrontService);
  private readonly route = inject(ActivatedRoute);
  data = signal<ResolvedStorefront | null>(null);
  page = signal<PageView | null>(null);
  missing = signal<boolean>(false);
  ngOnInit(): void {
    if (ViesService.isNotCSR()) return;
    this.sf.live().subscribe({ next: d => this.data.set(d), error: () => {} });
    this.route.paramMap.subscribe(pm => {
      const slug = pm.get('slug'); if (!slug) return;
      this.sf.publicPage(slug).subscribe({ next: p => { this.page.set(p); this.missing.set(false); }, error: () => { this.page.set(null); this.missing.set(true); } });
    });
  }
}
