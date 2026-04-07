import type { Project } from '../types';

const STATUS_DOT: Record<string, string> = {
  running: 'running',
  exited: 'exited',
  not_found: 'not_found',
  restarting: 'restarting',
};

interface Props {
  project: Project;
  onAction: (id: string, action: 'start' | 'stop' | 'restart') => Promise<void>;
  onRemove: (id: string, name: string) => Promise<void>;
  onLogs: () => void;
  onRebuildCmd: (id: string) => Promise<void>;
}

export function ProjectCard({ project: p, onAction, onRemove, onLogs, onRebuildCmd }: Props) {
  const status = p.docker?.status ?? 'unknown';
  const running = p.docker?.running ?? false;
  const dotClass = STATUS_DOT[status] ?? 'error';
  const statusLabel = status === 'not_found' ? 'not found' : status;

  return (
    <div className="project-card">
      <div className="card-top">
        <div className="card-title-row">
          <div className={`status-dot ${dotClass}`} title={statusLabel} />
          <span className="card-name">{p.name}</span>
          <span className={`type-badge ${p.type}`}>{p.type}</span>
        </div>
      </div>

      {p.description && <div className="card-description">{p.description}</div>}

      <div className="card-meta">
        <div className="meta-row">
          <span className="label">Status</span>
          <span className="value">{statusLabel}</span>
        </div>
        <div className="meta-row">
          <span className="label">URL</span>
          <a href={p.url} target="_blank" rel="noreferrer" className="url-link">{p.url}</a>
        </div>
        <div className="meta-row">
          <span className="label">Container</span>
          <span className="value">{p.containerName}</span>
        </div>
        {p.hostPath && (
          <div className="meta-row">
            <span className="label">Path</span>
            <span className="value meta-path" title={p.hostPath}>{p.hostPath}</span>
          </div>
        )}
        {p.gitRepo && (
          <div className="meta-row">
            <span className="label">Origin</span>
            <a
              href={p.gitRepo.replace(/^https?:\/\/[^@]+@/, 'https://')}
              target="_blank"
              rel="noreferrer"
              className="url-link meta-git"
              title={p.gitRepo}
            >
              {p.gitRepo.replace(/^https?:\/\/[^@]+@/, '').replace(/\.git$/, '')}
            </a>
          </div>
        )}
        {p.gitRepo && (
          <div className="meta-row">
            <span className="label">Branch</span>
            <span className="value">{p.gitBranch ?? 'main'}</span>
          </div>
        )}
      </div>

      <div className="card-actions">
        {running ? (
          <button className="btn btn-secondary btn-sm" onClick={() => onAction(p.id, 'stop')}>
            Stop
          </button>
        ) : (
          <button className="btn btn-primary btn-sm" onClick={() => onAction(p.id, 'start')}>
            Start
          </button>
        )}
        <button
          className="btn btn-secondary btn-sm"
          disabled={!running}
          onClick={() => onAction(p.id, 'restart')}
        >
          Restart
        </button>
        {p.type === 'local' && p.hostPath && (
          <button className="btn btn-secondary btn-sm" onClick={() => onRebuildCmd(p.id)}>
            Rebuild
          </button>
        )}
        <div className="spacer" />
        <button className="btn-icon" title="View logs" onClick={onLogs}>📜</button>
        <button
          className="btn-icon"
          title="Remove from registry"
          style={{ color: '#ef4444' }}
          onClick={() => onRemove(p.id, p.name)}
        >
          🗑
        </button>
      </div>
    </div>
  );
}
