import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Wrap, WrapType } from '../../model/wrap.model';
import { UtilsService } from '../../service/utils.service';
import { MatOption } from '../../model/mat.model';
import { FixChangeDetection } from '../../directive/FixChangeDetection';

@Component({
  selector: 'app-wrap-dialog',
  templateUrl: './wrap-dialog.component.html',
  styleUrls: ['./wrap-dialog.component.scss']
})
export class WrapDialog extends FixChangeDetection implements OnInit {

  wrap!: Wrap;
  blankObject: Wrap = new Wrap();
  options: MatOption<any>[] = UtilsService.getEnumMatOptions(WrapType);

  validForm: boolean = false;

  WrapType = WrapType;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {wrap: Wrap, title?: string}
  ) { 
    super();
    this.wrap = this.data.wrap;
  }

  ngOnInit() {
    
  }
}
