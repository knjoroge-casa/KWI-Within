import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, subMonths, isSameDay } from 'date-fns';
import { DailyLog } from '@/data/types';
import { cn } from '@/lib/utils';

interface Props {
  logs: DailyLog[];
}

const energyColors: Record<number, string> = {
  0: 'bg-muted',
  1: 'bg-energy-1',
  2: 'bg-energy-2',
  3: 'bg-energy-3',
  4: 'bg-energy-4',
  5: 'bg-energy-5',
};

const MonthGrid = ({ month, logs }: { month: Date; logs: DailyLog[] }) => {
  const start = startOfMonth(month);
  const end = endOfMonth(month);
  const days = eachDayOfInterval({ start, end });
  const startDay = getDay(start);

  return (
    <div>
      <p className="mb-2 text-xs font-medium text-muted-foreground">{format(month, 'MMMM yyyy')}</p>
      <div className="grid grid-cols-7 gap-1">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="text-center text-[10px] text-muted-foreground">{d}</div>
        ))}
        {Array.from({ length: startDay }).map((_, i) => (
          <div key={`e-${i}`} />
        ))}
        {days.map(day => {
          const log = logs.find(l => isSameDay(new Date(l.date), day));
          const energy = log?.energy?.energy_level || 0;
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "aspect-square rounded-sm transition-colors",
                energyColors[energy]
              )}
              title={`${format(day, 'MMM d')}: Energy ${energy || '—'}`}
            />
          );
        })}
      </div>
    </div>
  );
};

export const HeatmapCalendar = ({ logs }: Props) => {
  const now = new Date();
  const prevMonth = subMonths(now, 1);

  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="mb-3 text-sm font-semibold">Energy Heatmap</h3>
      <div className="grid grid-cols-2 gap-4">
        <MonthGrid month={prevMonth} logs={logs} />
        <MonthGrid month={now} logs={logs} />
      </div>
      <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
        <span>Low</span>
        {[1, 2, 3, 4, 5].map(n => (
          <div key={n} className={cn("h-3 w-3 rounded-sm", energyColors[n])} />
        ))}
        <span>High</span>
      </div>
    </div>
  );
};
