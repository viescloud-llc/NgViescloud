import { AfterContentInit, AfterViewInit, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { ProductBasicComponent } from '../product-basic/product-basic.component';
import { ProductData } from '../data/product-data.service';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UtilsService, VFile } from 'projects/viescloud-utils/src/lib/service/Utils.service';
import { MatOption } from 'projects/viescloud-utils/src/lib/model/Mat.model';
import { ConfirmDialog } from 'projects/viescloud-utils/src/lib/dialog/confirm-dialog/confirm-dialog.component';
import { ViesPinterestService, ProductService } from 'projects/viescloud-utils/src/lib/service/AffiliateMarketing.service';
import { PinRequest, MediaSourceMultipleImage, MediaSourceImageUrl, MediaSourceVideo, Category, PinterestPinData, MediaSourceType, FileLink } from 'projects/viescloud-utils/src/lib/model/AffiliateMarketing.model';
import { QuickSideDrawerMenuService } from 'projects/viescloud-utils/src/lib/service/QuickSideDrawerMenu.service';
import { S3StorageServiceV1 } from 'projects/viescloud-utils/src/lib/service/ObjectStorageManager.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-pinterest-product',
  templateUrl: './pinterest-product.component.html',
  styleUrls: ['./pinterest-product.component.scss']
})
export class PinterestProductComponent extends ProductBasicComponent {

  fileOptions: MatOption<number>[] = [];
  boardNameOptions: MatOption<string>[] = [];

  blankRequestObject: PinRequest = new PinRequest();
  blankMediaSourceImages: MediaSourceMultipleImage = new MediaSourceMultipleImage();
  blankMediaSourceImage: MediaSourceImageUrl = new MediaSourceImageUrl();
  blankMediaSourceVideo: MediaSourceVideo = new MediaSourceVideo();
  blankCategory: Category = new Category();
  protected blankInitData?: PinterestPinData;

  width: number = 1080;
  height: number = 1920;

  constructor(
    protected pinterestService: ViesPinterestService,
    protected override matDialog: MatDialog,
    protected override productService: ProductService,
    protected override s3StorageService: S3StorageServiceV1,
    protected override route: Router,
    protected override data: ProductData,
    protected override snackBar: MatSnackBar
  ) { 
    super(matDialog, productService, s3StorageService, route, data, snackBar);
  }
  
  override ngOnChanges(changes?: SimpleChanges): void {
    super.ngOnChanges(changes!);
    this.updateBoardNameOptions();
    this.initVFileOptions();
  }

  override ngOnInit(): void {
    if(this.finishLoading()) {
      super.ngOnInit();
      this.initData();
      this.updateBoardNameOptions();
      this.initVFileOptions();
      this.syncVFile();
    }
    else {
      setTimeout(() => {
        this.ngOnInit();
      }, 100);
    }
  }

  private finishLoading() {
    if(this.data.product) {
      if(this.data.product.fileLinks && this.data.product.fileLinks.length > 0 && this.data.files.length == 0)
        return false;
    
      return true;
    }
    else
      return false;
  }

  protected getInitDataValue() {
    if(!this.blankInitData) {
      this.blankInitData = new PinterestPinData();
      this.blankInitData.pinResponse = undefined;
      this.blankInitData.pinRequest.media_source = undefined;
    }

    return this.blankInitData;
  }

  protected initData() {
    let data = this.getInitDataValue();
    if (!this.product.pinterestPinData)
      this.product.pinterestPinData = structuredClone(data);

    if (!this.product.pinterestPinData!.pinRequest)
      this.product.pinterestPinData!.pinRequest = structuredClone(data.pinRequest);
  }

  override isProductChange(): boolean {
    if(UtilsService.isEqual(this.product.pinterestPinData, this.getInitDataValue()))
      return false;

    return super.isProductChange();
  }

  syncVFile() {
    this.vFiles = [];

    if(this.product && this.product.pinterestPinData && this.product.pinterestPinData.pinRequest.media_source) {
      let mediaSource = this.product.pinterestPinData.pinRequest.media_source;
      
      if(mediaSource instanceof MediaSourceMultipleImage || (mediaSource && mediaSource.source_type == MediaSourceType.IMAGES)) {
        let mediaSource = this.product.pinterestPinData!.pinRequest.media_source as MediaSourceMultipleImage;
        for(let i = 0; i < this.data.files.length; i++) {
          let file = this.data.files[i];
          if(mediaSource.items.findIndex(e => e.url === file.name || e.url.substring(e.url.lastIndexOf('/') + 1) === file.name) >= 0)
            this.vFiles.push(file);
        }
      }
      else if(mediaSource instanceof MediaSourceImageUrl || (mediaSource && mediaSource.source_type == MediaSourceType.IMAGE)) {
        let mediaSource = this.product.pinterestPinData!.pinRequest.media_source as MediaSourceImageUrl;
        let fileIndex = this.data.files.findIndex(e => UtilsService.isEqual(e.name, mediaSource.url) || mediaSource.url.substring(e.name.lastIndexOf('/') + 1) === e.name);
        if(fileIndex >= 0)
          this.vFiles.push(this.data.files[fileIndex]);
      }
    }
  }

  initVFileOptions() {
    this.fileOptions = [];
    if(this.product && this.product.pinterestPinData) {
      let mediaSource = this.product.pinterestPinData.pinRequest.media_source;
      let mediaSourceType = !mediaSource ? null : mediaSource instanceof MediaSourceMultipleImage ? 'image/' : 'video/'
      for(let i = 0; i < (this.product.fileLinks ? this.product.fileLinks!.length : 0); i++) {
        let link = this.product.fileLinks![i];
        let file = this.data.files[i];
  
        if(!this.vFiles.some(e => UtilsService.isEqual(e, file))) {
          if(!mediaSourceType || (file && file.type.startsWith(mediaSourceType))) {
            this.fileOptions.push({
              value: i,
              valueLabel: "File " + (i + 1) + ": " + link.link
            })
          }
        }
      }
    }
  }

  importFileFromProduct(index: number) {
    let file = this.data.files[index];
    let fileLink = this.product.fileLinks![index];
    this.vFiles.push(file);

    if(this.vFiles.length == 1) {
      if(file.type.startsWith('image/')) {
        this.product.pinterestPinData!.pinRequest.media_source = new MediaSourceImageUrl();
      }
      else if (file.type.startsWith('video/')) {
        this.product.pinterestPinData!.pinRequest.media_source = new MediaSourceVideo();
      }
    }

    if(file.type.startsWith('image/')) {
      if(this.vFiles.length == 1) {
        let mediaSoruce = this.product.pinterestPinData!.pinRequest.media_source as MediaSourceImageUrl;
        mediaSoruce.url = fileLink.link;
        mediaSoruce.is_standard = true;
      }
      else if(this.vFiles.length == 2) {
        let currentMediaSoruce = this.product.pinterestPinData!.pinRequest.media_source as MediaSourceImageUrl;
        let newMediaSource = new MediaSourceMultipleImage();
        newMediaSource.items = [];
        this.addItem(newMediaSource, currentMediaSoruce.url);
        this.addItem(newMediaSource, fileLink.link);
        this.product.pinterestPinData!.pinRequest.media_source = newMediaSource;
      }
      else {
        let mediaSoruce = this.product.pinterestPinData!.pinRequest.media_source as MediaSourceMultipleImage;
        this.addItem(mediaSoruce, fileLink.link);
      }
    }

    this.initVFileOptions();
  }

  private addItem(mediaSoruce: MediaSourceMultipleImage, url: string) {
    mediaSoruce.items.push({
      id: 0,
      title: 'Image ' + (mediaSoruce.items.length + 1),
      description: '',
      link: this.product.marketingLink,
      url: url
    });
  }

  getMediaSourceBlankObject() {
    let mediaSource = this.product.pinterestPinData!.pinRequest.media_source;
    if(mediaSource instanceof MediaSourceMultipleImage || (mediaSource && mediaSource.source_type == MediaSourceType.IMAGES))
      return this.blankMediaSourceImages;
    else if(mediaSource instanceof MediaSourceImageUrl || (mediaSource && mediaSource.source_type == MediaSourceType.IMAGE))
      return this.blankMediaSourceImage;
    else
      return this.blankMediaSourceVideo;
  }

  override onRemoveFile(index: number): void {
      this.vFiles.splice(index, 1);
      this.initVFileOptions();

      let mediaSource = this.product.pinterestPinData!.pinRequest.media_source;
      if(mediaSource instanceof MediaSourceMultipleImage || (mediaSource && mediaSource.source_type == MediaSourceType.IMAGES)) {
        if(this.vFiles.length <= 0)
          this.product.pinterestPinData!.pinRequest.media_source = undefined;
        else {
          let mediaSource = this.product.pinterestPinData!.pinRequest.media_source as MediaSourceMultipleImage;
          mediaSource.items.splice(index, 1);
        }
      }
      else if(mediaSource instanceof MediaSourceVideo || (mediaSource && mediaSource.source_type == MediaSourceType.VIDEO)) {
        this.product.pinterestPinData!.pinRequest.media_source = undefined;
      }
  }

  protected addNewFile(): void {
    this.importFileFromProduct(this.data.files.length - 1);
    this.selectedFileIndex = this.vFiles.length - 1;
    this.initVFileOptions();
  }

  autoFillInformation() {
    let dialog = this.matDialog.open(ConfirmDialog, {data: {title: 'Auto fill information', message: 'You are about to auto fill and overwrite your pinterest Information with your product information. Do you want to continue?', no: 'cancel', yes: 'ok'}});
    dialog.afterClosed().subscribe({
      next: res => {
        if(res) {
          let product = this.product;
          let pinRequest = structuredClone(product.pinterestPinData!.pinRequest);
          pinRequest.title = product.title;
          pinRequest.link = product.marketingLink;
          pinRequest.alt_text = product.marketingLink;
          pinRequest.description = product.description;
          pinRequest.note = `Original Link: ${product.originalLink}\nPrice: ${product.price}`;
          pinRequest.media_source = undefined;
          pinRequest.boardName = product.category.name;
          this.product.pinterestPinData!.pinRequest = pinRequest;
          this.vFiles = [];
          for(let [i, file] of this.data.files.entries()) {
            if(file.type.startsWith('image/')) {
              this.importFileFromProduct(i);
            }
          }
          this.initVFileOptions();
        }
      }
    })
  }

  uploadProduct() {
    let dialog = this.matDialog.open(ConfirmDialog, {data: {title: 'Upload product', message: 'You are about to upload your product to Pinterest. Do you want to continue?', no: 'cancel', yes: 'ok'}});
    dialog.afterClosed().subscribe({
      next: res => {
        if(res) {
          this.pinterestService.uploadPin(this.product.id, this.width, this.height).pipe(UtilsService.waitLoadingDialog(this.matDialog)).subscribe({
            next: res => {
              this.product = res;
              // this.data.productCopy = structuredClone(res);
            },
            error: err => {
              this.data.error = 'Error uploading product, please try again by refreshing the page';
            }
          })
        }
      }
    })
  }

  updateBoardNameOptions(): void {
    this.boardNameOptions = [];
    this.data.categories.forEach(category => {
      let option: MatOption<string> = {
        value: category.name,
        valueLabel: category.name
      }

      this.boardNameOptions.push(option);
    })
  }

  override reverse(): void {
      super.reverse();
      this.ngOnInit();
  }

  
}
