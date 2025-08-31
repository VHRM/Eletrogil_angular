import { Component, inject, signal, type OnInit, type Signal } from '@angular/core';
import { Nota } from '../../interfaces/nota';
import { ActivatedRoute } from '@angular/router';
import { NotaService } from '../../services/nota-service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-print-page',
  imports: [
    DatePipe,
    CurrencyPipe
  ],
  templateUrl: './print-page.html',
  styleUrl: './print-page.scss'
})
export class PrintPage{
  id?: string;
  readonly nota = signal<Nota|null>(null);
  private readonly route = inject(ActivatedRoute)
  private readonly notaService = inject(NotaService)
  private readonly snackbar = inject(MatSnackBar)

  constructor () {
    this.id = this.route.snapshot.paramMap.get('id') ?? undefined;

    if (this.id) {
      this.notaService.initialize().subscribe((sheetId: string) => {
        if (!sheetId) {
          this.snackbar.open("Falha ao inicializar planilha. Tente novamente.", "Fechar", {
            duration: 5000
          });
          return;
        }

        this.notaService.setSheetId(sheetId);

        this.notaService.getNotaByOs(Number.parseInt(this.id as string))
          .subscribe((result) => {
            this.nota.set(result);
        });
      });
    }
  }
}
