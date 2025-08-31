import { inject, Injectable } from '@angular/core';
import type { Nota } from '../interfaces/nota';
import { filter, map, Observable, of, switchMap } from 'rxjs';
import { GoogleApiService } from './google-api-service';
import type { Cliente } from '../interfaces/cliente';
import type { Aparelho } from '../interfaces/aparelho';

@Injectable({
  providedIn: 'root'
})
export class NotaService {
  private readonly sheetsApi = inject(GoogleApiService);
  private sheetId?: string;
  private notas?: Nota[];

  getNotas(forceUpdate = false): Observable<(Nota | null)[]> {
    if (this.notas && !forceUpdate) {
      return of(this.notas);
    }

    return this.sheetsApi.getSheetById(this.sheetId as string).pipe(
      map((res: any) => {
        const rows: any[][] = res.values || [];
        return rows.map(row => this.rowToNota(row));
      })
    )
  }

  setNotas(notas: Nota[]) {
    this.notas = notas;
  }

  saveNota(id: number, nota: Nota) {
    nota.numeroOs = id;
    return this.sheetsApi.addRow(this.sheetId as string, this.notaToRow(nota));
  }

  getNotaByOs(os: number): Observable<Nota | null> {
    return this.getNotas().pipe(
      map((notas) => notas.find(nota => nota?.numeroOs == os) ?? null)
    );
  }

  initialize() {
    if (!!this.getSheetId()) return of(this.getSheetId());

    const headers = [
      "numeroOs",
      "dataEntrada",
      "dataRetirada",
      "orcamento",
      "valorOrcamento",
      "obs",
      "garantia",
      "cliente.nome",
      "cliente.telefone",
      "cliente.cpf",
      "aparelho.tipo",
      "aparelho.modelo",
      "aparelho.marca",
      "deleted",
      "status"
    ];

    return this.sheetsApi.getIdByName().pipe(
      switchMap((res: any) => {
        console.log(res)
        if (res.files && res.files.length > 0) {
          return of(res.files[0].id);
        }

        return this.sheetsApi.create().pipe(
          switchMap((created: any) => {
            console.log(created)
            return this.sheetsApi.addRow(created.spreadsheetId, headers).pipe(
              map(() => created.spreadsheetId)
            );
          })
        );
      })
    );
  }

  setSheetId(id: string) {
    this.sheetId = id;
  }
  
  getSheetId() {
    return this.sheetId;
  }

  private notaToRow(nota: Nota): any[] {
    return [
      nota.numeroOs ?? '',
      nota.dataEntrada?.toISOString() ?? '',
      nota.dataRetirada?.toISOString() ?? '',
      nota.orcamento,
      nota.valorOrcamento,
      nota.obs ?? '',
      nota.garantia,
      nota.cliente.nome,
      nota.cliente.telefone,
      nota.cliente.cpf ?? '',
      nota.aparelho.tipo,
      nota.aparelho.modelo,
      nota.aparelho.marca,
      nota.deleted ? 'deleted' : '',
      nota.status ?? 'Não feito'
    ];
  }

  private rowToNota(row: any[]): Nota|null {
    if (row.length < 1) return null;

    const nota: Nota = {
      numeroOs: row[0] || undefined,
      dataEntrada: row[1] ? new Date(row[1]) : new Date(),
      dataRetirada: row[2] ? new Date(row[2]) : undefined,
      orcamento: row[3],
      valorOrcamento: Number(row[4]),
      obs: row[5] || undefined,
      garantia: Number(row[6]),
      cliente: {
        nome: row[7],
        telefone: row[8],
        cpf: row[9] || undefined
      } as Cliente,
      aparelho: {
        tipo: row[10],
        modelo: row[11],
        marca: row[12]
      } as Aparelho,
      deleted: row[13] === 'deleted',
      status: row[14] ?? 'Não feito'
    };

    return nota;
  }

  updateNota(notaUpdated: Nota) {
   return this.getNotas().pipe(
      switchMap((notas) => {
        const index = notas.findIndex(nota => nota?.numeroOs === notaUpdated.numeroOs);
        if (index < 0) return of(false);

        return this.sheetsApi.updateRow(this.sheetId as string, index + 2, this.notaToRow(notaUpdated)); 
      })
    );
  }

  delete(os: number) {
    return this.getNotas().pipe(
      switchMap((notas) => {
        const index = notas.findIndex(nota => nota?.numeroOs === os);

        if (index < 0) return of(false);

        const nota = notas[index];
        if (!nota) return of(false);

        nota.deleted = true;
        return this.sheetsApi.updateRow(this.sheetId as string, index + 2, this.notaToRow(nota)); 
      })
    );
  }
}
