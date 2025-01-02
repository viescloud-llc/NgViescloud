import { EnsibleDockerService } from './../../service/ensible-docker/ensible-docker.service';
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { EnsibleWebsocketService } from '../../service/ensible-websocket/ensible-websocket.service';
import { StringUtils } from 'projects/viescloud-utils/src/lib/util/String.utils';

@Component({
  selector: 'app-ensible-pull-image-dialog',
  templateUrl: './ensible-pull-image-dialog.component.html',
  styleUrls: ['./ensible-pull-image-dialog.component.scss']
})
export class EnsiblePullImageDialog implements OnInit {

  output: string = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {
      imageName: string
    },
    private webSocketService: EnsibleWebsocketService,
    private ensibleDockerService: EnsibleDockerService
  ) { }

  ngOnInit(): void {
    let outputTopic = StringUtils.generateUUID();
    this.webSocketService.watchForTopic(outputTopic).subscribe({
      next: res => {
        this.output = res.body;
      }
    });

    this.ensibleDockerService.pullImage(this.data.imageName, outputTopic).subscribe({
      next: res => {
        this.output = res;
      }
    });
  }
}
