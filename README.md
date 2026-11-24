# Universal Unit Converter

A fast, private, offline-first unit converter built with **React 19**, **TypeScript** and **Vite**. 60 categories, 1,416 units, no server needed.

## Features

- **60 categories, 1,416 units**: everyday units plus engineering, fluid, thermal and radiation categories.
- **Find anything with Ctrl/⌘ + K**: search every unit across every category, or type a request such as `5 kg to lb` or `100 celsius in fahrenheit` and jump straight to the result.
- **Keyboard-friendly unit pickers**: type to search, arrow keys to move, Enter to choose, Escape to close.
- **Quick-pick chips** for the most common units on both sides of the converter.
- **Decimal control** (Auto, 2, 4, 6, 8), remembered between visits.
- **Plain-language results**: a one-unit rate (`1 m = 3.28084 ft`) and a short explanation of the calculation.
- **Same value in other units**, with a filter for categories that have dozens of units.
- **Size comparison ruler** on a log scale, so mm vs km stays readable.
- **Recent conversions** and **pinned categories**, saved in `localStorage`.
- **Light and dark themes**, applied before first paint so there is no flash.
- **Responsive**: sidebar becomes a slide-in menu on phones; tap targets and number keypad are tuned for touch.
- **Accessible**: skip link, labelled controls, visible focus, live-region results, reduced-motion support.

## Design system

| Role | Choice |
|---|---|
| Ink | `#0E1A2B` (dark mode: `#EAF0FA`) |
| Tape yellow (result panel, highlights) | `#F7C41F` (dark mode: `#FFD43B`) |
| Focus / links | `#2748D9` (dark mode: `#8FABFF`) |
| Display and numerals | Bricolage Grotesque |
| Interface text | Instrument Sans (with Noto Sans Bengali fallback) |

All colours, radii and easing curves are CSS variables in `src/index.css`, organised with cascade layers (`reset`, `tokens`, `base`, `components`).

## Project structure

```
src/
├── components/
│   ├── Converter.tsx        # main converter panel
│   ├── UnitPicker.tsx       # accessible searchable combobox
│   ├── CommandPalette.tsx   # Ctrl/⌘ + K search and "5 kg to lb" parsing
│   ├── ConversionTable.tsx  # same value in other units
│   ├── Visualizer.tsx       # log-scale size comparison
│   ├── History.tsx
│   └── Sidebar.tsx
├── lib/convert.ts           # shared conversion, formatting and input helpers
├── types.ts
├── data/units.json
└── index.css
```

## Getting started

```bash
npm install
npm run dev      # start the dev server
npm run build    # type-check and build
npm run lint
```

> The Currency category uses fixed reference rates stored in `units.json`. A live-rate backend is planned.

## 🛠️ Technology Stack

- **Framework**: React 18+ (functional components with Hooks)
- **Language**: TypeScript (strict typing)
- **Bundler & Server**: Vite 8
- **Styling**: Vanilla CSS utilizing CSS Variables and CSS Cascade Layers (`@layer`) for clean component-level resets.
- **Icons**: Lucide React

## 📦 Project Structure

```
├── public/                 # Static assets & custom favicon
│   └── favicon.svg         # Custom branding favicon
├── src/
│   ├── components/         # Modular layout components
│   │   ├── Sidebar.tsx     # Categories list, pinning, search & themes
│   │   ├── Converter.tsx   # Core math, inputs, swaps & formula displays
│   │   ├── Visualizer.tsx  # Dynamic ratio bar chart comparison
│   │   ├── PopularList.tsx # Reference lists for other common units
│   │   └── History.tsx     # Local conversion logger
│   ├── data/
│   │   └── units.json      # Structured database of factors & offsets
│   ├── App.tsx             # Main state orchestrator
│   ├── index.css           # Global Cascade Layers, styles & fonts
│   └── main.tsx            # React application entry point
├── index.html              # HTML shell & metadata settings
├── package.json            # Configuration and script definitions
└── vite.config.ts          # Vite bundler configurations
```

## ⚙️ Local Development Setup

To run the application locally:

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd unit-converter
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the local development server**:
   ```bash
   npm run dev
   ```
   *The application will be running at `http://localhost:5173/`.*

4. **Build the production bundle**:
   ```bash
   npm run build
   ```
   *Optimized build files will be output to the `dist/` directory.*
# UnitConverters
