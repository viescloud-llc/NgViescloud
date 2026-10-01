import { Component, inject, OnInit, signal } from '@angular/core';
import { ViesService } from '../../../lib/service/rest.service';
import { NgComponentModule } from '../../../lib/module/ng-component.module';
import { ResolvedStorefront } from '../../shared/model/storefront.model';
import { StorefrontService } from '../../shared/service/storefront/storefront.service';
import { StorefrontRendererComponent } from '../../shared/component/storefront/storefront-renderer.component';

// Storefront home: renders the live resolved storefront exactly as a customer would see it.
@Component({
  selector: 'app-shop-home',
  imports: [NgComponentModule, StorefrontRendererComponent],
  template: `<div class="shop-page">@if (data(); as d) { <app-storefront-renderer [data]="d"></app-storefront-renderer> } @else { <p>Loading…</p> }</div>`
})
export class ShopHomeComponent implements OnInit {
  private readonly sf = inject(StorefrontService);
  data = signal<ResolvedStorefront | null>(null);
  ngOnInit(): void { if (ViesService.isNotCSR()) return; this.sf.live().subscribe({ next: d => this.data.set(d), error: () => {} }); }
}
