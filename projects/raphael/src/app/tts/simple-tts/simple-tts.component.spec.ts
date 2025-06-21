import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleTtsComponent } from './simple-tts.component';

describe('SimpleTts Component', () => {
  let component: SimpleTtsComponent;
  let fixture: ComponentFixture<SimpleTtsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SimpleTtsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SimpleTtsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
