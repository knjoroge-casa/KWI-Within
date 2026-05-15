import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isSameMonth, subMonths, addMonths } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DailyLog } from '@/data/types';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

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

function loggedCategories(log: DailyLog): string[] {
  const cats: string[] = [];
  if (log.energy)     cats.push('Energy logged');
  if (log.sleep)      cats.push('Sleep logged');
  if (log.mood)       cats.push('Mood logged');
  if (log.body)       cats.push('Body logged');
  if (log.cycle)      cats.push('Cycle logged');
  if (log.appetite)   cats.push('Appetite & digestion logged');
  if (log.activity)   cats.push('Movement logged');
  if (log.skinHair)   cats.push('Skin & hair logged');
  if (log.substances) cats.push('Substances logged');
  if (log.notes)      cats.push('Notes added');
  return cats;
}

const MonthGrid = ({
  month,
  logs,
  onDayClick,
}: {
  month: Date;
  logs: DailyLog[];
  onDayClick: (day: Date, log: DailyLog) => void;
}) => {
  const start = startOfMonth(month);
  const end = endOfMonth(month);
  const days = eachDayOfInterval({ start, end });
  const startDay = getDay(start);

  return (
    <div className="grid grid-cols-7 gap-1">
      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
        <div key={i} className="text-center text-[10px] text-muted-foreground pb-1">{d}</div>
      ))}
      {Array.from({ length: startDay }).map((_, i) => (
        <div key={`e-${i}`} />
      ))}
      {days.map(day => {
        const log = logs.find(l => isSameDay(new Date(l.date), day));
        const energy = log?.energy?.energy_level ?? 0;
        const hasData = !!log;
        return (
          <div
            key={day.toISOString()}
            className={cn(
              'aspect-square rounded-sm transition-colors',
              energyColors[energy],
              hasData ? 'cursor-pointer hover:opacity-75' : 'opacity-40',
            )}
            title={`${format(day, 'MMM d')}: Energy ${energy || '—'}`}
            onClick={() => hasData && log && onDayClick(day, log)}
          />
        );
      })}
    </div>
  );
};

export const HeatmapCalendar = ({ logs }: Props) => {
  const today = new Date();
  const [month, setMonth] = useState(() => startOfMonth(today));
  const [selected, setSelected] = useState<{ day: Date; log: DailyLog } | null>(null);
  const navigate = useNavigate();

  const isCurrentMonth = isSameMonth(month, today);
  const cats = selected ? loggedCategories(selected.log) : [];

  return (
    <>
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Energy Heatmap</h3>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMonth(m => startOfMonth(subMonths(m, 1)))}
              className="p-1 rounded hover:bg-muted transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4 text-muted-foreground" />
            </button>
            <span className="text-xs text-muted-foreground w-20 text-center">{format(month, 'MMM yyyy')}</span>
            <button
              onClick={() => { if (!isCurrentMonth) setMonth(m => startOfMonth(addMonths(m, 1))); }}
              disabled={isCurrentMonth}
              className={cn(
                'p-1 rounded transition-colors',
                isCurrentMonth ? 'opacity-30 cursor-not-allowed' : 'hover:bg-muted',
              )}
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        <MonthGrid
          month={month}
          logs={logs}
          onDayClick={(day, log) => setSelected({ day, log })}
        />

        <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
          <span>Low</span>
          {[1, 2, 3, 4, 5].map(n => (
            <div key={n} className={cn('h-3 w-3 rounded-sm', energyColors[n])} />
          ))}
          <span>High</span>
        </div>
      </div>

      <Sheet open={!!selected} onOpenChange={open => { if (!open) setSelected(null); }}>
        <SheetContent side="bottom" className="rounded-t-2xl px-6 pb-8">
          <SheetHeader className="mb-4">
            <SheetTitle className="font-serif text-xl">
              {selected ? format(selected.day, 'EEEE, MMMM d') : ''}
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-1.5 mb-6">
            {cats.length > 0 ? (
              cats.map(cat => (
                <p key={cat} className="text-sm text-muted-foreground">• {cat}</p>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No categories logged for this day.</p>
            )}
          </div>
          <Button
            className="w-full"
            onClick={() => {
              if (selected) {
                navigate(`/log?date=${format(selected.day, 'yyyy-MM-dd')}`);
                setSelected(null);
              }
            }}
          >
            Edit this day
          </Button>
        </SheetContent>
      </Sheet>
    </>
  );
};
