import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

export interface Project {
  id: string;
  name: string;
  description: string;
  appName: string;
  containerName: string;
  type: 'local' | 'git';
  port: number;
  hostPath: string | null;
  gitRepo: string | null;
  gitBranch: string | null;
  url: string;
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? 'postgresql://docker-lord:docker-lord@localhost:5432/docker-lord',
});

// Map snake_case DB rows → camelCase Project objects
function rowToProject(row: Record<string, unknown>): Project {
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string) ?? '',
    appName: row.app_name as string,
    containerName: row.container_name as string,
    type: row.type as 'local' | 'git',
    port: row.port as number,
    hostPath: (row.host_path as string | null) ?? null,
    gitRepo: (row.git_repo as string | null) ?? null,
    gitBranch: (row.git_branch as string | null) ?? null,
    url: row.url as string,
  };
}

export async function initDb(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS projects (
      id             TEXT        PRIMARY KEY,
      name           TEXT        NOT NULL,
      description    TEXT        NOT NULL DEFAULT '',
      app_name       TEXT        NOT NULL,
      container_name TEXT        NOT NULL,
      type           TEXT        NOT NULL DEFAULT 'local',
      port           INTEGER     NOT NULL DEFAULT 80,
      host_path      TEXT,
      git_repo       TEXT,
      git_branch     TEXT,
      url            TEXT        NOT NULL,
      created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // Seed from projects.json if the table is empty
  const { rowCount } = await pool.query('SELECT 1 FROM projects LIMIT 1');
  if (!rowCount) {
    const seedFile = path.join(__dirname, '..', 'data', 'projects.json');
    if (fs.existsSync(seedFile)) {
      const seeds = JSON.parse(fs.readFileSync(seedFile, 'utf8')) as Project[];
      for (const p of seeds) {
        await createProject(p);
      }
      console.log(`Seeded ${seeds.length} project(s) from projects.json`);
    }
  }
}

export async function getProjects(): Promise<Project[]> {
  const { rows } = await pool.query('SELECT * FROM projects ORDER BY created_at ASC');
  return rows.map(rowToProject);
}

export async function getProject(id: string): Promise<Project | null> {
  const { rows } = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);
  return rows.length ? rowToProject(rows[0]) : null;
}

export async function createProject(p: Omit<Project, never>): Promise<Project> {
  const { rows } = await pool.query(
    `INSERT INTO projects (id, name, description, app_name, container_name, type, port, host_path, git_repo, git_branch, url)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     RETURNING *`,
    [p.id, p.name, p.description ?? '', p.appName, p.containerName, p.type ?? 'local',
     p.port ?? 80, p.hostPath ?? null, p.gitRepo ?? null, p.gitBranch ?? null, p.url]
  );
  return rowToProject(rows[0]);
}

export async function updateProject(id: string, fields: Partial<Omit<Project, 'id'>>): Promise<Project | null> {
  const allowed: (keyof typeof fields)[] = ['name', 'description', 'appName', 'containerName', 'type', 'port', 'hostPath', 'gitRepo', 'gitBranch', 'url'];
  const colMap: Record<string, string> = {
    name: 'name', description: 'description', appName: 'app_name', containerName: 'container_name',
    type: 'type', port: 'port', hostPath: 'host_path', gitRepo: 'git_repo', gitBranch: 'git_branch', url: 'url',
  };
  const sets: string[] = [];
  const values: unknown[] = [];
  for (const key of allowed) {
    if (key in fields) {
      values.push(fields[key]);
      sets.push(`${colMap[key]} = $${values.length}`);
    }
  }
  if (sets.length === 0) return getProject(id);
  values.push(id);
  const { rows } = await pool.query(
    `UPDATE projects SET ${sets.join(', ')} WHERE id = $${values.length} RETURNING *`,
    values
  );
  return rows.length ? rowToProject(rows[0]) : null;
}

export async function deleteProject(id: string): Promise<Project | null> {
  const { rows } = await pool.query('DELETE FROM projects WHERE id = $1 RETURNING *', [id]);
  return rows.length ? rowToProject(rows[0]) : null;
}
