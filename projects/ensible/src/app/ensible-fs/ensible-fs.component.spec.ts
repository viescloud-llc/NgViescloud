import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EnsibleFsComponent } from './ensible-fs.component';

describe('ensiblefs Component', () => {
  let component: EnsibleFsComponent;
  let fixture: ComponentFixture<EnsibleFsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EnsibleFsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EnsibleFsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
