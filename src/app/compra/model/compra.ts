export class Compra {
  id?: number;
  nome!: string;
  data!: Date;

  constructor(compra: Partial<Compra> = {}) {
    Object.assign(this, compra);
  }
}
