import {PriceHistory} from './PriceHistory';

export interface MonthlySpending {
  monthKey: string;
  label: string;
  total: number;
  listCount: number;
}

export interface TopPurchasedItem {
  nome: string;
  marca?: string;
  count: number;
  totalSpent: number;
  lastPrice: number;
}

export interface PriceEvolution {
  nome: string;
  marca?: string;
  firstPrice: number;
  lastPrice: number;
  changePct: number;
  history: PriceHistory[];
}
