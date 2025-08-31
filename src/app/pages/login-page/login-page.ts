import { Component, inject, type AfterViewInit } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth-service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login-page',
  imports: [],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss'
})
export class LoginPage implements AfterViewInit{
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  ngAfterViewInit(): void {
    const google = (window as any).google;

    google.accounts.id.initialize({
      client_id: environment.client_id,
      callback: (response: any) => {
        if (response.credential) {
          this.authService.setCredential(response.credential);
          this.requestSheetAccess();
        }
      }
    });

    google.accounts.id.renderButton(
      document.getElementById('google-login'),
      { theme: 'outline', size: 'large' }
    );
  }
  
  requestSheetAccess() {
    const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: environment.client_id,
      scope: "openid profile email https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive",
      callback: (tokenResponse: any) => {
        this.authService.setToken(tokenResponse.access_token);
        this.router.navigate(['/']);
      },
    });

    tokenClient.requestAccessToken({prompt: "consent"});
  }
}