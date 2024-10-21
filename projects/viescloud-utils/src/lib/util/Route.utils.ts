import { ActivatedRoute } from "@angular/router";
import { first } from "rxjs";

export class RouteUtil {

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

    static getQueryParams(): { [key: string]: string } {
        let url = RouteUtil.getCurrentUrl();
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
        return result;
    }

    static getQueryParam(key: string): string | null {
        let queryParams = RouteUtil.getQueryParams();
        return queryParams[key] ?? null;
    }

    static setQueryParam(param: string, value: string | null) {
        const currentUrl = RouteUtil.getCurrentUrl();
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
    static getPathVariable(variableName: string): string | null {
        // Get the current URL using window.location.href
        const url = RouteUtil.getCurrentUrl();

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
}