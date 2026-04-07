import { useState } from 'react';

interface Props {
  command: string;
  onClose: () => void;
}

export function RebuildModal({ command, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(command).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="modal">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-box modal-narrow">
        <div className="modal-header">
          <h2>Rebuild Command</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <p style={{ color: 'var(--text-muted)', marginBottom: 10 }}>
            Run this command in your terminal to rebuild and redeploy:
          </p>
          <div className="code-block">{command}</div>
          <button className="btn btn-secondary btn-sm" onClick={handleCopy}>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
