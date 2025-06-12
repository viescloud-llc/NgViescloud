import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OpenIdProviderComponent } from './open-id-provider.component';

describe('OpenIdProvider Component', () => {
  let component: OpenIdProviderComponent;
  let fixture: ComponentFixture<OpenIdProviderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OpenIdProviderComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OpenIdProviderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
