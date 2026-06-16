import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const directorGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isDirector()) return true;
  if (auth.isLoggedIn()) return router.createUrlTree(['/residente']);
  return router.createUrlTree(['/login']);
};