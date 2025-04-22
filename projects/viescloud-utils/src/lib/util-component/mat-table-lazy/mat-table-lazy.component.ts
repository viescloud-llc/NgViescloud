import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { MatTableComponent } from '../mat-table/mat-table.component';
import { merge } from 'rxjs';
import { PageEvent } from '@angular/material/paginator';
import { Pageable } from '../../model/Mat.model';

export interface LazyPageChange {
  pageIndex: number;
  pageSize: number;
  sort: {key?: string, order?: 'asc' | 'desc' | '' };
}

@Component({
  selector: 'app-mat-table-lazy',
  templateUrl: '../mat-table/mat-table.component.html',
  styleUrls: ['../mat-table/mat-table.component.scss']
})
export class MatTableLazyComponent<T extends object> extends MatTableComponent<T> {

  @Input()
  maxCachePage: number = 5;

  @Input()
  matRowsPage?: Pageable<T>;

  @Output()
  onLazyPageChange = new EventEmitter<LazyPageChange>();

  // override ngAfterViewInit(): void {
  //   merge(this.sort.sortChange, this.paginator.page)
  //     .pipe(
  //       startWith({}),
  //       switchMap(() => {
  //         this.isLoadingResults = true;
  //         return this.exampleDatabase!.getRepoIssues(
  //           this.sort.active,
  //           this.sort.direction,
  //           this.paginator.pageIndex,
  //         ).pipe(catchError(() => observableOf(null)));
  //       }),
  //       map(data => {
  //         // Flip flag to show that loading has finished.
  //         this.isLoadingResults = false;
  //         this.isRateLimitReached = data === null;

  //         if (data === null) {
  //           return [];
  //         }

  //         // Only refresh the result length if there is new data. In case of rate
  //         // limit errors, we do not want to reset the paginator to zero, as that
  //         // would prevent users from re-triggering requests.
  //         this.resultsLength = data.total_count;
  //         return data.items;
  //       }),
  //     )
  //     .subscribe(data => (this.data = data));
  //   }
  // }

  // override ngAfterViewInit(): void {
    
  // }

  override totalItems: number = 1000;

  override ngOnChanges(changes: SimpleChanges): void {
    super.ngOnChanges(changes);
    if (changes['matRowsPage'] && this.matRowsPage) {
      this.matRows = this.matRowsPage.content ?? [];
      this.ngOnInit();
    }
  }

  override setTotalItems(): void {
    this.totalItems = this.matRowsPage?._metadata.totalElement ?? 0;
    this.cd.detectChanges();
  }

  override onPageIndexChangeEmit(event: PageEvent): void {
    super.onPageIndexChangeEmit(event);
    let lazyPageChange: LazyPageChange = {
      pageIndex: event.pageIndex,
      pageSize: event.pageSize,
      sort: {key: this.sort.active, order: this.sort.direction}
    }
    this.onLazyPageChange.emit(lazyPageChange);
  }
}
