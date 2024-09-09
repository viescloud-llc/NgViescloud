import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialog } from 'projects/viescloud-utils/src/lib/dialog/confirm-dialog/confirm-dialog.component';
import { MatOption } from 'projects/viescloud-utils/src/lib/model/Mat.model';
import { UtilsService, VFile } from 'projects/viescloud-utils/src/lib/service/Utils.service';
import { ProductData } from '../data/product-data.service';

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
  files: VFile[] = [];

  @Input()
  selectedIndex: number = 0;
  @Output()
  selectedIndexChange = new EventEmitter<number>();

  @Input()
  fileOptions: MatOption<number>[] = [];
  
  @Output()
  onRemoveFile = new EventEmitter<number>();

  @Output()
  onSelectFileOption = new EventEmitter<number>();

  @Output()
  onAddFile = new EventEmitter<void>();

  constructor(
    private matDialog: MatDialog,
    public data: ProductData
  ) { }
  ngOnChanges(changes: SimpleChanges): void {
    if(changes['data']) {
      this.data.populateAllFile(this.data.selectedResolution);
    }
  }
  ngOnInit(): void {
    this.data.populateAllFile(this.data.selectedResolution);
  }

  fetchFile() {
    this.data.fetchFile(this.data.inputUri).then(() => {
      this.data.inputUri = '';
      this.data.populateAllFile(this.data.selectedResolution);
      this.onAddFile.emit();
    });
  }

  uploadFile() {
    this.data.uploadFile().then(() => {
      this.data.populateAllFile(this.data.selectedResolution);
      this.onAddFile.emit();
    })
  }
  
  removeFile(index: number) {
    let dialog = this.matDialog.open(ConfirmDialog, {data: {title: 'Delete file', message: 'Are you sure you want to remove this file?', no: 'cancel', yes: 'ok'}});

    dialog.afterClosed().subscribe({
      next: res => {
        if(res) {
          this.onRemoveFile.emit(index);
        }
      }
    });
    
  }

  getWidthResolution() {
   switch(this.data.selectedResolution) {
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
   switch(this.data.selectedResolution) {
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

}
