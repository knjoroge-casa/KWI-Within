import { useState, useEffect } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isSameDay,
  isSameMonth,
  subMonths,
  addMonths,
  parseISO,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

interface Props {
  userId: string;
}

const energyColors: Record<number, string> = {
  0: 'bg-muted',
  1: 'bg-energy-1',
  2: 'bg-energy-2',
  3: 'bg-energy-3',
  4: 'bg-energy-4',
  5: 'bg-energy-5',
};

type HeatmapRow = {
  id: string;
  date: string;
  log_energy: { morning_energy: number | null; midday_energy: number | null; evening_energy: number | null } | null;
  log_sleep: { log_id: string } | null;
  log_mood: { log_id: string } | null;
  log_body: { log_id: string } | null;
  log_appetite: { log_id: string } | null;
  log_cycle: { log_id: string } | null;
  log_skin_hair: { log_id: string } | null;
  log_activity: { log_id: string } | null;
  log_substances: { log_id: string } | null;
  log_notes: { content: string | null } | null;
};

function calcEnergyLevel(e: HeatmapRow['log_energy']): number {
  if (!e) return 0;
  const vals = [e.morning_energy, e.midday_energy, e.evening_energy].filter(
    (v): v is number => v !== null,
  );
  if (vals.length === 0) return 0;
  return Math.round(vals.reduce((s, v) => s + v, 0) / vals.length);
}

function loggedCategories(row: HeatmapRow): string[] {
  const cats: string[] = [];
  if (row.log_energy) cats.push('Energy logged');
  if (row.log_sleep) cats.push('Sleep logged');
  if (row.log_mood) cats.push('Mood logged');
  if (row.log_body) cats.push('Body logged');
  if (row.log_cycle) cats.push('Cycle logged');
  if (row.log_appetite) cats.push('Appetite & digestion logged');
  if (row.log_activity) cats.push('Movement logged');
  if (row.log_skin_hair) cats.push('Skin & hair logged');
  if (row.log_substances) cats.push('Substances logged');
  if (row.log_notes?.content) cats.push('Notes added');
  return cats;
}

type SelectedDay = {
  day: Date;
  categories: string[];
};

const MonthGrid = ({
  month,
  logMap,
  onDayClick,
}: {
  month: Date;
  logMap: Map<string, HeatmapRow>;
  onDayClick: (day: Date, categories: string[]) => void;
}) => {
  const start = startOfMonth(month);
  const end = endOfMonth(month);
  const days = eachDayOfInterval({ start, end });
  const startDay = getDay(start);

  return (
    <div className="grid grid-cols-7 gap-1">
      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
        <div key={i} className="text-center text-[10px] text-muted-foreground pb-1">
          {d}
        </div>
      ))}
      {Array.from({ length: startDay }).map((_, i) => (
        <div key={`e-${i}`} />
      ))}
      {days.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const row = logMap.get(dateStr);
        const energy = row ? calcEnergyLevel(row.log_energy) : 0;
        const hasData = !!row;

        return (
          <div
            key={dateStr}
            className={cn(
              'aspect-square rounded-sm flex items-center justify-center transition-colors',
              energyColors[energy],
              hasData ? 'cursor-pointer hover:opacity-75' : 'opacity-30',
            )}
            title={`${format(day, 'MMM d')}: ${hasData ? `Energy ${energy || '—'}` : 'No log'}`}
            onClick={() => {
              if (hasData && row) onDayClick(day, loggedCategories(row));
            }}
          >
            <span className={cn('text-[9px] leading-none', hasData ? 'text-primary-foreground/70' : 'text-muted-foreground/60')}>
              {format(day, 'd')}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export const HeatmapCalendar = ({ userId }: Props) => {
  const today = new Date();
  const [month, setMonth] = useState(() => startOfMonth(today));
  const [logMap, setLogMap] = useState<Map<string, HeatmapRow>>(new Map());
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<SelectedDay | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) return;
    setLoading(true);

    const monthStart = format(startOfMonth(month), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(month), 'yyyy-MM-dd');

    supabase
      .from('daily_logs')
      .select(`
        id, date,
        log_energy(morning_energy, midday_energy, evening_energy),
        log_sleep(log_id),
        log_mood(log_id),
        log_body(log_id),
        log_appetite(log_id),
        log_cycle(log_id),
        log_skin_hair(log_id),
        log_activity(log_id),
        log_substances(log_id),
        log_notes(content)
      `)
      .eq('user_id', userId)
      .gte('date', monthStart)
      .lte('date', monthEnd)
      .is('deleted_at', null)
      .eq('completed', true)
      .then(({ data }) => {
        const map = new Map<string, HeatmapRow>();
        for (const row of (data ?? []) as unknown as HeatmapRow[]) {
          map.set(row.date, row);
        }
        setLogMap(map);
        setLoading(false);
      });
  }, [userId, month]);

  const isCurrentMonth = isSameMonth(month, today);
  const hasAnyLogs = logMap.size > 0;

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
            <span className="text-xs text-muted-foreground w-20 text-center">
              {format(month, 'MMM yyyy')}
            </span>
            <button
              onClick={() => {
                if (!isCurrentMonth) setMonth(m => startOfMonth(addMonths(m, 1)));
              }}
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

        {loading ? (
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-sm bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <MonthGrid
            month={month}
            logMap={logMap}
            onDayClick={(day, categories) => setSelected({ day, categories })}
          />
        )}

        {!loading && !hasAnyLogs && (
          <p className="mt-3 text-center text-xs text-muted-foreground">
            No logs this month. Tap Log to add one.
          </p>
        )}

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
            {selected && selected.categories.length > 0 ? (
              selected.categories.map(cat => (
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
