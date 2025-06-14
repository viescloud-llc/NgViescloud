import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DnsSettingListComponent } from './dns-setting-list.component';

describe('DnsSettingList Component', () => {
  let component: DnsSettingListComponent;
  let fixture: ComponentFixture<DnsSettingListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DnsSettingListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DnsSettingListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
