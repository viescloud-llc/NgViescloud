import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { WrapMode } from '../wrap-workspace.component';
import { Link, Wrap, WrapHotKey, WrapType } from 'projects/viescloud-utils/src/lib/model/Wrap.model';
import { TrackByIndex } from 'projects/viescloud-utils/src/lib/directive/TrackByIndex';
import { MatDialog } from '@angular/material/dialog';
import { WrapDialog } from 'projects/viescloud-utils/src/lib/dialog/wrap-dialog/wrap-dialog.component';
import { ConfirmDialog } from 'projects/viescloud-utils/src/lib/dialog/confirm-dialog/confirm-dialog.component';
import { WrapLinkDialog } from 'projects/viescloud-utils/src/lib/dialog/wrap-link-dialog/wrap-link-dialog.component';
import { RgbColor } from 'projects/viescloud-utils/src/lib/model/Rgb.model';
import { KeyCaptureService } from 'projects/viescloud-utils/src/lib/service/KeyCapture.service';
import { Subscription } from 'rxjs';
import { ExpiableMap } from 'projects/viescloud-utils/src/lib/model/ExpirableMap.model';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';

@Component({
  selector: 'app-wrap-item',
  templateUrl: './wrap-item.component.html',
  styleUrls: ['./wrap-item.component.scss']
})
export class WrapItemComponent extends TrackByIndex implements OnInit, OnDestroy {

  @Input()
  wrap!: Wrap;

  @Output()
  wrapChange: EventEmitter<Wrap> = new EventEmitter();

  @Input()
  mode!: WrapMode;

  @Output()
  modeChange: EventEmitter<WrapMode> = new EventEmitter();

  @Output()
  onMoveLeft: EventEmitter<void> = new EventEmitter();

  @Output()
  onMoveRight: EventEmitter<void> = new EventEmitter();

  @Output()
  onDelete: EventEmitter<void> = new EventEmitter();

  WrapType = WrapType;
  Mode = WrapMode;
  WrapHotKey = WrapHotKey;

  keyCaptureEvent?: Subscription;

  statusUrlMap = new Map<string, number>();
  expireTime = 5000; // 5 seconds

  constructor(
    private matDialog: MatDialog,
    private keyCaptureService: KeyCaptureService,
    private httpClient: HttpClient
  ) { 
    super();
  }
  ngOnDestroy(): void {
    if(this.keyCaptureEvent)
      this.keyCaptureEvent.unsubscribe();
  }

  ngOnInit() {
    if(!this.wrap.children)
      this.wrap.children = [];

    this.statusCheck();
    setInterval(() => {
      this.statusCheck();
    }, this.expireTime);

    this.keyCaptureEvent = this.keyCaptureService.keyEvents$.subscribe({
      next: event => {
        if(this.wrap.hotKey && event.key === this.wrap.hotKey) {
          this.open(this.wrap);
        }
      }
    })
  }

  private statusCheck() {
    if (this.wrap.links && this.wrap.links.length > 0) {
      this.wrap.links.forEach(link => {
        if (link.enableStatusCheck && link.statusCheckUrl) {
          let headers = new HttpHeaders();
          if (link.statusCheckHeaders && link.statusCheckHeaders.length > 0) {
            link.statusCheckHeaders.forEach(header => {
              headers.append(header.name, header.value);
            });
          }

          this.httpClient.get(link.statusCheckUrl, { headers: headers, observe: 'response' }).subscribe({
            next: (response: HttpResponse<any>) => {
              this.statusUrlMap.set(link.statusCheckUrl, response.status);
            },
            error: (response: HttpResponse<any>) => {
              this.statusUrlMap.set(link.statusCheckUrl, response.status);
            }
          });
        }
      });
    }
  }

  open(wrap: Wrap) {
    if(this.mode === WrapMode.EDIT)
      this.edit(wrap);
    else if(wrap.links.length <= 0) {
      return;
    }
    else if(wrap.links.length > 1) {
      let dialog = this.matDialog.open(WrapLinkDialog, {
        data: {
          wrap: wrap,
          statusUrlMap: this.statusUrlMap
        },
        width: 'max-content'
      })

      dialog.afterClosed().subscribe({
        next: result => {
          if(result) {
            dialog.close();
          }
        }
      })
    }
    else {
      this.openLink(wrap.links[0]);
    }
  }

  edit(wrap: Wrap) {
    if(this.mode === WrapMode.EDIT) {
      var dialog = this.matDialog.open(WrapDialog, {
        data: {
          wrap: structuredClone(wrap),
          title: 'Edit Wrap'
        },
        width: '100%'
      })
  
      dialog.afterClosed().subscribe({
        next: result => {
          if(result) {
            this.wrap = result;
            this.wrapChange.emit(result);
          }
        }
      })
    }
  }

  openLink(link: Link) {
    window.open(link.serviceUrl);
  }

  getGroupTooltip(wrap: Wrap) {
    return `\tTitle: ${wrap.title}
    \tProvider: ${wrap.provider || 'None'}
    \tDescription: ${wrap.description}
    \tTags: ${wrap.tags.join(', ')}
    \tColor: ${this.colorStr(wrap.color)}
    \tChildren: ${wrap.children.length} items`;
  }

  getItemTooltip(wrap: Wrap) {
    return `\tTitle: ${wrap.title}
    \tProvider: ${wrap.provider || 'None'}
    \tDescription: ${wrap.description}
    \tTags: ${wrap.tags.join(', ')}
    \tHot Key: ${wrap.hotKey}
    \t${this.getItemLinkTooltip(wrap)}
    \tColor: ${this.colorStr(wrap.color)}`;
  }

  private colorStr(color: RgbColor) {
    if(color.name) {
      return `rgb(${color.r}, ${color.g}, ${color.b})`;
    }
    else
      return 'default';
  }

  getItemLinkTooltip(wrap: Wrap) {
    let link: string = 'Links: ';
    wrap.links.forEach((e, i) => {
      link += `\n\t${i + 1}. ${e.label}: ${e.serviceUrl}`
      link += `\n\t\t- Enable Status Check: ${e.enableStatusCheck ? 'Enabled' : 'Disabled'}`
      if(e.statusCheckUrl)
        link += `\n\t\t- Status Check Url: ${e.statusCheckUrl}`
      if(e.statusCheckHeaders) {
        e.statusCheckHeaders.forEach((header, j) => {
          link += `\n\t\t- Status Check Header ${j + 1}: ${header.name}: ${header.value}`
        })
      }
      if(e.statusCheckAcceptResponseCode)
        link += `\n\t\t- Status Check Accept Response Code: ${e.statusCheckAcceptResponseCode}`
    })
    return link;
  }

  displayTooltip(message: string) {
    let dialog = this.matDialog.open(ConfirmDialog, {
      data: {
        message: message,
        title: 'Wrap Info',
        yes: 'Close',
        no: ''
      },
      width: '100%'
    })

    dialog.afterClosed().subscribe({
      next: result => {
        if(result) {
          dialog.close();
        }
      }
    })
  }

  displayGroupTooltip(wrap: Wrap) {
    this.displayTooltip(this.getGroupTooltip(wrap));
  }

  displayItemTooltip(wrap: Wrap) {
    this.displayTooltip(this.getItemTooltip(wrap));
  }

  deleteWrap(index: number) {
    let dialog = this.matDialog.open(ConfirmDialog, {
      data: {
        message: 'Are you sure you want to delete this wrap?',
        title: 'Confirm Delete',
        yes: 'Delete',
        no: 'Cancel'
      },
      width: '100%'
    })

    dialog.afterClosed().subscribe({
      next: result => {
        if(result) {
          this.wrap.children.splice(index, 1);
          this.wrapChange.emit(this.wrap);
        }
      }
    })
  }

  moveLeft(index: number) {
    let toIndex = index - 1;
    if(toIndex < 0)
      toIndex = this.wrap.children.length - 1;
    this.swap(this.wrap, index, toIndex);
  }

  moveRight(index: number) {
    let toIndex = index + 1;
    if(toIndex > this.wrap.children.length - 1)
      toIndex = 0;
    this.swap(this.wrap, index, toIndex);
  }

  swap(wrap: Wrap, fromIndex: number, toIndex: number) {
    if(toIndex < 0 || toIndex >= wrap.children.length)
      return;
    
    let temp = wrap.children[fromIndex];
    wrap.children[fromIndex] = wrap.children[toIndex];
    wrap.children[toIndex] = temp;
    this.wrapChange.emit(this.wrap);
  }

  getNgStyle(wrap: Wrap) {
    return {
      'background': wrap.backgroundPicture ? `url(${wrap.backgroundPicture})` : '',
      'backgroundSize': 'cover',
      'background-color': wrap.color && wrap.color.name ? `rgb(${wrap.color.r}, ${wrap.color.g}, ${wrap.color.b})` : ''
    }
  }

  getNgStyleLinkCheck(link: Link) {
    let status = this.statusUrlMap.get(link.statusCheckUrl);

    return {
      'color': status === Number.parseInt(link.statusCheckAcceptResponseCode) ? 'green' : 'red'
    }
  }
}
