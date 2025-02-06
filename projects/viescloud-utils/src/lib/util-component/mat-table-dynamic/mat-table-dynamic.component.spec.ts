import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatTableDynamicComponent } from './mat-table-dynamic.component';

describe('MatTableDynamic Component', () => {
  let component: MatTableDynamicComponent;
  let fixture: ComponentFixture<MatTableDynamicComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MatTableDynamicComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MatTableDynamicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
