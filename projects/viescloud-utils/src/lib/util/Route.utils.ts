import { ActivatedRoute } from "@angular/router";
import { first } from "rxjs";

export class RouteUtils {

    private constructor() { }

    static async getRouteParam(route: ActivatedRoute, variable: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            route.params.pipe(first()).subscribe(
                params => {
                    let value = params[variable];
                    resolve(value);
                },
                error => { reject('') }
            );
        })
    }

    static getQueryParams(decodeUrl?: boolean): { [key: string]: string } {
        let url = RouteUtils.getCurrentUrl();
        let result: { [key: string]: string } = {};
        let query = url.split('?')[1];
        if (query) {
            let params = query.split('&');
            params.forEach(param => {
                let key = param.split('=')[0];
                let value = param.split('=')[1];
                result[key] = value;
            })
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
        const segments = url.split('/').filter(segment => segment); // Remove empty segments

        // Find the index of the variable name
        const index = segments.indexOf(variableName);

        // If the variable exists and is not the last segment, return the next segment
        if (index !== -1 && index + 1 < segments.length) {
            return segments[index + 1];
        }

        return null; // Return null if the variable is not found
    }

    static getCurrentUrl(): string {
        return window.location.href;
    }

    static openLinkInNewTab(link: string): void {
        window.open(link, '_blank');
    }

    static parseUrl(url: string): { protocol: string; host: string; port: string } | null {
        // Regular expression to match protocol, host, and port
        const urlPattern = /^(https?):\/\/([\d.]+):(\d+)/;
        const match = url.match(urlPattern);

        if (match) {
            const [, protocol, host, port] = match;
            return { protocol, host, port };
        } else {
            console.error("Invalid URL format");
            return null;
        }
    }

    static buildUrl(uri: string, params: { [key: string]: string }): string {
        let url = new URL(uri);
        for (let key in params) {
            url.searchParams.set(key, params[key]);
        }
        return url.toString();
    }
}
