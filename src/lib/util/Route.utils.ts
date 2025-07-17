import { ActivatedRoute } from '@angular/router';
import { first } from 'rxjs';
import { ViesService } from '../service/rest.service';

export const DEFAULT_PORTS: Record<string, string> = {
  http: '80',
  https: '443',
  ftp: '21',
  ssh: '22',
  telnet: '23',
  smtp: '25',
  pop: '110',
  imap: '143',
  ldap: '389',
  sftp: '22',
  rtsp: '554',
  sip: '5060',
  sips: '5061',
  tftp: '69',
  dns: '53',
  rdp: '3389',
  ws: '80',
  wss: '443',
};

export class RouteUtils {
  private constructor() {}

  static async getRouteParam(
    route: ActivatedRoute,
    variable: string
  ): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      route.params.pipe(first()).subscribe(
        (params) => {
          let value = params[variable];
          resolve(value);
        },
        (error) => {
          reject('');
        }
      );
    });
  }

  static getQueryParams(decodeUrl?: boolean): { [key: string]: string } {
    let url = RouteUtils.getCurrentUrl();
    let result: { [key: string]: string } = {};
    let query = url.split('?')[1];
    if (query) {
      let params = query.split('&');
      params.forEach((param) => {
        let key = param.split('=')[0];
        let value = param.split('=')[1];
        result[key] = value;
      });
    }

    if (decodeUrl) {
      for (let key in result) {
        result[key] = decodeURIComponent(result[key]);
      }
    }

    return result;
  }

  static getQueryParam(key: string, decodeUrl?: boolean): string | null {
    let queryParams = RouteUtils.getQueryParams(decodeUrl);
    return queryParams[key] ?? null;
  }

  static getDecodedQueryParam(key: string): string | null {
    return RouteUtils.getQueryParam(key, true);
  }

  static setQueryParam(param: string, value: string | null) {
    const currentUrl = RouteUtils.getCurrentUrl();
    const url = new URL(currentUrl);
    const params = new URLSearchParams(url.search);

    if (value !== null) {
      params.set(param, value);
    } else {
      params.delete(param);
    }

    const newUrl = `${url.origin}${url.pathname}?${params.toString()}`;
    window.history.pushState({}, '', newUrl);
  }

  static deleteQueryParam(...params: string[]) {
    for (let i = 0; i < params.length; i++) {
      RouteUtils.setQueryParam(params[i], null);
    }
  }

  /**
   * Retrieves the value of a URL path variable.
   * @param variableName - The name of the path variable to retrieve.
   * @returns The value of the path variable, or null if it is not found.
   * @example path = '/users/123' and variableName = 'users' => returns '123'
   */
  static getPathVariableAsInteger(variableName: string): number | null {
    let pathVariable = RouteUtils.getPathVariable(variableName);
    if (pathVariable) {
      return parseInt(pathVariable);
    }
    return null;
  }

  /**
   * Retrieves the value of a URL path variable.
   * @param variableName - The name of the path variable to retrieve.
   * @returns The value of the path variable, or null if it is not found.
   * @example path = '/users/123' and variableName = 'users' => returns '123'
   */
  static getPathVariable(variableName: string): string | null {
    // Get the current URL using window.location.href
    const url = RouteUtils.getCurrentUrl();

    // Split the URL into segments
    const segments = url.split('/').filter((segment) => segment); // Remove empty segments

    // Find the index of the variable name
    const index = segments.indexOf(variableName);

    // If the variable exists and is not the last segment, return the next segment
    if (index !== -1 && index + 1 < segments.length) {
      return segments[index + 1];
    }

    return null; // Return null if the variable is not found
  }

  /**
   * Retrieves the current path from the browser's address bar.
   * @returns The current path as a string.
   * @example window.location.pathname = '/users/123' => returns '/users/123'
   */
  static getCurrentPath(): string {
    return window.location.pathname;
  }

  /**
   * Returns the current URL in the browser address bar.
   * @returns The current URL as a string.
   * @example window.location.href = 'https://example.com/users/123' => returns 'https://example.com/users/123'
   */
  static getCurrentUrl(): string {
    if(ViesService.isBrowserCode()) {
      return window.location.href;
    }
    else {
      return '';
    }
  }

  /**
   * Retrieves the current schema (http/https), host and port from the current URL in the browser's address bar.
   * @returns The current schema, host and port as a string.
   * @example window.location.href = 'https://example.com:8080/users/123' => returns 'https://example.com:8080'
   */
  static getCurrentSchemasHostPort() {
    let currentUrl = RouteUtils.getCurrentUrl();
    let url = RouteUtils.parseUrl(currentUrl);
    return `${url?.schema}://${url?.host}${url?.port ? `:${url?.port}` : ''}`;
  }

  /**
   * Retrieves the current schema, host and port from the current URL in the browser's address bar,
   * and parses them into a parsed URL object.
   * @returns The current schema, host and port as a parsed URL object.
   * @example window.location.href = 'https://example.com:8080/users/123' => returns { protocol: 'https', host: 'example.com', port: '8080' }
   */
  static getCurrentSchemasHostPortParsed() {
    let currentUrl = RouteUtils.getCurrentUrl();
    let url = RouteUtils.parseUrl(currentUrl);
    return url;
  }

  static openLinkInNewTab(link: string): void {
    window.open(link, '_blank');
  }

  /**
   * Parses a URL into its protocol, host and port.
   * @param url The URL to parse.
   * @returns A parsed URL object containing the protocol, host and port as strings, or null if the URL is invalid.
   * @example 'https://example.com:8080' => { protocol: 'https', host: 'example.com', port: '8080' }
   * @example 'http://example.com' => { protocol: 'http', host: 'example.com', port: '' }
   * @example 'example.com' => null
   */
  static parseUrl(url: string): {
    schema: string;
    host: string;
    port: string | null;
    params: { [key: string]: string };
  } {
    if (!url || !RouteUtils.isValidUrl(url)) {
      return {
        schema: '',
        host: '',
        port: '',
        params: {}
      };
    }

    const parsedUrl = new URL(url);
  
    const port =
      parsedUrl.port ||
      DEFAULT_PORTS[parsedUrl.protocol.replace(':', '')] ||
      null;
  
    const params: { [key: string]: string } = {};
    parsedUrl.searchParams.forEach((value, key) => {
      params[key] = value;
    });
  
    return {
      schema: parsedUrl.protocol.replace(':', ''),
      host: parsedUrl.hostname,
      port,
      params // This was missing in your original code
    };
  }

  static buildUrl(uri: string, params: { [key: string]: string }): string {
    let url = new URL(uri);
    for (let key in params) {
      url.searchParams.set(key, params[key]);
    }
    return url.toString();
  }

  static formatValidUrlPath(url: string) {
    //replace all /+ or \+ with only 1 /
    url = url.replace(/\/+/g, '/').replace(/\\+/g, '/');

    if (!url.startsWith('/')) url = '/' + url;

    if (url.endsWith('/')) url = url.substring(0, url.length - 1);

    return url;
  }

  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch (error) {
      return false;
    }
  }
}
