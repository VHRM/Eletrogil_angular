import type { Aparelho } from "./aparelho";
import type { Cliente } from "./cliente";

export interface Nota {
  cliente: Cliente;
  aparelho: Aparelho;
  numeroOs?: number;
  dataEntrada: Date;
  dataRetirada?: Date;
  orcamento: string;
  valorOrcamento?: number;
  obs?: string;
  garantia?: number;
  deleted?: boolean
  status: "Peças Solicitadas"|"Não feito"|"Arrumado"|"Entregue"
}