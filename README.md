# Docker Lord 🐳

A web dashboard for managing local Docker projects behind [Traefik](https://traefik.io/) on Docker Desktop (Windows).

## Features

- **List projects** — cards with live Docker status (running / stopped / not found)
- **Start / Stop / Restart** containers via Docker API
- **Rebuild** — shows copy-paste `docker compose up --build -d` command for local projects
- **Log streaming** — live SSE log panel per container
- **Discover** — scans Docker for unregistered Traefik-routed containers and offers one-click import
- **Add projects** — register local projects (by container name) or git-based deployments
- **PostgreSQL storage** — project registry persisted in a local database

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL 16 (via `pg`) |
| Docker API | `dockerode` over TCP (`host.docker.internal:2375`) |
| Reverse proxy | Traefik v2 (external) |

## Prerequisites

1. **Docker Desktop** with TCP daemon exposed:
   > Settings → General → ✅ *Expose daemon on tcp://localhost:2375 without TLS*

2. **Traefik** running with the `traefik` external network:
   ```bash
   docker network create traefik
   # start traefik from C:/Users/jaccu/Documents/Projects/traefik
   docker compose up -d
   ```

## Running

```bash
docker compose up -d
```

Opens at **http://docker-lord.localhost**

The Traefik dashboard is at **http://localhost:8080**

## Development

```bash
npm install

# Terminal 1 — backend (port 3001)
PORT=3001 NODE_ENV=development npx tsx watch server/index.ts

# Terminal 2 — frontend with HMR (port 5173, proxies /api → 3001)
npm run dev
```

## Project structure

```
docker-lord/
├── src/                        # React + TypeScript frontend
│   ├── components/             # Header, ProjectCard, modals, LogPanel
│   ├── api.ts                  # Typed fetch client
│   ├── types.ts                # Shared interfaces
│   └── App.tsx                 # Root component + state
├── server/
│   ├── index.ts                # Express server + all API routes
│   └── db.ts                   # PostgreSQL pool, schema, CRUD
├── data/
│   ├── projects.json           # Seed data (loaded once on empty DB)
│   └── db/                     # PostgreSQL data files (gitignored)
├── Dockerfile                  # Multi-stage: Vite build + tsc + node runtime
├── docker-compose.yml          # App + PostgreSQL services
└── .dockerignore
```

## Architecture

```
Browser → Traefik → docker-lord (Express)
                         │
                         ├── PostgreSQL (internal network, not exposed)
                         └── Docker API (tcp://host.docker.internal:2375)
```

- **Docker API** uses TCP (required for Docker Desktop on Windows — no Unix socket)
- **PostgreSQL** runs on an internal bridge network, not accessible from outside
- **Data persistence** — PostgreSQL files bind-mounted to `./data/db/` (survives container/image removal)
- **Seed** — `data/projects.json` is loaded once if the `projects` table is empty

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/projects` | List all with live Docker status |
| POST | `/api/projects` | Register a project |
| DELETE | `/api/projects/:id` | Remove from registry |
| POST | `/api/projects/:id/start` | Start container |
| POST | `/api/projects/:id/stop` | Stop container |
| POST | `/api/projects/:id/restart` | Restart container |
| GET | `/api/projects/:id/rebuild-cmd` | Get rebuild shell command |
| GET | `/api/projects/:id/logs` | SSE log stream |
| GET | `/api/docker/discover` | Find unregistered Traefik containers |

## Redeploy

```bash
docker compose up --build -d
```

Or use the Claude Code skill: `/redeploy-docker-lord`
