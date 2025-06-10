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

  @Output()
  onRemoveVideo: EventEmitter<number> = new EventEmitter<number>();

  getCoverImageFile() {
    return this.files.find(file => file.type.startsWith('image/'));
  }

  getVideoFile() {
    return this.files.find(file => file.type.startsWith('video/'));
  }

  switchCoverImage() {
    let coverImageIndex = this.files.findIndex(file => file.type.startsWith('image/'));
    this.onSwitchCoverImage.emit(coverImageIndex);
  }

  async removeVideo() {
    let res =await this.dialogUtils.openConfirmDialog('Delete video', 'Are you sure you want to remove this video?\nNote: this only remove from pinterest');
    
    if(res) {
      let videoIndex = this.files.findIndex(file => file.type.startsWith('video/'));
      this.onRemoveVideo.emit(videoIndex);
    }
  }
}
