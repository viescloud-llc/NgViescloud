import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TextTtsComponent } from './text-tts.component';

describe('TextTts Component', () => {
  let component: TextTtsComponent;
  let fixture: ComponentFixture<TextTtsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TextTtsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TextTtsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
