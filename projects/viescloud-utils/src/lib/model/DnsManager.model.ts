import { MatTableHide, MatTableDisplayLabel } from "./Mat.model";

export class DnsRecord {

    @MatTableDisplayLabel("DNS")
    cloudFlareDns: string[] = [''] as string[];

    @MatTableDisplayLabel("Service URI")
    uri:                       string = '';

    @MatTableDisplayLabel("Public Nginx")
    enabledPublicNginx:        boolean = false;

    @MatTableDisplayLabel("Local Nginx")
    enabledLocalNginx:         boolean = false;

    @MatTableHide(true)
    localNginxRecord?:          NginxRecord = new NginxRecord();

    @MatTableHide(true)
    publicNginxRecord?:         NginxRecord = new NginxRecord();

    @MatTableHide(true)
    cloudflareViescloudRecord: CloudflareRecord[] = [new CloudflareRecord()] as CloudflareRecord[];

    @MatTableHide(true)
    cloudflareViesLocalRecord: CloudflareRecord[] = [new CloudflareRecord()] as CloudflareRecord[];

    
}

export class CloudflareRecord {
    id:                string = '';
    zoneID:            string = '';
    zoneName:          string = '';
    name:              string = '';
    type:              Type = Type.Cname;
    content:           string = '';
    proxiable:         boolean = false;
    proxied:           boolean = false;
    ttl:               number = 0;
    settings:          Settings = new Settings();
    meta:              CloudflareViescloudRecordMeta = new CloudflareViescloudRecordMeta();
    comment:           string = '';
    tags:              any[] = [];
    createdOn:         string = '';
    modifiedOn:        string = '';
    commentModifiedOn: string = '';
}

export class CloudflareViescloudRecordMeta {
    autoAdded:           boolean = false;
    managedByApps:       boolean = false;
    managedByArgoTunnel: boolean = false;
}

export class Settings {
    flatten_cname: boolean = false;
}

export enum Type {
    Cname = "CNAME",
}

export class NginxRecord {
    meta:                    NginxMeta = new NginxMeta();
    locations:               NginxLocation[] = [new NginxLocation()] as NginxLocation[];
    id:                      number = 0;
    enabled:                 boolean = false;
    certificate:             NginxCertificate = new NginxCertificate();
    domain_names:            string[] = [''] as string[];
    forward_scheme:          ForwardScheme = ForwardScheme.HTTPS;
    forward_host:            string = '';
    forward_port:            number = 0;
    caching_enabled:         boolean = false;
    block_exploits:          boolean = false;
    allow_websocket_upgrade: boolean = false;
    access_list_id:          string = '';
    certificate_id:          number = 0;
    ssl_forced:              boolean = false;
    http2_support:           boolean = false;
    hsts_enabled:            boolean = false;
    hsts_subdomains:         boolean = false;
    advanced_config:         string = '';
    owner_user_id:           number = 0;
}

export enum ForwardScheme {
    HTTP = "http",
    HTTPS = "https",
}

export class NginxMeta {
    letsencrypt_email:        string = '';
    dns_challenge:            boolean = false;
    dns_provider:             string = '';
    dns_provider_credentials: string = '';
    letsencrypt_agree:        boolean = false;
    nginx_online:             boolean = false;
    nginx_err:                string = '';
}

export class NginxLocation {
    path: string = '';
    advancedConfig: string = '';
    forwardScheme: string = '';
    forwardHost: string = '';
    forwardPort: number = 0;
}

export class NginxCertificate {
    id:            number = 0;
    owner_user_id: number = 0;
    provider:      string = '';
    nice_name:     string = '';
    domain_names:  string[] = [''] as string[];
    meta:          NginxMeta = new NginxMeta();
}