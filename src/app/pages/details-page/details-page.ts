import { Component, inject, type OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators, type AbstractControl, type ValidationErrors, type ValidatorFn } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { NgxMaskDirective } from "ngx-mask";
import type { Nota } from '../../interfaces/nota';
import { NotaService } from '../../services/nota-service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-details-page',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    NgxMaskDirective,
    RouterModule,
    MatProgressSpinnerModule,
    CommonModule,
    MatSelectModule
],
  templateUrl: './details-page.html',
  styleUrl: './details-page.scss'
})
export class DetailsPage implements OnInit{
  id?: string;
  createId?: string;
  loading = true;
  readonly possibleStatuses = ["Peças Solicitadas", "Não feito", "Arrumado", "Entregue"];
  readonly form = new FormGroup({
    nomeCliente: new FormControl('', [Validators.required, Validators.minLength(3)]),
    cpfCliente: new FormControl('', [this.cpfValidator()]),
    telefoneCliente: new FormControl('', [Validators.required]),
    tipoAparelho: new FormControl('', [Validators.required]),
    marcaAparelho: new FormControl('', [Validators.required]),
    modeloAparelho: new FormControl('', [Validators.required]),
    dataEntrada: new FormControl('', [Validators.required]),
    dataRetirada: new FormControl('', []),
    orcamento: new FormControl('', [Validators.required]),
    orcamentoValor: new FormControl('', []),
    garantia: new FormControl('', []),
    obs: new FormControl('', []),
    status: new FormControl('', [Validators.required])
  })
  private readonly notaService = inject(NotaService);
  private readonly snackbar = inject(MatSnackBar);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  constructor () {
    console.log(this.route.snapshot.paramMap.get('id'))
    this.id = this.route.snapshot.paramMap.get('id') ?? undefined;

    this.notaService.initialize().subscribe((sheetId: string) => {
      if (!sheetId) {
        this.snackbar.open("Falha ao inicializar planilha. Tente novamente.", "Fechar", {
          duration: 5000
        });
        return;
      }

      this.notaService.setSheetId(sheetId);
      if (this.id) {
        this.notaService.getNotaByOs(Number.parseInt(this.id as string))
        .subscribe((result) => {
          if (result) {
            this.form.setValue(this.mapNotaToFormValue(result));
            this.loading = false;
          } else {
            this.snackbar.open("Erro ao carregar dados. Tente novamente.", "Fechar", {
              duration: 5000
            }).afterDismissed().subscribe(() => {
              this.router.navigate(["/home"]);
            });
          }
        });
      } else {
        this.notaService.getNotas().subscribe(result => {
          console.log(result);
          this.createId = result.length.toString();
          this.loading = false;
        })
      }
    });
  }

  ngOnInit(): void {
    
  }


  cpfValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (control.value.length == 0) return null;
      const cpf = (control.value || '').replace(/\D/g, ''); // só números
      if (cpf.length !== 11) {
        return { cpfInvalid: true };
      }

      // elimina CPFs inválidos conhecidos
      if (/^(\d)\1{10}$/.test(cpf)) {
        return { cpfInvalid: true };
      }

      // valida dígitos verificadores
      let soma = 0;
      for (let i = 0; i < 9; i++) {
        soma += parseInt(cpf.charAt(i)) * (10 - i);
      }
      let resto = (soma * 10) % 11;
      if (resto === 10 || resto === 11) resto = 0;
      if (resto !== parseInt(cpf.charAt(9))) return { cpfInvalid: true };

      soma = 0;
      for (let i = 0; i < 10; i++) {
        soma += parseInt(cpf.charAt(i)) * (11 - i);
      }
      resto = (soma * 10) % 11;
      if (resto === 10 || resto === 11) resto = 0;
      if (resto !== parseInt(cpf.charAt(10))) return { cpfInvalid: true };

      return null; // válido
    };
  }

  save(event: any) {
    console.log('entrei');
    event.preventDefault();
    console.log('passei');
    this.form.markAllAsTouched();

    console.log(this.form)
    if (this.form.valid) {
      const nota = this.mapFormValueToNota(this.form);
      console.log(nota);
      console.log(this.id);
      if (this.id) {
        this.notaService.updateNota(nota).subscribe(result => {
          console.log(result)
          if (result) {
            this.snackbar.open('Salvo com sucesso!', 'Fechar', {
              duration: 3000, // fecha em 3s
              panelClass: ['snackbar-success'],
            }).afterDismissed().subscribe(() => {
              this.router.navigate(['/home']);
            });
          }
        })
      } else {
        this.notaService.saveNota((this.createId ?? -1) as number, nota).subscribe((result) => {
        this.snackbar.open('Salvo com sucesso!', 'Fechar', {
          duration: 3000, // fecha em 3s
          panelClass: ['snackbar-success'],
        }).afterDismissed().subscribe(() => {
          this.router.navigate(['/home']);
        });
      });
      }
    }
  }

  mapNotaToFormValue(nota: Nota) {
    return {
      nomeCliente: nota.cliente.nome, 
      telefoneCliente: nota.cliente.telefone,
      cpfCliente: nota.cliente.cpf ?? '',
      tipoAparelho: nota.aparelho.tipo,
      marcaAparelho: nota.aparelho.marca,
      modeloAparelho: nota.aparelho.modelo,
      dataEntrada: nota.dataEntrada.toISOString().substring(0, 10), // yyyy-MM-dd p/ input date
      dataRetirada: nota.dataRetirada
        ? nota.dataRetirada.toISOString().substring(0, 10)
        : '',
      orcamento: nota.orcamento,
      orcamentoValor: (nota.valorOrcamento ?? 0).toString(),
      garantia: (nota.garantia ?? 0).toString(),
      obs: nota.obs ?? '',
      status: nota.status
    };
  }

  mapFormValueToNota(form: FormGroup): Nota {
    const [dayE, monthE, yearE] = form.get('dataEntrada')!.value!.split('-').reverse().map(Number);
    const dataEntrada = new Date(yearE, monthE - 1, dayE);

    let dataRetirada = undefined;
    if (form.get('dataRetirada')?.value) {
      const [dayR, monthR, yearR] = form.get('dataRetirada')!.value!.split('-').reverse().map(Number);
      dataRetirada = new Date(yearR, monthR - 1, dayR);
    }

    return {
      aparelho: {
        marca: form.get('marcaAparelho')?.value ?? '',
        modelo: form.get('modeloAparelho')?.value ?? '',
        tipo: form.get('tipoAparelho')?.value ?? '',
      },
      cliente: {
        nome: form.get('nomeCliente')?.value ?? '',
        cpf: form.get('cpfCliente')?.value,
        telefone: form.get('telefoneCliente')?.value ?? '',
      },
      dataEntrada: dataEntrada,
      dataRetirada: dataRetirada,
      garantia: form.get('garantia')?.value,
      orcamento: form.get('orcamento')?.value ?? '',
      valorOrcamento: form.get('orcamentoValor')?.value,
      obs: form.get('obs')?.value ?? '',
      numeroOs: (this.id ?? 0) as number,
      status: form.get('status')?.value
    }
  }
}
