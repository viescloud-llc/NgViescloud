import { Component, EventEmitter, Input } from '@angular/core';
import { MatTablePathComponent } from '../mat-table-path/mat-table-path.component';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-mat-table-path-lazy',
  templateUrl: '../mat-table-path/mat-table-path.component.html',
  styleUrls: ['../mat-table-path/mat-table-path.component.scss']
})
export class MatTablePathLazyComponent<T> extends MatTablePathComponent<T> {

  @Input()
  OnPathChangeFetchFn?: (changedPath: string) => T[] | Observable<T[]> | Promise<T[]>;

  override ngOnInit(): void {
    this.onPathChangeEmit(this.currentPath);
    super.ngOnInit();
  }

  override onPathChangeEmit(path: string): void {
    super.onPathChangeEmit(path);
    if(this.OnPathChangeFetchFn && (!this.value || this.currentPath !== path)) {
      const fetchFn = this.OnPathChangeFetchFn(path);

      if(fetchFn instanceof Observable) {
        fetchFn.subscribe({
          next: res => {
            this.value = res;
          }
        });
      }
      else if(fetchFn instanceof Promise) {
        fetchFn.then(
          res => this.value = res
        ).catch(
          err => {}
        );
      }
      else {
        this.value = fetchFn as T[];
      }

      this.ngOnInit();
    }
  }
}
