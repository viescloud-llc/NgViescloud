import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AttributeOptionListComponent } from './attribute-option-list.component';

describe('AttributeOptionList Component', () => {
  let component: AttributeOptionListComponent;
  let fixture: ComponentFixture<AttributeOptionListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AttributeOptionListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AttributeOptionListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
