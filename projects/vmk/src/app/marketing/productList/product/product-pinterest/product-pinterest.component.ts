import { Component, OnInit } from '@angular/core';
import { ProductBasicComponent } from '../product-basic/product-basic.component';
import { Image, MediaSource, MediaSourceImageUrl, MediaSourceMultipleImage, MediaSourceType, MediaSourceVideo, PinRequest, PinResponse, PinterestPinData } from 'projects/viescloud-utils/src/lib/model/AffiliateMarketing.model';
import { UtilsService, VFile } from 'projects/viescloud-utils/src/lib/service/Utils.service';

@Component({
  selector: 'app-product-pinterest',
  templateUrl: './product-pinterest.component.html',
  styleUrls: ['./product-pinterest.component.scss']
})
export class ProductPinterestComponent extends ProductBasicComponent {

  pinRequest!: PinRequest;
  pinResponse?: PinResponse;

  //blank object
  blankPinRequest = new PinRequest();
  blankMediaSourceMultipleImage: MediaSourceMultipleImage = new MediaSourceMultipleImage();
  blankMediaSourceImage: MediaSourceImageUrl = new MediaSourceImageUrl();
  blankMediaSourceVideo: MediaSourceVideo = new MediaSourceVideo();

  override ngOnInit() {
    this.product = structuredClone(this.data.product);
    this.vFiles = [];
    this.vFilesCopy = [];

    if(!this.product.pinterestPinData) {
      this.product.pinterestPinData = new PinterestPinData();
      this.product.pinterestPinData.pinResponse = undefined;
      this.product.pinterestPinData.pinRequest.media_source = undefined;
      this.data.product = structuredClone(this.product);
    }

    this.pinRequest = this.product.pinterestPinData.pinRequest;
    this.pinResponse = this.product.pinterestPinData.pinResponse;
    this.initFetchVFiles();
  }
  
  override initFetchVFiles(): void {
    if(this.pinRequest.media_source && this.pinRequest.media_source instanceof MediaSourceImageUrl) {
      let url = this.pinRequest.media_source.url;
      this.s3StorageService.fetchFile(url)
      .pipe(UtilsService.waitLoadingSnackBarDynamicString(this.snackBar, `Loading ${url}`))
      .subscribe({
        next: (res) => {
          this.pushVFile(res);
          this.vFilesCopy = structuredClone(this.vFiles);
        }
      })
    }
  }

  override setEditingComponent(): void {
    this.data.isEditingComponent = 'pinterest';
  }

  getMediaSourceBlankObject() {
    let mediaSource = this.product.pinterestPinData!.pinRequest.media_source;
    if(mediaSource instanceof MediaSourceMultipleImage || (mediaSource && mediaSource.source_type == MediaSourceType.IMAGES))
      return this.blankMediaSourceMultipleImage;
    else if(mediaSource instanceof MediaSourceImageUrl || (mediaSource && mediaSource.source_type == MediaSourceType.IMAGE))
      return this.blankMediaSourceImage;
    else
      return this.blankMediaSourceVideo;
  }

  addMediaSource(vfile: VFile) {
    if(!this.pinRequest.media_source) {
      if(vfile.type.toLowerCase().includes('image')) {
        this.pinRequest.media_source = new MediaSourceImageUrl();
        let mediaSource = this.pinRequest.media_source as MediaSourceImageUrl;
        mediaSource.url = vfile.originalLink ?? vfile.name;
      }
      else if(vfile.type.toLowerCase().includes('video')) {
        this.pinRequest.media_source = this.handleUploadVideo(vfile);
      }
    }
    else if(this.pinRequest.media_source instanceof MediaSourceImageUrl) {
      let mediaSource!: any;

      if(vfile.type.toLowerCase().includes('image')) {
        mediaSource = new MediaSourceMultipleImage();
        mediaSource.items = [
          {
            id: 0,
            title: this.pinRequest.media_source.url,
            description: '',
            link: this.product.marketingLink,
            url: this.pinRequest.media_source.url
          },
          {
            id: 0,
            title: vfile.originalLink ?? vfile.name,
            description: '',
            link: this.product.marketingLink,
            url: vfile.originalLink ?? vfile.name
          },
        ];
      }
      else if(vfile.type.toLowerCase().includes('video')) {
        mediaSource = this.handleUploadVideo(vfile);
      }

      this.pinRequest.media_source = mediaSource;
    }
    else if(this.pinRequest.media_source instanceof MediaSourceMultipleImage) {
      this.pinRequest.media_source.items.push({
        id: 0,
        title: vfile.originalLink ?? vfile.name,
        description: '',
        link: this.product.marketingLink,
        url: vfile.originalLink ?? vfile.name
      })
    }
  }

  removeMediaSource(index: number) {
    if (!this.pinRequest.media_source) {
      return;
    }
  
    if (this.pinRequest.media_source instanceof MediaSourceImageUrl) {
      // If the current source is a single image, we can remove it by setting the media source to undefined.
      this.pinRequest.media_source = undefined;
    } 
    else if (this.pinRequest.media_source instanceof MediaSourceMultipleImage) {
      // If the current source is a multiple image source, remove the item at the given index.
      if (index < 0 || index >= this.pinRequest.media_source.items.length) {
        return; // Index out of bounds check
      }
  
      // Remove the image at the specified index
      this.pinRequest.media_source.items.splice(index, 1);
  
      // Check how many items remain after the removal
      if (this.pinRequest.media_source.items.length === 1) {
        // If only one item remains, convert it to a `MediaSourceImageUrl`
        const remainingItem = this.pinRequest.media_source.items[0];
        this.pinRequest.media_source = new MediaSourceImageUrl(0, MediaSourceType.IMAGE, remainingItem.url);
      } else if (this.pinRequest.media_source.items.length === 0) {
        // If no items remain, set the media source to undefined
        this.pinRequest.media_source = undefined;
      }
    }
    else if (this.pinRequest.media_source instanceof MediaSourceVideo) {
      // For MediaSourceVideo, directly set the media source to undefined if it is being removed.
      this.pinRequest.media_source = undefined;
    }
  }
  
  private handleUploadVideo(vfile: VFile): MediaSourceVideo {
    //TODO: add handle upload video latter
    return new MediaSourceVideo();
  }

  override async onUploadFile(): Promise<VFile> {
    let vfile = await super.onUploadFile();
    this.addMediaSource(vfile);
    return vfile;
  }

  override onRemoveFile(index: number): void {
    super.onRemoveFile(index);
    this.removeMediaSource(index);
  }

  override async onFetchFile(uri: string): Promise<VFile> {
    let vfile = await super.onFetchFile(uri);
    this.addMediaSource(vfile);
    return vfile;
  }

  uploadProduct() {

  }
}
