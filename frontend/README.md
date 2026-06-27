# Smart AI Painter — Frontend

Next.js 14 frontend for the Smart AI Painter application.

## Getting Started

### Prerequisites

- Node.js 20+
- Backend API running on `http://localhost:8000`

### Setup

```bash
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_BASE_URL
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

| Variable                   | Description                                                   |
| -------------------------- | ------------------------------------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL` | URL of the FastAPI backend (default: `http://localhost:8000`) |

## Tech Stack

- **Next.js 14** — App Router, Server/Client components
- **TypeScript** — type safety
- **Tailwind CSS** — utility-first styling
- **Fabric.js** — canvas drawing engine
- **Zustand** — global state management
- **TanStack Query** — server state, caching, and data fetching

## Key Pages

| Route       | Description                                 |
| ----------- | ------------------------------------------- |
| `/`         | Main drawing canvas and AI generation panel |
| `/login`    | Email/password authentication               |
| `/register` | New account registration                    |
| `/gallery`  | Personal sketch and generation history      |
