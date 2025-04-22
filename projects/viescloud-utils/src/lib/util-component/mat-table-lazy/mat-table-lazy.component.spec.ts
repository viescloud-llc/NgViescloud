import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatTableLazyComponent } from './mat-table-lazy.component';

describe('MatTableLazy Component', () => {
  let component: MatTableLazyComponent;
  let fixture: ComponentFixture<MatTableLazyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MatTableLazyComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MatTableLazyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
