import { Component, OnInit } from '@angular/core';
import { DnsRecord, NginxCertificate } from 'projects/viescloud-utils/src/lib/model/DnsManager.model';
import { DnsManagerService } from 'projects/viescloud-utils/src/lib/service/DnsManager.service';
import { DataUtils } from 'projects/viescloud-utils/src/lib/util/Data.utils';
import { DialogUtils } from 'projects/viescloud-utils/src/lib/util/Dialog.utils';
import { RxJSUtils } from 'projects/viescloud-utils/src/lib/util/RxJS.utils';

@Component({
  selector: 'app-dns-manager',
  templateUrl: './dns-manager.component.html',
  styleUrls: ['./dns-manager.component.scss']
})
export class DnsManagerComponent implements OnInit {

  private VIESCLOUD_DNS = 'viescloud.com';
  private VIESLOCAL_DNS = 'vieslocal.com';

  dnsRecords: DnsRecord[] = [];
  allDomainNames: string[] = [];
  blankDnsRecord: DnsRecord = new DnsRecord();

  selectedDnsRecord?: DnsRecord;

  viescloudNginxCertificates: NginxCertificate[] = [];
  vieslocalNginxCertificates: NginxCertificate[] = [];

  newRecord = false;

  constructor(
    private dnsManagerService: DnsManagerService,
    private rxjsUtils: RxJSUtils,
    private dialogUtils: DialogUtils
  ) { }

  ngOnInit() {
    this.dnsManagerService.getAllDnsRecords().pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: res => {
        this.populateDnsRecords(res);
      },
      error: err => {
        this.dialogUtils.openErrorMessage("Error", err.message)
      }
    })

    this.dnsManagerService.getAllCertificate(this.VIESCLOUD_DNS).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: res => {
        this.viescloudNginxCertificates = res;
      },
      error: err => {
        this.dialogUtils.openErrorMessage("Error", err.message)
      }
    })

    this.dnsManagerService.getAllCertificate(this.VIESLOCAL_DNS).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: res => {
        this.vieslocalNginxCertificates = res;
      },
      error: err => {
        this.dialogUtils.openErrorMessage("Error", err.message)
      }
    })
  }

  populateDnsRecords(dnsRecords: DnsRecord[]) {
    this.allDomainNames = [];
    this.dnsRecords = dnsRecords;
    for(let e of this.dnsRecords) {
      let dns = e.cloudFlareDns ?? [];
      e.enabledLocalNginx = false;
      e.enabledPublicNginx = false;

      if(e.publicNginxRecord) {
        e.publicNginxRecord.domain_names.forEach(d => dns.push(d));
        e.enabledPublicNginx = e.publicNginxRecord.enabled;
      }

      if(e.localNginxRecord) {
        e.localNginxRecord.domain_names.forEach(d => dns.push(d));
        e.enabledLocalNginx = e.localNginxRecord.enabled;
      }

      e.cloudFlareDns = [...dns];
      e.publicNginxRecord?.domain_names.forEach(d => this.allDomainNames.push(d));
      e.localNginxRecord?.domain_names.forEach(d => this.allDomainNames.push(d));
    }
  }

  addNewRecord() {
    let record = DataUtils.purgeArray(new DnsRecord());
    this.selectedDnsRecord = record;
    this.newRecord = true;
  }

  editRecord(dnsRecord?: DnsRecord) {
    if(!dnsRecord) {
      this.selectedDnsRecord = undefined;
      return;
    }

    let count = this.newRecord ? 0 : 1;

    if(DataUtils.hasValueWithMoreCountBy(this.dnsRecords, e => e.uri, dnsRecord?.uri, count)) {
      this.dialogUtils.openErrorMessage("Error", "URI already exists");
      return;
    }

    if(DataUtils.hasValueCompareWithMoreCountBy(this.allDomainNames, e => e, e => dnsRecord.localNginxRecord?.domain_names.includes(e) ?? false, count)) {
      this.dialogUtils.openErrorMessage("Error", "Domain name already exists");
      return;
    }

    if(DataUtils.hasValueCompareWithMoreCountBy(this.allDomainNames, e => e, e => dnsRecord.publicNginxRecord?.domain_names.includes(e) ?? false, count)) {
      this.dialogUtils.openErrorMessage("Error", "Domain name already exists");
      return;
    }

    if(dnsRecord.publicNginxRecord!.domain_names.length === 0)
      dnsRecord.publicNginxRecord = undefined;

    if(dnsRecord.localNginxRecord!.domain_names.length === 0)
      dnsRecord.localNginxRecord = undefined;

    this.newRecord = false;
    this.selectedDnsRecord = undefined;
  }

  clearCache() {
    this.dnsManagerService.clearCache().pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: res => {
        this.ngOnInit();
      },
      error: err => {
        this.dialogUtils.openErrorMessage("Error", err.message)
      }
    })
  }
}
