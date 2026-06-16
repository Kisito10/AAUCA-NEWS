import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const tecnicoGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (auth.isTecnico() || auth.isDirector()) return true;

  // Si está logueado pero no tiene el rol correcto,
  // redirige a su panel correspondiente
  if (auth.isLoggedIn()) {
    auth.redirectBasedOnRole();
    return false;
  }

  return router.createUrlTree(['/login']);
};