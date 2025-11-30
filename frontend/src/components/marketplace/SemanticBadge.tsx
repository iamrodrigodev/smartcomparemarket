import { cn } from '@/lib/utils';
import { Link2, Check, X, Sparkles } from 'lucide-react';

interface SemanticBadgeProps {
  type: 'equivalent' | 'compatible' | 'incompatible' | 'tag';
  label: string;
  className?: string;
  showIcon?: boolean;
}

export function SemanticBadge({ type, label, className, showIcon = true }: SemanticBadgeProps) {
  const icons = {
    equivalent: Link2,
    compatible: Check,
    incompatible: X,
    tag: Sparkles,
  };

  const styles = {
    equivalent: 'bg-equivalent/15 text-equivalent border-equivalent/30',
    compatible: 'bg-compatible/15 text-compatible border-compatible/30',
    incompatible: 'bg-incompatible/15 text-incompatible border-incompatible/30',
    tag: 'bg-primary/10 text-primary border-primary/20',
  };

  const Icon = icons[type];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border",
        styles[type],
        className
      )}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      {label}
    </span>
  );
}
