/**
 * {0} prefix path
 * {1} entity name uppercase
 * {2} entity name lowercase
 */
const ANGULAR = `public getAnyMatch{1}s({2}: {1}): Observable<{1}[]> {
    let params = HttpClientUtils.toHttpParams({2});
    return this.httpClient.get<{1}[]>(\`{0}/{2}s/match_any\`, { params: params });
  }
  
  public getAllMatch{1}s({2}: {1}): Observable<{1}[]> {
    let params = HttpClientUtils.toHttpParams({2});
    return this.httpClient.get<{1}[]>(\`{0}/{2}s/match_all\`, { params: params });
  }
  
  public getAnyMatch{1}sWithMatchCase({2}: {1}, matchCase: string): Observable<{1}[]> {
    let params = HttpClientUtils.toHttpParams({2});
    return this.httpClient.get<{1}[]>(\`{0}/{2}s/match_any/\${matchCase}\`, { params: params });
  }
  
  public getAllMatch{1}sWithMatchCase({2}: {1}, matchCase: string): Observable<{1}[]> {
    let params = HttpClientUtils.toHttpParams({2});
    return this.httpClient.get<{1}[]>(\`{0}/{2}s/match_all/\${matchCase}\`, { params: params });
  }
  
  public get{1}s(): Observable<{1}[]> {
    return this.httpClient.get<{1}[]>(\`{0}/{2}s\`);
  }
  
  public get{1}(id: number): Observable<{1}> {
    return this.httpClient.get<{1}>(\`{0}/{2}s/\${id}\`);
  }
  
  public post{1}({2}: {1}): Observable<{1}> {
    return this.httpClient.post<{1}>(\`{0}/{2}s\`, {2});
  }
  
  public put{1}({2}: {1}): Observable<{1}> {
    return this.httpClient.put<{1}>(\`{0}/{2}s/\${{2}.id}\`, {2});
  }
  
  public patch{1}({2}: {1}): Observable<{1}> {
    return this.httpClient.patch<{1}>(\`{0}/{2}s/\${{2}.id}\`, {2});
  }
  
  public delete{1}(id: number): Observable<void> {
    return this.httpClient.delete<void>(\`{0}/{2}s/\${id}\`);
  }`

const HTTP_UTILS = `import { HttpParams } from '@angular/common/http';

export default class HttpClientUtils {
    private static primitives: string[] = ['string', 'number', 'boolean', 'symbol', 'bigint'];

    private static isBuffer(obj: any): boolean {
        if (!obj || typeof obj !== 'object') {
            return false;
        }

        return !!(obj?.constructor?.isBuffer && obj.constructor.isBuffer(obj));
    }

    private static toKeyValuePairs(prefix: string, obj: any): any {
        if (obj === null) {
            obj = '';
        } else if (obj instanceof Date) {
            obj = obj.toISOString();
        }

        if (this.primitives.includes(typeof obj) || this.isBuffer(obj)) {
            return [{
                key: prefix,
                value: String(obj)
            }];
        }

        // skip undefined values
        if (typeof obj === 'undefined') {
            return [];
        }

        const keys = Object.keys(obj);
        const pairs = keys.map((key) => {
            const keyPrefix = prefix + (Array.isArray(obj) ? \`[\${key}]\` : \`.\${key}\`);
            return this.toKeyValuePairs(keyPrefix, obj[key]);
        });

        // [[pair], [pair], [pair]] => [pair, pair, pair]
        return pairs.reduce((accumulator, value) => accumulator.concat(value), []);
    }

    static toHttpParams(obj: object): HttpParams {
        const pairs = [];
        
        for (const [key, value] of Object.entries(obj)) {
            const keyPairs = this.toKeyValuePairs(key, value);
            pairs.push(...keyPairs);
        }

        return pairs.reduce((params, pair) => params.append(pair.key, pair.value), new HttpParams());
    }
}`;

export const ANGULAR_MODEL = {ANGULAR: ANGULAR, HTTP_UTILS: HTTP_UTILS}