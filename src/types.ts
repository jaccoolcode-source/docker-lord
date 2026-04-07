export interface DockerStatus {
  status: 'running' | 'exited' | 'not_found' | 'restarting' | 'paused' | 'error' | 'unknown';
  running: boolean;
  startedAt?: string;
  image?: string;
  id?: string;
  error?: string;
}

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
  labels: string[];
  docker?: DockerStatus;
}

export interface NewProject {
  name: string;
  description?: string;
  appName: string;
  containerName: string;
  type: 'local' | 'git';
  port?: number;
  hostPath?: string;
  gitRepo?: string;
  gitBranch?: string;
  labels?: string[];
}

export interface DiscoveredContainer {
  containerName: string;
  appName: string;
  hostname: string | null;
  status: string;
  image: string;
  labels: Record<string, string>;
}
