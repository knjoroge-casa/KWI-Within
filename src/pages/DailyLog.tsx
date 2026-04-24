import { useState, ReactNode } from 'react';
import { useApp } from '@/contexts/AppContext';
import { format } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

/* ------------------------------- primitives ------------------------------- */

type Opt<T extends string> = { value: T; label: string };

function Chips<T extends string>({
  value,
  onChange,
  options,
  size = 'md',
}: {
  value: T | null | undefined;
  onChange: (v: any) => void;
  options: Opt<T>[];
  size?: 'sm' | 'md';
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(o => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              'rounded-full border transition-colors',
              size === 'sm' ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs',
              active
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card border-border hover:bg-muted text-foreground/80',
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function MultiChips<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T[];
  onChange: (v: T[]) => void;
  options: Opt<T>[];
}) {
  const toggle = (v: T) => {
    onChange(value.includes(v) ? value.filter(x => x !== v) : [...value, v]);
  };
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(o => {
        const active = value.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => toggle(o.value)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs transition-colors',
              active
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card border-border hover:bg-muted text-foreground/80',
            )}
          >
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

function LogSection({
  title,
  description,
  children,
  defaultOpen = false,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border bg-card p-4 hover:bg-muted/50 transition-colors">
        <div className="text-left">
          <p className="text-sm font-semibold">{title}</p>
          {description && <p className="text-xs text-muted-foreground italic">{description}</p>}
        </div>
        <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-1 rounded-lg border bg-card p-4 space-y-5">{children}</CollapsibleContent>
    </Collapsible>
  );
}

/* ---------------------------------- page ---------------------------------- */

type EnergyVal = 'dead' | 'low' | 'okay' | 'good' | 'charged';

const energyOpts: Opt<EnergyVal>[] = [
  { value: 'dead', label: 'Dead' },
  { value: 'low', label: 'Low' },
  { value: 'okay', label: 'Okay' },
  { value: 'good', label: 'Good' },
  { value: 'charged', label: 'Charged' },
];

const DailyLog = () => {
  const { profile } = useApp();

  /* Energy & Function */
  const [morningEnergy, setMorningEnergy] = useState<EnergyVal | null>(null);
  const [middayEnergy, setMiddayEnergy] = useState<EnergyVal | null>(null);
  const [eveningEnergy, setEveningEnergy] = useState<EnergyVal | null>(null);
  const [capacity, setCapacity] = useState<'full' | 'got_through' | 'empty' | 'rest' | null>(null);
  const [crashTime, setCrashTime] = useState<'none' | 'morning' | 'after_lunch' | 'late_afternoon' | 'evening' | null>(null);
  const [restHelped, setRestHelped] = useState<'yes' | 'somewhat' | 'no' | null>(null);

  /* Sleep */
  const [hoursSlept, setHoursSlept] = useState<number | null>(null);
  const [sleepQuality, setSleepQuality] = useState<'terrible' | 'poor' | 'okay' | 'good' | 'deep' | null>(null);
  const [wokeNight, setWokeNight] = useState<'slept_through' | 'once' | 'few_times' | 'all_night' | null>(null);
  const [nightSweats, setNightSweats] = useState<'none' | 'mild' | 'woke_me' | null>(null);
  const [feltRested, setFeltRested] = useState<'yes' | 'kind_of' | 'no' | null>(null);

  /* Mood & Mind */
  const [moodEmoji, setMoodEmoji] = useState<'😔' | '🙁' | '😐' | '🙂' | '😄' | null>(null);
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

  /* Body — Aches, Tension & Tenderness */
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

  /* Cycle */
  const [periodStatus, setPeriodStatus] = useState<'none' | 'started' | 'ongoing' | 'ended' | 'spotting' | null>(null);
  const [flow, setFlow] = useState<'light' | 'medium' | 'heavy' | 'very_heavy' | null>(null);
  const [clotting, setClotting] = useState<'none' | 'small' | 'large' | null>(null);
  const [cramping, setCramping] = useState<'none' | 'mild' | 'moderate' | 'bad' | null>(null);
  const [cyclePhase, setCyclePhase] = useState<'post_period' | 'mid_cycle' | 'pre_period' | 'not_sure' | null>(null);

  /* Intimacy */
  const [desire, setDesire] = useState<'high' | 'normal' | 'low' | 'none' | null>(null);
  const [hadSex, setHadSex] = useState<'no' | 'yes' | 'solo' | null>(null);
  const [sexFrequency, setSexFrequency] = useState<'once' | 'twice' | 'three_plus' | null>(null);
  const [sexTimeOfDay, setSexTimeOfDay] = useState<('morning' | 'afternoon' | 'evening' | 'night')[]>([]);

  /* Fibroid (conditional) */
  const [pelvicHeaviness, setPelvicHeaviness] = useState<'none' | 'mild' | 'moderate' | 'significant' | null>(null);
  const [abdomenDistended, setAbdomenDistended] = useState<'no' | 'yes' | null>(null);
  const [urinaryUrgency, setUrinaryUrgency] = useState<'no' | 'yes' | null>(null);
  const [anaemiaSignals, setAnaemiaSignals] = useState<string[]>([]);

  /* Skin, Hair & Breakouts */
  const [skinToday, setSkinToday] = useState<'clear' | 'few_spots' | 'breaking_out' | 'cystic' | 'irritated' | null>(null);
  const [breakoutLocs, setBreakoutLocs] = useState<string[]>([]);
  const [skinFeel, setSkinFeel] = useState<'normal' | 'dry' | 'oily' | 'sensitive' | 'combination' | null>(null);
  const [newSkincare, setNewSkincare] = useState<'no' | 'yes' | null>(null);
  const [newSkincareDetail, setNewSkincareDetail] = useState('');
  const [hairShedding, setHairShedding] = useState<'normal' | 'more' | 'a_lot_more' | null>(null);
  const [scalp, setScalp] = useState<'fine' | 'itchy' | 'dry' | 'tender' | null>(null);

  /* Appetite & Digestion */
  const [appetite, setAppetite] = useState<'none' | 'low' | 'normal' | 'more' | 'couldnt_stop' | null>(null);
  const [cravings, setCravings] = useState<string[]>([]);
  const [cravingsDetail, setCravingsDetail] = useState('');
  const [bloating, setBloating] = useState<'none' | 'mild' | 'noticeable' | 'uncomfortable' | null>(null);
  const [digestion, setDigestion] = useState<'normal' | 'sluggish' | 'unsettled' | 'nausea' | 'both_ends' | null>(null);
  const [unusualThirst, setUnusualThirst] = useState<'no' | 'yes' | null>(null);
  const [bowelMovements, setBowelMovements] = useState<'none' | 'once_normal' | 'multiple' | 'loose' | 'hard' | 'urgent' | null>(null);

  /* Movement (conditional) */
  const [exercised, setExercised] = useState<'yes' | 'no' | 'planned_but_didnt' | null>(null);
  const [exerciseTypes, setExerciseTypes] = useState<string[]>([]);
  const [duration, setDuration] = useState<number | null>(null);
  const [intensity, setIntensity] = useState<'easy' | 'moderate' | 'hard' | 'left_it' | null>(null);
  const [bodyDuring, setBodyDuring] = useState<'great' | 'got_through' | 'modify' | 'stop' | null>(null);
  const [bodyAfter, setBodyAfter] = useState<'energised' | 'fine' | 'tired' | 'wrecked' | null>(null);
  const [mindGoingIn, setMindGoingIn] = useState<'motivated' | 'neutral' | 'push' | 'didnt_want' | null>(null);
  const [mindBody, setMindBody] = useState<'both' | 'mind_not_body' | 'body_not_mind' | 'neither' | null>(null);
  const [restDayType, setRestDayType] = useState<'intentional' | 'body_said_no' | 'just_didnt' | null>(null);

  /* Substances */
  const [alcohol, setAlcohol] = useState<'none' | '1-2' | '3-4' | '4_plus' | null>(null);
  const [alcoholType, setAlcoholType] = useState<'wine' | 'beer' | 'spirits' | 'mixed' | null>(null);
  const [morningAfter, setMorningAfter] = useState<'fine' | 'slightly_off' | 'rough' | 'regrets' | null>(null);
  const [caffeine, setCaffeine] = useState<'normal' | 'more' | 'less' | 'none' | null>(null);

  /* What's New */
  const [newFood, setNewFood] = useState('');
  const [newProduct, setNewProduct] = useState('');
  const [newProductType, setNewProductType] = useState<'topical' | 'ingestible' | 'other' | null>(null);
  const [dayDifferent, setDayDifferent] = useState<'travel' | 'stress' | 'late_night' | 'routine' | 'other' | null>(null);
  const [followupFeel, setFollowupFeel] = useState<'fine' | 'off' | null>(null);
  const [followupDetail, setFollowupDetail] = useState('');

  const [notes, setNotes] = useState('');

  /* progress: only the three cores count */
  const filledCores = [
    morningEnergy || middayEnergy || eveningEnergy,
    hoursSlept !== null,
    moodEmoji,
  ].filter(Boolean).length;
  const progress = Math.round((filledCores / 3) * 100);

  const showFibroid = profile.has_fibroids !== 'no';
  const showMovement = profile.exercises_regularly;

  const handleSave = () => {
    toast.success("Logged. You showed up today. That counts.");
  };

  return (
    <div className="space-y-3 pb-4">
      <div>
        <h2 className="text-xl font-bold">How are you actually doing today?</h2>
        <p className="text-xs text-muted-foreground">{format(new Date(), 'EEEE, MMMM d')}</p>
      </div>

      <Progress value={progress} className="h-2" />
      <p className="text-xs text-muted-foreground">{progress}% logged · core sections only</p>

      <div className="space-y-2">
        {/* 1. Energy & Function */}
        <LogSection title="Energy & Function" description="How's the engine running?">
          <Field label="Morning energy">
            <Chips value={morningEnergy} onChange={setMorningEnergy} options={energyOpts} />
          </Field>
          <Field label="Midday energy">
            <Chips value={middayEnergy} onChange={setMiddayEnergy} options={energyOpts} />
          </Field>
          <Field label="End of day energy">
            <Chips value={eveningEnergy} onChange={setEveningEnergy} options={energyOpts} />
          </Field>
          <Field label="Today I was able to">
            <Chips
              value={capacity}
              onChange={setCapacity}
              options={[
                { value: 'full', label: 'Full capacity' },
                { value: 'got_through', label: 'Got through it' },
                { value: 'empty', label: 'Running on empty' },
                { value: 'rest', label: "Rest day, that's okay" },
              ]}
            />
          </Field>
          <Field label="Energy crashed today">
            <Chips
              value={crashTime}
              onChange={setCrashTime}
              options={[
                { value: 'none', label: 'No crash' },
                { value: 'morning', label: 'Morning' },
                { value: 'after_lunch', label: 'After lunch' },
                { value: 'late_afternoon', label: 'Late afternoon' },
                { value: 'evening', label: 'Evening' },
              ]}
            />
          </Field>
          {capacity === 'rest' && (
            <Field label="Rest helped?">
              <Chips
                value={restHelped}
                onChange={setRestHelped}
                options={[
                  { value: 'yes', label: 'Yes completely' },
                  { value: 'somewhat', label: 'Somewhat' },
                  { value: 'no', label: 'Not really' },
                ]}
              />
            </Field>
          )}
        </LogSection>

        {/* 2. Sleep */}
        <LogSection title="Sleep" description="Did your body actually rest last night?">
          <Field label="Hours slept">
            <div className="flex flex-wrap gap-1.5">
              {[4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9].map(h => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setHoursSlept(h)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs transition-colors',
                    hoursSlept === h
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card border-border hover:bg-muted text-foreground/80',
                  )}
                >
                  {h === 9 ? '9+' : h}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Sleep quality">
            <Chips
              value={sleepQuality}
              onChange={setSleepQuality}
              options={[
                { value: 'terrible', label: 'Terrible' },
                { value: 'poor', label: 'Poor' },
                { value: 'okay', label: 'Okay' },
                { value: 'good', label: 'Good' },
                { value: 'deep', label: 'Deep and restful' },
              ]}
            />
          </Field>
          <Field label="Woke during the night">
            <Chips
              value={wokeNight}
              onChange={setWokeNight}
              options={[
                { value: 'slept_through', label: 'Slept through' },
                { value: 'once', label: 'Once' },
                { value: 'few_times', label: 'A few times' },
                { value: 'all_night', label: 'Up and down all night' },
              ]}
            />
          </Field>
          <Field label="Night sweats">
            <Chips
              value={nightSweats}
              onChange={setNightSweats}
              options={[
                { value: 'none', label: 'None' },
                { value: 'mild', label: 'Mild' },
                { value: 'woke_me', label: 'Woke me up' },
              ]}
            />
          </Field>
          <Field label="Felt rested on waking">
            <Chips
              value={feltRested}
              onChange={setFeltRested}
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'kind_of', label: 'Kind of' },
                { value: 'no', label: 'Not at all' },
              ]}
            />
          </Field>
        </LogSection>

        {/* 3. Mood & Mind */}
        <LogSection title="Mood & Mind" description="The inside weather report">
          <Field label="Overall mood today">
            <div className="flex gap-2">
              {(['😔', '🙁', '😐', '🙂', '😄'] as const).map(e => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setMoodEmoji(e)}
                  className={cn(
                    'h-11 w-11 rounded-full border text-2xl transition-colors flex items-center justify-center',
                    moodEmoji === e ? 'bg-primary/10 border-primary scale-110' : 'bg-card border-border hover:bg-muted',
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Anxiety">
            <Chips
              value={anxiety}
              onChange={setAnxiety}
              options={[
                { value: 'none', label: 'None' },
                { value: 'hum', label: 'A hum in the background' },
                { value: 'noticeable', label: 'Noticeable' },
                { value: 'hard_to_shake', label: 'Hard to shake' },
              ]}
            />
          </Field>
          <Field label="Irritability">
            <Chips
              value={irritability}
              onChange={setIrritability}
              options={[
                { value: 'none', label: 'None' },
                { value: 'mild', label: 'Mild' },
                { value: 'a_lot', label: 'Everything was a lot' },
                { value: 'dont_talk', label: "Don't talk to me" },
              ]}
            />
          </Field>
          <Field label="Brain fog">
            <Chips
              value={brainFog}
              onChange={setBrainFog}
              options={[
                { value: 'sharp', label: 'Sharp' },
                { value: 'cloudy', label: 'Slightly cloudy' },
                { value: 'foggy', label: 'Foggy' },
                { value: 'cant_find_words', label: "Can't find my words" },
              ]}
            />
          </Field>
          <Field label="Memory">
            <Chips
              value={memory}
              onChange={setMemory}
              options={[
                { value: 'fine', label: 'Fine' },
                { value: 'gaps', label: 'A few gaps' },
                { value: 'what_was_i_doing', label: 'What was I just doing?' },
              ]}
            />
          </Field>
          <Field label="Motivation">
            <Chips
              value={motivation}
              onChange={setMotivation}
              options={[
                { value: 'ready', label: 'Ready' },
                { value: 'push', label: 'Had to push' },
                { value: 'struggled', label: 'Struggled' },
                { value: 'couldnt_start', label: "Couldn't start" },
              ]}
            />
          </Field>
          <Field label="Feeling like yourself?">
            <Chips
              value={feelingYourself}
              onChange={setFeelingYourself}
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'mostly', label: 'Mostly' },
                { value: 'not_really', label: 'Not really' },
                { value: 'not_at_all', label: 'Not at all' },
              ]}
            />
          </Field>
          <Field label="Screen time">
            <Chips
              value={screenTime}
              onChange={setScreenTime}
              options={[
                { value: 'normal', label: 'Normal' },
                { value: 'more', label: 'More than usual' },
                { value: 'doom_scroll', label: 'Full doom scroll' },
                { value: 'numb', label: 'Numb, just staring' },
              ]}
            />
          </Field>
          <Field label="Social energy today">
            <Chips
              value={socialEnergy}
              onChange={setSocialEnergy}
              options={[
                { value: 'wanted_people', label: 'Wanted people around' },
                { value: 'either_way', label: 'Either way' },
                { value: 'needed_quiet', label: 'Needed quiet' },
                { value: 'antisocial', label: 'Fully antisocial' },
              ]}
            />
          </Field>
          {socialEnergy && (
            <Field label="Did your day match that?">
              <Chips
                value={socialMatch}
                onChange={setSocialMatch}
                options={[
                  { value: 'yes', label: 'Yes' },
                  { value: 'more_than_wanted', label: 'More social than I wanted' },
                  { value: 'less_than_wanted', label: 'Less than I wanted' },
                ]}
              />
            </Field>
          )}
          <Field label="Emotional eating">
            <Chips
              value={emotionalEating}
              onChange={setEmotionalEating}
              options={[
                { value: 'no', label: 'No' },
                { value: 'a_little', label: 'A little' },
                { value: 'yes', label: 'Yes' },
              ]}
            />
          </Field>
        </LogSection>

        {/* 4. Body Check */}
        <LogSection title="Body Check — How it feels today" description="What's your body saying?">
          <Field label="Headache or migraine today?">
            <Chips
              value={headache}
              onChange={setHeadache}
              options={[
                { value: 'none', label: 'None' },
                { value: 'mild', label: 'Mild headache' },
                { value: 'significant', label: 'Significant headache' },
                { value: 'migraine', label: 'Migraine' },
              ]}
            />
          </Field>
          {headache && headache !== 'none' && (
            <Field label="Where?">
              <Chips
                value={headacheLoc}
                onChange={setHeadacheLoc}
                options={[
                  { value: 'forehead', label: 'Forehead' },
                  { value: 'temples', label: 'Temples' },
                  { value: 'back', label: 'Back of head' },
                  { value: 'behind_eyes', label: 'Behind eyes' },
                  { value: 'whole_head', label: 'Whole head' },
                ]}
              />
            </Field>
          )}
          <Field label="Joint pain">
            <Chips
              value={jointPain}
              onChange={setJointPain}
              options={[
                { value: 'none', label: 'None' },
                { value: 'mild', label: 'Mild' },
                { value: 'noticeable', label: 'Noticeable' },
                { value: 'difficult', label: 'Difficult to ignore' },
              ]}
            />
          </Field>
          {jointPain && jointPain !== 'none' && (
            <Field label="Where? (tap any)">
              <MultiChips
                value={jointAreas}
                onChange={setJointAreas}
                options={[
                  { value: 'shoulders', label: 'Shoulders' },
                  { value: 'elbows', label: 'Elbows' },
                  { value: 'wrists', label: 'Wrists' },
                  { value: 'hips', label: 'Hips' },
                  { value: 'knees', label: 'Knees' },
                  { value: 'ankles', label: 'Ankles' },
                  { value: 'lower_back', label: 'Lower back' },
                  { value: 'upper_back', label: 'Upper back' },
                  { value: 'neck', label: 'Neck' },
                ]}
              />
            </Field>
          )}
          <Field label="Muscle aches">
            <Chips
              value={muscleAches}
              onChange={setMuscleAches}
              options={[
                { value: 'none', label: 'None' },
                { value: 'mild', label: 'Mild' },
                { value: 'noticeable', label: 'Noticeable' },
              ]}
            />
          </Field>
          <Field label="Morning stiffness">
            <Chips
              value={morningStiffness}
              onChange={setMorningStiffness}
              options={[
                { value: 'none', label: 'None' },
                { value: 'loosened', label: 'A little, loosened quickly' },
                { value: 'while', label: 'Took a while' },
                { value: 'midday', label: 'Still stiff by midday' },
              ]}
            />
          </Field>
          <Field label="Pelvic area">
            <Chips
              value={pelvicArea}
              onChange={setPelvicArea}
              options={[
                { value: 'none', label: 'No pain' },
                { value: 'mild', label: 'Mild pressure' },
                { value: 'noticeable', label: 'Noticeable pain' },
                { value: 'significant', label: 'Significant pain' },
              ]}
            />
          </Field>
          <Field label="Lower back">
            <Chips
              value={lowerBack}
              onChange={setLowerBack}
              options={[
                { value: 'fine', label: 'Fine' },
                { value: 'mild', label: 'Mild' },
                { value: 'noticeable', label: 'Noticeable' },
                { value: 'bad', label: 'Bad today' },
              ]}
            />
          </Field>
          <Field label="Breast tenderness">
            <Chips
              value={breastTenderness}
              onChange={setBreastTenderness}
              options={[
                { value: 'none', label: 'None' },
                { value: 'mild', label: 'Mild' },
                { value: 'noticeable', label: 'Noticeable' },
                { value: 'painful', label: 'Painful to touch' },
              ]}
            />
          </Field>
          <Field label="Hot or not?">
            <Chips
              value={perceivedTemp}
              onChange={setPerceivedTemp}
              options={[
                { value: 'comfortable', label: 'Comfortable' },
                { value: 'cold', label: 'Running cold' },
                { value: 'warm', label: 'Running warm' },
                { value: 'hot_flushes', label: 'Hot flushes' },
                { value: 'sweaty', label: 'Sweaty' },
                { value: 'erratic', label: 'All over the place' },
              ]}
            />
          </Field>
        </LogSection>

        {/* 5. Cycle */}
        <LogSection title="Cycle" description="What's happening">
          <Field label="Period today?">
            <Chips
              value={periodStatus}
              onChange={setPeriodStatus}
              options={[
                { value: 'none', label: 'Nothing' },
                { value: 'started', label: 'Started' },
                { value: 'ongoing', label: 'Ongoing' },
                { value: 'ended', label: 'Ended' },
                { value: 'spotting', label: 'Spotting' },
              ]}
            />
          </Field>
          {(periodStatus === 'started' || periodStatus === 'ongoing') && (
            <>
              <Field label="Flow">
                <Chips
                  value={flow}
                  onChange={setFlow}
                  options={[
                    { value: 'light', label: 'Light' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'heavy', label: 'Heavy' },
                    { value: 'very_heavy', label: 'Very heavy' },
                  ]}
                />
              </Field>
              <Field label="Clotting">
                <Chips
                  value={clotting}
                  onChange={setClotting}
                  options={[
                    { value: 'none', label: 'None' },
                    { value: 'small', label: 'Small' },
                    { value: 'large', label: 'Large' },
                  ]}
                />
              </Field>
              <Field label="Cramping">
                <Chips
                  value={cramping}
                  onChange={setCramping}
                  options={[
                    { value: 'none', label: 'None' },
                    { value: 'mild', label: 'Mild' },
                    { value: 'moderate', label: 'Moderate' },
                    { value: 'bad', label: 'Bad today' },
                  ]}
                />
              </Field>
            </>
          )}
          {(!periodStatus || periodStatus === 'none' || periodStatus === 'ended' || periodStatus === 'spotting') && (
            <Field label="Cycle phase (optional)">
              <Chips
                value={cyclePhase}
                onChange={setCyclePhase}
                options={[
                  { value: 'post_period', label: 'Post-period' },
                  { value: 'mid_cycle', label: 'Mid-cycle' },
                  { value: 'pre_period', label: 'Pre-period' },
                  { value: 'not_sure', label: 'Not sure' },
                ]}
              />
            </Field>
          )}
        </LogSection>

        {/* 6. Fibroid (conditional) */}
        {showFibroid && (
          <LogSection title="Fibroid check-in" description="Adds to today's body picture">
            <Field label="Pelvic heaviness">
              <Chips
                value={pelvicHeaviness}
                onChange={setPelvicHeaviness}
                options={[
                  { value: 'none', label: 'None' },
                  { value: 'mild', label: 'Mild' },
                  { value: 'moderate', label: 'Moderate' },
                  { value: 'significant', label: 'Significant' },
                ]}
              />
            </Field>
            <Field label="Abdomen feels distended">
              <Chips
                value={abdomenDistended}
                onChange={setAbdomenDistended}
                options={[
                  { value: 'no', label: 'No' },
                  { value: 'yes', label: 'Yes' },
                ]}
              />
            </Field>
            <Field label="Urinary urgency from pressure">
              <Chips
                value={urinaryUrgency}
                onChange={setUrinaryUrgency}
                options={[
                  { value: 'no', label: 'No' },
                  { value: 'yes', label: 'Yes' },
                ]}
              />
            </Field>
            <Field label="Anaemia signals (tap any)">
              <MultiChips
                value={anaemiaSignals}
                onChange={setAnaemiaSignals}
                options={[
                  { value: 'breathless', label: 'Breathless on stairs' },
                  { value: 'dizzy', label: 'Dizzy' },
                  { value: 'pale', label: 'Looking pale' },
                ]}
              />
            </Field>
          </LogSection>
        )}

        {/* 7. Skin, Hair & Breakouts */}
        <LogSection title="Skin, Hair & Breakouts" description="Your body shows up on the outside too">
          <Field label="Skin today">
            <Chips
              value={skinToday}
              onChange={setSkinToday}
              options={[
                { value: 'clear', label: 'Clear' },
                { value: 'few_spots', label: 'One or two spots' },
                { value: 'breaking_out', label: 'Breaking out' },
                { value: 'cystic', label: 'Cystic' },
                { value: 'irritated', label: 'Irritated and reactive' },
              ]}
            />
          </Field>
          {skinToday && skinToday !== 'clear' && (
            <Field label="Where? (tap any)">
              <MultiChips
                value={breakoutLocs}
                onChange={setBreakoutLocs}
                options={[
                  { value: 'forehead', label: 'Forehead' },
                  { value: 'jawline', label: 'Jawline' },
                  { value: 'chin', label: 'Chin' },
                  { value: 'cheeks', label: 'Cheeks' },
                  { value: 'neck', label: 'Neck' },
                  { value: 'back', label: 'Back' },
                  { value: 'chest', label: 'Chest' },
                ]}
              />
            </Field>
          )}
          <Field label="Skin feel">
            <Chips
              value={skinFeel}
              onChange={setSkinFeel}
              options={[
                { value: 'normal', label: 'Normal' },
                { value: 'dry', label: 'Dry' },
                { value: 'oily', label: 'Oily' },
                { value: 'sensitive', label: 'Sensitive' },
                { value: 'combination', label: 'Combination chaos' },
              ]}
            />
          </Field>
          <Field label="Anything new in your skincare today?">
            <Chips
              value={newSkincare}
              onChange={setNewSkincare}
              options={[
                { value: 'no', label: 'No' },
                { value: 'yes', label: 'Yes' },
              ]}
            />
          </Field>
          {newSkincare === 'yes' && (
            <input
              value={newSkincareDetail}
              onChange={e => setNewSkincareDetail(e.target.value)}
              placeholder="Product name…"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          )}
          <Field label="Hair shedding">
            <Chips
              value={hairShedding}
              onChange={setHairShedding}
              options={[
                { value: 'normal', label: 'Normal' },
                { value: 'more', label: 'More than usual' },
                { value: 'a_lot_more', label: 'A lot more than usual' },
              ]}
            />
          </Field>
          <Field label="Scalp">
            <Chips
              value={scalp}
              onChange={setScalp}
              options={[
                { value: 'fine', label: 'Fine' },
                { value: 'itchy', label: 'Itchy' },
                { value: 'dry', label: 'Dry' },
                { value: 'tender', label: 'Tender' },
              ]}
            />
          </Field>
        </LogSection>

        {/* 8. Appetite & Digestion */}
        <LogSection title="Appetite & Digestion" description="Hunger, cravings, gut feelings">
          <Field label="Appetite today">
            <Chips
              value={appetite}
              onChange={setAppetite}
              options={[
                { value: 'none', label: 'None' },
                { value: 'low', label: 'Low' },
                { value: 'normal', label: 'Normal' },
                { value: 'more', label: 'More than usual' },
                { value: 'couldnt_stop', label: "Couldn't stop eating" },
              ]}
            />
          </Field>
          <Field label="Cravings (tap any)">
            <MultiChips
              value={cravings}
              onChange={setCravings}
              options={[
                { value: 'none', label: 'None' },
                { value: 'sweet', label: 'Sweet' },
                { value: 'salty', label: 'Salty' },
                { value: 'carbs', label: 'Carbs' },
                { value: 'everything', label: 'Everything' },
                { value: 'specific', label: 'Something specific' },
              ]}
            />
          </Field>
          {cravings.includes('specific') && (
            <input
              value={cravingsDetail}
              onChange={e => setCravingsDetail(e.target.value)}
              placeholder="What were you craving?"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          )}
          <Field label="Bloating">
            <Chips
              value={bloating}
              onChange={setBloating}
              options={[
                { value: 'none', label: 'None' },
                { value: 'mild', label: 'Mild' },
                { value: 'noticeable', label: 'Noticeable' },
                { value: 'uncomfortable', label: 'Uncomfortable' },
              ]}
            />
          </Field>
          <Field label="Digestion">
            <Chips
              value={digestion}
              onChange={setDigestion}
              options={[
                { value: 'normal', label: 'Normal' },
                { value: 'sluggish', label: 'Sluggish' },
                { value: 'unsettled', label: 'Unsettled' },
                { value: 'nausea', label: 'Nausea' },
                { value: 'both_ends', label: 'Both ends having a moment' },
              ]}
            />
          </Field>
          <Field label="How things moved today">
            <Chips
              value={bowelMovements}
              onChange={setBowelMovements}
              options={[
                { value: 'none', label: "Didn't go" },
                { value: 'once_normal', label: 'Once, normal' },
                { value: 'multiple', label: 'A few times' },
                { value: 'loose', label: 'Loose' },
                { value: 'hard', label: 'Hard work' },
                { value: 'urgent', label: 'Urgent' },
              ]}
            />
          </Field>
          <Field label="Unusual thirst">
            <Chips
              value={unusualThirst}
              onChange={setUnusualThirst}
              options={[
                { value: 'no', label: 'No' },
                { value: 'yes', label: 'Yes' },
              ]}
            />
          </Field>
        </LogSection>

        {/* 9. Movement (conditional) */}
        {showMovement && (
          <LogSection title="Movement & Exercise" description="Did you move today?">
            <Field label="Did you exercise?">
              <Chips
                value={exercised}
                onChange={setExercised}
                options={[
                  { value: 'yes', label: 'Yes' },
                  { value: 'no', label: 'No' },
                  { value: 'planned_but_didnt', label: "Planned to but didn't" },
                ]}
              />
            </Field>
            {exercised === 'yes' && (
              <>
                <Field label="What did you do?">
                  <MultiChips
                    value={exerciseTypes}
                    onChange={setExerciseTypes}
                    options={[
                      { value: 'strength', label: 'Strength' },
                      { value: 'yoga_pilates', label: 'Yoga / Pilates' },
                      { value: 'walking', label: 'Walking' },
                      { value: 'running', label: 'Running' },
                      { value: 'cycling', label: 'Cycling' },
                      { value: 'swimming', label: 'Swimming' },
                      { value: 'dance', label: 'Dance' },
                      { value: 'other', label: 'Other' },
                    ]}
                  />
                </Field>
                <Field label="How long?">
                  <div className="flex flex-wrap gap-1.5">
                    {[15, 30, 45, 60, 75, 90].map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setDuration(m)}
                        className={cn(
                          'rounded-full border px-3 py-1.5 text-xs transition-colors',
                          duration === m
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-card border-border hover:bg-muted text-foreground/80',
                        )}
                      >
                        {m === 90 ? '90+' : m} mins
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Intensity">
                  <Chips
                    value={intensity}
                    onChange={setIntensity}
                    options={[
                      { value: 'easy', label: 'Easy' },
                      { value: 'moderate', label: 'Moderate' },
                      { value: 'hard', label: 'Hard' },
                      { value: 'left_it', label: 'Left everything there' },
                    ]}
                  />
                </Field>
                <Field label="Body during">
                  <Chips
                    value={bodyDuring}
                    onChange={setBodyDuring}
                    options={[
                      { value: 'great', label: 'Felt great' },
                      { value: 'got_through', label: 'Got through it' },
                      { value: 'modify', label: 'Had to modify' },
                      { value: 'stop', label: 'Had to stop' },
                    ]}
                  />
                </Field>
                <Field label="Body after">
                  <Chips
                    value={bodyAfter}
                    onChange={setBodyAfter}
                    options={[
                      { value: 'energised', label: 'Energised' },
                      { value: 'fine', label: 'Fine' },
                      { value: 'tired', label: 'Tired' },
                      { value: 'wrecked', label: 'Wrecked' },
                    ]}
                  />
                </Field>
                <Field label="Mind going in">
                  <Chips
                    value={mindGoingIn}
                    onChange={setMindGoingIn}
                    options={[
                      { value: 'motivated', label: 'Motivated' },
                      { value: 'neutral', label: 'Neutral' },
                      { value: 'push', label: 'Had to push myself' },
                      { value: 'didnt_want', label: "Really didn't want to" },
                    ]}
                  />
                </Field>
                <Field label="Mind vs body today">
                  <Chips
                    value={mindBody}
                    onChange={setMindBody}
                    options={[
                      { value: 'both', label: 'Both ready' },
                      { value: 'mind_not_body', label: "Mind ready, body wasn't" },
                      { value: 'body_not_mind', label: "Body ready, mind wasn't" },
                      { value: 'neither', label: 'Neither was feeling it' },
                    ]}
                  />
                </Field>
              </>
            )}
            {(exercised === 'no' || exercised === 'planned_but_didnt') && (
              <Field label="Rest day type">
                <Chips
                  value={restDayType}
                  onChange={setRestDayType}
                  options={[
                    { value: 'intentional', label: 'Intentional rest' },
                    { value: 'body_said_no', label: 'Body said no' },
                    { value: 'just_didnt', label: "Just didn't happen" },
                  ]}
                />
              </Field>
            )}
          </LogSection>
        )}

        {/* 10. Substances */}
        <LogSection title="Substances" description="No judgment, just data">
            <Field label="Alcohol last night or today?">
              <Chips
                value={alcohol}
                onChange={setAlcohol}
                options={[
                  { value: 'none', label: 'None' },
                  { value: '1-2', label: '1–2 drinks' },
                  { value: '3-4', label: '3–4 drinks' },
                  { value: '4_plus', label: 'More than that' },
                ]}
              />
            </Field>
            {alcohol && alcohol !== 'none' && (
              <Field label="Type">
                <Chips
                  value={alcoholType}
                  onChange={setAlcoholType}
                  options={[
                    { value: 'wine', label: 'Wine' },
                    { value: 'beer', label: 'Beer' },
                    { value: 'spirits', label: 'Spirits' },
                    { value: 'mixed', label: 'Mixed' },
                  ]}
                />
              </Field>
            )}
            <Field label="How do you feel about it today?">
              <Chips
                value={morningAfter}
                onChange={setMorningAfter}
                options={[
                  { value: 'fine', label: 'Fine' },
                  { value: 'slightly_off', label: 'Slightly off' },
                  { value: 'rough', label: 'Rough' },
                  { value: 'regrets', label: 'Regrets' },
                ]}
              />
            </Field>
            <Field label="Caffeine">
              <Chips
                value={caffeine}
                onChange={setCaffeine}
                options={[
                  { value: 'normal', label: 'Normal' },
                  { value: 'more', label: 'More than usual' },
                  { value: 'less', label: 'Less than usual' },
                  { value: 'none', label: 'None' },
                ]}
              />
            </Field>
          </LogSection>

        {/* 11. What's New */}
        <LogSection title="What's new?" description="Something different today?">
          <Field label="New food or ingredient?">
            <input
              value={newFood}
              onChange={e => setNewFood(e.target.value)}
              placeholder="e.g. miso, kombucha, new spice…"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </Field>
          <Field label="New product?">
            <input
              value={newProduct}
              onChange={e => setNewProduct(e.target.value)}
              placeholder="Product name…"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {newProduct && (
              <div className="pt-2">
                <Chips
                  value={newProductType}
                  onChange={setNewProductType}
                  options={[
                    { value: 'topical', label: 'Topical' },
                    { value: 'ingestible', label: 'Ingestible' },
                    { value: 'other', label: 'Other' },
                  ]}
                />
              </div>
            )}
          </Field>
          <Field label="Something different about your day?">
            <Chips
              value={dayDifferent}
              onChange={setDayDifferent}
              options={[
                { value: 'travel', label: 'Travel' },
                { value: 'stress', label: 'Unusual stress' },
                { value: 'late_night', label: 'Late night' },
                { value: 'routine', label: 'Change in routine' },
                { value: 'other', label: 'Other' },
              ]}
            />
          </Field>
          <Field label="How did you feel in the hours after?">
            <Chips
              value={followupFeel}
              onChange={setFollowupFeel}
              options={[
                { value: 'fine', label: 'Fine' },
                { value: 'off', label: 'Something felt a bit off' },
              ]}
            />
          </Field>
          {followupFeel === 'off' && (
            <input
              value={followupDetail}
              onChange={e => setFollowupDetail(e.target.value)}
              placeholder="What did you notice?"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          )}
        </LogSection>

        {/* 12. Anything else */}
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm font-semibold mb-2">Anything else?</p>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Free text. No prompt. No judgment."
            className="w-full rounded-md border bg-background p-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring min-h-[80px]"
          />
        </div>
      </div>

      <div className="sticky bottom-20 pt-2 z-10">
        <Button onClick={handleSave} className="w-full shadow-lg" size="lg">
          Save today's log
        </Button>
      </div>
    </div>
  );
};

export default DailyLog;
