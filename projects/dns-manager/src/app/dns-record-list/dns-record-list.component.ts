import { Component, OnInit } from '@angular/core';
import { DnsManagerService, DnsSettingService } from '../service/dns.service';
import { DnsRecord, DnsSetting, MergeDnsRecord } from '../model/dns.model';
import { firstValueFrom } from 'rxjs';
import { DialogUtils } from 'projects/viescloud-utils/src/lib/util/Dialog.utils';
import { RxJSUtils } from 'projects/viescloud-utils/src/lib/util/RxJS.utils';
import { ValueTracking } from 'projects/viescloud-utils/src/lib/abtract/valueTracking.directive';

@Component({
  selector: 'app-dns-record-list',
  templateUrl: './dns-record-list.component.html',
  styleUrls: ['./dns-record-list.component.scss']
})
export class DnsRecordListComponent extends ValueTracking<MergeDnsRecord> implements OnInit {

  mergeDnsRecords: MergeDnsRecord[] = [];
  blankMergeDnsRecord: MergeDnsRecord = new MergeDnsRecord();

  constructor(
    private dnsRecordService: DnsManagerService,
    private dnsSettingService: DnsSettingService,
    private dialogUtils: DialogUtils,
    private rxjsUtils: RxJSUtils
  ) { 
    super();
  }
  
  async ngOnInit() {
    let dnsSettings = await firstValueFrom(this.dnsSettingService.getAll().pipe(this.rxjsUtils.waitLoadingDialog())).catch(err => {
      this.dialogUtils.openErrorMessageFromError(err, "Error loading dns settings", "Error when loading dns settings\nPlease try again later");
      return null;
    });

    if(dnsSettings) {
      for(let dnsSetting of dnsSettings) {
        let dnsRecords = await firstValueFrom(this.dnsRecordService.getAllDnsRecords(dnsSetting).pipe(this.rxjsUtils.waitLoadingDialog())).catch(err => {
          this.dialogUtils.openErrorMessageFromError(err, "Error loading dns records", "Error when loading dns records\nPlease try again later");
          return null;
        });
  
        if(dnsRecords) {
          dnsRecords.forEach(dnsRecord => {
            let uri = dnsRecord.uri;
  
            if(!this.mergeDnsRecords.some(e => e.uri === uri)) {
              this.mergeDnsRecords.push({
                uri: uri,
                dnsRecords: [dnsRecord],
                dnsRecordNames: this.addRecordName([], [dnsRecord], dnsSetting)
              })
            } 
            else {
              let mergeDnsRecord = this.mergeDnsRecords.find(e => e.uri === uri);

              if(mergeDnsRecord) {
                mergeDnsRecord.dnsRecords.push(dnsRecord);
                mergeDnsRecord.dnsRecordNames = this.addRecordName(mergeDnsRecord.dnsRecordNames, [dnsRecord], dnsSetting);
              }
            }
            
          })
        }
      }

      this.mergeDnsRecords = [...this.mergeDnsRecords];
    }

    this.updateValue(this.mergeDnsRecords[0]);
  }

  private addRecordName(dnsRecordNames: string[], dnsRecords: DnsRecord[], dnsSetting: DnsSetting) {
    for(let dnsRecord of dnsRecords) {

      let domainName = dnsSetting.domain;
      let nameFromCloudFlare = dnsRecord.cloudflareRecords.reduce((a, c) => {a.push(c.name.replaceAll(`.${domainName}`, '')); return a}, [] as string[]) ?? [];
      let nameFromNginx = dnsRecord.nginxRecord?.domain_names.reduce((a, c) => {a.push(c.replaceAll(`.${domainName}`, '')); return a}, [] as string[]) ?? [];

      nameFromCloudFlare.forEach(name => {
        if(!dnsRecordNames.some(e => e === name)) {
          dnsRecordNames.push(name);
        }
      });

      nameFromNginx.forEach(name => {
        if(!dnsRecordNames.some(e => e === name)) {
          dnsRecordNames.push(name);
        }
      });
    }

    return dnsRecordNames;
  }

}
