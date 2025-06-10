import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EnsibleItemListShellComponent } from './ensible-item-list-shell.component';

describe('EnsibleItemListShell Component', () => {
  let component: EnsibleItemListShellComponent;
  let fixture: ComponentFixture<EnsibleItemListShellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EnsibleItemListShellComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EnsibleItemListShellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
