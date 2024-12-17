import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EnsibleItemRunComponent } from './ensible-item-run.component';

describe('EnsibleItemRun Component', () => {
  let component: EnsibleItemRunComponent;
  let fixture: ComponentFixture<EnsibleItemRunComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EnsibleItemRunComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EnsibleItemRunComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
