import { useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  format, getWeek,
  startOfMonth, endOfMonth, eachDayOfInterval,
  startOfWeek, endOfWeek, isSameDay, isSameMonth,
  addMonths, subMonths,
} from 'date-fns';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Pencil } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  placeholderWatchList,
  placeholderThoughts,
} from '@/data/placeholder';
import type { ThoughtEntry, WatchListItem } from '@/data/types';

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
  noticing: { label: 'Just noticing', className: 'bg-blue-100 text-blue-700' },
  watching: { label: 'Worth watching', className: 'bg-amber-100 text-amber-700' },
  strong: { label: 'Strong pattern', className: 'bg-red-100 text-red-700' },
} as const;

const vsLastMonthConfig = {
  better: { label: '↑ Better', className: 'text-green-600' },
  similar: { label: '→ Similar', className: 'text-muted-foreground' },
  worse: { label: '↓ Worse', className: 'text-rose-500' },
} as const;

// ── Placeholder observation data ──

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

// ── Trends placeholder data ──

const SYMPTOM_INSIGHTS: Array<{
  name: string;
  count: number;
  trend: 'up' | 'stable' | 'down';
  explanation?: string;
}> = [
  {
    name: 'Brain fog',
    count: 14,
    trend: 'up',
    explanation: 'Brain fog has been your most frequent symptom this period, appearing on 14 of 30 days. It clusters in the mornings and on days following less than 6 hours of sleep. Worth flagging to your doctor if this continues.',
  },
  {
    name: 'Joint stiffness',
    count: 12,
    trend: 'stable',
    explanation: 'Joint stiffness has appeared consistently across the month, averaging 3 days per week. It tends to be worse in the first half of the day and improves with movement. Stable compared to last period.',
  },
  {
    name: 'Fatigue',
    count: 11,
    trend: 'down',
    explanation: 'Fatigue is your third most logged symptom but has decreased since last month. It correlates strongly with your pre-period phase and days with disrupted sleep. A positive trend overall.',
  },
  {
    name: 'Anxiety',
    count: 9,
    trend: 'up',
    explanation: 'Anxiety has increased compared to the previous period, appearing on 9 of 30 days. It clusters in the week before your period and on high-symptom days. This pattern is worth tracking closely.',
  },
  {
    name: 'Pelvic heaviness',
    count: 8,
    trend: 'stable',
    explanation: 'Pelvic heaviness has been steady this month, concentrated in the pre-period and period phases. It appears alongside bloating on 6 of those days, suggesting a hormonal connection.',
  },
  { name: 'Bloating', count: 7, trend: 'down' },
  { name: 'Headaches', count: 5, trend: 'stable' },
];

const CYCLE_CORRELATION_DATA = [
  { phase: 'Pre-period', fatigue: 8, brainFog: 9, bloating: 7, cramps: 6 },
  { phase: 'Period',     fatigue: 6, brainFog: 5, bloating: 5, cramps: 8 },
  { phase: 'Mid-cycle',  fatigue: 2, brainFog: 3, bloating: 2, cramps: 1 },
  { phase: 'Post-period',fatigue: 3, brainFog: 4, bloating: 3, cramps: 2 },
];

const WHATS_CHANGED = {
  increased: [
    { name: 'Brain fog',       delta: 4 },
    { name: 'Anxiety',         delta: 3 },
    { name: 'Joint stiffness', delta: 2 },
  ],
  decreased: [
    { name: 'Fatigue',  delta: -3 },
    { name: 'Bloating', delta: -2 },
  ],
  newThisPeriod: [
    { name: 'Pelvic heaviness', count: 8 },
  ],
  noLongerLogged: [
    { name: 'Nausea',    lastCount: 4 },
    { name: 'Insomnia',  lastCount: 3 },
  ],
};

// ── Helpers ──

function getCurrentWeekInfo() {
  const now = new Date();
  const weekNum = getWeek(now, { weekStartsOn: 1 });
  const promptIndex = (weekNum - 1) % 12;
  const weekKey = `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
  return { promptIndex, promptText: THOUGHTS_PROMPTS[promptIndex], weekKey };
}

function getCalendarDays(monthDate: Date) {
  const start = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
}

// ── Sub-components ──

function ConfidencePill({
  confidence,
  evidence,
}: {
  confidence: keyof typeof confidenceConfig;
  evidence: string;
}) {
  const [open, setOpen] = useState(false);
  const cfg = confidenceConfig[confidence];
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}>
          {cfg.label}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2.5 text-xs leading-relaxed">
        {evidence}
      </PopoverContent>
    </Popover>
  );
}

function CollapsibleCard({
  title,
  subtext,
  open,
  onToggle,
  children,
}: {
  title: string;
  subtext: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
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

function ObservationItem({
  text,
  confidence,
  evidence,
  vsLastMonth,
}: {
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

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="text-sm font-semibold mb-3">{title}</h3>
      {children}
    </div>
  );
}

// ── Main component ──

const Insights = () => {
  const navigate = useNavigate();
  const [openCards, setOpenCards] = useState({ previousThoughts: false, thisWeek: true, thisMonth: false, watchList: false });
  const [trendsCards, setTrendsCards] = useState({ cycleCorrelation: false, whatsChanged: false });
  const [selectedDays, setSelectedDays] = useState<30 | 60 | 90>(30);
  const [watchList, setWatchList] = useState<WatchListItem[]>(placeholderWatchList);
  const [thoughts, setThoughts] = useState<ThoughtEntry[]>(placeholderThoughts);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingThought, setEditingThought] = useState<ThoughtEntry | null>(null);
  const [draftText, setDraftText] = useState('');
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewingThought, setViewingThought] = useState<ThoughtEntry | null>(null);

  const { promptIndex, promptText, weekKey } = getCurrentWeekInfo();
  const currentWeekEntry = thoughts.find(t => t.week_key === weekKey);
  const pastThoughts = [...thoughts]
    .filter(t => t.week_key !== weekKey)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Calendar
  const calendarDays = getCalendarDays(calendarMonth);
  const entryByDate = new Map(
    thoughts.filter(t => t.week_key !== weekKey).map(t => [t.date, t])
  );
  const liveViewingThought = viewingThought
    ? (thoughts.find(t => t.id === viewingThought.id) ?? viewingThought)
    : null;

  // Handlers
  const dismissWatchItem = (id: string) =>
    setWatchList(prev => prev.filter(item => item.id !== id));

  const openEditor = (thought: ThoughtEntry | null = null) => {
    setEditingThought(thought);
    setDraftText(thought?.text ?? '');
    setIsEditorOpen(true);
  };

  const handleSave = () => {
    if (!draftText.trim()) return;
    if (editingThought) {
      setThoughts(prev => prev.map(t =>
        t.id === editingThought.id ? { ...t, text: draftText } : t
      ));
    } else {
      setThoughts(prev => [...prev, {
        id: `thought-${Date.now()}`,
        week_key: weekKey,
        prompt_index: promptIndex,
        prompt_text: promptText,
        text: draftText,
        date: format(new Date(), 'yyyy-MM-dd'),
        include_in_report: false,
      }]);
    }
    setIsEditorOpen(false);
    setDraftText('');
    setEditingThought(null);
  };

  const toggleIncludeInReport = (id: string) =>
    setThoughts(prev => prev.map(t =>
      t.id === id ? { ...t, include_in_report: !t.include_in_report } : t
    ));

  const openViewer = (thought: ThoughtEntry) => {
    setViewingThought(thought);
    setIsViewerOpen(true);
  };

  return (
    <div className="space-y-8 pb-4">

      {/* ── SECTION 1: THOUGHTS ── */}
      <section className="space-y-3">
        <div>
          <h2 className="text-xl font-bold">Thoughts</h2>
          <p className="text-xs text-muted-foreground mt-0.5">A weekly prompt, just for you.</p>
        </div>

        <div className="rounded-lg border bg-card p-4 space-y-3">
          <p className="text-sm font-medium leading-relaxed">"{promptText}"</p>
          {currentWeekEntry ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground leading-relaxed">{currentWeekEntry.text}</p>
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

        {pastThoughts.length > 0 && (
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
                className="rounded-full p-1 hover:bg-muted transition-colors"
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
          </CollapsibleCard>
        )}
      </section>

      {/* ── SECTION 2: WITHIN KUI ── */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold">Within Kui</h2>

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

        {/* A) Most Frequent Symptoms — always visible */}
        <div className="rounded-lg border bg-card p-4 space-y-4">
          <h3 className="text-sm font-semibold">Most Frequent Symptoms</h3>

          <div className="space-y-4">
            {SYMPTOM_INSIGHTS.slice(0, 5).map(s => (
              <div key={s.name} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{s.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{s.count} days</span>
                    <span className={`text-xs font-medium ${
                      s.trend === 'up' ? 'text-rose-500' : s.trend === 'down' ? 'text-green-600' : 'text-muted-foreground'
                    }`}>
                      {s.trend === 'up' ? '↑' : s.trend === 'down' ? '↓' : '→'}
                    </span>
                  </div>
                </div>
                {s.explanation && (
                  <p className="text-xs text-muted-foreground leading-relaxed">{s.explanation}</p>
                )}
              </div>
            ))}
          </div>

          <div className="border-t pt-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Worth Watching</p>
            {SYMPTOM_INSIGHTS.slice(5, 7).map(s => (
              <div key={s.name} className="flex items-start justify-between gap-2 opacity-70">
                <div>
                  <span className="text-sm">{s.name}</span>
                  <p className="text-xs text-muted-foreground mt-0.5">Showing up but not yet a clear pattern.</p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{s.count} days</span>
              </div>
            ))}
          </div>
        </div>

        {/* B) Cycle Correlation — collapsible, collapsed by default */}
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
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={CYCLE_CORRELATION_DATA} barSize={14}>
                    <XAxis dataKey="phase" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 9 }} width={18} />
                    <Tooltip contentStyle={{ fontSize: 11 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="fatigue"  stackId="a" fill="#f59e0b" name="Fatigue" />
                    <Bar dataKey="brainFog" stackId="a" fill="#6366f1" name="Brain fog" />
                    <Bar dataKey="bloating" stackId="a" fill="#e07a5f" name="Bloating" />
                    <Bar dataKey="cramps"   stackId="a" fill="#d97706" name="Cramps" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>

        {/* C) What's Changed — collapsible, collapsed by default */}
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
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-rose-500">Increased this period</p>
                    {WHATS_CHANGED.increased.map(item => (
                      <div key={item.name} className="flex justify-between items-center">
                        <span className="text-xs">{item.name}</span>
                        <span className="text-xs text-muted-foreground">+{item.delta} days</span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-green-600">Decreased this period</p>
                    {WHATS_CHANGED.decreased.map(item => (
                      <div key={item.name} className="flex justify-between items-center">
                        <span className="text-xs">{item.name}</span>
                        <span className="text-xs text-muted-foreground">{item.delta} days</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border-t pt-3 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">New this period</p>
                  {WHATS_CHANGED.newThisPeriod.map(item => (
                    <div key={item.name} className="flex justify-between items-center">
                      <span className="text-xs">{item.name}</span>
                      <span className="text-xs text-muted-foreground">{item.count} days</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">No longer logged</p>
                  {WHATS_CHANGED.noLongerLogged.map(item => (
                    <div key={item.name} className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">{item.name}</span>
                      <span className="text-xs text-muted-foreground">{item.lastCount} days last period</span>
                    </div>
                  ))}
                </div>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
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
          <Button
            className="w-full"
            onClick={() => navigate('/doctor-report')}
          >
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
          <div className="px-4 pb-8 pt-3 border-t shrink-0">
            <Button className="w-full" onClick={handleSave} disabled={!draftText.trim()}>
              Save
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
                  {format(new Date(liveViewingThought.date), 'MMMM d, yyyy')}
                </SheetTitle>
                <p className="text-sm text-muted-foreground italic leading-relaxed">
                  "{liveViewingThought.prompt_text}"
                </p>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto px-4 py-4">
                <p className="text-sm leading-relaxed">{liveViewingThought.text}</p>
              </div>
              <div className="px-4 pb-8 pt-3 border-t shrink-0">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={liveViewingThought.include_in_report}
                      onCheckedChange={() => toggleIncludeInReport(liveViewingThought.id)}
                      id={`view-report-${liveViewingThought.id}`}
                    />
                    <label
                      htmlFor={`view-report-${liveViewingThought.id}`}
                      className="text-xs text-muted-foreground cursor-pointer"
                    >
                      Include in doctor report
                    </label>
                  </div>
                  {liveViewingThought.include_in_report && (
                    <span className="text-xs text-green-600">Will appear in your next report</span>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Insights;
