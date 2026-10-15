import { useState, useEffect, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  format, getISOWeek, startOfISOWeek, endOfISOWeek,
  startOfMonth, endOfMonth, eachDayOfInterval,
  startOfWeek, endOfWeek, isSameMonth,
  addMonths, subMonths, subDays,
} from 'date-fns';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Pencil } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/lib/database.types';
import { placeholderWatchList } from '@/data/placeholder';

// ── Types ──

type ThoughtsEntry = Database['public']['Tables']['thoughts_entries']['Row'];

interface LogSymptomRow {
  id: string;
  date: string;
  anxiety?: string | null;
  irritability?: string | null;
  brain_fog?: string | null;
  headache?: string | null;
  joint_pain?: string | null;
  muscle_aches?: string | null;
  pelvic_pain?: string | null;
  lower_back_pain?: string | null;
  bloating?: string | null;
  hair_shedding?: string | null;
  night_sweats?: string | null;
  cramping?: string | null;
  cycle_phase?: string | null;
  period_status?: string | null;
}

// ── Constants ──

const THOUGHTS_PROMPTS = [
  "What has your body surprised you with lately?",
  "Is there something you've been ignoring that keeps coming back?",
  "What would you tell your doctor if you weren't worried about not being believed?",
  "What's one thing you did this week that was genuinely just for you?",
  "How are you feeling about your body right now, honestly?",
  "What's changed in the last month that you haven't said out loud yet?",
  "Which symptom or feeling are you most curious about right now?",
  "What does a good day feel like for you lately?",
  "What are you tolerating that you wish you weren't?",
  "If your body could talk, what do you think it would say this week?",
  "What have you learned about yourself in the last few weeks?",
  "What would feel like progress to you right now?",
];

const confidenceConfig = {
  noticing: { label: 'Just noticing', className: 'bg-primary/10 text-primary/70' },
  watching: { label: 'Worth watching', className: 'bg-primary/20 text-primary' },
  strong: { label: 'Strong pattern', className: 'bg-primary text-primary-foreground' },
} as const;

const vsLastMonthConfig = {
  better: { label: '↑ Better', className: 'text-green-600' },
  similar: { label: '→ Similar', className: 'text-muted-foreground' },
  worse: { label: '↓ Worse', className: 'text-rose-500' },
} as const;

const CHART_COLORS = ['#f59e0b', '#6366f1', '#e07a5f', '#d97706'];

// ── Placeholder Within Kui data (wired in AI Layer phase) ──

const THIS_WEEK_OBS = [
  {
    id: 'tw-1',
    text: "Your energy has been lowest in the late afternoon, especially on days you sleep under 6 hours.",
    confidence: 'strong' as const,
    evidence: "This has appeared in 9 of your last 14 logs.",
  },
  {
    id: 'tw-2',
    text: "Brain fog logged on 5 of the last 7 days, mostly in the mornings.",
    confidence: 'watching' as const,
    evidence: "More frequent than your 30-day average of 3 days per week.",
  },
  {
    id: 'tw-3',
    text: "Both rest days this week were followed by higher energy the next day.",
    confidence: 'noticing' as const,
    evidence: "Pattern appeared twice this week. Too early to confirm.",
  },
];

const THIS_MONTH_OBS = [
  {
    id: 'tm-1',
    text: "Energy consistently drops in the 3 days before your period, correlating with the late luteal phase.",
    confidence: 'strong' as const,
    evidence: "This correlation has appeared in your last 3 cycles.",
    vsLastMonth: 'similar' as const,
  },
  {
    id: 'tm-2',
    text: "Sleep under 6 hours is closely linked to brain fog the following morning.",
    confidence: 'strong' as const,
    evidence: "Correlation found in 11 of 14 instances this month.",
    vsLastMonth: 'worse' as const,
  },
  {
    id: 'tm-3',
    text: "Mood scores are higher on days you exercise, even with light movement.",
    confidence: 'watching' as const,
    evidence: "Appeared on 7 of 10 exercise days this month.",
    vsLastMonth: 'better' as const,
  },
];

// ── Symptom definitions ──

const SYMPTOMS: Array<{ key: string; label: string; present: (r: LogSymptomRow) => boolean }> = [
  { key: 'anxiety',       label: 'Anxiety',         present: r => !!(r.anxiety && r.anxiety !== 'none') },
  { key: 'irritability',  label: 'Irritability',    present: r => !!(r.irritability && r.irritability !== 'none') },
  { key: 'brain_fog',     label: 'Brain fog',       present: r => !!(r.brain_fog && r.brain_fog !== 'none') },
  { key: 'headache',      label: 'Headache',        present: r => !!(r.headache && r.headache !== 'none') },
  { key: 'joint_pain',    label: 'Joint pain',      present: r => !!(r.joint_pain && r.joint_pain !== 'none') },
  { key: 'muscle_aches',  label: 'Muscle aches',    present: r => !!(r.muscle_aches && r.muscle_aches !== 'none') },
  { key: 'pelvic_pain',   label: 'Pelvic pain',     present: r => !!(r.pelvic_pain && r.pelvic_pain !== 'none') },
  { key: 'lower_back',    label: 'Lower back pain', present: r => !!(r.lower_back_pain && r.lower_back_pain !== 'none') },
  { key: 'bloating',      label: 'Bloating',        present: r => !!(r.bloating && r.bloating !== 'none') },
  { key: 'hair_shedding', label: 'Hair shedding',   present: r => r.hair_shedding === 'more_than_usual' || r.hair_shedding === 'a_lot_more' },
  { key: 'night_sweats',  label: 'Night sweats',    present: r => !!(r.night_sweats && r.night_sweats !== 'none') },
  { key: 'cramping',      label: 'Cramping',        present: r => !!(r.cramping && r.cramping !== 'none') },
];

function computeSymptomCounts(rows: LogSymptomRow[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const sym of SYMPTOMS) counts[sym.key] = rows.filter(sym.present).length;
  return counts;
}

function buildExplanation(name: string, count: number, total: number, trend: 'up' | 'stable' | 'down') {
  const trendSentence =
    trend === 'up' ? 'More frequent than the previous period.' :
    trend === 'down' ? 'Less frequent than the previous period.' :
    'Similar frequency to the previous period.';
  return `${name} appeared on ${count} of ${total} days in this window. ${trendSentence}`;
}

// ── Data helpers ──

async function fetchWindowData(userId: string, start: string, end: string): Promise<LogSymptomRow[]> {
  const { data: logs } = await supabase
    .from('daily_logs')
    .select('id, date')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .gte('date', start)
    .lte('date', end);

  if (!logs || logs.length === 0) return [];
  const ids = logs.map(l => l.id);
  const byId: Record<string, LogSymptomRow> = {};
  for (const l of logs) byId[l.id] = { id: l.id, date: l.date };

  const [mood, body, appetite, skin, sleep, cycle] = await Promise.all([
    supabase.from('log_mood').select('log_id, anxiety, irritability, brain_fog').in('log_id', ids),
    supabase.from('log_body').select('log_id, headache, joint_pain, muscle_aches, pelvic_pain, lower_back_pain').in('log_id', ids),
    supabase.from('log_appetite').select('log_id, bloating').in('log_id', ids),
    supabase.from('log_skin_hair').select('log_id, hair_shedding').in('log_id', ids),
    supabase.from('log_sleep').select('log_id, night_sweats').in('log_id', ids),
    supabase.from('log_cycle').select('log_id, cramping, cycle_phase, period_status').in('log_id', ids),
  ]);

  for (const r of mood.data ?? []) {
    if (!byId[r.log_id]) continue;
    byId[r.log_id].anxiety = r.anxiety;
    byId[r.log_id].irritability = r.irritability;
    byId[r.log_id].brain_fog = r.brain_fog;
  }
  for (const r of body.data ?? []) {
    if (!byId[r.log_id]) continue;
    byId[r.log_id].headache = r.headache;
    byId[r.log_id].joint_pain = r.joint_pain;
    byId[r.log_id].muscle_aches = r.muscle_aches;
    byId[r.log_id].pelvic_pain = r.pelvic_pain;
    byId[r.log_id].lower_back_pain = r.lower_back_pain;
  }
  for (const r of appetite.data ?? []) {
    if (byId[r.log_id]) byId[r.log_id].bloating = r.bloating;
  }
  for (const r of skin.data ?? []) {
    if (byId[r.log_id]) byId[r.log_id].hair_shedding = r.hair_shedding;
  }
  for (const r of sleep.data ?? []) {
    if (byId[r.log_id]) byId[r.log_id].night_sweats = r.night_sweats;
  }
  for (const r of cycle.data ?? []) {
    if (!byId[r.log_id]) continue;
    byId[r.log_id].cramping = r.cramping;
    byId[r.log_id].cycle_phase = r.cycle_phase;
    byId[r.log_id].period_status = r.period_status;
  }

  return Object.values(byId);
}

// ── Helpers ──

function getCurrentWeekInfo() {
  const now = new Date();
  const weekNum = getISOWeek(now);
  const promptIndex = (weekNum - 1) % 12;
  const weekStart = format(startOfISOWeek(now), 'yyyy-MM-dd');
  const weekEnd = format(endOfISOWeek(now), 'yyyy-MM-dd');
  return { weekNum, promptText: THOUGHTS_PROMPTS[promptIndex], weekStart, weekEnd };
}

function getCalendarDays(monthDate: Date) {
  const start = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
}

// ── Sub-components ──

function ConfidencePill({ confidence, evidence }: { confidence: keyof typeof confidenceConfig; evidence: string }) {
  const [open, setOpen] = useState(false);
  const cfg = confidenceConfig[confidence];
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}>
          {cfg.label}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2.5 text-xs leading-relaxed">{evidence}</PopoverContent>
    </Popover>
  );
}

function CollapsibleCard({ title, subtext, open, onToggle, children }: {
  title: string; subtext: string; open: boolean; onToggle: () => void; children: ReactNode;
}) {
  return (
    <Collapsible open={open} onOpenChange={onToggle}>
      <div className="rounded-lg border bg-card overflow-hidden">
        <CollapsibleTrigger asChild>
          <button className="flex w-full items-center justify-between p-4 text-left">
            <div>
              <p className="text-sm font-semibold">{title}</p>
              <p className="text-xs text-muted-foreground">{subtext}</p>
            </div>
            {open
              ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
              : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-3">{children}</div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function ObservationItem({ text, confidence, evidence, vsLastMonth }: {
  text: string;
  confidence: keyof typeof confidenceConfig;
  evidence: string;
  vsLastMonth?: keyof typeof vsLastMonthConfig;
}) {
  return (
    <div className="rounded-md bg-muted/40 p-3 space-y-1.5">
      <p className="text-sm leading-snug">{text}</p>
      <div className="flex items-center gap-2 flex-wrap">
        <ConfidencePill confidence={confidence} evidence={evidence} />
        {vsLastMonth && (
          <span className={`text-xs ${vsLastMonthConfig[vsLastMonth].className}`}>
            {vsLastMonthConfig[vsLastMonth].label} vs last month
          </span>
        )}
      </div>
    </div>
  );
}

function SkeletonBlock({ lines = 2 }: { lines?: number }) {
  return (
    <div className="rounded-lg border bg-card p-4 animate-pulse space-y-2.5">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`h-3 bg-muted rounded ${i === 0 ? 'w-3/4' : 'w-1/2'}`} />
      ))}
    </div>
  );
}

// ── Main component ──

const Insights = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // ── UI state ──
  const [openCards, setOpenCards] = useState({ previousThoughts: false, thisWeek: true, thisMonth: false, watchList: false });
  const [trendsCards, setTrendsCards] = useState({ mostFrequent: false, cycleCorrelation: false, whatsChanged: false });
  const [selectedDays, setSelectedDays] = useState<30 | 60 | 90>(30);
  const [watchList, setWatchList] = useState(placeholderWatchList);

  // ── Thoughts state ──
  const [thoughtsEntries, setThoughtsEntries] = useState<ThoughtsEntry[] | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingThought, setEditingThought] = useState<ThoughtsEntry | null>(null);
  const [draftText, setDraftText] = useState('');
  const [thoughtsSaving, setThoughtsSaving] = useState(false);
  const [thoughtError, setThoughtError] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewingThought, setViewingThought] = useState<ThoughtsEntry | null>(null);

  // ── Trends state ──
  const [currentLogs, setCurrentLogs] = useState<LogSymptomRow[]>([]);
  const [prevLogs, setPrevLogs] = useState<LogSymptomRow[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);

  // ── Within Kui state ──
  const [completedLogsCount, setCompletedLogsCount] = useState<number | null>(null);

  // ── Derived: thoughts ──
  const { weekNum, promptText, weekStart, weekEnd } = getCurrentWeekInfo();

  const currentWeekEntry = useMemo(() =>
    thoughtsEntries?.find(t =>
      t.prompt_week_number === weekNum &&
      t.written_at >= weekStart &&
      t.written_at <= weekEnd
    ) ?? null,
    [thoughtsEntries, weekNum, weekStart, weekEnd]
  );

  const calendarDays = getCalendarDays(calendarMonth);
  const entryByDate = useMemo(() =>
    new Map((thoughtsEntries ?? []).map(t => [t.written_at, t])),
    [thoughtsEntries]
  );
  const liveViewingThought = viewingThought
    ? (thoughtsEntries?.find(t => t.id === viewingThought.id) ?? viewingThought)
    : null;

  const isCurrentMonth = format(calendarMonth, 'yyyy-MM') >= format(new Date(), 'yyyy-MM');

  // ── Derived: trends ──
  const currentCounts = useMemo(() => computeSymptomCounts(currentLogs), [currentLogs]);
  const prevCounts = useMemo(() => computeSymptomCounts(prevLogs), [prevLogs]);

  const symptomInsights = useMemo(() =>
    SYMPTOMS
      .map(sym => {
        const count = currentCounts[sym.key] ?? 0;
        const prev = prevCounts[sym.key] ?? 0;
        const trend: 'up' | 'stable' | 'down' =
          count > prev + 1 ? 'up' : count < prev - 1 ? 'down' : 'stable';
        return { key: sym.key, name: sym.label, count, trend };
      })
      .filter(s => s.count > 0)
      .sort((a, b) => b.count - a.count),
    [currentCounts, prevCounts]
  );

  const cycleChartPayload = useMemo(() => {
    const phases = ['menstrual', 'follicular', 'ovulatory', 'luteal'];
    const top4 = symptomInsights.slice(0, 4);
    if (top4.length === 0) return null;

    const phaseCounts: Record<string, Record<string, number>> = {};
    for (const p of phases) phaseCounts[p] = {};

    for (const row of currentLogs) {
      let phase = row.cycle_phase ?? null;
      if (!phase || phase === 'unknown') {
        const ps = row.period_status;
        if (ps === 'started' || ps === 'ongoing' || ps === 'ended') phase = 'menstrual';
        else continue;
      }
      if (!phases.includes(phase)) continue;
      for (const sym of SYMPTOMS.filter(s => top4.some(t => t.key === s.key))) {
        if (sym.present(row)) {
          phaseCounts[phase][sym.key] = (phaseCounts[phase][sym.key] ?? 0) + 1;
        }
      }
    }

    if (!phases.some(p => Object.keys(phaseCounts[p]).length > 0)) return null;
    return {
      rows: phases.map(p => ({ phase: p.charAt(0).toUpperCase() + p.slice(1), ...phaseCounts[p] })),
      keys: top4,
    };
  }, [currentLogs, symptomInsights]);

  const whatsChanged = useMemo(() => {
    if (!Object.values(prevCounts).some(c => c > 0)) return null;
    const changes = SYMPTOMS.map(sym => ({
      key: sym.key, name: sym.label,
      current: currentCounts[sym.key] ?? 0,
      prev: prevCounts[sym.key] ?? 0,
      delta: (currentCounts[sym.key] ?? 0) - (prevCounts[sym.key] ?? 0),
    }));
    return {
      increased: changes.filter(c => c.delta > 0).sort((a, b) => b.delta - a.delta),
      decreased: changes.filter(c => c.delta < 0).sort((a, b) => a.delta - b.delta),
      newThisPeriod: changes.filter(c => c.current > 0 && c.prev === 0),
      noLongerLogged: changes.filter(c => c.current === 0 && c.prev > 0),
    };
  }, [currentCounts, prevCounts]);

  // ── Data fetching ──

  const fetchThoughts = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('thoughts_entries')
      .select('*')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('written_at', { ascending: false });
    setThoughtsEntries(data ?? []);
  }, [user]);

  const fetchLogs = useCallback(async () => {
    if (!user) return;
    setLogsLoading(true);
    const today = new Date();
    const currentEnd = format(today, 'yyyy-MM-dd');
    const currentStart = format(subDays(today, selectedDays - 1), 'yyyy-MM-dd');
    const prevEnd = format(subDays(today, selectedDays), 'yyyy-MM-dd');
    const prevStart = format(subDays(today, selectedDays * 2 - 1), 'yyyy-MM-dd');

    const [cur, prv] = await Promise.all([
      fetchWindowData(user.id, currentStart, currentEnd),
      fetchWindowData(user.id, prevStart, prevEnd),
    ]);

    setCurrentLogs(cur);
    setPrevLogs(prv);
    setLogsLoading(false);
  }, [user, selectedDays]);

  useEffect(() => { fetchThoughts(); }, [fetchThoughts]);
  useEffect(() => { fetchLogs(); }, [fetchLogs]);
  useEffect(() => {
    if (!user) return;
    supabase
      .from('daily_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .eq('completed', true)
      .then(({ count }) => setCompletedLogsCount(count ?? 0));
  }, [user]);

  // ── Handlers ──

  const dismissWatchItem = (id: string) =>
    setWatchList(prev => prev.filter(item => item.id !== id));

  const openEditor = (thought: ThoughtsEntry | null = null) => {
    setEditingThought(thought);
    setDraftText(thought?.entry_text ?? '');
    setThoughtError(null);
    setIsEditorOpen(true);
  };

  const handleSave = async () => {
    if (!draftText.trim() || !user) return;
    setThoughtsSaving(true);
    setThoughtError(null);

    if (editingThought) {
      const { error } = await supabase
        .from('thoughts_entries')
        .update({ entry_text: draftText, updated_at: new Date().toISOString() })
        .eq('id', editingThought.id);
      if (error) { setThoughtError(error.message); setThoughtsSaving(false); return; }
    } else {
      const { error } = await supabase
        .from('thoughts_entries')
        .insert({
          user_id: user.id,
          prompt_text: promptText,
          prompt_week_number: weekNum,
          entry_text: draftText,
          written_at: format(new Date(), 'yyyy-MM-dd'),
          include_in_doctor_report: false,
        });
      if (error) { setThoughtError(error.message); setThoughtsSaving(false); return; }
    }

    await fetchThoughts();
    setThoughtsSaving(false);
    setIsEditorOpen(false);
    setDraftText('');
    setEditingThought(null);
    toast('Saved');
  };

  const toggleIncludeInReport = async (entry: ThoughtsEntry) => {
    const newValue = !entry.include_in_doctor_report;
    setThoughtsEntries(prev =>
      prev?.map(t => t.id === entry.id ? { ...t, include_in_doctor_report: newValue } : t) ?? null
    );
    await supabase
      .from('thoughts_entries')
      .update({ include_in_doctor_report: newValue, updated_at: new Date().toISOString() })
      .eq('id', entry.id);
  };

  const openViewer = (thought: ThoughtsEntry) => {
    setViewingThought(thought);
    setIsViewerOpen(true);
  };

  // ── Render ──

  return (
    <div className="space-y-8 pb-4">

      {/* ── SECTION 1: THOUGHTS ── */}
      <section className="space-y-3">
        <div>
          <h2 className="text-xl font-bold">Thoughts</h2>
          <p className="text-xs text-muted-foreground mt-0.5">A weekly prompt, just for you.</p>
        </div>

        {thoughtsEntries === null ? (
          <SkeletonBlock lines={3} />
        ) : (
          <div className="rounded-lg border bg-card p-4 space-y-3">
            <p className="text-sm font-medium leading-relaxed">"{promptText}"</p>
            {currentWeekEntry ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground leading-relaxed">{currentWeekEntry.entry_text}</p>
                <button
                  onClick={() => openEditor(currentWeekEntry)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Pencil className="h-3 w-3" /> Edit
                </button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => openEditor()}>
                Write this week's entry
              </Button>
            )}
          </div>
        )}

        <CollapsibleCard
          title="Previous Thoughts"
          subtext="Tap to browse past entries"
          open={openCards.previousThoughts}
          onToggle={() => setOpenCards(s => ({ ...s, previousThoughts: !s.previousThoughts }))}
        >
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCalendarMonth(m => subMonths(m, 1))}
              className="rounded-full p-1 hover:bg-muted transition-colors"
            >
              <ChevronLeft className="h-4 w-4 text-muted-foreground" />
            </button>
            <span className="text-sm font-semibold">{format(calendarMonth, 'MMMM yyyy')}</span>
            <button
              onClick={() => setCalendarMonth(m => addMonths(m, 1))}
              disabled={isCurrentMonth}
              className="rounded-full p-1 hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-default"
            >
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
              <div key={i} className="flex items-center justify-center h-6 text-[10px] font-medium text-muted-foreground">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {calendarDays.map(day => {
              const inMonth = isSameMonth(day, calendarMonth);
              const dateKey = format(day, 'yyyy-MM-dd');
              const entry = entryByDate.get(dateKey);
              const hasEntry = !!entry && inMonth;
              return (
                <button
                  key={dateKey}
                  disabled={!hasEntry}
                  onClick={() => hasEntry && entry && openViewer(entry)}
                  className={`flex flex-col items-center justify-center h-9 rounded-md text-xs transition-colors
                    ${!inMonth ? 'invisible' : ''}
                    ${hasEntry ? 'hover:bg-primary/10 cursor-pointer' : 'cursor-default'}
                  `}
                >
                  <span className={hasEntry ? 'font-semibold text-foreground' : 'text-muted-foreground'}>
                    {format(day, 'd')}
                  </span>
                  {hasEntry && <div className="w-1.5 h-1.5 rounded-full bg-primary mt-0.5" />}
                </button>
              );
            })}
          </div>

          {thoughtsEntries !== null && thoughtsEntries.length === 0 && (
            <p className="text-sm text-muted-foreground pt-2">
              Nothing saved yet. Write this week's entry above to get started.
            </p>
          )}
        </CollapsibleCard>
      </section>

      {/* ── SECTION 2: WITHIN KUI ── */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold">Within Kui</h2>

        {completedLogsCount !== null && completedLogsCount < 7 ? (
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">
              Within Kui needs at least a week of logs to start spotting patterns. Keep going.
            </p>
          </div>
        ) : (
          <>
            <CollapsibleCard
              title="This Week"
              subtext="Last 7 days"
              open={openCards.thisWeek}
              onToggle={() => setOpenCards(s => ({ ...s, thisWeek: !s.thisWeek }))}
            >
              {THIS_WEEK_OBS.map(obs => <ObservationItem key={obs.id} {...obs} />)}
            </CollapsibleCard>

            <CollapsibleCard
              title={`This Month — ${format(new Date(), 'MMMM')}`}
              subtext="Patterns and correlations"
              open={openCards.thisMonth}
              onToggle={() => setOpenCards(s => ({ ...s, thisMonth: !s.thisMonth }))}
            >
              {THIS_MONTH_OBS.map(obs => <ObservationItem key={obs.id} {...obs} />)}
            </CollapsibleCard>

            <CollapsibleCard
              title="Watch List"
              subtext="Things worth keeping an eye on"
              open={openCards.watchList}
              onToggle={() => setOpenCards(s => ({ ...s, watchList: !s.watchList }))}
            >
              {watchList.length === 0 ? (
                <p className="text-sm text-muted-foreground py-1">
                  Nothing flagged right now. That's a good sign.
                </p>
              ) : (
                watchList.map(item => (
                  <div key={item.id} className="rounded-md bg-muted/40 p-3 space-y-2">
                    <p className="text-sm leading-snug">{item.observation}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <ConfidencePill confidence={item.confidence} evidence={item.evidence} />
                      <span className="text-xs text-muted-foreground">
                        Flagged {format(new Date(item.date_flagged), 'MMM d')}
                      </span>
                    </div>
                    <div className="flex gap-2 pt-1 flex-wrap">
                      <button
                        onClick={() => dismissWatchItem(item.id)}
                        className="text-xs text-muted-foreground border rounded-full px-3 py-1 hover:bg-muted transition-colors"
                      >
                        I know about this
                      </button>
                      <button
                        onClick={() => dismissWatchItem(item.id)}
                        className="text-xs text-muted-foreground border rounded-full px-3 py-1 hover:bg-muted transition-colors"
                      >
                        This has resolved
                      </button>
                    </div>
                  </div>
                ))
              )}
            </CollapsibleCard>
          </>
        )}
      </section>

      {/* ── SECTION 3: TRENDS ── */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold">Trends</h2>

        <div className="flex gap-2">
          {([30, 60, 90] as const).map(days => (
            <button
              key={days}
              onClick={() => setSelectedDays(days)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedDays === days
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {days} days
            </button>
          ))}
        </div>

        {logsLoading ? (
          <>
            <SkeletonBlock lines={4} />
            <SkeletonBlock lines={3} />
            <SkeletonBlock lines={3} />
          </>
        ) : (
          <>
            {/* A) Most Frequent Symptoms */}
            <Collapsible
              open={trendsCards.mostFrequent}
              onOpenChange={() => setTrendsCards(s => ({ ...s, mostFrequent: !s.mostFrequent }))}
            >
              <div className="rounded-lg border bg-card overflow-hidden">
                <CollapsibleTrigger asChild>
                  <button className="flex w-full items-center justify-between p-4 text-left">
                    <div>
                      <p className="text-sm font-semibold">Most Frequent Symptoms</p>
                      <p className="text-xs text-muted-foreground">Top patterns and what's worth watching</p>
                    </div>
                    {trendsCards.mostFrequent
                      ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                      : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 pb-4 space-y-4">
                    {symptomInsights.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-1">
                        Nothing to flag this period. Keep logging to spot patterns.
                      </p>
                    ) : (
                      <>
                        <div className="space-y-4">
                          {symptomInsights.slice(0, 5).map(s => (
                            <div key={s.key} className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">{s.name}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">{s.count} days</span>
                                  <span className={`text-xs font-medium ${
                                    s.trend === 'up' ? 'text-rose-500' :
                                    s.trend === 'down' ? 'text-green-600' :
                                    'text-muted-foreground'
                                  }`}>
                                    {s.trend === 'up' ? '↑' : s.trend === 'down' ? '↓' : '→'}
                                  </span>
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {buildExplanation(s.name, s.count, selectedDays, s.trend)}
                              </p>
                            </div>
                          ))}
                        </div>

                        {symptomInsights.length > 5 && (
                          <div className="border-t pt-4 space-y-3">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Worth Watching</p>
                            {symptomInsights.slice(5, 7).map(s => (
                              <div key={s.key} className="flex items-start justify-between gap-2 opacity-70">
                                <div>
                                  <span className="text-sm">{s.name}</span>
                                  <p className="text-xs text-muted-foreground mt-0.5">Showing up but not yet a clear pattern.</p>
                                </div>
                                <span className="text-xs text-muted-foreground shrink-0">{s.count} days</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>

            {/* B) Cycle Correlation */}
            <Collapsible
              open={trendsCards.cycleCorrelation}
              onOpenChange={() => setTrendsCards(s => ({ ...s, cycleCorrelation: !s.cycleCorrelation }))}
            >
              <div className="rounded-lg border bg-card overflow-hidden">
                <CollapsibleTrigger asChild>
                  <button className="flex w-full items-center justify-between p-4 text-left">
                    <div>
                      <p className="text-sm font-semibold">Cycle Correlation</p>
                      <p className="text-xs text-muted-foreground">When symptoms cluster in your cycle</p>
                    </div>
                    {trendsCards.cycleCorrelation
                      ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                      : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 pb-4">
                    {!cycleChartPayload ? (
                      <p className="text-sm text-muted-foreground py-1">
                        Log cycle data to see how your symptoms align with your phases.
                      </p>
                    ) : (
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={cycleChartPayload.rows} barSize={14}>
                          <XAxis dataKey="phase" tick={{ fontSize: 9 }} />
                          <YAxis tick={{ fontSize: 9 }} width={18} />
                          <Tooltip contentStyle={{ fontSize: 11 }} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          {cycleChartPayload.keys.map((sym, i) => (
                            <Bar
                              key={sym.key}
                              dataKey={sym.key}
                              stackId="a"
                              fill={CHART_COLORS[i % CHART_COLORS.length]}
                              name={sym.name}
                              radius={i === cycleChartPayload.keys.length - 1 ? [2, 2, 0, 0] : undefined}
                            />
                          ))}
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>

            {/* C) What's Changed */}
            <Collapsible
              open={trendsCards.whatsChanged}
              onOpenChange={() => setTrendsCards(s => ({ ...s, whatsChanged: !s.whatsChanged }))}
            >
              <div className="rounded-lg border bg-card overflow-hidden">
                <CollapsibleTrigger asChild>
                  <button className="flex w-full items-center justify-between p-4 text-left">
                    <div>
                      <p className="text-sm font-semibold">What's Changed</p>
                      <p className="text-xs text-muted-foreground">Compared to the previous period</p>
                    </div>
                    {trendsCards.whatsChanged
                      ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                      : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 pb-4 space-y-4">
                    {!whatsChanged ? (
                      <p className="text-sm text-muted-foreground py-1">
                        Not enough data yet to compare periods.
                      </p>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <p className="text-xs font-semibold text-rose-500">Increased this period</p>
                            {whatsChanged.increased.length === 0 ? (
                              <p className="text-xs text-muted-foreground">None</p>
                            ) : whatsChanged.increased.map(item => (
                              <div key={item.key} className="flex justify-between items-center">
                                <span className="text-xs">{item.name}</span>
                                <span className="text-xs text-muted-foreground">+{item.delta} days</span>
                              </div>
                            ))}
                          </div>
                          <div className="space-y-2">
                            <p className="text-xs font-semibold text-green-600">Decreased this period</p>
                            {whatsChanged.decreased.length === 0 ? (
                              <p className="text-xs text-muted-foreground">None</p>
                            ) : whatsChanged.decreased.map(item => (
                              <div key={item.key} className="flex justify-between items-center">
                                <span className="text-xs">{item.name}</span>
                                <span className="text-xs text-muted-foreground">{item.delta} days</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {whatsChanged.newThisPeriod.length > 0 && (
                          <div className="border-t pt-3 space-y-2">
                            <p className="text-xs font-semibold text-muted-foreground">New this period</p>
                            {whatsChanged.newThisPeriod.map(item => (
                              <div key={item.key} className="flex justify-between items-center">
                                <span className="text-xs">{item.name}</span>
                                <span className="text-xs text-muted-foreground">{item.current} days</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {whatsChanged.noLongerLogged.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-semibold text-muted-foreground">No longer logged</p>
                            {whatsChanged.noLongerLogged.map(item => (
                              <div key={item.key} className="flex justify-between items-center">
                                <span className="text-xs text-muted-foreground">{item.name}</span>
                                <span className="text-xs text-muted-foreground">{item.prev} days last period</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          </>
        )}
      </section>

      {/* ── SECTION 4: FOR YOUR DOCTOR ── */}
      <section>
        <div className="rounded-lg bg-primary/5 border border-primary/20 p-5 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-primary">For your doctor</h2>
            <p className="text-sm text-foreground/80 leading-relaxed mt-2">
              The clearest picture of how you've been is in your data — patterns, frequencies, dates, your own words. Keep logging consistently, then bring this with you.
            </p>
          </div>
          <Button className="w-full" onClick={() => navigate('/doctor-report')}>
            Open your report →
          </Button>
        </div>
      </section>

      {/* Entry editor */}
      <Sheet open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <SheetContent side="bottom" className="h-[85vh] flex flex-col gap-0 p-0 rounded-t-2xl">
          <SheetHeader className="px-4 pt-5 pb-3 border-b shrink-0">
            <SheetTitle className="text-base">
              {editingThought ? 'Edit your entry' : "This week's entry"}
            </SheetTitle>
            <p className="text-sm text-muted-foreground leading-relaxed">
              "{editingThought ? editingThought.prompt_text : promptText}"
            </p>
          </SheetHeader>
          <div className="flex-1 px-4 py-4 overflow-hidden">
            <Textarea
              className="h-full resize-none text-sm"
              placeholder="Write here..."
              value={draftText}
              onChange={e => setDraftText(e.target.value)}
            />
          </div>
          {thoughtError && (
            <p className="px-4 pb-2 text-xs text-rose-500">{thoughtError}</p>
          )}
          <div className="px-4 pb-8 pt-3 border-t shrink-0">
            <Button
              className="w-full"
              onClick={handleSave}
              disabled={!draftText.trim() || thoughtsSaving}
            >
              {thoughtsSaving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Entry viewer */}
      <Sheet open={isViewerOpen} onOpenChange={setIsViewerOpen}>
        <SheetContent side="bottom" className="h-[72vh] flex flex-col gap-0 p-0 rounded-t-2xl">
          {liveViewingThought && (
            <>
              <SheetHeader className="px-4 pt-5 pb-3 border-b shrink-0">
                <SheetTitle className="text-base">
                  {format(new Date(liveViewingThought.written_at), 'MMMM d, yyyy')}
                </SheetTitle>
                <p className="text-sm text-muted-foreground italic leading-relaxed">
                  "{liveViewingThought.prompt_text}"
                </p>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto px-4 py-4">
                <p className="text-sm leading-relaxed">{liveViewingThought.entry_text}</p>
              </div>
              <div className="px-4 pb-8 pt-3 border-t shrink-0 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={liveViewingThought.include_in_doctor_report ?? false}
                      onCheckedChange={() => toggleIncludeInReport(liveViewingThought)}
                      id={`view-report-${liveViewingThought.id}`}
                    />
                    <label
                      htmlFor={`view-report-${liveViewingThought.id}`}
                      className="text-xs text-muted-foreground cursor-pointer"
                    >
                      Include in doctor report
                    </label>
                  </div>
                  {liveViewingThought.include_in_doctor_report && (
                    <span className="text-xs text-green-600">Will appear in your next report</span>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setIsViewerOpen(false);
                    openEditor(liveViewingThought);
                  }}
                >
                  Edit entry
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Insights;
