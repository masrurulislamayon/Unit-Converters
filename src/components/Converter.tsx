import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { ArrowLeftRight, Check, Copy } from 'lucide-react';
import { UnitPicker } from './UnitPicker';
import type { Category, Precision, Unit } from '../types';
import { convertNumber, describeFormula, formatNumber, sanitizeNumberInput, shortLabel } from '../lib/convert';

interface ConverterProps {
  category: Category;
  fromUnit: Unit;
  toUnit: Unit;
  setFromUnit: (unit: Unit) => void;
  setToUnit: (unit: Unit) => void;
  fromValue: string;
  setFromValue: (val: string) => void;
  onAddHistory: (item: {
    fromVal: string;
    fromSymbol: string;
    fromUnitName: string;
    toVal: string;
    toSymbol: string;
    toUnitName: string;
    categoryName: string;
  }) => void;
}

type Outcome =
  | { state: 'empty' }
  | { state: 'incomplete' }
  | { state: 'error' }
  | { state: 'ok'; text: string; raw: number };

const PRECISIONS: { value: Precision; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: 2, label: '2' },
  { value: 4, label: '4' },
  { value: 6, label: '6' },
  { value: 8, label: '8' },
];

function loadPrecision(): Precision {
  try {
    const saved = localStorage.getItem('unit_converter_precision');
    if (saved === 'auto') return 'auto';
    const n = Number(saved);
    if (n === 2 || n === 4 || n === 6 || n === 8) return n;
  } catch {
    /* storage unavailable */
  }
  return 'auto';
}

interface QuickChipsProps {
  units: Unit[];
  selected: Unit;
  onSelect: (unit: Unit) => void;
  label: string;
}

function QuickChips({ units, selected, onSelect, label }: QuickChipsProps) {
  const chips = useMemo(() => {
    const first = units.slice(0, 5);
    return first.some((u) => u.raw_value === selected.raw_value) ? first : [selected, ...first.slice(0, 4)];
  }, [units, selected]);

  return (
    <div className="chips" role="group" aria-label={label}>
      {chips.map((unit) => (
        <button
          key={unit.raw_value}
          type="button"
          className="chip"
          aria-pressed={unit.raw_value === selected.raw_value}
          title={unit.name}
          onClick={() => onSelect(unit)}
        >
          {shortLabel(unit)}
        </button>
      ))}
    </div>
  );
}

export function Converter({
  category,
  fromUnit,
  toUnit,
  setFromUnit,
  setToUnit,
  fromValue,
  setFromValue,
  onAddHistory,
}: ConverterProps) {
  const [copied, setCopied] = useState(false);
  const [swapTurns, setSwapTurns] = useState(0);
  const [precision, setPrecision] = useState<Precision>(loadPrecision);
  const loggedRef = useRef<string>('');

  useEffect(() => {
    try {
      localStorage.setItem('unit_converter_precision', String(precision));
    } catch {
      /* storage unavailable */
    }
  }, [precision]);

  const outcome = useMemo<Outcome>(() => {
    if (fromValue === '') return { state: 'empty' };
    const value = parseFloat(fromValue);
    if (Number.isNaN(value)) return { state: 'incomplete' };
    const result = convertNumber(value, fromUnit, toUnit);
    if (result === null || !Number.isFinite(result)) return { state: 'error' };
    return { state: 'ok', text: formatNumber(result, precision), raw: result };
  }, [fromValue, fromUnit, toUnit, precision]);

  const resultText = outcome.state === 'ok' ? outcome.text : '';

  // Log to history once the person stops typing for 1.5 s
  useEffect(() => {
    if (outcome.state !== 'ok') return;
    const signature = `${fromValue}|${fromUnit.raw_value}|${toUnit.raw_value}`;
    if (loggedRef.current === signature) return;

    const timer = setTimeout(() => {
      onAddHistory({
        fromVal: fromValue,
        fromSymbol: fromUnit.symbol || '',
        fromUnitName: fromUnit.name,
        toVal: outcome.text,
        toSymbol: toUnit.symbol || '',
        toUnitName: toUnit.name,
        categoryName: category.name,
      });
      loggedRef.current = signature;
    }, 1500);

    return () => clearTimeout(timer);
  }, [outcome, fromValue, fromUnit, toUnit, category.name, onAddHistory]);

  const handleSwap = () => {
    setSwapTurns((n) => n + 1);
    const previousFrom = fromUnit;
    setFromUnit(toUnit);
    setToUnit(previousFrom);
    if (outcome.state === 'ok') setFromValue(outcome.text);
  };

  const handleCopy = async () => {
    if (!resultText) return;
    try {
      await navigator.clipboard.writeText(resultText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked: the result stays visible and selectable */
    }
  };

  const oneUnit = useMemo(() => {
    const r = convertNumber(1, fromUnit, toUnit);
    return r === null ? '' : `1 ${shortLabel(fromUnit)} = ${formatNumber(r, 'auto')} ${shortLabel(toUnit)}`;
  }, [fromUnit, toUnit]);

  const formula = describeFormula(fromUnit, toUnit);

  const status =
    outcome.state === 'empty'
      ? 'Enter a number to see the result.'
      : outcome.state === 'incomplete'
        ? 'Keep typing: that is not a complete number yet.'
        : outcome.state === 'error'
          ? 'These two units cannot be converted.'
          : '';

  const longResult = resultText.length > 12;
  const veryLongResult = resultText.length > 18;

  return (
    <section className="converter" aria-labelledby="converter-heading" id="converter">
      <h2 id="converter-heading" className="visually-hidden">Convert {category.name}</h2>

      <div className="converter-grid">
        {/* From */}
        <div className="panel panel-from">
          <UnitPicker label="From" units={category.units} selected={fromUnit} onSelect={setFromUnit} />
          <input
            type="text"
            inputMode="decimal"
            className="value-input"
            aria-label={`Value in ${fromUnit.name}`}
            value={fromValue}
            placeholder="0"
            autoComplete="off"
            spellCheck={false}
            onChange={(e) => {
              const next = sanitizeNumberInput(e.target.value);
              if (next !== null) setFromValue(next);
            }}
            onFocus={(e) => e.currentTarget.select()}
          />
          <QuickChips units={category.units} selected={fromUnit} onSelect={setFromUnit} label="Quick pick, from unit" />
        </div>

        <button
          type="button"
          className="swap"
          onClick={handleSwap}
          aria-label="Swap the two units"
          title="Swap units"
          style={{ '--turns': swapTurns } as CSSProperties}
        >
          <ArrowLeftRight size={20} aria-hidden="true" />
        </button>

        {/* To */}
        <div className="panel panel-to">
          <UnitPicker label="To" units={category.units} selected={toUnit} onSelect={setToUnit} />
          <div className="result">
            <output
              className={`result-value${longResult ? ' is-long' : ''}${veryLongResult ? ' is-very-long' : ''}${resultText ? '' : ' is-empty'}`}
              aria-live="polite"
              aria-atomic="true"
              aria-label={`Result in ${toUnit.name}`}
            >
              <span key={resultText} className="result-digits">{resultText || '0'}</span>
            </output>
            <button
              type="button"
              className="copy-btn"
              onClick={handleCopy}
              disabled={!resultText}
              aria-label={copied ? 'Result copied' : 'Copy result'}
            >
              {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <QuickChips units={category.units} selected={toUnit} onSelect={setToUnit} label="Quick pick, to unit" />
        </div>
      </div>

      <div className="converter-foot">
        <div className="converter-explain">
          {status ? (
            <p className="status-line">{status}</p>
          ) : (
            <>
              {oneUnit && <p className="rate-line">{oneUnit}</p>}
              {formula && <p className="formula-line">{formula}</p>}
            </>
          )}
        </div>

        <div className="precision" role="group" aria-label="Decimal places">
          <span className="precision-label">Decimals</span>
          <div className="segmented">
            {PRECISIONS.map((p) => (
              <button
                key={String(p.value)}
                type="button"
                className="segment"
                aria-pressed={precision === p.value}
                onClick={() => setPrecision(p.value)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="ruler" aria-hidden="true" />
    </section>
  );
}
