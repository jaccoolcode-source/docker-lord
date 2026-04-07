import { useEffect, useRef } from 'react';
import type { Project } from '../types';

interface Props {
  project: Project;
  onClose: () => void;
}

export function LogPanel({ project, onClose }: Props) {
  const contentRef = useRef<HTMLDivElement>(null);
  const sseRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const sse = new EventSource(`/api/projects/${project.id}/logs?tail=200`);
    sseRef.current = sse;

    sse.onmessage = (e) => {
      const line = JSON.parse(e.data as string) as string;
      const content = contentRef.current;
      if (!content) return;
      const div = document.createElement('div');
      div.className = 'log-line';
      div.textContent = line;
      content.appendChild(div);
      content.scrollTop = content.scrollHeight;
    };

    sse.addEventListener('end', () => {
      const content = contentRef.current;
      if (!content) return;
      const div = document.createElement('div');
      div.className = 'log-end';
      div.textContent = '── end of log stream ──';
      content.appendChild(div);
      sse.close();
    });

    sse.addEventListener('error', (e) => {
      const msgEvent = e as MessageEvent<string>;
      if (msgEvent.data) {
        const content = contentRef.current;
        if (!content) return;
        const div = document.createElement('div');
        div.className = 'log-line stderr';
        div.textContent = `Error: ${JSON.parse(msgEvent.data) as string}`;
        content.appendChild(div);
      }
      sse.close();
    });

    return () => { sse.close(); };
  }, [project.id]);

  const handleClose = () => {
    sseRef.current?.close();
    onClose();
  };

  return (
    <div className="log-panel">
      <div className="log-panel-header">
        <span>Logs — {project.name}</span>
        <button onClick={handleClose}>&times;</button>
      </div>
      <div className="log-content" ref={contentRef} />
    </div>
  );
}
