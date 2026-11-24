import type { Precision, Unit } from '../types';

/** Convert a number between two units of the same category. Returns null if the pair is unsupported. */
export function convertNumber(value: number, from: Unit, to: Unit): number | null {
  if (from.type === 1 && to.type === 1) {
    const f = from.params.factor;
    const t = to.params.factor;
    if (!f || !t) return null;
    return value * (t / f);
  }

  if (from.type === 2 && to.type === 2) {
    const { a: aFrom, b: bFrom } = from.params;
    const { a: aTo, b: bTo } = to.params;
    if (aFrom === undefined || bFrom === undefined || aTo === undefined || bTo === undefined) return null;
    const sFrom = aFrom - bFrom;
    const sTo = aTo - bTo;
    if (sFrom === 0) return null;
    const kelvin = (value - bFrom) / sFrom;
    return kelvin * sTo + bTo;
  }

  return null;
}

/** Size ratio of one `from` unit expressed in `to` units (used by the scale ruler). */
export function sizeRatio(from: Unit, to: Unit): number {
  if (from.type === 1 && to.type === 1 && from.params.factor && to.params.factor) {
    return to.params.factor / from.params.factor;
  }
  if (from.type === 2 && to.type === 2) {
    const { a: aF, b: bF } = from.params;
    const { a: aT, b: bT } = to.params;
    if (aF !== undefined && bF !== undefined && aT !== undefined && bT !== undefined && aF - bF !== 0) {
      return (aT - bT) / (aF - bF);
    }
  }
  return 1;
}

/** Format a result for display. `auto` keeps up to 8 decimals and strips trailing zeros. */
export function formatNumber(num: number, precision: Precision = 'auto'): string {
  if (!Number.isFinite(num)) return 'Error';
  if (num === 0) return '0';

  const abs = Math.abs(num);

  if (precision === 'auto') {
    if (abs < 1e-6 || abs > 1e12) return num.toExponential(6);
    return parseFloat(num.toFixed(8)).toString();
  }

  if (abs > 1e12 || abs < 10 ** -precision) return num.toExponential(precision);
  return num.toFixed(precision);
}

/** Compact display for rows and chips: grouped digits, fewer decimals. */
export function formatCompact(num: number): string {
  if (!Number.isFinite(num)) return '-';
  if (num === 0) return '0';
  const abs = Math.abs(num);
  if (abs < 1e-5 || abs >= 1e10) return num.toExponential(4);
  return Number(num.toPrecision(8)).toLocaleString('en-US', { maximumFractionDigits: 6 });
}

/** Short, readable label: symbol when it is compact, otherwise the name. */
export function shortLabel(unit: Unit): string {
  const { symbol, name } = unit;
  if (symbol && symbol.length <= 6) return symbol;
  if (name.length <= 6) return name;
  return symbol || name;
}

/** Plain-language description of how the conversion is calculated. */
export function describeFormula(from: Unit, to: Unit): string {
  if (from.type === 1 && to.type === 1 && from.params.factor && to.params.factor) {
    const multiplier = to.params.factor / from.params.factor;
    const shown = multiplier.toLocaleString('en-US', { maximumSignificantDigits: 10 });
    return `Multiply the ${from.name} value by ${shown}.`;
  }

  if (from.type === 2 && to.type === 2) {
    const f = from.name.toLowerCase();
    const t = to.name.toLowerCase();
    if (f.includes('celsius') && t.includes('fahrenheit')) return 'Multiply by 1.8, then add 32.';
    if (f.includes('fahrenheit') && t.includes('celsius')) return 'Subtract 32, then divide by 1.8.';
    if (f.includes('celsius') && t.includes('kelvin')) return 'Add 273.15.';
    if (f.includes('kelvin') && t.includes('celsius')) return 'Subtract 273.15.';
    if (f.includes('fahrenheit') && t.includes('kelvin')) return 'Subtract 32, multiply by 5/9, then add 273.15.';
    if (f.includes('kelvin') && t.includes('fahrenheit')) return 'Subtract 273.15, multiply by 1.8, then add 32.';
    return 'Convert to kelvin first, then to the target scale.';
  }

  return '';
}

/** Accept only characters that can form a decimal number (digits, one dot, leading minus, optional exponent). */
export function sanitizeNumberInput(raw: string): string | null {
  const value = raw.replace(/,/g, '.').replace(/\s+/g, '');
  return /^-?\d*\.?\d*(e[+-]?\d*)?$/i.test(value) ? value : null;
}

/** Relative time such as "just now" or "5 min ago". */
export function timeAgo(timestamp: number, now: number = Date.now()): string {
  const seconds = Math.max(0, Math.round((now - timestamp) / 1000));
  if (seconds < 45) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  return `${days} d ago`;
}
