import { useState } from 'react';
import type { ReactNode } from 'react';
import { format, getWeek } from 'date-fns';
import { ChevronDown, ChevronUp, Pencil } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  Tooltip, Legend, ResponsiveContainer, ReferenceArea,
} from 'recharts';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useApp } from '@/contexts/AppContext';
import {
  energyArcData,
  sleepChartData,
  capacityWeeklyData,
  symptomFrequencyWithTrends,
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

// ── Helpers ──

function getCurrentWeekInfo() {
  const now = new Date();
  const weekNum = getWeek(now, { weekStartsOn: 1 });
  const promptIndex = (weekNum - 1) % 12;
  const weekKey = `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
  return { promptIndex, promptText: THOUGHTS_PROMPTS[promptIndex], weekKey };
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
  const { records } = useApp();

  const [openCards, setOpenCards] = useState({ thisWeek: true, thisMonth: true, watchList: true });
  const [selectedDays, setSelectedDays] = useState<30 | 60 | 90>(30);
  const [watchList, setWatchList] = useState<WatchListItem[]>(placeholderWatchList);
  const [thoughts, setThoughts] = useState<ThoughtEntry[]>(placeholderThoughts);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingThought, setEditingThought] = useState<ThoughtEntry | null>(null);
  const [draftText, setDraftText] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const { promptIndex, promptText, weekKey } = getCurrentWeekInfo();
  const currentWeekEntry = thoughts.find(t => t.week_key === weekKey);
  const pastThoughts = [...thoughts]
    .filter(t => t.week_key !== weekKey)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Chart slices
  const xInterval = Math.floor(selectedDays / 6);
  const energySlice = energyArcData.slice(-selectedDays);
  const sleepSlice = sleepChartData.slice(-selectedDays);
  const weekCount = selectedDays === 30 ? 4 : selectedDays === 60 ? 9 : 13;
  const capacitySlice = capacityWeeklyData.slice(-weekCount);

  // Lab chart data from records
  const labData: Record<string, Array<{ date: string; value: number; ref_low: number; ref_high: number; unit: string }>> = {};
  records.filter(r => r.record_type === 'lab_result').forEach(r => {
    const name = r.details.test_name as string;
    if (!labData[name]) labData[name] = [];
    labData[name].push({
      date: format(new Date(r.date), 'MMM d'),
      value: r.details.value as number,
      ref_low: r.details.ref_low as number,
      ref_high: r.details.ref_high as number,
      unit: r.details.unit as string,
    });
  });

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

  const toggleExpanded = (id: string) =>
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <div className="space-y-8 pb-4">

      {/* ── SECTION 1: AI INSIGHTS ── */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold">AI Insights</h2>

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

      {/* ── SECTION 2: TRENDS ── */}
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

        <ChartCard title="Energy through the day">
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={energySlice}>
              <XAxis dataKey="date" tick={{ fontSize: 9 }} interval={xInterval} />
              <YAxis domain={[1, 5]} tick={{ fontSize: 9 }} width={18} />
              <Tooltip contentStyle={{ fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="morning" stroke="#d97706" strokeWidth={2} dot={false} name="Morning" />
              <Line type="monotone" dataKey="midday" stroke="#e07a5f" strokeWidth={2} dot={false} name="Midday" />
              <Line type="monotone" dataKey="evening" stroke="#6366f1" strokeWidth={2} dot={false} name="Evening" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Sleep">
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={sleepSlice}>
              <XAxis dataKey="date" tick={{ fontSize: 9 }} interval={xInterval} />
              <YAxis yAxisId="left" domain={[3, 10]} tick={{ fontSize: 9 }} width={22} />
              <YAxis yAxisId="right" orientation="right" domain={[1, 5]} tick={{ fontSize: 9 }} width={22} />
              <Tooltip contentStyle={{ fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line yAxisId="left" type="monotone" dataKey="hours" stroke="#b45309" strokeWidth={2} dot={false} name="Hours slept" />
              <Line yAxisId="right" type="monotone" dataKey="quality" stroke="#0891b2" strokeWidth={2} dot={false} name="Sleep quality" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="How your days have been">
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={capacitySlice} barSize={18}>
              <XAxis dataKey="week" tick={{ fontSize: 9 }} interval={0} angle={-30} textAnchor="end" height={40} />
              <YAxis tick={{ fontSize: 9 }} width={18} />
              <Tooltip contentStyle={{ fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="full" stackId="a" fill="#6fac63" name="Full days" />
              <Bar dataKey="reduced" stackId="a" fill="#f59e0b" name="Reduced" />
              <Bar dataKey="rest" stackId="a" fill="#f4a261" name="Rest days" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Most frequent symptoms">
          <div className="space-y-2.5">
            {symptomFrequencyWithTrends.slice(0, 6).map(s => (
              <div key={s.name} className="flex items-center gap-2">
                <span className="text-xs w-28 shrink-0 text-muted-foreground">{s.name}</span>
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div
                    className="bg-primary/80 h-2 rounded-full transition-all"
                    style={{ width: `${(s.count / 15) * 100}%` }}
                  />
                </div>
                <span className="text-xs w-5 text-right text-muted-foreground">{s.count}</span>
                <span className="w-4 text-center">
                  {s.trend === 'up'
                    ? <span className="text-xs text-rose-500">↑</span>
                    : s.trend === 'down'
                    ? <span className="text-xs text-green-600">↓</span>
                    : <span className="text-xs text-muted-foreground">→</span>}
                </span>
              </div>
            ))}
          </div>
        </ChartCard>

        {Object.keys(labData).length > 0 ? (
          Object.entries(labData).map(([name, entries]) => (
            <ChartCard key={name} title={`Lab trends — ${name}`}>
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={entries}>
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 9 }} width={30} domain={['auto', 'auto']} />
                  <Tooltip contentStyle={{ fontSize: 11 }} />
                  <ReferenceArea
                    y1={entries[0].ref_low}
                    y2={entries[0].ref_high}
                    fill="hsl(var(--accent))"
                    fillOpacity={0.2}
                  />
                  <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} name={name} />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-[10px] text-muted-foreground mt-1">
                Reference range: {entries[0].ref_low}–{entries[0].ref_high} {entries[0].unit}
              </p>
            </ChartCard>
          ))
        ) : (
          <ChartCard title="Lab trends">
            <p className="text-sm text-muted-foreground">
              Add lab results in Records to see your values over time.
            </p>
          </ChartCard>
        )}
      </section>

      {/* ── SECTION 3: THOUGHTS ── */}
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
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Previous entries</p>
            {pastThoughts.map(thought => {
              const isExpanded = expandedIds.has(thought.id);
              return (
                <div key={thought.id} className="rounded-lg border bg-card p-4 space-y-2">
                  <p className="text-xs italic text-muted-foreground">"{thought.prompt_text}"</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(thought.date), 'MMMM d, yyyy')}
                  </p>
                  <p
                    className={`text-sm leading-relaxed cursor-pointer ${!isExpanded ? 'line-clamp-2' : ''}`}
                    onClick={() => toggleExpanded(thought.id)}
                  >
                    {thought.text}
                  </p>
                  {!isExpanded && (
                    <button
                      onClick={() => toggleExpanded(thought.id)}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Read more
                    </button>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={thought.include_in_report}
                        onCheckedChange={() => toggleIncludeInReport(thought.id)}
                        id={`report-${thought.id}`}
                      />
                      <label
                        htmlFor={`report-${thought.id}`}
                        className="text-xs text-muted-foreground cursor-pointer"
                      >
                        Include in doctor report
                      </label>
                    </div>
                    {thought.include_in_report && (
                      <span className="text-xs text-green-600">Will appear in your next report</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
    </div>
  );
};

export default Insights;
