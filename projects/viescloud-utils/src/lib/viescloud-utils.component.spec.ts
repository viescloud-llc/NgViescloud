import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViescloudUtilsComponent } from './viescloud-utils.component';

describe('ViescloudUtilsComponent', () => {
  let component: ViescloudUtilsComponent;
  let fixture: ComponentFixture<ViescloudUtilsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ViescloudUtilsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViescloudUtilsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
