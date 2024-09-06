import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class SettingService {

  currentMenu = "main";

  apiGatewayUrl: string = environment.gateway_api;

  displayHeader: boolean = true;

  constructor(private httpClient: HttpClient, private router: Router) { }

  getGatewayUrl(): string {
    return this.apiGatewayUrl;
  }

  getDisplayHeader(): boolean {
    return this.displayHeader;
  }

  setDisplayHeader(value: boolean): void {
    this.displayHeader = value;
  }

  toggleDisplayHeader(): void {
    this.displayHeader = !this.displayHeader;
  }

}
