import { Component, effect, signal, computed, type OnInit, viewChild, ViewChild, type AfterViewInit, inject, type TemplateRef, } from '@angular/core';
import type { Nota } from '../../interfaces/nota';
import { NotaService } from '../../services/nota-service';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { NgxMaskPipe } from 'ngx-mask'
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule, Router, NavigationEnd} from '@angular/router';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { filter, type Observable, type Subscription } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-list-page',
  imports: [
    MatTableModule,
    CurrencyPipe,
    MatSortModule,
    DatePipe,
    MatIconModule,
    NgxMaskPipe,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    RouterModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatDialogModule
],
  templateUrl: './list-page.html',
  styleUrl: './list-page.scss'
})
export class ListPage implements OnInit, AfterViewInit {
  loading = true;
  readonly possibleStatuses = ["Peças Solicitadas", "Não feito", "Arrumado", "Entregue"];
  private readonly notaService = inject(NotaService);
  private readonly router = inject(Router);
  private readonly snackbar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  readonly notas = signal<Nota[]>([]);
  readonly notasDS = new MatTableDataSource<Nota>();
  readonly displayedCols = ["numeroOs", "clienteNome", "clienteCPF", "dataEntrada", "dataRetirada", "aparelho", "orcamentoValor", "status", "action"];
  readonly form = new FormGroup({
    nome: new FormControl(''),
    cpf: new FormControl(''),
    dtEntrada: new FormControl(),
    dtSaida: new FormControl(),
    status: new FormControl()
  });
  readonly filtered = signal<boolean>(false);

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild('confirmDialog') confirmDialog!: TemplateRef<any>;

  constructor() {
    effect(() => {
      console.log(this.notas());
      this.notasDS.data = this.notas().filter((nota: Nota) => {
        return !nota.deleted;
      });
    });
    
    this.notaService.initialize().subscribe((sheetId: string) => {
      if (!sheetId) {
        this.snackbar.open("Falha ao inicializar planilha. Tente novamente.", "Fechar", {
          duration: 5000
        });
        return;
      }

      this.notaService.setSheetId(sheetId);
      this.buscarNotas();      
    })
  }

  buscarNotas() {
    this.loading = true;
    this.notaService.getNotas(true)
      .subscribe(notas => {
        if (!notas) {
          this.snackbar.open("Falha ao buscar notas, tente novamente.", "Fechar", {
            duration: 3000,
          }).afterDismissed().subscribe(() => {
            this.router.navigate(['/login'])
          })
          return;
        }
        this.loading = false;
        const nonInvalidNotas = notas.filter((nota) => !!nota);
        this.notas.set(nonInvalidNotas);
        this.notaService.setNotas(nonInvalidNotas);
      })
  }

  ngOnInit(): void {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.buscarNotas();
    })
  }

  ngAfterViewInit(): void {
    this.notasDS.sort = this.sort;
    this.notasDS.paginator = this.paginator;
    this.notasDS.filterPredicate = (data: Nota, filter: string): boolean => {
      try {
        const parsedFilter = JSON.parse(filter);
        console.log(parsedFilter);
        const evaluationList = [true];
        if (parsedFilter.nome && parsedFilter.nome != "") {
          evaluationList.push(data.cliente.nome.trim().toLowerCase().includes(parsedFilter.nome));
        }
        if (parsedFilter.cpf && parsedFilter.cpf != "") {
          evaluationList.push(data.cliente.cpf?.trim().toLowerCase().includes(parsedFilter.nome) ?? false);
        }
        if (parsedFilter.dtEntrada) {
          const [day, month, year] = parsedFilter.dtEntrada.split('-').reverse().map(Number);
          const date = new Date(year, month - 1, day);
          console.log(date, data.dataEntrada);
          evaluationList.push(data.dataEntrada?.toDateString() == date?.toDateString());
        }
        if (parsedFilter.dtSaida) {
          const [day, month, year] = parsedFilter.dtSaida.split('-').reverse().map(Number);
          const date = new Date(year, month - 1, day);
          evaluationList.push(data.dataRetirada?.toDateString() == date?.toDateString());
        }
        if (parsedFilter.status) {
          evaluationList.push(data.status == parsedFilter.status);
        }

        return evaluationList.reduce((acc, curr) => {
          return acc && curr;
        }) ?? true;
      }
      catch {
        return false;
      }
    }
  }

  openDetails(os: number): void {
    this.router.navigate(['/form', os])
  }

  filter() {
    if (this.form.pristine) return;

    const filterData = {
      nome: this.form.get('nome')?.value?.trim().toLowerCase(),
      cpf: this.form.get('cpf')?.value?.trim().toLowerCase(),
      dtEntrada: this.form.get('dtEntrada')?.value?.trim().toLowerCase(),
      dtSaida: this.form.get('dtSaida')?.value?.trim().toLowerCase(),
      status: this.form.get('status')?.value
    }

    console.log(filterData);

    this.notasDS.filter = JSON.stringify(filterData);
    this.filtered.set(true);
    if (this.notasDS.paginator) {
      this.notasDS.paginator.firstPage();
    }
  }

  clear() {
    this.notasDS.filter = '';
    if (this.notasDS.paginator) {
      this.notasDS.paginator.firstPage();
    }
    this.form.reset();
    this.filtered.set(false);
  }

  openDeleteDialog(nota: Nota) {
    const dialogRef = this.dialog.open(this.confirmDialog, {
      data: nota
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.deleteRow(nota);
      }
    });
  }

  deleteRow(nota: Nota) {
    this.loading = true;
    this.notaService.delete(nota.numeroOs as number).subscribe(res => {
      if (!res) {
        this.snackbar.open("Falha ao excluir", "Fechar", { duration: 5000 });
      }
      this.buscarNotas();
    });
  }

  print(nota: Nota) {
    const url = this.router.serializeUrl(
      this.router.createUrlTree(['/print', nota.numeroOs])
    );
    window.open(url, '_blank');
  }
}
