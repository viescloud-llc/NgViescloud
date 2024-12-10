import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatTreePathItemComponent } from './mat-tree-path-item.component';

describe('MatTreePathItem Component', () => {
  let component: MatTreePathItemComponent;
  let fixture: ComponentFixture<MatTreePathItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MatTreePathItemComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MatTreePathItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
