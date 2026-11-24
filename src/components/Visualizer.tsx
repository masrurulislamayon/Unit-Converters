import type { Unit } from '../types';
import { sizeRatio } from '../lib/convert';

interface VisualizerProps {
  fromUnit: Unit;
  toUnit: Unit;
}

const MAX_DECADES = 8;
const STEP = 45 / MAX_DECADES;
const TICKS = Array.from({ length: MAX_DECADES * 2 + 1 }, (_, i) => i - MAX_DECADES);

const fmt = (n: number) => n.toLocaleString('en-US', { maximumSignificantDigits: 6 });

export function Visualizer({ fromUnit, toUnit }: VisualizerProps) {
  const same = fromUnit.raw_value === toUnit.raw_value;
  const ratio = sizeRatio(fromUnit, toUnit); // how many "to" units fit in one "from" unit
  const decades = same || ratio <= 0 ? 0 : Math.max(-MAX_DECADES, Math.min(MAX_DECADES, Math.log10(ratio)));

  // The larger unit sits to the right. Each decade is one step along the ruler.
  const fromPos = 50 + (decades / 2) * STEP;
  const toPos = 50 - (decades / 2) * STEP;
  const left = Math.min(fromPos, toPos);
  const width = Math.abs(fromPos - toPos);

  let summary: string;
  if (same) {
    summary = `Both units are the same size.`;
  } else if (ratio > 1) {
    summary = `One ${fromUnit.name} is ${fmt(ratio)} times the size of one ${toUnit.name}.`;
  } else if (ratio > 0) {
    summary = `One ${toUnit.name} is ${fmt(1 / ratio)} times the size of one ${fromUnit.name}.`;
  } else {
    summary = '';
  }

  return (
    <section className="card" aria-labelledby="scale-heading">
      <div className="card-head">
        <h2 className="card-title" id="scale-heading">Size comparison</h2>
        <p className="card-hint">Each tick is a factor of 10. The larger unit sits on the right.</p>
      </div>

      <div className="scale" role="img" aria-label={summary || 'Size comparison'}>
        <div className="scale-track">
          {TICKS.map((k) => (
            <span key={k} className={`scale-tick${k === 0 ? ' is-center' : ''}`} style={{ left: `${50 + k * STEP}%` }} />
          ))}
          <div className="scale-span" style={{ left: `${left}%`, width: `${width}%` }} />
          <div className="scale-dot scale-dot-from" style={{ left: `${fromPos}%` }} />
          <div className="scale-dot scale-dot-to" style={{ left: `${toPos}%` }} />
        </div>
        <div className="scale-legend">
          <span className="legend-item"><i className="swatch swatch-from" />{fromUnit.name}</span>
          <span className="legend-item"><i className="swatch swatch-to" />{toUnit.name}</span>
        </div>
      </div>

      {summary && <p className="scale-summary">{summary}</p>}
    </section>
  );
}
