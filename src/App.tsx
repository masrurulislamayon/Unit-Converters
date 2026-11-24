import { useCallback, useEffect, useState } from 'react';
import { Menu, Search } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { Converter } from './components/Converter';
import { Visualizer } from './components/Visualizer';
import { ConversionTable } from './components/ConversionTable';
import { History } from './components/History';
import { CommandPalette } from './components/CommandPalette';
import type { PaletteSelection } from './components/CommandPalette';
import type { Category, HistoryItem, Unit } from './types';
import unitsDataRaw from './data/units.json';

const unitsData = unitsDataRaw as unknown as Record<string, Category>;

const DEFAULT_FAVORITES = ['Length', 'Weight and Mass', 'Temperature', 'Time', 'Currency'];
const IS_APPLE = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent);
const SHORTCUT_LABEL = IS_APPLE ? '⌘K' : 'Ctrl K';

function readJSON<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable or full */
  }
}

function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 11);
}

function otherUnit(units: Unit[], not: Unit): Unit {
  return units.find((u) => u.raw_value !== not.raw_value) ?? not;
}

export default function App() {
  const [activeCategory, setActiveCategory] = useState<string>('Length');
  const [fromUnit, setFromUnit] = useState<Unit>(unitsData['Length'].units[0]);
  const [toUnit, setToUnit] = useState<Unit>(unitsData['Length'].units[3] ?? unitsData['Length'].units[0]);
  const [fromValue, setFromValue] = useState<string>('1');

  const [favorites, setFavorites] = useState<string[]>(() => readJSON('unit_converter_favorites', DEFAULT_FAVORITES));
  const [history, setHistory] = useState<HistoryItem[]>(() => readJSON('unit_converter_history', []));

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('unit_converter_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      /* ignore */
    }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [menuOpen, setMenuOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('unit_converter_theme', theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  useEffect(() => writeJSON('unit_converter_favorites', favorites), [favorites]);
  useEffect(() => writeJSON('unit_converter_history', history), [history]);

  useEffect(() => {
    document.title = `${activeCategory} converter | Unit Converters`;
  }, [activeCategory]);

  // Global shortcuts: Ctrl/⌘ + K opens search, Escape closes the mobile menu
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      } else if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const toggleFavorite = (name: string) => {
    setFavorites((prev) => (prev.includes(name) ? prev.filter((f) => f !== name) : [...prev, name]));
  };

  const handleSelectCategory = (name: string) => {
    const cat = unitsData[name];
    if (!cat || cat.units.length === 0) return;
    setActiveCategory(name);
    setFromUnit(cat.units[0]);
    setToUnit(cat.units[1] ?? cat.units[0]);
    setFromValue('1');
    setMenuOpen(false);
  };

  const handlePaletteSelect = (selection: PaletteSelection) => {
    const cat = unitsData[selection.category];
    if (!cat) return;
    const from = selection.from ?? cat.units[0];
    const to = selection.to ?? (selection.from ? otherUnit(cat.units, from) : (cat.units[1] ?? cat.units[0]));
    setActiveCategory(cat.name);
    setFromUnit(from);
    setToUnit(to);
    setFromValue(selection.value ?? '1');
    setMenuOpen(false);
    document.getElementById('converter')?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  };

  const handleAddHistory = useCallback((item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    setHistory((prev) => {
      const rest = prev.filter(
        (h) => !(h.fromUnitName === item.fromUnitName && h.toUnitName === item.toUnitName && h.fromVal === item.fromVal),
      );
      return [{ ...item, id: newId(), timestamp: Date.now() }, ...rest].slice(0, 10);
    });
  }, []);

  const handleRestoreHistory = (item: HistoryItem) => {
    const cat = unitsData[item.categoryName];
    if (!cat) return;
    const from = cat.units.find((u) => u.name === item.fromUnitName);
    const to = cat.units.find((u) => u.name === item.toUnitName);
    if (!from || !to) return;
    setActiveCategory(item.categoryName);
    setFromUnit(from);
    setToUnit(to);
    setFromValue(item.fromVal);
    document.getElementById('converter')?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  };

  const category = unitsData[activeCategory];

  return (
    <div className="app-shell">
      <a className="skip-link" href="#converter">Skip to the converter</a>

      <header className="topbar">
        <button
          type="button"
          className="icon-btn"
          onClick={() => setMenuOpen(true)}
          aria-label="Open categories menu"
          aria-expanded={menuOpen}
          aria-controls="sidebar"
        >
          <Menu size={20} aria-hidden="true" />
        </button>
        <span className="topbar-title">{activeCategory}</span>
        <button type="button" className="icon-btn" onClick={() => setPaletteOpen(true)} aria-label="Find any unit or conversion">
          <Search size={20} aria-hidden="true" />
        </button>
      </header>

      {menuOpen && <div className="backdrop" onClick={() => setMenuOpen(false)} aria-hidden="true" />}

      <Sidebar
        categories={unitsData}
        activeCategory={activeCategory}
        onSelect={handleSelectCategory}
        favorites={favorites}
        toggleFavorite={toggleFavorite}
        theme={theme}
        toggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onOpenPalette={() => {
          setMenuOpen(false);
          setPaletteOpen(true);
        }}
        shortcutLabel={SHORTCUT_LABEL}
      />

      <main className="main" id="main">
        <div className="page-head">
          <h1 className="page-title">{activeCategory}</h1>
          <p className="page-meta">
            {category.units.length} units. Everything runs in your browser, so it works offline.
          </p>
        </div>

        {activeCategory === 'Currency' && (
          <p className="notice" role="note">
            These are fixed reference rates built into the app, so they can be out of date. Check a live source before you pay or trade.
          </p>
        )}

        <Converter
          category={category}
          fromUnit={fromUnit}
          toUnit={toUnit}
          setFromUnit={setFromUnit}
          setToUnit={setToUnit}
          fromValue={fromValue}
          setFromValue={setFromValue}
          onAddHistory={handleAddHistory}
        />

        <div className="lower-grid">
          <ConversionTable
            categoryName={category.name}
            units={category.units}
            fromUnit={fromUnit}
            toUnit={toUnit}
            fromValue={fromValue}
            onSelectToUnit={setToUnit}
          />
          <div className="lower-stack">
            <Visualizer fromUnit={fromUnit} toUnit={toUnit} />
            <History
              history={history}
              onRestore={handleRestoreHistory}
              onDelete={(id) => setHistory((prev) => prev.filter((h) => h.id !== id))}
              onClear={() => setHistory([])}
            />
          </div>
        </div>

        <footer className="footer">
          <p>Conversions are calculated on your device. Nothing you type is sent anywhere.</p>
        </footer>
      </main>

      {paletteOpen && (
        <CommandPalette
          categories={unitsData}
          favorites={favorites}
          onClose={() => setPaletteOpen(false)}
          onSelect={handlePaletteSelect}
        />
      )}
    </div>
  );
}
