import { Component, OnInit } from '@angular/core';
import { DnsRecord, NginxCertificate } from 'projects/viescloud-utils/src/lib/model/DnsManager.model';
import { DnsManagerService } from 'projects/viescloud-utils/src/lib/service/dns-manager.service';
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
  autoCleanUnusedDnsRecords = true;

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
      this.newRecord = false;
      this.selectedDnsRecord = undefined;
      return;
    }

    let count = 0;
    let allDomainNamesCopy = [...this.allDomainNames];
    allDomainNamesCopy = allDomainNamesCopy.filter(e => !(this.selectedDnsRecord?.publicNginxRecord?.domain_names.includes(e) ?? false));
    allDomainNamesCopy = allDomainNamesCopy.filter(e => !(this.selectedDnsRecord?.localNginxRecord?.domain_names.includes(e) ?? false));
    let allUri = [...this.dnsRecords.map(e => e.uri)];
    allUri = allUri.filter(e => e !== this.selectedDnsRecord?.uri);

    if(!this.newRecord) {
      count = 1;
      allDomainNamesCopy = [...allDomainNamesCopy, ...dnsRecord?.localNginxRecord?.domain_names ?? '', ...dnsRecord?.publicNginxRecord?.domain_names ?? ''];
      allUri = [...allUri, dnsRecord?.uri ?? ''];
    }

    if(DataUtils.hasValueWithMoreCountBy(allUri, e => e, dnsRecord?.uri, count)) {
      this.dialogUtils.openErrorMessage("Error", "URI already exists");
      return;
    }

    if(dnsRecord.localNginxRecord?.domain_names.some(domainName => DataUtils.hasValueWithMoreCountBy(allDomainNamesCopy, e => e, domainName, count))) {
      this.dialogUtils.openErrorMessage("Error", "Domain name already exists");
      return;
    }

    if(dnsRecord.publicNginxRecord?.domain_names.some(domainName => DataUtils.hasValueWithMoreCountBy(allDomainNamesCopy, e => e, domainName, count))) {
      this.dialogUtils.openErrorMessage("Error", "Domain name already exists");
      return;
    }

    if(!allDomainNamesCopy.every(e => e.includes(this.VIESCLOUD_DNS) || e.includes(this.VIESLOCAL_DNS))) {
      this.dialogUtils.openErrorMessage("Error", "Domain name must include viescloud.com or vieslocal.com");
      return;
    }

    if(dnsRecord.publicNginxRecord!.domain_names.length === 0)
      dnsRecord.publicNginxRecord = undefined;

    if(dnsRecord.localNginxRecord!.domain_names.length === 0)
      dnsRecord.localNginxRecord = undefined;

    if(!this.newRecord)
      dnsRecord.uri = this.selectedDnsRecord!.uri;

    this.newRecord = false;
  
    this.dnsManagerService.putDnsRecord(dnsRecord, this.autoCleanUnusedDnsRecords).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: res => {
        this.ngOnInit();
        this.selectedDnsRecord = undefined;
      },
      error: err => {
        this.dialogUtils.openErrorMessage("Error", err.message)
        let temp = this.selectedDnsRecord;
        this.selectedDnsRecord = undefined;
        this.selectedDnsRecord = temp;
      }
    })
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

  cleanUnusedCloudflareCnameDns() {
    this.dnsManagerService.cleanUnusedDnsRecords().pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: res => {
        this.ngOnInit();
      },
      error: err => {
        this.dialogUtils.openErrorMessage("Error", err.message)
      }
    })
  }

  removeRecord() {
    if(this.selectedDnsRecord) {
      this.dnsManagerService.deleteDnsRecord(this.selectedDnsRecord.uri, this.autoCleanUnusedDnsRecords).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
        next: res => {
          this.selectedDnsRecord = undefined;
          this.ngOnInit();
        },
        error: err => {
          this.dialogUtils.openErrorMessage("Error", err.message)
        }
      })
    }
  }
}
