import { Injectable } from '@angular/core';
import { Organization, OrganizationJoinRequest } from '../model/Organization.model';
import { HttpClient } from '@angular/common/http';
import { ViesRestService } from './Rest.service';

@Injectable({
  providedIn: 'root'
})
export class OrganizationService extends ViesRestService<Organization> {

  protected override getPrefixes(): string[] {
    return ['saturday', 'organizations'];
  }

  selectedOrganizationId?: string;

  constructor(httpClient: HttpClient) {
    super(httpClient);
  }
}

@Injectable({
  providedIn: 'root'
})
export class OrganizationJoinRequestService extends ViesRestService<OrganizationJoinRequest> {

  protected override getPrefixes(): string[] {
    return ['saturday', 'organizationJoinRequests'];
  }

  selectedOrganizationId?: string;

  constructor(httpClient: HttpClient) {
    super(httpClient);
  }
}
