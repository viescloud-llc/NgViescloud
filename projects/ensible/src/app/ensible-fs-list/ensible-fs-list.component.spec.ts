import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EnsibleFsListComponent } from './ensible-fs-list.component';

describe('EnsibleFsList Component', () => {
  let component: EnsibleFsListComponent;
  let fixture: ComponentFixture<EnsibleFsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EnsibleFsListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EnsibleFsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
