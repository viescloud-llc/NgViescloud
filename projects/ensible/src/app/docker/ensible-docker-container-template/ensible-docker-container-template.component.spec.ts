import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EnsibleDockerContainerTemplateComponent } from './ensible-docker-container-template.component';

describe('EnsibleDockerContainerTemplate Component', () => {
  let component: EnsibleDockerContainerTemplateComponent;
  let fixture: ComponentFixture<EnsibleDockerContainerTemplateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EnsibleDockerContainerTemplateComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EnsibleDockerContainerTemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
