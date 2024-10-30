import { Component, OnInit } from '@angular/core';
import { DnsRecordDialog } from 'projects/viescloud-utils/src/lib/dialog/dns-record-dialog/dns-record-dialog.component';
import { DnsRecord } from 'projects/viescloud-utils/src/lib/model/DnsManager.model';
import { DnsManagerService } from 'projects/viescloud-utils/src/lib/service/DnsManager.service';
import { DialogUtils } from 'projects/viescloud-utils/src/lib/util/Dialog.utils';
import { RxJSUtils } from 'projects/viescloud-utils/src/lib/util/RxJS.utils';

@Component({
  selector: 'app-dns-manager',
  templateUrl: './dns-manager.component.html',
  styleUrls: ['./dns-manager.component.scss']
})
export class DnsManagerComponent implements OnInit {

  dnsRecords: DnsRecord[] = [];
  blankDnsRecord: DnsRecord = new DnsRecord();

  constructor(
    private dnsManagerService: DnsManagerService,
    private rxjsUtils: RxJSUtils,
    private dialogUtils: DialogUtils
  ) { }

  ngOnInit() {
    this.dnsManagerService.getAll().pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: res => {
        this.populateDnsRecords(res);
      }
    })
  }

  populateDnsRecords(dnsRecords: DnsRecord[]) {
    this.dnsRecords = dnsRecords;
    for(let e of this.dnsRecords) {
      let dns = e.cloudFlareDns ?? [];
      if(e.publicNginxRecord)
        e.publicNginxRecord.domain_names.forEach(d => dns.push(d));

      if(e.localNginxRecord)
        e.localNginxRecord.domain_names.forEach(d => dns.push(d));

      e.cloudFlareDns = [...dns];
    }
  }

  edit(dnsRecord: DnsRecord) {
    this.dialogUtils.matDialog.open(DnsRecordDialog, {data: {dnsRecord: dnsRecord}, width: '100%'}).afterClosed().subscribe({
      next: res => {
        if(res) {
          
        }
      }
    });
  }
}
