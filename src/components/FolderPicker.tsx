import { useState } from 'react';

interface BrowseResult {
  current: string;
  parent: string | null;
  dirs: { name: string; hostPath: string }[];
}

interface Props {
  value: string;
  onChange: (path: string) => void;
  placeholder?: string;
}

export function FolderPicker({ value, onChange, placeholder }: Props) {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<BrowseResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const browse = async (hostPath?: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = hostPath
        ? `/api/fs/browse?path=${encodeURIComponent(hostPath)}`
        : '/api/fs/browse';
      const res = await fetch(url);
      const data = await res.json() as BrowseResult & { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Browse failed');
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to browse');
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setOpen(true);
    browse(value || undefined);
  };

  const handleSelect = (hostPath: string) => {
    onChange(hostPath);
    setOpen(false);
    setResult(null);
  };

  const handleClose = () => {
    setOpen(false);
    setResult(null);
    setError(null);
  };

  return (
    <>
      <div className="folder-picker-row">
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder ?? 'C:/Users/…'}
        />
        <button type="button" className="btn btn-secondary btn-sm" onClick={handleOpen}>
          Browse…
        </button>
      </div>

      {open && (
        <div className="modal">
          <div className="modal-backdrop" onClick={handleClose} />
          <div className="modal-box modal-narrow">
            <div className="modal-header">
              <h2>Select Folder</h2>
              <button className="modal-close" onClick={handleClose}>&times;</button>
            </div>

            <div className="modal-body" style={{ gap: 0, padding: 0 }}>
              {result && (
                <div className="fp-breadcrumb" title={result.current}>
                  {result.current}
                </div>
              )}

              <div className="fp-list">
                {loading && <div className="fp-loading">Loading…</div>}
                {error && <div className="fp-error">{error}</div>}
                {result && !loading && (
                  <>
                    {result.parent && (
                      <div className="fp-item fp-up" onClick={() => browse(result.parent!)}>
                        ↑ ..
                      </div>
                    )}
                    {result.dirs.length === 0 && (
                      <div className="fp-empty">No subfolders</div>
                    )}
                    {result.dirs.map(d => (
                      <div key={d.hostPath} className="fp-item">
                        <span className="fp-item-name" onClick={() => browse(d.hostPath)}>
                          📁 {d.name}
                        </span>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => handleSelect(d.hostPath)}
                        >
                          Select
                        </button>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>

            <div className="modal-footer">
              {result && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => handleSelect(result.current)}
                >
                  Select this folder
                </button>
              )}
              <button type="button" className="btn btn-secondary" onClick={handleClose}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
