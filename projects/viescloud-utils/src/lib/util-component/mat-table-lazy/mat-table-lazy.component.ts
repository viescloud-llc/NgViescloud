import { Component, EventEmitter, Input, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { MatTableComponent } from '../mat-table/mat-table.component';
import { merge, Observable } from 'rxjs';
import { PageEvent } from '@angular/material/paginator';
import { Pageable } from '../../model/mat.model';
import { DataUtils } from '../../util/Data.utils';
import { FixedSizeMap } from '../../model/data-structure.model';

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
export class MatTableLazyComponent<T extends object> extends MatTableComponent<T> implements OnDestroy{

  @Input()
  maxCachePage: number = 20;

  @Input()
  matRowsPage?: Pageable<T> | null;

  @Input()
  sendPageIndexChangeSubject?: Observable<void>;

  @Output()
  onLazyPageChange = new EventEmitter<LazyPageChange>();

  fixSizeMap = new FixedSizeMap<String, T[] | null>(this.maxCachePage);
  sendPageIndexChangeSubjectSubscription?: any;

  ngOnDestroy(): void {
    this.fixSizeMap.clear();
    if(this.sendPageIndexChangeSubjectSubscription) {
      this.sendPageIndexChangeSubjectSubscription.unsubscribe();
    }
  }

  override ngAfterViewInit(): void {
    super.ngAfterViewInit();
    this.dataSource.paginator = null;

    this.sort.sortChange.subscribe(() => {
      this.paginator.pageIndex = 0
      this.sendPageIndexChangeEmit();
    });

    if(!this.matRowsPage?._metadata) {
      this.sendPageIndexChangeEmit();
    }
  }

  override ngOnInit(): void {
    super.ngOnInit();

    if(this.sendPageIndexChangeSubject) {
      if(this.sendPageIndexChangeSubjectSubscription) {
        this.sendPageIndexChangeSubjectSubscription.unsubscribe();
      }

      this.sendPageIndexChangeSubjectSubscription = this.sendPageIndexChangeSubject.subscribe(() => {
        this.fixSizeMap.clear();
        this.paginator.pageIndex = 0
        setTimeout(() => this.sendPageIndexChangeEmit());
      })
    }

    setTimeout(() => {
      this.paginator.length = this.matRowsPage?._metadata.totalElement ?? 0;
    });

    if (this.maxCachePage != this.fixSizeMap.getMaxSize()) {
      this.fixSizeMap = new FixedSizeMap<String, T[]>(this.maxCachePage);
    }
  }

  override ngOnChanges(changes: SimpleChanges): void {
    super.ngOnChanges(changes);
    if (changes['matRowsPage']) {
      if(this.matRowsPage) {
        this.matRows = this.matRowsPage.content ?? [];
  
        setTimeout(() => {
          let lazyPageChange: LazyPageChange = {
            pageIndex: this.matRowsPage!._metadata.pageNumber,
            pageSize: this.matRowsPage!._metadata.pageSize,
            sort: {key: this.sort.active, order: this.sort.direction}
          }
  
          let id = JSON.stringify(lazyPageChange);
          this.fixSizeMap.set(id, structuredClone(this.matRows));
        })
        
        this.ngOnInit();
      }
    }
  }

  sendPageIndexChangeEmit() {
    this.onPageIndexChangeEmit({
      pageIndex: 0,
      pageSize: this.paginator.pageSize,
      length: this.paginator.length
    })
  }

  override onPageIndexChangeEmit(event: PageEvent): void {
    super.onPageIndexChangeEmit(event);

    let lazyPageChange: LazyPageChange = {
      pageIndex: event.pageIndex,
      pageSize: event.pageSize,
      sort: {key: this.sort.active, order: this.sort.direction}
    }

    let id = JSON.stringify(lazyPageChange);
    if (this.fixSizeMap.has(id) && this.fixSizeMap.get(id) !== null) {
      this.matRows = structuredClone(this.fixSizeMap.get(id)!);
      this.ngOnInit();
    }
    else {
      this.fixSizeMap.set(id, null);
      this.onLazyPageChange.emit(lazyPageChange);
    }
  }
}
