import { HttpInterceptorFn, HttpErrorResponse, HttpEvent } from '@angular/common/http';
import { catchError, throwError, switchMap, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth-service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        console.warn("Token expirou. Solicitando novo...");

        return new Observable<HttpEvent<any>>((subscriber) => {
          const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
            client_id: environment.client_id,
            scope: "openid profile email https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive",
            callback: (tokenResponse: any) => {
              authService.setToken(tokenResponse.access_token);

              const cloned = req.clone({
                setHeaders: { Authorization: `Bearer ${tokenResponse.access_token}` }
              });

              next(cloned).subscribe({
                next: (res) => subscriber.next(res),
                error: (err) => subscriber.error(err),
                complete: () => subscriber.complete(),
              });
            },
          });

          tokenClient.requestAccessToken({ prompt: "consent" });
        });
      }

      return throwError(() => error);
    })
  );
};
