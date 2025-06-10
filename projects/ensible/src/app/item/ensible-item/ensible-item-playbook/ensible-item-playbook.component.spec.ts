import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EnsibleItemPlaybookComponent } from './ensible-item-playbook.component';

describe('EnsibleItemPlaybook Component', () => {
  let component: EnsibleItemPlaybookComponent;
  let fixture: ComponentFixture<EnsibleItemPlaybookComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EnsibleItemPlaybookComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EnsibleItemPlaybookComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
