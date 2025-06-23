import { Component, OnInit } from '@angular/core';
import { Sentence, TtsReaderService } from '../../../service/tts-reader.service';
import { FileUtils } from 'projects/viescloud-utils/src/lib/util/File.utils';
import { StringUtils } from 'projects/viescloud-utils/src/lib/util/String.utils';
import { ObjectStorageService } from 'projects/viescloud-utils/src/lib/service/object-storage-manager.service';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-text-tts-panel',
  templateUrl: './text-tts-panel.component.html',
  styleUrls: ['./text-tts-panel.component.scss']
})
export class TextTtsPanelComponent implements OnInit {
  selectedSentence: Sentence | null | undefined = null;
  preloadSentence: number = 10;
  readOnClick: boolean = false;
  reading: boolean = false;
  autoScrollOnReading: boolean = true;

  constructor(
    public ttsReaderService: TtsReaderService,
    private objectStorageService: ObjectStorageService
  ) { }

  ngOnInit(): void {
    this.ttsReaderService.onSentenceClick.subscribe({
      next: sentence => {
        this.selectSentence(sentence);
      }
    })
  }

  selectSentence(sentence?: Sentence | null) {
    if (this.selectedSentence !== sentence && sentence) {
      this.selectedSentence?.hightLightColor.next('');
      this.selectedSentence = sentence;
      sentence.hightLightColor.next(sentence.hightLightColorMain.value);

      if (this.readOnClick) {
        if (this.reading) {
          this.beginReading(sentence);
        }
        else {
          this.readSentence(sentence);
        }
      }
    }
  }

  scollToSentence(sentence: Sentence) {
    this.ttsReaderService.pdfViewerService.scrollPageIntoView(sentence.pageNumber[sentence.pageNumber.length - 1], {top: sentence.index * 50});
  }

  async readSentence(sentence: Sentence) {

    if(this.reading && this.autoScrollOnReading) {
      this.scollToSentence(sentence);
    }

    sentence.hightLightColor.next(sentence.hightLightColorMain.value);

    if(!this.ttsReaderService.useSpeechSyhnthesis) {
      this.ttsReaderService.preloadForwardFromSentence(sentence, this.preloadSentence);
      this.ttsReaderService.preloadBackwardFromSentence(sentence, this.preloadSentence);
    }

    return this.ttsReaderService.playSentence(sentence);
  }

  async beginReading(sentence: Sentence) {
    this.reading = true;
    await this.readSentence(sentence);
    this.selectedSentence?.hightLightColor.next('');
    this.selectedSentence = this.ttsReaderService.documentManager.getNextSentence(sentence);

    if (this.selectedSentence && this.reading) {
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

  async upload() {
    let vfile = await FileUtils.uploadFileAsVFile('pdf').catch(err => null);
    if (vfile && vfile.rawFile) {
      let objectUrl = await this.objectStorageService.createObjectUrl(StringUtils.makeId(20), vfile.rawFile);
      this.ttsReaderService.onUploadingFile.next(objectUrl);
    }
  }
}
