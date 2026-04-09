# Smart AI Painter

> **Sketch first. Let AI finish it.**
> A workspace-first sketch editor that turns rough drawings into polished AI artwork without ever leaving the canvas.

**Live demo:** _Add your deployment URL here_ (e.g. `https://smart-ai-painter.vercel.app`)

---

## Features

- **Full-width drawing workspace** — Photoshop-style left dock, page-size presets, zoom, undo/redo
- **Brush, eraser, shapes, and selection tools** with keyboard shortcuts
- **AI generation drawer** that opens on-demand so the canvas never loses real estate
- **Prompt history** — your last 10 prompts saved to localStorage for one-click reuse
- **Style presets and sketch-strength control**
- **Supabase auth** (email magic-link) with personal sketch and generation gallery
- **Shareable generation links** (`/g/[id]`) with rich Open Graph previews
- **Mobile responsive** with a tab-based sketch/result layout for small screens
- **Dark mode** with system-preference following
- **Onboarding hint** for first-time visitors (dismiss persists across sessions)
- **Reduced motion** respected for accessibility

## Architecture

```text
┌──────────────────┐         ┌────────────────────┐         ┌───────────────────┐
│   Next.js 14     │         │     FastAPI        │         │     Supabase      │
│  (App Router)    │─REST───▶│   (Python 3.12)    │─SDK────▶│  Auth, DB, Files  │
│                  │         │                    │         │                   │
│  - Fabric.js     │         │  - Image processor │         └───────────────────┘
│  - Zustand store │         │  - AI provider     │                  ▲
│  - TanStack Q.   │         │  - Storage svc     │                  │
│  - Tailwind CSS  │         │                    │                  │
└──────────────────┘         └────────┬───────────┘                  │
        ▲                             │                              │
        │                             ▼                              │
        │                    ┌────────────────────┐                  │
        │                    │   AI Provider      │──────────────────┘
        │                    │ (Replicate / SDK)  │
        │                    └────────────────────┘
        │
        └── Browser canvas (Fabric.js) — strokes serialized via toDataURL,
            posted to FastAPI, returned as base64 PNG, optionally persisted
            to Supabase storage if the user is signed in.
```

### Request flow

1. **User draws** on the Fabric.js canvas (history pushed to Zustand on each stroke).
2. **Generate** opens the result drawer; canvas is exported to base64 PNG.
3. **POST `/api/v1/generate`** sends `{sketch_base64, prompt, style, strength, page_*}` to FastAPI.
4. **Backend** normalises the sketch (`Pillow`), calls the active AI provider, and returns the generated PNG.
5. If the user is **authenticated**, the result is uploaded to Supabase Storage and a row is written to the `generations` table.
6. **Shareable URL** `/g/{id}` is a server-rendered page that fetches metadata from `/api/v1/gallery/public/{id}` and emits Open Graph + Twitter card tags.

## Screenshots

> Add screenshots once a deployment is live.
> Suggested: `docs/screenshots/canvas-light.png`, `docs/screenshots/canvas-dark.png`, `docs/screenshots/result-drawer.png`, `docs/screenshots/mobile-tabs.png`.

## Repository layout

This is a monorepo organised as:

- [`frontend/`](frontend/) — Next.js 14 (App Router) app
- [`backend/`](backend/) — FastAPI service
- [`infra/`](infra/) — Docker, Nginx, and deployment scripts
- [`supabase/`](supabase/) — SQL migrations and RLS policies
- [`.github/workflows/`](.github/workflows/) — CI (lint, type-check, e2e, Lighthouse) and deploy

```text
smart-ai-painter/
├── frontend/
├── backend/
├── infra/
├── supabase/
└── .github/
```

## Tech Stack

| Layer       | Tools                                                                          |
| ----------- | ------------------------------------------------------------------------------ |
| Frontend    | Next.js 14, TypeScript, Tailwind CSS, Fabric.js, TanStack Query, Zustand, Zod  |
| Backend     | Python 3.12, FastAPI, Uvicorn, Pillow, httpx, pydantic                         |
| Platform    | Supabase (Auth + Postgres + Storage), Docker, Nginx, DigitalOcean              |
| Quality     | ESLint, Prettier, Husky + lint-staged, Pytest, Playwright, Lighthouse CI       |
| CI/CD       | GitHub Actions                                                                 |

## Getting started (local development)

### Prerequisites

- Node.js 20+
- Python 3.12+
- Supabase project (free tier is fine)

### Frontend

```bash
cd frontend
cp .env.local.example .env.local   # fill in NEXT_PUBLIC_* values
npm install
npm run dev
```

The app starts on `http://localhost:3000`.

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt
cp .env.example .env                # fill in Supabase + AI provider keys
uvicorn app.main:app --reload
```

The API starts on `http://localhost:8000`.

### Quality checks

```bash
# Frontend
cd frontend
npm run lint
npm run type-check
npm run test:e2e            # Playwright (full generate flow)
npm run lighthouse          # Lighthouse CI (perf/a11y/seo budget)

# Backend
cd backend
pytest tests/ -v
```

## Keyboard shortcuts

| Shortcut                 | Action                |
| ------------------------ | --------------------- |
| `⌘/Ctrl` + `Z`           | Undo                  |
| `⌘/Ctrl` + `Shift` + `Z` | Redo                  |
| `⌘/Ctrl` + `Y`           | Redo (alt)            |
| `Delete` / `Backspace`   | Delete selected       |
| `V`                      | Select tool           |
| `H`                      | Move (pan) tool       |
| `B`                      | Brush tool            |
| `E`                      | Eraser tool           |
| `R`                      | Rectangle tool        |
| `O`                      | Ellipse tool          |
| `L`                      | Line tool             |

A live reference is available in-app via the **Shortcuts** button in the canvas top bar.

## Performance & Accessibility budgets

The Lighthouse CI config (`frontend/lighthouserc.json`) enforces a **minimum score of 0.9** for:

- Performance
- Accessibility
- Best Practices
- SEO

These budgets run on every PR via the `lighthouse` job in `.github/workflows/ci.yml`.

## Deployment

The app is designed to deploy to a DigitalOcean droplet via Docker Compose, behind Nginx. See [`infra/`](infra/) and [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

## License

MIT — see `LICENSE` if present.
