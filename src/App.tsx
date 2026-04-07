import { useState, useEffect, useCallback } from 'react';
import type { Project, NewProject, DiscoveredContainer } from './types';
import {
  fetchProjects, addProject, removeProject,
  startProject, stopProject, restartProject,
  getRebuildCmd,
} from './api';
import { Header } from './components/Header';
import { ProjectCard } from './components/ProjectCard';
import { AddProjectModal } from './components/AddProjectModal';
import { DiscoverModal } from './components/DiscoverModal';
import { RebuildModal } from './components/RebuildModal';
import { LogPanel } from './components/LogPanel';

export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showDiscover, setShowDiscover] = useState(false);
  const [rebuildCmd, setRebuildCmd] = useState<string | null>(null);
  const [logProjectId, setLogProjectId] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    try {
      setProjects(await fetchProjects());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  const handleAction = async (id: string, action: 'start' | 'stop' | 'restart') => {
    const fn = action === 'start' ? startProject : action === 'stop' ? stopProject : restartProject;
    await fn(id);
    await loadProjects();
  };

  const handleRemove = async (id: string, name: string) => {
    if (!confirm(`Remove "${name}" from the registry?\n(The container will not be stopped.)`)) return;
    await removeProject(id);
    await loadProjects();
  };

  const handleRebuildCmd = async (id: string) => {
    const data = await getRebuildCmd(id);
    setRebuildCmd(data.command);
  };

  const handleAddProject = async (payload: NewProject) => {
    await addProject(payload);
    setShowAdd(false);
    await loadProjects();
  };

  const handleImport = async (container: DiscoveredContainer) => {
    await addProject({
      name: container.containerName,
      appName: container.appName,
      containerName: container.containerName,
      type: 'local',
      port: 80,
    });
    setShowDiscover(false);
    await loadProjects();
  };

  const logProject = projects.find(p => p.id === logProjectId) ?? null;
  const runningCount = projects.filter(p => p.docker?.running).length;

  return (
    <div className="app">
      <Header
        runningCount={runningCount}
        total={projects.length}
        onAdd={() => setShowAdd(true)}
        onDiscover={() => setShowDiscover(true)}
      />

      <main>
        {loading && <div className="loading">Loading projects…</div>}
        {error && <div className="loading error">Error: {error}</div>}
        {!loading && !error && projects.length === 0 && (
          <div className="empty-state">
            <h3>No projects yet</h3>
            <p>Add your first project or click Discover to find running containers.</p>
          </div>
        )}
        <div className="projects-grid">
          {projects.map(p => (
            <ProjectCard
              key={p.id}
              project={p}
              onAction={handleAction}
              onRemove={handleRemove}
              onLogs={() => setLogProjectId(p.id)}
              onRebuildCmd={handleRebuildCmd}
            />
          ))}
        </div>
      </main>

      {showAdd && (
        <AddProjectModal onClose={() => setShowAdd(false)} onSave={handleAddProject} />
      )}

      {showDiscover && (
        <DiscoverModal onClose={() => setShowDiscover(false)} onImport={handleImport} />
      )}

      {rebuildCmd && (
        <RebuildModal command={rebuildCmd} onClose={() => setRebuildCmd(null)} />
      )}

      {logProject && (
        <LogPanel project={logProject} onClose={() => setLogProjectId(null)} />
      )}
    </div>
  );
}
