import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MaintenanceService } from '../../lib/service/maintenance.service';
import { AuthenticatorService } from '../../lib/service/authenticator.service';
import { MaintenanceInterceptor } from '../../lib/guards/maintenance.interceptor';

// Customer-facing routes (the test shop) are held during maintenance. Staff
// (ADMIN group — the ones the backend lets through via maintenance:bypass)
// may still use the shop to test. The backend enforces the same rule on every
// API call; this guard just keeps the UX clean by routing to /maintenance
// before a screen full of 503s.
export const maintenanceGuard: CanActivateFn = async () => {
  const maintenance = inject(MaintenanceService);
  const auth = inject(AuthenticatorService);
  const router = inject(Router);
  try {
    const status = await firstValueFrom(maintenance.refreshStatus());
    if (status.active && !auth.hasUserGroup('ADMIN')) {
      return router.createUrlTree([MaintenanceInterceptor.maintenanceRoute]);
    }
  } catch {
    // Probe failure is not maintenance — let the route through; the interceptor catches real 503s.
  }
  return true;
};
