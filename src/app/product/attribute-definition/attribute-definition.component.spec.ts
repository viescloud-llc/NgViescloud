import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AttributeDefinitionComponent } from './attribute-definition.component';

describe('AttributeDefinition Component', () => {
  let component: AttributeDefinitionComponent;
  let fixture: ComponentFixture<AttributeDefinitionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AttributeDefinitionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AttributeDefinitionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
