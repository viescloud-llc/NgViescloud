import { MatInputDisplayLabel, MatInputHide, MatInputRequire, MatTableHide } from "projects/viescloud-utils/src/lib/model/mat.model";

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
    cloudflareProxied: boolean = true;
    
    @MatTableHide()
    @MatInputRequire()
    nginxBaseUrl: string = '';

    @MatTableHide()
    @MatInputRequire()
    nginxEmail: string = '';

    @MatTableHide()
    @MatInputDisplayLabel('Nginx Password (leave blank to not change) *')
    nginxPassword: string = '';

    @MatTableHide()
    @MatInputRequire()
    nginxCustomConfiguration: string = '';
  
    isCloudflareProxied(): boolean {
      return Boolean(this.cloudflareProxied);
    }
  }