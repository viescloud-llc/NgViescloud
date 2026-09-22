import { Component, computed, inject, input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { NgComponentModule } from '../../../../lib/module/ng-component.module';
import { Product } from '../../model/product.model';
import { ResolvedSection, ResolvedStorefront } from '../../model/storefront.model';
import { StorefrontService } from '../../service/storefront/storefront.service';

// Renders a resolved storefront: announcement, header nav, sections, footer.
// Used by the public shop home and by the Manager preview.
@Component({
  selector: 'app-storefront-renderer',
  imports: [NgComponentModule],
  templateUrl: './storefront-renderer.component.html',
  styleUrls: ['./storefront-renderer.component.scss']
})
export class StorefrontRendererComponent {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly router = inject(Router);
  readonly sf = inject(StorefrontService);
  data = input.required<ResolvedStorefront>();
  /** In the Manager preview links do not navigate. */
  inert = input<boolean>(false);

  themeStyle = computed<Record<string, string>>(() => {
    const t = this.data().appearance.theme;
    const radius = t.stylePreset === 'SHARP' ? '0' : t.stylePreset === 'PILL' ? '999px' : '10px';
    const font = t.fontPreset === 'SERIF' ? 'Georgia, serif' : t.fontPreset === 'MONO' ? 'ui-monospace, monospace' : t.fontPreset === 'ROUNDED' ? '"Nunito", "Trebuchet MS", sans-serif' : 'system-ui, sans-serif';
    return { '--sf-primary': t.primaryColor, '--sf-accent': t.accentColor, '--sf-radius': radius, '--sf-font': font };
  });
  dark = computed<boolean>(() => this.data().appearance.theme.colorScheme === 'DARK');

  imageUrl(p: Product): string {
    const m = (p.medias ?? []).find(x => x.isPrimary) ?? (p.medias ?? [])[0];
    return m?.url ?? '';
  }
  asset(id?: string | null): string { return this.sf.assetUrl(id); }
  logoUrl(): string { return this.sf.assetUrl('').replace(/\/public\/storefront\/assets\/$/, '/public/store/logo'); }
  html(s: ResolvedSection): SafeHtml { return this.sanitizer.bypassSecurityTrustHtml(String(s.settings['html'] ?? '')); }
  categories = computed(() => this.data().navigation.filter(n => n.categoryId));
  go(url?: string | null) {
    if (this.inert() || !url) return;
    if (/^https?:/.test(url)) window.open(url, '_blank'); else this.router.navigateByUrl(url);
  }
  openProduct(p: Product) { if (!this.inert()) this.router.navigate(['/shop/products', p.id]); }
}
