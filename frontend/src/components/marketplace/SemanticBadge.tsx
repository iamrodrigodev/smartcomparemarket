import { cn } from '@/lib/utils';
import { Link2, Check, X, Sparkles, ArrowUpCircle, GitCompare, Puzzle } from 'lucide-react';

interface SemanticBadgeProps {
  type: 'equivalent' | 'compatible' | 'incompatible' | 'tag' | 'similar' | 'alternative' | 'complement' | 'upgrade';
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
    similar: GitCompare,
    alternative: Link2,
    complement: Puzzle,
    upgrade: ArrowUpCircle,
  };

  const styles = {
    equivalent: 'bg-equivalent/15 text-equivalent border-equivalent/30',
    compatible: 'bg-compatible/15 text-compatible border-compatible/30',
    incompatible: 'bg-incompatible/15 text-incompatible border-incompatible/30',
    tag: 'bg-primary/10 text-primary border-primary/20',
    similar: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
    alternative: 'bg-purple-500/15 text-purple-600 border-purple-500/30',
    complement: 'bg-green-500/15 text-green-600 border-green-500/30',
    upgrade: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
  };

  const Icon = icons[type] || Sparkles;
  const style = styles[type] || styles.tag;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border",
        style,
        className
      )}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      {label}
    </span>
  );
}
