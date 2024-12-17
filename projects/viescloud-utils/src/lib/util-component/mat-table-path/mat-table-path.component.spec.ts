import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatTablePathComponent } from './mat-table-path.component';

describe('MatTablePath Component', () => {
  let component: MatTablePathComponent;
  let fixture: ComponentFixture<MatTablePathComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MatTablePathComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MatTablePathComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
