import { useMemo, useState } from 'react';
import {
  Activity, Coins, Compass, Database, Flame, Gauge, HelpCircle, Lightbulb, Magnet, Moon, Pin, Ruler,
  Scale, Search, Sun, Thermometer, Clock, X, Zap, AlertOctagon,
} from 'lucide-react';
import type { Category } from '../types';

interface SidebarProps {
  categories: Record<string, Category>;
  activeCategory: string;
  onSelect: (name: string) => void;
  favorites: string[];
  toggleFavorite: (name: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  open: boolean;
  onClose: () => void;
  onOpenPalette: () => void;
  shortcutLabel: string;
}

const POPULAR = ['Length', 'Weight and Mass', 'Volume', 'Temperature', 'Area', 'Time', 'Speed', 'Data Storage', 'Currency', 'Angle'];

function CategoryIcon({ name }: { name: string }) {
  const n = name.toLowerCase();
  const size = 18;
  if (n.includes('length')) return <Ruler size={size} aria-hidden="true" />;
  if (n.includes('weight') || n.includes('mass')) return <Scale size={size} aria-hidden="true" />;
  if (n.includes('temperature')) return <Thermometer size={size} aria-hidden="true" />;
  if (n.includes('time')) return <Clock size={size} aria-hidden="true" />;
  if (n.includes('currency')) return <Coins size={size} aria-hidden="true" />;
  if (n.includes('energy') || n.includes('power') || n.includes('force') || n.includes('current')) return <Zap size={size} aria-hidden="true" />;
  if (n.includes('speed') || n.includes('velocity')) return <Gauge size={size} aria-hidden="true" />;
  if (n.includes('area') || n.includes('volume') || n.includes('data storage')) return <Database size={size} aria-hidden="true" />;
  if (n.includes('angle')) return <Compass size={size} aria-hidden="true" />;
  if (n.includes('heat') || n.includes('thermal')) return <Flame size={size} aria-hidden="true" />;
  if (n.includes('illumination') || n.includes('light') || n.includes('luminance')) return <Lightbulb size={size} aria-hidden="true" />;
  if (n.includes('magnetic')) return <Magnet size={size} aria-hidden="true" />;
  if (n.includes('radiation')) return <AlertOctagon size={size} aria-hidden="true" />;
  return <Activity size={size} aria-hidden="true" />;
}

interface NavGroupProps {
  title: string;
  names: string[];
  active: string;
  pinned: string[];
  onSelect: (name: string) => void;
  toggleFavorite: (name: string) => void;
}

function NavGroup({ title, names, active, pinned, onSelect, toggleFavorite }: NavGroupProps) {
  if (names.length === 0) return null;
  return (
    <section className="nav-group" aria-label={title}>
      <h3 className="nav-group-title">{title}</h3>
      <ul className="nav-list">
        {names.map((name) => {
          const isPinned = pinned.includes(name);
          return (
            <li key={name} className="nav-item">
              <button
                type="button"
                className="nav-link"
                aria-current={active === name ? 'page' : undefined}
                onClick={() => onSelect(name)}
              >
                <CategoryIcon name={name} />
                <span className="nav-label">{name}</span>
              </button>
              <button
                type="button"
                className="nav-pin"
                aria-pressed={isPinned}
                aria-label={isPinned ? `Unpin ${name}` : `Pin ${name}`}
                title={isPinned ? 'Unpin' : 'Pin to top'}
                onClick={() => toggleFavorite(name)}
              >
                <Pin size={14} aria-hidden="true" fill={isPinned ? 'currentColor' : 'none'} />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function Sidebar({
  categories,
  activeCategory,
  onSelect,
  favorites,
  toggleFavorite,
  theme,
  toggleTheme,
  open,
  onClose,
  onOpenPalette,
  shortcutLabel,
}: SidebarProps) {
  const [query, setQuery] = useState('');

  const { pinnedList, popularList, otherList, total } = useMemo(() => {
    const q = query.toLowerCase().trim();
    const names = Object.keys(categories).filter((n) => !q || n.toLowerCase().includes(q));
    const pinned = names.filter((n) => favorites.includes(n));
    const rest = names.filter((n) => !favorites.includes(n));
    return {
      pinnedList: pinned,
      popularList: rest.filter((n) => POPULAR.includes(n)),
      otherList: rest.filter((n) => !POPULAR.includes(n)),
      total: names.length,
    };
  }, [categories, favorites, query]);

  return (
    <aside className={`sidebar${open ? ' is-open' : ''}`} id="sidebar" aria-label="Converter categories">
      <div className="sidebar-head">
        <div className="brand">
          <svg className="brand-mark" viewBox="0 0 40 40" aria-hidden="true">
            <rect width="40" height="40" rx="11" className="brand-mark-bg" />
            <path d="M9 27h22" className="brand-mark-line" />
            <path d="M12 27v-5M17 27v-8M22 27v-5M27 27v-8" className="brand-mark-ticks" />
            <path d="M12 14h16m0 0-3.5-3.5M28 14l-3.5 3.5" className="brand-mark-arrow" />
          </svg>
          <span className="brand-name">Unit Converters</span>
        </div>
        <div className="sidebar-actions">
          <button
            type="button"
            className="icon-btn"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            title={theme === 'dark' ? 'Light theme' : 'Dark theme'}
          >
            {theme === 'dark' ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
          </button>
          <button type="button" className="icon-btn drawer-close" onClick={onClose} aria-label="Close menu">
            <X size={18} aria-hidden="true" />
          </button>
        </div>
      </div>

      <button type="button" className="palette-trigger" onClick={onOpenPalette}>
        <Search size={16} aria-hidden="true" />
        <span className="palette-trigger-text">Search all units</span>
        <kbd className="kbd">{shortcutLabel}</kbd>
      </button>

      <div className="cat-search">
        <label htmlFor="cat-filter" className="visually-hidden">Filter categories</label>
        <input
          id="cat-filter"
          type="search"
          className="cat-search-input"
          placeholder="Filter categories"
          autoComplete="off"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <nav className="nav-scroll" aria-label="Categories">
        <NavGroup title="Pinned" names={pinnedList} active={activeCategory} pinned={favorites} onSelect={onSelect} toggleFavorite={toggleFavorite} />
        <NavGroup title="Popular" names={popularList} active={activeCategory} pinned={favorites} onSelect={onSelect} toggleFavorite={toggleFavorite} />
        <NavGroup title="Science and engineering" names={otherList} active={activeCategory} pinned={favorites} onSelect={onSelect} toggleFavorite={toggleFavorite} />

        {total === 0 && (
          <div className="empty-note">
            <HelpCircle size={28} aria-hidden="true" />
            <p>No category called “{query}”. Try the unit search above to look across every category.</p>
          </div>
        )}
      </nav>
    </aside>
  );
}
