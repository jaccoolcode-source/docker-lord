import { useState, useEffect } from 'react';
import type { DiscoveredContainer } from '../types';
import { fetchDiscovered } from '../api';

interface Props {
  onClose: () => void;
  onImport: (container: DiscoveredContainer) => Promise<void>;
}

export function DiscoverModal({ onClose, onImport }: Props) {
  const [containers, setContainers] = useState<DiscoveredContainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState<string | null>(null);

  useEffect(() => {
    fetchDiscovered()
      .then(setContainers)
      .catch(err => setError(err instanceof Error ? err.message : 'Scan failed'))
      .finally(() => setLoading(false));
  }, []);

  const handleImport = async (c: DiscoveredContainer) => {
    setImporting(c.containerName);
    try {
      await onImport(c);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
      setImporting(null);
    }
  };

  return (
    <div className="modal">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-box">
        <div className="modal-header">
          <h2>Discovered Containers</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          {loading && <div className="loading">Scanning Docker…</div>}
          {error && <div className="loading error">{error}</div>}
          {!loading && !error && containers.length === 0 && (
            <div className="loading">No unregistered Traefik containers found.</div>
          )}
          {containers.map(c => (
            <div key={c.containerName} className="discover-item">
              <div className="discover-item-info">
                <div className="discover-item-name">{c.containerName}</div>
                <div className="discover-item-detail">
                  {c.hostname ?? '—'} &bull; {c.status} &bull; {c.image}
                </div>
              </div>
              <button
                className="btn btn-primary btn-sm"
                disabled={importing === c.containerName}
                onClick={() => handleImport(c)}
              >
                {importing === c.containerName ? 'Registering…' : 'Register'}
              </button>
            </div>
          ))}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
