import { ChangeDetectorRef, Component, Inject, OnInit, SimpleChanges } from '@angular/core';
import { ProductBasicComponent } from '../product-basic/product-basic.component';
import { Image, MediaSource, MediaSourceImageUrl, MediaSourceMultipleImage, MediaSourceType, MediaSourceVideo, PinRequest, PinResponse, PinterestPinData } from 'projects/viescloud-utils/src/lib/model/AffiliateMarketing.model';
import { UtilsService, VFile } from 'projects/viescloud-utils/src/lib/service/Utils.service';
import { MatOption } from 'projects/viescloud-utils/src/lib/model/Mat.model';
import { firstValueFrom } from 'rxjs';
import { ConfirmDialog } from 'projects/viescloud-utils/src/lib/dialog/confirm-dialog/confirm-dialog.component';
import { ProductService, ViesPinterestService } from 'projects/viescloud-utils/src/lib/service/AffiliateMarketing.service';
import { MatDialog } from '@angular/material/dialog';
import { S3StorageServiceV1 } from 'projects/viescloud-utils/src/lib/service/ObjectStorageManager.service';
import { Router } from '@angular/router';
import { ProductData } from '../data/product-data.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { QuickSideDrawerMenuService } from 'projects/viescloud-utils/src/lib/service/QuickSideDrawerMenu.service';
import { RxJSUtils } from 'projects/viescloud-utils/src/lib/util/RxJS.utils';
import { DataUtils } from 'projects/viescloud-utils/src/lib/util/Data.utils';
import { DialogUtils } from 'projects/viescloud-utils/src/lib/util/Dialog.utils';
import { ProductImageSwapType } from 'projects/viescloud-utils/src/lib/dialog/marketing/product-image-swap-dialog/product-image-swap-dialog.component';
import { RouteUtil } from 'projects/viescloud-utils/src/lib/util/Route.utils';

@Component({
  selector: 'app-product-pinterest',
  templateUrl: './product-pinterest.component.html',
  styleUrls: ['./product-pinterest.component.scss']
})
export class ProductPinterestComponent extends ProductBasicComponent {

  pinRequest!: PinRequest;
  pinResponse?: PinResponse;

  fileOptions: MatOption<string>[] = [];
  boardNameOptions: MatOption<string>[] = [];

  //blank object
  blankPinRequest = new PinRequest();
  blankMediaSourceMultipleImage: MediaSourceMultipleImage = new MediaSourceMultipleImage();
  blankMediaSourceImage: MediaSourceImageUrl = new MediaSourceImageUrl();
  blankMediaSourceVideo: MediaSourceVideo = new MediaSourceVideo();

  //additional fields
  width: number = 1920;
  height: number = 1080;

  constructor(
    protected override route: Router,
    protected override data: ProductData,
    protected override productService: ProductService,
    protected override s3StorageService: S3StorageServiceV1,
    protected override quickSideDrawerMenuService: QuickSideDrawerMenuService,
    protected override dialogUtils: DialogUtils,
    protected override rxjsUtils: RxJSUtils,
    protected pinterestService?: ViesPinterestService,
  ) { 
    super(route, data, productService, s3StorageService, quickSideDrawerMenuService, dialogUtils, rxjsUtils);
  }

  override async ngOnInit() {
    this.setDisabledProductDisplay(true);
    this.product = structuredClone(this.data.product!);
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
    await this.initFetchVFiles();
    this.initFileOptions();
    this.initBoardNameOptions();
    this.setDisabledProductDisplay(false);
  }
  
  override async initFetchVFiles() {
    if(this.pinRequest.media_source) {
      if(this.pinRequest.media_source.source_type == MediaSourceType.IMAGE) {
        let ms = this.pinRequest.media_source as MediaSourceImageUrl;
        let url = ms.url;
        let res = await firstValueFrom(this.s3StorageService.fetchFile(url).pipe(this.rxjsUtils.waitLoadingDynamicMessagePopup(`Loading ${url}`, 'Dismiss')))
        this.pushVFile(res);
        this.vFilesCopy = structuredClone(this.vFiles);
      }
      else if(this.pinRequest.media_source.source_type == MediaSourceType.IMAGES) {
        let ms = this.pinRequest.media_source as MediaSourceMultipleImage;

        for(let item of ms.items) {
          let url = item.url;
          let res = await firstValueFrom(this.s3StorageService.fetchFile(url).pipe(this.rxjsUtils.waitLoadingDynamicMessagePopup(`Loading ${url}`, 'Dismiss')))
          this.pushVFile(res);
          this.vFilesCopy = structuredClone(this.vFiles);
        }
      }
      else if(this.pinRequest.media_source.source_type == MediaSourceType.VIDEO) {
        let ms = this.pinRequest.media_source as MediaSourceVideo;

        if(ms.cover_image_url) {
          let res = await firstValueFrom(this.s3StorageService.fetchFile(ms.cover_image_url).pipe(this.rxjsUtils.waitLoadingDynamicMessagePopup(`Loading ${ms.cover_image_url}`, 'Dismiss')))
          this.pushVFile(res);
          this.vFilesCopy = structuredClone(this.vFiles);
        }

        if(ms.video_url) {
          let res = await firstValueFrom(this.s3StorageService.fetchFile(ms.video_url).pipe(this.rxjsUtils.waitLoadingDynamicMessagePopup(`Loading ${ms.video_url}`, 'Dismiss')))
          this.pushVFile(res);
          this.vFilesCopy = structuredClone(this.vFiles);
        }
      }
    }
  }

  override setEditingComponent(): void {
    this.data.isEditingComponent = 'pinterest';
  }

  override setDisabledProductDisplay(disabled: boolean): void {
    if(this.pinResponse)
      this.disableProductDisplay = true;
    else
      this.disableProductDisplay = disabled;
  }

  initFileOptions() {
    this.fileOptions = [];
    this.product.fileLinks?.forEach((fileLink, index) => {
      if(this.vFiles.some(e => e.originalLink === fileLink.link))
        return;
      let fileName = this.s3StorageService.extractPathFromViesLink(fileLink.link);
      this.fileOptions.push({
        value: fileLink.link,
        valueLabel: `File ${index + 1}: ${UtilsService.getMaxString(fileName.split('/')[fileName.split('/').length - 1].trim(), 10)} - ${fileLink.mediaType}`
      })
    })
  }

  initBoardNameOptions(): void {
    this.boardNameOptions = [];
    this.data.categories.forEach(category => {
      let option: MatOption<string> = {
        value: category.name,
        valueLabel: category.name
      }

      this.boardNameOptions.push(option);
    })
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
        this.pinRequest.media_source = new MediaSourceVideo();
        let mediaSource = this.pinRequest.media_source as MediaSourceVideo;
        mediaSource.video_url = vfile.originalLink ?? vfile.name;
      }
    }
    else if(this.pinRequest.media_source.source_type == MediaSourceType.IMAGE) {
      let ms = this.pinRequest.media_source as MediaSourceImageUrl;
      let mediaSource!: any;

      if(vfile.type.toLowerCase().includes('image')) {
        mediaSource = new MediaSourceMultipleImage();
        mediaSource.items = [
          {
            id: 0,
            title: ms.url,
            description: '',
            link: this.product.marketingLink,
            url: ms.url
          },
          {
            id: 0,
            title: vfile.originalLink ?? vfile.name,
            description: '',
            link: this.product.marketingLink,
            url: vfile.originalLink ?? vfile.name
          },
        ];

        this.pinRequest.media_source = mediaSource;
      }
      else if(vfile.type.toLowerCase().includes('video')) {
        firstValueFrom(this.s3StorageService.fetchFile(ms.url).pipe(this.rxjsUtils.waitLoadingDynamicMessagePopup(`Loading ${ms.url}`, 'Dismiss'))).then(tempFetch => {
          mediaSource = new MediaSourceVideo();
          mediaSource.video_url = vfile.originalLink ?? vfile.name;
          mediaSource.cover_image_url = ms.url;
          mediaSource.cover_image_content_type = tempFetch.type;

          this.pinRequest.media_source = mediaSource;
        })
      }
    }
    else if(this.pinRequest.media_source.source_type == MediaSourceType.IMAGES) {
      if(vfile.type.toLowerCase().includes('image')) {
        let ms = this.pinRequest.media_source as MediaSourceMultipleImage;
        ms.items.push({
          id: 0,
          title: vfile.originalLink ?? vfile.name,
          description: '',
          link: this.product.marketingLink,
          url: vfile.originalLink ?? vfile.name
        })
      }
      else {
        this.dialogUtils.openConfirmDialog('Error', 'Only image file can be uploaded to multiple image source.', 'Ok', '');
      }
    }
    else if(this.pinRequest.media_source.source_type == MediaSourceType.VIDEO) {
      if(vfile.type.toLowerCase().includes('image')) {
        let ms = this.pinRequest.media_source as MediaSourceVideo;
        ms.cover_image_url = vfile.originalLink ?? vfile.name;
        ms.cover_image_content_type = vfile.type;
      }
      else if (vfile.type.toLowerCase().includes('video')) {
        this.dialogUtils.openConfirmDialog('Error', 'Only 1 video file can be uploaded to video source.', 'Ok', '');
      }
    }
  }

  removeMediaSource(index: number, fileType?: 'image' | 'video') {
    if (!this.pinRequest.media_source) {
      return;
    }
  
    if (this.pinRequest.media_source.source_type == MediaSourceType.IMAGE) {
      // If the current source is a single image, we can remove it by setting the media source to undefined.
      this.pinRequest.media_source = undefined;
    } 
    else if (this.pinRequest.media_source.source_type == MediaSourceType.IMAGES) {
      let ms = this.pinRequest.media_source as MediaSourceMultipleImage;

      // If the current source is a multiple image source, remove the item at the given index.
      if (index < 0 || index >= ms.items.length) {
        return; // Index out of bounds check
      }
  
      // Remove the image at the specified index
      ms.items.splice(index, 1);
  
      // Check how many items remain after the removal
      if (ms.items.length === 1) {
        // If only one item remains, convert it to a `MediaSourceImageUrl`
        const remainingItem = ms.items[0];
        this.pinRequest.media_source = new MediaSourceImageUrl(0, MediaSourceType.IMAGE, remainingItem.url);
      } else if (ms.items.length === 0) {
        // If no items remain, set the media source to undefined
        this.pinRequest.media_source = undefined;
      }
    }
    else if (this.pinRequest.media_source.source_type == MediaSourceType.VIDEO) {
      let ms = this.pinRequest.media_source as MediaSourceVideo;

      if(fileType === 'image') {
        ms.cover_image_url = '';
        ms.cover_image_content_type = '';
      }
      else if(fileType === 'video') {
        ms.video_url = '';

        if(ms.video_url == '' && ms.cover_image_url == '') {
          this.pinRequest.media_source = undefined;
        }
        else {
          let mediaSource = new MediaSourceImageUrl();
          mediaSource.url = ms.cover_image_url;
          this.pinRequest.media_source = mediaSource;
        }
      }
      else {
        this.pinRequest.media_source = undefined;
      }
    }
  }
  
  override async onUploadFile(): Promise<VFile> {
    let vfile = await super.onUploadFile();
    this.addMediaSource(vfile);
    return vfile;
  }

  override onRemoveFile(index: number): void {
    let fileType: 'video' | 'image' = this.vFiles[index].type.toLowerCase().includes('video') ? 'video' : 'image';
    super.onRemoveFile(index);
    this.removeMediaSource(index, fileType);
    this.initFileOptions();
  }

  onSelectFileOptions(link: string) {
    return new Promise<VFile>((resolve, reject) => {
      this.s3StorageService.fetchFile(link).pipe(this.rxjsUtils.waitLoadingDynamicMessagePopup(`Loading ${link}`, 'Dismiss')).subscribe({
        next: res => {
          this.pushVFile(res);
          this.addMediaSource(res);
          this.initFileOptions();
          resolve(res);
        },
        error: err => reject(err)
      })
    })
  }

  override async onFetchFile(uri: string): Promise<VFile> {
    let vfile = await super.onFetchFile(uri);
    this.addMediaSource(vfile);
    return vfile;
  }

  async onSwitchFile(index: number) {
    this.dialogUtils.openProductImageSwapDialog(this.fileOptions).then(async res => {
      switch (res.type) {
        case ProductImageSwapType.UPLOAD:
          await this.onUploadFile();
          break;
        case ProductImageSwapType.IMPORT_URL:
          if(res.url) {
            await this.onFetchFile(res.url);
          }
          break;
        case ProductImageSwapType.IMPORT_VFILES:
          if(res.url) {
            await this.onSelectFileOptions(res.url);
          }
          break;
      }

      this.onRemoveFile(index);
      this.initFileOptions();

      if(this.pinRequest.media_source?.source_type == MediaSourceType.VIDEO) {
        let ms = this.pinRequest.media_source as MediaSourceVideo;
        ms.cover_image_url = this.vFiles[this.vFiles.length - 1].originalLink ?? this.vFiles[this.vFiles.length - 1].name;
        ms.cover_image_content_type = this.vFiles[this.vFiles.length - 1].type;
      }
    })
  }

  protected async checkValidVFilesBeforeUpload() {
    let result = true;
    let badVFiles: VFile[] = [];

    for (const vf of this.vFiles) {
      if (vf.originalLink && this.s3StorageService.containViesLink(vf.originalLink)) {
        let path = this.s3StorageService.extractPathFromViesLink(vf.originalLink);
        
        if(vf.type.toLowerCase().includes('image')) {
          await firstValueFrom(this.s3StorageService.getFileByPath(path, this.width, this.height).pipe(UtilsService.waitLoadingDialog(this.dialogUtils.matDialog))).catch(e => {
            result = false;
            badVFiles.push(vf);
          });
        }
      }
    }

    if(badVFiles.length > 0) {
      let dialog = this.dialogUtils.matDialog.open(ConfirmDialog, {
        data: {
          title: 'Error', 
          message: this.getBadVFilesMessage(badVFiles), 
          no: '', 
          yes: 'ok'
        }, 
        width: '100%'
      });

      dialog.afterClosed().subscribe({ next: res => { } })
    }

    return result;
  }

  private getBadVFilesMessage(badVFiles: VFile[]): string {
    let message = 'Some of your files are not valid (might be corrupted) for resizing:\n';
    for (const vf of badVFiles) {
      message += `\t- File ${this.getFilesIndex(vf)}: ${vf.name}\n`;
    }

    return `${message}\nPlease remove those files and upload it again.`;
  }

  private getFilesIndex(vfile: VFile): number {
    return this.vFiles.indexOf(vfile) + 1;
  }

  async uploadProduct() {
    let dialog = this.dialogUtils.matDialog.open(ConfirmDialog, {data: {title: 'Upload product', message: 'You are about to upload your product to Pinterest. Do you want to continue?', no: 'cancel', yes: 'ok'}, width: '100%'});
    
    dialog.afterClosed().subscribe({
      next: async res => {
        if(res) {
          let validFileCheck = await this.checkValidVFilesBeforeUpload();
          if(validFileCheck) {
            this.pinterestService?.uploadPin(this.product.id, this.width, this.height).pipe(UtilsService.waitLoadingDialog(this.dialogUtils.matDialog)).subscribe({
              next: res => {
                this.route.navigate(['/marketing/products/', res.id, 'overall']);
              },
              error: err => {
                this.dialogUtils.openConfirmDialog('Error', `Error ${this.pinResponse ? 'updating' : 'uploading'} product, please try again or refresh the page if the error persists`, 'OK', '');
              }
            })
          }
        }
      }
    })
  }

  override async syncVFiles(): Promise<void> {
    try {
      // Post new file
      await this.postNewVFile();
      this.syncVFileData();
    }
    catch (error) {
      console.error('Error during file synchronization:', error);
      throw error;
    }
  }

  protected syncVFileData() {
    let mediaSource = this.pinRequest.media_source;

    if(!mediaSource)
      return;

    if(mediaSource instanceof MediaSourceImageUrl || mediaSource.source_type == MediaSourceType.IMAGE) {
      let ms = this.pinRequest.media_source as MediaSourceImageUrl;
      if(this.vFiles.length > 0)
        ms.url = this.vFiles[0].originalLink!;
      else {
        this.dialogUtils.openConfirmDialog('ERROR', 'File link can not be null', 'OK', '');
        throw Error('File link can not be null');
      }

      this.pinRequest.media_source = ms;
    }
    else if(mediaSource instanceof MediaSourceMultipleImage || mediaSource.source_type == MediaSourceType.IMAGES) {
      let ms = this.pinRequest.media_source as MediaSourceMultipleImage;
      ms.items = ms.items.filter(e => this.vFiles.some(f => f.name === e.url || f.originalLink === e.url));
      ms.items.forEach(e => {
        let index = this.vFiles.findIndex(f => f.name === e.url || f.originalLink === e.url);
        let vFile = this.vFiles[index];
        if(vFile.originalLink)
          e.url = vFile.originalLink;
        else {
          this.dialogUtils.openConfirmDialog('ERROR', 'File link can not be null', 'OK', '');
          throw Error('File link can not be null');
        }
      })

      this.pinRequest.media_source = ms;
    }
    else if(mediaSource instanceof MediaSourceVideo || mediaSource.source_type == MediaSourceType.VIDEO) {
      let ms = this.pinRequest.media_source as MediaSourceVideo;
      
      let coverImageVFile = this.vFiles.find(e => e.name === ms.cover_image_url || e.originalLink === ms.cover_image_url);
      if(coverImageVFile && coverImageVFile.originalLink) {
        ms.cover_image_url = coverImageVFile.originalLink;
      }
      else {
        this.dialogUtils.openConfirmDialog('ERROR', 'File link can not be null', 'OK', '');
        throw Error('File link can not be null');
      }

      let videoUrlVFile = this.vFiles.find(e => e.name === ms.video_url || e.originalLink === ms.video_url);
      if(videoUrlVFile && videoUrlVFile.originalLink) {
        ms.video_url = videoUrlVFile.originalLink;
      }
      else {
        this.dialogUtils.openConfirmDialog('ERROR', 'File link can not be null', 'OK', '');
        throw Error('File link can not be null');
      }
      
      this.pinRequest.media_source = ms;
    }
  }

  protected async postNewVFile() {
    for (const vFile of this.vFiles) {
      //if this file is not in vfile copy
      if (this.vFilesCopy.findIndex(e => e.name === vFile.name) < 0) {
        //if this is a new file by checking for vies link
        if (!this.s3StorageService.containViesLink(vFile.originalLink ?? '')) {
          const metadata = await firstValueFrom(this.s3StorageService.postFile(vFile).pipe(UtilsService.waitLoadingDialog(this.dialogUtils.matDialog)));
          vFile.originalLink = this.s3StorageService.generateViesLinkFromPath(metadata.path!);
          this.product.fileLinks!.push({
            id: 0,
            link: vFile.originalLink,
            mediaType: vFile.type,
            external: false
          });
        }
      }
    }
  }

  override async save(): Promise<void> {
    await super.save();
    await this.ngOnInit();
  }

  autoFillInformation() {
    let dialog = this.dialogUtils.matDialog.open(ConfirmDialog, {data: {title: 'Auto fill information', message: 'You are about to auto fill and overwrite your pinterest Information with your product information. Do you want to continue?', no: 'cancel', yes: 'ok'}});
    dialog.afterClosed().subscribe({
      next: res => {
        if(res) {
          let pinRequest = new PinRequest();
          pinRequest.title = this.product.title;
          pinRequest.link = this.product.marketingLink;
          pinRequest.alt_text = this.product.marketingLink;
          pinRequest.description = this.product.description;
          pinRequest.note = this.getNote();
          pinRequest.boardName = this.product.category.name;
          pinRequest.media_source = undefined;
          this.pinRequest = pinRequest;
          this.vFiles = [];
          if(this.product.fileLinks && this.product.fileLinks.length > 0) {
            for(let file of this.product.fileLinks) {
              if(file.mediaType.includes('image')) {
                this.onSelectFileOptions(file.link);
              }
            }
          }
          this.product.pinterestPinData!.pinRequest = this.pinRequest;
        }
      }
    })
  }

  private getNote() {
    return `Original Link: ${this.product.originalLink}
Marketing Link: ${this.product.marketingLink}
VMK link: ${RouteUtil.getCurrentUrl()}
Price: ${this.product.price}`;
  }

  vFileContainVideo() {
    return this.vFiles.some(e => e.type.toLowerCase().includes('video'));
  }
}
