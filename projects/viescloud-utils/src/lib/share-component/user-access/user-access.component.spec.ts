import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserAccessComponent } from './user-access.component';
import { UserAccess, SharedUser, SharedGroup, AccessPermission } from '../../model/authenticator.model';

describe('UserAccess Component', <T extends UserAccess | SharedUser[] | SharedGroup[] | AccessPermission[]> () => {
  let component: UserAccessComponent<T>;
  let fixture: ComponentFixture<UserAccessComponent<T>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UserAccessComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UserAccessComponent<T>);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
