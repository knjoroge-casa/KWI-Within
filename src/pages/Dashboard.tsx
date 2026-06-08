import { useState, useEffect } from 'react';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { HeatmapCalendar } from '@/components/dashboard/HeatmapCalendar';
import { SymptomBarChart } from '@/components/dashboard/SymptomBarChart';
import { RotatingCard } from '@/components/dashboard/RotatingCard';
import { QuickStats } from '@/components/dashboard/QuickStats';
import { FunctionalCapacityBar } from '@/components/dashboard/FunctionalCapacityBar';
import { WeeklyInsightModal } from '@/components/dashboard/WeeklyInsightModal';
import { didYouKnowFacts, quotes } from '@/data/placeholder';
import { Button } from '@/components/ui/button';
import { type SymptomItem } from '@/components/dashboard/SymptomBarChart';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

function dayAcknowledgment(count: number): string | null {
  if (count === 0) return null;
  if (count < 7) return `${count} days of data. You're just getting started.`;
  if (count < 30) return `${count} days of data. Patterns are starting to show.`;
  return `${count} days of data. Your dashboard is getting interesting.`;
}

async function countSymptoms(logIds: string[]): Promise<Record<string, number>> {
  if (logIds.length === 0) return {};

  const [moodRes, bodyRes, appetiteRes, skinRes, sleepRes] = await Promise.all([
    supabase.from('log_mood').select('anxiety, irritability, brain_fog').in('log_id', logIds),
    supabase.from('log_body').select('headache, joint_pain, muscle_aches, pelvic_pain, lower_back_pain').in('log_id', logIds),
    supabase.from('log_appetite').select('bloating').in('log_id', logIds),
    supabase.from('log_skin_hair').select('hair_shedding').in('log_id', logIds),
    supabase.from('log_sleep').select('night_sweats').in('log_id', logIds),
  ]);

  const counts: Record<string, number> = {};
  const bump = (key: string, cond: boolean) => {
    if (cond) counts[key] = (counts[key] ?? 0) + 1;
  };

  for (const row of moodRes.data ?? []) {
    bump('Anxiety', row.anxiety !== null && row.anxiety !== 'none');
    bump('Irritability', row.irritability !== null && row.irritability !== 'none');
    bump('Brain fog', row.brain_fog !== null && row.brain_fog !== 'none');
  }
  for (const row of bodyRes.data ?? []) {
    bump('Headache', row.headache !== null && row.headache !== 'none');
    bump('Joint pain', row.joint_pain !== null && row.joint_pain !== 'none');
    bump('Muscle aches', row.muscle_aches !== null && row.muscle_aches !== 'none');
    bump('Pelvic pain', row.pelvic_pain !== null && row.pelvic_pain !== 'none');
    bump('Lower back pain', row.lower_back_pain !== null && row.lower_back_pain !== 'none');
  }
  for (const row of appetiteRes.data ?? []) {
    bump('Bloating', row.bloating !== null && row.bloating !== 'none');
  }
  for (const row of skinRes.data ?? []) {
    bump('Hair shedding', row.hair_shedding === 'more_than_usual' || row.hair_shedding === 'a_lot_more');
  }
  for (const row of sleepRes.data ?? []) {
    bump('Night sweats', row.night_sweats !== null && row.night_sweats !== 'none');
  }

  return counts;
}

interface DashData {
  daysCount: number;
  todayCompleted: boolean;
  avgEnergy: number | null;
  avgSleep: number | null;
  restDaysThisMonth: number;
  capacityFull: number;
  capacityReduced: number;
  capacityRest: number;
  symptoms: SymptomItem[];
}

const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse rounded-lg bg-muted ${className ?? ''}`} />
);

const Dashboard = () => {
  const { user, profile: authProfile } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashData>({
    daysCount: 0,
    todayCompleted: false,
    avgEnergy: null,
    avgSleep: null,
    restDaysThisMonth: 0,
    capacityFull: 0,
    capacityReduced: 0,
    capacityRest: 0,
    symptoms: [],
  });

  useEffect(() => {
    if (!user) return;
    const userId = user.id;

    (async () => {
      const today = new Date();
      const todayStr = format(today, 'yyyy-MM-dd');
      const sevenDaysAgo = format(subDays(today, 6), 'yyyy-MM-dd');
      const monthStart = format(startOfMonth(today), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(today), 'yyyy-MM-dd');
      const prevMonthStart = format(startOfMonth(subMonths(today, 1)), 'yyyy-MM-dd');
      const prevMonthEnd = format(endOfMonth(subMonths(today, 1)), 'yyyy-MM-dd');

      const [daysRes, todayRes, week7Res, sleepRes, currMonthRes, prevMonthRes] =
        await Promise.all([
          supabase
            .from('daily_logs')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('completed', true)
            .is('deleted_at', null),
          supabase
            .from('daily_logs')
            .select('completed')
            .eq('user_id', userId)
            .eq('date', todayStr)
            .is('deleted_at', null)
            .maybeSingle(),
          supabase
            .from('daily_logs')
            .select('log_energy(morning_energy, midday_energy, evening_energy, functional_capacity)')
            .eq('user_id', userId)
            .gte('date', sevenDaysAgo)
            .lte('date', todayStr)
            .is('deleted_at', null),
          supabase
            .from('daily_logs')
            .select('log_sleep(hours_slept)')
            .eq('user_id', userId)
            .gte('date', sevenDaysAgo)
            .lte('date', todayStr)
            .is('deleted_at', null),
          supabase
            .from('daily_logs')
            .select('id, log_energy(functional_capacity)')
            .eq('user_id', userId)
            .gte('date', monthStart)
            .lte('date', monthEnd)
            .is('deleted_at', null),
          supabase
            .from('daily_logs')
            .select('id')
            .eq('user_id', userId)
            .gte('date', prevMonthStart)
            .lte('date', prevMonthEnd)
            .is('deleted_at', null),
        ]);

      // Days count
      const daysCount = daysRes.count ?? 0;

      // Today's log
      const todayCompleted = todayRes.data?.completed === true;

      // Avg energy (last 7 days) — also source for capacity bar
      type EnergyRow = {
        morning_energy: number | null;
        midday_energy: number | null;
        evening_energy: number | null;
        functional_capacity: string | null;
      };
      const week7Rows = week7Res.data ?? [];
      const energyVals = week7Rows
        .map(row => {
          const e = row.log_energy as EnergyRow | null;
          if (!e) return null;
          const vals = [e.morning_energy, e.midday_energy, e.evening_energy].filter(
            (v): v is number => v !== null,
          );
          return vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : null;
        })
        .filter((v): v is number => v !== null);
      const avgEnergy =
        energyVals.length > 0
          ? energyVals.reduce((s, v) => s + v, 0) / energyVals.length
          : null;

      // Avg sleep (last 7 days)
      const sleepVals = (sleepRes.data ?? [])
        .map(row => {
          const s = row.log_sleep as { hours_slept: number | null } | null;
          return s?.hours_slept ?? null;
        })
        .filter((v): v is number => v !== null);
      const avgSleep =
        sleepVals.length > 0
          ? sleepVals.reduce((s, v) => s + v, 0) / sleepVals.length
          : null;

      // Functional capacity counts (last 7 days)
      let capFull = 0, capReduced = 0, capRest = 0;
      for (const row of week7Rows) {
        const cap = (row.log_energy as EnergyRow | null)?.functional_capacity;
        if (cap === 'full') capFull++;
        else if (cap === 'reduced') capReduced++;
        else if (cap === 'rest') capRest++;
      }

      // Current month: rest days + symptom log ids
      const currMonthRows = currMonthRes.data ?? [];
      const currMonthIds = currMonthRows.map(r => r.id);
      const restDaysThisMonth = currMonthRows.filter(row => {
        const cap = (row.log_energy as { functional_capacity: string | null } | null)
          ?.functional_capacity;
        return cap === 'rest';
      }).length;

      // Previous month log ids
      const prevMonthIds = (prevMonthRes.data ?? []).map(r => r.id);

      // Symptom counts (current + previous month for trend)
      const [currCounts, prevCounts] = await Promise.all([
        countSymptoms(currMonthIds),
        countSymptoms(prevMonthIds),
      ]);

      const allKeys = Array.from(
        new Set([...Object.keys(currCounts), ...Object.keys(prevCounts)]),
      );
      const symptoms: SymptomItem[] = allKeys
        .map(name => {
          const curr = currCounts[name] ?? 0;
          const prev = prevCounts[name] ?? 0;
          const trend: 'up' | 'stable' | 'down' =
            curr > prev ? 'up' : curr < prev ? 'down' : 'stable';
          return { name, count: curr, trend };
        })
        .filter(s => s.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);

      setData({
        daysCount,
        todayCompleted,
        avgEnergy,
        avgSleep,
        restDaysThisMonth,
        capacityFull: capFull,
        capacityReduced: capReduced,
        capacityRest: capRest,
        symptoms,
      });
      setLoading(false);
    })();
  }, [user?.id]);

  const firstName = authProfile?.first_name ?? '';
  const lastInitial = authProfile?.last_initial ?? '';
  const initials = `${firstName.charAt(0)}${lastInitial}`.toUpperCase() || '?';
  const avatarUrl = authProfile?.avatar_url;
  const acknowledgment = dayAcknowledgment(data.daysCount);

  return (
    <div className="space-y-4">
      <WeeklyInsightModal userId={user?.id ?? ''} />

      {/* Greeting */}
      <div className="flex items-center gap-3">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={initials}
            className="h-10 w-10 sm:h-12 sm:w-12 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary/20 flex items-center justify-center text-xs sm:text-sm font-bold text-primary shrink-0">
            {initials}
          </div>
        )}
        <div>
          <h2 className="text-xl font-bold">
            {getGreeting()}{firstName ? `, ${firstName}` : ''}
          </h2>
          <p className="text-sm text-muted-foreground">
            {format(new Date(), 'EEEE, d MMMM yyyy')}
          </p>
          {acknowledgment && (
            <p className="text-xs text-muted-foreground mt-1">{acknowledgment}</p>
          )}
        </div>
      </div>

      {/* Today's log status */}
      {loading ? (
        <Skeleton className="h-16" />
      ) : (
        <div className="rounded-lg border bg-card p-4">
          {data.todayCompleted ? (
            <div className="flex items-center gap-2">
              <span className="text-accent text-lg">✓</span>
              <span className="text-sm">Today's log is done. Nice one.</span>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">How are you actually doing today?</p>
                <p className="text-xs text-muted-foreground">Your log is waiting.</p>
              </div>
              <Button size="sm" onClick={() => navigate('/log')}>Log now</Button>
            </div>
          )}
        </div>
      )}

      {/* Quick Stats */}
      {loading ? (
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      ) : (
        <QuickStats
          avgEnergy={data.avgEnergy}
          avgSleep={data.avgSleep}
          restDaysThisMonth={data.restDaysThisMonth}
        />
      )}

      {/* Heatmap */}
      <HeatmapCalendar userId={user?.id ?? ''} />

      {/* Functional Capacity */}
      {loading ? (
        <Skeleton className="h-24" />
      ) : (
        <FunctionalCapacityBar
          full={data.capacityFull}
          reduced={data.capacityReduced}
          rest={data.capacityRest}
        />
      )}

      {/* Symptom Frequency */}
      {loading ? (
        <Skeleton className="h-44" />
      ) : (
        <SymptomBarChart data={data.symptoms} />
      )}

      {/* Did You Know */}
      <RotatingCard items={didYouKnowFacts} variant="fact" />

      {/* Quote */}
      <RotatingCard items={quotes} variant="quote" />
    </div>
  );
};

export default Dashboard;
