# Smart AI Painter

Smart AI Painter is a full-stack AI web application where users draw a sketch, add a prompt, choose a style, and generate an AI image guided by that sketch.

This project structure is based on the development plan in `smart_ai_painter_dev_plan_v2.md`. It is organized as a monorepo with:

- `frontend/` for the Next.js 14 app
- `backend/` for the FastAPI service
- `infra/` for Docker, Nginx, and deployment scripts
- `.github/workflows/` for CI/CD

## Planned Features

- Freehand sketch canvas with brush, eraser, undo, and clear
- Prompt-driven AI image generation
- Style presets and sketch-strength control
- User authentication and saved gallery
- Shareable generation links
- CI/CD deployment to a DigitalOcean VPS

## Tech Stack

### Frontend

- Next.js 14
- TypeScript
- Tailwind CSS
- Fabric.js
- TanStack Query
- Zustand
- Zod
- shadcn/ui

### Backend

- Python 3.12+
- FastAPI
- Uvicorn
- Pillow
- httpx
- pydantic

### Platform

- Supabase
- Docker
- Docker Compose
- Nginx
- GitHub Actions
- DigitalOcean

## Project Structure

```text
smart-ai-painter/
├── frontend/
├── backend/
├── infra/
├── .github/
└── README.md
```

### Frontend

```text
frontend/
├── public/
├── src/
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── store/
│   ├── lib/
│   ├── types/
│   └── styles/
├── .env.local.example
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### Backend

```text
backend/
├── app/
│   ├── api/
│   ├── core/
│   ├── models/
│   ├── services/
│   └── main.py
├── tests/
├── .env.example
├── Dockerfile
├── requirements.txt
└── requirements-dev.txt
```

### Infrastructure

```text
infra/
├── docker-compose.yml
├── docker-compose.prod.yml
├── nginx/
└── scripts/
```

## Getting Started

This repository currently contains the base folder structure and starter placeholder files. The next step is to implement:

1. Frontend app shell and canvas page
2. Backend API routes and AI service integration
3. Docker-based local development setup
4. CI/CD workflows

## Notes

- The current files are scaffolding placeholders.
- Update environment examples before connecting real services.
- Add implementation incrementally by phase from the development plan.
