import express, { Request, Response } from 'express';
import Dockerode from 'dockerode';
import path from 'path';
import { initDb, getProjects, getProject, createProject, deleteProject } from './db';
import type { Project } from './db';

const app = express();
const PORT = process.env.PORT ?? 3000;

const docker = new Dockerode({
  host: process.env.DOCKER_TCP_HOST ?? 'host.docker.internal',
  port: Number(process.env.DOCKER_TCP_PORT ?? 2375),
  protocol: 'http',
});

app.use(express.json());

if (process.env.NODE_ENV !== 'development') {
  app.use(express.static(path.join(__dirname, '..', 'dist')));
}

// ── Docker helpers ────────────────────────────────────────────────────────────

interface DockerStatus {
  status: string;
  running: boolean;
  startedAt?: string;
  image?: string;
  id?: string;
  error?: string;
}

async function getContainerStatus(containerName: string): Promise<DockerStatus> {
  try {
    const container = docker.getContainer(containerName);
    const info = await container.inspect();
    return {
      status: info.State.Status,
      running: info.State.Running,
      startedAt: info.State.StartedAt,
      image: info.Config.Image,
      id: info.Id.slice(0, 12),
    };
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string };
    if (e.statusCode === 404) return { status: 'not_found', running: false };
    return { status: 'error', running: false, error: e.message };
  }
}

// ── Projects API ──────────────────────────────────────────────────────────────

app.get('/api/projects', async (_req: Request, res: Response) => {
  const projects = await getProjects();
  const withStatus = await Promise.all(
    projects.map(async (p) => ({ ...p, docker: await getContainerStatus(p.containerName) }))
  );
  res.json(withStatus);
});

app.get('/api/projects/:id', async (req: Request, res: Response) => {
  const project = await getProject(req.params.id);
  if (!project) return res.status(404).json({ error: 'Not found' });
  res.json({ ...project, docker: await getContainerStatus(project.containerName) });
});

app.post('/api/projects', async (req: Request, res: Response) => {
  const { name, description, appName, containerName, type, port, hostPath, gitRepo, gitBranch } =
    req.body as Partial<Project>;

  if (!name || !appName || !containerName) {
    return res.status(400).json({ error: 'name, appName, and containerName are required' });
  }

  const existing = await getProject(appName);
  if (existing) return res.status(409).json({ error: 'Project with this appName already exists' });

  try {
    const project = await createProject({
      id: appName,
      name,
      description: description ?? '',
      appName,
      containerName,
      type: type ?? 'local',
      port: port ?? 80,
      hostPath: hostPath ?? null,
      gitRepo: gitRepo ?? null,
      gitBranch: gitBranch ?? 'main',
      url: `http://${appName}.localhost`,
    });
    res.status(201).json(project);
  } catch (err: unknown) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.delete('/api/projects/:id', async (req: Request, res: Response) => {
  const removed = await deleteProject(req.params.id);
  if (!removed) return res.status(404).json({ error: 'Not found' });
  res.json({ removed });
});

// ── Container actions ─────────────────────────────────────────────────────────

type ContainerAction = 'start' | 'stop' | 'restart';

async function containerAction(req: Request, res: Response, action: ContainerAction) {
  const project = await getProject(req.params.id);
  if (!project) return res.status(404).json({ error: 'Not found' });

  try {
    const container = docker.getContainer(project.containerName);
    await (container[action] as () => Promise<void>).call(container);
    res.json({ ok: true, docker: await getContainerStatus(project.containerName) });
  } catch (err: unknown) {
    res.status(500).json({ error: (err as Error).message });
  }
}

app.post('/api/projects/:id/start',   (req, res) => containerAction(req, res, 'start'));
app.post('/api/projects/:id/stop',    (req, res) => containerAction(req, res, 'stop'));
app.post('/api/projects/:id/restart', (req, res) => containerAction(req, res, 'restart'));

app.get('/api/projects/:id/rebuild-cmd', async (req: Request, res: Response) => {
  const project = await getProject(req.params.id);
  if (!project) return res.status(404).json({ error: 'Not found' });
  if (!project.hostPath) return res.status(400).json({ error: 'No hostPath configured' });
  const windowsPath = project.hostPath.replace(/\//g, '\\');
  res.json({ command: `cd "${windowsPath}" && docker compose up --build -d`, hostPath: project.hostPath });
});

// ── SSE log stream ────────────────────────────────────────────────────────────

app.get('/api/projects/:id/logs', async (req: Request, res: Response) => {
  const project = await getProject(req.params.id);
  if (!project) return res.status(404).json({ error: 'Not found' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const tail = parseInt(String(req.query.tail ?? '100'), 10);

  try {
    const container = docker.getContainer(project.containerName);
    const stream = await container.logs({ stdout: true, stderr: true, follow: true, tail, timestamps: true });

    function parseFrame(buffer: Buffer): string[] {
      let offset = 0;
      const lines: string[] = [];
      while (offset + 8 <= buffer.length) {
        const size = buffer.readUInt32BE(offset + 4);
        if (offset + 8 + size > buffer.length) break;
        lines.push(buffer.slice(offset + 8, offset + 8 + size).toString('utf8'));
        offset += 8 + size;
      }
      return lines;
    }

    (stream as NodeJS.ReadableStream).on('data', (chunk: Buffer | string) => {
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      for (const line of parseFrame(buf)) {
        res.write(`data: ${JSON.stringify(line)}\n\n`);
      }
    });

    (stream as NodeJS.ReadableStream).on('end', () => {
      res.write('event: end\ndata: {}\n\n');
      res.end();
    });

    req.on('close', () => { try { (stream as unknown as { destroy?: () => void }).destroy?.(); } catch {} });
  } catch (err: unknown) {
    res.write(`event: error\ndata: ${JSON.stringify((err as Error).message)}\n\n`);
    res.end();
  }
});

// ── Docker discovery ──────────────────────────────────────────────────────────

app.get('/api/docker/discover', async (_req: Request, res: Response) => {
  try {
    const containers = await docker.listContainers({ all: true });
    const projects = await getProjects();
    const registered = new Set(projects.map((p) => p.containerName));

    const discovered = containers
      .filter((c) => {
        const labels = c.Labels ?? {};
        return labels['traefik.enable'] === 'true' && !registered.has(c.Names[0]?.replace(/^\//, ''));
      })
      .map((c) => {
        const labels = c.Labels ?? {};
        const name = c.Names[0]?.replace(/^\//, '') ?? '';
        const routerEntry = Object.entries(labels).find(([k]) => k.includes('.rule'));
        const hostMatch = routerEntry?.[1].match(/Host\(`([^`]+)`\)/);
        const hostname = hostMatch?.[1] ?? null;
        const appName = hostname ? hostname.replace('.localhost', '') : name;
        return { containerName: name, appName, hostname, status: c.State, image: c.Image, labels };
      });

    res.json(discovered);
  } catch (err: unknown) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ── Health & SPA fallback ─────────────────────────────────────────────────────

app.get('/health', (_req, res) => res.json({ ok: true }));

if (process.env.NODE_ENV !== 'development') {
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
  });
}

// ── Start: init DB first, then listen ────────────────────────────────────────

initDb()
  .then(() => {
    app.listen(PORT, () => console.log(`Docker Lord running on :${PORT}`));
  })
  .catch((err: unknown) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
