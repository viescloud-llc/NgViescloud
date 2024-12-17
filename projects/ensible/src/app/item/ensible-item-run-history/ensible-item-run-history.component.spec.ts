import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EnsibleItemRunHistoryComponent } from './ensible-item-run-history.component';

describe('EnsibleItemRunHistory Component', () => {
  let component: EnsibleItemRunHistoryComponent;
  let fixture: ComponentFixture<EnsibleItemRunHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EnsibleItemRunHistoryComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EnsibleItemRunHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
