import { X } from 'lucide-react';
import { AIInsight } from '@/data/types';

interface Props {
  insight: AIInsight;
  onDismiss: (id: string) => void;
}

export const InsightCard = ({ insight, onDismiss }: Props) => {
  if (insight.dismissed) return null;

  const content = insight.content as Record<string, any>;

  return (
    <div className="rounded-lg border bg-card p-4 relative">
      <button
        onClick={() => onDismiss(insight.id)}
        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
      <p className="text-xs font-medium text-primary mb-2">
        {insight.insight_type === 'weekly_summary' ? '✨ Weekly insight' : '🔗 Patterns spotted'}
      </p>
      {content.summary && (
        <p className="text-sm text-foreground/90 pr-6">{content.summary}</p>
      )}
      {content.highlights && (
        <ul className="mt-2 space-y-1">
          {(content.highlights as string[]).map((h, i) => (
            <li key={i} className="text-xs text-muted-foreground">• {h}</li>
          ))}
        </ul>
      )}
      {content.correlations && (
        <div className="mt-2 space-y-2">
          {(content.correlations as any[]).slice(0, 3).map((c, i) => (
            <div key={i} className="text-xs">
              <span className="font-medium text-foreground">{c.pair[0]} ↔ {c.pair[1]}</span>
              <p className="text-muted-foreground">{c.note}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
