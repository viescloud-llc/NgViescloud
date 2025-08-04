import { Injectable } from "@angular/core";
import { ViesService } from "./rest.service";
import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from "@angular/common/http";
import { RouteUtils } from "../util/Route.utils";
import { Observable, throwError } from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class ViesHttpClientService extends ViesService {

    constructor(
        httpClient: HttpClient
    ) {
        super(httpClient);
    }

    protected override getPrefixes(): string[] {
        return ['api', 'v1', 'http', 'clients']
    }

    request<T>(request: {
        url: string, 
        method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', 
        headers?: Map<string, string>, 
        queryParams?: Map<string, string>, 
        body?: any,
        responseType?: 'json' | 'text' | 'blob' | 'arraybuffer'
      }): Observable<HttpResponse<T>>
      {
        try {
            // Parse the URL to extract existing query parameters
            const urlObj = new URL(request.url);
            const existingParams = new URLSearchParams(urlObj.search);

            // Merge existing query params with new ones
            if (request.queryParams) {
                request.queryParams.forEach((value, key) => {
                    existingParams.set(key, value);
                });
            }

            // Reconstruct the complete URL with all query parameters
            const completeUrl = `${urlObj.origin}${urlObj.pathname}${existingParams.toString() ? '?' + existingParams.toString() : ''}`;

            // Prepare backend request parameters
            let backendParams = new HttpParams()
                .set('url', completeUrl)
                .set('method', request.method);

            // Prepare headers for the backend request
            let backendHeaders = new HttpHeaders();

            // Determine content type based on body type
            let requestBody = request.body;
            let contentType = 'application/json';

            if (request.body) {
                if (request.body instanceof Blob) {
                    contentType = request.body.type || 'application/octet-stream';
                    // For blob bodies, we might need to convert to base64 or handle differently
                    // depending on how your backend processes binary data
                } else if (request.body instanceof FormData) {
                    // Don't set content-type for FormData, let the browser set it with boundary
                    contentType = '';
                } else if (request.body instanceof ArrayBuffer) {
                    contentType = 'application/octet-stream';
                } else if (typeof request.body === 'string') {
                    contentType = 'text/plain';
                } else if (request.body instanceof URLSearchParams) {
                    contentType = 'application/x-www-form-urlencoded';
                }
                // For regular objects, keep 'application/json' as default
            }

            // Set content type if not empty (FormData case)
            if (contentType) {
                backendHeaders = backendHeaders.set('Content-Type', contentType);
            }

            // Format headers for the "forward-headers" parameter
            if (request.headers && request.headers.size > 0) {
                const forwardHeadersArray: string[] = [];
                request.headers.forEach((value, key) => {
                    forwardHeadersArray.push(`${key}:${value}`);
                });
                backendHeaders = backendHeaders.set('forward-headers', forwardHeadersArray.join(','));
            }

            // Handle different body types for backend transmission
            if (request.body instanceof Blob) {
                // Convert Blob to base64 for JSON transmission
                return new Observable<HttpResponse<T>>(observer => {
                    const reader = new FileReader();
                    reader.onload = () => {
                        const base64Data = (reader.result as string).split(',')[1]; // Remove data:type/subtype;base64, prefix
                        const blobMetadata = {
                            type: 'blob',
                            contentType: request.body.type,
                            size: request.body.size,
                            data: base64Data
                        };

                        this.makeBackendCall<T>(blobMetadata, backendParams, backendHeaders, request.responseType)
                            .subscribe({
                                next: response => observer.next(response),
                                error: error => observer.error(error),
                                complete: () => observer.complete()
                            });
                    };
                    reader.onerror = () => observer.error(new Error('Failed to read blob'));
                    reader.readAsDataURL(request.body);
                });
            } else if (request.body instanceof ArrayBuffer) {
                // Convert ArrayBuffer to base64
                const uint8Array = new Uint8Array(request.body);
                const binaryString = uint8Array.reduce((acc, byte) => acc + String.fromCharCode(byte), '');
                const base64Data = btoa(binaryString);

                const arrayBufferMetadata = {
                    type: 'arraybuffer',
                    byteLength: request.body.byteLength,
                    data: base64Data
                };

                return this.makeBackendCall<T>(arrayBufferMetadata, backendParams, backendHeaders, request.responseType);
            } else if (request.body instanceof FormData) {
                // Convert FormData to a serializable format
                const formDataObj: { [key: string]: any } = {};
                request.body.forEach((value, key) => {
                    if (value instanceof File) {
                        // Handle File objects in FormData
                        formDataObj[key] = {
                            type: 'file',
                            name: value.name,
                            size: value.size,
                            lastModified: value.lastModified,
                            // Note: You might need to read the file content if the backend needs it
                        };
                    } else {
                        formDataObj[key] = value;
                    }
                });

                const formDataMetadata = {
                    type: 'formdata',
                    data: formDataObj
                };

                return this.makeBackendCall<T>(formDataMetadata, backendParams, backendHeaders, request.responseType);
            } else {
                // Regular JSON, string, or primitive body
                return this.makeBackendCall<T>(requestBody, backendParams, backendHeaders, request.responseType);
            }

        } catch (error) {
            // Handle URL parsing errors or other issues
            console.error('Error processing request:', error);
            return throwError(() => error);
        }
    }

    private makeBackendCall<_>(
        body: any,
        params: HttpParams,
        headers: HttpHeaders,
        responseType?: 'json' | 'text' | 'blob' | 'arraybuffer' | any
    ): Observable<HttpResponse<_>> {
        return this.httpClient.post<_>(`${this.getPrefixUri()}/request`, body, {
            params: params,
            headers: headers,
            observe: 'response',
            responseType: responseType
        });
    }

    get<T>(request: {
        url: string, 
        headers?: Map<string, string>, 
        queryParams?: Map<string, string>, 
        body?: any,
        responseType?: 'json' | 'text' | 'blob' | 'arraybuffer'
    }): Observable<HttpResponse<T>> {
        return this.request<T>({url: request.url, method: 'GET', headers: request.headers, queryParams: request.queryParams, body: request.body, responseType: request.responseType});
    }

    post<T>(request: {
        url: string, 
        headers?: Map<string, string>, 
        queryParams?: Map<string, string>, 
        body?: any,
        responseType?: 'json' | 'text' | 'blob' | 'arraybuffer'
    }): Observable<HttpResponse<T>> {
        return this.request<T>({url: request.url, method: 'POST', headers: request.headers, queryParams: request.queryParams, body: request.body, responseType: request.responseType});
    }

    put<T>(request: {
        url: string, 
        headers?: Map<string, string>, 
        queryParams?: Map<string, string>, 
        body?: any,
        responseType?: 'json' | 'text' | 'blob' | 'arraybuffer'
    }): Observable<HttpResponse<T>> {
        return this.request<T>({url: request.url, method: 'PUT', headers: request.headers, queryParams: request.queryParams, body: request.body, responseType: request.responseType});
    }

    delete<T>(request: {
        url: string, 
        headers?: Map<string, string>, 
        queryParams?: Map<string, string>, 
        body?: any,
        responseType?: 'json' | 'text' | 'blob' | 'arraybuffer'
    }): Observable<HttpResponse<T>> {
        return this.request<T>({url: request.url, method: 'DELETE', headers: request.headers, queryParams: request.queryParams, body: request.body, responseType: request.responseType});
    }
}