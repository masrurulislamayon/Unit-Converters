import { History as HistoryIcon, Trash2, X } from 'lucide-react';
import type { HistoryItem } from '../types';
import { timeAgo } from '../lib/convert';

interface HistoryProps {
  history: HistoryItem[];
  onRestore: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}

export function History({ history, onRestore, onDelete, onClear }: HistoryProps) {
  return (
    <section className="card" aria-labelledby="history-heading">
      <div className="card-head card-head-row">
        <h2 className="card-title" id="history-heading">Recent conversions</h2>
        {history.length > 0 && (
          <button type="button" className="text-btn text-btn-inline" onClick={onClear}>
            <Trash2 size={14} aria-hidden="true" />
            Clear all
          </button>
        )}
      </div>

      {history.length > 0 ? (
        <ul className="history-list">
          {history.map((item) => (
            <li key={item.id} className="history-item">
              <button
                type="button"
                className="history-main"
                onClick={() => onRestore(item)}
                aria-label={`Restore ${item.fromVal} ${item.fromUnitName} to ${item.toUnitName}`}
              >
                <span className="history-eq">
                  {item.fromVal} {item.fromSymbol || item.fromUnitName} = {item.toVal} {item.toSymbol || item.toUnitName}
                </span>
                <span className="history-meta">{item.categoryName}, {timeAgo(item.timestamp)}</span>
              </button>
              <button
                type="button"
                className="history-remove"
                onClick={() => onDelete(item.id)}
                aria-label={`Remove ${item.fromVal} ${item.fromUnitName} conversion`}
              >
                <X size={14} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="empty-note">
          <HistoryIcon size={26} aria-hidden="true" />
          <p>Conversions you pause on show up here, so you can pick them up again.</p>
        </div>
      )}
    </section>
  );
}
