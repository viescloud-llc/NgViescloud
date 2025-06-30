import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { MatTableComponent } from '../mat-table/mat-table.component';
import { ViesRestService, ViesService } from '../../service/rest.service';
import { Pageable } from '../../model/vies.model';
import { map, Observable } from 'rxjs';

@Component({
  selector: 'app-mat-table-dynamic-vies-service',
  templateUrl: './mat-table-dynamic-vies-service.component.html',
  styleUrls: ['./mat-table-dynamic-vies-service.component.scss'],
  standalone: false
})
export class MatTableDynamicViesServiceComponent<T extends Object, S extends ViesRestService<T>> extends MatTableComponent<T> {
  @Input()
  service!: S;

  @Input()
  lazyLoading: boolean = false;

  declare blankObject: T;

  @Input()
  styleWidth: string = '100%';

  @Input()
  usePatch = false;

  @Input()
  showMultipleRowSelectionButton = false;

  @Output()
  onAddOrSaveFn: EventEmitter<T> = new EventEmitter<T>();

  @Output()
  onDeleteFn: EventEmitter<T> = new EventEmitter<T>();

  addOrSave!: (object: T, service: S) => Observable<T>;

  override ngOnInit(): void {
    this.blankObject = this.service.newBlankObject();

    if(this.usePatch) {
      this.addOrSave = (object: T, service: S) => service.postOrPatch(service.getIdFieldValue(object), object);
    }
    else {
      this.addOrSave = (object: T, service: S) => service.postOrPut(service.getIdFieldValue(object), object);
    }
  }

  override ngOnChanges(changes: SimpleChanges): void {
    
  }

  getAll(service: S) {
    return service.getAll();
  }

  getAllPageable(service: S, page: number, size: number, sort?: string): Observable<Pageable<T>> {
    return service.getAllPageable(page, size, sort);
  }

  getById(object: T, service: S) {
    return service.get(service.getIdFieldValue(object));
  }

  deleteById(object: T, service: S) {
    return service.delete(service.getIdFieldValue(object)).pipe(map(() => object));
  }

  clone(object: T) {
    this.service.setIdFieldValue(object, this.service.getIdFieldValue(this.blankObject));
    return structuredClone(object);
  }
}
