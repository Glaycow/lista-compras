import {ItemCategory} from './item-categories';

export interface ShoppingTemplateItem {
  nome: string;
  marca?: string;
  quantidade: number;
  valor: number;
  categoria: ItemCategory;
}

export interface ShoppingTemplate {
  id: string;
  nome: string;
  itens: ShoppingTemplateItem[];
}

export const SHOPPING_TEMPLATES: ShoppingTemplate[] = [
  {
    id: 'semanal',
    nome: 'Compra Semanal',
    itens: [
      {nome: 'Arroz', quantidade: 1, valor: 25, categoria: 'Mercearia'},
      {nome: 'Feijão', quantidade: 1, valor: 8, categoria: 'Mercearia'},
      {nome: 'Leite', quantidade: 2, valor: 5, categoria: 'Laticínios'},
      {nome: 'Pão', quantidade: 1, valor: 12, categoria: 'Padaria'},
      {nome: 'Ovos', quantidade: 1, valor: 18, categoria: 'Mercearia'},
      {nome: 'Banana', quantidade: 1, valor: 6, categoria: 'Hortifruti'},
      {nome: 'Tomate', quantidade: 1, valor: 8, categoria: 'Hortifruti'},
      {nome: 'Detergente', quantidade: 1, valor: 3, categoria: 'Limpeza'},
    ],
  },
  {
    id: 'churrasco',
    nome: 'Churrasco',
    itens: [
      {nome: 'Picanha', quantidade: 1, valor: 80, categoria: 'Carnes'},
      {nome: 'Linguiça', quantidade: 1, valor: 25, categoria: 'Carnes'},
      {nome: 'Carvão', quantidade: 1, valor: 15, categoria: 'Outros'},
      {nome: 'Cerveja', quantidade: 1, valor: 40, categoria: 'Bebidas'},
      {nome: 'Pão de alho', quantidade: 1, valor: 12, categoria: 'Padaria'},
      {nome: 'Vinagrete', quantidade: 1, valor: 8, categoria: 'Hortifruti'},
    ],
  },
  {
    id: 'feira',
    nome: 'Feira',
    itens: [
      {nome: 'Alface', quantidade: 1, valor: 4, categoria: 'Hortifruti'},
      {nome: 'Cenoura', quantidade: 1, valor: 5, categoria: 'Hortifruti'},
      {nome: 'Batata', quantidade: 1, valor: 8, categoria: 'Hortifruti'},
      {nome: 'Cebola', quantidade: 1, valor: 6, categoria: 'Hortifruti'},
      {nome: 'Maçã', quantidade: 1, valor: 10, categoria: 'Hortifruti'},
      {nome: 'Laranja', quantidade: 1, valor: 7, categoria: 'Hortifruti'},
    ],
  },
];
