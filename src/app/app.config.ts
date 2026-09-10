import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { AuthInterceptor } from '../lib/guards/auth.interceptor';
import { MaintenanceInterceptor } from '../lib/guards/maintenance.interceptor';
import { KNOWN_PERMISSIONS, KnownPermission } from '../lib/model/permission.model';

// Venzora's permission vocabulary — suggestions for the role editor's chips
// input. The grammar lives in the lib; the words live here. Keep in sync with
// the backend controllers' resourceName()/@RequiresAuthority values.
const CRUD = ['read', 'create', 'update', 'delete'];
export const VENZORA_PERMISSIONS: KnownPermission[] = [
  { resource: 'catalog',     actions: CRUD,                                    description: 'Products, variants, categories, tags, media (catalog:update also runs the variant generator)' },
  { resource: 'schema',      actions: CRUD,                                    description: 'Attribute definitions and options' },
  { resource: 'orders',      actions: [...CRUD, 'manage', 'restock'],          description: 'Orders; manage = back-office access to every order; restock = put refunded goods back' },
  { resource: 'shipments',   actions: CRUD,                                    description: 'Shipments' },
  { resource: 'returns',     actions: [...CRUD, 'manage'],                     description: 'Return requests; manage = back-office access to every return' },
  { resource: 'discounts',   actions: CRUD,                                    description: 'Discount codes' },
  { resource: 'rules',       actions: CRUD,                                    description: 'Shipping and tax rules (rules:update = tax import)' },
  { resource: 'inventory',   actions: CRUD,                                    description: 'Stock movements / adjustments, warehouses, stock per warehouse' },
  { resource: 'shipping',    actions: CRUD,                                    description: 'Carrier records (accounts, credentials, service levels)' },
  { resource: 'reviews',     actions: CRUD,                                    description: 'Review moderation' },
  { resource: 'reports',     actions: ['read'],                                description: 'Reports dashboard' },
  { resource: 'customers',   actions: CRUD,                                    description: 'Customer profiles and addresses' },
  { resource: 'checkout',    actions: ['read', 'capture', 'refund', 'cancel', 'sync'], description: 'MONEY — never implied by orders:*' },
  { resource: 'iam',         actions: CRUD,                                    description: 'Users, groups, roles — as sensitive as money' },
  { resource: 'maintenance', actions: [...CRUD, 'bypass'],                     description: 'Maintenance mode; bypass = keep working while customers are held' },
  { resource: 'smtp',        actions: [...CRUD, 'send'],                       description: 'Outbound mail accounts (credentials round-trip → read is a real grant); send = mail through them' },
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes), provideClientHydration(withEventReplay()),
    provideHttpClient(
      withInterceptorsFromDi()
    ),
    {provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true},
    {provide: HTTP_INTERCEPTORS, useClass: MaintenanceInterceptor, multi: true},
    {provide: KNOWN_PERMISSIONS, useValue: VENZORA_PERMISSIONS},
  ]
};
