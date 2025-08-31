import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, Routes } from '@angular/router';
import { AuthService } from './services/auth-service';

export const routes: Routes = [
  {
    path: '',
    redirectTo: (ActivatedRouteSnapshot) => {
      const authService = inject(AuthService)
      if (authService.hasToken()) {
        return '/home'
      }
      return '/login'
    },
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login-page/login-page').then(m => m.LoginPage)
  },
  {
    path: 'home',
    loadComponent: () => import('./pages/list-page/list-page').then(m => m.ListPage),
    runGuardsAndResolvers: 'always'
  },
  {
    path: 'form',
    loadComponent: () => import('./pages/details-page/details-page').then(m => m.DetailsPage)
  },
  {
    path: 'form/:id',
    loadComponent: () => import('./pages/details-page/details-page').then(m => m.DetailsPage)
  },
  {
    path: 'print/:id',
    loadComponent: () => import('./pages/print-page/print-page').then(m => m.PrintPage)
  }
];
