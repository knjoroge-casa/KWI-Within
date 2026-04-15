import { format } from 'date-fns';

interface SymptomData {
  name: string;
  count: number;
}

export const SymptomBarChart = ({ data }: { data: SymptomData[] }) => {
  const max = Math.max(...data.map(d => d.count));
  const currentMonth = format(new Date(), 'MMMM');

  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="mb-3 text-sm font-semibold">
        Most frequent in {currentMonth}
      </h3>
      <div className="space-y-2">
        {data.slice(0, 6).map(item => (
          <div key={item.name} className="flex items-center gap-3">
            <span className="w-28 text-xs text-muted-foreground truncate">
              {item.name}
            </span>
            <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary/80 rounded-full transition-all"
                style={{ width: `${(item.count / max) * 100}%` }}
              />
            </div>
            <span className="text-xs font-medium w-6 text-right">
              {item.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
