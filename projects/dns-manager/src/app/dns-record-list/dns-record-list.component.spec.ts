import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DnsRecordListComponent } from './dns-record-list.component';

describe('DnsRecordList Component', () => {
  let component: DnsRecordListComponent;
  let fixture: ComponentFixture<DnsRecordListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DnsRecordListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DnsRecordListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
