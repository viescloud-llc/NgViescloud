import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatOption } from '../../../model/Mat.model';

export enum ProductImageSwapType {
  UPLOAD = 'upload',
  IMPORT_URL = 'import_uri',
  IMPORT_VFILES = 'import_vfiles'
}

@Component({
  selector: 'app-product-image-swap-dialog',
  templateUrl: './product-image-swap-dialog.component.html',
  styleUrls: ['./product-image-swap-dialog.component.scss']
})
export class ProductImageSwapDialog implements OnInit {

  ProductImageSwapType = ProductImageSwapType;

  selectedOption?: ProductImageSwapType;

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
    switch (value) {
      case ProductImageSwapType.UPLOAD:
        this.dialogRef.close({type: ProductImageSwapType.UPLOAD});
        break;
      case ProductImageSwapType.IMPORT_URL:
        this.dialogRef.close({type: ProductImageSwapType.IMPORT_URL, url: url});
        break;
      case ProductImageSwapType.IMPORT_VFILES:
        this.dialogRef.close({type: ProductImageSwapType.IMPORT_VFILES, url: url});
        break;
    }
  }
}
