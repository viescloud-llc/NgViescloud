import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DnsRecordComponent } from './dns-record.component';

describe('DnsRecord Component', () => {
  let component: DnsRecordComponent;
  let fixture: ComponentFixture<DnsRecordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DnsRecordComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DnsRecordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
