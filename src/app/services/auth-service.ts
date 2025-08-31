import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  getToken(): string {
    return sessionStorage.getItem('eletrogil_access_token') ?? '';
  }

  hasToken(): boolean {
    return (!!this.getToken() && this.getToken() != '');
  }

  getUser(): string {
    return this.decodeCredential()?.name  ?? "";
  }

  setCredential(credential: string) {
    sessionStorage.setItem('eletrogil_client_jwt', credential);
  }

  getCredential() {
    return sessionStorage.getItem('eletrogil_client_jwt') ?? '';
  }

  setToken(token: string) {
    sessionStorage.setItem('eletrogil_access_token', token);
  }

  private decodeCredential() {
    try {
      const payload = JSON.parse(atob(this.getCredential().split('.')[1]));
      return payload;
    } catch {
      return null;
    }
  }
}
