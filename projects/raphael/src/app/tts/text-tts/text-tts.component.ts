import { Component } from '@angular/core';
import { ObjectStorageService } from 'projects/viescloud-utils/src/lib/service/object-storage-manager.service';
import { FileUtils } from 'projects/viescloud-utils/src/lib/util/File.utils';
import { TTSService } from '../../service/tts.service';
import { StringUtils } from 'projects/viescloud-utils/src/lib/util/String.utils';

@Component({
  selector: 'app-text-tts',
  templateUrl: './text-tts.component.html',
  styleUrls: ['./text-tts.component.scss']
})
export class TextTtsComponent {

  src = '../../../assets/pdf-test.pdf';

  constructor(
    private ttsService: TTSService,
    private objectStorageService: ObjectStorageService
  ) { }

  async upload() {
    let vfile =await FileUtils.uploadFileAsVFile('pdf').catch(err => null);
    if(vfile && vfile.rawFile) {
      let objectUrl = await this.objectStorageService.createObjectUrl(StringUtils.makeId(20), vfile.rawFile);
      this.src = objectUrl;
    }
  }
}
