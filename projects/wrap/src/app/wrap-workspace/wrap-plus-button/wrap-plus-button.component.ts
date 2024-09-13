import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Wrap } from 'projects/viescloud-utils/src/lib/model/Wrap.model';

@Component({
  selector: 'app-wrap-plus-button',
  templateUrl: './wrap-plus-button.component.html',
  styleUrls: ['./wrap-plus-button.component.scss']
})
export class WrapPlusButtonComponent implements OnInit {

  @Output()
  onNewWrap: EventEmitter<Wrap> = new EventEmitter();

  constructor() { }

  ngOnInit() {
  }

}
