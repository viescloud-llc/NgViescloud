import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatTablePathComponent } from './mat-table-path.component';

describe('MatTablePath Component', <T> () => {
  let component: MatTablePathComponent<T>;
  let fixture: ComponentFixture<MatTablePathComponent<T>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MatTablePathComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MatTablePathComponent<T>);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
