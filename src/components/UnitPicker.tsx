import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { Unit } from '../types';

interface UnitPickerProps {
  label: string;
  units: Unit[];
  selected: Unit;
  onSelect: (unit: Unit) => void;
}

function rank(unit: Unit, q: string): number {
  const name = unit.name.toLowerCase();
  const symbol = (unit.symbol || '').toLowerCase();
  if (name === q || symbol === q) return 0;
  if (name.startsWith(q) || symbol.startsWith(q)) return 1;
  if (name.includes(q) || symbol.includes(q)) return 2;
  return 3;
}

export function UnitPicker({ label, units, selected, onSelect }: UnitPickerProps) {
  const uid = useId();
  const listId = `${uid}-list`;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return units;
    return units
      .map((unit) => ({ unit, score: rank(unit, q) }))
      .filter((r) => r.score < 3)
      .sort((a, b) => a.score - b.score)
      .map((r) => r.unit);
  }, [units, query]);

  // Close when clicking outside
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  // Keep the highlighted option visible
  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLElement>('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [active, open, results]);

  const openPicker = () => {
    setQuery('');
    const idx = units.findIndex((u) => u.raw_value === selected.raw_value);
    setActive(Math.max(0, idx));
    setOpen(true);
  };

  const choose = (unit: Unit) => {
    onSelect(unit);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const onSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((i) => Math.min(results.length - 1, i + 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (event.key === 'Home') {
      event.preventDefault();
      setActive(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      setActive(Math.max(0, results.length - 1));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (results[active]) choose(results[active]);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      triggerRef.current?.focus();
    } else if (event.key === 'Tab') {
      setOpen(false);
    }
  };

  return (
    <div className="picker" ref={rootRef}>
      <span className="field-label" id={`${uid}-label`}>{label}</span>
      <button
        ref={triggerRef}
        type="button"
        className="picker-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${uid}-label ${uid}-value`}
        onClick={() => (open ? setOpen(false) : openPicker())}
      >
        <span className="picker-value" id={`${uid}-value`}>
          <span className="picker-name">{selected.name}</span>
          {selected.symbol && <span className="picker-symbol">{selected.symbol}</span>}
        </span>
        <svg className="picker-caret" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
          <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="picker-pop">
          <input
            type="text"
            className="picker-search"
            placeholder={`Search ${units.length} units`}
            aria-label={`Search units for ${label}`}
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={results[active] ? `${uid}-opt-${active}` : undefined}
            autoComplete="off"
            spellCheck={false}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onSearchKeyDown}
            autoFocus
          />
          <ul className="picker-list" id={listId} role="listbox" ref={listRef} aria-label={`${label} units`}>
            {results.map((unit, i) => (
              <li
                key={unit.raw_value}
                id={`${uid}-opt-${i}`}
                role="option"
                aria-selected={unit.raw_value === selected.raw_value}
                data-active={i === active}
                className="picker-option"
                onPointerMove={() => setActive(i)}
                onClick={() => choose(unit)}
              >
                <span className="picker-option-name">{unit.name}</span>
                {unit.symbol && <span className="picker-option-symbol">{unit.symbol}</span>}
              </li>
            ))}
            {results.length === 0 && <li className="picker-empty">No unit matches “{query}”. Try a symbol such as km or lb.</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
