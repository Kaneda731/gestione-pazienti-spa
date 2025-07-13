---
applyTo: "**/*.{js,jsx,scss,html}"
description: "Baseline Copilot instructions for Gestione Pazienti SPA"
---

# 🩺 Gestione Pazienti SPA · Copilot Instructions

These guidelines are automatically injected into every Copilot Chat request inside this repository.  
Keep each rule atomic. Feel free to split them into multiple `.instructions.md` files as the project grows.

## 1 · Project Snapshot
- **Type**: Single‑Page Application (SPA) for managing patients, diagnoses, discharges and clinical charts.
- **Target**: Desktop & mobile, keyboard‑only navigation and screen‑reader compliance.
- **Stack**: JavaScript (ES2022), SCSS modules, Vite, Vitest, Supabase, Netlify, SVG icon system.

## 2 · Folder Map
| Folder | Purpose |
| --- | --- |
| `app/` | Router, SPA bootstrap, global config |
| `core/` | Cross‑cutting services (auth, state, notifications, navigation) |
| `features/` | Feature modules: `patients`, `diagnosis`, `charts`, … |
| `shared/` | Reusable UI components & utilities |
| `css/` | Theming, layout and component SCSS |
| `views/` | HTML templates injected by the router |
| `tests/` | Unit & component tests |
| `scripts/find-dead-code.mjs` | CI helper that reports unused exports |

## 3 · Language & Build Rules
- Write **modern ECMAScript** (target `es2022`) and enable top‑level `use strict`.
- Use **named exports**; avoid default exports.
- Keep files ≤200 lines; functions ≤50 lines—refactor otherwise.
- Build with `vite build --emptyOutDir`; favour [`import.meta.env`] for config values.

## 4 · Architecture & Patterns
- Separate **business logic** (services in `core/` or feature module) from **presentation** (components in `shared/` or feature).
- Feature modules expose a public API via `/index.js` barrel.
- Router (`router.js`) uses **hash‑based** navigation and lazy‑loads views.
- All async calls funnel through `supabaseClient.js`; never call Supabase directly in components.

## 5 · Styling
- SCSS follows **BEM‑ish** naming: `.block__element--modifier`.
- Keep variables in `_tokens.scss`; no hard‑coded colours.
- Mobile‑first breakpoints: 0, 48rem, 64rem.
- Each component owns its stylesheet; import with `@use`.

## 6 · Accessibility & UX
- Use **semantic HTML** and WAI‑ARIA roles where needed.
- Components must pass `npm run test:axe` (axe‑core) with zero violations.
- Touch targets ≥44×44 px; support `prefers‑reduced‑motion`.

## 7 · Testing & Quality Gates
- Unit tests with **Vitest**; place next to source file as `*.test.js`.
- Aim for **90 % coverage** in `core/` and `features/`.
- Run `node scripts/find-dead-code.mjs` in pre‑push; fail if unused exports exist.
- Lint with ESLint + Prettier (`npm run lint:fix`).

## 8 · Commits & CI/CD
- Follow **Conventional Commits** (`feat:`, `fix:`, `chore:`…).
- Every push triggers Netlify preview; production deploy on `main`.
- Use pull requests; enable **Required Status Checks** for tests & lint.

## 9 · Security & Data
- Use Supabase Row Level Security (RLS); never expose service role keys client‑side.
- Sanitize all user input; validate on both client and Supabase edge functions.
- Do **not** log personal health data.

---
✏️ **Append new rules below this line.**

