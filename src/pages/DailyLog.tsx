import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { format } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type Severity = 'none' | 'mild' | 'moderate' | 'severe';

const SeverityPicker = ({ value, onChange, label }: { value: Severity; onChange: (v: Severity) => void; label: string }) => (
  <div className="space-y-1">
    <p className="text-xs text-muted-foreground">{label}</p>
    <div className="flex gap-2">
      {(['none', 'mild', 'moderate', 'severe'] as Severity[]).map(s => (
        <button
          key={s}
          onClick={() => onChange(s)}
          className={cn("rounded-full px-3 py-1 text-xs transition-colors border",
            value === s ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:bg-muted")}
        >
          {s}
        </button>
      ))}
    </div>
  </div>
);

const ScalePicker = ({ value, onChange, label, max = 5 }: { value: number; onChange: (v: number) => void; label: string; max?: number }) => (
  <div className="space-y-1">
    <p className="text-xs text-muted-foreground">{label}</p>
    <div className="flex gap-2">
      {Array.from({ length: max }, (_, i) => i + 1).map(n => (
        <button
          key={n}
          onClick={() => onChange(n)}
          className={cn("h-9 w-9 rounded-full text-sm font-medium transition-colors border",
            value === n ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:bg-muted")}
        >
          {n}
        </button>
      ))}
    </div>
  </div>
);

const OptionPicker = ({ value, onChange, label, options }: { value: string; onChange: (v: string) => void; label: string; options: { value: string; label: string }[] }) => (
  <div className="space-y-1">
    <p className="text-xs text-muted-foreground">{label}</p>
    <div className="flex flex-wrap gap-2">
      {options.map(o => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn("rounded-full px-3 py-1 text-xs transition-colors border",
            value === o.value ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:bg-muted")}
        >
          {o.label}
        </button>
      ))}
    </div>
  </div>
);

const ToggleChip = ({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) => (
  <button
    onClick={() => onChange(!value)}
    className={cn("rounded-full px-3 py-1.5 text-xs transition-colors border",
      value ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:bg-muted")}
  >
    {label}
  </button>
);

interface SectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const LogSection = ({ title, description, children, defaultOpen = false }: SectionProps) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border bg-card p-4 hover:bg-muted/50 transition-colors">
        <div className="text-left">
          <p className="text-sm font-medium">{title}</p>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-1 rounded-lg border bg-card p-4 space-y-4">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
};

const DailyLog = () => {
  const { profile } = useApp();

  const [energy, setEnergy] = useState(0);
  const [capacity, setCapacity] = useState('');
  const [crashTime, setCrashTime] = useState('none');
  const [sleepHours, setSleepHours] = useState(0);
  const [sleepQuality, setSleepQuality] = useState(0);
  const [nightSweats, setNightSweats] = useState<Severity>('none');
  const [wokeNight, setWokeNight] = useState('no');
  const [feltRested, setFeltRested] = useState('');
  const [moodScore, setMoodScore] = useState(0);
  const [anxiety, setAnxiety] = useState<Severity>('none');
  const [irritability, setIrritability] = useState<Severity>('none');
  const [brainFog, setBrainFog] = useState<Severity>('none');
  const [socialEnergy, setSocialEnergy] = useState('');
  const [feelingYourself, setFeelingYourself] = useState('');
  const [periodStatus, setPeriodStatus] = useState('none');
  const [flowIntensity, setFlowIntensity] = useState('none');
  const [cramping, setCramping] = useState<Severity>('none');
  const [pelvicPain, setPelvicPain] = useState<Severity>('none');
  const [pelvicHeaviness, setPelvicHeaviness] = useState<Severity>('none');
  const [exercised, setExercised] = useState('');
  const [notes, setNotes] = useState('');
  const [showExtra, setShowExtra] = useState(false);

  // Calculate completion
  const filledSections = [energy > 0, sleepHours > 0, moodScore > 0].filter(Boolean).length;
  const totalSections = 3;
  const progress = Math.round((filledSections / totalSections) * 100);

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
      <p className="text-xs text-muted-foreground">{progress}% logged</p>

      <div className="space-y-2">
        {/* Energy & Function */}
        <LogSection title="Energy & Function" description="How's the engine running?" defaultOpen={true}>
          <ScalePicker value={energy} onChange={setEnergy} label="Energy level" />
          <OptionPicker value={capacity} onChange={setCapacity} label="Functional capacity" options={[
            { value: 'full', label: 'Full capacity' },
            { value: 'reduced', label: 'Reduced' },
            { value: 'rest', label: "Rest day. That's ok." },
          ]} />
          <OptionPicker value={crashTime} onChange={setCrashTime} label="Energy crash?" options={[
            { value: 'none', label: 'No crash' },
            { value: 'morning', label: 'Morning' },
            { value: 'afternoon', label: 'Afternoon' },
            { value: 'evening', label: 'Evening' },
          ]} />
        </LogSection>

        {/* Sleep */}
        <LogSection title="Sleep" description="Did your body actually rest?">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Hours slept</p>
            <div className="flex flex-wrap gap-2">
              {[4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9].map(h => (
                <button key={h} onClick={() => setSleepHours(h)}
                  className={cn("rounded-full px-3 py-1 text-xs border transition-colors",
                    sleepHours === h ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:bg-muted")}>
                  {h}
                </button>
              ))}
            </div>
          </div>
          <ScalePicker value={sleepQuality} onChange={setSleepQuality} label="Sleep quality" />
          <SeverityPicker value={nightSweats} onChange={setNightSweats} label="Night sweats" />
          <OptionPicker value={wokeNight} onChange={setWokeNight} label="Woke during the night?" options={[
            { value: 'no', label: 'Slept through' },
            { value: 'once', label: 'Once' },
            { value: 'multiple', label: 'Multiple times' },
          ]} />
          <OptionPicker value={feltRested} onChange={setFeltRested} label="Feel rested?" options={[
            { value: 'yes', label: 'Yes' },
            { value: 'partial', label: 'Kind of' },
            { value: 'no', label: 'Not at all' },
          ]} />
        </LogSection>

        {/* Mood & Mental */}
        <LogSection title="Mood & Mental" description="The inside weather report">
          <ScalePicker value={moodScore} onChange={setMoodScore} label="Overall mood" />
          <SeverityPicker value={anxiety} onChange={setAnxiety} label="Anxiety" />
          <SeverityPicker value={irritability} onChange={setIrritability} label="Irritability" />
          <SeverityPicker value={brainFog} onChange={setBrainFog} label="Brain fog" />
          <OptionPicker value={socialEnergy} onChange={setSocialEnergy} label="Social energy" options={[
            { value: 'wanted_people', label: 'Wanted people' },
            { value: 'content_either_way', label: 'Either way' },
            { value: 'needed_quiet', label: 'Needed quiet' },
            { value: 'avoided_people', label: 'Avoided people' },
          ]} />
          <OptionPicker value={feelingYourself} onChange={setFeelingYourself} label="Feeling like yourself?" options={[
            { value: 'yes', label: 'Yes' },
            { value: 'mostly', label: 'Mostly' },
            { value: 'not_really', label: 'Not really' },
            { value: 'not_at_all', label: 'Not at all' },
          ]} />
        </LogSection>

        {/* Cycle */}
        <LogSection title="Cycle" description="What's happening">
          <OptionPicker value={periodStatus} onChange={setPeriodStatus} label="Period status" options={[
            { value: 'none', label: 'Nothing today' },
            { value: 'started', label: 'Started' },
            { value: 'ongoing', label: 'Ongoing' },
            { value: 'ended', label: 'Ended' },
            { value: 'spotting', label: 'Spotting' },
          ]} />
          {periodStatus !== 'none' && (
            <>
              <OptionPicker value={flowIntensity} onChange={setFlowIntensity} label="Flow" options={[
                { value: 'light', label: 'Light' },
                { value: 'medium', label: 'Medium' },
                { value: 'heavy', label: 'Heavy' },
                { value: 'very_heavy', label: 'Very heavy' },
              ]} />
              <SeverityPicker value={cramping} onChange={setCramping} label="Cramping" />
            </>
          )}
        </LogSection>

        {/* Fibroid — conditional */}
        {profile.has_fibroids !== 'no' && (
          <LogSection title="Fibroid check-in" description="Your body's been loud about this one">
            <SeverityPicker value={pelvicPain} onChange={setPelvicPain} label="Pelvic pain" />
            <SeverityPicker value={pelvicHeaviness} onChange={setPelvicHeaviness} label="Pelvic heaviness" />
          </LogSection>
        )}

        {/* Activity — conditional */}
        {profile.exercises_regularly && (
          <LogSection title="Movement" description="Did you move today?">
            <OptionPicker value={exercised} onChange={setExercised} label="" options={[
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'Nah' },
              { value: 'planned_but_didnt', label: 'Planned to but didn\'t' },
            ]} />
          </LogSection>
        )}

        {/* Extra sections */}
        {!showExtra && (
          <button onClick={() => setShowExtra(true)} className="flex items-center gap-1 text-xs text-primary hover:underline w-full justify-center py-2">
            <Plus className="h-3 w-3" /> Track something else today
          </button>
        )}

        {showExtra && (
          <>
            <LogSection title="Skin & Hair">
              <p className="text-xs text-muted-foreground">Coming soon — section shell ready</p>
            </LogSection>
            <LogSection title="Cardiovascular">
              <p className="text-xs text-muted-foreground">Coming soon — section shell ready</p>
            </LogSection>
            <LogSection title="Urological">
              <p className="text-xs text-muted-foreground">Coming soon — section shell ready</p>
            </LogSection>
            <LogSection title="Substances">
              <p className="text-xs text-muted-foreground">Coming soon — section shell ready</p>
            </LogSection>
          </>
        )}

        {/* What's New — collapsed */}
        <LogSection title="What's new?" description="Try something different today?">
          <p className="text-xs text-muted-foreground">New food, product, activity, or environment change</p>
          <textarea
            placeholder="Anything worth noting..."
            className="w-full rounded-md border bg-background p-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring min-h-[60px]"
          />
        </LogSection>

        {/* Free text */}
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm font-medium mb-2">Anything else on your mind?</p>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Free text. No judgment."
            className="w-full rounded-md border bg-background p-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring min-h-[80px]"
          />
        </div>
      </div>

      <div className="sticky bottom-20 pt-2">
        <Button onClick={handleSave} className="w-full" size="lg">
          Save today's log
        </Button>
      </div>
    </div>
  );
};

export default DailyLog;
