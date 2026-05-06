import { useState, useRef } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import {
  User, Heart, Bell, Upload, Monitor, Shield,
  Key, Info, ChevronRight, LogOut, FileText,
  Download, Pencil,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ── Shared pill pickers ────────────────────────────────────────

const OptionPicker = ({
  options, value, onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) => (
  <div className="flex flex-wrap gap-2">
    {options.map(o => (
      <button
        key={o.value}
        onClick={() => onChange(o.value)}
        className={cn(
          'rounded-full px-4 py-2 text-sm border transition-colors',
          value === o.value
            ? 'bg-primary text-primary-foreground border-primary'
            : 'bg-card border-border hover:bg-muted',
        )}
      >
        {o.label}
      </button>
    ))}
  </div>
);

const MultiSelect = ({
  options, selected, onChange,
}: {
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (v: string[]) => void;
}) => (
  <div className="flex flex-wrap gap-2">
    {options.map(o => (
      <button
        key={o.value}
        onClick={() =>
          onChange(
            selected.includes(o.value)
              ? selected.filter(s => s !== o.value)
              : [...selected, o.value],
          )
        }
        className={cn(
          'rounded-full px-4 py-2 text-sm border transition-colors',
          selected.includes(o.value)
            ? 'bg-primary text-primary-foreground border-primary'
            : 'bg-card border-border hover:bg-muted',
        )}
      >
        {o.label}
      </button>
    ))}
  </div>
);

// ── Slide-up overlay wrapper ───────────────────────────────────

const Overlay = ({
  open, onClose, title, children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) => (
  <Sheet open={open} onOpenChange={o => !o && onClose()}>
    <SheetContent side="bottom" className="max-h-[92vh] flex flex-col rounded-t-2xl p-0">
      <SheetHeader className="px-5 pt-5 pb-3 shrink-0">
        <SheetTitle>{title}</SheetTitle>
      </SheetHeader>
      <div className="flex-1 overflow-y-auto px-5 pb-10">
        {children}
      </div>
    </SheetContent>
  </Sheet>
);

// ── Section row ────────────────────────────────────────────────

const SectionRow = ({
  icon: Icon, label, onClick,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-muted/50 transition-colors"
  >
    <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
    <span className="flex-1 text-sm font-medium">{label}</span>
    <ChevronRight className="h-4 w-4 text-muted-foreground" />
  </button>
);

// ── Main page ──────────────────────────────────────────────────

type SectionId =
  | 'profile' | 'health' | 'notifications' | 'import'
  | 'display' | 'privacy' | 'account' | 'about';

const SECTIONS: { id: SectionId; label: string; icon: React.ElementType }[] = [
  { id: 'profile',       label: 'Profile',            icon: User },
  { id: 'health',        label: 'Health Context',     icon: Heart },
  { id: 'notifications', label: 'Notifications',      icon: Bell },
  { id: 'import',        label: 'Cycle Data Import',  icon: Upload },
  { id: 'display',       label: 'Display',            icon: Monitor },
  { id: 'privacy',       label: 'Privacy & Data',     icon: Shield },
  { id: 'account',       label: 'Account',            icon: Key },
  { id: 'about',         label: 'About',              icon: Info },
];

const Settings = () => {
  const { profile, setProfile } = useApp();
  const navigate = useNavigate();

  const [openSection, setOpenSection] = useState<SectionId | null>(null);
  const open = (id: SectionId) => setOpenSection(id);
  const close = () => setOpenSection(null);

  // ── Profile ──
  const [firstName, setFirstName] = useState('Kui');
  const [lastInitial, setLastInitial] = useState('N');
  const [dobMonth, setDobMonth] = useState('06');
  const [dobYear, setDobYear] = useState('1983');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Health Context ──
  const [fibroids, setFibroids] = useState(profile.has_fibroids);
  const [perimenopause, setPerimenopause] = useState(profile.perimenopause_status);
  const [cycle, setCycle] = useState(profile.has_regular_cycle);
  const [conditions, setConditions] = useState(profile.diagnosed_conditions);
  const [hormonal, setHormonal] = useState(profile.hormonal_treatment);
  const [joints, setJoints] = useState(profile.joint_conditions);
  const [exerciseReg, setExerciseReg] = useState(profile.exercises_regularly);
  const [exerciseTypes, setExerciseTypes] = useState(profile.exercise_types);
  const [stress, setStress] = useState(profile.stress_baseline);
  const [goals, setGoals] = useState(profile.tracking_goals);

  // ── Notifications ──
  const [morningOn, setMorningOn] = useState(false);
  const [morningTime, setMorningTime] = useState('08:00');
  const [eveningOn, setEveningOn] = useState(false);
  const [eveningTime, setEveningTime] = useState('21:00');
  const [weeklyInsightOn, setWeeklyInsightOn] = useState(true);
  const [appointmentOn, setAppointmentOn] = useState(true);
  const [appointmentLead, setAppointmentLead] = useState('3 days');

  // ── Display ──
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');

  // ── Privacy ──
  const [deleteFrom, setDeleteFrom] = useState('');
  const [deleteTo, setDeleteTo] = useState('');
  const [deleteLogsOpen, setDeleteLogsOpen] = useState(false);
  const [deleteAccountStep, setDeleteAccountStep] = useState(0);
  const [deleteAccountEmail, setDeleteAccountEmail] = useState('');

  // ── Sign out ──
  const [signOutOpen, setSignOutOpen] = useState(false);

  // ── Handlers ──
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      setPhotoError('Photo must be under 1MB.');
      return;
    }
    setPhotoError('');
    setPhotoUrl(URL.createObjectURL(file));
  };

  const handleRemovePhoto = () => {
    setPhotoUrl(null);
    setPhotoError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSaveHealth = () => {
    setProfile({
      ...profile,
      has_fibroids: fibroids,
      perimenopause_status: perimenopause,
      has_regular_cycle: cycle,
      diagnosed_conditions: conditions,
      hormonal_treatment: hormonal,
      joint_conditions: joints,
      exercises_regularly: exerciseReg,
      exercise_types: exerciseTypes,
      stress_baseline: stress,
      tracking_goals: goals,
    });
    toast.success('Health context updated.');
    close();
  };

  const initials = `${firstName.charAt(0).toUpperCase()}${lastInitial.toUpperCase()}`;

  return (
    <div className="space-y-4 pb-8">
      <h2 className="text-xl font-bold">Settings</h2>

      {/* Section list */}
      <div className="rounded-lg border bg-card overflow-hidden divide-y divide-border">
        {SECTIONS.map(({ id, label, icon }) => (
          <SectionRow key={id} icon={icon} label={label} onClick={() => open(id)} />
        ))}
      </div>

      {/* Sign out */}
      <Button variant="outline" className="w-full" onClick={() => setSignOutOpen(true)}>
        <LogOut className="h-4 w-4 mr-2" />
        Sign out
      </Button>

      {/* ════════════════════════════════════════════════════
          OVERLAYS
          ════════════════════════════════════════════════════ */}

      {/* 1 — PROFILE */}
      <Overlay open={openSection === 'profile'} onClose={close} title="Profile">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-2 py-4">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt="Profile photo"
              className="h-20 w-20 rounded-full object-cover border-2 border-border"
            />
          ) : (
            <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
              {initials}
            </div>
          )}
          <div className="flex gap-3 mt-1">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-primary underline underline-offset-2"
            >
              Change photo
            </button>
            {photoUrl && (
              <button
                onClick={handleRemovePhoto}
                className="text-xs text-destructive underline underline-offset-2"
              >
                Remove photo
              </button>
            )}
          </div>
          {photoError && <p className="text-xs text-destructive">{photoError}</p>}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoChange}
          />
        </div>

        <div className="space-y-4 mt-2">
          <div>
            <label className="text-sm font-medium">First name</label>
            <input
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              placeholder="Kui"
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Last initial</label>
            <input
              value={lastInitial}
              onChange={e => setLastInitial(e.target.value.charAt(0))}
              maxLength={1}
              placeholder="N"
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <p className="text-xs text-muted-foreground -mt-1">
            Only your first name appears on your dashboard and in Within [{firstName || 'name'}].
          </p>
          <div>
            <label className="text-sm font-medium">Date of birth</label>
            <div className="mt-1 flex gap-2">
              <select
                value={dobMonth}
                onChange={e => setDobMonth(e.target.value)}
                className="flex-1 rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {[
                  ['01', 'January'], ['02', 'February'], ['03', 'March'],
                  ['04', 'April'],   ['05', 'May'],      ['06', 'June'],
                  ['07', 'July'],    ['08', 'August'],   ['09', 'September'],
                  ['10', 'October'], ['11', 'November'], ['12', 'December'],
                ].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <input
                type="number"
                value={dobYear}
                onChange={e => setDobYear(e.target.value)}
                placeholder="1983"
                min="1900"
                max={new Date().getFullYear()}
                className="w-24 rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <Button
            className="w-full mt-2"
            onClick={() => { toast.success('Profile saved.'); close(); }}
          >
            Save
          </Button>
        </div>
      </Overlay>

      {/* 2 — HEALTH CONTEXT */}
      <Overlay open={openSection === 'health'} onClose={close} title="Health Context">
        <p className="text-sm text-muted-foreground mb-6">Update anytime — bodies change.</p>
        <div className="space-y-6">
          <div>
            <p className="text-sm font-medium mb-2">Fibroids?</p>
            <OptionPicker
              value={fibroids}
              onChange={v => setFibroids(v as typeof fibroids)}
              options={[
                { value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' },
                { value: 'suspected', label: 'Suspected' }, { value: 'removed', label: 'Removed' },
              ]}
            />
          </div>
          <div>
            <p className="text-sm font-medium mb-2">Perimenopause?</p>
            <OptionPicker
              value={perimenopause}
              onChange={v => setPerimenopause(v as typeof perimenopause)}
              options={[
                { value: 'yes', label: 'Yes' }, { value: 'suspected', label: 'I think so' },
                { value: 'no', label: 'No' }, { value: 'unsure', label: 'Unsure' },
              ]}
            />
          </div>
          <div>
            <p className="text-sm font-medium mb-2">Is your cycle regular?</p>
            <OptionPicker
              value={cycle}
              onChange={v => setCycle(v as typeof cycle)}
              options={[
                { value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' },
                { value: 'irregular', label: 'Irregular' },
              ]}
            />
          </div>
          <div>
            <p className="text-sm font-medium mb-2">Any diagnosed conditions?</p>
            <MultiSelect
              selected={conditions}
              onChange={setConditions}
              options={[
                { value: 'endometriosis', label: 'Endometriosis' },
                { value: 'pcos', label: 'PCOS' },
                { value: 'thyroid', label: 'Thyroid' },
                { value: 'autoimmune', label: 'Autoimmune' },
                { value: 'other', label: 'Other' },
              ]}
            />
          </div>
          <div>
            <p className="text-sm font-medium mb-2">Hormonal treatment?</p>
            <OptionPicker
              value={hormonal}
              onChange={setHormonal}
              options={[
                { value: 'none', label: 'None' }, { value: 'hrt', label: 'HRT' },
                { value: 'pill', label: 'Pill' }, { value: 'coil', label: 'Coil' },
                { value: 'other', label: 'Other' },
              ]}
            />
          </div>
          <div>
            <p className="text-sm font-medium mb-2">Joint issues?</p>
            <OptionPicker
              value={joints ? 'yes' : 'no'}
              onChange={v => setJoints(v === 'yes')}
              options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]}
            />
          </div>
          <div>
            <p className="text-sm font-medium mb-2">Do you exercise regularly?</p>
            <OptionPicker
              value={exerciseReg ? 'yes' : 'no'}
              onChange={v => setExerciseReg(v === 'yes')}
              options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'Not really' }]}
            />
          </div>
          {exerciseReg && (
            <div>
              <p className="text-sm font-medium mb-2">What kind?</p>
              <MultiSelect
                selected={exerciseTypes}
                onChange={setExerciseTypes}
                options={[
                  { value: 'strength', label: 'Strength' },
                  { value: 'cardio', label: 'Cardio' },
                  { value: 'yoga_pilates', label: 'Yoga / Pilates' },
                  { value: 'walking', label: 'Walking' },
                  { value: 'running', label: 'Running' },
                  { value: 'sport', label: 'Sport' },
                  { value: 'other', label: 'Other' },
                ]}
              />
            </div>
          )}
          <div>
            <p className="text-sm font-medium mb-2">Stress baseline?</p>
            <OptionPicker
              value={stress}
              onChange={v => setStress(v as typeof stress)}
              options={[
                { value: 'low', label: 'Low' },
                { value: 'moderate', label: 'Moderate' },
                { value: 'high', label: 'High' },
              ]}
            />
          </div>
          <div>
            <p className="text-sm font-medium mb-2">What do you want to understand?</p>
            <MultiSelect
              selected={goals}
              onChange={setGoals}
              options={[
                { value: 'energy', label: '⚡ Energy patterns' },
                { value: 'cycle', label: '🔄 Cycle changes' },
                { value: 'fibroids', label: '🎯 Fibroid symptoms' },
                { value: 'mental_emotional', label: '🧠 Mental & emotional' },
                { value: 'exercise', label: '💪 Exercise response' },
                { value: 'general', label: '📊 General tracking' },
              ]}
            />
          </div>
          <Button className="w-full" onClick={handleSaveHealth}>Save</Button>
        </div>
      </Overlay>

      {/* 3 — NOTIFICATIONS */}
      <Overlay open={openSection === 'notifications'} onClose={close} title="Notifications">
        <div className="space-y-6 pt-2">

          {/* A — Daily Log Reminders */}
          <div>
            <p className="text-sm font-semibold">Daily log reminders</p>
            <p className="text-xs text-muted-foreground mt-0.5 mb-4">We'll nudge you to log.</p>
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">Morning reminder</p>
                  {morningOn && (
                    <input
                      type="time"
                      value={morningTime}
                      onChange={e => setMorningTime(e.target.value)}
                      className="mt-2 rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  )}
                </div>
                <Switch checked={morningOn} onCheckedChange={setMorningOn} />
              </div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">Evening reminder</p>
                  {eveningOn && (
                    <input
                      type="time"
                      value={eveningTime}
                      onChange={e => setEveningTime(e.target.value)}
                      className="mt-2 rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  )}
                </div>
                <Switch checked={eveningOn} onCheckedChange={setEveningOn} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Some things are easier to log when you wake up. Others, only at the end of the day.
            </p>
          </div>

          {/* B — Weekly Insight */}
          <div className="border-t pt-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Monday morning insight</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  A short read on your week when you open the app on Mondays.
                </p>
              </div>
              <Switch checked={weeklyInsightOn} onCheckedChange={setWeeklyInsightOn} />
            </div>
          </div>

          {/* C — Appointment Reminders */}
          <div className="border-t pt-5">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <p className="text-sm font-medium">Appointment reminders</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  We'll remind you about upcoming appointments.
                </p>
              </div>
              <Switch checked={appointmentOn} onCheckedChange={setAppointmentOn} />
            </div>
            {appointmentOn && (
              <div className="flex gap-2 flex-wrap">
                {['1 day', '3 days', '1 week', '2 weeks'].map(opt => (
                  <button
                    key={opt}
                    onClick={() => setAppointmentLead(opt)}
                    className={cn(
                      'rounded-full px-3 py-1.5 text-xs border transition-colors',
                      appointmentLead === opt
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-card border-border hover:bg-muted',
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Button
            className="w-full"
            onClick={() => { toast.success('Notification preferences saved.'); close(); }}
          >
            Save
          </Button>
        </div>
      </Overlay>

      {/* 4 — CYCLE DATA IMPORT */}
      <Overlay open={openSection === 'import'} onClose={close} title="Cycle Data Import">
        <p className="text-sm text-muted-foreground mb-5">Bring in your existing cycle data.</p>
        <div className="space-y-4">

          {/* A — Apple Health */}
          <div className="rounded-lg border bg-card p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">Apple Health XML</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Export your data from the Apple Health app and upload the XML file here.
            </p>
            <Button variant="outline" size="sm" className="w-full" onClick={() => toast('Coming soon.')}>
              Upload Apple Health export
            </Button>
          </div>

          {/* B — CSV */}
          <div className="rounded-lg border bg-card p-4 space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">CSV upload</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Download the template, fill in your cycle history, and upload it back.
            </p>
            <div className="flex flex-col gap-2">
              <Button variant="outline" size="sm" onClick={() => toast('Coming soon.')}>
                Download CSV template
              </Button>
              <Button size="sm" onClick={() => toast('Coming soon.')}>
                Upload CSV
              </Button>
            </div>
          </div>

          {/* C — Manual */}
          <div className="rounded-lg border bg-card p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Pencil className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">Manual entry</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Or just log your cycles as they happen, in the daily log.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => { close(); navigate('/log'); }}
            >
              Add manually
            </Button>
          </div>
        </div>
      </Overlay>

      {/* 5 — DISPLAY */}
      <Overlay open={openSection === 'display'} onClose={close} title="Display">
        <div className="space-y-4 pt-2">
          <div className="flex gap-2">
            {(['light', 'dark', 'system'] as const).map(opt => (
              <button
                key={opt}
                onClick={() => setTheme(opt)}
                className={cn(
                  'flex-1 rounded-full py-2.5 text-sm border capitalize transition-colors',
                  theme === opt
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card border-border hover:bg-muted',
                )}
              >
                {opt}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            System matches your device setting and changes automatically.
          </p>
        </div>
      </Overlay>

      {/* 6 — PRIVACY & DATA */}
      <Overlay open={openSection === 'privacy'} onClose={close} title="Privacy & Data">
        <div className="space-y-4 pt-2">

          {/* A — Export */}
          <div className="rounded-lg border bg-card p-4 space-y-3">
            <p className="text-sm font-medium">Export all my data</p>
            <p className="text-xs text-muted-foreground">
              Download everything you've logged as a JSON or CSV file.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => toast('Coming soon.')}
              >
                <Download className="h-3 w-3 mr-1.5" />
                JSON
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => toast('Coming soon.')}
              >
                <Download className="h-3 w-3 mr-1.5" />
                CSV
              </Button>
            </div>
          </div>

          {/* B — Delete logs by date range */}
          <div className="rounded-lg border bg-card p-4 space-y-3">
            <p className="text-sm font-medium">Delete logs by date range</p>
            <p className="text-xs text-muted-foreground">
              Permanently remove logs from a specific period.
            </p>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground">From</label>
                <input
                  type="date"
                  value={deleteFrom}
                  onChange={e => setDeleteFrom(e.target.value)}
                  className="mt-1 w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-muted-foreground">To</label>
                <input
                  type="date"
                  value={deleteTo}
                  onChange={e => setDeleteTo(e.target.value)}
                  className="mt-1 w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-destructive border-destructive hover:bg-destructive/10"
              onClick={() => {
                if (!deleteFrom || !deleteTo) {
                  toast.error('Please select both dates.');
                  return;
                }
                setDeleteLogsOpen(true);
              }}
            >
              Delete logs in this range
            </Button>
          </div>

          {/* C — Delete account */}
          <div className="rounded-lg border bg-card p-4 space-y-3">
            <p className="text-sm font-medium">Delete my account</p>
            <p className="text-xs text-muted-foreground">
              Permanently remove your account and all your data.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-destructive border-destructive hover:bg-destructive/10"
              onClick={() => setDeleteAccountStep(1)}
            >
              Delete account
            </Button>
          </div>
        </div>
      </Overlay>

      {/* 7 — ACCOUNT */}
      <Overlay open={openSection === 'account'} onClose={close} title="Account">
        <div className="space-y-0 pt-2 divide-y divide-border">
          <div className="py-4">
            <p className="text-xs text-muted-foreground mb-1">Email</p>
            <p className="text-sm">kui.njoroge@email.com</p>
          </div>
          <div className="py-4">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => toast('Coming soon.')}
            >
              Change password
            </Button>
          </div>
          <div className="py-4">
            <p className="text-xs text-muted-foreground mb-1">Member since</p>
            <p className="text-sm">12/01/2026</p>
          </div>
        </div>
      </Overlay>

      {/* 8 — ABOUT */}
      <Overlay open={openSection === 'about'} onClose={close} title="About">
        <div className="pt-2 divide-y divide-border">
          <div className="py-4">
            <p className="text-xs text-muted-foreground mb-1">App version</p>
            <p className="text-sm">v0.1.0</p>
          </div>
          <button
            className="w-full py-4 text-left flex items-center justify-between"
            onClick={() => toast('Coming soon.')}
          >
            <p className="text-sm">Terms of service</p>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
          <button
            className="w-full py-4 text-left flex items-center justify-between"
            onClick={() => toast('Coming soon.')}
          >
            <p className="text-sm">Privacy policy</p>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
          <div className="py-4">
            <p className="text-sm font-medium">Contact / feedback</p>
            <p className="text-xs text-muted-foreground mt-1">Get in touch: hello@kwiwithin.app</p>
          </div>
        </div>
      </Overlay>

      {/* ════════════════════════════════════════════════════
          CONFIRMATION DIALOGS
          ════════════════════════════════════════════════════ */}

      {/* Sign out */}
      <AlertDialog open={signOutOpen} onOpenChange={setSignOutOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out of KWI Within?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { setSignOutOpen(false); toast('Coming soon.'); }}
            >
              Sign out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete logs */}
      <AlertDialog open={deleteLogsOpen} onOpenChange={setDeleteLogsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete logs?</AlertDialogTitle>
            <AlertDialogDescription>
              Delete all logs between {deleteFrom} and {deleteTo}? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { setDeleteLogsOpen(false); toast('Coming soon.'); }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete account — step 1 */}
      <AlertDialog
        open={deleteAccountStep === 1}
        onOpenChange={o => !o && setDeleteAccountStep(0)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. Your account and all your data will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteAccountStep(0)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => setDeleteAccountStep(2)}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete account — step 2 */}
      <AlertDialog
        open={deleteAccountStep === 2}
        onOpenChange={o => !o && setDeleteAccountStep(0)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Type your email address to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-6 pb-2">
            <input
              value={deleteAccountEmail}
              onChange={e => setDeleteAccountEmail(e.target.value)}
              placeholder="kui.njoroge@email.com"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => { setDeleteAccountStep(0); setDeleteAccountEmail(''); }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                setDeleteAccountStep(0);
                setDeleteAccountEmail('');
                toast('Coming soon.');
              }}
            >
              Delete account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Settings;
