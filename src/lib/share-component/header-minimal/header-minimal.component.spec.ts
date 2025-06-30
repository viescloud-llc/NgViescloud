import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeaderMinimalComponent } from './header-minimal.component';

describe('header-minimal Component', () => {
  let component: HeaderMinimalComponent;
  let fixture: ComponentFixture<HeaderMinimalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HeaderMinimalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HeaderMinimalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
