import { Component, DoCheck, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialog } from 'projects/viescloud-utils/src/lib/dialog/confirm-dialog/confirm-dialog.component';
import { MatOption } from 'projects/viescloud-utils/src/lib/model/Mat.model';
import { UtilsService, VFile } from 'projects/viescloud-utils/src/lib/service/Utils.service';
import { ProductData } from '../data/product-data.service';
import { SmbService } from 'projects/viescloud-utils/src/lib/service/Smb.service';
import { SmbStorageServiceV1 } from 'projects/viescloud-utils/src/lib/service/ObjectStorageManager.service';
import { DialogUtils } from 'projects/viescloud-utils/src/lib/util/Dialog.utils';

@Component({
  selector: 'app-product-display',
  templateUrl: './product-display.component.html',
  styleUrls: ['./product-display.component.scss']
})
export class ProductDisplayComponent implements OnInit, OnChanges {

  resolutions = {
    '1080p': { width: 1920, height: 1080 },
    '720p': { width: 1280, height: 720 },
    '480p': { width: 854, height: 480 },
    '360p': { width: 640, height: 360 },
  };
  
  resolutionOptions: MatOption<any>[] = [
    {
      value: '1080p',
      valueLabel: '1080p'
    },
    {
      value: '720p',
      valueLabel: '720p'
    },
    {
      value: '480p',
      valueLabel: '480p'
    },
    {
      value: '360p',
      valueLabel: '360p'
    },
    {
      value: 'original',
      valueLabel: 'Original'
    }
  ];

  @Input()
  disabled: boolean = false;

  @Input()
  selectedIndex: number = 0;

  @Output()
  selectedIndexChange = new EventEmitter<number>();

  @Input()
  uploadError = '';

  @Input()
  files: VFile[] = [];

  @Input()
  fileOptions: MatOption<string>[] = [];

  @Input()
  maxNumImage = Number.MAX_SAFE_INTEGER;

  @Input()
  maxNumVideo = Number.MAX_SAFE_INTEGER;
  
  @Output()
  onRemoveFile = new EventEmitter<number>();

  @Output()
  onSelectFileOption = new EventEmitter<string>();

  @Output()
  onFetchFile = new EventEmitter<string>();

  @Output()
  onUploadFile = new EventEmitter<void>();

  inputUri = '';
  selectedResolution: '1080p' | '720p' | '480p' | '360p' | 'original' = '480p';

  currentNumImage = 0;
  currentNumVideo = 0;

  constructor(
    protected dialogUtils: DialogUtils,
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if(changes['files']) {
      this.populateAllFile(this.selectedResolution);
      this.inputUri = '';
    }
  }

  async ngOnInit() {
    this.populateAllFile(this.selectedResolution);
  }

  async populateAllFile(selectedResolution: '1080p' | '720p' | '480p' | '360p' | 'original') {
    this.currentNumImage = 0;
    this.currentNumVideo = 0;
    for(let file of this.files) {
      if(file.rawFile) {
        if(file.extension === 'mp4' || file.extension === 'webm') {
          file.value = window.URL.createObjectURL(file.rawFile);
          this.currentNumVideo++;
        }
        else {
          if(selectedResolution !== 'original')
            file.value = await UtilsService.resizeImage(file.rawFile, selectedResolution);
          else
            file.value = window.URL.createObjectURL(file.rawFile);
          this.currentNumImage++;
        }
      }
    }
  }
  
  removeFile(index: number) {
    let dialog = this.dialogUtils.matDialog.open(ConfirmDialog, {data: {title: 'Delete file', message: 'Are you sure you want to remove this file?', no: 'cancel', yes: 'ok'}});

    dialog.afterClosed().subscribe({
      next: res => {
        if(res) {
          this.onRemoveFile.emit(index);
        }
      }
    });
    
  }

  getWidthResolution() {
   switch(this.selectedResolution) {
     case '1080p':
      return this.resolutions['1080p'].width;
     case '720p':
      return this.resolutions['720p'].width;
     case '480p':
      return this.resolutions['480p'].width;
     case '360p':
      return this.resolutions['360p'].width;
     case 'original':
      return 'auto';
   }
  }

  getHeightResolution() {
   switch(this.selectedResolution) {
     case '1080p':
      return this.resolutions['1080p'].height;
     case '720p':
      return this.resolutions['720p'].height;
     case '480p':
      return this.resolutions['480p'].height;
     case '360p':
      return this.resolutions['360p'].height;
     case 'original':
      return 'auto';
   }
  }

  isAddDisabled() {
    return this.disabled || this.currentNumImage >= this.maxNumImage && this.currentNumVideo >= this.maxNumVideo;
  }
}
