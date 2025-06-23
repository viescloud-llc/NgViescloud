import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TextTtsPanelComponent } from './text-tts-panel.component';

describe('TextTtsPanel Component', () => {
  let component: TextTtsPanelComponent;
  let fixture: ComponentFixture<TextTtsPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TextTtsPanelComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TextTtsPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
