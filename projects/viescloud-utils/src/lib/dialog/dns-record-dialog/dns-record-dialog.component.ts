import { Component, Inject, OnInit } from '@angular/core';
import { DnsRecord, NginxRecord } from '../../model/DnsManager.model';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DataUtils } from '../../util/Data.utils';

@Component({
  selector: 'app-dns-record-dialog',
  templateUrl: './dns-record-dialog.component.html',
  styleUrls: ['./dns-record-dialog.component.scss']
})
export class DnsRecordDialog implements OnInit {

  dnsRecord!: DnsRecord;
  dnsRecordCopy!: DnsRecord;
  blankDnsRecord: DnsRecord = new DnsRecord();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {dnsRecord: DnsRecord}
  ) { 
    this.dnsRecord = data.dnsRecord;
    
    if(!this.dnsRecord.localNginxRecord)
      this.dnsRecord.localNginxRecord = DataUtils.purgeArray(new NginxRecord());

    if(!this.dnsRecord.publicNginxRecord)
      this.dnsRecord.publicNginxRecord = DataUtils.purgeArray(new NginxRecord());

    this.dnsRecordCopy = structuredClone(this.dnsRecord);
  }

  ngOnInit() {
  }

  isValueChange() {
    return DataUtils.isNotEqual(this.dnsRecord, this.dnsRecordCopy);
  }

}
