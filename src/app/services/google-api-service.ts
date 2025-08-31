import { inject, Injectable } from '@angular/core';
import { AuthService } from './auth-service';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class GoogleApiService {
  private sheetsUrl = "https://sheets.googleapis.com/v4/spreadsheets";
  private driveUrl = "https://www.googleapis.com/drive/v3/files";
  private authService = inject(AuthService);
  private http = inject(HttpClient)

  create() {
    const headers = new HttpHeaders({
      "Authorization": "Bearer " + this.authService.getToken(),
      "Content-Type": "application/json"
    });
    const payload = {
      properties: {
        title: "EletroGil"
      },
      sheets: [
        {
          properties: {
            title: "BD"
          }
        }
      ]
    }
    return this.http.post(this.sheetsUrl, payload, {headers: headers});
  }

  getIdByName(name: string = "EletroGil") {
    const headers = new HttpHeaders({
      "Authorization": "Bearer " + this.authService.getToken()
    });
    const payload = {
      q: `mimeType='application/vnd.google-apps.spreadsheet' and name='${name}' and trashed=false`,
      fields: "files(id, name)"
    }

    return this.http.get(this.driveUrl, {params: payload, headers: headers});
  }

  getSheetById(id: string) {
    const headers = new HttpHeaders({
      "Authorization": "Bearer " + this.authService.getToken()
    });

    const range = `BD!A2:O`;
    const url = `${this.sheetsUrl}/${id}/values/${range}`;

    return this.http.get(url, { headers });
  }

  addRow(id: string, row: any[]) {
    const headers = new HttpHeaders({
      "Authorization": "Bearer " + this.authService.getToken()
    });

    const payload = {
      values: [row]
    };
    
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${id}/values/BD!A1:append?valueInputOption=RAW`;
    return this.http.post(url, payload, { headers: headers });
  }

  updateRow(id: string, rowNumber: number, row: any[]) {
    const headers = new HttpHeaders({
      "Authorization": "Bearer " + this.authService.getToken(),
      "Content-Type": "application/json"  
    });

    const range = `BD!A${rowNumber}:O${rowNumber}`;
    const payload = {
      values: [row]
    };
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${id}/values/${range}?valueInputOption=RAW`;

    return this.http.put(url, payload, { headers });
  }

  deleteRow(id: string, rowNumber: number) {
    const headers = new HttpHeaders({
      "Authorization": "Bearer " + this.authService.getToken(),
      "Content-Type": "application/json"
    });

    const range = `BD!N${rowNumber}`;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${id}/values/${range}?valueInputOption=RAW`;

    const body = {
      values: [["true"]] // ou "1", "X", etc
    };

    return this.http.put(url, body, { headers });
  }
}