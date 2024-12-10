import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EnsibleItemComponent } from './ensible-item.component';

describe('EnsibleItem Component', () => {
  let component: EnsibleItemComponent;
  let fixture: ComponentFixture<EnsibleItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EnsibleItemComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EnsibleItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
