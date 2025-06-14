import { Component } from '@angular/core';
import { DnsSettingService } from '../service/dns.service';

@Component({
  selector: 'app-dns-setting-list',
  templateUrl: './dns-setting-list.component.html',
  styleUrls: ['./dns-setting-list.component.scss']
})
export class DnsSettingListComponent {
  constructor(
    public dnsSettingService: DnsSettingService
  ) { }
}
