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
    access_list_id:          number = 0;
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
    advanced_config: string = '';
    forward_scheme: string = '';
    forward_host: string = '';
    forward_port: number = 0;
}

export class NginxCertificate {
    id:            number = 0;
    owner_user_id: number = 0;
    provider:      string = '';
    nice_name:     string = '';
    domain_names:  string[] = [''] as string[];
    meta:          NginxMeta = new NginxMeta();
}

export const AuthentikConfig = `# Increase buffer size for large headers
# This is needed only if you get 'upstream sent too big header while reading response
# header from upstream' error when trying to access an application protected by goauthentik
proxy_buffers 8 16k;
proxy_buffer_size 32k;

# Make sure not to redirect traffic to a port 4443
port_in_redirect off;

location / {
    # Put your proxy_pass to your application here
    proxy_pass          $forward_scheme://$server:$port;
    proxy_set_header Host $host;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    # Set any other headers your application might need
    # proxy_set_header Host $host;
    # proxy_set_header ...
    # Support for websocket
    # proxy_set_header Upgrade $http_upgrade;
    # proxy_set_header Connection $connection_upgrade_keepalive;

    ##############################
    # authentik-specific config
    ##############################
    auth_request     /outpost.goauthentik.io/auth/nginx;
    error_page       401 = @goauthentik_proxy_signin;
    auth_request_set $auth_cookie $upstream_http_set_cookie;
    add_header       Set-Cookie $auth_cookie;

    # translate headers from the outposts back to the actual upstream
    auth_request_set $authentik_username $upstream_http_x_authentik_username;
    auth_request_set $authentik_groups $upstream_http_x_authentik_groups;
    auth_request_set $authentik_email $upstream_http_x_authentik_email;
    auth_request_set $authentik_name $upstream_http_x_authentik_name;
    auth_request_set $authentik_uid $upstream_http_x_authentik_uid;

    proxy_set_header X-authentik-username $authentik_username;
    proxy_set_header X-authentik-groups $authentik_groups;
    proxy_set_header X-authentik-email $authentik_email;
    proxy_set_header X-authentik-name $authentik_name;
    proxy_set_header X-authentik-uid $authentik_uid;
}

# all requests to /outpost.goauthentik.io must be accessible without authentication
location /outpost.goauthentik.io {
    proxy_pass              https://10.24.24.85:9443/outpost.goauthentik.io;
    # ensure the host of this vserver matches your external URL you've configured
    # in authentik
    proxy_set_header        Host $host;
    proxy_set_header        X-Original-URL $scheme://$http_host$request_uri;
    add_header              Set-Cookie $auth_cookie;
    auth_request_set        $auth_cookie $upstream_http_set_cookie;
    proxy_pass_request_body off;
    proxy_set_header        Content-Length "";
}

# Special location for when the /auth endpoint returns a 401,
# redirect to the /start URL which initiates SSO
location @goauthentik_proxy_signin {
    internal;
    add_header Set-Cookie $auth_cookie;
    return 302 /outpost.goauthentik.io/start?rd=$request_uri;
    # For domain level, use the below error_page to redirect to your authentik server with the full redirect path
    # return 302 https://authentik.company/outpost.goauthentik.io/start?rd=$scheme://$http_host$request_uri;
}`