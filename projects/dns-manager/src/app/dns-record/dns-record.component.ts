import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ValueTracking } from 'projects/viescloud-utils/src/lib/abtract/valueTracking.directive';
import { DnsRecord, ForwardScheme, MergeDnsRecord, NginxCertificate, NginxLocation, NginxRecord } from '../model/dns.model';
import { MatOption } from 'projects/viescloud-utils/src/lib/model/mat.model';
import { DialogUtils } from 'projects/viescloud-utils/src/lib/util/Dialog.utils';
import { RouteUtils } from 'projects/viescloud-utils/src/lib/util/Route.utils';
import { DataUtils } from 'projects/viescloud-utils/src/lib/util/Data.utils';
import { DnsManagerService, DnsSettingService } from '../service/dns.service';
import { RxJSUtils } from 'projects/viescloud-utils/src/lib/util/RxJS.utils';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-dns-record',
  templateUrl: './dns-record.component.html',
  styleUrls: ['./dns-record.component.scss']
})
export class DnsRecordComponent extends ValueTracking<MergeDnsRecord> {

  override value!: MergeDnsRecord;
  override valueCopy!: MergeDnsRecord;

  @Input()
  allDnsNames: string[] = [];

  @Output()
  onSave = new EventEmitter<MergeDnsRecord>();

  @Output()
  onDelete = new EventEmitter<MergeDnsRecord>();

  blankNginxLocation: NginxLocation = new NginxLocation()
  blankNginxCertificate: NginxCertificate = new NginxCertificate()

  //details

  domainNames: string[] = [];
  nginxRecords: NginxRecord[] = [];
  customNginxConfigurations: string[] = [];

  uriDetails = {
    protocol: ForwardScheme.HTTP,
    host: '',
    port: 80
  }

  duplicateDetailsSetting = false;
  duplicateDetails = {
    caching_enabled: false,
    block_exploits: false,
    allow_websocket_upgrade: false
  }

  //certificate

  CertificateOptions: MatOption<number>[][] = [];

  duplicateCertificateSetting = false;
  duplicateCertificate = {
    ssl_forced: false,
    http2_support: false,
    hsts_enabled: false,
    hsts_subdomains: false
  }

  //Custom location

  duplicateCustomLocationSetting = false;
  duplicateCustomLocations: NginxLocation[] = [];

  //advanced

  duplicateAdvancedSetting = false;
  duplicateAdvanced = {
    advanced_config: ''
  }

  //other
  validForm = false;
  ForwardScheme = ForwardScheme;

  constructor(
    private dialogUtils: DialogUtils,
    private dnsManagerService: DnsManagerService,
    private rxjsUtils: RxJSUtils
  ) {
    super();
  }

  ngOnInit() {
    this.value = structuredClone(this.value);
    this.initValue();
    this.initReference();

    let url = RouteUtils.parseUrl(this.value.uri);
    if (!url) {
      this.dialogUtils.openErrorMessage("Error", "Invalid URI");
      this.valueChange.emit(undefined);
      return;
    }

    this.uriDetails.protocol = url.schema === 'http' ? ForwardScheme.HTTP : ForwardScheme.HTTPS;
    this.uriDetails.host = url.host;
    this.uriDetails.port = url.port ? parseInt(url.port) : this.uriDetails.port;
    this.syncUriDetails();

    this.initDuplicateValue();
    this.updateValue(this.value);
  }

  private initValue() {
    this.value.dnsRecords.forEach(dnsRecord => {
      if(!dnsRecord.nginxRecord) {
        dnsRecord.nginxRecord = DataUtils.purgeArray(new NginxRecord());
      }
    })
  }

  private initReference() {
    this.nginxRecords = [];
    this.CertificateOptions = [];
    this.domainNames = [];
    this.customNginxConfigurations = [];

    this.value.dnsRecords.forEach(dnsRecord => {
      this.CertificateOptions.push(this.getCertificateOptions(dnsRecord.allNginxCertificates));
      this.nginxRecords.push(dnsRecord.nginxRecord!);
      this.domainNames.push(dnsRecord.dnsSetting.domain);
      this.customNginxConfigurations.push(dnsRecord.dnsSetting.nginxCustomConfiguration ?? '');
    })
  }

  private initDuplicateValue() {
    this.duplicateDetailsSetting = DataUtils.areAllObjectsEqualBy(this.nginxRecords, record => {
      return {
        caching_enabled: record.caching_enabled,
        block_exploits: record.block_exploits,
        allow_websocket_upgrade: record.allow_websocket_upgrade
      };
    });

    if (this.duplicateDetailsSetting) {
      this.duplicateDetails.allow_websocket_upgrade = this.nginxRecords[0].allow_websocket_upgrade;
      this.duplicateDetails.block_exploits = this.nginxRecords[0].block_exploits;
      this.duplicateDetails.caching_enabled = this.nginxRecords[0].caching_enabled;
    }

    this.duplicateAdvancedSetting = DataUtils.areAllObjectsEqualBy(this.nginxRecords, record => {
      return {
        advanced_config: record.advanced_config
      };
    });

    if (this.duplicateAdvancedSetting && this.nginxRecords[0].advanced_config) {
      this.duplicateAdvanced.advanced_config = this.nginxRecords[0].advanced_config;
    }

    this.duplicateCertificateSetting = DataUtils.areAllObjectsEqualBy(this.nginxRecords, record => {
      return {
        ssl_forced: record.ssl_forced,
        http2_support: record.http2_support,
        hsts_enabled: record.hsts_enabled,
        hsts_subdomains: record.hsts_subdomains
      };
    });

    if (this.duplicateCertificateSetting) {
      this.duplicateCertificate.ssl_forced = this.nginxRecords[0].ssl_forced;
      this.duplicateCertificate.http2_support = this.nginxRecords[0].http2_support;
      this.duplicateCertificate.hsts_enabled = this.nginxRecords[0].hsts_enabled;
      this.duplicateCertificate.hsts_subdomains = this.nginxRecords[0].hsts_subdomains;
    }

    this.duplicateCustomLocationSetting = DataUtils.areAllObjectsEqualBy(this.nginxRecords, record => {
      return {
        locations: record.locations
      };
    });

    if (this.duplicateCustomLocationSetting && this.nginxRecords[0].locations) {
      this.duplicateCustomLocations = this.nginxRecords[0].locations;
    }
  }

  autoFillDomainName(nginxRecordIndex: number) {
    let domainName = this.domainNames[nginxRecordIndex];
    return (value: string, index: number) => {
      if(!value.endsWith(domainName)) {
        value = `${value}.${domainName}`;
      }

      return value;
    };
  }

  // isValueChange() {
  //   return DataUtils.isNotEqualWith(this.dnsRecord, this.dnsRecordCopy, this.blankDnsRecord);
  // }



  getNameByIndex(index: number) {
    return this.domainNames[index] ?? 'Unknown';
  }

  syncUriDetails() {
    this.nginxRecords.forEach(record => {
      record.forward_scheme = this.uriDetails.protocol;
      record.forward_host = this.uriDetails.host;
      record.forward_port = this.uriDetails.port;
    })
    this.value.uri = `${this.uriDetails.protocol}://${this.uriDetails.host}:${this.uriDetails.port}`;
  }

  syncDetailsSetting() {
    this.nginxRecords.forEach(record => {
      record.caching_enabled = this.duplicateDetails.caching_enabled;
      record.block_exploits = this.duplicateDetails.block_exploits;
      record.allow_websocket_upgrade = this.duplicateDetails.allow_websocket_upgrade;
    })
  }

  getCertificateOptions(nginxCertificates: NginxCertificate[]) {
    let options: MatOption<number>[] = [];
    options.push({
      value: 0,
      valueLabel: 'None'
    })
    nginxCertificates.forEach(e => {
      options.push({
        value: e.id,
        valueLabel: e.nice_name
      })
    })
    return options;
  }

  syncCertificateSetting() {
    this.nginxRecords.forEach(record => {
      record.ssl_forced = this.duplicateCertificate.ssl_forced;
      record.http2_support = this.duplicateCertificate.http2_support;
      record.hsts_enabled = this.duplicateCertificate.hsts_enabled;
      record.hsts_subdomains = this.duplicateCertificate.hsts_subdomains;
    })
  }

  syncAdvancedSetting() {
    if (!this.duplicateAdvanced.advanced_config) {
      let someConfig = this.nginxRecords.filter(e => e.advanced_config);
      if (someConfig.length > 0)
        this.duplicateAdvanced.advanced_config = someConfig[0].advanced_config;
    }

    this.nginxRecords.forEach(record => {
      record.advanced_config = structuredClone(this.duplicateAdvanced.advanced_config);
    })
  }

  addLocation(nginxLocations: NginxLocation[], record?: NginxRecord) {
    if (!nginxLocations && record) {
      record.locations = [];
      nginxLocations = record.locations;
    }

    let location = DataUtils.purgeArray(new NginxLocation());
    location.forward_host = this.uriDetails.host;
    location.forward_port = this.uriDetails.port;
    location.forward_scheme = this.uriDetails.protocol;
    nginxLocations.push(location);

    if (this.duplicateCustomLocationSetting)
      this.syncLocationSetting();
  }

  removeLocation(nginxLocations: NginxLocation[], index: number) {
    if (nginxLocations)
      nginxLocations.splice(index, 1);

    if (this.duplicateCustomLocationSetting)
      this.syncLocationSetting();
  }

  syncLocationSetting() {
    if (!this.duplicateCustomLocations) {
      let someLocations = this.getFirstValidLocations();
      if (someLocations)
        this.duplicateCustomLocations = structuredClone(someLocations.locations);
    }

    this.nginxRecords.forEach(record => {
      record.locations = structuredClone(this.duplicateCustomLocations);
    })
  }

  getFirstValidLocations() {
    return this.nginxRecords.find(e => e.locations);
  }

  gotoUri(uri: string) {
    if (!(uri.startsWith('http://') || uri.startsWith('https://'))) {
      uri = 'https://' + uri;
    }

    window.open(uri, '_blank');
  }

  getAllDomainNames() {
    let domainNames = new Set<string>();
    this.nginxRecords.forEach(record => {
      if (record.domain_names) {
        record.domain_names.forEach(d => domainNames.add(d));
      }
    })
    return Array.from(domainNames);
  }

  autoFillNginxSetting(index: number) {
    this.duplicateAdvancedSetting = false;

    if(index >= 0) {
      this.nginxRecords[index].advanced_config = this.customNginxConfigurations[index] ?? '';
    }
    else {
      for(let i = 0; i < this.nginxRecords.length; i++) {
        let record = this.nginxRecords[i];
        record.advanced_config = this.customNginxConfigurations[i] ?? '';
      }
    }
  }

  revert() {
    this.resetValue();
    this.ngOnInit();
  }

  async save() {
    if(this.validForm) {

      if(this.value.dnsRecords.every(e => !e.nginxRecord || !e.nginxRecord.domain_names || e.nginxRecord.domain_names.length == 0)) {
        this.dialogUtils.openErrorMessage("Error", "Please add at least one dns record name to any domain\nOr Delete to remove everything", "ok");
        return;
      }

      // find if any dns record domainNames already exists in allDnsNames
      let invalidDomainNames: string[] = [];
      this.value.dnsRecords.forEach(record => {
        if(record.nginxRecord?.domain_names) {
          record.nginxRecord.domain_names.forEach(domainName => {
            if(this.allDnsNames.includes(domainName)) {
              invalidDomainNames.push(domainName);
            }
          })
        }
      })

      if(invalidDomainNames.length > 0) {
        this.dialogUtils.openErrorMessage("Error", "The following dns names already exists in other dns records\n" + invalidDomainNames.join("\n"), "ok");
        return;
      }

      let isChange = false;

      for(let record of this.value.dnsRecords) {
        let isNewRecord = !record.nginxRecord?.id;
  
        if(!isNewRecord && !record.nginxRecord?.domain_names) {
          await firstValueFrom(this.dnsManagerService.deleteDnsRecord(record.dnsSetting, record.uri).pipe(this.rxjsUtils.waitLoadingDialog()))
          .then(() => {
            isChange = true;
          })
          .catch(err => {
            this.dialogUtils.openErrorMessageFromError(err, "Error deleting empty dns record", "Error when deleting empty dns record\nPlease try again later");
          });
        }
        else if(record.nginxRecord?.domain_names && record.nginxRecord.domain_names.length > 0) {
          await firstValueFrom(this.dnsManagerService.putDnsRecord(record.dnsSetting, record).pipe(this.rxjsUtils.waitLoadingDialog()))
          .then(() => {
            isChange = true;
          })
          .catch(err => {
            this.dialogUtils.openErrorMessageFromError(err, "Error saving dns record", "Error when saving dns record\nPlease try again later");
          })
        }
      }

      if(isChange) {
        this.onSave.emit(this.value);
      }
    }
  }

  async remove() {
    let confirm = await this.dialogUtils.openConfirmDialog("Remove", "Are you sure you want to remove this record?\nThis cannot be undone", "Yes", "No");
    if (confirm) {
      this.onDelete.emit(this.value);
    }
  }
}
