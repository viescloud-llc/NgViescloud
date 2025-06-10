import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EnsibleItemListPlaybookComponent } from './ensible-item-list-playbook.component';

describe('EnsibleItemListPlaybook Component', () => {
  let component: EnsibleItemListPlaybookComponent;
  let fixture: ComponentFixture<EnsibleItemListPlaybookComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EnsibleItemListPlaybookComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EnsibleItemListPlaybookComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
