import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatTreePathComponent } from './mat-tree-path.component';

describe('MatTreePath Component', () => {
  let component: MatTreePathComponent;
  let fixture: ComponentFixture<MatTreePathComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MatTreePathComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MatTreePathComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
