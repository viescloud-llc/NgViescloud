import { Component, OnInit } from '@angular/core';
import { DnsRecord } from 'projects/viescloud-utils/src/lib/model/DnsManager.model';
import { DnsManagerService } from 'projects/viescloud-utils/src/lib/service/DnsManager.service';
import { RxJSUtils } from 'projects/viescloud-utils/src/lib/util/RxJS.utils';

@Component({
  selector: 'app-dns-manager',
  templateUrl: './dns-manager.component.html',
  styleUrls: ['./dns-manager.component.scss']
})
export class DnsManagerComponent implements OnInit {

  dnsRecords: DnsRecord[] = [];

  constructor(
    private dnsManagerService: DnsManagerService,
    private rxjsUtils: RxJSUtils
  ) { }

  ngOnInit() {
    this.dnsManagerService.getAll().pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: res => {
        this.dnsRecords = res;
      }
    })
  }

}
