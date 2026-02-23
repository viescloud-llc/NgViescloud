import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductMediaComponent } from './product-media.component';

describe('ProductMedia Component', () => {
  let component: ProductMediaComponent;
  let fixture: ComponentFixture<ProductMediaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProductMediaComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductMediaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
