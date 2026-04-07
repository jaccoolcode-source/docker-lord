interface Props {
  runningCount: number;
  total: number;
  onAdd: () => void;
  onDiscover: () => void;
}

export function Header({ runningCount, total, onAdd, onDiscover }: Props) {
  return (
    <header>
      <div className="header-left">
        <span className="logo">🐳</span>
        <h1>Docker Lord</h1>
        <span className={`badge ${runningCount > 0 ? 'running' : ''}`}>
          {runningCount} / {total} running
        </span>
      </div>
      <div className="header-right">
        <button className="btn btn-secondary" onClick={onDiscover}>Discover</button>
        <a
          href="http://localhost:8080"
          target="_blank"
          rel="noreferrer"
          className="btn btn-secondary"
        >
          Traefik Dashboard
        </a>
        <button className="btn btn-primary" onClick={onAdd}>+ Add Project</button>
      </div>
    </header>
  );
}
