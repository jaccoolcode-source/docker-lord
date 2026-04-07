import { useState, useRef } from 'react';

interface Props {
  value: string[];
  onChange: (labels: string[]) => void;
  placeholder?: string;
}

export function TagInput({ value, onChange, placeholder = 'Add label…' }: Props) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = (raw: string) => {
    const tag = raw.trim();
    if (!tag || value.includes(tag)) { setInput(''); return; }
    onChange([...value, tag]);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(input);
    } else if (e.key === 'Backspace' && input === '' && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const removeTag = (tag: string) => onChange(value.filter(t => t !== tag));

  return (
    <div className="tag-input-wrap" onClick={() => inputRef.current?.focus()}>
      {value.map(tag => (
        <span key={tag} className="tag-chip">
          {tag}
          <button type="button" onClick={e => { e.stopPropagation(); removeTag(tag); }}>×</button>
        </span>
      ))}
      <input
        ref={inputRef}
        className="tag-input"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => { if (input.trim()) addTag(input); }}
        placeholder={value.length === 0 ? placeholder : ''}
      />
    </div>
  );
}
