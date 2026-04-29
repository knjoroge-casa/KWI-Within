import { useState } from 'react';
import { format, parseISO, addDays, subDays } from 'date-fns';
import { Plus, AlertTriangle, FileText, ChevronDown, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

/* ================================================================
   TYPES
   ================================================================ */

interface HealthCondition {
  id: string;
  condition_name: string;
  date_diagnosed: string;
  status: 'active' | 'managed' | 'in_remission';
  managing_doctor?: string;
  notes?: string;
}

interface Illness {
  id: string;
  name: string;
  start_date: string;
  end_date?: string;
  ongoing: boolean;
  severity: 'mild' | 'moderate' | 'significant';
  treatment?: string;
  notes?: string;
}

interface LabParameter {
  name: string;
  value: number;
  unit: string;
  ref_low: number;
  ref_high: number;
}

interface LabResult {
  id: string;
  test_name: string;
  date: string;
  lab_name?: string;
  parameters: LabParameter[];
  has_pdf: boolean;
}

interface Scan {
  id: string;
  scan_type: string;
  date: string;
  facility?: string;
  findings: string;
  plain_language_summary?: string;
  has_pdf: boolean;
}

interface Medication {
  id: string;
  name: string;
  type: 'prescribed' | 'otc';
  dose: string;
  frequency: string;
  start_date: string;
  end_date?: string;
  currently_taking: boolean;
  prescriber?: string;
  reason?: string;
  notes?: string;
}

interface Supplement {
  id: string;
  name: string;
  dose: string;
  frequency: string;
  start_date: string;
  end_date?: string;
  currently_taking: boolean;
  reason?: string;
  notes?: string;
}

interface UpcomingAppointment {
  id: string;
  provider: string;
  specialty: string;
  date_time: string;
  discussion: string;
  prep?: string;
}

interface PastAppointment {
  id: string;
  provider: string;
  specialty: string;
  date: string;
  summary: string;
  action_items?: string;
  followup_date?: string;
  new_diagnosis?: string;
}

/* ================================================================
   HELPERS
   ================================================================ */

const _today = new Date();
const dAgo = (n: number) => format(subDays(_today, n), 'yyyy-MM-dd');
const dFrom = (n: number) => format(addDays(_today, n), 'yyyy-MM-dd');

const getParamTrend = (labs: LabResult[], testName: string, paramName: string): number[] =>
  [...labs]
    .filter(l => l.test_name === testName)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .flatMap(l => l.parameters.filter(p => p.name === paramName).map(p => p.value));

/* ================================================================
   PLACEHOLDER DATA
   ================================================================ */

const INIT_CONDITIONS: HealthCondition[] = [
  {
    id: 'cond-1',
    condition_name: 'Uterine Fibroids',
    date_diagnosed: '2022-03-14',
    status: 'active',
    managing_doctor: 'Dr Chen',
    notes: 'Intramural fibroid 4.2cm posterior wall, subserosal fibroid 2.1cm fundal. Currently monitoring. Repeat scan every 6–12 months.',
  },
  {
    id: 'cond-2',
    condition_name: 'Perimenopause',
    date_diagnosed: '2023-09-01',
    status: 'active',
    managing_doctor: 'Dr Chen',
    notes: 'Suspected perimenopause based on cycle irregularity, FSH levels, and symptom pattern. Not yet formally confirmed.',
  },
  {
    id: 'cond-3',
    condition_name: 'Iron Deficiency Anaemia',
    date_diagnosed: '2024-02-01',
    status: 'managed',
    managing_doctor: 'Dr Osei',
    notes: 'Secondary to heavy menstrual bleeding from fibroids. Currently supplementing with iron bisglycinate.',
  },
];

const INIT_ILLNESSES: Illness[] = [
  {
    id: 'ill-1',
    name: 'COVID-19',
    start_date: '2024-03-10',
    end_date: '2024-03-24',
    ongoing: false,
    severity: 'moderate',
    treatment: 'Rest, paracetamol, Paxlovid. Off work for 2 weeks.',
    notes: 'Fatigue lingered for several weeks after the acute illness cleared.',
  },
  {
    id: 'ill-2',
    name: 'Flu',
    start_date: '2023-01-08',
    end_date: '2023-01-15',
    ongoing: false,
    severity: 'mild',
    treatment: 'Rest and fluids. No medication.',
  },
];

const INIT_LABS: LabResult[] = [
  {
    id: 'lab-1',
    test_name: 'Full Blood Count',
    date: dAgo(35),
    lab_name: 'CityLab',
    has_pdf: true,
    parameters: [
      { name: 'Haemoglobin', value: 11.2, unit: 'g/dL', ref_low: 12.0, ref_high: 15.5 },
      { name: 'WBC', value: 6.8, unit: '×10⁹/L', ref_low: 4.0, ref_high: 11.0 },
      { name: 'Platelets', value: 245, unit: '×10⁹/L', ref_low: 150, ref_high: 400 },
      { name: 'MCV', value: 78, unit: 'fL', ref_low: 80, ref_high: 100 },
    ],
  },
  {
    id: 'lab-1b',
    test_name: 'Full Blood Count',
    date: dAgo(90),
    lab_name: 'CityLab',
    has_pdf: true,
    parameters: [
      { name: 'Haemoglobin', value: 11.8, unit: 'g/dL', ref_low: 12.0, ref_high: 15.5 },
      { name: 'WBC', value: 7.2, unit: '×10⁹/L', ref_low: 4.0, ref_high: 11.0 },
      { name: 'Platelets', value: 231, unit: '×10⁹/L', ref_low: 150, ref_high: 400 },
      { name: 'MCV', value: 76, unit: 'fL', ref_low: 80, ref_high: 100 },
    ],
  },
  {
    id: 'lab-2',
    test_name: 'Iron Studies',
    date: dAgo(35),
    lab_name: 'CityLab',
    has_pdf: true,
    parameters: [
      { name: 'Ferritin', value: 15, unit: 'ng/mL', ref_low: 20, ref_high: 200 },
      { name: 'Serum Iron', value: 8.1, unit: 'µmol/L', ref_low: 9.0, ref_high: 30.4 },
      { name: 'TIBC', value: 82, unit: 'µmol/L', ref_low: 45, ref_high: 72 },
    ],
  },
  {
    id: 'lab-2b',
    test_name: 'Iron Studies',
    date: dAgo(90),
    lab_name: 'CityLab',
    has_pdf: false,
    parameters: [
      { name: 'Ferritin', value: 18, unit: 'ng/mL', ref_low: 20, ref_high: 200 },
      { name: 'Serum Iron', value: 9.5, unit: 'µmol/L', ref_low: 9.0, ref_high: 30.4 },
      { name: 'TIBC', value: 79, unit: 'µmol/L', ref_low: 45, ref_high: 72 },
    ],
  },
  {
    id: 'lab-3',
    test_name: 'Thyroid Panel',
    date: dAgo(35),
    lab_name: 'CityLab',
    has_pdf: false,
    parameters: [
      { name: 'TSH', value: 2.1, unit: 'mIU/L', ref_low: 0.4, ref_high: 4.0 },
      { name: 'Free T4', value: 14.2, unit: 'pmol/L', ref_low: 12.0, ref_high: 22.0 },
    ],
  },
];

const INIT_SCANS: Scan[] = [
  {
    id: 'scan-1',
    scan_type: 'Transvaginal Ultrasound',
    date: dAgo(60),
    facility: "Women's Imaging Centre",
    findings: 'Intramural fibroid 4.2cm posterior wall. Subserosal fibroid 2.1cm fundal. Endometrium 8mm. Normal ovaries bilaterally.',
    plain_language_summary: 'Two fibroids — one inside the uterine wall (4.2cm) and one on the outer surface (2.1cm). Uterine lining normal. Ovaries fine.',
    has_pdf: true,
  },
  {
    id: 'scan-2',
    scan_type: 'Pelvic Ultrasound',
    date: dAgo(365),
    facility: 'City Radiology',
    findings: 'Single intramural fibroid 3.8cm posterior wall. Endometrium 7mm. Normal ovaries.',
    plain_language_summary: 'One fibroid, slightly smaller than more recent scan. Everything else normal.',
    has_pdf: false,
  },
];

const INIT_MEDICATIONS: Medication[] = [
  {
    id: 'med-1',
    name: 'Tranexamic Acid',
    type: 'prescribed',
    dose: '500mg',
    frequency: 'As needed',
    start_date: dAgo(120),
    currently_taking: true,
    prescriber: 'Dr Chen',
    reason: 'Heavy menstrual bleeding',
    notes: 'Take at first sign of heavy flow. Max 4 tablets per day for up to 4 days.',
  },
  {
    id: 'med-2',
    name: 'Ibuprofen',
    type: 'otc',
    dose: '400mg',
    frequency: 'As needed',
    start_date: dAgo(365),
    currently_taking: true,
    reason: 'Period pain and inflammation',
  },
];

const INIT_SUPPLEMENTS: Supplement[] = [
  {
    id: 'sup-1',
    name: 'Iron Bisglycinate',
    dose: '25mg',
    frequency: 'Once daily',
    start_date: dAgo(90),
    currently_taking: true,
    reason: 'Low ferritin. Gentler on the stomach than ferrous sulphate.',
  },
  {
    id: 'sup-2',
    name: 'Vitamin D3',
    dose: '2000 IU',
    frequency: 'Once daily',
    start_date: dAgo(180),
    currently_taking: true,
    reason: 'General deficiency. Supports immune function and mood.',
  },
  {
    id: 'sup-3',
    name: 'Magnesium Glycinate',
    dose: '300mg',
    frequency: 'Once daily',
    start_date: dAgo(60),
    currently_taking: true,
    reason: 'Sleep quality, muscle tension, and PMS.',
  },
];

const INIT_UPCOMING: UpcomingAppointment[] = [
  {
    id: 'apt-up-1',
    provider: 'Dr Chen',
    specialty: 'Gynaecology',
    date_time: dFrom(45) + 'T10:30',
    discussion: 'Review latest bloods. Discuss UAE vs myomectomy options. Ask about HRT timeline.',
    prep: 'Bring previous ultrasound report. Print blood results.',
  },
  {
    id: 'apt-up-2',
    provider: 'Dr Osei',
    specialty: 'GP',
    date_time: dFrom(14) + 'T09:00',
    discussion: 'Repeat blood test referral. Fatigue not improving.',
  },
];

const INIT_PAST: PastAppointment[] = [
  {
    id: 'apt-past-1',
    provider: 'Dr Chen',
    specialty: 'Gynaecology',
    date: dAgo(10),
    summary: 'Reviewed ultrasound. Fibroids stable. Discussed management options including UAE and myomectomy. Continue iron supplementation.',
    action_items: 'Repeat bloods in 3 months. Consider MRI if symptoms worsen.',
    followup_date: dFrom(80),
  },
  {
    id: 'apt-past-2',
    provider: 'Dr Osei',
    specialty: 'GP',
    date: dAgo(45),
    summary: 'Annual check-in. Blood pressure normal. Referred for full blood count and iron studies. Discussed perimenopause symptoms — agreed to monitor.',
    action_items: 'Follow up on blood results. Increase iron-rich foods.',
  },
  {
    id: 'apt-past-3',
    provider: 'Dr Chen',
    specialty: 'Gynaecology',
    date: dAgo(120),
    summary: 'Initial fibroid consultation. Confirmed intramural and subserosal fibroids from scan. Prescribed tranexamic acid. Plan: watch and wait.',
    action_items: 'Start tranexamic acid. Schedule repeat ultrasound in 6 months.',
  },
];

/* ================================================================
   SHARED UI PRIMITIVES
   ================================================================ */

const PillToggle = ({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) => (
  <div className="flex gap-1 bg-muted rounded-full p-1 w-fit">
    {options.map(o => (
      <button
        key={o.value}
        onClick={() => onChange(o.value)}
        className={cn(
          'rounded-full px-3 py-1 text-xs font-medium transition-colors',
          value === o.value
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        {o.label}
      </button>
    ))}
  </div>
);

const EmptyState = ({ message }: { message: string }) => (
  <div className="rounded-lg border bg-card p-8 text-center">
    <p className="text-sm text-muted-foreground">{message}</p>
  </div>
);

const StatusBadge = ({ status }: { status: HealthCondition['status'] }) => {
  const map: Record<HealthCondition['status'], { label: string; cls: string }> = {
    active: { label: 'Active', cls: 'bg-destructive/10 text-destructive' },
    managed: { label: 'Managed', cls: 'bg-primary/10 text-primary' },
    in_remission: { label: 'In remission', cls: 'bg-accent/20 text-accent-foreground' },
  };
  const { label, cls } = map[status];
  return <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', cls)}>{label}</span>;
};

const SeverityBadge = ({ severity }: { severity: Illness['severity'] }) => {
  const map: Record<Illness['severity'], { label: string; cls: string }> = {
    mild: { label: 'Mild', cls: 'bg-muted text-muted-foreground' },
    moderate: { label: 'Moderate', cls: 'bg-primary/10 text-primary' },
    significant: { label: 'Significant', cls: 'bg-destructive/10 text-destructive' },
  };
  const { label, cls } = map[severity];
  return <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', cls)}>{label}</span>;
};

const TypeBadge = ({ type }: { type: 'prescribed' | 'otc' }) => (
  <span className={cn(
    'rounded-full px-2 py-0.5 text-[10px] font-medium',
    type === 'prescribed' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
  )}>
    {type === 'prescribed' ? 'Prescribed' : 'OTC'}
  </span>
);

const Sparkline = ({ data }: { data: number[] }) => {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const h = 20;
  const w = 48;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`)
    .join(' ');
  return (
    <svg width={w} height={h} className="inline-block align-middle shrink-0">
      <polyline fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" points={pts} />
    </svg>
  );
};

const PDFPlaceholder = () => (
  <button className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2 mt-2 w-full hover:bg-muted transition-colors text-left">
    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
    <span className="text-xs text-muted-foreground">PDF report attached — tap to view</span>
  </button>
);

const FormField = ({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) => (
  <div className="space-y-1.5">
    <p className="text-xs font-medium text-foreground/70">
      {label}
      {required && <span className="text-destructive ml-0.5">*</span>}
    </p>
    {children}
  </div>
);

const FormInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className={cn(
      'w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring',
      props.className,
    )}
  />
);

const FormTextarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    {...props}
    className={cn(
      'w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring min-h-[72px] resize-none',
      props.className,
    )}
  />
);

const FormChips = ({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) => (
  <div className="flex flex-wrap gap-1.5">
    {options.map(o => (
      <button
        key={o.value}
        type="button"
        onClick={() => onChange(o.value)}
        className={cn(
          'rounded-full border px-3 py-1.5 text-xs transition-colors',
          value === o.value
            ? 'bg-primary text-primary-foreground border-primary'
            : 'bg-card border-border hover:bg-muted text-foreground/80',
        )}
      >
        {o.label}
      </button>
    ))}
  </div>
);

const SectionHeader = ({
  title,
  description,
  addLabel,
  open,
  setOpen,
  formContent,
}: {
  title: string;
  description: string;
  addLabel: string;
  open: boolean;
  setOpen: (v: boolean) => void;
  formContent: React.ReactNode;
}) => (
  <div>
    <div className="flex items-start justify-between gap-2 mb-1">
      <div>
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1 shrink-0 mt-1">
            <Plus className="h-3.5 w-3.5" /> {addLabel}
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto rounded-t-xl pb-8">
          {formContent}
        </SheetContent>
      </Sheet>
    </div>
  </div>
);

/* ================================================================
   HEALTH HISTORY TAB
   ================================================================ */

const HealthHistoryTab = () => {
  const [sub, setSub] = useState<'ongoing' | 'illnesses'>('ongoing');
  const [conditions, setConditions] = useState<HealthCondition[]>(INIT_CONDITIONS);
  const [illnesses, setIllnesses] = useState<Illness[]>(INIT_ILLNESSES);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Add condition form
  const [condOpen, setCondOpen] = useState(false);
  const [condName, setCondName] = useState('');
  const [condDate, setCondDate] = useState('');
  const [condStatus, setCondStatus] = useState<HealthCondition['status']>('active');
  const [condDoctor, setCondDoctor] = useState('');
  const [condNotes, setCondNotes] = useState('');

  const resetCondForm = () => {
    setCondName(''); setCondDate(''); setCondStatus('active'); setCondDoctor(''); setCondNotes('');
  };

  const handleAddCondition = () => {
    if (!condName || !condDate) return;
    setConditions(prev => [{
      id: `cond-${Date.now()}`,
      condition_name: condName,
      date_diagnosed: condDate,
      status: condStatus,
      managing_doctor: condDoctor || undefined,
      notes: condNotes || undefined,
    }, ...prev]);
    resetCondForm();
    setCondOpen(false);
  };

  // Add illness form
  const [illOpen, setIllOpen] = useState(false);
  const [illName, setIllName] = useState('');
  const [illStart, setIllStart] = useState('');
  const [illEnd, setIllEnd] = useState('');
  const [illOngoing, setIllOngoing] = useState(false);
  const [illSeverity, setIllSeverity] = useState<Illness['severity']>('mild');
  const [illTreatment, setIllTreatment] = useState('');
  const [illNotes, setIllNotes] = useState('');

  const resetIllForm = () => {
    setIllName(''); setIllStart(''); setIllEnd(''); setIllOngoing(false);
    setIllSeverity('mild'); setIllTreatment(''); setIllNotes('');
  };

  const handleAddIllness = () => {
    if (!illName || !illStart) return;
    setIllnesses(prev => [{
      id: `ill-${Date.now()}`,
      name: illName,
      start_date: illStart,
      end_date: illOngoing ? undefined : illEnd || undefined,
      ongoing: illOngoing,
      severity: illSeverity,
      treatment: illTreatment || undefined,
      notes: illNotes || undefined,
    }, ...prev]);
    resetIllForm();
    setIllOpen(false);
  };

  const isCondOpen = sub === 'ongoing' ? condOpen : illOpen;
  const setIsOpen = sub === 'ongoing' ? setCondOpen : setIllOpen;

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Health History"
        description="Conditions, diagnoses and illnesses, past and present"
        addLabel="Add"
        open={isCondOpen}
        setOpen={v => {
          setIsOpen(v);
          if (!v) { resetCondForm(); resetIllForm(); }
        }}
        formContent={
          sub === 'ongoing' ? (
            <>
              <SheetHeader className="mb-4">
                <SheetTitle>Add Condition</SheetTitle>
              </SheetHeader>
              <div className="space-y-4">
                <FormField label="Condition name" required>
                  <FormInput value={condName} onChange={e => setCondName(e.target.value)} placeholder="e.g. Uterine fibroids" />
                </FormField>
                <FormField label="Date diagnosed" required>
                  <FormInput type="date" value={condDate} onChange={e => setCondDate(e.target.value)} />
                </FormField>
                <FormField label="Status">
                  <FormChips value={condStatus} onChange={v => setCondStatus(v as HealthCondition['status'])}
                    options={[
                      { value: 'active', label: 'Active' },
                      { value: 'managed', label: 'Managed' },
                      { value: 'in_remission', label: 'In remission' },
                    ]} />
                </FormField>
                <FormField label="Managing doctor (optional)">
                  <FormInput value={condDoctor} onChange={e => setCondDoctor(e.target.value)} placeholder="Dr name" />
                </FormField>
                <FormField label="Notes (optional)">
                  <FormTextarea value={condNotes} onChange={e => setCondNotes(e.target.value)} placeholder="Any context worth keeping…" />
                </FormField>
                <Button onClick={handleAddCondition} className="w-full" disabled={!condName || !condDate}>Save</Button>
              </div>
            </>
          ) : (
            <>
              <SheetHeader className="mb-4">
                <SheetTitle>Add Illness or Bout</SheetTitle>
              </SheetHeader>
              <div className="space-y-4">
                <FormField label="Name or description" required>
                  <FormInput value={illName} onChange={e => setIllName(e.target.value)} placeholder="e.g. COVID-19, bad flu, UTI" />
                </FormField>
                <FormField label="Start date" required>
                  <FormInput type="date" value={illStart} onChange={e => setIllStart(e.target.value)} />
                </FormField>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="ill-ongoing"
                    checked={illOngoing}
                    onChange={e => setIllOngoing(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="ill-ongoing" className="text-sm text-muted-foreground">Still ongoing</label>
                </div>
                {!illOngoing && (
                  <FormField label="End date">
                    <FormInput type="date" value={illEnd} onChange={e => setIllEnd(e.target.value)} />
                  </FormField>
                )}
                <FormField label="Severity">
                  <FormChips value={illSeverity} onChange={v => setIllSeverity(v as Illness['severity'])}
                    options={[
                      { value: 'mild', label: 'Mild' },
                      { value: 'moderate', label: 'Moderate' },
                      { value: 'significant', label: 'Significant' },
                    ]} />
                </FormField>
                <FormField label="How it was treated (optional)">
                  <FormTextarea value={illTreatment} onChange={e => setIllTreatment(e.target.value)} placeholder="What helped…" />
                </FormField>
                <FormField label="Notes (optional)">
                  <FormTextarea value={illNotes} onChange={e => setIllNotes(e.target.value)} placeholder="Any other context…" />
                </FormField>
                <Button onClick={handleAddIllness} className="w-full" disabled={!illName || !illStart}>Save</Button>
              </div>
            </>
          )
        }
      />

      <PillToggle
        options={[
          { value: 'ongoing', label: 'Ongoing Conditions' },
          { value: 'illnesses', label: 'Illnesses & Bouts' },
        ]}
        value={sub}
        onChange={v => { setSub(v as typeof sub); setExpandedId(null); }}
      />

      {sub === 'ongoing' && (
        conditions.length === 0 ? (
          <EmptyState message="Nothing added yet. This is a good place to start." />
        ) : (
          <div className="space-y-2">
            {conditions.map(c => {
              const expanded = expandedId === c.id;
              return (
                <div key={c.id} className="rounded-lg border bg-card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold">{c.condition_name}</p>
                        <StatusBadge status={c.status} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Diagnosed {format(parseISO(c.date_diagnosed), 'MMM yyyy')}
                        {c.managing_doctor && ` · ${c.managing_doctor}`}
                      </p>
                      {!expanded && c.notes && (
                        <p className="mt-1.5 text-xs text-muted-foreground line-clamp-1">{c.notes}</p>
                      )}
                    </div>
                    {c.notes && (
                      <button
                        onClick={() => setExpandedId(expanded ? null : c.id)}
                        className="text-muted-foreground hover:text-foreground shrink-0 mt-0.5"
                      >
                        <ChevronDown className={cn('h-4 w-4 transition-transform', expanded && 'rotate-180')} />
                      </button>
                    )}
                  </div>
                  {expanded && c.notes && (
                    <p className="mt-2 text-xs text-muted-foreground border-t pt-2 leading-relaxed">{c.notes}</p>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      {sub === 'illnesses' && (
        illnesses.length === 0 ? (
          <EmptyState message="No illnesses logged. Hopefully it stays that way." />
        ) : (
          <div className="space-y-2">
            {illnesses.map(ill => {
              const expanded = expandedId === ill.id;
              const hasDetail = ill.treatment || ill.notes;
              return (
                <div key={ill.id} className="rounded-lg border bg-card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold">{ill.name}</p>
                        <SeverityBadge severity={ill.severity} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(parseISO(ill.start_date), 'MMM yyyy')}
                        {ill.ongoing
                          ? ' — ongoing'
                          : ill.end_date
                          ? ` — ${format(parseISO(ill.end_date), 'MMM yyyy')}`
                          : ''}
                      </p>
                      {!expanded && ill.treatment && (
                        <p className="mt-1.5 text-xs text-muted-foreground line-clamp-1">{ill.treatment}</p>
                      )}
                    </div>
                    {hasDetail && (
                      <button
                        onClick={() => setExpandedId(expanded ? null : ill.id)}
                        className="text-muted-foreground hover:text-foreground shrink-0 mt-0.5"
                      >
                        <ChevronDown className={cn('h-4 w-4 transition-transform', expanded && 'rotate-180')} />
                      </button>
                    )}
                  </div>
                  {expanded && (
                    <div className="mt-2 border-t pt-2 space-y-1.5">
                      {ill.treatment && (
                        <p className="text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">Treatment: </span>
                          {ill.treatment}
                        </p>
                      )}
                      {ill.notes && <p className="text-xs text-muted-foreground">{ill.notes}</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
};

/* ================================================================
   LABS TAB
   ================================================================ */

type LabParam = { name: string; value: string; unit: string; ref_low: string; ref_high: string };
const emptyParam = (): LabParam => ({ name: '', value: '', unit: '', ref_low: '', ref_high: '' });

const PLACEHOLDER_EXTRACTION: { testName: string; labName: string; params: LabParam[] } = {
  testName: 'Full Blood Count',
  labName: 'CityLab',
  params: [
    { name: 'Haemoglobin', value: '11.4', unit: 'g/dL', ref_low: '12.0', ref_high: '15.5' },
    { name: 'WBC', value: '6.5', unit: '×10⁹/L', ref_low: '4.0', ref_high: '11.0' },
    { name: 'Platelets', value: '238', unit: '×10⁹/L', ref_low: '150', ref_high: '400' },
  ],
};

const LabsTab = () => {
  const [labs, setLabs] = useState<LabResult[]>(INIT_LABS);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [addMode, setAddMode] = useState<'choose' | 'upload' | 'uploading' | 'confirm' | 'manual'>('choose');

  // Manual form state
  const [testName, setTestName] = useState('');
  const [labDate, setLabDate] = useState('');
  const [labName, setLabName] = useState('');
  const [params, setParams] = useState<LabParam[]>([emptyParam()]);
  const [hasPdf, setHasPdf] = useState(false);

  const resetForm = () => {
    setTestName(''); setLabDate(''); setLabName('');
    setParams([emptyParam()]); setHasPdf(false); setAddMode('choose');
  };

  const handleSave = () => {
    if (!testName || !labDate || params.every(p => !p.name)) return;
    const validParams = params.filter(p => p.name && p.value);
    setLabs(prev => [{
      id: `lab-${Date.now()}`,
      test_name: testName,
      date: labDate,
      lab_name: labName || undefined,
      has_pdf: hasPdf,
      parameters: validParams.map(p => ({
        name: p.name,
        value: parseFloat(p.value),
        unit: p.unit,
        ref_low: parseFloat(p.ref_low) || 0,
        ref_high: parseFloat(p.ref_high) || 0,
      })),
    }, ...prev]);
    resetForm();
    setOpen(false);
  };

  const handleFileSelect = () => {
    setAddMode('uploading');
    setTimeout(() => {
      setTestName(PLACEHOLDER_EXTRACTION.testName);
      setLabName(PLACEHOLDER_EXTRACTION.labName);
      setParams(PLACEHOLDER_EXTRACTION.params);
      setHasPdf(true);
      setAddMode('confirm');
    }, 1200);
  };

  const sortedLabs = [...labs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  // Deduplicate: show latest result per test_name in the list
  const latestByTest = new Map<string, LabResult>();
  sortedLabs.forEach(l => { if (!latestByTest.has(l.test_name)) latestByTest.set(l.test_name, l); });

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold">Labs</h2>
          <p className="text-xs text-muted-foreground">Blood tests and other lab results</p>
        </div>
        <Sheet open={open} onOpenChange={v => { setOpen(v); if (!v) resetForm(); }}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1 shrink-0 mt-1">
              <Plus className="h-3.5 w-3.5" /> Add
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto rounded-t-xl pb-8">
            {addMode === 'choose' && (
              <>
                <SheetHeader className="mb-6">
                  <SheetTitle>Add lab results</SheetTitle>
                </SheetHeader>
                <div className="space-y-3">
                  <label className="block rounded-lg border-2 border-dashed border-border bg-muted/30 p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors">
                    <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium">Upload PDF report</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Values will be extracted automatically</p>
                    <input
                      type="file"
                      accept=".pdf"
                      className="sr-only"
                      onChange={handleFileSelect}
                    />
                  </label>
                  <div className="relative flex items-center gap-3">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground">or</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  <Button variant="outline" className="w-full" onClick={() => setAddMode('manual')}>
                    Enter manually
                  </Button>
                </div>
              </>
            )}

            {addMode === 'uploading' && (
              <div className="py-12 text-center space-y-2">
                <p className="text-sm font-medium">Extracting values…</p>
                <p className="text-xs text-muted-foreground">Reading your lab report</p>
              </div>
            )}

            {(addMode === 'confirm' || addMode === 'manual') && (
              <>
                <SheetHeader className="mb-4">
                  <SheetTitle>
                    {addMode === 'confirm' ? 'Confirm extracted values' : 'Add lab results'}
                  </SheetTitle>
                </SheetHeader>
                {addMode === 'confirm' && (
                  <div className="mb-4 rounded-lg border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                    These values were read from your PDF. Review and edit before saving.
                  </div>
                )}
                <div className="space-y-4">
                  <FormField label="Test name" required>
                    <FormInput value={testName} onChange={e => setTestName(e.target.value)} placeholder="e.g. Full Blood Count" />
                  </FormField>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="Date" required>
                      <FormInput type="date" value={labDate} onChange={e => setLabDate(e.target.value)} />
                    </FormField>
                    <FormField label="Lab name">
                      <FormInput value={labName} onChange={e => setLabName(e.target.value)} placeholder="Optional" />
                    </FormField>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-foreground/70 mb-2">Parameters</p>
                    <div className="space-y-3">
                      {params.map((p, i) => (
                        <div key={i} className="rounded-lg border bg-muted/30 p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-medium text-muted-foreground">Parameter {i + 1}</p>
                            {params.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setParams(prev => prev.filter((_, j) => j !== i))}
                                className="text-xs text-muted-foreground hover:text-destructive"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                          <FormInput
                            value={p.name}
                            onChange={e => setParams(prev => prev.map((x, j) => j === i ? { ...x, name: e.target.value } : x))}
                            placeholder="Name (e.g. Haemoglobin)"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <FormInput
                              value={p.value}
                              onChange={e => setParams(prev => prev.map((x, j) => j === i ? { ...x, value: e.target.value } : x))}
                              placeholder="Value"
                              type="number"
                            />
                            <FormInput
                              value={p.unit}
                              onChange={e => setParams(prev => prev.map((x, j) => j === i ? { ...x, unit: e.target.value } : x))}
                              placeholder="Unit (e.g. g/dL)"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <FormInput
                              value={p.ref_low}
                              onChange={e => setParams(prev => prev.map((x, j) => j === i ? { ...x, ref_low: e.target.value } : x))}
                              placeholder="Ref low"
                              type="number"
                            />
                            <FormInput
                              value={p.ref_high}
                              onChange={e => setParams(prev => prev.map((x, j) => j === i ? { ...x, ref_high: e.target.value } : x))}
                              placeholder="Ref high"
                              type="number"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setParams(prev => [...prev, emptyParam()])}
                      className="mt-2 text-xs text-primary hover:text-primary/80 font-medium"
                    >
                      + Add parameter
                    </button>
                  </div>

                  <Button onClick={handleSave} className="w-full" disabled={!testName || !labDate}>Save</Button>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>

      {labs.length === 0 ? (
        <EmptyState message="No lab results yet. Add your first or upload a report." />
      ) : (
        <div className="space-y-2">
          {[...latestByTest.values()].map(result => {
            const expanded = expandedId === result.id;
            const hasFlag = result.parameters.some(p => p.value < p.ref_low || p.value > p.ref_high);
            return (
              <div key={result.id} className="rounded-lg border bg-card">
                <button
                  onClick={() => setExpandedId(expanded ? null : result.id)}
                  className="w-full p-4 text-left"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{result.test_name}</p>
                        {hasFlag && <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(parseISO(result.date), 'dd MMM yyyy')}
                        {result.lab_name && ` · ${result.lab_name}`}
                      </p>
                    </div>
                    <ChevronDown className={cn('h-4 w-4 text-muted-foreground shrink-0 mt-0.5 transition-transform', expanded && 'rotate-180')} />
                  </div>
                </button>

                {expanded && (
                  <div className="border-t px-4 pb-4 pt-3 space-y-2">
                    {result.parameters.map(p => {
                      const inRange = p.value >= p.ref_low && p.value <= p.ref_high;
                      const trend = getParamTrend(labs, result.test_name, p.name);
                      return (
                        <div key={p.name} className="flex items-center justify-between gap-2 py-1.5 border-b border-border/50 last:border-0">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-foreground truncate">{p.name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              ref {p.ref_low}–{p.ref_high} {p.unit}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Sparkline data={trend} />
                            <div className="text-right">
                              <p className={cn('text-sm font-semibold', !inRange && 'text-destructive')}>
                                {p.value} {p.unit}
                              </p>
                              {!inRange && (
                                <p className="text-[10px] text-destructive">Outside range</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {result.has_pdf && <PDFPlaceholder />}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ================================================================
   SCANS TAB
   ================================================================ */

const ScansTab = () => {
  const [scans, setScans] = useState<Scan[]>(INIT_SCANS);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const [scanType, setScanType] = useState('');
  const [scanTypeOther, setScanTypeOther] = useState('');
  const [scanDate, setScanDate] = useState('');
  const [facility, setFacility] = useState('');
  const [findings, setFindings] = useState('');
  const [summary, setSummary] = useState('');
  const [hasPdf, setHasPdf] = useState(false);

  const resetForm = () => {
    setScanType(''); setScanTypeOther(''); setScanDate('');
    setFacility(''); setFindings(''); setSummary(''); setHasPdf(false);
  };

  const handleSave = () => {
    const finalType = scanType === 'other' ? scanTypeOther : scanType;
    if (!finalType || !scanDate || !findings) return;
    setScans(prev => [{
      id: `scan-${Date.now()}`,
      scan_type: finalType,
      date: scanDate,
      facility: facility || undefined,
      findings,
      plain_language_summary: summary || undefined,
      has_pdf: hasPdf,
    }, ...prev]);
    resetForm();
    setOpen(false);
  };

  const sorted = [...scans].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const scanTypeOpts = ['Ultrasound', 'MRI', 'X-ray', 'CT scan', 'Other'];

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Scans"
        description="Ultrasounds, MRIs, X-rays and imaging reports"
        addLabel="Add"
        open={open}
        setOpen={v => { setOpen(v); if (!v) resetForm(); }}
        formContent={
          <>
            <SheetHeader className="mb-4">
              <SheetTitle>Add Scan</SheetTitle>
            </SheetHeader>
            <div className="space-y-4">
              <FormField label="Scan type" required>
                <FormChips value={scanType} onChange={setScanType}
                  options={scanTypeOpts.map(s => ({ value: s.toLowerCase().replace(' ', '_'), label: s }))} />
                {scanType === 'other' && (
                  <FormInput className="mt-2" value={scanTypeOther} onChange={e => setScanTypeOther(e.target.value)} placeholder="Specify type…" />
                )}
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Date" required>
                  <FormInput type="date" value={scanDate} onChange={e => setScanDate(e.target.value)} />
                </FormField>
                <FormField label="Facility">
                  <FormInput value={facility} onChange={e => setFacility(e.target.value)} placeholder="Optional" />
                </FormField>
              </div>
              <FormField label="Key findings" required>
                <FormTextarea value={findings} onChange={e => setFindings(e.target.value)} placeholder="What the report says…" />
              </FormField>
              <FormField label="Plain language summary (optional)">
                <FormTextarea value={summary} onChange={e => setSummary(e.target.value)} placeholder="What it means in your own words…" />
              </FormField>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="file" accept=".pdf" className="sr-only" onChange={() => setHasPdf(true)} />
                <div className={cn(
                  'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors',
                  hasPdf ? 'border-primary text-primary bg-primary/5' : 'border-border text-muted-foreground hover:bg-muted',
                )}>
                  <Upload className="h-4 w-4" />
                  {hasPdf ? 'PDF attached' : 'Attach PDF report (optional)'}
                </div>
              </label>
              <Button onClick={handleSave} className="w-full"
                disabled={!(scanType === 'other' ? scanTypeOther : scanType) || !scanDate || !findings}>
                Save
              </Button>
            </div>
          </>
        }
      />

      {scans.length === 0 ? (
        <EmptyState message="No scans logged yet." />
      ) : (
        <div className="space-y-2">
          {sorted.map(scan => {
            const expanded = expandedId === scan.id;
            return (
              <div key={scan.id} className="rounded-lg border bg-card">
                <button
                  onClick={() => setExpandedId(expanded ? null : scan.id)}
                  className="w-full p-4 text-left"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{scan.scan_type}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(parseISO(scan.date), 'dd MMM yyyy')}
                        {scan.facility && ` · ${scan.facility}`}
                      </p>
                      {!expanded && (
                        <p className="mt-1.5 text-xs text-muted-foreground line-clamp-1">{scan.findings}</p>
                      )}
                    </div>
                    <ChevronDown className={cn('h-4 w-4 text-muted-foreground shrink-0 mt-0.5 transition-transform', expanded && 'rotate-180')} />
                  </div>
                </button>
                {expanded && (
                  <div className="border-t px-4 pb-4 pt-3 space-y-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-1">Findings</p>
                      <p className="text-xs text-foreground/90 leading-relaxed">{scan.findings}</p>
                    </div>
                    {scan.plain_language_summary && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-1">In plain language</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{scan.plain_language_summary}</p>
                      </div>
                    )}
                    {scan.has_pdf && <PDFPlaceholder />}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ================================================================
   MEDICATIONS TAB
   ================================================================ */

const MedicationsTab = () => {
  const [meds, setMeds] = useState<Medication[]>(INIT_MEDICATIONS);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const [name, setName] = useState('');
  const [medType, setMedType] = useState<'prescribed' | 'otc'>('prescribed');
  const [dose, setDose] = useState('');
  const [freq, setFreq] = useState('');
  const [freqOther, setFreqOther] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentlyTaking, setCurrentlyTaking] = useState(true);
  const [prescriber, setPrescriber] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  const resetForm = () => {
    setName(''); setMedType('prescribed'); setDose(''); setFreq(''); setFreqOther('');
    setStartDate(''); setEndDate(''); setCurrentlyTaking(true); setPrescriber('');
    setReason(''); setNotes('');
  };

  const handleSave = () => {
    if (!name || !dose || !startDate) return;
    const finalFreq = freq === 'other' ? freqOther : freq;
    setMeds(prev => [{
      id: `med-${Date.now()}`,
      name, type: medType, dose,
      frequency: finalFreq,
      start_date: startDate,
      end_date: currentlyTaking ? undefined : endDate || undefined,
      currently_taking: currentlyTaking,
      prescriber: medType === 'prescribed' ? (prescriber || undefined) : undefined,
      reason: reason || undefined,
      notes: notes || undefined,
    }, ...prev]);
    resetForm();
    setOpen(false);
  };

  const sorted = [...meds].sort((a, b) => {
    if (a.currently_taking !== b.currently_taking) return a.currently_taking ? -1 : 1;
    return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
  });

  const freqOpts = ['Once daily', 'Twice daily', 'As needed', 'Other'];

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Medications"
        description="Prescribed and over-the-counter medications you're taking"
        addLabel="Add"
        open={open}
        setOpen={v => { setOpen(v); if (!v) resetForm(); }}
        formContent={
          <>
            <SheetHeader className="mb-4">
              <SheetTitle>Add Medication</SheetTitle>
            </SheetHeader>
            <div className="space-y-4">
              <FormField label="Medication name" required>
                <FormInput value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Tranexamic Acid" />
              </FormField>
              <FormField label="Type">
                <FormChips value={medType} onChange={v => setMedType(v as 'prescribed' | 'otc')}
                  options={[{ value: 'prescribed', label: 'Prescribed' }, { value: 'otc', label: 'Over the counter' }]} />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Dose" required>
                  <FormInput value={dose} onChange={e => setDose(e.target.value)} placeholder="e.g. 500mg" />
                </FormField>
                <FormField label="Start date" required>
                  <FormInput type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </FormField>
              </div>
              <FormField label="Frequency">
                <FormChips value={freq} onChange={setFreq}
                  options={freqOpts.map(f => ({ value: f.toLowerCase().replace(' ', '_'), label: f }))} />
                {freq === 'other' && (
                  <FormInput className="mt-2" value={freqOther} onChange={e => setFreqOther(e.target.value)} placeholder="e.g. Every 8 hours" />
                )}
              </FormField>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="med-current" checked={currentlyTaking} onChange={e => setCurrentlyTaking(e.target.checked)} className="rounded" />
                <label htmlFor="med-current" className="text-sm text-muted-foreground">Currently taking</label>
              </div>
              {!currentlyTaking && (
                <FormField label="End date">
                  <FormInput type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </FormField>
              )}
              {medType === 'prescribed' && (
                <FormField label="Prescriber (optional)">
                  <FormInput value={prescriber} onChange={e => setPrescriber(e.target.value)} placeholder="Dr name" />
                </FormField>
              )}
              <FormField label="Reason for taking (optional)">
                <FormInput value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Heavy menstrual bleeding" />
              </FormField>
              <FormField label="Notes (optional)">
                <FormTextarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Anything else worth noting…" />
              </FormField>
              <Button onClick={handleSave} className="w-full" disabled={!name || !dose || !startDate}>Save</Button>
            </div>
          </>
        }
      />

      {meds.length === 0 ? (
        <EmptyState message="Nothing here yet." />
      ) : (
        <div className="space-y-2">
          {sorted.map(med => {
            const expanded = expandedId === med.id;
            return (
              <div key={med.id} className="rounded-lg border bg-card">
                <button
                  onClick={() => setExpandedId(expanded ? null : med.id)}
                  className="w-full p-4 text-left"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold">{med.name}</p>
                        <TypeBadge type={med.type} />
                        {!med.currently_taking && (
                          <span className="rounded-full px-2 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground">Stopped</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {med.dose} — {med.frequency}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {med.currently_taking
                          ? `Since ${format(parseISO(med.start_date), 'MMM yyyy')}`
                          : `${format(parseISO(med.start_date), 'MMM yyyy')}${med.end_date ? ` — ${format(parseISO(med.end_date), 'MMM yyyy')}` : ''}`}
                      </p>
                    </div>
                    <ChevronDown className={cn('h-4 w-4 text-muted-foreground shrink-0 mt-0.5 transition-transform', expanded && 'rotate-180')} />
                  </div>
                </button>
                {expanded && (
                  <div className="border-t px-4 pb-4 pt-3 space-y-1.5">
                    {med.prescriber && (
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">Prescriber: </span>{med.prescriber}
                      </p>
                    )}
                    {med.reason && (
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">Reason: </span>{med.reason}
                      </p>
                    )}
                    {med.notes && (
                      <p className="text-xs text-muted-foreground leading-relaxed">{med.notes}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ================================================================
   SUPPLEMENTS TAB
   ================================================================ */

const SupplementsTab = () => {
  const [supps, setSupps] = useState<Supplement[]>(INIT_SUPPLEMENTS);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [freq, setFreq] = useState('');
  const [freqOther, setFreqOther] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentlyTaking, setCurrentlyTaking] = useState(true);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  const resetForm = () => {
    setName(''); setDose(''); setFreq(''); setFreqOther('');
    setStartDate(''); setEndDate(''); setCurrentlyTaking(true); setReason(''); setNotes('');
  };

  const handleSave = () => {
    if (!name || !dose || !startDate) return;
    const finalFreq = freq === 'other' ? freqOther : freq;
    setSupps(prev => [{
      id: `sup-${Date.now()}`,
      name, dose,
      frequency: finalFreq,
      start_date: startDate,
      end_date: currentlyTaking ? undefined : endDate || undefined,
      currently_taking: currentlyTaking,
      reason: reason || undefined,
      notes: notes || undefined,
    }, ...prev]);
    resetForm();
    setOpen(false);
  };

  const sorted = [...supps].sort((a, b) => {
    if (a.currently_taking !== b.currently_taking) return a.currently_taking ? -1 : 1;
    return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
  });

  const freqOpts = ['Once daily', 'Twice daily', 'As needed', 'Other'];

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Supplements"
        description="Vitamins, minerals and other supplements you're taking"
        addLabel="Add"
        open={open}
        setOpen={v => { setOpen(v); if (!v) resetForm(); }}
        formContent={
          <>
            <SheetHeader className="mb-4">
              <SheetTitle>Add Supplement</SheetTitle>
            </SheetHeader>
            <div className="space-y-4">
              <FormField label="Supplement name" required>
                <FormInput value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Iron Bisglycinate" />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Dose" required>
                  <FormInput value={dose} onChange={e => setDose(e.target.value)} placeholder="e.g. 25mg" />
                </FormField>
                <FormField label="Start date" required>
                  <FormInput type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </FormField>
              </div>
              <FormField label="Frequency">
                <FormChips value={freq} onChange={setFreq}
                  options={freqOpts.map(f => ({ value: f.toLowerCase().replace(' ', '_'), label: f }))} />
                {freq === 'other' && (
                  <FormInput className="mt-2" value={freqOther} onChange={e => setFreqOther(e.target.value)} placeholder="e.g. With meals" />
                )}
              </FormField>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="sup-current" checked={currentlyTaking} onChange={e => setCurrentlyTaking(e.target.checked)} className="rounded" />
                <label htmlFor="sup-current" className="text-sm text-muted-foreground">Currently taking</label>
              </div>
              {!currentlyTaking && (
                <FormField label="End date">
                  <FormInput type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </FormField>
              )}
              <FormField label="Reason or intention (optional)">
                <FormTextarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Why you're taking it…" />
              </FormField>
              <FormField label="Notes (optional)">
                <FormTextarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Anything else…" />
              </FormField>
              <Button onClick={handleSave} className="w-full" disabled={!name || !dose || !startDate}>Save</Button>
            </div>
          </>
        }
      />

      {supps.length === 0 ? (
        <EmptyState message="Nothing logged yet." />
      ) : (
        <div className="space-y-2">
          {sorted.map(sup => {
            const expanded = expandedId === sup.id;
            return (
              <div key={sup.id} className="rounded-lg border bg-card">
                <button
                  onClick={() => setExpandedId(expanded ? null : sup.id)}
                  className="w-full p-4 text-left"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{sup.name}</p>
                        {!sup.currently_taking && (
                          <span className="rounded-full px-2 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground">Stopped</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{sup.dose} — {sup.frequency}</p>
                      <p className="text-xs text-muted-foreground">
                        {sup.currently_taking
                          ? `Since ${format(parseISO(sup.start_date), 'MMM yyyy')}`
                          : `${format(parseISO(sup.start_date), 'MMM yyyy')}${sup.end_date ? ` — ${format(parseISO(sup.end_date), 'MMM yyyy')}` : ''}`}
                      </p>
                    </div>
                    <ChevronDown className={cn('h-4 w-4 text-muted-foreground shrink-0 mt-0.5 transition-transform', expanded && 'rotate-180')} />
                  </div>
                </button>
                {expanded && (sup.reason || sup.notes) && (
                  <div className="border-t px-4 pb-4 pt-3 space-y-1.5">
                    {sup.reason && (
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        <span className="font-medium text-foreground">Why: </span>{sup.reason}
                      </p>
                    )}
                    {sup.notes && <p className="text-xs text-muted-foreground">{sup.notes}</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ================================================================
   APPOINTMENTS TAB
   ================================================================ */

const AppointmentsTab = () => {
  const [sub, setSub] = useState<'upcoming' | 'past'>('upcoming');
  const [upcoming, setUpcoming] = useState<UpcomingAppointment[]>(INIT_UPCOMING);
  const [past, setPast] = useState<PastAppointment[]>(INIT_PAST);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Upcoming form
  const [upOpen, setUpOpen] = useState(false);
  const [upProvider, setUpProvider] = useState('');
  const [upSpecialty, setUpSpecialty] = useState('');
  const [upDate, setUpDate] = useState('');
  const [upTime, setUpTime] = useState('');
  const [upDiscussion, setUpDiscussion] = useState('');
  const [upPrep, setUpPrep] = useState('');

  const resetUpForm = () => {
    setUpProvider(''); setUpSpecialty(''); setUpDate('');
    setUpTime(''); setUpDiscussion(''); setUpPrep('');
  };

  const handleAddUpcoming = () => {
    if (!upProvider || !upDate || !upDiscussion) return;
    const dt = upTime ? `${upDate}T${upTime}` : upDate;
    setUpcoming(prev => [{
      id: `apt-up-${Date.now()}`,
      provider: upProvider,
      specialty: upSpecialty,
      date_time: dt,
      discussion: upDiscussion,
      prep: upPrep || undefined,
    }, ...prev].sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime()));
    resetUpForm();
    setUpOpen(false);
  };

  // Past form
  const [pastOpen, setPastOpen] = useState(false);
  const [pastProvider, setPastProvider] = useState('');
  const [pastSpecialty, setPastSpecialty] = useState('');
  const [pastDate, setPastDate] = useState('');
  const [pastSummary, setPastSummary] = useState('');
  const [pastActions, setPastActions] = useState('');
  const [pastFollowup, setPastFollowup] = useState('');
  const [pastNewDx, setPastNewDx] = useState('');

  const resetPastForm = () => {
    setPastProvider(''); setPastSpecialty(''); setPastDate('');
    setPastSummary(''); setPastActions(''); setPastFollowup(''); setPastNewDx('');
  };

  const handleAddPast = () => {
    if (!pastProvider || !pastDate || !pastSummary) return;
    setPast(prev => [{
      id: `apt-past-${Date.now()}`,
      provider: pastProvider,
      specialty: pastSpecialty,
      date: pastDate,
      summary: pastSummary,
      action_items: pastActions || undefined,
      followup_date: pastFollowup || undefined,
      new_diagnosis: pastNewDx || undefined,
    }, ...prev]);
    resetPastForm();
    setPastOpen(false);
  };

  const isOpen = sub === 'upcoming' ? upOpen : pastOpen;
  const setIsOpen = sub === 'upcoming' ? setUpOpen : setPastOpen;

  const sortedUpcoming = [...upcoming].sort((a, b) =>
    new Date(a.date_time).getTime() - new Date(b.date_time).getTime()
  );
  const sortedPast = [...past].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold">Appointments</h2>
          <p className="text-xs text-muted-foreground">Doctor and specialist consultations</p>
        </div>
        <Sheet open={isOpen} onOpenChange={v => { setIsOpen(v); if (!v) { resetUpForm(); resetPastForm(); } }}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1 shrink-0 mt-1">
              <Plus className="h-3.5 w-3.5" /> Add
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto rounded-t-xl pb-8">
            {sub === 'upcoming' ? (
              <>
                <SheetHeader className="mb-4">
                  <SheetTitle>Add Upcoming Appointment</SheetTitle>
                </SheetHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="Provider" required>
                      <FormInput value={upProvider} onChange={e => setUpProvider(e.target.value)} placeholder="Dr name" />
                    </FormField>
                    <FormField label="Specialty">
                      <FormInput value={upSpecialty} onChange={e => setUpSpecialty(e.target.value)} placeholder="e.g. Gynaecology" />
                    </FormField>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="Date" required>
                      <FormInput type="date" value={upDate} onChange={e => setUpDate(e.target.value)} />
                    </FormField>
                    <FormField label="Time">
                      <FormInput type="time" value={upTime} onChange={e => setUpTime(e.target.value)} />
                    </FormField>
                  </div>
                  <FormField label="What do you want to discuss?" required>
                    <FormTextarea value={upDiscussion} onChange={e => setUpDiscussion(e.target.value)} placeholder="Questions, concerns, updates to share…" />
                  </FormField>
                  <FormField label="Any prep needed? (optional)">
                    <FormTextarea value={upPrep} onChange={e => setUpPrep(e.target.value)} placeholder="Bring results, fast beforehand…" />
                  </FormField>
                  <Button onClick={handleAddUpcoming} className="w-full" disabled={!upProvider || !upDate || !upDiscussion}>Save</Button>
                </div>
              </>
            ) : (
              <>
                <SheetHeader className="mb-4">
                  <SheetTitle>Add Past Appointment</SheetTitle>
                </SheetHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="Provider" required>
                      <FormInput value={pastProvider} onChange={e => setPastProvider(e.target.value)} placeholder="Dr name" />
                    </FormField>
                    <FormField label="Specialty">
                      <FormInput value={pastSpecialty} onChange={e => setPastSpecialty(e.target.value)} placeholder="e.g. Gynaecology" />
                    </FormField>
                  </div>
                  <FormField label="Date" required>
                    <FormInput type="date" value={pastDate} onChange={e => setPastDate(e.target.value)} />
                  </FormField>
                  <FormField label="Summary" required>
                    <FormTextarea value={pastSummary} onChange={e => setPastSummary(e.target.value)} placeholder="What was discussed…" />
                  </FormField>
                  <FormField label="Action items (optional)">
                    <FormTextarea value={pastActions} onChange={e => setPastActions(e.target.value)} placeholder="Next steps, follow-ups…" />
                  </FormField>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="Follow-up date (optional)">
                      <FormInput type="date" value={pastFollowup} onChange={e => setPastFollowup(e.target.value)} />
                    </FormField>
                    <FormField label="New diagnosis/referral (optional)">
                      <FormInput value={pastNewDx} onChange={e => setPastNewDx(e.target.value)} placeholder="If any" />
                    </FormField>
                  </div>
                  <Button onClick={handleAddPast} className="w-full" disabled={!pastProvider || !pastDate || !pastSummary}>Save</Button>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>

      <PillToggle
        options={[{ value: 'upcoming', label: 'Upcoming' }, { value: 'past', label: 'Past' }]}
        value={sub}
        onChange={v => { setSub(v as typeof sub); setExpandedId(null); }}
      />

      {sub === 'upcoming' && (
        sortedUpcoming.length === 0 ? (
          <EmptyState message="No upcoming appointments." />
        ) : (
          <div className="space-y-2">
            {sortedUpcoming.map(apt => {
              const dt = parseISO(apt.date_time);
              const hasTime = apt.date_time.includes('T');
              const expanded = expandedId === apt.id;
              return (
                <div key={apt.id} className="rounded-lg border bg-card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{apt.provider}</p>
                      {apt.specialty && <p className="text-xs text-muted-foreground">{apt.specialty}</p>}
                      <p className="text-xs font-medium text-primary mt-1">
                        {format(dt, 'EEE d MMM')}{hasTime && ` at ${format(dt, 'HH:mm')}`}
                      </p>
                      {!expanded && (
                        <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">{apt.discussion}</p>
                      )}
                    </div>
                    <button onClick={() => setExpandedId(expanded ? null : apt.id)} className="text-muted-foreground hover:text-foreground shrink-0 mt-0.5">
                      <ChevronDown className={cn('h-4 w-4 transition-transform', expanded && 'rotate-180')} />
                    </button>
                  </div>
                  {expanded && (
                    <div className="mt-2 border-t pt-2 space-y-2">
                      <div>
                        <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-0.5">To discuss</p>
                        <p className="text-xs text-foreground/90 leading-relaxed">{apt.discussion}</p>
                      </div>
                      {apt.prep && (
                        <div>
                          <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-0.5">Prep</p>
                          <p className="text-xs text-muted-foreground">{apt.prep}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      {sub === 'past' && (
        sortedPast.length === 0 ? (
          <EmptyState message="No past appointments logged yet." />
        ) : (
          <div className="space-y-2">
            {sortedPast.map(apt => {
              const expanded = expandedId === apt.id;
              return (
                <div key={apt.id} className="rounded-lg border bg-card">
                  <button
                    onClick={() => setExpandedId(expanded ? null : apt.id)}
                    className="w-full p-4 text-left"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{apt.provider}</p>
                        {apt.specialty && <p className="text-xs text-muted-foreground">{apt.specialty}</p>}
                        <p className="text-xs text-muted-foreground mt-0.5">{format(parseISO(apt.date), 'dd MMM yyyy')}</p>
                        {!expanded && (
                          <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">{apt.summary}</p>
                        )}
                      </div>
                      <ChevronDown className={cn('h-4 w-4 text-muted-foreground shrink-0 mt-0.5 transition-transform', expanded && 'rotate-180')} />
                    </div>
                  </button>
                  {expanded && (
                    <div className="border-t px-4 pb-4 pt-3 space-y-2">
                      <div>
                        <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-0.5">Summary</p>
                        <p className="text-xs text-foreground/90 leading-relaxed">{apt.summary}</p>
                      </div>
                      {apt.action_items && (
                        <div>
                          <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-0.5">Action items</p>
                          <p className="text-xs text-muted-foreground">{apt.action_items}</p>
                        </div>
                      )}
                      {apt.followup_date && (
                        <div>
                          <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-0.5">Follow-up</p>
                          <p className="text-xs text-muted-foreground">{format(parseISO(apt.followup_date), 'dd MMM yyyy')}</p>
                        </div>
                      )}
                      {apt.new_diagnosis && (
                        <div>
                          <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-0.5">New diagnosis / referral</p>
                          <p className="text-xs text-muted-foreground">{apt.new_diagnosis}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
};

/* ================================================================
   MAIN PAGE
   ================================================================ */

const TABS = [
  { id: 'health_history', label: 'History' },
  { id: 'labs', label: 'Labs' },
  { id: 'scans', label: 'Scans' },
  { id: 'medications', label: 'Meds' },
  { id: 'supplements', label: 'Supps' },
  { id: 'appointments', label: 'Appts' },
];

const Records = () => {
  const [activeTab, setActiveTab] = useState('health_history');

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={cn(
              'rounded-full px-4 py-1.5 text-xs font-medium whitespace-nowrap transition-colors border shrink-0',
              activeTab === t.id
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card border-border hover:bg-muted',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'health_history' && <HealthHistoryTab />}
      {activeTab === 'labs' && <LabsTab />}
      {activeTab === 'scans' && <ScansTab />}
      {activeTab === 'medications' && <MedicationsTab />}
      {activeTab === 'supplements' && <SupplementsTab />}
      {activeTab === 'appointments' && <AppointmentsTab />}
    </div>
  );
};

export default Records;
