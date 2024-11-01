import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { DnsRecord, NginxRecord } from 'projects/viescloud-utils/src/lib/model/DnsManager.model';
import { DataUtils } from 'projects/viescloud-utils/src/lib/util/Data.utils';

@Component({
  selector: 'app-dns-record',
  templateUrl: './dns-record.component.html',
  styleUrls: ['./dns-record.component.scss']
})
export class DnsRecordComponent implements OnInit {

  @Input()
  dnsRecord!: DnsRecord;
  
  @Output()
  onEdit: EventEmitter<DnsRecord | undefined> = new EventEmitter<DnsRecord | undefined>();

  dnsRecordCopy!: DnsRecord;
  blankDnsRecord: DnsRecord = new DnsRecord();

  constructor() { }

  ngOnInit() {
    this.dnsRecord = structuredClone(this.dnsRecord);
    
    if(!this.dnsRecord.localNginxRecord)
      this.dnsRecord.localNginxRecord = DataUtils.purgeArray(new NginxRecord());

    if(!this.dnsRecord.publicNginxRecord)
      this.dnsRecord.publicNginxRecord = DataUtils.purgeArray(new NginxRecord());

    this.dnsRecordCopy = structuredClone(this.dnsRecord);
  }

  isValueChange() {
    return DataUtils.isNotEqual(this.dnsRecord, this.dnsRecordCopy);
  }

  save() {
    this.onEdit.emit(this.dnsRecord);
  }

}
