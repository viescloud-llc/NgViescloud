import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ProductDisplayComponent } from '../product-display/product-display.component';

@Component({
  selector: 'app-product-display-video',
  templateUrl: './product-display-video.component.html',
  styleUrls: ['./product-display-video.component.scss']
})
export class ProductDisplayVideoComponent extends ProductDisplayComponent {

  @Output()
  onSwitchCoverImage: EventEmitter<number> = new EventEmitter<number>();
  
  getCoverImageFile() {
    return this.files.find(file => file.type.startsWith('image/'));
  }

  getVideoFile() {
    return this.files.find(file => file.type.startsWith('video/'));
  }

  switchCoverImage(selectedFileIndex: number) {
    this.onSwitchCoverImage.emit(selectedFileIndex);
  }
}
