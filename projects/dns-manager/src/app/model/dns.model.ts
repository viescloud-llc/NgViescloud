import { MatInputDisplayLabel, MatInputHide, MatInputRequire, MatInputTextArea, MatTableDisplayLabel, MatTableHide } from "projects/viescloud-utils/src/lib/model/mat.model";

export class DnsSetting {

  @MatInputHide()
  id: number = 0;

  @MatInputRequire()
  domain: string = '';

  @MatInputRequire()
  cloudflareEmail: string = '';

  @MatTableHide()
  @MatInputDisplayLabel('Cloudflare API Key (leave blank to not change) *')
  cloudflareKey: string = '';

  @MatTableHide()
  @MatInputDisplayLabel('Cloudflare Zone ID (leave blank to not change) *')
  cloudflareZoneId: string = '';

  @MatInputRequire()
  nginxBaseUrl: string = '';

  @MatTableHide()
  @MatInputRequire()
  nginxEmail: string = '';

  @MatTableHide()
  @MatInputDisplayLabel('Nginx Password (leave blank to not change) *')
  nginxPassword: string = '';

  cloudflareProxied: boolean = true;

  @MatTableHide()
  @MatInputTextArea()
  nginxCustomConfiguration: string = '';

  isCloudflareProxied(): boolean {
    return Boolean(this.cloudflareProxied);
  }
}

export class MergeDnsRecord {
  @MatTableDisplayLabel("DNS Record Names", (mergeDnsRecord: MergeDnsRecord) => {
    return mergeDnsRecord.dnsRecordNames.join(', ');
  })
  dnsRecordNames: string[] = [];

  uri: string = '';

  @MatTableHide()
  dnsRecords: DnsRecord[] = [new DnsRecord()] as DnsRecord[];
}

export class DnsRecord {
  @MatTableDisplayLabel("Service URI")
  uri: string = '';

  @MatTableHide()
  nginxRecord?: NginxRecord = new NginxRecord();

  @MatTableHide()
  cloudflareRecords: CloudflareRecord[] = [new CloudflareRecord()] as CloudflareRecord[];

  @MatTableHide()
  allNginxCertificates: NginxCertificate[] = [];

  @MatTableHide()
  dnsSetting: DnsSetting = new DnsSetting();
}

export class CloudflareRecord {
  id: string = '';
  zoneID: string = '';
  zoneName: string = '';
  name: string = '';
  type: Type = Type.Cname;
  content: string = '';
  proxiable: boolean = false;
  proxied: boolean = false;
  ttl: number = 0;
  settings: Settings = new Settings();
  meta: CloudflareViescloudRecordMeta = new CloudflareViescloudRecordMeta();
  comment: string = '';
  tags: any[] = [];
  createdOn: string = '';
  modifiedOn: string = '';
  commentModifiedOn: string = '';
}

export class CloudflareViescloudRecordMeta {
  autoAdded: boolean = false;
  managedByApps: boolean = false;
  managedByArgoTunnel: boolean = false;
}

export class Settings {
  flatten_cname: boolean = false;
}

export enum Type {
  Cname = "CNAME",
}

export class NginxRecord {
  meta: NginxMeta = new NginxMeta();
  locations: NginxLocation[] = [new NginxLocation()] as NginxLocation[];
  id: number = 0;
  enabled: boolean = false;
  certificate: NginxCertificate = new NginxCertificate();
  domain_names: string[] = [''] as string[];
  forward_scheme: ForwardScheme = ForwardScheme.HTTPS;
  forward_host: string = '';
  forward_port: number = 0;
  caching_enabled: boolean = false;
  block_exploits: boolean = false;
  allow_websocket_upgrade: boolean = false;
  access_list_id: number = 0;
  certificate_id: number = 0;
  ssl_forced: boolean = false;
  http2_support: boolean = false;
  hsts_enabled: boolean = false;
  hsts_subdomains: boolean = false;
  advanced_config: string = '';
  owner_user_id: number = 0;
}

export enum ForwardScheme {
  HTTP = "http",
  HTTPS = "https",
}

export class NginxMeta {
  letsencrypt_email: string = '';
  dns_challenge: boolean = false;
  dns_provider: string = '';
  dns_provider_credentials: string = '';
  letsencrypt_agree: boolean = false;
  nginx_online: boolean = false;
  nginx_err: string = '';
}

export class NginxLocation {
  path: string = '';
  advanced_config: string = '';
  forward_scheme: string = '';
  forward_host: string = '';
  forward_port: number = 0;
}

export class NginxCertificate {
  id: number = 0;
  owner_user_id: number = 0;
  provider: string = '';
  nice_name: string = '';
  domain_names: string[] = [''] as string[];
  meta: NginxMeta = new NginxMeta();
}