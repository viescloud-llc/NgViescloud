import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EnsibleItemListComponent } from './ensible-item-list.component';

describe('ensibleitemlist Component', () => {
  let component: EnsibleItemListComponent;
  let fixture: ComponentFixture<EnsibleItemListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EnsibleItemListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EnsibleItemListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
