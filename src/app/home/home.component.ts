import { Component } from '@angular/core';
import { ViescloudUtilsModule } from '../../lib/viescloud-utils.module';
import { RxJSUtils } from '../../lib/util/RxJS.utils';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports: [ViescloudUtilsModule]
})
export class HomeComponent {
  constructor(
    private rxjsUtils: RxJSUtils
  ) { }
}
