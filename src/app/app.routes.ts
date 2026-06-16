import { Routes } from '@angular/router';
import { authGuard }      from './guards/auth.guard';
import { adminGuard }     from './guards/admin.guard';
import { directorGuard }  from './guards/director.guard';
import { residenteGuard } from './guards/residente.guard';
import { tecnicoGuard }   from './guards/tecnico.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/landing/landing.component')
      .then(m => m.LandingComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component')
      .then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./components/register/register.component')
      .then(m => m.RegisterComponent)
  },
  {
    // Celador — gestiona noticias
    path: 'admin',
    loadComponent: () => import('./components/admin/admin.component')
      .then(m => m.AdminComponent),
    canActivate: [authGuard, adminGuard]
  },
  {
    // Director y DirectorAdjunto — acceso total
    path: 'director',
    loadComponent: () => import('./components/director/director.component')
      .then(m => m.DirectorComponent),
    canActivate: [authGuard, directorGuard]
  },
  {
    // Residente — solo lectura
    path: 'residente',
    loadComponent: () => import('./components/residente/residente.component')
      .then(m => m.ResidenteComponent),
    canActivate: [authGuard, residenteGuard]
  },
  {
    // Técnico — gestiona backups
    path: 'tecnico',
    loadComponent: () => import('./components/tecnico/tecnico.component')
      .then(m => m.TecnicoComponent),
    canActivate: [authGuard, tecnicoGuard]
  },
  { path: '**', redirectTo: '' }
];