import { Component, forwardRef } from '@angular/core';
import { AiReaderService } from '../ai-reader.service';
import { UtilsService } from 'projects/viescloud-utils/src/lib/service/utils.service';
import { RaphaelTTSServiceV1 } from 'projects/viescloud-utils/src/lib/service/raphael.service';
import { SideDrawerMenuComponent } from 'projects/viescloud-utils/src/lib/share-component/side-drawer-menu/side-drawer-menu.component';

@Component({
  selector: 'app-side-drawer-ai-reader',
  templateUrl: './side-drawer-ai-reader.component.html',
  styleUrls: ['./side-drawer-ai-reader.component.scss'],
  providers: [{provide: SideDrawerMenuComponent, useExisting: forwardRef(() => SideDrawerAiReaderComponent)}],
})
export class SideDrawerAiReaderComponent extends SideDrawerMenuComponent {

  loadUrl: string = '';
  
  constructor(public aiReaderService: AiReaderService, private utilService: UtilsService, private raphaelTTSService: RaphaelTTSServiceV1) {
    super();
  }

  override ngOnInit(): void {
      
  }

  loadFromUrl() {
    this.raphaelTTSService.fetchFromUrl(this.loadUrl).subscribe(
      res => {
        let url = URL.createObjectURL(res.body!);
        this.aiReaderService.loadedSrc = url;
      }
    );
  }

  loadFromLocal() {
    this.utilService.uploadFile(".pdf").then(file => {
      let url = URL.createObjectURL(file.rawFile!);
      this.aiReaderService.loadedSrc = url;
    }).catch() 
  }
}
