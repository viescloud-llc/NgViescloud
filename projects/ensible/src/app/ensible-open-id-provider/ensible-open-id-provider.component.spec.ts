import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EnsibleOpenIdProviderComponent } from './ensible-open-id-provider.component';

describe('EnsibleOpenIdProvider Component', () => {
  let component: EnsibleOpenIdProviderComponent;
  let fixture: ComponentFixture<EnsibleOpenIdProviderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EnsibleOpenIdProviderComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EnsibleOpenIdProviderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
