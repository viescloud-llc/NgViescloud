import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { NgComponentModule } from '../../../lib/module/ng-component.module';
import { ViesMatFormFieldMap } from '../../../lib/abtract/ViesMatFormFieldMap';
import { RxJSUtils } from '../../../lib/util/RxJS.utils';
import { DialogUtils } from '../../../lib/util/Dialog.utils';
import { Review } from '../../shared/model/user-info.model';
import { ReviewService } from '../../shared/service/review/review.service';
import { ProductService } from '../../shared/service/product/product.service';
import { Product } from '../../shared/model/product.model';

// Review moderation at /reviews (intent § 5.9). Plain table with rating sort,
// free-text search, and a delete control per row. The Review model has no
// moderation-status field today, so "moderation" == delete-what-violates.
// (Public review WRITE is still a backend gap — shoppers can't self-post yet.)
@Component({
  selector: 'app-review-list',
  templateUrl: './review-list.component.html',
  styleUrls: ['./review-list.component.scss'],
  imports: [NgComponentModule]
})
export class ReviewListComponent extends ViesMatFormFieldMap implements OnInit {

  protected readonly rxjsUtils = inject(RxJSUtils);
  protected readonly dialogUtils = inject(DialogUtils);
  protected readonly reviewService = inject(ReviewService);
  protected readonly productService = inject(ProductService);

  reviews = signal<Review[]>([]);
  products = signal<Product[]>([]);

  searchTerm = signal<string>('');
  // 'desc' = highest rated first, 'asc' = lowest first (the moderation view —
  // angry reviews float up).
  ratingSort = signal<'asc' | 'desc'>('asc');

  private productNameById = computed<Map<string, string>>(() =>
    new Map(this.products().map(p => [p.id, p.name || '(unnamed product)']))
  );

  filteredReviews = computed<Review[]>(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const dir = this.ratingSort() === 'asc' ? 1 : -1;
    return this.reviews()
      .filter(r => {
        if (!term) return true;
        return (r.comment || '').toLowerCase().includes(term)
            || this.productName(r).toLowerCase().includes(term)
            || (r.userId || '').toLowerCase().includes(term);
      })
      .sort((a, b) => dir * (Number(a.rating || 0) - Number(b.rating || 0)));
  });

  productName(review: Review): string {
    return this.productNameById().get(review.productId) ?? review.productId ?? '(unknown)';
  }

  toggleRatingSort() {
    this.ratingSort.update(s => s === 'asc' ? 'desc' : 'asc');
  }

  ngOnInit(): void {
    this.refresh();
    // Product names for display — best-effort; ids render as fallback.
    this.productService.getAll().subscribe({
      next: res => this.products.set(res),
      error: () => { /* names degrade to raw ids */ }
    });
  }

  refresh() {
    this.reviewService.getAll().pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: res => this.reviews.set(res),
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }

  async deleteReview(review: Review) {
    if (!review.id) return;
    const confirmed = await this.dialogUtils.openConfirmDialog(
      'Delete review?',
      `Permanently delete this ${review.rating}-star review? This cannot be undone.`,
      'Delete',
      'Cancel'
    ).catch(() => false);
    if (!confirmed) return;

    this.reviewService.delete(review.id).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: () => this.reviews.update(all => all.filter(r => r.id !== review.id)),
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }
}
