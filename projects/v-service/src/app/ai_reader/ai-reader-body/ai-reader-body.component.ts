import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AiReaderService } from '../ai-reader.service';
import { SettingService } from 'projects/viescloud-utils/src/lib/service/Setting.service';
import { NgxExtendedPdfViewerService, pdfDefaultOptions } from 'ngx-extended-pdf-viewer';

@Component({
  selector: 'app-ai-reader-body',
  templateUrl: './ai-reader-body.component.html',
  styleUrls: ['./ai-reader-body.component.scss']
})
export class AiReaderBodyComponent implements OnInit, OnDestroy {
  
  constructor(
    public aiReaderService: AiReaderService, 
    private pdfViewerService: NgxExtendedPdfViewerService, 
    private settingService: SettingService) { }

  ngOnDestroy(): void {
    this.aiReaderService.clearSelectedSpeak();
  }

  ngOnInit() {
    this.aiReaderService.pdfViewerService = this.pdfViewerService;
    pdfDefaultOptions.textLayerMode = this.pdfViewerService ? 2 : 1;
    this.settingService.currentMenu = 'ai-menu';
  }
}
