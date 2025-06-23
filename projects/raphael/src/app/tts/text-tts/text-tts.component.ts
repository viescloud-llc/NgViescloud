import { Component, OnInit } from '@angular/core';
import { ObjectStorageService } from 'projects/viescloud-utils/src/lib/service/object-storage-manager.service';
import { FileUtils } from 'projects/viescloud-utils/src/lib/util/File.utils';
import { TTSService } from '../../service/tts.service';
import { StringUtils } from 'projects/viescloud-utils/src/lib/util/String.utils';
import { pdfDefaultOptions, TextLayerRenderedEvent } from 'ngx-extended-pdf-viewer';
import { TtsReaderService } from '../../service/tts-reader.service';
import { TtsReaderServiceV1 } from '../../service/tts-reader-v1.service';
import { QuickSideDrawerMenuService } from 'projects/viescloud-utils/src/lib/service/quick-side-drawer-menu.service';
import { TextTtsPanelComponent } from './text-tts-panel/text-tts-panel.component';

@Component({
  selector: 'app-text-tts',
  templateUrl: './text-tts.component.html',
  styleUrls: ['./text-tts.component.scss']
})
export class TextTtsComponent implements OnInit {

  src = '../../../assets/pdf-test.pdf';

  constructor(
    private ttsReaderService: TtsReaderService,
    private sideDrawerService: QuickSideDrawerMenuService
  ) { }

  ngOnInit(): void {
    pdfDefaultOptions.textLayerMode = 1;
    this.sideDrawerService.loadComponent(TextTtsPanelComponent);

    this.ttsReaderService.onUploadingFile.subscribe({
      next: objectUrl => {
        this.src = objectUrl;
      }
    })
  }

  onTextLayerRendered(textLayerRenderedEvent: TextLayerRenderedEvent) {
    this.ttsReaderService.onTextLayerRendered(textLayerRenderedEvent);
  }

  onPageChange(pageNumber: number) {

  }
}
