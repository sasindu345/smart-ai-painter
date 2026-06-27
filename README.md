# Smart AI Painter

> **Sketch first. Let AI finish it.**
> A workspace-first sketch editor that turns rough drawings into polished AI artwork without ever leaving the canvas.

---

## Features

- **Full drawing workspace** — tool dock, page presets (Square, Portrait, Landscape), zoom, undo/redo
- **Brush, eraser, shapes, and selection tools** with keyboard shortcuts
- **Quick color palette** with custom color picker and brush size control
- **AI generation panel** — describe your vision, pick a style, and generate artwork from your sketch
- **Prompt history** — last 10 prompts saved for one-click reuse
- **Style presets and sketch-strength control**
- **Custom Local JWT Authentication** — local email/password login and register with lightweight JWT verification
- **Gallery Storage** — saves sketches and generations to Cloudinary and database metadata to Neon DB
- **Device-specific layouts** — dedicated phone, tablet, and desktop shells with touch-first controls
- **Dark / Light mode** with system-preference detection
- **Accessible** — keyboard navigation, reduced motion support, skip-to-content link

## Architecture

```
Next.js 14 (Frontend)  ──REST──▶  FastAPI (Backend)  ──▶  Neon DB (PostgreSQL)
     │                                  │
  Fabric.js canvas                      ├──▶  Cloudinary (Image Storage)
  Zustand state                         │
  TanStack Query                        └──▶  AI Generation (Local GPU / Colab / Replicate)
```

### How it works

1. User draws on the Fabric.js canvas
2. "AI Generate" exports the canvas to base64 PNG
3. `POST /api/v1/generate` sends sketch + prompt + style to FastAPI backend
4. Backend analyzes the sketch layout using Gemini Vision or Groq Vision (VLM)
5. Backend processes the sketch and forwards it to the active AI Generation Provider (local diffusers server or Replicate)
6. Generated image is uploaded to Cloudinary, metadata is saved to Neon DB, and base64 is returned to the user

## Tech Stack

| Layer    | Tools |
|----------|-------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Fabric.js, TanStack Query, Zustand |
| Backend  | Python 3.13, FastAPI, Uvicorn, PBKDF2 hashing, local JWT (HS256), Pillow, requests, Pydantic |
| Platform | Neon DB (PostgreSQL), Cloudinary (Image Storage), Google Colab / Ngrok (Local GPU Server) |
| CI/CD    | GitHub Actions, Docker, EC2 deployment |

## Repository Layout

```
smart-ai-painter/
├── frontend/    — Next.js app
├── backend/     — FastAPI service
└── infra/       — Docker, Nginx, deploy configs
```

## Getting Started

### Prerequisites

- Node.js 20+
- Python 3.13+
- Neon DB (Postgres) Database URL
- Cloudinary cloud storage keys
- Google Gemini API Key or Groq API Key (for Vision)
- Local GPU server running Stable Diffusion (Colab / Local)

### Frontend

```bash
cd frontend
cp .env.local.example .env.local   # fill in local API url
npm install
npm run dev
```

Runs on `http://localhost:3000`.

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env               # fill in database, storage, VLM, and diffusers keys
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

