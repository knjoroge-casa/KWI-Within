import { useState, useEffect, useCallback, ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { format, addDays, subDays, isToday, isYesterday, parseISO } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Database } from '@/lib/database.types';

/* ── DB type aliases ─────────────────────────────────────────────────────── */

type DBEnums = Database['public']['Enums'];
type Severity4 = DBEnums['severity_4'];
type EnergyRow = Database['public']['Tables']['log_energy']['Row'];
type SleepRow = Database['public']['Tables']['log_sleep']['Row'];
type MoodRow = Database['public']['Tables']['log_mood']['Row'];
type BodyRow = Database['public']['Tables']['log_body']['Row'];
type CycleRow = Database['public']['Tables']['log_cycle']['Row'];
type AppetiteRow = Database['public']['Tables']['log_appetite']['Row'];
type SkinHairRow = Database['public']['Tables']['log_skin_hair']['Row'];
type ActivityRow = Database['public']['Tables']['log_activity']['Row'];
type SubstancesRow = Database['public']['Tables']['log_substances']['Row'];
type WhatsNewRow = Database['public']['Tables']['log_whats_new']['Row'];
type NotesRow = Database['public']['Tables']['log_notes']['Row'];

/* ── Value-mapping helpers ───────────────────────────────────────────────── */

type EnergyVal = 'dead' | 'low' | 'okay' | 'good' | 'charged';
const ENERGY_TO_SCORE: Record<EnergyVal, number> = { dead: 1, low: 2, okay: 3, good: 4, charged: 5 };
const SCORE_TO_ENERGY: Record<number, EnergyVal> = { 1: 'dead', 2: 'low', 3: 'okay', 4: 'good', 5: 'charged' };

function eScore(v: EnergyVal | null): number | null { return v ? ENERGY_TO_SCORE[v] : null; }
function eVal(n: number | null): EnergyVal | null { return n ? (SCORE_TO_ENERGY[n] ?? null) : null; }

type SleepQualVal = 'terrible' | 'poor' | 'okay' | 'good' | 'deep';
const SLEEP_TO_SCORE: Record<SleepQualVal, number> = { terrible: 1, poor: 2, okay: 3, good: 4, deep: 5 };
const SCORE_TO_SLEEP: Record<number, SleepQualVal> = { 1: 'terrible', 2: 'poor', 3: 'okay', 4: 'good', 5: 'deep' };
function sqScore(v: SleepQualVal | null): number | null { return v ? SLEEP_TO_SCORE[v] : null; }
function sqVal(n: number | null): SleepQualVal | null { return n ? (SCORE_TO_SLEEP[n] ?? null) : null; }

type MoodEmoji = '😔' | '🙁' | '😐' | '🙂' | '😄';
const EMOJI_TO_SCORE: Record<MoodEmoji, number> = { '😔': 1, '🙁': 2, '😐': 3, '🙂': 4, '😄': 5 };
const SCORE_TO_EMOJI: Record<number, MoodEmoji> = { 1: '😔', 2: '🙁', 3: '😐', 4: '🙂', 5: '😄' };
function mScore(v: MoodEmoji | null): number | null { return v ? EMOJI_TO_SCORE[v] : null; }
function mEmoji(n: number | null): MoodEmoji | null { return n ? (SCORE_TO_EMOJI[n] ?? null) : null; }

function mapCapacity(v: 'full' | 'got_through' | 'empty' | 'rest' | null): DBEnums['functional_capacity'] | null {
  if (!v) return null;
  return v === 'full' ? 'full' : v === 'rest' ? 'rest' : 'reduced';
}
function unCapacity(v: DBEnums['functional_capacity'] | null): 'full' | 'got_through' | 'empty' | 'rest' | null {
  if (!v) return null;
  return v === 'full' ? 'full' : v === 'rest' ? 'rest' : 'got_through';
}

function mapCrash(v: 'none' | 'morning' | 'after_lunch' | 'late_afternoon' | 'evening' | null): DBEnums['energy_crash_time'] | null {
  if (!v) return null;
  const m: Record<string, DBEnums['energy_crash_time']> = { none: 'none', morning: 'morning', after_lunch: 'midday', late_afternoon: 'afternoon', evening: 'evening' };
  return m[v] ?? null;
}
function unCrash(v: DBEnums['energy_crash_time'] | null): 'none' | 'morning' | 'after_lunch' | 'late_afternoon' | 'evening' | null {
  if (!v) return null;
  const m: Record<string, 'none' | 'morning' | 'after_lunch' | 'late_afternoon' | 'evening'> = { none: 'none', morning: 'morning', midday: 'after_lunch', afternoon: 'late_afternoon', evening: 'evening' };
  return m[v] ?? null;
}

function mapRestHelped(v: 'yes' | 'somewhat' | 'no' | null): DBEnums['rest_helped'] | null {
  if (!v) return null;
  return v === 'yes' ? 'yes' : v === 'no' ? 'no' : 'partial';
}
function unRestHelped(v: DBEnums['rest_helped'] | null): 'yes' | 'somewhat' | 'no' | null {
  if (!v) return null;
  return v === 'yes' ? 'yes' : v === 'no' ? 'no' : v === 'partial' ? 'somewhat' : null;
}

function mapFeltRested(v: 'yes' | 'kind_of' | 'no' | null): DBEnums['rested_on_waking'] | null {
  if (!v) return null;
  return v === 'yes' ? 'yes' : v === 'kind_of' ? 'kind_of' : 'not_at_all';
}
function unFeltRested(v: DBEnums['rested_on_waking'] | null): 'yes' | 'kind_of' | 'no' | null {
  if (!v) return null;
  return v === 'yes' ? 'yes' : v === 'kind_of' ? 'kind_of' : 'no';
}

function mapNightSweats(v: 'none' | 'mild' | 'woke_me' | null): Severity4 | null {
  if (!v) return null;
  return v === 'none' ? 'none' : v === 'mild' ? 'mild' : 'moderate';
}
function unNightSweats(v: Severity4 | null): 'none' | 'mild' | 'woke_me' | null {
  if (!v) return null;
  return v === 'none' ? 'none' : v === 'mild' ? 'mild' : 'woke_me';
}

function mapAnxiety(v: 'none' | 'hum' | 'noticeable' | 'hard_to_shake' | null): Severity4 | null {
  if (!v) return null;
  return v === 'none' ? 'none' : v === 'hum' ? 'mild' : v === 'noticeable' ? 'moderate' : 'severe';
}
function unAnxiety(v: Severity4 | null): 'none' | 'hum' | 'noticeable' | 'hard_to_shake' | null {
  if (!v) return null;
  return v === 'none' ? 'none' : v === 'mild' ? 'hum' : v === 'moderate' ? 'noticeable' : 'hard_to_shake';
}

function mapIrrit(v: 'none' | 'mild' | 'a_lot' | 'dont_talk' | null): Severity4 | null {
  if (!v) return null;
  return v === 'none' ? 'none' : v === 'mild' ? 'mild' : v === 'a_lot' ? 'moderate' : 'severe';
}
function unIrrit(v: Severity4 | null): 'none' | 'mild' | 'a_lot' | 'dont_talk' | null {
  if (!v) return null;
  return v === 'none' ? 'none' : v === 'mild' ? 'mild' : v === 'moderate' ? 'a_lot' : 'dont_talk';
}

function mapFog(v: 'sharp' | 'cloudy' | 'foggy' | 'cant_find_words' | null): Severity4 | null {
  if (!v) return null;
  return v === 'sharp' ? 'none' : v === 'cloudy' ? 'mild' : v === 'foggy' ? 'moderate' : 'severe';
}
function unFog(v: Severity4 | null): 'sharp' | 'cloudy' | 'foggy' | 'cant_find_words' | null {
  if (!v) return null;
  return v === 'none' ? 'sharp' : v === 'mild' ? 'cloudy' : v === 'moderate' ? 'foggy' : 'cant_find_words';
}

function mapMotivation(v: 'ready' | 'push' | 'struggled' | 'couldnt_start' | null): DBEnums['motivation_level'] | null {
  if (!v) return null;
  return v === 'push' ? 'pushed' : v as DBEnums['motivation_level'];
}
function unMotivation(v: DBEnums['motivation_level'] | null): 'ready' | 'push' | 'struggled' | 'couldnt_start' | null {
  if (!v) return null;
  return v === 'pushed' ? 'push' : v as 'ready' | 'struggled' | 'couldnt_start';
}

function mapScreen(v: 'normal' | 'more' | 'doom_scroll' | 'numb' | null): DBEnums['screen_behaviour'] | null {
  if (!v) return null;
  return v === 'more' ? 'more_than_usual' : v === 'doom_scroll' ? 'doom_scrolling' : v as DBEnums['screen_behaviour'];
}
function unScreen(v: DBEnums['screen_behaviour'] | null): 'normal' | 'more' | 'doom_scroll' | 'numb' | null {
  if (!v) return null;
  return v === 'more_than_usual' ? 'more' : v === 'doom_scrolling' ? 'doom_scroll' : v as 'normal' | 'numb';
}

function mapSocialE(v: 'wanted_people' | 'either_way' | 'needed_quiet' | 'antisocial' | null): DBEnums['social_energy'] | null {
  if (!v) return null;
  return v === 'antisocial' ? 'avoided' : v as DBEnums['social_energy'];
}
function unSocialE(v: DBEnums['social_energy'] | null): 'wanted_people' | 'either_way' | 'needed_quiet' | 'antisocial' | null {
  if (!v) return null;
  return v === 'avoided' ? 'antisocial' : v as 'wanted_people' | 'either_way' | 'needed_quiet';
}

function mapSocialM(v: 'yes' | 'more_than_wanted' | 'less_than_wanted' | null): DBEnums['social_match'] | null {
  if (!v) return null;
  return v === 'yes' ? 'matched' : v as DBEnums['social_match'];
}
function unSocialM(v: DBEnums['social_match'] | null): 'yes' | 'more_than_wanted' | 'less_than_wanted' | null {
  if (!v) return null;
  return v === 'matched' ? 'yes' : v as 'more_than_wanted' | 'less_than_wanted';
}

function sev(v: string | null, map: Record<string, Severity4>): Severity4 | null {
  return v ? (map[v] ?? null) : null;
}
function unsev(v: Severity4 | null, map: Record<Severity4, string>): string | null {
  return v ? (map[v] ?? null) : null;
}

const HEADACHE_MAP: Record<string, Severity4> = { none: 'none', mild: 'mild', significant: 'moderate', migraine: 'severe' };
const HEADACHE_REV: Record<Severity4, string> = { none: 'none', mild: 'mild', moderate: 'significant', severe: 'migraine' };
const JOINT_MAP: Record<string, Severity4> = { none: 'none', mild: 'mild', noticeable: 'moderate', difficult: 'severe' };
const JOINT_REV: Record<Severity4, string> = { none: 'none', mild: 'mild', moderate: 'noticeable', severe: 'difficult' };
const MUSCLE_MAP: Record<string, Severity4> = { none: 'none', mild: 'mild', noticeable: 'moderate' };
const MUSCLE_REV: Record<Severity4, string> = { none: 'none', mild: 'mild', moderate: 'noticeable', severe: 'noticeable' };
const STIFF_MAP: Record<string, Severity4> = { none: 'none', loosened: 'mild', while: 'moderate', midday: 'severe' };
const STIFF_REV: Record<Severity4, string> = { none: 'none', mild: 'loosened', moderate: 'while', severe: 'midday' };
const PELVIC_MAP: Record<string, Severity4> = { none: 'none', mild: 'mild', noticeable: 'moderate', significant: 'severe' };
const PELVIC_REV: Record<Severity4, string> = { none: 'none', mild: 'mild', moderate: 'noticeable', severe: 'significant' };
const LBACK_MAP: Record<string, Severity4> = { fine: 'none', mild: 'mild', noticeable: 'moderate', bad: 'severe' };
const LBACK_REV: Record<Severity4, string> = { none: 'fine', mild: 'mild', moderate: 'noticeable', severe: 'bad' };
const CRAMP_MAP: Record<string, Severity4> = { none: 'none', mild: 'mild', moderate: 'moderate', bad: 'severe' };
const CRAMP_REV: Record<Severity4, string> = { none: 'none', mild: 'mild', moderate: 'moderate', severe: 'bad' };
const BLOA_MAP: Record<string, Severity4> = { none: 'none', mild: 'mild', noticeable: 'moderate', uncomfortable: 'severe' };
const BLOA_REV: Record<Severity4, string> = { none: 'none', mild: 'mild', moderate: 'noticeable', severe: 'uncomfortable' };

function mapCyclePhase(v: 'post_period' | 'mid_cycle' | 'pre_period' | 'not_sure' | null): DBEnums['cycle_phase'] | null {
  if (!v) return null;
  const m: Record<string, DBEnums['cycle_phase']> = { post_period: 'follicular', mid_cycle: 'ovulatory', pre_period: 'luteal', not_sure: 'unknown' };
  return m[v] ?? null;
}
function unCyclePhase(v: DBEnums['cycle_phase'] | null): 'post_period' | 'mid_cycle' | 'pre_period' | 'not_sure' | null {
  if (!v) return null;
  const m: Record<string, 'post_period' | 'mid_cycle' | 'pre_period' | 'not_sure'> = { follicular: 'post_period', menstrual: 'post_period', ovulatory: 'mid_cycle', luteal: 'pre_period', unknown: 'not_sure' };
  return m[v] ?? null;
}

function mapAppetite(v: 'none' | 'low' | 'normal' | 'more' | 'couldnt_stop' | null): number | null {
  if (!v) return null;
  return { none: 1, low: 2, normal: 3, more: 4, couldnt_stop: 5 }[v] ?? null;
}
function unAppetite(n: number | null): 'none' | 'low' | 'normal' | 'more' | 'couldnt_stop' | null {
  if (!n) return null;
  return ([null, 'none', 'low', 'normal', 'more', 'couldnt_stop'] as const)[n] ?? null;
}

function mapSkin(v: 'clear' | 'few_spots' | 'breaking_out' | 'cystic' | 'irritated' | null): DBEnums['skin_state'] | null {
  if (!v) return null;
  return v === 'few_spots' ? 'one_two_spots' : v as DBEnums['skin_state'];
}
function unSkin(v: DBEnums['skin_state'] | null): 'clear' | 'few_spots' | 'breaking_out' | 'cystic' | 'irritated' | null {
  if (!v) return null;
  return v === 'one_two_spots' ? 'few_spots' : v as 'clear' | 'breaking_out' | 'cystic' | 'irritated';
}

function mapShed(v: 'normal' | 'more' | 'a_lot_more' | null): DBEnums['shedding_level'] | null {
  if (!v) return null;
  return v === 'more' ? 'more_than_usual' : v as DBEnums['shedding_level'];
}
function unShed(v: DBEnums['shedding_level'] | null): 'normal' | 'more' | 'a_lot_more' | null {
  if (!v) return null;
  return v === 'more_than_usual' ? 'more' : v as 'normal' | 'a_lot_more';
}

function mapExercised(v: 'yes' | 'no' | 'planned_but_didnt' | null): DBEnums['exercise_status'] | null {
  if (!v) return null;
  return v === 'planned_but_didnt' ? 'planned_didnt' : v as DBEnums['exercise_status'];
}
function unExercised(v: DBEnums['exercise_status'] | null): 'yes' | 'no' | 'planned_but_didnt' | null {
  if (!v) return null;
  return v === 'planned_didnt' ? 'planned_but_didnt' : v as 'yes' | 'no';
}

function mapIntensity(v: 'easy' | 'moderate' | 'hard' | 'left_it' | null): DBEnums['intensity_level'] | null {
  if (!v) return null;
  return v === 'left_it' ? 'destroyed' : v as DBEnums['intensity_level'];
}
function unIntensity(v: DBEnums['intensity_level'] | null): 'easy' | 'moderate' | 'hard' | 'left_it' | null {
  if (!v) return null;
  return v === 'destroyed' ? 'left_it' : v as 'easy' | 'moderate' | 'hard';
}

function mapBodyDuring(v: 'great' | 'got_through' | 'modify' | 'stop' | null): DBEnums['body_during'] | null {
  if (!v) return null;
  return v === 'modify' ? 'modified' : v === 'stop' ? 'stopped' : v as DBEnums['body_during'];
}
function unBodyDuring(v: DBEnums['body_during'] | null): 'great' | 'got_through' | 'modify' | 'stop' | null {
  if (!v) return null;
  return v === 'modified' ? 'modify' : v === 'stopped' ? 'stop' : v as 'great' | 'got_through';
}

function mapMindGoingIn(v: 'motivated' | 'neutral' | 'push' | 'didnt_want' | null): DBEnums['motivation_level'] | null {
  if (!v) return null;
  const m: Record<string, DBEnums['motivation_level']> = { motivated: 'ready', neutral: 'pushed', push: 'struggled', didnt_want: 'couldnt_start' };
  return m[v] ?? null;
}
function unMindGoingIn(v: DBEnums['motivation_level'] | null): 'motivated' | 'neutral' | 'push' | 'didnt_want' | null {
  if (!v) return null;
  const m: Record<string, 'motivated' | 'neutral' | 'push' | 'didnt_want'> = { ready: 'motivated', pushed: 'neutral', struggled: 'push', couldnt_start: 'didnt_want' };
  return m[v] ?? null;
}

function mapMindBody(v: 'both' | 'mind_not_body' | 'body_not_mind' | 'neither' | null): DBEnums['mind_body_alignment'] | null {
  if (!v) return null;
  const m: Record<string, DBEnums['mind_body_alignment']> = { both: 'both_ready', mind_not_body: 'mind_ready', body_not_mind: 'body_ready', neither: 'neither' };
  return m[v] ?? null;
}
function unMindBody(v: DBEnums['mind_body_alignment'] | null): 'both' | 'mind_not_body' | 'body_not_mind' | 'neither' | null {
  if (!v) return null;
  const m: Record<string, 'both' | 'mind_not_body' | 'body_not_mind' | 'neither'> = { both_ready: 'both', mind_ready: 'mind_not_body', body_ready: 'body_not_mind', neither: 'neither' };
  return m[v] ?? null;
}

function mapAlcohol(v: 'none' | '1-2' | '3-4' | '4_plus' | null): DBEnums['alcohol_units'] | null {
  if (!v) return null;
  return v === '1-2' ? '1_2' : v === '3-4' ? '3_4' : v as DBEnums['alcohol_units'];
}
function unAlcohol(v: DBEnums['alcohol_units'] | null): 'none' | '1-2' | '3-4' | '4_plus' | null {
  if (!v) return null;
  return v === '1_2' ? '1-2' : v === '3_4' ? '3-4' : v as 'none' | '4_plus';
}

function mapMorningAfter(v: 'fine' | 'slightly_off' | 'rough' | 'regrets' | null): DBEnums['next_morning_feel'] | null {
  if (!v) return null;
  return v === 'regrets' ? 'never_again' : v as DBEnums['next_morning_feel'];
}
function unMorningAfter(v: DBEnums['next_morning_feel'] | null): 'fine' | 'slightly_off' | 'rough' | 'regrets' | null {
  if (!v) return null;
  return v === 'never_again' ? 'regrets' : v as 'fine' | 'slightly_off' | 'rough';
}

/* ── Primitives ──────────────────────────────────────────────────────────── */

type Opt<T extends string> = { value: T; label: string };

function Chips<T extends string>({ value, onChange, options, size = 'md' }: {
  value: T | null | undefined; onChange: (v: any) => void; options: Opt<T>[]; size?: 'sm' | 'md';
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(o => {
        const active = value === o.value;
        return (
          <button key={o.value} type="button" onClick={() => onChange(active ? null : o.value)}
            className={cn('rounded-full border transition-colors',
              size === 'sm' ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs',
              active ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border hover:bg-muted text-foreground/80')}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function MultiChips<T extends string>({ value, onChange, options }: {
  value: T[]; onChange: (v: T[]) => void; options: Opt<T>[];
}) {
  const toggle = (v: T) => onChange(value.includes(v) ? value.filter(x => x !== v) : [...value, v]);
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(o => {
        const active = value.includes(o.value);
        return (
          <button key={o.value} type="button" onClick={() => toggle(o.value)}
            className={cn('rounded-full border px-3 py-1.5 text-xs transition-colors',
              active ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border hover:bg-muted text-foreground/80')}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-foreground/70">{label}</p>
      {children}
    </div>
  );
}

type Timing = 'Morning' | 'Evening' | 'Anytime';

function TimingBadge({ timing }: { timing: Timing }) {
  return (
    <span className="ml-2 text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full leading-none">
      {timing}
    </span>
  );
}

function LogSection({ title, timing, description, children, defaultOpen = false }: {
  title: string; timing?: Timing; description?: string; children: ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border bg-card p-4 hover:bg-muted/50 transition-colors">
        <div className="text-left">
          <div className="flex items-center">
            <p className="text-sm font-semibold">{title}</p>
            {timing && <TimingBadge timing={timing} />}
          </div>
          {description && <p className="text-xs text-muted-foreground italic">{description}</p>}
        </div>
        <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform shrink-0', open && 'rotate-180')} />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-1 rounded-lg border bg-card p-4 space-y-5">{children}</CollapsibleContent>
    </Collapsible>
  );
}

function UnsavedDialog({ title, message, saving, onSave, onDiscard, onCancel }: {
  title: string; message: string; saving?: boolean;
  onSave: () => void; onDiscard: () => void; onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 pb-6 px-4">
      <div className="bg-card border rounded-xl p-5 w-full max-w-sm space-y-4 shadow-xl">
        <div>
          <p className="font-semibold text-sm">{title}</p>
          <p className="text-xs text-muted-foreground mt-1">{message}</p>
        </div>
        <div className="flex flex-col gap-2">
          <Button onClick={onSave} disabled={saving} className="w-full" size="sm">
            {saving && <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />}
            Save
          </Button>
          <Button variant="outline" onClick={onDiscard} disabled={saving} className="w-full" size="sm">Discard</Button>
          <Button variant="ghost" onClick={onCancel} disabled={saving} className="w-full" size="sm">Cancel</Button>
        </div>
      </div>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */

const energyOpts: Opt<EnergyVal>[] = [
  { value: 'dead', label: 'Dead' }, { value: 'low', label: 'Low' }, { value: 'okay', label: 'Okay' },
  { value: 'good', label: 'Good' }, { value: 'charged', label: 'Charged' },
];

const DailyLog = () => {
  const { user, profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const dateParam = searchParams.get('date');
  const displayDate = dateParam ? parseISO(dateParam) : new Date();
  const dateStr = format(displayDate, 'yyyy-MM-dd');
  const viewingToday = isToday(displayDate);
  const viewingYesterday = isYesterday(displayDate);
  const dateLabel = viewingToday ? 'Today' : viewingYesterday ? 'Yesterday' : format(displayDate, 'd MMMM yyyy');

  /* ── Fetch / save state ── */
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [nothingToSave, setNothingToSave] = useState(false);
  const [logId, setLogId] = useState<string | null>(null);

  /* ── Unsaved-changes dialog ── */
  const [savedSnapshot, setSavedSnapshot] = useState<string>('');
  const [pendingDateStr, setPendingDateStr] = useState<string | null>(null);
  const [dialogSaving, setDialogSaving] = useState(false);

  /* ── Profile-driven visibility ── */
  const showFibroid = !!profile && profile.has_fibroids !== 'no' && profile.has_fibroids !== null;
  const showMovement = profile?.exercises_regularly === true;
  const [showHidden, setShowHidden] = useState(false);

  /* ── Energy & Function ── */
  const [morningEnergy, setMorningEnergy] = useState<EnergyVal | null>(null);
  const [middayEnergy, setMiddayEnergy] = useState<EnergyVal | null>(null);
  const [eveningEnergy, setEveningEnergy] = useState<EnergyVal | null>(null);
  const [capacity, setCapacity] = useState<'full' | 'got_through' | 'empty' | 'rest' | null>(null);
  const [crashTime, setCrashTime] = useState<'none' | 'morning' | 'after_lunch' | 'late_afternoon' | 'evening' | null>(null);
  const [restHelped, setRestHelped] = useState<'yes' | 'somewhat' | 'no' | null>(null);

  /* ── Sleep ── */
  const [hoursSlept, setHoursSlept] = useState<number | null>(null);
  const [sleepQuality, setSleepQuality] = useState<SleepQualVal | null>(null);
  const [wokeNight, setWokeNight] = useState<'slept_through' | 'once' | 'few_times' | 'all_night' | null>(null);
  const [nightSweats, setNightSweats] = useState<'none' | 'mild' | 'woke_me' | null>(null);
  const [feltRested, setFeltRested] = useState<'yes' | 'kind_of' | 'no' | null>(null);

  /* ── Mood & Mind ── */
  const [moodEmoji, setMoodEmoji] = useState<MoodEmoji | null>(null);
  const [anxiety, setAnxiety] = useState<'none' | 'hum' | 'noticeable' | 'hard_to_shake' | null>(null);
  const [irritability, setIrritability] = useState<'none' | 'mild' | 'a_lot' | 'dont_talk' | null>(null);
  const [brainFog, setBrainFog] = useState<'sharp' | 'cloudy' | 'foggy' | 'cant_find_words' | null>(null);
  const [memory, setMemory] = useState<'fine' | 'gaps' | 'what_was_i_doing' | null>(null);
  const [motivation, setMotivation] = useState<'ready' | 'push' | 'struggled' | 'couldnt_start' | null>(null);
  const [feelingYourself, setFeelingYourself] = useState<'yes' | 'mostly' | 'not_really' | 'not_at_all' | null>(null);
  const [screenTime, setScreenTime] = useState<'normal' | 'more' | 'doom_scroll' | 'numb' | null>(null);
  const [socialEnergy, setSocialEnergy] = useState<'wanted_people' | 'either_way' | 'needed_quiet' | 'antisocial' | null>(null);
  const [socialMatch, setSocialMatch] = useState<'yes' | 'more_than_wanted' | 'less_than_wanted' | null>(null);
  const [emotionalEating, setEmotionalEating] = useState<'no' | 'a_little' | 'yes' | null>(null);

  /* ── Body ── */
  const [headache, setHeadache] = useState<'none' | 'mild' | 'significant' | 'migraine' | null>(null);
  const [headacheLoc, setHeadacheLoc] = useState<'forehead' | 'temples' | 'back' | 'behind_eyes' | 'whole_head' | null>(null);
  const [jointPain, setJointPain] = useState<'none' | 'mild' | 'noticeable' | 'difficult' | null>(null);
  const [jointAreas, setJointAreas] = useState<string[]>([]);
  const [muscleAches, setMuscleAches] = useState<'none' | 'mild' | 'noticeable' | null>(null);
  const [morningStiffness, setMorningStiffness] = useState<'none' | 'loosened' | 'while' | 'midday' | null>(null);
  const [pelvicArea, setPelvicArea] = useState<'none' | 'mild' | 'noticeable' | 'significant' | null>(null);
  const [lowerBack, setLowerBack] = useState<'fine' | 'mild' | 'noticeable' | 'bad' | null>(null);
  const [breastTenderness, setBreastTenderness] = useState<'none' | 'mild' | 'noticeable' | 'painful' | null>(null);
  const [perceivedTemp, setPerceivedTemp] = useState<'comfortable' | 'cold' | 'warm' | 'hot_flushes' | 'sweaty' | 'erratic' | null>(null);

  /* ── Cycle ── */
  const [periodStatus, setPeriodStatus] = useState<'none' | 'started' | 'ongoing' | 'ended' | 'spotting' | null>(null);
  const [flow, setFlow] = useState<'light' | 'medium' | 'heavy' | 'very_heavy' | null>(null);
  const [clotting, setClotting] = useState<'none' | 'small' | 'large' | null>(null);
  const [cramping, setCramping] = useState<'none' | 'mild' | 'moderate' | 'bad' | null>(null);
  const [cyclePhase, setCyclePhase] = useState<'post_period' | 'mid_cycle' | 'pre_period' | 'not_sure' | null>(null);

  /* ── Intimacy (no DB table — not persisted) ── */
  const [desire, setDesire] = useState<'high' | 'normal' | 'low' | 'none' | null>(null);
  const [hadSex, setHadSex] = useState<'no' | 'yes' | 'solo' | null>(null);
  const [sexFrequency, setSexFrequency] = useState<'once' | 'twice' | 'three_plus' | null>(null);
  const [sexTimeOfDay, setSexTimeOfDay] = useState<('morning' | 'afternoon' | 'evening' | 'night')[]>([]);

  /* ── Fibroid (no DB table for specifics) ── */
  const [pelvicHeaviness, setPelvicHeaviness] = useState<'none' | 'mild' | 'moderate' | 'significant' | null>(null);
  const [abdomenDistended, setAbdomenDistended] = useState<'no' | 'yes' | null>(null);
  const [urinaryUrgency, setUrinaryUrgency] = useState<'no' | 'yes' | null>(null);
  const [anaemiaSignals, setAnaemiaSignals] = useState<string[]>([]);

  /* ── Skin / Hair ── */
  const [skinToday, setSkinToday] = useState<'clear' | 'few_spots' | 'breaking_out' | 'cystic' | 'irritated' | null>(null);
  const [breakoutLocs, setBreakoutLocs] = useState<string[]>([]);
  const [skinFeel, setSkinFeel] = useState<'normal' | 'dry' | 'oily' | 'sensitive' | 'combination' | null>(null);
  const [newSkincare, setNewSkincare] = useState<'no' | 'yes' | null>(null);
  const [newSkincareDetail, setNewSkincareDetail] = useState('');
  const [hairShedding, setHairShedding] = useState<'normal' | 'more' | 'a_lot_more' | null>(null);
  const [scalp, setScalp] = useState<'fine' | 'itchy' | 'dry' | 'tender' | null>(null);

  /* ── Appetite & Digestion ── */
  const [appetite, setAppetite] = useState<'none' | 'low' | 'normal' | 'more' | 'couldnt_stop' | null>(null);
  const [cravings, setCravings] = useState<string[]>([]);
  const [cravingsDetail, setCravingsDetail] = useState('');
  const [bloating, setBloating] = useState<'none' | 'mild' | 'noticeable' | 'uncomfortable' | null>(null);
  const [digestion, setDigestion] = useState<'normal' | 'sluggish' | 'unsettled' | 'nausea' | 'both_ends' | null>(null);
  const [unusualThirst, setUnusualThirst] = useState<'no' | 'yes' | null>(null);
  const [bowelMovements, setBowelMovements] = useState<'none' | 'once_normal' | 'multiple' | 'loose' | 'hard' | 'urgent' | null>(null);

  /* ── Movement ── */
  const [exercised, setExercised] = useState<'yes' | 'no' | 'planned_but_didnt' | null>(null);
  const [exerciseTypes, setExerciseTypes] = useState<string[]>([]);
  const [duration, setDuration] = useState<number | null>(null);
  const [intensity, setIntensity] = useState<'easy' | 'moderate' | 'hard' | 'left_it' | null>(null);
  const [bodyDuring, setBodyDuring] = useState<'great' | 'got_through' | 'modify' | 'stop' | null>(null);
  const [bodyAfter, setBodyAfter] = useState<'energised' | 'fine' | 'tired' | 'wrecked' | null>(null);
  const [mindGoingIn, setMindGoingIn] = useState<'motivated' | 'neutral' | 'push' | 'didnt_want' | null>(null);
  const [mindBody, setMindBody] = useState<'both' | 'mind_not_body' | 'body_not_mind' | 'neither' | null>(null);
  const [restDayType, setRestDayType] = useState<'intentional' | 'body_said_no' | 'just_didnt' | null>(null);

  /* ── Substances ── */
  const [alcohol, setAlcohol] = useState<'none' | '1-2' | '3-4' | '4_plus' | null>(null);
  const [alcoholType, setAlcoholType] = useState<'wine' | 'beer' | 'spirits' | 'mixed' | null>(null);
  const [morningAfter, setMorningAfter] = useState<'fine' | 'slightly_off' | 'rough' | 'regrets' | null>(null);
  const [caffeine, setCaffeine] = useState<'normal' | 'more' | 'less' | 'none' | null>(null);

  /* ── What's New ── */
  const [newFood, setNewFood] = useState('');
  const [newProduct, setNewProduct] = useState('');
  const [newProductType, setNewProductType] = useState<'topical' | 'ingestible' | 'other' | null>(null);
  const [dayDifferent, setDayDifferent] = useState<'travel' | 'stress' | 'late_night' | 'routine' | 'other' | null>(null);
  const [followupFeel, setFollowupFeel] = useState<'fine' | 'off' | null>(null);
  const [followupDetail, setFollowupDetail] = useState('');

  const [notes, setNotes] = useState('');

  /* ── Snapshot / dirty detection ── */
  const getFormSnapshot = useCallback(() => ({
    morningEnergy, middayEnergy, eveningEnergy, capacity, crashTime, restHelped,
    hoursSlept, sleepQuality, wokeNight, nightSweats, feltRested,
    moodEmoji, anxiety, irritability, brainFog, memory, motivation, feelingYourself, screenTime, socialEnergy, socialMatch, emotionalEating,
    headache, headacheLoc, jointPain, jointAreas, muscleAches, morningStiffness, pelvicArea, lowerBack, breastTenderness, perceivedTemp,
    periodStatus, flow, clotting, cramping, cyclePhase,
    desire, hadSex, sexFrequency, sexTimeOfDay,
    pelvicHeaviness, abdomenDistended, urinaryUrgency, anaemiaSignals,
    skinToday, breakoutLocs, skinFeel, newSkincare, newSkincareDetail, hairShedding, scalp,
    appetite, cravings, cravingsDetail, bloating, digestion, unusualThirst, bowelMovements,
    exercised, exerciseTypes, duration, intensity, bodyDuring, bodyAfter, mindGoingIn, mindBody, restDayType,
    alcohol, alcoholType, morningAfter, caffeine,
    newFood, newProduct, newProductType, dayDifferent, followupFeel, followupDetail,
    notes,
  }), [morningEnergy, middayEnergy, eveningEnergy, capacity, crashTime, restHelped,
    hoursSlept, sleepQuality, wokeNight, nightSweats, feltRested,
    moodEmoji, anxiety, irritability, brainFog, memory, motivation, feelingYourself, screenTime, socialEnergy, socialMatch, emotionalEating,
    headache, headacheLoc, jointPain, jointAreas, muscleAches, morningStiffness, pelvicArea, lowerBack, breastTenderness, perceivedTemp,
    periodStatus, flow, clotting, cramping, cyclePhase,
    desire, hadSex, sexFrequency, sexTimeOfDay,
    pelvicHeaviness, abdomenDistended, urinaryUrgency, anaemiaSignals,
    skinToday, breakoutLocs, skinFeel, newSkincare, newSkincareDetail, hairShedding, scalp,
    appetite, cravings, cravingsDetail, bloating, digestion, unusualThirst, bowelMovements,
    exercised, exerciseTypes, duration, intensity, bodyDuring, bodyAfter, mindGoingIn, mindBody, restDayType,
    alcohol, alcoholType, morningAfter, caffeine,
    newFood, newProduct, newProductType, dayDifferent, followupFeel, followupDetail,
    notes]);

  const isDirty = JSON.stringify(getFormSnapshot()) !== savedSnapshot;

  /* ── Warn on browser close/refresh when dirty ── */
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => { if (isDirty) e.preventDefault(); };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  /* ── Reset helpers ── */
  const resetForm = useCallback(() => {
    setMorningEnergy(null); setMiddayEnergy(null); setEveningEnergy(null); setCapacity(null); setCrashTime(null); setRestHelped(null);
    setHoursSlept(null); setSleepQuality(null); setWokeNight(null); setNightSweats(null); setFeltRested(null);
    setMoodEmoji(null); setAnxiety(null); setIrritability(null); setBrainFog(null); setMemory(null); setMotivation(null);
    setFeelingYourself(null); setScreenTime(null); setSocialEnergy(null); setSocialMatch(null); setEmotionalEating(null);
    setHeadache(null); setHeadacheLoc(null); setJointPain(null); setJointAreas([]); setMuscleAches(null);
    setMorningStiffness(null); setPelvicArea(null); setLowerBack(null); setBreastTenderness(null); setPerceivedTemp(null);
    setPeriodStatus(null); setFlow(null); setClotting(null); setCramping(null); setCyclePhase(null);
    setDesire(null); setHadSex(null); setSexFrequency(null); setSexTimeOfDay([]);
    setPelvicHeaviness(null); setAbdomenDistended(null); setUrinaryUrgency(null); setAnaemiaSignals([]);
    setSkinToday(null); setBreakoutLocs([]); setSkinFeel(null); setNewSkincare(null); setNewSkincareDetail(''); setHairShedding(null); setScalp(null);
    setAppetite(null); setCravings([]); setCravingsDetail(''); setBloating(null); setDigestion(null); setUnusualThirst(null); setBowelMovements(null);
    setExercised(null); setExerciseTypes([]); setDuration(null); setIntensity(null); setBodyDuring(null); setBodyAfter(null); setMindGoingIn(null); setMindBody(null); setRestDayType(null);
    setAlcohol(null); setAlcoholType(null); setMorningAfter(null); setCaffeine(null);
    setNewFood(''); setNewProduct(''); setNewProductType(null); setDayDifferent(null); setFollowupFeel(null); setFollowupDetail('');
    setNotes('');
    setLogId(null);
  }, []);

  const populateFromDB = useCallback((
    id: string,
    e: EnergyRow | null, sl: SleepRow | null, mo: MoodRow | null, bo: BodyRow | null,
    cy: CycleRow | null, ap: AppetiteRow | null, sk: SkinHairRow | null, ac: ActivityRow | null,
    su: SubstancesRow | null, wn: WhatsNewRow | null, no: NotesRow | null,
  ) => {
    setLogId(id);
    if (e) {
      setMorningEnergy(eVal(e.morning_energy)); setMiddayEnergy(eVal(e.midday_energy)); setEveningEnergy(eVal(e.evening_energy));
      setCapacity(unCapacity(e.functional_capacity)); setCrashTime(unCrash(e.energy_crash_time)); setRestHelped(unRestHelped(e.rest_helped));
    }
    if (sl) {
      setHoursSlept(sl.hours_slept); setSleepQuality(sqVal(sl.sleep_quality)); setWokeNight(sl.woke_during_night as any);
      setNightSweats(unNightSweats(sl.night_sweats)); setFeltRested(unFeltRested(sl.felt_rested));
    }
    if (mo) {
      setMoodEmoji(mEmoji(mo.mood_score)); setAnxiety(unAnxiety(mo.anxiety)); setIrritability(unIrrit(mo.irritability));
      setBrainFog(unFog(mo.brain_fog)); setMemory(mo.memory_gaps === true ? 'gaps' : mo.memory_gaps === false ? 'fine' : null);
      setMotivation(unMotivation(mo.motivation)); setFeelingYourself(mo.feeling_like_yourself as any);
      setScreenTime(unScreen(mo.screen_behaviour)); setSocialEnergy(unSocialE(mo.social_energy)); setSocialMatch(unSocialM(mo.social_match));
      setEmotionalEating(mo.emotional_eating === true ? 'a_little' : mo.emotional_eating === false ? 'no' : null);
    }
    if (bo) {
      setHeadache(unsev(bo.headache, HEADACHE_REV) as any); setHeadacheLoc(bo.headache_location as any);
      setJointPain(unsev(bo.joint_pain, JOINT_REV) as any); setJointAreas(bo.joint_pain_areas ?? []);
      setMuscleAches(unsev(bo.muscle_aches, MUSCLE_REV) as any); setMorningStiffness(unsev(bo.morning_stiffness, STIFF_REV) as any);
      setPelvicArea(unsev(bo.pelvic_pain, PELVIC_REV) as any); setLowerBack(unsev(bo.lower_back_pain, LBACK_REV) as any);
    }
    if (cy) {
      setPeriodStatus(cy.period_status as any); setFlow(cy.flow_intensity as any);
      setClotting(cy.clotting as any); setCramping(unsev(cy.cramping, CRAMP_REV) as any);
      setCyclePhase(unCyclePhase(cy.cycle_phase));
    }
    if (ap) {
      setAppetite(unAppetite(ap.appetite_score));
      if (ap.cravings_detail) { setCravings(['specific']); setCravingsDetail(ap.cravings_detail); }
      setBloating(unsev(ap.bloating, BLOA_REV) as any); setDigestion(ap.digestion as any);
      setUnusualThirst(ap.unusual_thirst === true ? 'yes' : ap.unusual_thirst === false ? 'no' : null);
    }
    if (sk) {
      setSkinToday(unSkin(sk.skin_state)); setBreakoutLocs(sk.breakout_locations ?? []);
      setSkinFeel(sk.skin_feel as any);
      if (sk.new_skincare_product) { setNewSkincare('yes'); setNewSkincareDetail(sk.new_skincare_product); } else { setNewSkincare(null); }
      setHairShedding(unShed(sk.hair_shedding)); setScalp(sk.scalp as any);
    }
    if (ac) {
      setExercised(unExercised(ac.exercised)); setExerciseTypes(ac.exercise_types ?? []); setDuration(ac.duration_mins);
      setIntensity(unIntensity(ac.intensity)); setBodyDuring(unBodyDuring(ac.body_during)); setBodyAfter(ac.body_after as any);
      setMindGoingIn(unMindGoingIn(ac.motivation_going_in)); setMindBody(unMindBody(ac.mind_body_alignment));
      setRestDayType(ac.rest_day_type as any);
    }
    if (su) {
      setAlcohol(unAlcohol(su.alcohol)); setAlcoholType(su.alcohol_type as any);
      setMorningAfter(unMorningAfter(su.next_morning_feel)); setCaffeine(su.caffeine as any);
    }
    if (wn) {
      setNewFood(wn.new_food ?? ''); setNewProduct(wn.new_product ?? ''); setNewProductType(wn.new_product_type as any);
      setDayDifferent(wn.day_change as any);
      if (wn.followup_feel?.startsWith('off:')) {
        setFollowupFeel('off'); setFollowupDetail(wn.followup_feel.slice(4).trim());
      } else {
        setFollowupFeel(wn.followup_feel as any); setFollowupDetail('');
      }
    }
    if (no) setNotes(no.content ?? '');
  }, []);

  /* ── Load data ── */
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setSaveError(null);
      setNothingToSave(false);
      resetForm();

      const { data: logRow } = await supabase
        .from('daily_logs')
        .select('id')
        .eq('user_id', user.id)
        .eq('date', dateStr)
        .is('deleted_at', null)
        .maybeSingle();

      if (cancelled) return;

      if (!logRow) {
        setLoading(false);
        setSavedSnapshot(JSON.stringify(emptySnapshot()));
        return;
      }

      const id = logRow.id;
      const [e, sl, mo, bo, cy, ap, sk, ac, su, wn, no] = await Promise.all([
        supabase.from('log_energy').select('*').eq('log_id', id).maybeSingle().then(r => r.data),
        supabase.from('log_sleep').select('*').eq('log_id', id).maybeSingle().then(r => r.data),
        supabase.from('log_mood').select('*').eq('log_id', id).maybeSingle().then(r => r.data),
        supabase.from('log_body').select('*').eq('log_id', id).maybeSingle().then(r => r.data),
        supabase.from('log_cycle').select('*').eq('log_id', id).maybeSingle().then(r => r.data),
        supabase.from('log_appetite').select('*').eq('log_id', id).maybeSingle().then(r => r.data),
        supabase.from('log_skin_hair').select('*').eq('log_id', id).maybeSingle().then(r => r.data),
        supabase.from('log_activity').select('*').eq('log_id', id).maybeSingle().then(r => r.data),
        supabase.from('log_substances').select('*').eq('log_id', id).maybeSingle().then(r => r.data),
        supabase.from('log_whats_new').select('*').eq('log_id', id).maybeSingle().then(r => r.data),
        supabase.from('log_notes').select('*').eq('log_id', id).maybeSingle().then(r => r.data),
      ]);

      if (cancelled) return;

      populateFromDB(id, e, sl, mo, bo, cy, ap, sk, ac, su, wn, no);
      setLoading(false);
    };

    load().then(() => {
      if (!cancelled) {
        // snapshot captured after state has been set — defer one tick
        setTimeout(() => {
          if (!cancelled) setSavedSnapshot(JSON.stringify(getFormSnapshot()));
        }, 0);
      }
    });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateStr, user?.id]);

  /* ── Snapshot after load settles ── */
  // After loading, we want savedSnapshot to reflect loaded state.
  // The timeout above fires after the setState calls from populateFromDB but the
  // snapshot itself depends on the state values. We use a separate effect to sync it.
  // NOTE: We only sync on loading→false transition, guarded by a ref.
  const [snapshotPending, setSnapshotPending] = useState(false);
  useEffect(() => {
    if (!loading) {
      setSnapshotPending(true);
    }
  }, [loading]);
  useEffect(() => {
    if (snapshotPending) {
      setSavedSnapshot(JSON.stringify(getFormSnapshot()));
      setSnapshotPending(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshotPending]);

  /* ── Validation ── */
  function hasAnyData(): boolean {
    const snap = getFormSnapshot() as Record<string, unknown>;
    return Object.values(snap).some(v => {
      if (Array.isArray(v)) return v.length > 0;
      if (typeof v === 'string') return v.trim().length > 0;
      return v !== null;
    });
  }

  /* ── Save ── */
  const handleSave = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    if (!hasAnyData()) { setNothingToSave(true); return false; }
    setNothingToSave(false);
    setSaveError(null);
    setSaving(true);

    try {
      const { data: upsertRow, error: logErr } = await supabase
        .from('daily_logs')
        .upsert({ user_id: user.id, date: dateStr, completed: true, updated_at: new Date().toISOString(), deleted_at: null }, { onConflict: 'user_id,date' })
        .select('id')
        .maybeSingle();
      if (logErr) throw logErr;

      // If RLS blocks the SELECT on the upsert response, fetch the row directly
      const id = upsertRow?.id ?? logId ?? await supabase
        .from('daily_logs').select('id')
        .eq('user_id', user.id).eq('date', dateStr).is('deleted_at', null)
        .maybeSingle().then(r => r.data?.id ?? null);
      if (!id) throw new Error('Could not create or find log row — check RLS policies on daily_logs');
      setLogId(id);

      const ops: Promise<unknown>[] = [];

      // log_energy
      if (morningEnergy || middayEnergy || eveningEnergy || capacity || crashTime || restHelped) {
        ops.push(supabase.from('log_energy').upsert({
          log_id: id, morning_energy: eScore(morningEnergy), midday_energy: eScore(middayEnergy), evening_energy: eScore(eveningEnergy),
          functional_capacity: mapCapacity(capacity), energy_crash_time: mapCrash(crashTime), rest_helped: mapRestHelped(restHelped),
        }, { onConflict: 'log_id' }));
      }
      // log_sleep
      if (hoursSlept !== null || sleepQuality || wokeNight || nightSweats || feltRested) {
        ops.push(supabase.from('log_sleep').upsert({
          log_id: id, hours_slept: hoursSlept, sleep_quality: sqScore(sleepQuality),
          woke_during_night: wokeNight as any, night_sweats: mapNightSweats(nightSweats), felt_rested: mapFeltRested(feltRested),
        }, { onConflict: 'log_id' }));
      }
      // log_mood
      if (moodEmoji || anxiety || irritability || brainFog || memory || motivation || feelingYourself || screenTime || socialEnergy || socialMatch || emotionalEating) {
        ops.push(supabase.from('log_mood').upsert({
          log_id: id, mood_score: mScore(moodEmoji), anxiety: mapAnxiety(anxiety), irritability: mapIrrit(irritability),
          brain_fog: mapFog(brainFog), memory_gaps: memory === 'fine' ? false : memory ? true : null,
          motivation: mapMotivation(motivation), feeling_like_yourself: feelingYourself as any,
          screen_behaviour: mapScreen(screenTime), social_energy: mapSocialE(socialEnergy), social_match: mapSocialM(socialMatch),
          emotional_eating: emotionalEating === 'no' ? false : emotionalEating ? true : null,
        }, { onConflict: 'log_id' }));
      }
      // log_body
      if (headache || jointPain || muscleAches || morningStiffness || pelvicArea || lowerBack) {
        ops.push(supabase.from('log_body').upsert({
          log_id: id, headache: sev(headache, HEADACHE_MAP), headache_location: headacheLoc,
          joint_pain: sev(jointPain, JOINT_MAP), joint_pain_areas: jointAreas.length ? jointAreas : null,
          muscle_aches: sev(muscleAches, MUSCLE_MAP), morning_stiffness: sev(morningStiffness, STIFF_MAP),
          pelvic_pain: sev(pelvicArea, PELVIC_MAP), lower_back_pain: sev(lowerBack, LBACK_MAP),
        }, { onConflict: 'log_id' }));
      }
      // log_cycle
      if (periodStatus || cyclePhase || flow || clotting || cramping) {
        ops.push(supabase.from('log_cycle').upsert({
          log_id: id, period_status: periodStatus as any, flow_intensity: flow as any,
          clotting: clotting as any, cramping: sev(cramping, CRAMP_MAP), cycle_phase: mapCyclePhase(cyclePhase),
        }, { onConflict: 'log_id' }));
      }
      // log_appetite
      if (appetite || cravings.length > 0 || bloating || digestion || unusualThirst) {
        ops.push(supabase.from('log_appetite').upsert({
          log_id: id, appetite_score: mapAppetite(appetite),
          cravings: cravings.length > 0 && !cravings.includes('none'), cravings_detail: cravingsDetail.trim() || null,
          bloating: sev(bloating, BLOA_MAP), digestion: digestion as any,
          unusual_thirst: unusualThirst === 'yes' ? true : unusualThirst === 'no' ? false : null,
        }, { onConflict: 'log_id' }));
      }
      // log_skin_hair
      if (skinToday || hairShedding || scalp || skinFeel || newSkincare) {
        ops.push(supabase.from('log_skin_hair').upsert({
          log_id: id, skin_state: mapSkin(skinToday), breakout_locations: breakoutLocs.length ? breakoutLocs : null,
          skin_feel: skinFeel as any, new_skincare_product: newSkincare === 'yes' ? (newSkincareDetail.trim() || null) : null,
          hair_shedding: mapShed(hairShedding), scalp: scalp as any,
        }, { onConflict: 'log_id' }));
      }
      // log_activity
      if (exercised) {
        ops.push(supabase.from('log_activity').upsert({
          log_id: id, exercised: mapExercised(exercised), exercise_types: exerciseTypes.length ? exerciseTypes : null,
          duration_mins: duration, intensity: mapIntensity(intensity), body_during: mapBodyDuring(bodyDuring),
          body_after: bodyAfter as any, motivation_going_in: mapMindGoingIn(mindGoingIn), mind_body_alignment: mapMindBody(mindBody),
          rest_day_type: restDayType as any,
        }, { onConflict: 'log_id' }));
      }
      // log_substances
      if (alcohol || caffeine || morningAfter) {
        ops.push(supabase.from('log_substances').upsert({
          log_id: id, alcohol: mapAlcohol(alcohol), alcohol_type: alcoholType as any,
          caffeine: caffeine as any, next_morning_feel: mapMorningAfter(morningAfter),
        }, { onConflict: 'log_id' }));
      }
      // log_whats_new
      if (newFood.trim() || newProduct.trim() || dayDifferent || followupFeel) {
        const followupVal = followupFeel === 'off' && followupDetail.trim() ? `off: ${followupDetail.trim()}` : (followupFeel ?? null);
        ops.push(supabase.from('log_whats_new').upsert({
          log_id: id, new_food: newFood.trim() || null, new_product: newProduct.trim() || null,
          new_product_type: newProductType, day_change: dayDifferent, followup_feel: followupVal,
        }, { onConflict: 'log_id' }));
      }
      // log_notes
      if (notes.trim()) {
        ops.push(supabase.from('log_notes').upsert({ log_id: id, content: notes.trim() }, { onConflict: 'log_id' }));
      }

      await Promise.all(ops);
      setSavedSnapshot(JSON.stringify(getFormSnapshot()));
      toast.success(`Saved for ${format(displayDate, 'd MMMM yyyy')}`);
      setSaving(false);
      return true;
    } catch (err: any) {
      const msg = err?.message ?? err?.details ?? JSON.stringify(err);
      console.error('Save error:', msg, err);
      setSaveError(`Save failed: ${msg}`);
      setSaving(false);
      return false;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, dateStr, displayDate, morningEnergy, middayEnergy, eveningEnergy, capacity, crashTime, restHelped,
    hoursSlept, sleepQuality, wokeNight, nightSweats, feltRested,
    moodEmoji, anxiety, irritability, brainFog, memory, motivation, feelingYourself, screenTime, socialEnergy, socialMatch, emotionalEating,
    headache, headacheLoc, jointPain, jointAreas, muscleAches, morningStiffness, pelvicArea, lowerBack,
    periodStatus, flow, clotting, cramping, cyclePhase,
    skinToday, breakoutLocs, skinFeel, newSkincare, newSkincareDetail, hairShedding, scalp,
    appetite, cravings, cravingsDetail, bloating, digestion, unusualThirst,
    exercised, exerciseTypes, duration, intensity, bodyDuring, bodyAfter, mindGoingIn, mindBody, restDayType,
    alcohol, alcoholType, morningAfter, caffeine,
    newFood, newProduct, newProductType, dayDifferent, followupFeel, followupDetail, notes, getFormSnapshot]);

  /* ── Date navigation (with dirty check) ── */
  const navigateToDate = (d: string) => setSearchParams({ date: d }, { replace: true });

  const goToPrevDay = () => {
    const prev = format(subDays(displayDate, 1), 'yyyy-MM-dd');
    if (isDirty) { setPendingDateStr(prev); } else { navigateToDate(prev); }
  };
  const goToNextDay = () => {
    if (viewingToday) return;
    const next = format(addDays(displayDate, 1), 'yyyy-MM-dd');
    if (isDirty) { setPendingDateStr(next); } else { navigateToDate(next); }
  };

  const handleDateNavSave = async () => {
    setDialogSaving(true);
    const ok = await handleSave();
    setDialogSaving(false);
    if (ok && pendingDateStr) { navigateToDate(pendingDateStr); setPendingDateStr(null); }
  };
  const handleDateNavDiscard = () => {
    if (pendingDateStr) { navigateToDate(pendingDateStr); }
    setPendingDateStr(null);
  };

  /* ── Progress bar ── */
  const catFilled = [
    !!(morningEnergy || middayEnergy || eveningEnergy || capacity || crashTime),
    !!(hoursSlept !== null || sleepQuality || wokeNight || nightSweats || feltRested),
    !!(moodEmoji || anxiety || irritability || brainFog || memory || motivation || feelingYourself || screenTime || socialEnergy || emotionalEating),
    !!(headache || jointPain || muscleAches || morningStiffness || pelvicArea || lowerBack || breastTenderness || perceivedTemp),
    !!(periodStatus || cyclePhase || flow || clotting || cramping),
    !!(desire || hadSex),
    !!(skinToday || hairShedding || scalp || skinFeel),
    !!(appetite || cravings.length || bloating || digestion || unusualThirst || bowelMovements),
    !!(alcohol || caffeine || morningAfter),
    !!(newFood.trim() || newProduct.trim() || dayDifferent || followupFeel),
    !!(notes.trim()),
  ];
  if (showFibroid || showHidden) catFilled.push(!!(pelvicHeaviness || abdomenDistended || urinaryUrgency || anaemiaSignals.length));
  if (showMovement || showHidden) catFilled.push(!!exercised);
  const totalCats = catFilled.length;
  const filledCats = catFilled.filter(Boolean).length;
  const progress = totalCats ? Math.round((filledCats / totalCats) * 100) : 0;

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-4">
      {/* ── Date nav header ── */}
      <div>
        <div className="flex items-center justify-between">
          <button onClick={goToPrevDay} className="p-1 rounded hover:bg-muted transition-colors" aria-label="Previous day">
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          </button>
          <span className="text-sm font-semibold">{dateLabel}</span>
          <button onClick={goToNextDay} disabled={viewingToday}
            className={cn('p-1 rounded transition-colors', viewingToday ? 'opacity-30 cursor-not-allowed' : 'hover:bg-muted')}
            aria-label="Next day">
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        {!viewingToday && (
          <p className="text-xs text-muted-foreground text-center mt-1">Editing entry from {format(displayDate, 'd MMMM yyyy')}</p>
        )}
        <h2 className="text-xl font-bold mt-2">How are you actually doing today?</h2>
        <p className="text-xs text-muted-foreground">{format(displayDate, 'EEEE, MMMM d')}</p>
      </div>

      <Progress value={progress} className="h-2" />
      <p className="text-xs text-muted-foreground">{progress}% logged · {filledCats}/{totalCats} categories</p>

      {/* ── Error banners ── */}
      {saveError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {saveError}
        </div>
      )}
      {nothingToSave && (
        <div className="rounded-lg border border-muted bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          Nothing to save yet — fill in at least one field.
        </div>
      )}

      <div className="space-y-2">
        {/* 1. Energy & Function */}
        <LogSection title="Energy & Function" timing="Anytime" description="How's the engine running?">
          <Field label="Morning energy"><Chips value={morningEnergy} onChange={setMorningEnergy} options={energyOpts} /></Field>
          <Field label="Midday energy"><Chips value={middayEnergy} onChange={setMiddayEnergy} options={energyOpts} /></Field>
          <Field label="End of day energy"><Chips value={eveningEnergy} onChange={setEveningEnergy} options={energyOpts} /></Field>
          <Field label="Today I was able to">
            <Chips value={capacity} onChange={setCapacity} options={[
              { value: 'full', label: 'Full capacity' }, { value: 'got_through', label: 'Got through it' },
              { value: 'empty', label: 'Running on empty' }, { value: 'rest', label: "Rest day, that's okay" },
            ]} />
          </Field>
          <Field label="Energy crashed today">
            <Chips value={crashTime} onChange={setCrashTime} options={[
              { value: 'none', label: 'No crash' }, { value: 'morning', label: 'Morning' }, { value: 'after_lunch', label: 'After lunch' },
              { value: 'late_afternoon', label: 'Late afternoon' }, { value: 'evening', label: 'Evening' },
            ]} />
          </Field>
          {capacity === 'rest' && (
            <Field label="Rest helped?">
              <Chips value={restHelped} onChange={setRestHelped} options={[
                { value: 'yes', label: 'Yes completely' }, { value: 'somewhat', label: 'Somewhat' }, { value: 'no', label: 'Not really' },
              ]} />
            </Field>
          )}
        </LogSection>

        {/* 2. Sleep */}
        <LogSection title="Sleep" timing="Morning" description="Did your body actually rest last night?">
          <Field label="Hours slept">
            <div className="flex flex-wrap gap-1.5">
              {[4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9].map(h => (
                <button key={h} type="button" onClick={() => setHoursSlept(h)}
                  className={cn('rounded-full border px-3 py-1.5 text-xs transition-colors',
                    hoursSlept === h ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border hover:bg-muted text-foreground/80')}>
                  {h === 9 ? '9+' : h}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Sleep quality">
            <Chips value={sleepQuality} onChange={setSleepQuality} options={[
              { value: 'terrible', label: 'Terrible' }, { value: 'poor', label: 'Poor' }, { value: 'okay', label: 'Okay' },
              { value: 'good', label: 'Good' }, { value: 'deep', label: 'Deep and restful' },
            ]} />
          </Field>
          <Field label="Woke during the night">
            <Chips value={wokeNight} onChange={setWokeNight} options={[
              { value: 'slept_through', label: 'Slept through' }, { value: 'once', label: 'Once' },
              { value: 'few_times', label: 'A few times' }, { value: 'all_night', label: 'Up and down all night' },
            ]} />
          </Field>
          <Field label="Night sweats">
            <Chips value={nightSweats} onChange={setNightSweats} options={[
              { value: 'none', label: 'None' }, { value: 'mild', label: 'Mild' }, { value: 'woke_me', label: 'Woke me up' },
            ]} />
          </Field>
          <Field label="Felt rested on waking">
            <Chips value={feltRested} onChange={setFeltRested} options={[
              { value: 'yes', label: 'Yes' }, { value: 'kind_of', label: 'Kind of' }, { value: 'no', label: 'Not at all' },
            ]} />
          </Field>
        </LogSection>

        {/* 3. Mood & Mind */}
        <LogSection title="Mood & Mind" timing="Anytime" description="The inside weather report">
          <Field label="Overall mood today">
            <div className="flex gap-2">
              {(['😔', '🙁', '😐', '🙂', '😄'] as const).map(e => (
                <button key={e} type="button" onClick={() => setMoodEmoji(moodEmoji === e ? null : e)}
                  className={cn('h-11 w-11 rounded-full border text-2xl transition-colors flex items-center justify-center',
                    moodEmoji === e ? 'bg-primary/10 border-primary scale-110' : 'bg-card border-border hover:bg-muted')}>
                  {e}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Anxiety">
            <Chips value={anxiety} onChange={setAnxiety} options={[
              { value: 'none', label: 'None' }, { value: 'hum', label: 'A hum in the background' },
              { value: 'noticeable', label: 'Noticeable' }, { value: 'hard_to_shake', label: 'Hard to shake' },
            ]} />
          </Field>
          <Field label="Irritability">
            <Chips value={irritability} onChange={setIrritability} options={[
              { value: 'none', label: 'None' }, { value: 'mild', label: 'Mild' },
              { value: 'a_lot', label: 'Everything was a lot' }, { value: 'dont_talk', label: "Don't talk to me" },
            ]} />
          </Field>
          <Field label="Brain fog">
            <Chips value={brainFog} onChange={setBrainFog} options={[
              { value: 'sharp', label: 'Sharp' }, { value: 'cloudy', label: 'Slightly cloudy' },
              { value: 'foggy', label: 'Foggy' }, { value: 'cant_find_words', label: "Can't find my words" },
            ]} />
          </Field>
          <Field label="Memory">
            <Chips value={memory} onChange={setMemory} options={[
              { value: 'fine', label: 'Fine' }, { value: 'gaps', label: 'A few gaps' }, { value: 'what_was_i_doing', label: 'What was I just doing?' },
            ]} />
          </Field>
          <Field label="Motivation">
            <Chips value={motivation} onChange={setMotivation} options={[
              { value: 'ready', label: 'Ready' }, { value: 'push', label: 'Had to push' },
              { value: 'struggled', label: 'Struggled' }, { value: 'couldnt_start', label: "Couldn't start" },
            ]} />
          </Field>
          <Field label="Feeling like yourself?">
            <Chips value={feelingYourself} onChange={setFeelingYourself} options={[
              { value: 'yes', label: 'Yes' }, { value: 'mostly', label: 'Mostly' },
              { value: 'not_really', label: 'Not really' }, { value: 'not_at_all', label: 'Not at all' },
            ]} />
          </Field>
          <Field label="Screen time">
            <Chips value={screenTime} onChange={setScreenTime} options={[
              { value: 'normal', label: 'Normal' }, { value: 'more', label: 'More than usual' },
              { value: 'doom_scroll', label: 'Full doom scroll' }, { value: 'numb', label: 'Numb, just staring' },
            ]} />
          </Field>
          <Field label="Social energy today">
            <Chips value={socialEnergy} onChange={setSocialEnergy} options={[
              { value: 'wanted_people', label: 'Wanted people around' }, { value: 'either_way', label: 'Either way' },
              { value: 'needed_quiet', label: 'Needed quiet' }, { value: 'antisocial', label: 'Fully antisocial' },
            ]} />
          </Field>
          {socialEnergy && (
            <Field label="Did your day match that?">
              <Chips value={socialMatch} onChange={setSocialMatch} options={[
                { value: 'yes', label: 'Yes' }, { value: 'more_than_wanted', label: 'More social than I wanted' },
                { value: 'less_than_wanted', label: 'Less than I wanted' },
              ]} />
            </Field>
          )}
          <Field label="Emotional eating">
            <Chips value={emotionalEating} onChange={setEmotionalEating} options={[
              { value: 'no', label: 'No' }, { value: 'a_little', label: 'A little' }, { value: 'yes', label: 'Yes' },
            ]} />
          </Field>
        </LogSection>

        {/* 4. Body Check */}
        <LogSection title="Body Check — How it feels today" timing="Anytime" description="What's your body saying?">
          <Field label="Headache or migraine today?">
            <Chips value={headache} onChange={setHeadache} options={[
              { value: 'none', label: 'None' }, { value: 'mild', label: 'Mild headache' },
              { value: 'significant', label: 'Significant headache' }, { value: 'migraine', label: 'Migraine' },
            ]} />
          </Field>
          {headache && headache !== 'none' && (
            <Field label="Where?">
              <Chips value={headacheLoc} onChange={setHeadacheLoc} options={[
                { value: 'forehead', label: 'Forehead' }, { value: 'temples', label: 'Temples' },
                { value: 'back', label: 'Back of head' }, { value: 'behind_eyes', label: 'Behind eyes' }, { value: 'whole_head', label: 'Whole head' },
              ]} />
            </Field>
          )}
          <Field label="Joint pain">
            <Chips value={jointPain} onChange={setJointPain} options={[
              { value: 'none', label: 'None' }, { value: 'mild', label: 'Mild' },
              { value: 'noticeable', label: 'Noticeable' }, { value: 'difficult', label: 'Difficult to ignore' },
            ]} />
          </Field>
          {jointPain && jointPain !== 'none' && (
            <Field label="Where? (tap any)">
              <MultiChips value={jointAreas as any} onChange={setJointAreas as any} options={[
                { value: 'shoulders', label: 'Shoulders' }, { value: 'elbows', label: 'Elbows' }, { value: 'wrists', label: 'Wrists' },
                { value: 'hips', label: 'Hips' }, { value: 'knees', label: 'Knees' }, { value: 'ankles', label: 'Ankles' },
                { value: 'lower_back', label: 'Lower back' }, { value: 'upper_back', label: 'Upper back' }, { value: 'neck', label: 'Neck' },
              ]} />
            </Field>
          )}
          <Field label="Muscle aches">
            <Chips value={muscleAches} onChange={setMuscleAches} options={[
              { value: 'none', label: 'None' }, { value: 'mild', label: 'Mild' }, { value: 'noticeable', label: 'Noticeable' },
            ]} />
          </Field>
          <Field label="Morning stiffness">
            <Chips value={morningStiffness} onChange={setMorningStiffness} options={[
              { value: 'none', label: 'None' }, { value: 'loosened', label: 'A little, loosened quickly' },
              { value: 'while', label: 'Took a while' }, { value: 'midday', label: 'Still stiff by midday' },
            ]} />
          </Field>
          <Field label="Pelvic area">
            <Chips value={pelvicArea} onChange={setPelvicArea} options={[
              { value: 'none', label: 'No pain' }, { value: 'mild', label: 'Mild pressure' },
              { value: 'noticeable', label: 'Noticeable pain' }, { value: 'significant', label: 'Significant pain' },
            ]} />
          </Field>
          <Field label="Lower back">
            <Chips value={lowerBack} onChange={setLowerBack} options={[
              { value: 'fine', label: 'Fine' }, { value: 'mild', label: 'Mild' },
              { value: 'noticeable', label: 'Noticeable' }, { value: 'bad', label: 'Bad today' },
            ]} />
          </Field>
          <Field label="Breast tenderness">
            <Chips value={breastTenderness} onChange={setBreastTenderness} options={[
              { value: 'none', label: 'None' }, { value: 'mild', label: 'Mild' },
              { value: 'noticeable', label: 'Noticeable' }, { value: 'painful', label: 'Painful to touch' },
            ]} />
          </Field>
          <Field label="Hot or not?">
            <Chips value={perceivedTemp} onChange={setPerceivedTemp} options={[
              { value: 'comfortable', label: 'Comfortable' }, { value: 'cold', label: 'Running cold' },
              { value: 'warm', label: 'Running warm' }, { value: 'hot_flushes', label: 'Hot flushes' },
              { value: 'sweaty', label: 'Sweaty' }, { value: 'erratic', label: 'All over the place' },
            ]} />
          </Field>
        </LogSection>

        {/* 5. Cycle */}
        <LogSection title="Cycle" timing="Anytime" description="What's happening">
          <Field label="Period today?">
            <Chips value={periodStatus} onChange={setPeriodStatus} options={[
              { value: 'none', label: 'Nothing' }, { value: 'started', label: 'Started' }, { value: 'ongoing', label: 'Ongoing' },
              { value: 'ended', label: 'Ended' }, { value: 'spotting', label: 'Spotting' },
            ]} />
          </Field>
          {(periodStatus === 'started' || periodStatus === 'ongoing') && (
            <>
              <Field label="Flow">
                <Chips value={flow} onChange={setFlow} options={[
                  { value: 'light', label: 'Light' }, { value: 'medium', label: 'Medium' },
                  { value: 'heavy', label: 'Heavy' }, { value: 'very_heavy', label: 'Very heavy' },
                ]} />
              </Field>
              <Field label="Clotting">
                <Chips value={clotting} onChange={setClotting} options={[
                  { value: 'none', label: 'None' }, { value: 'small', label: 'Small' }, { value: 'large', label: 'Large' },
                ]} />
              </Field>
              <Field label="Cramping">
                <Chips value={cramping} onChange={setCramping} options={[
                  { value: 'none', label: 'None' }, { value: 'mild', label: 'Mild' }, { value: 'moderate', label: 'Moderate' }, { value: 'bad', label: 'Bad today' },
                ]} />
              </Field>
            </>
          )}
          {(!periodStatus || periodStatus === 'none' || periodStatus === 'ended' || periodStatus === 'spotting') && (
            <Field label="Cycle phase">
              <Chips value={cyclePhase} onChange={setCyclePhase} options={[
                { value: 'post_period', label: 'Post-period' }, { value: 'mid_cycle', label: 'Mid-cycle' },
                { value: 'pre_period', label: 'Pre-period' }, { value: 'not_sure', label: 'Not sure' },
              ]} />
            </Field>
          )}
        </LogSection>

        {/* 6. Intimacy */}
        <LogSection title="Intimacy" timing="Anytime" description="Feeling sexy today?">
          <Field label="Desire today">
            <Chips value={desire} onChange={setDesire} options={[
              { value: 'high', label: 'High' }, { value: 'normal', label: 'Normal' }, { value: 'low', label: 'Low' }, { value: 'none', label: 'None' },
            ]} />
          </Field>
          <Field label="Did you have sex today?">
            <Chips value={hadSex} onChange={setHadSex} options={[
              { value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }, { value: 'solo', label: 'Solo' },
            ]} />
          </Field>
          {(hadSex === 'yes' || hadSex === 'solo') && (
            <>
              <Field label="How many times?">
                <Chips value={sexFrequency} onChange={setSexFrequency} options={[
                  { value: 'once', label: 'Once' }, { value: 'twice', label: 'Twice' }, { value: 'three_plus', label: 'Three+' },
                ]} />
              </Field>
              <Field label="When? (tap any)">
                <MultiChips value={sexTimeOfDay} onChange={setSexTimeOfDay} options={[
                  { value: 'morning', label: 'Morning' }, { value: 'afternoon', label: 'Afternoon' },
                  { value: 'evening', label: 'Evening' }, { value: 'night', label: 'Night' },
                ]} />
              </Field>
            </>
          )}
        </LogSection>

        {/* 7. Fibroid (conditional) */}
        {(showFibroid || showHidden) && (
          <LogSection title="Fibroid check-in" timing="Anytime" description="Adds to today's body picture">
            <Field label="Pelvic heaviness">
              <Chips value={pelvicHeaviness} onChange={setPelvicHeaviness} options={[
                { value: 'none', label: 'None' }, { value: 'mild', label: 'Mild' }, { value: 'moderate', label: 'Moderate' }, { value: 'significant', label: 'Significant' },
              ]} />
            </Field>
            <Field label="Abdomen feels distended">
              <Chips value={abdomenDistended} onChange={setAbdomenDistended} options={[{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }]} />
            </Field>
            <Field label="Urinary urgency from pressure">
              <Chips value={urinaryUrgency} onChange={setUrinaryUrgency} options={[{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }]} />
            </Field>
            <Field label="Anaemia signals (tap any)">
              <MultiChips value={anaemiaSignals as any} onChange={setAnaemiaSignals as any} options={[
                { value: 'breathless', label: 'Breathless on stairs' }, { value: 'dizzy', label: 'Dizzy' }, { value: 'pale', label: 'Looking pale' },
              ]} />
            </Field>
          </LogSection>
        )}

        {/* 8. Skin, Hair & Breakouts */}
        <LogSection title="Skin, Hair & Breakouts" timing="Anytime" description="Your body shows up on the outside too">
          <Field label="Skin today">
            <Chips value={skinToday} onChange={setSkinToday} options={[
              { value: 'clear', label: 'Clear' }, { value: 'few_spots', label: 'One or two spots' },
              { value: 'breaking_out', label: 'Breaking out' }, { value: 'cystic', label: 'Cystic' }, { value: 'irritated', label: 'Irritated and reactive' },
            ]} />
          </Field>
          {skinToday && skinToday !== 'clear' && (
            <Field label="Where? (tap any)">
              <MultiChips value={breakoutLocs as any} onChange={setBreakoutLocs as any} options={[
                { value: 'forehead', label: 'Forehead' }, { value: 'jawline', label: 'Jawline' }, { value: 'chin', label: 'Chin' },
                { value: 'cheeks', label: 'Cheeks' }, { value: 'neck', label: 'Neck' }, { value: 'back', label: 'Back' }, { value: 'chest', label: 'Chest' },
              ]} />
            </Field>
          )}
          <Field label="Skin feel">
            <Chips value={skinFeel} onChange={setSkinFeel} options={[
              { value: 'normal', label: 'Normal' }, { value: 'dry', label: 'Dry' }, { value: 'oily', label: 'Oily' },
              { value: 'sensitive', label: 'Sensitive' }, { value: 'combination', label: 'Combination chaos' },
            ]} />
          </Field>
          <Field label="Anything new in your skincare today?">
            <Chips value={newSkincare} onChange={setNewSkincare} options={[{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }]} />
          </Field>
          {newSkincare === 'yes' && (
            <input value={newSkincareDetail} onChange={e => setNewSkincareDetail(e.target.value)} placeholder="Product name…"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          )}
          <Field label="Hair shedding">
            <Chips value={hairShedding} onChange={setHairShedding} options={[
              { value: 'normal', label: 'Normal' }, { value: 'more', label: 'More than usual' }, { value: 'a_lot_more', label: 'A lot more than usual' },
            ]} />
          </Field>
          <Field label="Scalp">
            <Chips value={scalp} onChange={setScalp} options={[
              { value: 'fine', label: 'Fine' }, { value: 'itchy', label: 'Itchy' }, { value: 'dry', label: 'Dry' }, { value: 'tender', label: 'Tender' },
            ]} />
          </Field>
        </LogSection>

        {/* 9. Appetite & Digestion */}
        <LogSection title="Appetite & Digestion" timing="Anytime" description="Hunger, cravings, gut feelings">
          <Field label="Appetite today">
            <Chips value={appetite} onChange={setAppetite} options={[
              { value: 'none', label: 'None' }, { value: 'low', label: 'Low' }, { value: 'normal', label: 'Normal' },
              { value: 'more', label: 'More than usual' }, { value: 'couldnt_stop', label: "Couldn't stop eating" },
            ]} />
          </Field>
          <Field label="Cravings (tap any)">
            <MultiChips value={cravings as any} onChange={setCravings as any} options={[
              { value: 'none', label: 'None' }, { value: 'sweet', label: 'Sweet' }, { value: 'salty', label: 'Salty' },
              { value: 'carbs', label: 'Carbs' }, { value: 'everything', label: 'Everything' }, { value: 'specific', label: 'Something specific' },
            ]} />
          </Field>
          {cravings.includes('specific') && (
            <input value={cravingsDetail} onChange={e => setCravingsDetail(e.target.value)} placeholder="What were you craving?"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          )}
          <Field label="Bloating">
            <Chips value={bloating} onChange={setBloating} options={[
              { value: 'none', label: 'None' }, { value: 'mild', label: 'Mild' }, { value: 'noticeable', label: 'Noticeable' }, { value: 'uncomfortable', label: 'Uncomfortable' },
            ]} />
          </Field>
          <Field label="Digestion">
            <Chips value={digestion} onChange={setDigestion} options={[
              { value: 'normal', label: 'Normal' }, { value: 'sluggish', label: 'Sluggish' }, { value: 'unsettled', label: 'Unsettled' },
              { value: 'nausea', label: 'Nausea' }, { value: 'both_ends', label: 'Both ends having a moment' },
            ]} />
          </Field>
          <Field label="How things moved today">
            <Chips value={bowelMovements} onChange={setBowelMovements} options={[
              { value: 'none', label: "Didn't go" }, { value: 'once_normal', label: 'Once, normal' }, { value: 'multiple', label: 'A few times' },
              { value: 'loose', label: 'Loose' }, { value: 'hard', label: 'Hard work' }, { value: 'urgent', label: 'Urgent' },
            ]} />
          </Field>
          <Field label="Unusual thirst">
            <Chips value={unusualThirst} onChange={setUnusualThirst} options={[{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }]} />
          </Field>
        </LogSection>

        {/* 10. Movement (conditional) */}
        {(showMovement || showHidden) && (
          <LogSection title="Movement & Exercise" timing="Evening" description="Did you move today?">
            <Field label="Did you exercise?">
              <Chips value={exercised} onChange={setExercised} options={[
                { value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }, { value: 'planned_but_didnt', label: "Planned to but didn't" },
              ]} />
            </Field>
            {exercised === 'yes' && (
              <>
                <Field label="What did you do?">
                  <MultiChips value={exerciseTypes as any} onChange={setExerciseTypes as any} options={[
                    { value: 'strength', label: 'Strength' }, { value: 'yoga_pilates', label: 'Yoga / Pilates' }, { value: 'walking', label: 'Walking' },
                    { value: 'running', label: 'Running' }, { value: 'cycling', label: 'Cycling' }, { value: 'swimming', label: 'Swimming' },
                    { value: 'dance', label: 'Dance' }, { value: 'other', label: 'Other' },
                  ]} />
                </Field>
                <Field label="How long?">
                  <div className="flex flex-wrap gap-1.5">
                    {[15, 30, 45, 60, 75, 90].map(m => (
                      <button key={m} type="button" onClick={() => setDuration(duration === m ? null : m)}
                        className={cn('rounded-full border px-3 py-1.5 text-xs transition-colors',
                          duration === m ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border hover:bg-muted text-foreground/80')}>
                        {m === 90 ? '90+' : m} mins
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Intensity">
                  <Chips value={intensity} onChange={setIntensity} options={[
                    { value: 'easy', label: 'Easy' }, { value: 'moderate', label: 'Moderate' },
                    { value: 'hard', label: 'Hard' }, { value: 'left_it', label: 'Left everything there' },
                  ]} />
                </Field>
                <Field label="Body during">
                  <Chips value={bodyDuring} onChange={setBodyDuring} options={[
                    { value: 'great', label: 'Felt great' }, { value: 'got_through', label: 'Got through it' },
                    { value: 'modify', label: 'Had to modify' }, { value: 'stop', label: 'Had to stop' },
                  ]} />
                </Field>
                <Field label="Body after">
                  <Chips value={bodyAfter} onChange={setBodyAfter} options={[
                    { value: 'energised', label: 'Energised' }, { value: 'fine', label: 'Fine' },
                    { value: 'tired', label: 'Tired' }, { value: 'wrecked', label: 'Wrecked' },
                  ]} />
                </Field>
                <Field label="Mind going in">
                  <Chips value={mindGoingIn} onChange={setMindGoingIn} options={[
                    { value: 'motivated', label: 'Motivated' }, { value: 'neutral', label: 'Neutral' },
                    { value: 'push', label: 'Had to push myself' }, { value: 'didnt_want', label: "Really didn't want to" },
                  ]} />
                </Field>
                <Field label="Mind vs body today">
                  <Chips value={mindBody} onChange={setMindBody} options={[
                    { value: 'both', label: 'Both ready' }, { value: 'mind_not_body', label: "Mind ready, body wasn't" },
                    { value: 'body_not_mind', label: "Body ready, mind wasn't" }, { value: 'neither', label: 'Neither was feeling it' },
                  ]} />
                </Field>
              </>
            )}
            {(exercised === 'no' || exercised === 'planned_but_didnt') && (
              <Field label="Rest day type">
                <Chips value={restDayType} onChange={setRestDayType} options={[
                  { value: 'intentional', label: 'Intentional rest' }, { value: 'body_said_no', label: 'Body said no' }, { value: 'just_didnt', label: "Just didn't happen" },
                ]} />
              </Field>
            )}
          </LogSection>
        )}

        {/* 11. Substances */}
        <LogSection title="Substances" timing="Evening" description="No judgment, just data">
          <Field label="Alcohol last night or today?">
            <Chips value={alcohol} onChange={setAlcohol} options={[
              { value: 'none', label: 'None' }, { value: '1-2', label: '1–2 drinks' },
              { value: '3-4', label: '3–4 drinks' }, { value: '4_plus', label: 'More than that' },
            ]} />
          </Field>
          {alcohol && alcohol !== 'none' && (
            <Field label="Type">
              <Chips value={alcoholType} onChange={setAlcoholType} options={[
                { value: 'wine', label: 'Wine' }, { value: 'beer', label: 'Beer' }, { value: 'spirits', label: 'Spirits' }, { value: 'mixed', label: 'Mixed' },
              ]} />
            </Field>
          )}
          <Field label="How do you feel about it today?">
            <Chips value={morningAfter} onChange={setMorningAfter} options={[
              { value: 'fine', label: 'Fine' }, { value: 'slightly_off', label: 'Slightly off' },
              { value: 'rough', label: 'Rough' }, { value: 'regrets', label: 'Regrets' },
            ]} />
          </Field>
          <Field label="Caffeine">
            <Chips value={caffeine} onChange={setCaffeine} options={[
              { value: 'normal', label: 'Normal' }, { value: 'more', label: 'More than usual' },
              { value: 'less', label: 'Less than usual' }, { value: 'none', label: 'None' },
            ]} />
          </Field>
        </LogSection>

        {/* 12. What's New */}
        <LogSection title="What's new?" timing="Anytime" description="Something different today?">
          <Field label="New food or ingredient?">
            <input value={newFood} onChange={e => setNewFood(e.target.value)} placeholder="e.g. miso, kombucha, new spice…"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </Field>
          <Field label="New product?">
            <input value={newProduct} onChange={e => setNewProduct(e.target.value)} placeholder="Product name…"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            {newProduct && (
              <div className="pt-2">
                <Chips value={newProductType} onChange={setNewProductType} options={[
                  { value: 'topical', label: 'Topical' }, { value: 'ingestible', label: 'Ingestible' }, { value: 'other', label: 'Other' },
                ]} />
              </div>
            )}
          </Field>
          <Field label="Something different about your day?">
            <Chips value={dayDifferent} onChange={setDayDifferent} options={[
              { value: 'travel', label: 'Travel' }, { value: 'stress', label: 'Unusual stress' },
              { value: 'late_night', label: 'Late night' }, { value: 'routine', label: 'Change in routine' }, { value: 'other', label: 'Other' },
            ]} />
          </Field>
          <Field label="How did you feel in the hours after?">
            <Chips value={followupFeel} onChange={setFollowupFeel} options={[{ value: 'fine', label: 'Fine' }, { value: 'off', label: 'Something felt a bit off' }]} />
          </Field>
          {followupFeel === 'off' && (
            <input value={followupDetail} onChange={e => setFollowupDetail(e.target.value)} placeholder="What did you notice?"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          )}
        </LogSection>

        {/* 13. Anything else */}
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm font-semibold mb-2">Anything else?</p>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Free text. No prompt. No judgment."
            className="w-full rounded-md border bg-background p-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring min-h-[80px]" />
        </div>

        {/* Track something else today */}
        {(!showFibroid || !showMovement) && !showHidden && (
          <button type="button" onClick={() => setShowHidden(true)}
            className="w-full text-xs text-muted-foreground hover:text-foreground py-2 transition-colors text-center">
            + Track something else today
          </button>
        )}
      </div>

      {/* ── Save button ── */}
      <div className="sticky bottom-20 pt-2 z-10">
        <Button onClick={() => handleSave()} disabled={saving} className="w-full shadow-lg" size="lg">
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {saving ? 'Saving…' : 'Save today\'s log'}
        </Button>
      </div>

      {/* ── Date nav unsaved dialog ── */}
      {pendingDateStr && (
        <UnsavedDialog
          title="You have unsaved changes."
          message="Save before switching dates?"
          saving={dialogSaving}
          onSave={handleDateNavSave}
          onDiscard={handleDateNavDiscard}
          onCancel={() => setPendingDateStr(null)}
        />
      )}

    </div>
  );
};

export default DailyLog;

/* ── helpers used in load effect ── */
function emptySnapshot() {
  return {
    morningEnergy: null, middayEnergy: null, eveningEnergy: null, capacity: null, crashTime: null, restHelped: null,
    hoursSlept: null, sleepQuality: null, wokeNight: null, nightSweats: null, feltRested: null,
    moodEmoji: null, anxiety: null, irritability: null, brainFog: null, memory: null, motivation: null,
    feelingYourself: null, screenTime: null, socialEnergy: null, socialMatch: null, emotionalEating: null,
    headache: null, headacheLoc: null, jointPain: null, jointAreas: [], muscleAches: null, morningStiffness: null,
    pelvicArea: null, lowerBack: null, breastTenderness: null, perceivedTemp: null,
    periodStatus: null, flow: null, clotting: null, cramping: null, cyclePhase: null,
    desire: null, hadSex: null, sexFrequency: null, sexTimeOfDay: [],
    pelvicHeaviness: null, abdomenDistended: null, urinaryUrgency: null, anaemiaSignals: [],
    skinToday: null, breakoutLocs: [], skinFeel: null, newSkincare: null, newSkincareDetail: '', hairShedding: null, scalp: null,
    appetite: null, cravings: [], cravingsDetail: '', bloating: null, digestion: null, unusualThirst: null, bowelMovements: null,
    exercised: null, exerciseTypes: [], duration: null, intensity: null, bodyDuring: null, bodyAfter: null,
    mindGoingIn: null, mindBody: null, restDayType: null,
    alcohol: null, alcoholType: null, morningAfter: null, caffeine: null,
    newFood: '', newProduct: '', newProductType: null, dayDifferent: null, followupFeel: null, followupDetail: '',
    notes: '',
  };
}
