# Smart AI Painter

> **Sketch first. Let AI finish it.**
> A workspace-first sketch editor that turns rough drawings into polished AI artwork without ever leaving the canvas.

**Live:** [smartpainter.me](https://smartpainter.me)

---

## Features

- **Full drawing workspace** — tool dock, page presets (Square, Portrait, Landscape), zoom, undo/redo
- **Brush, eraser, shapes, and selection tools** with keyboard shortcuts
- **Quick color palette** with custom color picker and brush size control
- **AI generation panel** — describe your vision, pick a style, and generate artwork from your sketch
- **Prompt history** — last 10 prompts saved for one-click reuse
- **Style presets and sketch-strength control**
- **Authentication** (Supabase email magic-link) with personal sketch and generation gallery
- **Shareable generation links** (`/g/[id]`) with Open Graph previews
- **Device-specific layouts** — dedicated phone, tablet, and desktop shells with touch-first controls
- **Dark / Light mode** with system-preference detection
- **Accessible** — keyboard navigation, reduced motion support, skip-to-content link

## Architecture

```
Next.js 14 (Frontend)  ──REST──▶  FastAPI (Backend)  ──SDK──▶  Supabase (Auth, DB, Storage)
     │                                  │
  Fabric.js canvas                AI Provider (Replicate)
  Zustand state
  TanStack Query
```

### How it works

1. User draws on the Fabric.js canvas
2. "AI Generate" exports the canvas to base64 PNG
3. `POST /api/v1/generate` sends sketch + prompt + style to FastAPI
4. Backend processes the sketch and calls the AI provider
5. Generated image is returned and (if authenticated) saved to Supabase Storage
6. Shareable URL `/g/{id}` serves the result with Open Graph metadata

## Tech Stack

| Layer    | Tools |
|----------|-------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Fabric.js, TanStack Query, Zustand |
| Backend  | Python 3.12, FastAPI, Uvicorn, Pillow, httpx, Pydantic |
| Platform | Supabase (Auth + Postgres + Storage), Docker, Nginx |
| CI/CD    | GitHub Actions, EC2 deployment |

## Repository Layout

```
smart-ai-painter/
├── frontend/    — Next.js app
├── backend/     — FastAPI service
├── infra/       — Docker, Nginx, deploy configs
├── supabase/    — SQL migrations and RLS policies
└── .github/     — CI/CD workflows
```

## Getting Started

### Prerequisites

- Node.js 20+
- Python 3.12+
- Supabase project

### Frontend

```bash
cd frontend
cp .env.local.example .env.local   # fill in NEXT_PUBLIC_* values
npm install
npm run dev
```

Runs on `http://localhost:3000`.

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env               # fill in Supabase + AI provider keys
uvicorn app.main:app --reload
```

Runs on `http://localhost:8000`.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/⌘ + Z` | Undo |
| `Ctrl/⌘ + Shift + Z` | Redo |
| `Ctrl/⌘ + Y` | Redo (alt) |
| `Delete / Backspace` | Delete selected |
| `V` | Select |
| `H` | Pan |
| `B` | Brush |
| `E` | Eraser |
| `R` | Rectangle |
| `O` | Ellipse |
| `L` | Line |

Also available in-app via the **Shortcuts** button.

## Deployment

Deployed on EC2 via Docker Compose behind Nginx. See [`infra/`](infra/) and [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

## License

MIT
