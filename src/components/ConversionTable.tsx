import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import type { Unit } from '../types';
import { convertNumber, formatCompact } from '../lib/convert';

interface ConversionTableProps {
  categoryName: string;
  units: Unit[];
  fromUnit: Unit;
  toUnit: Unit;
  fromValue: string;
  onSelectToUnit: (unit: Unit) => void;
}

const COLLAPSED_COUNT = 8;

export function ConversionTable({ categoryName, units, fromUnit, toUnit, fromValue, onSelectToUnit }: ConversionTableProps) {
  const [expanded, setExpanded] = useState(false);
  const [filter, setFilter] = useState('');

  const parsed = fromValue === '' ? 1 : parseFloat(fromValue);
  const amount = Number.isNaN(parsed) ? null : parsed;

  const rows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return units
      .filter((u) => u.raw_value !== fromUnit.raw_value)
      .filter((u) => !q || u.name.toLowerCase().includes(q) || (u.symbol || '').toLowerCase().includes(q));
  }, [units, fromUnit, filter]);

  const visible = expanded ? rows : rows.slice(0, COLLAPSED_COUNT);
  const hiddenCount = rows.length - visible.length;

  return (
    <section className="card" aria-labelledby="table-heading">
      <div className="card-head">
        <h2 className="card-title" id="table-heading">
          {fromValue === '' ? '1' : fromValue} {fromUnit.name} in other units
        </h2>
        <p className="card-hint">Select a row to use it as the target unit.</p>
      </div>

      {expanded && (
        <div className="filter">
          <Search size={15} aria-hidden="true" />
          <input
            type="search"
            className="filter-input"
            placeholder={`Filter ${categoryName.toLowerCase()} units`}
            aria-label={`Filter ${categoryName} units`}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      )}

      {amount === null ? (
        <p className="card-empty">Finish typing a number to see it in other units.</p>
      ) : (
        <ul className={`conv-list${expanded ? ' is-expanded' : ''}`}>
          {visible.map((unit) => {
            const result = convertNumber(amount, fromUnit, unit);
            const isTarget = unit.raw_value === toUnit.raw_value;
            return (
              <li key={unit.raw_value}>
                <button
                  type="button"
                  className="conv-row"
                  aria-pressed={isTarget}
                  onClick={() => onSelectToUnit(unit)}
                >
                  <span className="conv-name">
                    {unit.name}
                    {unit.symbol && <span className="conv-symbol">{unit.symbol}</span>}
                  </span>
                  <span className="conv-value">{result === null ? '-' : formatCompact(result)}</span>
                </button>
              </li>
            );
          })}
          {visible.length === 0 && <li className="card-empty">No unit matches “{filter}”.</li>}
        </ul>
      )}

      {(hiddenCount > 0 || expanded) && rows.length > COLLAPSED_COUNT && (
        <button
          type="button"
          className="text-btn"
          onClick={() => {
            setExpanded((v) => !v);
            setFilter('');
          }}
        >
          {expanded ? 'Show fewer units' : `Show all ${rows.length} units`}
        </button>
      )}
    </section>
  );
}
