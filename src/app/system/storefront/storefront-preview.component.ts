import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgComponentModule } from '../../../lib/module/ng-component.module';
import { ViesService } from '../../../lib/service/rest.service';
import { DialogUtils } from '../../../lib/util/Dialog.utils';
import { ResolvedStorefront } from '../../shared/model/storefront.model';
import { StorefrontService } from '../../shared/service/storefront/storefront.service';
import { StorefrontRendererComponent } from '../../shared/component/storefront/storefront-renderer.component';

// Manager preview of the resolved storefront: live, the home draft, or a template (draft/published).
@Component({
  selector: 'app-storefront-preview',
  imports: [NgComponentModule, StorefrontRendererComponent],
  template: `
    <ul class="margin-center">
      <li class="bar">
        <span>Preview — @if (templateId()) { template <strong>{{ data()?.activeTemplate?.name }}</strong> ({{ draft() ? 'draft' : 'published' }}) } @else if (draft()) { default look with the <strong>home page draft</strong> } @else { <strong>what customers see now</strong> }
          @if (data()?.version) { <small class="mono"> · v{{ data()?.version }}</small> }</span>
        <span><button matButton (click)="reload()" type="button">Reload</button><button matButton="filled" (click)="back()" type="button">Back</button></span>
      </li>
      @if (data(); as d) { <li><app-storefront-renderer [data]="d" [inert]="true"></app-storefront-renderer></li> }
    </ul>`,
  styles: [`.bar { display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; margin-bottom: 0.75rem; } .mono { font-family: monospace; opacity: 0.7; }`]
})
export class StorefrontPreviewComponent implements OnInit {
  private readonly sf = inject(StorefrontService);
  private readonly dialogUtils = inject(DialogUtils);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  data = signal<ResolvedStorefront | null>(null);
  templateId = signal<string | null>(null);
  draft = signal<boolean>(false);
  ngOnInit(): void {
    if (ViesService.isNotCSR()) return;
    this.templateId.set(this.route.snapshot.queryParamMap.get('templateId'));
    this.draft.set(this.route.snapshot.queryParamMap.get('draft') === 'true');
    this.reload();
  }
  reload() { this.sf.preview(this.templateId(), this.draft()).subscribe({ next: d => this.data.set(d), error: err => this.dialogUtils.openErrorMessageFromError(err) }); }
  back() { history.length > 1 ? history.back() : this.router.navigate(['/system/storefront']); }
}
