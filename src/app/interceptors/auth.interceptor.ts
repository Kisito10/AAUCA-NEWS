import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth  = inject(AuthService);
  const token = auth.getToken();

  const esPublica =
    req.url.includes('/api/user/login')         ||
    req.url.includes('/api/user/generar-hash')  ||
    req.url.includes('/api/user/edificios')      ||
    req.url.includes('/api/user/habitaciones')   ||
    req.url.includes('/api/user/valores-filtro') ||
    (req.url.includes('/api/solicitudes') && req.method === 'POST');

  if (token && !esPublica) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(req);
};