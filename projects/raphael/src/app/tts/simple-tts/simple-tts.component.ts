import { AfterContentInit, AfterViewInit, Component, OnInit } from '@angular/core';
import { ViescloudUtilsModule } from "../../../../../viescloud-utils/src/lib/viescloud-utils.module";
import { NgComponentModule } from "../../../../../viescloud-utils/src/lib/module/ng-component.module";
import { TTSService } from '../../service/tts.service';
import { BehaviorSubject, map } from 'rxjs';
import { ValueTracking } from 'projects/viescloud-utils/src/lib/abtract/valueTracking.directive';
import { ObjectStorageService } from 'projects/viescloud-utils/src/lib/service/object-storage-manager.service';
import { VFile } from 'projects/viescloud-utils/src/lib/model/vies.model';
import { RxJSUtils } from 'projects/viescloud-utils/src/lib/util/RxJS.utils';

@Component({
  selector: 'app-simple-tts',
  templateUrl: './simple-tts.component.html',
  styleUrls: ['./simple-tts.component.scss']
})
export class SimpleTtsComponent extends ValueTracking<string> implements OnInit {

  override value: string = '';
  override valueCopy: string = '';

  validForm = new BehaviorSubject<boolean>(false);

  generatedVfile?: VFile;

  constructor(
    public ttsService: TTSService,
    private objectStorageService: ObjectStorageService,
    private rxjsUtils: RxJSUtils
  ) { 
    super();
  }

  ngOnInit(): void {
    
  }

  isValidForm() {
    return this.validForm.value;
  }

  speak() {
    this.updateValue();
    this.generatedVfile = undefined;

    this.ttsService.generateWavVfile({
        text: this.value,
        model: this.ttsService.selectedModel,
        voice: this.ttsService.selectedVoice
    }, this.objectStorageService)
    .pipe(this.rxjsUtils.waitLoadingDialog())
    .subscribe({
      next: vfile => {
        this.objectStorageService.createObjectUrl(vfile.originalLink!, vfile.rawFile!).then(objectUrl => {
          vfile.objectUrl = objectUrl;
          this.generatedVfile = vfile;
        });
      }
    });
  }

}
