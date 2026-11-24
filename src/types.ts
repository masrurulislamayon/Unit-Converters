export interface UnitParams {
  /** Type 1: multiplier relative to the category's base unit */
  factor?: number;
  /** Type 2: offset-scale parameters (temperature) */
  a?: number;
  b?: number;
}

export interface Unit {
  name: string;
  symbol: string;
  raw_value: string;
  type: number;
  params: UnitParams;
}

export interface Category {
  name: string;
  units: Unit[];
}

export interface HistoryItem {
  id: string;
  fromVal: string;
  fromSymbol: string;
  fromUnitName: string;
  toVal: string;
  toSymbol: string;
  toUnitName: string;
  categoryName: string;
  timestamp: number;
}

export type Precision = 'auto' | 2 | 4 | 6 | 8;
