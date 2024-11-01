import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FixChangeDetection } from 'projects/viescloud-utils/src/lib/directive/FixChangeDetection';
import { TrackByIndex } from 'projects/viescloud-utils/src/lib/directive/TrackByIndex';
import { DnsRecord, ForwardScheme, NginxCertificate, NginxLocation, NginxRecord } from 'projects/viescloud-utils/src/lib/model/DnsManager.model';
import { MatOption } from 'projects/viescloud-utils/src/lib/model/Mat.model';
import { DataUtils } from 'projects/viescloud-utils/src/lib/util/Data.utils';

@Component({
  selector: 'app-dns-record',
  templateUrl: './dns-record.component.html',
  styleUrls: ['./dns-record.component.scss']
})
export class DnsRecordComponent extends FixChangeDetection implements OnInit {

  @Input()
  dnsRecord!: DnsRecord;

  @Input()
  viescloudNginxCertificates: NginxCertificate[] = [];

  @Input()
  vieslocalNginxCertificates: NginxCertificate[] = [];

  @Output()
  onEdit: EventEmitter<DnsRecord | undefined> = new EventEmitter<DnsRecord | undefined>();

  dnsRecordCopy!: DnsRecord;
  blankDnsRecord: DnsRecord = new DnsRecord();
  blankNginxLocation: NginxLocation = new NginxLocation();

  //details

  nginxRecords: NginxRecord[] = [];

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

  ForwardScheme = ForwardScheme;

  constructor() {
    super();
  }

  trackByIndex(index: number, obj: any): any {
    return index;
  }

  ngOnInit() {
    this.dnsRecord = structuredClone(this.dnsRecord);
    
    if(!this.dnsRecord.localNginxRecord)
      this.dnsRecord.localNginxRecord = DataUtils.purgeArray(new NginxRecord());

    if(!this.dnsRecord.publicNginxRecord)
      this.dnsRecord.publicNginxRecord = DataUtils.purgeArray(new NginxRecord());

    //Note: array push must be in this specific order
    this.nginxRecords.push(this.dnsRecord.publicNginxRecord);
    this.nginxRecords.push(this.dnsRecord.localNginxRecord);
    this.CertificateOptions.push(this.getCertificateOptions(this.viescloudNginxCertificates));
    this.CertificateOptions.push(this.getCertificateOptions(this.vieslocalNginxCertificates));

    if(this.dnsRecord.uri) {
      let url = new URL(this.dnsRecord.uri);
      this.uriDetails.protocol = url.protocol.replace(":", '') === 'http' ? ForwardScheme.HTTP : ForwardScheme.HTTPS;
      this.uriDetails.host = url.hostname;
      this.uriDetails.port = url.port ? parseInt(url.port) : this.uriDetails.port;
    }

    this.dnsRecordCopy = structuredClone(this.dnsRecord);
  }

  isValueChange() {
    return DataUtils.isNotEqual(this.dnsRecord, this.dnsRecordCopy);
  }

  save() {
    this.onEdit.emit(this.dnsRecord);
  }

  getNameByIndex(index: number) {
    switch(index) {
      case 0:
        return 'Viescloud';
      case 1:
        return 'Vieslocal';
      default:
        return 'Unknown';
    }
  }

  syncUriDetails() {
    this.nginxRecords.forEach(record => {
      record.forward_scheme = this.uriDetails.protocol;
      record.forward_host = this.uriDetails.host;
      record.forward_port = this.uriDetails.port;
    })
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
    if(!this.duplicateAdvanced.advanced_config) {
      let someConfig = this.nginxRecords.filter(e => e.advanced_config);
      if(someConfig.length > 0)
        this.duplicateAdvanced.advanced_config = someConfig[0].advanced_config;
    }

    this.nginxRecords.forEach(record => {
      record.advanced_config = structuredClone(this.duplicateAdvanced.advanced_config);
    })
  }

  addLocation(nginxLocations: NginxLocation[]) {
    if(!nginxLocations)
      nginxLocations = [];

    nginxLocations.push(DataUtils.purgeArray(new NginxLocation()));
  }

  removeLocation(nginxLocations: NginxLocation[], index: number) {
    if(nginxLocations)
      nginxLocations.splice(index, 1);
  }

  syncLocationSetting() {
    if(!this.duplicateCustomLocations) {
      let someLocations = this.getFirstValidLocations();
      if(someLocations)
        this.duplicateCustomLocations = structuredClone(someLocations.locations);
    }

    this.nginxRecords.forEach(record => {
      record.locations = structuredClone(this.duplicateCustomLocations);
    })
  }

  getFirstValidLocations() {
    return this.nginxRecords.find(e => e.locations);
  }
}
