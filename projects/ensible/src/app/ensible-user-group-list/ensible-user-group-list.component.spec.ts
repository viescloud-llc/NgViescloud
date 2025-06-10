import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EnsibleUserGroupListComponent } from './ensible-user-group-list.component';

describe('EnsibleUserGroupList Component', () => {
  let component: EnsibleUserGroupListComponent;
  let fixture: ComponentFixture<EnsibleUserGroupListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EnsibleUserGroupListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EnsibleUserGroupListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
