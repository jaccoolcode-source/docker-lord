import { useState } from 'react';
import type { Project, NewProject } from '../types';
import { FolderPicker } from './FolderPicker';
import { TagInput } from './TagInput';

interface Props {
  project: Project;
  onClose: () => void;
  onSave: (id: string, payload: Partial<NewProject>) => Promise<void>;
}

export function EditProjectModal({ project: p, onClose, onSave }: Props) {
  const [name, setName] = useState(p.name);
  const [description, setDescription] = useState(p.description ?? '');
  const [appName, setAppName] = useState(p.appName);
  const [containerName, setContainerName] = useState(p.containerName);
  const [port, setPort] = useState(p.port);
  const [hostPath, setHostPath] = useState(p.hostPath ?? '');
  const [gitRepo, setGitRepo] = useState(p.gitRepo ?? '');
  const [gitBranch, setGitBranch] = useState(p.gitBranch ?? 'main');
  const [labels, setLabels] = useState<string[]>(p.labels ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!name.trim() || !appName.trim() || !containerName.trim()) {
      setError('Name, App Name, and Container Name are required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(p.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        appName: appName.trim(),
        containerName: containerName.trim(),
        type: p.type,
        port,
        hostPath: hostPath.trim() || undefined,
        gitRepo: gitRepo.trim() || undefined,
        gitBranch: gitBranch.trim() || 'main',
        labels,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
      setSaving(false);
    }
  };

  return (
    <div className="modal">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-box">
        <div className="modal-header">
          <h2>Edit Project</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <div className="field-group">
            <label>Display Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div className="field-group">
            <label>Description</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div className="field-group">
            <label>App Name (subdomain) *</label>
            <input
              type="text"
              value={appName}
              onChange={e => setAppName(e.target.value)}
            />
            <small>Accessible at <strong>{appName || 'my-app'}.localhost</strong></small>
          </div>

          <div className="field-group">
            <label>Container Name *</label>
            <input
              type="text"
              value={containerName}
              onChange={e => setContainerName(e.target.value)}
            />
          </div>

          <div className="field-group">
            <label>Internal Port</label>
            <input
              type="number"
              value={port}
              onChange={e => setPort(Number(e.target.value))}
            />
          </div>

          <div className="field-group">
            <label>Host Path</label>
            <FolderPicker
              value={hostPath}
              onChange={setHostPath}
              placeholder="C:/Users/…"
            />
          </div>

          <div className="field-group">
            <label>Git Repository URL</label>
            <input
              type="text"
              placeholder="https://github.com/user/repo.git"
              value={gitRepo}
              onChange={e => setGitRepo(e.target.value)}
            />
          </div>

          <div className="field-group">
            <label>Branch</label>
            <input
              type="text"
              value={gitBranch}
              onChange={e => setGitBranch(e.target.value)}
            />
          </div>

          <div className="field-group">
            <label>Labels</label>
            <TagInput value={labels} onChange={setLabels} />
            <small>Press Enter or comma to add a label</small>
          </div>

          {error && <div className="form-error">{error}</div>}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
