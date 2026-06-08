import { format } from 'date-fns';

export type SymptomItem = { name: string; count: number; trend: 'up' | 'stable' | 'down' };

const trendIcon = (trend: 'up' | 'stable' | 'down') => {
  if (trend === 'up') return <span className="text-destructive/80 text-xs ml-1">↑</span>;
  if (trend === 'down') return <span className="text-accent/80 text-xs ml-1">↓</span>;
  return <span className="text-muted-foreground text-xs ml-1">→</span>;
};

export const SymptomBarChart = ({ data }: { data: SymptomItem[] }) => {
  const currentMonth = format(new Date(), 'MMMM');
  const max = data.length > 0 ? Math.max(...data.map(d => d.count)) : 1;

  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="mb-3 text-sm font-semibold">Most frequent in {currentMonth}</h3>

      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nothing reported this month — that's also data.
        </p>
      ) : (
        <div className="space-y-2">
          {data.map(item => (
            <div key={item.name} className="flex items-center gap-3">
              <span className="w-28 text-xs text-muted-foreground truncate flex items-center">
                {item.name}
                {trendIcon(item.trend)}
              </span>
              <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary/80 rounded-full transition-all"
                  style={{ width: `${(item.count / max) * 100}%` }}
                />
              </div>
              <span className="text-xs font-medium w-6 text-right">{item.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
