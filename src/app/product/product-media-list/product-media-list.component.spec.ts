import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductMediaListComponent } from './product-media-list.component';

describe('ProductMediaList Component', () => {
  let component: ProductMediaListComponent;
  let fixture: ComponentFixture<ProductMediaListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProductMediaListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductMediaListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
