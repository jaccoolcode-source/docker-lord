import { Play, Square, RotateCw, Hammer, Pencil, ScrollText, Trash2 } from 'lucide-react';
import type { Project } from '../types';
import { IBtn } from './IBtn';

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
  onEdit: (id: string) => void;
  onLabelClick?: (label: string) => void;
}

export function ProjectCard({ project: p, onAction, onRemove, onLogs, onRebuildCmd, onEdit, onLabelClick }: Props) {
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
          {p.labels?.map(l => (
            <span key={l} className="label-chip" onClick={() => onLabelClick?.(l)}>{l}</span>
          ))}
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
        {running
          ? <IBtn icon={Square} title="Stop" onClick={() => onAction(p.id, 'stop')} />
          : <IBtn icon={Play} title="Start" variant="primary" onClick={() => onAction(p.id, 'start')} />
        }
        <IBtn icon={RotateCw} title="Restart" disabled={!running} onClick={() => onAction(p.id, 'restart')} />
        {p.type === 'local' && p.hostPath && (
          <IBtn icon={Hammer} title="Rebuild" onClick={() => onRebuildCmd(p.id)} />
        )}
        <div className="spacer" />
        <IBtn icon={Pencil} title="Edit project" onClick={() => onEdit(p.id)} />
        <IBtn icon={ScrollText} title="View logs" onClick={onLogs} />
        <IBtn icon={Trash2} title="Remove from registry" variant="danger" onClick={() => onRemove(p.id, p.name)} />
      </div>
    </div>
  );
}
