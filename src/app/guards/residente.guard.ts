import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const residenteGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  if (auth.isResidente()) return true;
  if (auth.isLoggedIn()) return router.createUrlTree(['/login']);
  return router.createUrlTree(['/login']);
};