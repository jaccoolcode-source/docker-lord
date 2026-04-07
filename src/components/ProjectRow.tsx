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

export function ProjectRow({ project: p, onAction, onRemove, onLogs, onRebuildCmd, onEdit, onLabelClick }: Props) {
  const status = p.docker?.status ?? 'unknown';
  const running = p.docker?.running ?? false;
  const dotClass = STATUS_DOT[status] ?? 'error';
  const statusLabel = status === 'not_found' ? 'not found' : status;
  const visibleLabels = (p.labels ?? []).slice(0, 2);

  return (
    <div className="project-row">
      <div className="row-left">
        <div className={`status-dot ${dotClass}`} title={statusLabel} />
        <span className="row-name" title={p.name}>{p.name}</span>
        <span className={`type-badge ${p.type}`}>{p.type}</span>
        {visibleLabels.map(l => (
          <span key={l} className="label-chip" onClick={() => onLabelClick?.(l)}>{l}</span>
        ))}
      </div>

      <a href={p.url} target="_blank" rel="noreferrer" className="url-link row-url" title={p.url}>
        {p.url}
      </a>

      <span className={`row-status ${dotClass}`}>{statusLabel}</span>

      <div className="row-actions">
        {running
          ? <IBtn icon={Square} title="Stop" onClick={() => onAction(p.id, 'stop')} />
          : <IBtn icon={Play} title="Start" variant="primary" onClick={() => onAction(p.id, 'start')} />
        }
        <IBtn icon={RotateCw} title="Restart" disabled={!running} onClick={() => onAction(p.id, 'restart')} />
        {p.type === 'local' && p.hostPath && (
          <IBtn icon={Hammer} title="Rebuild" onClick={() => onRebuildCmd(p.id)} />
        )}
        <div className="row-divider" />
        <IBtn icon={Pencil} title="Edit project" onClick={() => onEdit(p.id)} />
        <IBtn icon={ScrollText} title="View logs" onClick={onLogs} />
        <IBtn icon={Trash2} title="Remove from registry" variant="danger" onClick={() => onRemove(p.id, p.name)} />
      </div>
    </div>
  );
}
