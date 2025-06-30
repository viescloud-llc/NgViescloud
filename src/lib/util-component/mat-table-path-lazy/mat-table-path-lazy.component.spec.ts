import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatTablePathLazyComponent } from './mat-table-path-lazy.component';

describe('MatTablePathLazy Component', () => {
  let component: MatTablePathLazyComponent;
  let fixture: ComponentFixture<MatTablePathLazyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MatTablePathLazyComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MatTablePathLazyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
