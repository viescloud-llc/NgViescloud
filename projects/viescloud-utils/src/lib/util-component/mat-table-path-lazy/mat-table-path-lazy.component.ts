import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { MatTablePathComponent } from '../mat-table-path/mat-table-path.component';
import { Observable } from 'rxjs';
import { FixedSizeMap } from '../../model/DataStructure.model';

@Component({
  selector: 'app-mat-table-path-lazy',
  templateUrl: '../mat-table-path/mat-table-path.component.html',
  styleUrls: ['../mat-table-path/mat-table-path.component.scss']
})
export class MatTablePathLazyComponent<T> extends MatTablePathComponent<T> {

  @Input()
  maxCachePath: number = 20;

  fixSizeMap = new FixedSizeMap<String, T[]>(this.maxCachePath);

  @Output()
  onLazyPathChange: EventEmitter<string> = new EventEmitter<string>();

  override ngOnInit(): void {
    super.ngOnInit();
    if(this.fixSizeMap.getMaxSize() !== this.maxCachePath) {
      this.fixSizeMap = new FixedSizeMap<String, T[]>(this.maxCachePath);
    }
  }

  override ngOnChanges(changes: SimpleChanges): void {
    if(changes['value']) {
      this.fixSizeMap.set(this.currentPath, structuredClone(this.value));
    }
    super.ngOnChanges(changes);
  }

  override checkValidPath(): void {
    super.checkValidPath();
    if(this.fixSizeMap.has(this.currentPath)) {
      this.value = structuredClone(this.fixSizeMap.get(this.currentPath)!);
      super.ngOnInit();
    } 
    else {
      this.onLazyPathChange.emit(this.currentPath);
    }
  }
}
