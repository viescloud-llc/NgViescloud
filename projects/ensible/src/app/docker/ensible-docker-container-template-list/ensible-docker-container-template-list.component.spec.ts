import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EnsibleDockerContainerTemplateListComponent } from './ensible-docker-container-template-list.component';

describe('EnsibleDockerContainerTemplateList Component', () => {
  let component: EnsibleDockerContainerTemplateListComponent;
  let fixture: ComponentFixture<EnsibleDockerContainerTemplateListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EnsibleDockerContainerTemplateListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EnsibleDockerContainerTemplateListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
