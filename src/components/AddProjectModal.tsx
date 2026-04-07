import { useState } from 'react';
import type { NewProject } from '../types';
import { FolderPicker } from './FolderPicker';
import { TagInput } from './TagInput';

interface Props {
  onClose: () => void;
  onSave: (payload: NewProject) => Promise<void>;
}

type ProjectType = 'local' | 'git';

export function AddProjectModal({ onClose, onSave }: Props) {
  const [type, setType] = useState<ProjectType>('local');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [appName, setAppName] = useState('');
  const [containerName, setContainerName] = useState('');
  const [containerManuallySet, setContainerManuallySet] = useState(false);
  const [port, setPort] = useState(3000);
  const [hostPath, setHostPath] = useState('');
  const [gitRepo, setGitRepo] = useState('');
  const [gitBranch, setGitBranch] = useState('main');
  const [labels, setLabels] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAppNameChange = (val: string) => {
    setAppName(val);
    if (!containerManuallySet) setContainerName(val);
  };

  const handleGitRepoChange = (val: string) => {
    setGitRepo(val);
    // Extract repo name from URL: https://github.com/user/my-cool-app.git → my-cool-app
    const match = val.trim().match(/\/([^/]+?)(?:\.git)?$/);
    if (!match) return;
    const repoName = match[1].toLowerCase();
    const displayName = repoName
      .split('-')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    setAppName(repoName);
    if (!containerManuallySet) setContainerName(repoName);
    setName(displayName);
  };

  const handleSave = async () => {
    if (!name.trim() || !appName.trim() || !containerName.trim()) {
      setError('Name, App Name, and Container Name are required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || undefined,
        appName: appName.trim(),
        containerName: containerName.trim(),
        type,
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
          <h2>Add Project</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <div className="field-group">
            <label>Type</label>
            <div className="type-tabs">
              {(['local', 'git'] as ProjectType[]).map(t => (
                <button
                  key={t}
                  className={`type-tab ${type === t ? 'active' : ''}`}
                  onClick={() => setType(t)}
                >
                  {t === 'local' ? 'Local Project' : 'Git-based'}
                </button>
              ))}
            </div>
          </div>

          {type === 'git' && (
            <div className="field-group">
              <label>Git Repository URL</label>
              <input
                type="text"
                placeholder="https://github.com/user/repo.git"
                value={gitRepo}
                onChange={e => handleGitRepoChange(e.target.value)}
              />
            </div>
          )}

          <div className="field-group">
            <label>Display Name *</label>
            <input
              type="text"
              placeholder="Solar Dashboard"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div className="field-group">
            <label>Description</label>
            <input
              type="text"
              placeholder="Optional description"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div className="field-group">
            <label>App Name (subdomain) *</label>
            <input
              type="text"
              placeholder="my-app"
              value={appName}
              onChange={e => handleAppNameChange(e.target.value)}
            />
            <small>Accessible at <strong>{appName || 'my-app'}.localhost</strong></small>
          </div>

          <div className="field-group">
            <label>Container Name *</label>
            <input
              type="text"
              placeholder="my-app"
              value={containerName}
              onChange={e => { setContainerName(e.target.value); setContainerManuallySet(true); }}
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

          {type === 'local' && (
            <div className="field-group">
              <label>Host Path</label>
              <FolderPicker
                value={hostPath}
                onChange={setHostPath}
                placeholder="C:/Users/jaccu/Documents/Projects/my-app"
              />
            </div>
          )}

          {type === 'git' && (
            <div className="field-group">
              <label>Branch</label>
              <input
                type="text"
                value={gitBranch}
                onChange={e => setGitBranch(e.target.value)}
              />
            </div>
          )}

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
            {saving ? 'Saving…' : 'Add Project'}
          </button>
        </div>
      </div>
    </div>
  );
}
