export class Itens {
  id?: number;
  idCompra!: number
  nome!:  string;
  marca!:  string;
  valor!:  number;
  quantidade!:  number;
  pego!:  boolean;

  constructor(itens: Partial<Itens> = {}) {
    Object.assign(this, itens);
  }
}
