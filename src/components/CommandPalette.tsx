import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { CornerDownLeft } from 'lucide-react';
import type { Category, Unit } from '../types';

export interface PaletteSelection {
  category: string;
  from?: Unit;
  to?: Unit;
  value?: string;
}

interface CommandPaletteProps {
  categories: Record<string, Category>;
  favorites: string[];
  onClose: () => void;
  onSelect: (selection: PaletteSelection) => void;
}

interface Entry {
  key: string;
  title: string;
  detail: string;
  badge?: string;
  kind: 'category' | 'unit' | 'conversion';
  selection: PaletteSelection;
}

const norm = (s: string) => s.toLowerCase().trim();

const COMMON_FIRST = ['Length', 'Weight and Mass', 'Volume', 'Temperature', 'Area', 'Time', 'Speed', 'Data Storage', 'Currency', 'Angle'];

function score(unit: Unit, q: string): number {
  const name = norm(unit.name);
  const symbol = norm(unit.symbol || '');
  if (name === q || symbol === q) return 0;
  if (name.startsWith(q) || symbol.startsWith(q)) return 1;
  if (name.includes(q) || symbol.includes(q)) return 2;
  return 3;
}

/** Understand queries such as "5 km to mi" or "celsius in fahrenheit". */
function parseConversion(query: string, categories: Record<string, Category>): Entry | null {
  const match = query.match(/^\s*(-?\d*\.?\d+)?\s*(.+?)\s+(?:to|in)\s+(.+?)\s*$/i);
  if (!match) return null;
  const [, value, aText, bText] = match;
  const a = norm(aText);
  const b = norm(bText);
  if (!a || !b) return null;

  const ordered = [
    ...COMMON_FIRST.filter((n) => categories[n]).map((n) => categories[n]),
    ...Object.values(categories).filter((c) => !COMMON_FIRST.includes(c.name)),
  ];

  for (const category of ordered) {
    const fromUnit = category.units.find((u) => score(u, a) === 0) ?? category.units.find((u) => score(u, a) === 1);
    if (!fromUnit) continue;
    const toUnit = category.units.find((u) => u.raw_value !== fromUnit.raw_value && score(u, b) === 0)
      ?? category.units.find((u) => u.raw_value !== fromUnit.raw_value && score(u, b) === 1);
    if (!toUnit) continue;

    return {
      key: `conv-${category.name}-${fromUnit.raw_value}-${toUnit.raw_value}`,
      title: `${value ? value + ' ' : ''}${fromUnit.name} to ${toUnit.name}`,
      detail: category.name,
      kind: 'conversion',
      selection: { category: category.name, from: fromUnit, to: toUnit, value },
    };
  }
  return null;
}

const KIND_LABEL: Record<Entry['kind'], string> = {
  conversion: 'Convert',
  category: 'Category',
  unit: 'Unit',
};

export function CommandPalette({ categories, favorites, onClose, onSelect }: CommandPaletteProps) {
  const uid = useId();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  // Flat index of every category and unit, built once
  const index = useMemo(() => {
    const units: { unit: Unit; category: string }[] = [];
    for (const category of Object.values(categories)) {
      for (const unit of category.units) units.push({ unit, category: category.name });
    }
    return units;
  }, [categories]);

  const entries: Entry[] = useMemo(() => {
    const q = norm(query);

    if (!q) {
      const names = Object.keys(categories);
      const ordered = [...names.filter((n) => favorites.includes(n)), ...names.filter((n) => !favorites.includes(n))];
      return ordered.slice(0, 12).map((name) => ({
        key: `cat-${name}`,
        title: name,
        detail: `${categories[name].units.length} units`,
        kind: 'category' as const,
        selection: { category: name },
      }));
    }

    const out: Entry[] = [];
    const conversion = parseConversion(query, categories);
    if (conversion) out.push(conversion);

    const catHits = Object.keys(categories)
      .filter((n) => norm(n).includes(q))
      .slice(0, 5)
      .map((name) => ({
        key: `cat-${name}`,
        title: name,
        detail: `${categories[name].units.length} units`,
        kind: 'category' as const,
        selection: { category: name },
      }));
    out.push(...catHits);

    const unitHits = index
      .map((item) => ({ ...item, s: score(item.unit, q) }))
      .filter((item) => item.s < 3)
      .sort((x, y) => x.s - y.s)
      .slice(0, 40)
      .map((item) => ({
        key: `unit-${item.unit.raw_value}`,
        title: item.unit.name,
        badge: item.unit.symbol || undefined,
        detail: item.category,
        kind: 'unit' as const,
        selection: { category: item.category, from: item.unit },
      }));
    out.push(...unitHits);

    return out;
  }, [query, categories, favorites, index]);

  // Keep the active row in view
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [active, entries]);

  // Lock page scroll and restore focus on close
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
      previous?.focus?.();
    };
  }, []);

  const pick = (entry: Entry | undefined) => {
    if (!entry) return;
    onSelect(entry.selection);
    onClose();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((i) => Math.min(entries.length - 1, i + 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      pick(entries[active]);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    } else if (event.key === 'Tab') {
      event.preventDefault(); // keep focus in the search field while the dialog is open
    }
  };

  return (
    <div className="palette-overlay" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="palette" role="dialog" aria-modal="true" aria-label="Find a unit or conversion" onKeyDown={onKeyDown}>
        <input
          className="palette-input"
          type="text"
          role="combobox"
          aria-expanded="true"
          aria-controls={`${uid}-list`}
          aria-activedescendant={entries[active] ? `${uid}-${active}` : undefined}
          placeholder="Search 1,416 units, or type “5 km to mi”"
          autoComplete="off"
          spellCheck={false}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          autoFocus
        />

        <ul className="palette-list" id={`${uid}-list`} role="listbox" ref={listRef} aria-label="Results">
          {entries.map((entry, i) => (
            <li
              key={entry.key}
              id={`${uid}-${i}`}
              role="option"
              aria-selected={i === active}
              data-active={i === active}
              data-kind={entry.kind}
              className="palette-item"
              onPointerMove={() => setActive(i)}
              onClick={() => pick(entry)}
            >
              <span className="palette-item-title">{entry.title}</span>
              {entry.badge && <span className="palette-item-badge">{entry.badge}</span>}
              <span className="palette-item-detail">{entry.detail}</span>
              <span className="palette-item-kind">{KIND_LABEL[entry.kind]}</span>
            </li>
          ))}
          {entries.length === 0 && (
            <li className="palette-empty">Nothing matches “{query}”. Try a unit name or symbol, like “kg” or “hectare”.</li>
          )}
        </ul>

        <div className="palette-foot" aria-hidden="true">
          <span><kbd className="kbd">↑</kbd> <kbd className="kbd">↓</kbd> to move</span>
          <span><kbd className="kbd"><CornerDownLeft size={11} /></kbd> to open</span>
          <span><kbd className="kbd">Esc</kbd> to close</span>
        </div>
      </div>
    </div>
  );
}
