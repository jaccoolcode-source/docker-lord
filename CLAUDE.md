# Docker Lord

A web dashboard for managing local Docker projects behind Traefik on Docker Desktop (Windows).

## Architecture

- **Backend:** Node.js/Express (`server/index.ts`) — TypeScript, compiled to `dist-server/`
- **Frontend:** React 18 + TypeScript (`src/`) — built with Vite to `dist/`
- **Storage:** JSON file registry (`data/projects.json`)
- **Docker API:** `dockerode` → `tcp://host.docker.internal:2375` (no Unix socket on Windows)
- **Network:** `traefik` external Docker network
- **URL:** `http://docker-lord.localhost`

## Docker connectivity

Docker Desktop must expose its daemon over TCP:
> Docker Desktop → Settings → General → ✅ "Expose daemon on tcp://localhost:2375 without TLS"

The app connects via `DOCKER_TCP_HOST=host.docker.internal` + `DOCKER_TCP_PORT=2375`.

## Dev workflow

```bash
# Terminal 1 — backend (port 3001)
PORT=3001 NODE_ENV=development npx tsx watch server/index.ts

# Terminal 2 — frontend (port 5173, proxies /api → 3001)
npm run dev
```

## Project registry

`data/projects.json` — array of project objects. Each entry:
```json
{
  "id": "app-name",
  "name": "Display Name",
  "description": "...",
  "appName": "app-name",
  "containerName": "app-name",
  "type": "local | git",
  "port": 3000,
  "hostPath": "C:/Users/jaccu/Documents/Projects/my-app",
  "gitRepo": null,
  "gitBranch": null,
  "url": "http://app-name.localhost"
}
```

## API

| Endpoint | Description |
|----------|-------------|
| `GET /api/projects` | List all with live Docker status |
| `POST /api/projects` | Register a new project |
| `DELETE /api/projects/:id` | Remove from registry |
| `POST /api/projects/:id/start` | Start container |
| `POST /api/projects/:id/stop` | Stop container |
| `POST /api/projects/:id/restart` | Restart container |
| `GET /api/projects/:id/rebuild-cmd` | Get rebuild shell command |
| `GET /api/projects/:id/logs` | SSE stream of container logs |
| `GET /api/docker/discover` | Find unregistered Traefik containers |

## Files

- `server/index.ts` — Express backend, all API routes (TypeScript)
- `src/App.tsx` — root React component, state management
- `src/api.ts` — typed fetch wrapper for all API calls
- `src/types.ts` — shared TypeScript interfaces
- `src/components/` — ProjectCard, AddProjectModal, DiscoverModal, RebuildModal, LogPanel, Header
- `data/projects.json` — project registry (gitignored)

## Redeploy

```bash
docker compose up --build -d
```
