import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatTableDynamicViesServiceComponent } from './mat-table-dynamic-vies-service.component';

describe('MatTableDynamicViesService Component', () => {
  let component: MatTableDynamicViesServiceComponent;
  let fixture: ComponentFixture<MatTableDynamicViesServiceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MatTableDynamicViesServiceComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MatTableDynamicViesServiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
