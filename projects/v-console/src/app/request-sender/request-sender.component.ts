import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-request-sender',
  templateUrl: './request-sender.component.html',
  styleUrls: ['./request-sender.component.scss']
})
export class RequestSenderComponent implements OnInit {

  request: string = 'GET';
  url: string = "";

  constructor() { }

  ngOnInit() {
  }

}
