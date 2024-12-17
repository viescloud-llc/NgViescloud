import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EnsibleItemTabComponent } from './ensible-item-tab.component';

describe('EnsibleItemTab Component', () => {
  let component: EnsibleItemTabComponent;
  let fixture: ComponentFixture<EnsibleItemTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EnsibleItemTabComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EnsibleItemTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
