import { Component, OnInit } from '@angular/core';
import { Sentence, TtsReaderService } from '../../../service/tts-reader.service';

@Component({
  selector: 'app-text-tts-panel',
  templateUrl: './text-tts-panel.component.html',
  styleUrls: ['./text-tts-panel.component.scss']
})
export class TextTtsPanelComponent implements OnInit {
  selectedSentence: Sentence | null | undefined = null;
  preloadSentence: number = 5;  
  readOnClick: boolean = false;
  reading: boolean = false;

  constructor(
    public ttsReaderService: TtsReaderService
  ) { }

  ngOnInit(): void {
    this.ttsReaderService.onSentenceClick.subscribe({
      next: sentence => {
        if(this.selectedSentence !== sentence && sentence) {
          if(this.reading) {
            this.selectedSentence?.hightLightColor.next('');
          }

          this.selectedSentence = sentence;

          if(this.readOnClick) {
            if(this.reading) {
              this.beginReading(sentence);
            }
            else {
              this.readSentence(sentence);
            }
          }
        }
      }
    })
  }

  async readSentence(sentence: Sentence) {
    sentence.hightLightColor.next(sentence.hightLightColorMain.value);
    this.ttsReaderService.preloadForwardFromSentence(sentence, this.preloadSentence);
    this.ttsReaderService.preloadBackwardFromSentence(sentence, this.preloadSentence);
    return this.ttsReaderService.playSentence(sentence);  
  }

  async beginReading(sentence: Sentence) {
    this.reading = true;
    await this.readSentence(sentence);
    this.selectedSentence?.hightLightColor.next('');
    this.selectedSentence = this.ttsReaderService.documentManager.getNextSentence(sentence);

    if(this.selectedSentence && this.reading) {
      this.beginReading(this.selectedSentence);
    }
  }

  stopReading() {
    this.ttsReaderService.audioPlayer.stop();
    this.reading = false;
  }

  checkMin0Value(value: number) {
    return value >= 0 ? value : 0;
  }
}
