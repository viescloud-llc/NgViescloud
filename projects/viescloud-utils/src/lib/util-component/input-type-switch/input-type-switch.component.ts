import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-input-type-switch',
  templateUrl: './input-type-switch.component.html',
  styleUrls: ['./input-type-switch.component.scss']
})
export class InputTypeSwitchComponent implements OnInit {

  @Input()
  switch: boolean = true;

  @Input()
  htmlInputElement!: HTMLInputElement;

  @Input()
  trueValue: string = 'text';

  @Input()
  falseValue: string = 'password';

  @Input()
  onIcon: string = 'visibility';

  @Input()
  offIcon: string = 'visibility_off';

  constructor() { }

  ngOnInit() {
    this.changeVisibility();
  }

  changeVisibility()
  {
    let type: string = '';
    this.switch ? type = this.trueValue : type = this.falseValue;
    this.htmlInputElement.type = type;
  }

  switchVisibility()
  {
    this.switch = !this.switch;
    this.changeVisibility();
  }

}
