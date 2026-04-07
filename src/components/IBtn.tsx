import type { LucideIcon } from 'lucide-react';

interface Props {
  icon: LucideIcon;
  title: string;
  onClick: () => void;
  variant?: 'default' | 'primary' | 'danger';
  disabled?: boolean;
  size?: number;
}

export function IBtn({ icon: Icon, title, onClick, variant = 'default', disabled, size = 15 }: Props) {
  return (
    <button
      type="button"
      className={`iBtn iBtn--${variant}`}
      title={title}
      disabled={disabled}
      onClick={onClick}
    >
      <Icon size={size} strokeWidth={1.8} />
    </button>
  );
}
