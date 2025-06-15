import { Component, OnInit } from '@angular/core';
import { DnsManagerService, DnsSettingService } from '../service/dns.service';
import { CloudflareRecord, DnsRecord, DnsSetting, MergeDnsRecord, NginxCertificate, NginxRecord } from '../model/dns.model';
import { firstValueFrom } from 'rxjs';
import { DialogUtils } from 'projects/viescloud-utils/src/lib/util/Dialog.utils';
import { RxJSUtils } from 'projects/viescloud-utils/src/lib/util/RxJS.utils';
import { ValueTracking } from 'projects/viescloud-utils/src/lib/abtract/valueTracking.directive';
import { DataUtils } from 'projects/viescloud-utils/src/lib/util/Data.utils';

type DnsSettingPair = {
  dnsSetting: DnsSetting;
  allNginxCertificate: NginxCertificate[];
}

type DnsPackage = {
  dnsSettingPairs: DnsSettingPair[];
  totalRecord: number;
}

@Component({
  selector: 'app-dns-record-list',
  templateUrl: './dns-record-list.component.html',
  styleUrls: ['./dns-record-list.component.scss']
})
export class DnsRecordListComponent implements OnInit {

  mergeDnsRecords: MergeDnsRecord[] = [];
  blankMergeDnsRecord: MergeDnsRecord = new MergeDnsRecord();

  validForm: boolean = false;

  selectedMergeDnsRecord = new ValueTracking<MergeDnsRecord>();

  dnsPackages: DnsPackage[] = [];

  allDnsNames: string[] = [];

  multipleSelection = false;
  multipleSelections: MergeDnsRecord[] = [];

  constructor(
    private dnsManagerService: DnsManagerService,
    private dnsSettingService: DnsSettingService,
    private dialogUtils: DialogUtils,
    private rxjsUtils: RxJSUtils
  ) {

  }

  async ngOnInit() {
    this.mergeDnsRecords = [];
    this.dnsPackages = [];
    this.allDnsNames = [];

    let dnsSettings = await firstValueFrom(this.dnsSettingService.getAll().pipe(this.rxjsUtils.waitLoadingDialog())).catch(err => {
      this.dialogUtils.openErrorMessageFromError(err, "Error loading dns settings", "Error when loading dns settings\nPlease try again later");
      return null;
    });

    if (dnsSettings) {
      let dnsSettingPairs: DnsSettingPair[] = [];

      for (let dnsSetting of dnsSettings) {
        let allNginxCertificate = await firstValueFrom(this.dnsManagerService.getAllCertificate(dnsSetting).pipe(this.rxjsUtils.waitLoadingDialog())).catch(err => {
          this.dialogUtils.openErrorMessageFromError(err, "Error loading certificates", "Error when loading certificates\nPlease try again later");
          return null;
        })

        if (allNginxCertificate) {
          dnsSettingPairs.push({
            dnsSetting: dnsSetting,
            allNginxCertificate: allNginxCertificate!
          });
        }
      }

      this.dnsPackages.push({
        dnsSettingPairs: dnsSettingPairs,
        totalRecord: this.mergeDnsRecords.length
      });

    }

    for (let dnsPackage of this.dnsPackages) {
      for (let dnsSettingPair of dnsPackage.dnsSettingPairs) {

        let dnsRecords = await firstValueFrom(this.dnsManagerService.getAllDnsRecords(dnsSettingPair.dnsSetting).pipe(this.rxjsUtils.waitLoadingDialog())).catch(err => {
          this.dialogUtils.openErrorMessageFromError(err, "Error loading dns records", "Error when loading dns records\nPlease try again later");
          return null;
        });

        if (dnsRecords) {
          dnsRecords.forEach(dnsRecord => {
            dnsRecord.allNginxCertificates = dnsSettingPair.allNginxCertificate!;
            dnsRecord.dnsSetting = dnsSettingPair.dnsSetting;
            let uri = dnsRecord.uri;

            if (!this.mergeDnsRecords.some(e => e.uri === uri)) {
              this.mergeDnsRecords.push({
                uri: uri,
                dnsRecords: dnsPackage.dnsSettingPairs.reduce((a, c) => {
                  a.push({
                    uri: uri,
                    nginxRecord: DataUtils.purgeArray(new NginxRecord()),
                    cloudflareRecords: [],
                    allNginxCertificates: c.allNginxCertificate,
                    dnsSetting: c.dnsSetting
                  }); return a
                }, [] as DnsRecord[]),
                dnsRecordNames: []
              });
            }

            let mergeDnsRecord = this.mergeDnsRecords.find(e => e.uri === uri);
            if (mergeDnsRecord) {
              this.putRecord(mergeDnsRecord.dnsRecords, dnsRecord);
              mergeDnsRecord.dnsRecordNames = this.addRecordName(mergeDnsRecord.dnsRecordNames, [dnsRecord], dnsSettingPair.dnsSetting);
            }
          })
        }
      }
    }

    this.mergeDnsRecords = [...this.mergeDnsRecords];
  }

  private putRecord(currentDnsRecords: DnsRecord[], dnsRecord: DnsRecord) {
    let replaceIndex = -1;
    for(let i = 0; i < currentDnsRecords.length; i++) {
      let currentDnsRecord = currentDnsRecords[i];
      if((currentDnsRecord.cloudflareRecords.length === 0 || currentDnsRecord.nginxRecord?.id === 0) && currentDnsRecord.dnsSetting === dnsRecord.dnsSetting) {
        replaceIndex = i;
      }
    }

    if(replaceIndex !== -1) {
      currentDnsRecords[replaceIndex] = dnsRecord;
    }
    else {
      currentDnsRecords.push(dnsRecord);
    }
  }

  private addRecordName(dnsRecordNames: string[], dnsRecords: DnsRecord[], dnsSetting: DnsSetting) {
    for (let dnsRecord of dnsRecords) {

      let domainName = dnsSetting.domain;
      let nameFromCloudFlare = dnsRecord.cloudflareRecords.reduce((a, c) => { 
        a.push(c.name.replaceAll(`.${domainName}`, ''));
        if(!this.allDnsNames.some(e => e === c.name)) {
          this.allDnsNames.push(c.name);
        }
        return a;
      }, [] as string[]) ?? [];
      
      let nameFromNginx = dnsRecord.nginxRecord?.domain_names.reduce((a, c) => { 
        a.push(c.replaceAll(`.${domainName}`, ''));
        if(!this.allDnsNames.some(e => e === c)) {
          this.allDnsNames.push(c);
        }
        return a;
      }, [] as string[]) ?? [];

      nameFromCloudFlare.forEach(name => {
        if (!dnsRecordNames.some(e => e === name)) {
          dnsRecordNames.push(name);
        }
      });

      nameFromNginx.forEach(name => {
        if (!dnsRecordNames.some(e => e === name)) {
          dnsRecordNames.push(name);
        }
      });
    }

    return dnsRecordNames;
  }

  addMergeDnsRecord() {
    let dnsRecords: DnsRecord[] = [];

    for(let dnsPackage of this.dnsPackages) {
      dnsRecords = dnsRecords.concat(dnsPackage.dnsSettingPairs.reduce((a, c) => {
        a.push({
          uri: 'http://localhost:8080',
          nginxRecord: DataUtils.purgeArray(new NginxRecord()),
          cloudflareRecords: [],
          allNginxCertificates: c.allNginxCertificate,
          dnsSetting: c.dnsSetting
        }); return a
      }, [] as DnsRecord[]));
    }

    let mergeDnsRecord = {
      uri: 'http://localhost:8080',
      dnsRecords: dnsRecords,
      dnsRecordNames: []
    };

    this.selectedMergeDnsRecord.updateValue(mergeDnsRecord);
  }

  async onSave(mergeDnsRecord: MergeDnsRecord) {
    this.selectedMergeDnsRecord.updateValue(undefined);
    await this.ngOnInit();
    let foundMergeDnsRecord = this.mergeDnsRecords.find(e => e.uri === mergeDnsRecord.uri);
    this.selectedMergeDnsRecord.updateValue(foundMergeDnsRecord);
  }

  async onDelete(mergeDnsRecord: MergeDnsRecord, reload: boolean = true) {
    this.selectedMergeDnsRecord.updateValue(undefined);

    for (let dnsRecord of mergeDnsRecord.dnsRecords) {
      await firstValueFrom(this.dnsManagerService.deleteDnsRecord(dnsRecord.dnsSetting, dnsRecord.uri).pipe(this.rxjsUtils.waitLoadingDialog())).catch(err => {
        this.dialogUtils.openErrorMessageFromError(err, "Error deleting dns record", "Error when deleting dns record\nPlease try again later");
      })
    }

    if(reload) {
      this.ngOnInit();
    }
  }

  async massDelete() {
    if(this.multipleSelections.length > 0) {
      let dnsNames = this.multipleSelections.reduce((a, c) => {
        a.push(...c.dnsRecordNames);
        return a;
      }, [] as string[]);
      let confirm = await this.dialogUtils.openConfirmDialog("Confirm", "Are you sure you want to delete the selected dns records?\nThis action cannot be undone!\n\nNames: " + dnsNames.join('\n'), "Delete dns records");
    
      if (confirm) {
        for (let mergeDnsRecord of this.multipleSelections) {
          await this.onDelete(mergeDnsRecord, false);
        }

        this.ngOnInit();
      }
    }
  }

  async clearCacheAndRefresh() {
    for (let dnsPackage of this.dnsPackages) {
      for(let dnsSettingPair of dnsPackage.dnsSettingPairs) {
        await firstValueFrom(this.dnsManagerService.clearCache(dnsSettingPair.dnsSetting).pipe(this.rxjsUtils.waitLoadingDialog())).catch(err => {
          this.dialogUtils.openErrorMessageFromError(err, "Error clearing cache", "Error when clearing cache\nPlease try again later");
        })
      }
    }

    this.ngOnInit();
  }

  async cleanUnUseDnsRecord() {
    for (let dnsPackage of this.dnsPackages) {
      for(let dnsSettingPair of dnsPackage.dnsSettingPairs) {
        await firstValueFrom(this.dnsManagerService.cleanUnusedDnsRecords(dnsSettingPair.dnsSetting).pipe(this.rxjsUtils.waitLoadingDialog())).catch(err => {
          this.dialogUtils.openErrorMessageFromError(err, "Error cleaning unused dns records", "Error when cleaning unused dns records\nPlease try again later");
        })
      }
    }

    await this.clearCacheAndRefresh();
  }

}
