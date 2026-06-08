import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { Plus, AlertTriangle, ChevronDown, Upload, Info, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

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
}

interface Scan {
  id: string;
  scan_type: string;
  date: string;
  facility?: string;
  findings: string;
  plain_language_summary?: string;
}

interface Medication {
  id: string;
  name: string;
  med_type: 'prescribed' | 'otc';
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

interface Appointment {
  id: string;
  provider: string;
  date: string;
  specialty?: string;
  time?: string;
  what_to_discuss?: string;
  prep_needed?: string;
  summary?: string;
  action_items?: string;
  followup_date?: string;
  new_diagnosis?: string;
}

/* ================================================================
   DB LAYER
   ================================================================ */

type DbRecord = {
  id: string;
  record_type: string;
  title: string;
  date: string;
  details: Record<string, unknown>;
  attachment_url: string | null;
};

const dbToCondition = (r: DbRecord): HealthCondition => ({
  id: r.id,
  condition_name: r.title,
  date_diagnosed: r.date,
  status: (r.details.status as HealthCondition['status']) || 'active',
  managing_doctor: r.details.managing_doctor as string | undefined,
  notes: r.details.notes as string | undefined,
});

const dbToIllness = (r: DbRecord): Illness => ({
  id: r.id,
  name: r.title,
  start_date: r.date,
  end_date: r.details.end_date as string | undefined,
  ongoing: Boolean(r.details.ongoing),
  severity: (r.details.severity as Illness['severity']) || 'mild',
  treatment: r.details.treatment as string | undefined,
  notes: r.details.notes as string | undefined,
});

const dbToLab = (r: DbRecord): LabResult => ({
  id: r.id,
  test_name: r.title,
  date: r.date,
  lab_name: r.details.lab_name as string | undefined,
  parameters: (r.details.parameters as LabParameter[]) || [],
});

const dbToScan = (r: DbRecord): Scan => ({
  id: r.id,
  scan_type: r.title,
  date: r.date,
  facility: r.details.facility as string | undefined,
  findings: (r.details.findings as string) || '',
  plain_language_summary: r.details.plain_summary as string | undefined,
});

const dbToMedication = (r: DbRecord): Medication => ({
  id: r.id,
  name: r.title,
  med_type: (r.details.med_type as 'prescribed' | 'otc') || 'prescribed',
  dose: (r.details.dose as string) || '',
  frequency: (r.details.frequency as string) || '',
  start_date: r.date,
  end_date: r.details.end_date as string | undefined,
  currently_taking: Boolean(r.details.currently_taking),
  prescriber: r.details.prescriber as string | undefined,
  reason: r.details.reason as string | undefined,
  notes: r.details.notes as string | undefined,
});

const dbToSupplement = (r: DbRecord): Supplement => ({
  id: r.id,
  name: r.title,
  dose: (r.details.dose as string) || '',
  frequency: (r.details.frequency as string) || '',
  start_date: r.date,
  end_date: r.details.end_date as string | undefined,
  currently_taking: Boolean(r.details.currently_taking),
  reason: r.details.reason as string | undefined,
  notes: r.details.notes as string | undefined,
});

const dbToAppointment = (r: DbRecord): Appointment => ({
  id: r.id,
  provider: r.title,
  date: r.date,
  specialty: r.details.specialty as string | undefined,
  time: r.details.time as string | undefined,
  what_to_discuss: r.details.what_to_discuss as string | undefined,
  prep_needed: r.details.prep_needed as string | undefined,
  summary: r.details.summary as string | undefined,
  action_items: r.details.action_items as string | undefined,
  followup_date: r.details.followup_date as string | undefined,
  new_diagnosis: r.details.new_diagnosis as string | undefined,
});

async function fetchRecords(userId: string, recordType: string | string[]): Promise<DbRecord[]> {
  const q = supabase
    .from('medical_records')
    .select('id, record_type, title, date, details, attachment_url')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('date', { ascending: false });
  const { data } = Array.isArray(recordType)
    ? await q.in('record_type', recordType)
    : await q.eq('record_type', recordType);
  return (data ?? []) as DbRecord[];
}

async function softDelete(id: string) {
  await supabase
    .from('medical_records')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);
}

/* ================================================================
   SHARED UI
   ================================================================ */

const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse rounded-lg bg-muted ${className ?? ''}`} />
);

function useToast() {
  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);
  return { toast, showToast: setToast };
}

const ToastBar = ({ message }: { message: string }) => (
  <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 rounded-full bg-foreground text-background text-xs font-medium px-4 py-2 shadow-lg whitespace-nowrap">
    {message}
  </div>
);

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
        <SheetContent side="bottom" className="h-[90vh] max-h-[90vh] overflow-y-auto rounded-t-xl pb-8">
          {formContent}
        </SheetContent>
      </Sheet>
    </div>
  </div>
);

const CardActions = ({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) => (
  <div className="flex gap-3 mt-2 pt-2 border-t">
    <button
      onClick={onEdit}
      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
    >
      <Pencil className="h-3 w-3" /> Edit
    </button>
    <button
      onClick={onDelete}
      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
    >
      <Trash2 className="h-3 w-3" /> Delete
    </button>
  </div>
);

const DeleteConfirm = ({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) => (
  <div className="flex items-center gap-2 mt-2 pt-2 border-t">
    <p className="text-xs text-muted-foreground flex-1">Delete this record?</p>
    <button
      onClick={onCancel}
      className="text-xs text-muted-foreground hover:text-foreground px-2 py-1"
    >
      Cancel
    </button>
    <button
      onClick={onConfirm}
      className="text-xs text-destructive font-medium hover:text-destructive/80 px-2 py-1"
    >
      Delete
    </button>
  </div>
);

/* ================================================================
   HEALTH HISTORY TAB
   ================================================================ */

const HealthHistoryTab = ({ userId }: { userId: string }) => {
  const [sub, setSub] = useState<'ongoing' | 'illnesses'>('ongoing');
  const [conditions, setConditions] = useState<HealthCondition[]>([]);
  const [illnesses, setIllnesses] = useState<Illness[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast, showToast } = useToast();

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    fetchRecords(userId, ['condition', 'illness']).then(rows => {
      setConditions(rows.filter(r => r.record_type === 'condition').map(dbToCondition));
      setIllnesses(rows.filter(r => r.record_type === 'illness').map(dbToIllness));
      setLoading(false);
    });
  }, [userId]);

  // ── Condition form ─────────────────────────────────────────────
  const [condOpen, setCondOpen] = useState(false);
  const [condName, setCondName] = useState('');
  const [condDate, setCondDate] = useState('');
  const [condStatus, setCondStatus] = useState<HealthCondition['status']>('active');
  const [condDoctor, setCondDoctor] = useState('');
  const [condNotes, setCondNotes] = useState('');

  const resetCondForm = () => {
    setCondName(''); setCondDate(''); setCondStatus('active'); setCondDoctor(''); setCondNotes('');
  };

  const handleEditCondition = (c: HealthCondition) => {
    setCondName(c.condition_name);
    setCondDate(c.date_diagnosed);
    setCondStatus(c.status);
    setCondDoctor(c.managing_doctor || '');
    setCondNotes(c.notes || '');
    setEditingId(c.id);
    setCondOpen(true);
  };

  const handleSaveCondition = async () => {
    if (!condName || !condDate) return;
    const details = {
      status: condStatus,
      managing_doctor: condDoctor || null,
      notes: condNotes || null,
    };
    const item: HealthCondition = {
      id: editingId ?? '',
      condition_name: condName,
      date_diagnosed: condDate,
      status: condStatus,
      managing_doctor: condDoctor || undefined,
      notes: condNotes || undefined,
    };
    if (editingId) {
      await supabase.from('medical_records').update({ title: condName, date: condDate, details }).eq('id', editingId);
      setConditions(prev => prev.map(c => c.id === editingId ? item : c));
      showToast('Saved');
    } else {
      const { data } = await supabase
        .from('medical_records')
        .insert({ user_id: userId, record_type: 'condition', title: condName, date: condDate, details })
        .select('id')
        .single();
      if (data) setConditions(prev => [{ ...item, id: data.id }, ...prev]);
    }
    resetCondForm();
    setEditingId(null);
    setCondOpen(false);
  };

  const handleDeleteCondition = async (id: string) => {
    await softDelete(id);
    setConditions(prev => prev.filter(c => c.id !== id));
    setDeleteConfirmId(null);
    setExpandedId(null);
    showToast('Deleted');
  };

  // ── Illness form ───────────────────────────────────────────────
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

  const handleEditIllness = (ill: Illness) => {
    setIllName(ill.name);
    setIllStart(ill.start_date);
    setIllEnd(ill.end_date || '');
    setIllOngoing(ill.ongoing);
    setIllSeverity(ill.severity);
    setIllTreatment(ill.treatment || '');
    setIllNotes(ill.notes || '');
    setEditingId(ill.id);
    setIllOpen(true);
  };

  const handleSaveIllness = async () => {
    if (!illName || !illStart) return;
    const details = {
      end_date: illOngoing ? null : illEnd || null,
      ongoing: illOngoing,
      severity: illSeverity,
      treatment: illTreatment || null,
      notes: illNotes || null,
    };
    const item: Illness = {
      id: editingId ?? '',
      name: illName,
      start_date: illStart,
      end_date: illOngoing ? undefined : illEnd || undefined,
      ongoing: illOngoing,
      severity: illSeverity,
      treatment: illTreatment || undefined,
      notes: illNotes || undefined,
    };
    if (editingId) {
      await supabase.from('medical_records').update({ title: illName, date: illStart, details }).eq('id', editingId);
      setIllnesses(prev => prev.map(i => i.id === editingId ? item : i));
      showToast('Saved');
    } else {
      const { data } = await supabase
        .from('medical_records')
        .insert({ user_id: userId, record_type: 'illness', title: illName, date: illStart, details })
        .select('id')
        .single();
      if (data) setIllnesses(prev => [{ ...item, id: data.id }, ...prev]);
    }
    resetIllForm();
    setEditingId(null);
    setIllOpen(false);
  };

  const handleDeleteIllness = async (id: string) => {
    await softDelete(id);
    setIllnesses(prev => prev.filter(i => i.id !== id));
    setDeleteConfirmId(null);
    setExpandedId(null);
    showToast('Deleted');
  };

  const isOpen = sub === 'ongoing' ? condOpen : illOpen;
  const handleSetOpen = (v: boolean) => {
    resetCondForm();
    resetIllForm();
    setEditingId(null);
    if (sub === 'ongoing') setCondOpen(v);
    else setIllOpen(v);
  };

  return (
    <div className="space-y-4">
      {toast && <ToastBar message={toast} />}

      <SectionHeader
        title="Health History"
        description="Conditions, diagnoses and illnesses, past and present"
        addLabel="Add"
        open={isOpen}
        setOpen={handleSetOpen}
        formContent={
          sub === 'ongoing' ? (
            <>
              <SheetHeader className="mb-4">
                <SheetTitle>{editingId ? 'Edit Condition' : 'Add Condition'}</SheetTitle>
              </SheetHeader>
              <div className="space-y-4">
                <FormField label="Condition name" required>
                  <FormInput value={condName} onChange={e => setCondName(e.target.value)} placeholder="e.g. Uterine fibroids" />
                </FormField>
                <FormField label="Date diagnosed" required>
                  <FormInput type="date" value={condDate} onChange={e => setCondDate(e.target.value)} className="appearance-none min-h-[2.5rem]" />
                </FormField>
                <FormField label="Status">
                  <FormChips
                    value={condStatus}
                    onChange={v => setCondStatus(v as HealthCondition['status'])}
                    options={[
                      { value: 'active', label: 'Active' },
                      { value: 'managed', label: 'Managed' },
                      { value: 'in_remission', label: 'In remission' },
                    ]}
                  />
                </FormField>
                <FormField label="Managing doctor (optional)">
                  <FormInput value={condDoctor} onChange={e => setCondDoctor(e.target.value)} placeholder="Dr name" />
                </FormField>
                <FormField label="Notes (optional)">
                  <FormTextarea value={condNotes} onChange={e => setCondNotes(e.target.value)} placeholder="Any context worth keeping…" />
                </FormField>
                <Button onClick={handleSaveCondition} className="w-full" disabled={!condName || !condDate}>
                  {editingId ? 'Update' : 'Save'}
                </Button>
              </div>
            </>
          ) : (
            <>
              <SheetHeader className="mb-4">
                <SheetTitle>{editingId ? 'Edit Illness' : 'Add Illness or Bout'}</SheetTitle>
              </SheetHeader>
              <div className="space-y-4">
                <FormField label="Name or description" required>
                  <FormInput value={illName} onChange={e => setIllName(e.target.value)} placeholder="e.g. COVID-19, bad flu, UTI" />
                </FormField>
                <FormField label="Start date" required>
                  <FormInput type="date" value={illStart} onChange={e => setIllStart(e.target.value)} className="appearance-none min-h-[2.5rem]" />
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
                    <FormInput type="date" value={illEnd} onChange={e => setIllEnd(e.target.value)} className="appearance-none min-h-[2.5rem]" />
                  </FormField>
                )}
                <FormField label="Severity">
                  <FormChips
                    value={illSeverity}
                    onChange={v => setIllSeverity(v as Illness['severity'])}
                    options={[
                      { value: 'mild', label: 'Mild' },
                      { value: 'moderate', label: 'Moderate' },
                      { value: 'significant', label: 'Significant' },
                    ]}
                  />
                </FormField>
                <FormField label="How it was treated (optional)">
                  <FormTextarea value={illTreatment} onChange={e => setIllTreatment(e.target.value)} placeholder="What helped…" />
                </FormField>
                <FormField label="Notes (optional)">
                  <FormTextarea value={illNotes} onChange={e => setIllNotes(e.target.value)} placeholder="Any other context…" />
                </FormField>
                <Button onClick={handleSaveIllness} className="w-full" disabled={!illName || !illStart}>
                  {editingId ? 'Update' : 'Save'}
                </Button>
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
        onChange={v => { setSub(v as typeof sub); setExpandedId(null); setDeleteConfirmId(null); }}
      />

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : sub === 'ongoing' ? (
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
                    <button
                      onClick={() => { setExpandedId(expanded ? null : c.id); setDeleteConfirmId(null); }}
                      className="text-muted-foreground hover:text-foreground shrink-0 mt-0.5"
                    >
                      <ChevronDown className={cn('h-4 w-4 transition-transform', expanded && 'rotate-180')} />
                    </button>
                  </div>
                  {expanded && (
                    <>
                      {c.notes && (
                        <p className="mt-2 text-xs text-muted-foreground border-t pt-2 leading-relaxed">{c.notes}</p>
                      )}
                      {deleteConfirmId === c.id ? (
                        <DeleteConfirm
                          onCancel={() => setDeleteConfirmId(null)}
                          onConfirm={() => handleDeleteCondition(c.id)}
                        />
                      ) : (
                        <CardActions
                          onEdit={() => handleEditCondition(c)}
                          onDelete={() => setDeleteConfirmId(c.id)}
                        />
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : (
        illnesses.length === 0 ? (
          <EmptyState message="No illnesses logged. Hopefully it stays that way." />
        ) : (
          <div className="space-y-2">
            {illnesses.map(ill => {
              const expanded = expandedId === ill.id;
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
                    <button
                      onClick={() => { setExpandedId(expanded ? null : ill.id); setDeleteConfirmId(null); }}
                      className="text-muted-foreground hover:text-foreground shrink-0 mt-0.5"
                    >
                      <ChevronDown className={cn('h-4 w-4 transition-transform', expanded && 'rotate-180')} />
                    </button>
                  </div>
                  {expanded && (
                    <>
                      <div className="mt-2 border-t pt-2 space-y-1.5">
                        {ill.treatment && (
                          <p className="text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">Treatment: </span>{ill.treatment}
                          </p>
                        )}
                        {ill.notes && <p className="text-xs text-muted-foreground">{ill.notes}</p>}
                      </div>
                      {deleteConfirmId === ill.id ? (
                        <DeleteConfirm
                          onCancel={() => setDeleteConfirmId(null)}
                          onConfirm={() => handleDeleteIllness(ill.id)}
                        />
                      ) : (
                        <CardActions
                          onEdit={() => handleEditIllness(ill)}
                          onDelete={() => setDeleteConfirmId(ill.id)}
                        />
                      )}
                    </>
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

const LabsTab = ({ userId }: { userId: string }) => {
  const [allLabs, setAllLabs] = useState<LabResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [addMode, setAddMode] = useState<'choose' | 'manual'>('choose');
  const { toast, showToast } = useToast();

  const [testName, setTestName] = useState('');
  const [labDate, setLabDate] = useState('');
  const [labName, setLabName] = useState('');
  const [params, setParams] = useState<LabParam[]>([emptyParam()]);
  const [paramsInfoOpen, setParamsInfoOpen] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    fetchRecords(userId, 'lab_result').then(rows => {
      setAllLabs(rows.map(dbToLab));
      setLoading(false);
    });
  }, [userId]);

  const resetForm = () => {
    setTestName(''); setLabDate(''); setLabName('');
    setParams([emptyParam()]); setAddMode('choose');
  };

  const handleEdit = (lab: LabResult) => {
    setTestName(lab.test_name);
    setLabDate(lab.date);
    setLabName(lab.lab_name || '');
    setParams(lab.parameters.map(p => ({
      name: p.name,
      value: String(p.value),
      unit: p.unit,
      ref_low: String(p.ref_low),
      ref_high: String(p.ref_high),
    })));
    setEditingId(lab.id);
    setAddMode('manual');
    setOpen(true);
  };

  const handleSave = async () => {
    if (!testName || !labDate || params.every(p => !p.name)) return;
    const validParams: LabParameter[] = params
      .filter(p => p.name && p.value)
      .map(p => ({
        name: p.name,
        value: parseFloat(p.value),
        unit: p.unit,
        ref_low: parseFloat(p.ref_low) || 0,
        ref_high: parseFloat(p.ref_high) || 0,
      }));
    const details = { lab_name: labName || null, parameters: validParams };
    const item: LabResult = { id: editingId ?? '', test_name: testName, date: labDate, lab_name: labName || undefined, parameters: validParams };

    if (editingId) {
      await supabase.from('medical_records').update({ title: testName, date: labDate, details }).eq('id', editingId);
      setAllLabs(prev => prev.map(l => l.id === editingId ? item : l));
      showToast('Saved');
    } else {
      const { data } = await supabase
        .from('medical_records')
        .insert({ user_id: userId, record_type: 'lab_result', title: testName, date: labDate, details })
        .select('id')
        .single();
      if (data) setAllLabs(prev => [{ ...item, id: data.id }, ...prev]);
    }
    resetForm();
    setEditingId(null);
    setOpen(false);
  };

  const handleDelete = async (id: string) => {
    await softDelete(id);
    setAllLabs(prev => prev.filter(l => l.id !== id));
    setDeleteConfirmId(null);
    setExpandedId(null);
    showToast('Deleted');
  };

  const getParamTrend = (tName: string, pName: string): number[] =>
    [...allLabs]
      .filter(l => l.test_name === tName)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .flatMap(l => l.parameters.filter(p => p.name === pName).map(p => p.value));

  const sortedLabs = [...allLabs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const latestByTest = new Map<string, LabResult>();
  sortedLabs.forEach(l => { if (!latestByTest.has(l.test_name)) latestByTest.set(l.test_name, l); });

  return (
    <div className="space-y-4">
      {toast && <ToastBar message={toast} />}

      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold">Labs</h2>
          <p className="text-xs text-muted-foreground">Blood tests and other lab results</p>
        </div>
        <Sheet
          open={open}
          onOpenChange={v => {
            if (!v) { resetForm(); setEditingId(null); }
            setOpen(v);
          }}
        >
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1 shrink-0 mt-1">
              <Plus className="h-3.5 w-3.5" /> Add
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[90vh] max-h-[90vh] overflow-y-auto rounded-t-xl pb-8">
            {addMode === 'choose' && (
              <>
                <SheetHeader className="mb-6">
                  <SheetTitle>Add lab results</SheetTitle>
                </SheetHeader>
                <div className="space-y-3">
                  <button
                    onClick={() => showToast('PDF upload coming soon')}
                    className="w-full rounded-lg border-2 border-dashed border-border bg-muted/30 p-6 text-center hover:bg-muted/50 transition-colors"
                  >
                    <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium">Upload PDF report</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Coming soon</p>
                  </button>
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

            {addMode === 'manual' && (
              <>
                <SheetHeader className="mb-4">
                  <SheetTitle>{editingId ? 'Edit lab results' : 'Add lab results'}</SheetTitle>
                </SheetHeader>
                <div className="space-y-4">
                  <FormField label="Test name" required>
                    <FormInput value={testName} onChange={e => setTestName(e.target.value)} placeholder="e.g. Full Blood Count" />
                  </FormField>
                  <FormField label="Date" required>
                    <FormInput type="date" value={labDate} onChange={e => setLabDate(e.target.value)} className="w-full appearance-none min-h-[2.5rem]" />
                  </FormField>
                  <FormField label="Lab name">
                    <FormInput value={labName} onChange={e => setLabName(e.target.value)} placeholder="Optional" />
                  </FormField>

                  <div>
                    <div className="flex items-center gap-1.5 mb-2 relative">
                      <p className="text-xs font-medium text-foreground/70">Parameters</p>
                      <button
                        type="button"
                        onClick={() => setParamsInfoOpen(v => !v)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Info className="h-3.5 w-3.5" />
                      </button>
                      {paramsInfoOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setParamsInfoOpen(false)} />
                          <div className="absolute left-0 top-full mt-1 z-50 w-64 rounded-lg border bg-card p-3 shadow-lg text-xs text-muted-foreground leading-relaxed">
                            Add each individual measurement from your results. Include the reference range so we can track what is in or out of range over time.
                          </div>
                        </>
                      )}
                    </div>
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

                  <Button onClick={handleSave} className="w-full" disabled={!testName || !labDate}>
                    {editingId ? 'Update' : 'Save'}
                  </Button>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : allLabs.length === 0 ? (
        <EmptyState message="No lab results yet. Add your first or upload a report." />
      ) : (
        <div className="space-y-2">
          {[...latestByTest.values()].map(result => {
            const expanded = expandedId === result.id;
            const hasFlag = result.parameters.some(p => p.value < p.ref_low || p.value > p.ref_high);
            return (
              <div key={result.id} className="rounded-lg border bg-card">
                <button
                  onClick={() => { setExpandedId(expanded ? null : result.id); setDeleteConfirmId(null); }}
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
                      const trend = getParamTrend(result.test_name, p.name);
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
                    {deleteConfirmId === result.id ? (
                      <DeleteConfirm
                        onCancel={() => setDeleteConfirmId(null)}
                        onConfirm={() => handleDelete(result.id)}
                      />
                    ) : (
                      <CardActions
                        onEdit={() => handleEdit(result)}
                        onDelete={() => setDeleteConfirmId(result.id)}
                      />
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
   SCANS TAB
   ================================================================ */

const ScansTab = ({ userId }: { userId: string }) => {
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const { toast, showToast } = useToast();

  const [scanType, setScanType] = useState('');
  const [scanTypeOther, setScanTypeOther] = useState('');
  const [scanDate, setScanDate] = useState('');
  const [facility, setFacility] = useState('');
  const [findings, setFindings] = useState('');
  const [summary, setSummary] = useState('');

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    fetchRecords(userId, 'scan').then(rows => {
      setScans(rows.map(dbToScan));
      setLoading(false);
    });
  }, [userId]);

  const resetForm = () => {
    setScanType(''); setScanTypeOther(''); setScanDate('');
    setFacility(''); setFindings(''); setSummary('');
  };

  const handleEdit = (scan: Scan) => {
    const knownTypes = ['ultrasound', 'mri', 'x-ray', 'ct_scan'];
    const lower = scan.scan_type.toLowerCase();
    if (knownTypes.includes(lower)) {
      setScanType(lower);
      setScanTypeOther('');
    } else {
      setScanType('other');
      setScanTypeOther(scan.scan_type);
    }
    setScanDate(scan.date);
    setFacility(scan.facility || '');
    setFindings(scan.findings);
    setSummary(scan.plain_language_summary || '');
    setEditingId(scan.id);
    setOpen(true);
  };

  const handleSave = async () => {
    const finalType = scanType === 'other' ? scanTypeOther : scanType;
    if (!finalType || !scanDate || !findings) return;
    const details = {
      facility: facility || null,
      findings,
      plain_summary: summary || null,
    };
    const item: Scan = {
      id: editingId ?? '',
      scan_type: finalType,
      date: scanDate,
      facility: facility || undefined,
      findings,
      plain_language_summary: summary || undefined,
    };
    if (editingId) {
      await supabase.from('medical_records').update({ title: finalType, date: scanDate, details }).eq('id', editingId);
      setScans(prev => prev.map(s => s.id === editingId ? item : s));
      showToast('Saved');
    } else {
      const { data } = await supabase
        .from('medical_records')
        .insert({ user_id: userId, record_type: 'scan', title: finalType, date: scanDate, details })
        .select('id')
        .single();
      if (data) setScans(prev => [{ ...item, id: data.id }, ...prev]);
    }
    resetForm();
    setEditingId(null);
    setOpen(false);
  };

  const handleDelete = async (id: string) => {
    await softDelete(id);
    setScans(prev => prev.filter(s => s.id !== id));
    setDeleteConfirmId(null);
    setExpandedId(null);
    showToast('Deleted');
  };

  const sorted = [...scans].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const scanTypeOpts = [
    { value: 'ultrasound', label: 'Ultrasound' },
    { value: 'mri', label: 'MRI' },
    { value: 'x-ray', label: 'X-ray' },
    { value: 'ct_scan', label: 'CT scan' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <div className="space-y-4">
      {toast && <ToastBar message={toast} />}

      <SectionHeader
        title="Scans"
        description="Ultrasounds, MRIs, X-rays and imaging reports"
        addLabel="Add"
        open={open}
        setOpen={v => {
          if (!v) { resetForm(); setEditingId(null); }
          setOpen(v);
        }}
        formContent={
          <>
            <SheetHeader className="mb-4">
              <SheetTitle>{editingId ? 'Edit Scan' : 'Add Scan'}</SheetTitle>
            </SheetHeader>
            <div className="space-y-4">
              <FormField label="Scan type" required>
                <FormChips value={scanType} onChange={setScanType} options={scanTypeOpts} />
                {scanType === 'other' && (
                  <FormInput className="mt-2" value={scanTypeOther} onChange={e => setScanTypeOther(e.target.value)} placeholder="Specify type…" />
                )}
              </FormField>
              <FormField label="Date" required>
                <FormInput type="date" value={scanDate} onChange={e => setScanDate(e.target.value)} className="w-full appearance-none min-h-[2.5rem]" />
              </FormField>
              <FormField label="Facility">
                <FormInput value={facility} onChange={e => setFacility(e.target.value)} placeholder="Optional" />
              </FormField>
              <FormField label="Key findings" required>
                <FormTextarea value={findings} onChange={e => setFindings(e.target.value)} placeholder="What the report says…" />
              </FormField>
              <FormField label="Plain language summary (optional)">
                <FormTextarea value={summary} onChange={e => setSummary(e.target.value)} placeholder="What it means in your own words…" />
              </FormField>
              <button
                type="button"
                onClick={() => showToast('PDF upload coming soon')}
                className="flex items-center gap-2 rounded-lg border border-border text-muted-foreground px-3 py-2 text-sm hover:bg-muted transition-colors w-full"
              >
                <Upload className="h-4 w-4" />
                Attach PDF report (coming soon)
              </button>
              <Button
                onClick={handleSave}
                className="w-full"
                disabled={!(scanType === 'other' ? scanTypeOther : scanType) || !scanDate || !findings}
              >
                {editingId ? 'Update' : 'Save'}
              </Button>
            </div>
          </>
        }
      />

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : scans.length === 0 ? (
        <EmptyState message="No scans logged yet." />
      ) : (
        <div className="space-y-2">
          {sorted.map(scan => {
            const expanded = expandedId === scan.id;
            return (
              <div key={scan.id} className="rounded-lg border bg-card">
                <button
                  onClick={() => { setExpandedId(expanded ? null : scan.id); setDeleteConfirmId(null); }}
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
                    {deleteConfirmId === scan.id ? (
                      <DeleteConfirm
                        onCancel={() => setDeleteConfirmId(null)}
                        onConfirm={() => handleDelete(scan.id)}
                      />
                    ) : (
                      <CardActions
                        onEdit={() => handleEdit(scan)}
                        onDelete={() => setDeleteConfirmId(scan.id)}
                      />
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
   MEDICATIONS TAB
   ================================================================ */

const MedicationsTab = ({ userId }: { userId: string }) => {
  const [meds, setMeds] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const { toast, showToast } = useToast();

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

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    fetchRecords(userId, 'medication').then(rows => {
      setMeds(rows.map(dbToMedication));
      setLoading(false);
    });
  }, [userId]);

  const resetForm = () => {
    setName(''); setMedType('prescribed'); setDose(''); setFreq(''); setFreqOther('');
    setStartDate(''); setEndDate(''); setCurrentlyTaking(true); setPrescriber('');
    setReason(''); setNotes('');
  };

  const handleEdit = (med: Medication) => {
    setName(med.name);
    setMedType(med.med_type);
    setDose(med.dose);
    const knownFreqs = ['once_daily', 'twice_daily', 'as_needed'];
    const freqVal = med.frequency.toLowerCase().replace(/ /g, '_');
    if (knownFreqs.includes(freqVal)) { setFreq(freqVal); setFreqOther(''); }
    else { setFreq('other'); setFreqOther(med.frequency); }
    setStartDate(med.start_date);
    setEndDate(med.end_date || '');
    setCurrentlyTaking(med.currently_taking);
    setPrescriber(med.prescriber || '');
    setReason(med.reason || '');
    setNotes(med.notes || '');
    setEditingId(med.id);
    setOpen(true);
  };

  const handleSave = async () => {
    if (!name || !dose || !startDate) return;
    const finalFreq = freq === 'other' ? freqOther : freq;
    const details = {
      med_type: medType,
      dose,
      frequency: finalFreq,
      end_date: currentlyTaking ? null : endDate || null,
      currently_taking: currentlyTaking,
      prescriber: medType === 'prescribed' ? (prescriber || null) : null,
      reason: reason || null,
      notes: notes || null,
    };
    const item: Medication = {
      id: editingId ?? '',
      name,
      med_type: medType,
      dose,
      frequency: finalFreq,
      start_date: startDate,
      end_date: currentlyTaking ? undefined : endDate || undefined,
      currently_taking: currentlyTaking,
      prescriber: medType === 'prescribed' ? (prescriber || undefined) : undefined,
      reason: reason || undefined,
      notes: notes || undefined,
    };
    if (editingId) {
      await supabase.from('medical_records').update({ title: name, date: startDate, details }).eq('id', editingId);
      setMeds(prev => prev.map(m => m.id === editingId ? item : m));
      showToast('Saved');
    } else {
      const { data } = await supabase
        .from('medical_records')
        .insert({ user_id: userId, record_type: 'medication', title: name, date: startDate, details })
        .select('id')
        .single();
      if (data) setMeds(prev => [{ ...item, id: data.id }, ...prev]);
    }
    resetForm();
    setEditingId(null);
    setOpen(false);
  };

  const handleDelete = async (id: string) => {
    await softDelete(id);
    setMeds(prev => prev.filter(m => m.id !== id));
    setDeleteConfirmId(null);
    setExpandedId(null);
    showToast('Deleted');
  };

  const sorted = [...meds].sort((a, b) => {
    if (a.currently_taking !== b.currently_taking) return a.currently_taking ? -1 : 1;
    return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
  });
  const freqOpts = [
    { value: 'once_daily', label: 'Once daily' },
    { value: 'twice_daily', label: 'Twice daily' },
    { value: 'as_needed', label: 'As needed' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <div className="space-y-4">
      {toast && <ToastBar message={toast} />}

      <SectionHeader
        title="Medications"
        description="Prescribed and over-the-counter medications you're taking"
        addLabel="Add"
        open={open}
        setOpen={v => {
          if (!v) { resetForm(); setEditingId(null); }
          setOpen(v);
        }}
        formContent={
          <>
            <SheetHeader className="mb-4">
              <SheetTitle>{editingId ? 'Edit Medication' : 'Add Medication'}</SheetTitle>
            </SheetHeader>
            <div className="space-y-4">
              <FormField label="Medication name" required>
                <FormInput value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Tranexamic Acid" />
              </FormField>
              <FormField label="Type">
                <FormChips value={medType} onChange={v => setMedType(v as 'prescribed' | 'otc')}
                  options={[{ value: 'prescribed', label: 'Prescribed' }, { value: 'otc', label: 'Over the counter' }]} />
              </FormField>
              <FormField label="Dose" required>
                <FormInput value={dose} onChange={e => setDose(e.target.value)} placeholder="e.g. 500mg" />
              </FormField>
              <FormField label="Start date" required>
                <FormInput type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full appearance-none min-h-[2.5rem]" />
              </FormField>
              <FormField label="Frequency">
                <FormChips value={freq} onChange={setFreq} options={freqOpts} />
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
                  <FormInput type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="appearance-none min-h-[2.5rem]" />
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
              <Button onClick={handleSave} className="w-full" disabled={!name || !dose || !startDate}>
                {editingId ? 'Update' : 'Save'}
              </Button>
            </div>
          </>
        }
      />

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : meds.length === 0 ? (
        <EmptyState message="Nothing here yet." />
      ) : (
        <div className="space-y-2">
          {sorted.map(med => {
            const expanded = expandedId === med.id;
            return (
              <div key={med.id} className="rounded-lg border bg-card">
                <button
                  onClick={() => { setExpandedId(expanded ? null : med.id); setDeleteConfirmId(null); }}
                  className="w-full p-4 text-left"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold">{med.name}</p>
                        <TypeBadge type={med.med_type} />
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
                    {med.notes && <p className="text-xs text-muted-foreground leading-relaxed">{med.notes}</p>}
                    {deleteConfirmId === med.id ? (
                      <DeleteConfirm
                        onCancel={() => setDeleteConfirmId(null)}
                        onConfirm={() => handleDelete(med.id)}
                      />
                    ) : (
                      <CardActions
                        onEdit={() => handleEdit(med)}
                        onDelete={() => setDeleteConfirmId(med.id)}
                      />
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

const SupplementsTab = ({ userId }: { userId: string }) => {
  const [supps, setSupps] = useState<Supplement[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const { toast, showToast } = useToast();

  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [freq, setFreq] = useState('');
  const [freqOther, setFreqOther] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentlyTaking, setCurrentlyTaking] = useState(true);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    fetchRecords(userId, 'supplement').then(rows => {
      setSupps(rows.map(dbToSupplement));
      setLoading(false);
    });
  }, [userId]);

  const resetForm = () => {
    setName(''); setDose(''); setFreq(''); setFreqOther('');
    setStartDate(''); setEndDate(''); setCurrentlyTaking(true); setReason(''); setNotes('');
  };

  const handleEdit = (sup: Supplement) => {
    setName(sup.name);
    setDose(sup.dose);
    const knownFreqs = ['once_daily', 'twice_daily', 'as_needed'];
    const freqVal = sup.frequency.toLowerCase().replace(/ /g, '_');
    if (knownFreqs.includes(freqVal)) { setFreq(freqVal); setFreqOther(''); }
    else { setFreq('other'); setFreqOther(sup.frequency); }
    setStartDate(sup.start_date);
    setEndDate(sup.end_date || '');
    setCurrentlyTaking(sup.currently_taking);
    setReason(sup.reason || '');
    setNotes(sup.notes || '');
    setEditingId(sup.id);
    setOpen(true);
  };

  const handleSave = async () => {
    if (!name || !dose || !startDate) return;
    const finalFreq = freq === 'other' ? freqOther : freq;
    const details = {
      dose,
      frequency: finalFreq,
      end_date: currentlyTaking ? null : endDate || null,
      currently_taking: currentlyTaking,
      reason: reason || null,
      notes: notes || null,
    };
    const item: Supplement = {
      id: editingId ?? '',
      name,
      dose,
      frequency: finalFreq,
      start_date: startDate,
      end_date: currentlyTaking ? undefined : endDate || undefined,
      currently_taking: currentlyTaking,
      reason: reason || undefined,
      notes: notes || undefined,
    };
    if (editingId) {
      await supabase.from('medical_records').update({ title: name, date: startDate, details }).eq('id', editingId);
      setSupps(prev => prev.map(s => s.id === editingId ? item : s));
      showToast('Saved');
    } else {
      const { data } = await supabase
        .from('medical_records')
        .insert({ user_id: userId, record_type: 'supplement', title: name, date: startDate, details })
        .select('id')
        .single();
      if (data) setSupps(prev => [{ ...item, id: data.id }, ...prev]);
    }
    resetForm();
    setEditingId(null);
    setOpen(false);
  };

  const handleDelete = async (id: string) => {
    await softDelete(id);
    setSupps(prev => prev.filter(s => s.id !== id));
    setDeleteConfirmId(null);
    setExpandedId(null);
    showToast('Deleted');
  };

  const sorted = [...supps].sort((a, b) => {
    if (a.currently_taking !== b.currently_taking) return a.currently_taking ? -1 : 1;
    return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
  });
  const freqOpts = [
    { value: 'once_daily', label: 'Once daily' },
    { value: 'twice_daily', label: 'Twice daily' },
    { value: 'as_needed', label: 'As needed' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <div className="space-y-4">
      {toast && <ToastBar message={toast} />}

      <SectionHeader
        title="Supplements"
        description="Vitamins, minerals and other supplements you're taking"
        addLabel="Add"
        open={open}
        setOpen={v => {
          if (!v) { resetForm(); setEditingId(null); }
          setOpen(v);
        }}
        formContent={
          <>
            <SheetHeader className="mb-4">
              <SheetTitle>{editingId ? 'Edit Supplement' : 'Add Supplement'}</SheetTitle>
            </SheetHeader>
            <div className="space-y-4">
              <FormField label="Supplement name" required>
                <FormInput value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Iron Bisglycinate" />
              </FormField>
              <FormField label="Dose" required>
                <FormInput value={dose} onChange={e => setDose(e.target.value)} placeholder="e.g. 25mg" />
              </FormField>
              <FormField label="Start date" required>
                <FormInput type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full appearance-none min-h-[2.5rem]" />
              </FormField>
              <FormField label="Frequency">
                <FormChips value={freq} onChange={setFreq} options={freqOpts} />
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
                  <FormInput type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="appearance-none min-h-[2.5rem]" />
                </FormField>
              )}
              <FormField label="Reason or intention (optional)">
                <FormTextarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Why you're taking it…" />
              </FormField>
              <FormField label="Notes (optional)">
                <FormTextarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Anything else…" />
              </FormField>
              <Button onClick={handleSave} className="w-full" disabled={!name || !dose || !startDate}>
                {editingId ? 'Update' : 'Save'}
              </Button>
            </div>
          </>
        }
      />

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : supps.length === 0 ? (
        <EmptyState message="Nothing logged yet." />
      ) : (
        <div className="space-y-2">
          {sorted.map(sup => {
            const expanded = expandedId === sup.id;
            return (
              <div key={sup.id} className="rounded-lg border bg-card">
                <button
                  onClick={() => { setExpandedId(expanded ? null : sup.id); setDeleteConfirmId(null); }}
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
                {expanded && (
                  <div className="border-t px-4 pb-4 pt-3 space-y-1.5">
                    {sup.reason && (
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        <span className="font-medium text-foreground">Why: </span>{sup.reason}
                      </p>
                    )}
                    {sup.notes && <p className="text-xs text-muted-foreground">{sup.notes}</p>}
                    {deleteConfirmId === sup.id ? (
                      <DeleteConfirm
                        onCancel={() => setDeleteConfirmId(null)}
                        onConfirm={() => handleDelete(sup.id)}
                      />
                    ) : (
                      <CardActions
                        onEdit={() => handleEdit(sup)}
                        onDelete={() => setDeleteConfirmId(sup.id)}
                      />
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
   APPOINTMENTS TAB
   ================================================================ */

const AppointmentsTab = ({ userId }: { userId: string }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [sub, setSub] = useState<'upcoming' | 'past'>('upcoming');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast, showToast } = useToast();

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    fetchRecords(userId, 'appointment').then(rows => {
      setAppointments(rows.map(dbToAppointment));
      setLoading(false);
    });
  }, [userId]);

  // ── Upcoming form ──────────────────────────────────────────────
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

  const handleEditUpcoming = (apt: Appointment) => {
    setUpProvider(apt.provider);
    setUpSpecialty(apt.specialty || '');
    setUpDate(apt.date);
    setUpTime(apt.time || '');
    setUpDiscussion(apt.what_to_discuss || '');
    setUpPrep(apt.prep_needed || '');
    setEditingId(apt.id);
    setUpOpen(true);
  };

  const handleSaveUpcoming = async () => {
    if (!upProvider || !upDate || !upDiscussion) return;
    const details = {
      specialty: upSpecialty || null,
      time: upTime || null,
      what_to_discuss: upDiscussion,
      prep_needed: upPrep || null,
    };
    const item: Appointment = {
      id: editingId ?? '',
      provider: upProvider,
      date: upDate,
      specialty: upSpecialty || undefined,
      time: upTime || undefined,
      what_to_discuss: upDiscussion,
      prep_needed: upPrep || undefined,
    };
    if (editingId) {
      await supabase.from('medical_records').update({ title: upProvider, date: upDate, details }).eq('id', editingId);
      setAppointments(prev => prev.map(a => a.id === editingId ? item : a));
      showToast('Saved');
    } else {
      const { data } = await supabase
        .from('medical_records')
        .insert({ user_id: userId, record_type: 'appointment', title: upProvider, date: upDate, details })
        .select('id')
        .single();
      if (data) setAppointments(prev => [{ ...item, id: data.id }, ...prev]);
    }
    resetUpForm();
    setEditingId(null);
    setUpOpen(false);
  };

  // ── Past form ──────────────────────────────────────────────────
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

  const handleEditPast = (apt: Appointment) => {
    setPastProvider(apt.provider);
    setPastSpecialty(apt.specialty || '');
    setPastDate(apt.date);
    setPastSummary(apt.summary || '');
    setPastActions(apt.action_items || '');
    setPastFollowup(apt.followup_date || '');
    setPastNewDx(apt.new_diagnosis || '');
    setEditingId(apt.id);
    setPastOpen(true);
  };

  const handleSavePast = async () => {
    if (!pastProvider || !pastDate || !pastSummary) return;
    const details = {
      specialty: pastSpecialty || null,
      summary: pastSummary,
      action_items: pastActions || null,
      followup_date: pastFollowup || null,
      new_diagnosis: pastNewDx || null,
    };
    const item: Appointment = {
      id: editingId ?? '',
      provider: pastProvider,
      date: pastDate,
      specialty: pastSpecialty || undefined,
      summary: pastSummary,
      action_items: pastActions || undefined,
      followup_date: pastFollowup || undefined,
      new_diagnosis: pastNewDx || undefined,
    };
    if (editingId) {
      await supabase.from('medical_records').update({ title: pastProvider, date: pastDate, details }).eq('id', editingId);
      setAppointments(prev => prev.map(a => a.id === editingId ? item : a));
      showToast('Saved');
    } else {
      const { data } = await supabase
        .from('medical_records')
        .insert({ user_id: userId, record_type: 'appointment', title: pastProvider, date: pastDate, details })
        .select('id')
        .single();
      if (data) setAppointments(prev => [{ ...item, id: data.id }, ...prev]);
    }
    resetPastForm();
    setEditingId(null);
    setPastOpen(false);
  };

  const handleDelete = async (id: string) => {
    await softDelete(id);
    setAppointments(prev => prev.filter(a => a.id !== id));
    setDeleteConfirmId(null);
    setExpandedId(null);
    showToast('Deleted');
  };

  const isOpen = sub === 'upcoming' ? upOpen : pastOpen;
  const handleSetOpen = (v: boolean) => {
    resetUpForm();
    resetPastForm();
    setEditingId(null);
    if (sub === 'upcoming') setUpOpen(v);
    else setPastOpen(v);
  };

  const sortedUpcoming = appointments
    .filter(a => a.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''));
  const sortedPast = appointments
    .filter(a => a.date < todayStr)
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-4">
      {toast && <ToastBar message={toast} />}

      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold">Appointments</h2>
          <p className="text-xs text-muted-foreground">Doctor and specialist consultations</p>
        </div>
        <Sheet open={isOpen} onOpenChange={handleSetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1 shrink-0 mt-1">
              <Plus className="h-3.5 w-3.5" /> Add
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[90vh] max-h-[90vh] overflow-y-auto rounded-t-xl pb-8">
            {sub === 'upcoming' ? (
              <>
                <SheetHeader className="mb-4">
                  <SheetTitle>{editingId ? 'Edit Appointment' : 'Add Upcoming Appointment'}</SheetTitle>
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
                  <FormField label="Date" required>
                    <FormInput type="date" value={upDate} onChange={e => setUpDate(e.target.value)} className="w-full appearance-none min-h-[2.5rem]" />
                  </FormField>
                  <FormField label="Time">
                    <FormInput type="time" value={upTime} onChange={e => setUpTime(e.target.value)} className="w-full appearance-none min-h-[2.5rem]" />
                  </FormField>
                  <FormField label="What do you want to discuss?" required>
                    <FormTextarea value={upDiscussion} onChange={e => setUpDiscussion(e.target.value)} placeholder="Questions, concerns, updates to share…" />
                  </FormField>
                  <FormField label="Any prep needed? (optional)">
                    <FormTextarea value={upPrep} onChange={e => setUpPrep(e.target.value)} placeholder="Bring results, fast beforehand…" />
                  </FormField>
                  <Button onClick={handleSaveUpcoming} className="w-full" disabled={!upProvider || !upDate || !upDiscussion}>
                    {editingId ? 'Update' : 'Save'}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <SheetHeader className="mb-4">
                  <SheetTitle>{editingId ? 'Edit Appointment' : 'Add Past Appointment'}</SheetTitle>
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
                    <FormInput type="date" value={pastDate} onChange={e => setPastDate(e.target.value)} className="appearance-none min-h-[2.5rem]" />
                  </FormField>
                  <FormField label="Summary" required>
                    <FormTextarea value={pastSummary} onChange={e => setPastSummary(e.target.value)} placeholder="What was discussed…" />
                  </FormField>
                  <FormField label="Action items (optional)">
                    <FormTextarea value={pastActions} onChange={e => setPastActions(e.target.value)} placeholder="Next steps, follow-ups…" />
                  </FormField>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="Follow-up date (optional)">
                      <FormInput type="date" value={pastFollowup} onChange={e => setPastFollowup(e.target.value)} className="appearance-none min-h-[2.5rem]" />
                    </FormField>
                    <FormField label="New diagnosis/referral (optional)">
                      <FormInput value={pastNewDx} onChange={e => setPastNewDx(e.target.value)} placeholder="If any" />
                    </FormField>
                  </div>
                  <Button onClick={handleSavePast} className="w-full" disabled={!pastProvider || !pastDate || !pastSummary}>
                    {editingId ? 'Update' : 'Save'}
                  </Button>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>

      <PillToggle
        options={[{ value: 'upcoming', label: 'Upcoming' }, { value: 'past', label: 'Past' }]}
        value={sub}
        onChange={v => { setSub(v as typeof sub); setExpandedId(null); setDeleteConfirmId(null); }}
      />

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : sub === 'upcoming' ? (
        sortedUpcoming.length === 0 ? (
          <EmptyState message="No upcoming appointments." />
        ) : (
          <div className="space-y-2">
            {sortedUpcoming.map(apt => {
              const expanded = expandedId === apt.id;
              return (
                <div key={apt.id} className="rounded-lg border bg-card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{apt.provider}</p>
                      {apt.specialty && <p className="text-xs text-muted-foreground">{apt.specialty}</p>}
                      <p className="text-xs font-medium text-primary mt-1">
                        {format(parseISO(apt.date), 'EEE d MMM')}
                        {apt.time && ` at ${apt.time}`}
                      </p>
                      {!expanded && apt.what_to_discuss && (
                        <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">{apt.what_to_discuss}</p>
                      )}
                    </div>
                    <button
                      onClick={() => { setExpandedId(expanded ? null : apt.id); setDeleteConfirmId(null); }}
                      className="text-muted-foreground hover:text-foreground shrink-0 mt-0.5"
                    >
                      <ChevronDown className={cn('h-4 w-4 transition-transform', expanded && 'rotate-180')} />
                    </button>
                  </div>
                  {expanded && (
                    <>
                      <div className="mt-2 border-t pt-2 space-y-2">
                        {apt.what_to_discuss && (
                          <div>
                            <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-0.5">To discuss</p>
                            <p className="text-xs text-foreground/90 leading-relaxed">{apt.what_to_discuss}</p>
                          </div>
                        )}
                        {apt.prep_needed && (
                          <div>
                            <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-0.5">Prep</p>
                            <p className="text-xs text-muted-foreground">{apt.prep_needed}</p>
                          </div>
                        )}
                      </div>
                      {deleteConfirmId === apt.id ? (
                        <DeleteConfirm
                          onCancel={() => setDeleteConfirmId(null)}
                          onConfirm={() => handleDelete(apt.id)}
                        />
                      ) : (
                        <CardActions
                          onEdit={() => handleEditUpcoming(apt)}
                          onDelete={() => setDeleteConfirmId(apt.id)}
                        />
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : (
        sortedPast.length === 0 ? (
          <EmptyState message="No past appointments logged yet." />
        ) : (
          <div className="space-y-2">
            {sortedPast.map(apt => {
              const expanded = expandedId === apt.id;
              return (
                <div key={apt.id} className="rounded-lg border bg-card">
                  <button
                    onClick={() => { setExpandedId(expanded ? null : apt.id); setDeleteConfirmId(null); }}
                    className="w-full p-4 text-left"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{apt.provider}</p>
                        {apt.specialty && <p className="text-xs text-muted-foreground">{apt.specialty}</p>}
                        <p className="text-xs text-muted-foreground mt-0.5">{format(parseISO(apt.date), 'dd MMM yyyy')}</p>
                        {!expanded && apt.summary && (
                          <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">{apt.summary}</p>
                        )}
                      </div>
                      <ChevronDown className={cn('h-4 w-4 text-muted-foreground shrink-0 mt-0.5 transition-transform', expanded && 'rotate-180')} />
                    </div>
                  </button>
                  {expanded && (
                    <div className="border-t px-4 pb-4 pt-3 space-y-2">
                      {apt.summary && (
                        <div>
                          <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-0.5">Summary</p>
                          <p className="text-xs text-foreground/90 leading-relaxed">{apt.summary}</p>
                        </div>
                      )}
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
                      {deleteConfirmId === apt.id ? (
                        <DeleteConfirm
                          onCancel={() => setDeleteConfirmId(null)}
                          onConfirm={() => handleDelete(apt.id)}
                        />
                      ) : (
                        <CardActions
                          onEdit={() => handleEditPast(apt)}
                          onDelete={() => setDeleteConfirmId(apt.id)}
                        />
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
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const [activeTab, setActiveTab] = useState('health_history');

  return (
    <div className="space-y-4">
      <div className="flex w-full overflow-hidden">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={cn(
              'flex-1 min-w-0 rounded-full py-1.5 px-0 text-xs font-medium transition-colors border',
              activeTab === t.id
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card border-border hover:bg-muted',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'health_history' && <HealthHistoryTab userId={userId} />}
      {activeTab === 'labs' && <LabsTab userId={userId} />}
      {activeTab === 'scans' && <ScansTab userId={userId} />}
      {activeTab === 'medications' && <MedicationsTab userId={userId} />}
      {activeTab === 'supplements' && <SupplementsTab userId={userId} />}
      {activeTab === 'appointments' && <AppointmentsTab userId={userId} />}
    </div>
  );
};

export default Records;
