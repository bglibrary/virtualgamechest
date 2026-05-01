# Game Chest — Digital Game Box (Malle de Jeu Numérique)

Game Chest is a **Digital Game Box**: a web application that lets users create and play with board game material on a virtual table. It models **what you can physically do** with components — shuffle, flip, move, draw, deal — not game rules. The players enforce the rules, just like around a real table.

> **The box analogy:** When you buy a board game, the box holds components and a rulebook. The box doesn't enforce the rules — the players do. Game Chest is the box.

## Core Philosophy

| Principle | Description |
|---|---|
| **Material, not logic** | Objects and physical capabilities, not game rules |
| **Declarative, not imperative** | Games are JSON data — no scripts, no code |
| **Zero backend** | Static SPA, no server, no database for game state |
| **Open & extensible** | Anyone can create game material by writing a JSON file |
| **Physical-table metaphor** | The play area is a virtual table with permissive interactions |

## V1 Scope

- **Object types:** Cards and Decks
- **Capabilities:** `shufflable`, `drawable`, `flippable`, `moveable`, `dealable`, `sortable`
- **Smart interactions:** Snap-to-card stacking, cascade offset, stack-grab drag, snap-to-zone
- **Modes:** Play Mode, Creation Mode, Home Screen
- **Validation scenario:** Solitaire Klondike (full physical interaction support)
- **Device:** Single device only (P2P architecture-ready for post-MVP)

## Tech Stack

| Layer | Technology |
|---|---|
| Language | TypeScript (strict) |
| Framework | React 19 |
| State | Zustand 5.x |
| Rendering | HTML Canvas via react-konva |
| UI Animation | Framer Motion 11.x |
| Styling | Tailwind CSS 4.x |
| Validation | Zod 3.x |
| Build | Vite 6.x |
| Test (unit) | Vitest |
| Test (component) | React Testing Library |
| Test (E2E) | Playwright |
| Lint / Format | ESLint 9.x / Prettier 3.x |

## Getting Started

```bash
npm install
npm run dev
```

## Project Structure

```
├── docs/           # Vision, specs, context documents
│   ├── context/    # Vision, conceptual model
│   └── specs/      # Detailed implementation specs
├── games/          # Game definition JSON files
├── public/         # Static assets (game images, etc.)
└── src/            # Application source code
```

## Documentation

- **Vision:** `docs/context/01-vision.md`
- **Conceptual Model:** `docs/context/02-conceptual-model.md`
- **Tech Stack:** `docs/specs/tech-stack.md`
- **V1 Scope:** `docs/specs/scope-v1.md`
- **Philosophy:** `docs/specs/philosophy-scope.md`
- **Data Model:** `docs/specs/data-model.md`

## License

Private project — all rights reserved.
