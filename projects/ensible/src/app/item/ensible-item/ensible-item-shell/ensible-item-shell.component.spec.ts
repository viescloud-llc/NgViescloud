import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EnsibleItemShellComponent } from './ensible-item-shell.component';

describe('EnsibleItemShell Component', () => {
  let component: EnsibleItemShellComponent;
  let fixture: ComponentFixture<EnsibleItemShellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EnsibleItemShellComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EnsibleItemShellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
