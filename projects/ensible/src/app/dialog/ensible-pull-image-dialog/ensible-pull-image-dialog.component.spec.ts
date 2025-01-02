import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EnsiblePullImageDialog } from './ensible-pull-image-dialog.component';

describe('EnsiblePullImageDialog Component', () => {
  let component: EnsiblePullImageDialog;
  let fixture: ComponentFixture<EnsiblePullImageDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EnsiblePullImageDialog ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EnsiblePullImageDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
