import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AttributeDefinitionListComponent } from './attribute-definition-list.component';

describe('AttributeDefinitionList Component', () => {
  let component: AttributeDefinitionListComponent;
  let fixture: ComponentFixture<AttributeDefinitionListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AttributeDefinitionListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AttributeDefinitionListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
