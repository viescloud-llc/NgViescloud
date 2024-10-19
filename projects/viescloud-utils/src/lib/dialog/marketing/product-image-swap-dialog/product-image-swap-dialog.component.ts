import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatOption } from '../../../model/Mat.model';

export enum ProductImageSwapType {
  UPLOAD = 'upload',
  IMPORT_URL = 'import_uri',
  IMPORT_VFILES = 'import_vfiles'
}

export interface ProductImageSwapDialogRespondData {
  type: ProductImageSwapType;
  url?: string;
}

@Component({
  selector: 'app-product-image-swap-dialog',
  templateUrl: './product-image-swap-dialog.component.html',
  styleUrls: ['./product-image-swap-dialog.component.scss']
})
export class ProductImageSwapDialog implements OnInit {

  ProductImageSwapType = ProductImageSwapType;

  selectedOption?: ProductImageSwapType = ProductImageSwapType.IMPORT_VFILES;

  options: MatOption<ProductImageSwapType>[] = [
    {
      value: ProductImageSwapType.UPLOAD,
      valueLabel: 'Upload more'
    },
    {
      value: ProductImageSwapType.IMPORT_URL,
      valueLabel: 'Import from URL'
    },
    {
      value: ProductImageSwapType.IMPORT_VFILES,
      valueLabel: 'Import from Options'
    }
  ]

  fileOptions: MatOption<string>[] = [];

  constructor( 
    @Inject(MAT_DIALOG_DATA) public data: {fileOptions: MatOption<string>[]},
    private dialogRef: MatDialogRef<ProductImageSwapDialog>
  ) { 
    this.fileOptions = data.fileOptions;
  }

  ngOnInit() {
  }

  onValueChange(value: ProductImageSwapType) {
    if(value === ProductImageSwapType.UPLOAD) {
      this.closeDialog(ProductImageSwapType.UPLOAD, '');
    }
    else
      this.selectedOption = value;
  }

  closeDialog(value: ProductImageSwapType, url: string) {
    let respondData: ProductImageSwapDialogRespondData = {
      type: value,
      url: url
    }

    this.dialogRef.close(respondData);
  }
}
