import { HttpParams } from "@angular/common/http";

export class HttpParamsBuilder {
  params = new HttpParams();

  constructor(params?: HttpParams) {
    if(params) {
      this.params = params;
    }
    else {
      this.params = new HttpParams();
    }
  }

  set(key: string, value: any) {
    this.params = this.params.set(key, value);
    return this;
  }

  setIf(key: string, value: any, producerFn: (value: any) => boolean) {
    if(producerFn(value)) {
      this.params = this.params.set(key, value);
    }

    return this;
  }

  setIfValid(key: string, value?: any) {
    if(value instanceof Boolean) {
      this.params = this.params.set(key, value.toString());
    }
    else if (value) {
      this.params = this.params.set(key, value);
    }

    return this;
  }

  build(): HttpParams {
    return this.params;
  }
}
