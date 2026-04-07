import type { Project, NewProject, DiscoveredContainer } from './types';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((body as { error?: string }).error ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

export const fetchProjects = () => request<Project[]>('/api/projects');

export const addProject = (payload: NewProject) =>
  request<Project>('/api/projects', { method: 'POST', body: JSON.stringify(payload) });

export const removeProject = (id: string) =>
  request<{ removed: Project }>(`/api/projects/${id}`, { method: 'DELETE' });

export const startProject = (id: string) =>
  request<{ ok: boolean }>(`/api/projects/${id}/start`, { method: 'POST' });

export const stopProject = (id: string) =>
  request<{ ok: boolean }>(`/api/projects/${id}/stop`, { method: 'POST' });

export const restartProject = (id: string) =>
  request<{ ok: boolean }>(`/api/projects/${id}/restart`, { method: 'POST' });

export const getRebuildCmd = (id: string) =>
  request<{ command: string; hostPath: string }>(`/api/projects/${id}/rebuild-cmd`);

export const fetchDiscovered = () => request<DiscoveredContainer[]>('/api/docker/discover');
