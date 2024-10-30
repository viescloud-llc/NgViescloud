export interface DnsRecord {
    uri:                       string;
    enabledPublicNginx:        boolean;
    enabledLocalNginx:         boolean;
    localNginxRecord:          NginxRecord;
    publicNginxRecord:         NginxRecord;
    cloudflareViescloudRecord: CloudflareRecord[];
    cloudflareViesLocalRecord: CloudflareRecord[];
}

export interface CloudflareRecord {
    id:                string;
    zoneID:            string;
    zoneName:          string;
    name:              string;
    type:              Type;
    content:           string;
    proxiable:         boolean;
    proxied:           boolean;
    ttl:               number;
    settings:          Settings;
    meta:              CloudflareViescloudRecordMeta;
    comment:           string;
    tags:              any[];
    createdOn:         string;
    modifiedOn:        string;
    commentModifiedOn: string;
}

export interface CloudflareViescloudRecordMeta {
    autoAdded:           boolean;
    managedByApps:       boolean;
    managedByArgoTunnel: boolean;
}

export interface Settings {
    flatten_cname: boolean;
}

export enum Type {
    Cname = "CNAME",
}

export interface NginxRecord {
    meta:                    NginxRecordMeta;
    locations:               any[];
    id:                      number;
    enabled:                 boolean;
    certificate:             string;
    domain_names:            string[];
    forward_scheme:          ForwardScheme;
    forward_host:            string;
    forward_port:            number;
    caching_enabled:         boolean;
    block_exploits:          boolean;
    allow_websocket_upgrade: boolean;
    access_list_id:          string;
    certificate_id:          number;
    ssl_forced:              boolean;
    http2_support:           boolean;
    hsts_enabled:            boolean;
    hsts_subdomains:         boolean;
    advanced_config:         string;
    owner_user_id:           number;
}

export enum ForwardScheme {
    HTTP = "http",
    HTTPS = "https",
}

export interface NginxRecordMeta {
    letsencrypt_email:        string;
    dns_challenge:            boolean;
    dns_provider:             string;
    dns_provider_credentials: string;
    letsencrypt_agree:        boolean;
    nginx_online:             boolean;
    nginx_err:                string;
}
