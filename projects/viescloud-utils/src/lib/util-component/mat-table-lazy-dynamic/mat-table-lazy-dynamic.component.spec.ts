import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatTableLazyDynamicComponent } from './mat-table-lazy-dynamic.component';

describe('MatTableLazyDynamic Component', () => {
  let component: MatTableLazyDynamicComponent;
  let fixture: ComponentFixture<MatTableLazyDynamicComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MatTableLazyDynamicComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MatTableLazyDynamicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
