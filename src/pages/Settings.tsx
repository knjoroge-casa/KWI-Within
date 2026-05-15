import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import {
  User, Heart, Bell, Upload, Monitor, Shield,
  Key, Info, ChevronRight, LogOut, FileText,
  Download, Pencil, Loader2,
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
import { format } from 'date-fns';

// ── Theme helper ───────────────────────────────────────────────

const applyTheme = (t: 'light' | 'dark' | 'system') => {
  const root = document.documentElement;
  if (t === 'dark') root.classList.add('dark');
  else if (t === 'light') root.classList.remove('dark');
  else root.classList.toggle('dark', window.matchMedia('(prefers-color-scheme: dark)').matches);
};

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
        type="button"
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
        type="button"
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

// ── Password requirements ──────────────────────────────────────

const PasswordReqs = ({ password }: { password: string }) => {
  const checks = [
    { label: 'At least 8 characters', ok: password.length >= 8 },
    { label: 'One uppercase letter',  ok: /[A-Z]/.test(password) },
    { label: 'One number',            ok: /[0-9]/.test(password) },
    { label: 'One special character', ok: /[^A-Za-z0-9]/.test(password) },
  ];
  return (
    <div className="mt-2 space-y-1">
      {checks.map(c => (
        <div key={c.label} className="flex items-center gap-2">
          <span className={cn('text-xs w-3 text-center', c.ok ? 'text-green-600' : 'text-muted-foreground')}>
            {c.ok ? '✓' : '○'}
          </span>
          <span className={cn('text-xs', c.ok ? 'text-green-600' : 'text-muted-foreground')}>
            {c.label}
          </span>
        </div>
      ))}
    </div>
  );
};

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

// Appointment lead-time display labels ↔ DB enum values
const LEAD_OPTIONS: { value: string; label: string }[] = [
  { value: '1_day',   label: '1 day'   },
  { value: '3_days',  label: '3 days'  },
  { value: '1_week',  label: '1 week'  },
  { value: '2_weeks', label: '2 weeks' },
];

const Settings = () => {
  const { user, profile: authProfile, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [openSection, setOpenSection] = useState<SectionId | null>(null);
  const open = (id: SectionId) => setOpenSection(id);
  const close = () => setOpenSection(null);

  // ── Profile ──
  const [firstName, setFirstName] = useState('');
  const [lastInitial, setLastInitial] = useState('');
  const [dobMonth, setDobMonth] = useState('01');
  const [dobYear, setDobYear] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState('');
  const [photoUploading, setPhotoUploading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authProfile) return;
    setFirstName(authProfile.first_name ?? '');
    setLastInitial(authProfile.last_initial ?? '');
    setDobMonth(authProfile.date_of_birth_month ? String(authProfile.date_of_birth_month).padStart(2, '0') : '01');
    setDobYear(authProfile.date_of_birth_year ? String(authProfile.date_of_birth_year) : '');
    setPhotoUrl(authProfile.avatar_url ?? null);
  }, [authProfile?.id]);

  // ── Health Context ──
  const [fibroids, setFibroids] = useState('');
  const [hormonalOn, setHormonalOn] = useState('');
  const [hormonalDetail, setHormonalDetail] = useState('');
  const [conditions, setConditions] = useState<string[]>([]);
  const [conditionsOther, setConditionsOther] = useState('');
  const [perimenopause, setPerimenopause] = useState('');
  const [regularCycle, setRegularCycle] = useState('');
  const [joints, setJoints] = useState('');
  const [jointsDetail, setJointsDetail] = useState('');
  const [exerciseReg, setExerciseReg] = useState('');
  const [exerciseTypes, setExerciseTypes] = useState<string[]>([]);
  const [exerciseOther, setExerciseOther] = useState('');
  const [tracksFood, setTracksFood] = useState('');
  const [stress, setStress] = useState('');
  const [goals, setGoals] = useState<string[]>([]);
  const [healthSaving, setHealthSaving] = useState(false);

  // Map DB cycle_regularity → UI value
  const cycleRegToUi = (v: string | null) => {
    if (v === 'regular') return 'yes';
    if (v === 'no_cycle') return 'no';
    return v ?? '';
  };

  useEffect(() => {
    if (!authProfile) return;
    setFibroids(authProfile.has_fibroids ?? '');
    setHormonalOn(authProfile.hormonal_treatment === true ? 'yes' : authProfile.hormonal_treatment === false ? 'no' : '');
    setHormonalDetail(authProfile.hormonal_treatment_type ?? '');
    const dbConds = authProfile.diagnosed_conditions ?? [];
    const other = authProfile.diagnosed_conditions_other ?? '';
    setConditions(other ? [...dbConds, 'other'] : dbConds);
    setConditionsOther(other);
    setPerimenopause(authProfile.perimenopause_status ?? '');
    setRegularCycle(cycleRegToUi(authProfile.cycle_regularity ?? null));
    setJoints(authProfile.joint_conditions === true ? 'yes' : authProfile.joint_conditions === false ? 'no' : '');
    setJointsDetail(authProfile.joint_conditions_detail ?? '');
    setExerciseReg(authProfile.exercises_regularly === true ? 'yes' : authProfile.exercises_regularly === false ? 'no' : '');
    const dbExTypes = authProfile.exercise_types ?? [];
    const exOther = authProfile.exercise_types_other ?? '';
    setExerciseTypes(exOther ? [...dbExTypes, 'other'] : dbExTypes);
    setExerciseOther(exOther);
    setTracksFood(authProfile.tracks_food === true ? 'yes' : authProfile.tracks_food === false ? 'no' : '');
    setStress(authProfile.stress_baseline ?? '');
    setGoals(authProfile.tracking_goals ?? []);
  }, [authProfile?.id]);

  // ── Notifications ──
  const [morningOn, setMorningOn] = useState(false);
  const [morningTime, setMorningTime] = useState('08:00');
  const [eveningOn, setEveningOn] = useState(false);
  const [eveningTime, setEveningTime] = useState('21:00');
  const [weeklyInsightOn, setWeeklyInsightOn] = useState(true);
  const [appointmentOn, setAppointmentOn] = useState(false);
  const [appointmentLead, setAppointmentLead] = useState('3_days');
  const [notifSaving, setNotifSaving] = useState(false);

  useEffect(() => {
    if (!authProfile) return;
    setMorningOn(authProfile.morning_reminder_enabled ?? false);
    setMorningTime(authProfile.morning_reminder_time ?? '08:00');
    setEveningOn(authProfile.evening_reminder_enabled ?? false);
    setEveningTime(authProfile.evening_reminder_time ?? '21:00');
    setWeeklyInsightOn(authProfile.weekly_insight_enabled ?? true);
    setAppointmentOn(authProfile.appointment_reminders_enabled ?? false);
    setAppointmentLead(authProfile.appointment_reminder_lead_time ?? '3_days');
  }, [authProfile?.id]);

  // ── Display ──
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [themeSaving, setThemeSaving] = useState(false);

  useEffect(() => {
    if (!authProfile) return;
    const t = (authProfile.theme ?? 'system') as 'light' | 'dark' | 'system';
    setTheme(t);
  }, [authProfile?.id]);

  // ── Privacy ──
  const [deleteFrom, setDeleteFrom] = useState('');
  const [deleteTo, setDeleteTo] = useState('');
  const [deleteLogsOpen, setDeleteLogsOpen] = useState(false);
  const [deleteLogsBusy, setDeleteLogsBusy] = useState(false);
  const [deleteAccountStep, setDeleteAccountStep] = useState(0);
  const [deleteAccountEmail, setDeleteAccountEmail] = useState('');
  const [deleteAccountBusy, setDeleteAccountBusy] = useState(false);

  // ── Account — change password ──
  const [changePwOpen, setChangePwOpen] = useState(false);
  const [newPw, setNewPw] = useState('');
  const [confirmNewPw, setConfirmNewPw] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  // ── Sign out ──
  const [signOutOpen, setSignOutOpen] = useState(false);

  // ── Handlers ──

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 2 * 1024 * 1024) {
      setPhotoError('Photo must be under 2MB.');
      return;
    }
    setPhotoError('');
    setPhotoUploading(true);
    const ext = file.name.split('.').pop() ?? 'jpg';
    // Use a unique path each time so this is always a fresh INSERT (no upsert/UPDATE policy needed)
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { contentType: file.type });
    if (uploadError) {
      console.error('[Avatar upload error]', uploadError);
      setPhotoError(`Upload failed: ${uploadError.message}`);
      setPhotoUploading(false);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
    await supabase.from('user_profile').update({ avatar_url: publicUrl }).eq('id', user.id);
    await refreshProfile();
    setPhotoUrl(publicUrl);
    setPhotoUploading(false);
  };

  const handleRemovePhoto = async () => {
    setPhotoUrl(null);
    setPhotoError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (!user) return;
    await supabase.from('user_profile').update({ avatar_url: null }).eq('id', user.id);
    await refreshProfile();
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setProfileSaving(true);
    await supabase.from('user_profile').update({
      first_name: firstName.trim() || null,
      last_initial: lastInitial.trim() || null,
      date_of_birth_month: dobMonth ? parseInt(dobMonth, 10) : null,
      date_of_birth_year: dobYear ? parseInt(dobYear, 10) : null,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id);
    await refreshProfile();
    setProfileSaving(false);
    toast.success('Profile saved.');
    close();
  };

  const handleSaveHealth = async () => {
    if (!user) return;
    setHealthSaving(true);
    const cycleMap: Record<string, 'regular' | 'irregular' | 'no_cycle'> = {
      yes: 'regular', irregular: 'irregular', no: 'no_cycle',
    };
    await supabase.from('user_profile').update({
      has_fibroids: (fibroids as 'no' | 'yes' | 'suspected' | 'removed') || null,
      hormonal_treatment: hormonalOn === 'yes' ? true : hormonalOn === 'no' ? false : null,
      hormonal_treatment_type: hormonalOn === 'yes' ? (hormonalDetail.trim() || null) : null,
      diagnosed_conditions: conditions.filter(c => c !== 'other').length > 0 ? conditions.filter(c => c !== 'other') : null,
      diagnosed_conditions_other: conditions.includes('other') ? (conditionsOther.trim() || null) : null,
      perimenopause_status: (perimenopause as 'yes' | 'suspected' | 'no' | 'unsure') || null,
      cycle_regularity: regularCycle ? (cycleMap[regularCycle] ?? null) : null,
      joint_conditions: joints === 'yes' ? true : joints === 'no' ? false : null,
      joint_conditions_detail: joints === 'yes' ? (jointsDetail.trim() || null) : null,
      exercises_regularly: exerciseReg === 'yes' ? true : exerciseReg === 'no' ? false : null,
      exercise_types: exerciseTypes.filter(t => t !== 'other').length > 0 ? exerciseTypes.filter(t => t !== 'other') : null,
      exercise_types_other: exerciseTypes.includes('other') ? (exerciseOther.trim() || null) : null,
      tracks_food: tracksFood === 'yes' ? true : tracksFood === 'no' ? false : null,
      stress_baseline: (stress as 'low' | 'moderate' | 'high') || null,
      tracking_goals: goals.length > 0 ? goals : null,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id);
    await refreshProfile();
    setHealthSaving(false);
    toast.success('Health context updated.');
    close();
  };

  const handleSaveNotifications = async () => {
    if (!user) return;
    setNotifSaving(true);
    await supabase.from('user_profile').update({
      morning_reminder_enabled: morningOn,
      morning_reminder_time: morningOn ? morningTime : null,
      evening_reminder_enabled: eveningOn,
      evening_reminder_time: eveningOn ? eveningTime : null,
      weekly_insight_enabled: weeklyInsightOn,
      appointment_reminders_enabled: appointmentOn,
      appointment_reminder_lead_time: appointmentOn ? (appointmentLead as '1_day' | '3_days' | '1_week' | '2_weeks') : null,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id);
    await refreshProfile();
    setNotifSaving(false);
    toast.success('Notification preferences saved.');
    close();
  };

  const handleThemeChange = async (t: 'light' | 'dark' | 'system') => {
    setTheme(t);
    applyTheme(t);
    if (!user) return;
    setThemeSaving(true);
    await supabase.from('user_profile').update({
      theme: t,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id);
    await refreshProfile();
    setThemeSaving(false);
  };

  const handleDeleteLogs = async () => {
    if (!user || !deleteFrom || !deleteTo) return;
    setDeleteLogsBusy(true);
    await supabase
      .from('daily_log')
      .update({ deleted_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .gte('date', deleteFrom)
      .lte('date', deleteTo);
    setDeleteLogsBusy(false);
    setDeleteLogsOpen(false);
    setDeleteFrom('');
    setDeleteTo('');
    toast.success('Logs deleted.');
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleteAccountBusy(true);
    await supabase
      .from('user_profile')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', user.id);
    setDeleteAccountBusy(false);
    setDeleteAccountStep(0);
    setDeleteAccountEmail('');
    await signOut();
    navigate('/signin', { replace: true });
  };

  const pwValid = (
    newPw.length >= 8 &&
    /[A-Z]/.test(newPw) &&
    /[0-9]/.test(newPw) &&
    /[^A-Za-z0-9]/.test(newPw)
  );
  const canSavePw = pwValid && confirmNewPw === newPw;

  const handleChangePassword = async () => {
    if (!canSavePw) return;
    setPwSaving(true);
    setPwError(null);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPw });
      if (error) {
        setPwError('Something went wrong. Please try again.');
      } else {
        setChangePwOpen(false);
        setNewPw('');
        setConfirmNewPw('');
        toast.success('Password updated.');
      }
    } catch {
      setPwError('Something went wrong. Please try again.');
    } finally {
      setPwSaving(false);
    }
  };

  const initials = `${firstName.charAt(0).toUpperCase()}${lastInitial.toUpperCase()}`;

  const memberSince = authProfile?.created_at
    ? format(new Date(authProfile.created_at), 'dd/MM/yyyy')
    : '—';

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
          {photoUploading ? (
            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : photoUrl ? (
            <img
              src={photoUrl}
              alt="Profile photo"
              className="h-20 w-20 rounded-full object-cover border-2 border-border"
            />
          ) : (
            <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
              {initials || '?'}
            </div>
          )}
          <div className="flex gap-3 mt-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={photoUploading}
              className="text-xs text-primary underline underline-offset-2 disabled:opacity-50"
            >
              {photoUrl ? 'Change photo' : 'Add photo'}
            </button>
            {photoUrl && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                disabled={photoUploading}
                className="text-xs text-destructive underline underline-offset-2 disabled:opacity-50"
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
              placeholder="First name"
              disabled={profileSaving}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Last initial</label>
            <input
              value={lastInitial}
              onChange={e => setLastInitial(e.target.value.charAt(0))}
              maxLength={1}
              placeholder="N"
              disabled={profileSaving}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
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
                disabled={profileSaving}
                className="flex-1 rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
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
                placeholder="YYYY"
                min="1900"
                max={new Date().getFullYear()}
                disabled={profileSaving}
                className="w-24 rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              />
            </div>
          </div>
          <Button
            className="w-full mt-2"
            disabled={profileSaving}
            onClick={handleSaveProfile}
          >
            {profileSaving ? <><Loader2 className="animate-spin" /> Saving...</> : 'Save'}
          </Button>
        </div>
      </Overlay>

      {/* 2 — HEALTH CONTEXT */}
      <Overlay open={openSection === 'health'} onClose={close} title="Health Context">
        <p className="text-sm text-muted-foreground mb-6">Update anytime — bodies change.</p>
        <div className="space-y-6">

          {/* Fibroids */}
          <div>
            <p className="text-sm font-medium mb-2">Do you have fibroids?</p>
            <OptionPicker
              value={fibroids}
              onChange={setFibroids}
              options={[
                { value: 'no',        label: 'No' },
                { value: 'yes',       label: 'Yes' },
                { value: 'suspected', label: 'Suspected' },
                { value: 'removed',   label: 'Had them, removed' },
              ]}
            />
          </div>

          {/* Hormonal treatment */}
          <div>
            <p className="text-sm font-medium mb-2">On any hormonal treatment or contraception?</p>
            <OptionPicker
              value={hormonalOn}
              onChange={setHormonalOn}
              options={[
                { value: 'no',  label: 'No' },
                { value: 'yes', label: 'Yes' },
              ]}
            />
            {hormonalOn === 'yes' && (
              <input
                value={hormonalDetail}
                onChange={e => setHormonalDetail(e.target.value)}
                placeholder="e.g. pill, IUD, HRT"
                className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            )}
          </div>

          {/* Diagnosed conditions */}
          <div>
            <p className="text-sm font-medium mb-1">Any diagnosed conditions?</p>
            <p className="text-xs text-muted-foreground mb-2">Tap any that apply</p>
            <MultiSelect
              selected={conditions}
              onChange={setConditions}
              options={[
                { value: 'endometriosis', label: 'Endometriosis' },
                { value: 'pcos',          label: 'PCOS' },
                { value: 'thyroid',       label: 'Thyroid condition' },
                { value: 'autoimmune',    label: 'Autoimmune' },
                { value: 'other',         label: 'Other' },
              ]}
            />
            {conditions.includes('other') && (
              <input
                value={conditionsOther}
                onChange={e => setConditionsOther(e.target.value)}
                placeholder="Please specify"
                className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            )}
          </div>

          {/* Perimenopause */}
          <div>
            <p className="text-sm font-medium mb-2">In perimenopause, or suspect you are?</p>
            <OptionPicker
              value={perimenopause}
              onChange={setPerimenopause}
              options={[
                { value: 'yes',       label: 'Yes' },
                { value: 'suspected', label: 'Suspected' },
                { value: 'no',        label: 'No' },
                { value: 'unsure',    label: 'Unsure' },
              ]}
            />
          </div>

          {/* Cycle */}
          <div>
            <p className="text-sm font-medium mb-2">Do you have a regular menstrual cycle?</p>
            <OptionPicker
              value={regularCycle}
              onChange={setRegularCycle}
              options={[
                { value: 'yes',       label: 'Yes' },
                { value: 'irregular', label: 'Irregular' },
                { value: 'no',        label: 'No' },
              ]}
            />
          </div>

          {/* Joints */}
          <div>
            <p className="text-sm font-medium mb-2">Any joint or musculoskeletal conditions?</p>
            <OptionPicker
              value={joints}
              onChange={setJoints}
              options={[
                { value: 'no',  label: 'No' },
                { value: 'yes', label: 'Yes' },
              ]}
            />
            {joints === 'yes' && (
              <input
                value={jointsDetail}
                onChange={e => setJointsDetail(e.target.value)}
                placeholder="Please describe"
                className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            )}
          </div>

          {/* Exercise */}
          <div>
            <p className="text-sm font-medium mb-2">Do you exercise regularly?</p>
            <OptionPicker
              value={exerciseReg}
              onChange={setExerciseReg}
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no',  label: 'No' },
              ]}
            />
            {exerciseReg === 'yes' && (
              <div className="mt-3 space-y-2">
                <MultiSelect
                  selected={exerciseTypes}
                  onChange={setExerciseTypes}
                  options={[
                    { value: 'strength',     label: 'Strength' },
                    { value: 'cardio',       label: 'Cardio' },
                    { value: 'yoga_pilates', label: 'Yoga / Pilates' },
                    { value: 'walking',      label: 'Walking' },
                    { value: 'running',      label: 'Running' },
                    { value: 'sport',        label: 'Sport' },
                    { value: 'other',        label: 'Other' },
                  ]}
                />
                {exerciseTypes.includes('other') && (
                  <input
                    value={exerciseOther}
                    onChange={e => setExerciseOther(e.target.value)}
                    placeholder="Please specify"
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                )}
              </div>
            )}
          </div>

          {/* Food tracking */}
          <div>
            <p className="text-sm font-medium mb-2">Do you track your food or have dietary considerations?</p>
            <OptionPicker
              value={tracksFood}
              onChange={setTracksFood}
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no',  label: 'No' },
              ]}
            />
          </div>

          {/* Stress */}
          <div>
            <p className="text-sm font-medium mb-2">How would you describe your stress baseline?</p>
            <OptionPicker
              value={stress}
              onChange={setStress}
              options={[
                { value: 'low',      label: 'Low' },
                { value: 'moderate', label: 'Moderate' },
                { value: 'high',     label: 'High' },
              ]}
            />
          </div>

          {/* Goals */}
          <div>
            <p className="text-sm font-medium mb-2">What do you want to understand?</p>
            <MultiSelect
              selected={goals}
              onChange={setGoals}
              options={[
                { value: 'energy',           label: 'My energy patterns' },
                { value: 'cycle',            label: 'My cycle and hormonal shifts' },
                { value: 'fibroids',         label: 'My fibroid symptoms' },
                { value: 'mental_emotional', label: 'My mental and emotional state' },
                { value: 'exercise',         label: "My body's response to exercise" },
                { value: 'general',          label: "General pattern tracking" },
              ]}
            />
          </div>

          <Button className="w-full" disabled={healthSaving} onClick={handleSaveHealth}>
            {healthSaving ? <><Loader2 className="animate-spin" /> Saving...</> : 'Save'}
          </Button>
        </div>
      </Overlay>

      {/* 3 — NOTIFICATIONS */}
      <Overlay open={openSection === 'notifications'} onClose={close} title="Notifications">
        <div className="space-y-6 pt-2">

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
                {LEAD_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setAppointmentLead(opt.value)}
                    className={cn(
                      'rounded-full px-3 py-1.5 text-xs border transition-colors',
                      appointmentLead === opt.value
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-card border-border hover:bg-muted',
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Button className="w-full" disabled={notifSaving} onClick={handleSaveNotifications}>
            {notifSaving ? <><Loader2 className="animate-spin" /> Saving...</> : 'Save'}
          </Button>
        </div>
      </Overlay>

      {/* 4 — CYCLE DATA IMPORT */}
      <Overlay open={openSection === 'import'} onClose={close} title="Cycle Data Import">
        <p className="text-sm text-muted-foreground mb-5">Bring in your existing cycle data.</p>
        <div className="space-y-4">

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
                type="button"
                disabled={themeSaving}
                onClick={() => handleThemeChange(opt)}
                className={cn(
                  'flex-1 rounded-full py-2.5 text-sm border capitalize transition-colors disabled:opacity-50',
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
            System matches your device setting and changes automatically. Changes save instantly.
          </p>
        </div>
      </Overlay>

      {/* 6 — PRIVACY & DATA */}
      <Overlay open={openSection === 'privacy'} onClose={close} title="Privacy & Data">
        <div className="space-y-4 pt-2">

          <div className="rounded-lg border bg-card p-4 space-y-3">
            <p className="text-sm font-medium">Export all my data</p>
            <p className="text-xs text-muted-foreground">
              Download everything you've logged as a JSON or CSV file.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => toast('Coming soon.')}>
                <Download className="h-3 w-3 mr-1.5" />
                JSON
              </Button>
              <Button variant="outline" size="sm" className="flex-1" onClick={() => toast('Coming soon.')}>
                <Download className="h-3 w-3 mr-1.5" />
                CSV
              </Button>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-4 space-y-3">
            <p className="text-sm font-medium">Delete logs by date range</p>
            <p className="text-xs text-muted-foreground">
              Remove logs from a specific period.
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
            <p className="text-sm">{user?.email ?? '—'}</p>
          </div>
          <div className="py-4">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setChangePwOpen(true)}
            >
              Change password
            </Button>
          </div>
          <div className="py-4">
            <p className="text-xs text-muted-foreground mb-1">Member since</p>
            <p className="text-sm">{memberSince}</p>
          </div>
        </div>
      </Overlay>

      {/* Change password sheet */}
      <Sheet open={changePwOpen} onOpenChange={o => { if (!o) { setChangePwOpen(false); setNewPw(''); setConfirmNewPw(''); setPwError(null); } }}>
        <SheetContent side="bottom" className="rounded-t-2xl px-6 pb-8">
          <SheetHeader className="mb-5">
            <SheetTitle>Change password</SheetTitle>
          </SheetHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">New password</label>
              <input
                type="password"
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                disabled={pwSaving}
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              />
              {newPw.length > 0 && <PasswordReqs password={newPw} />}
            </div>
            <div>
              <label className="text-sm font-medium">Confirm new password</label>
              <input
                type="password"
                value={confirmNewPw}
                onChange={e => setConfirmNewPw(e.target.value)}
                disabled={pwSaving}
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              />
              {confirmNewPw.length > 0 && confirmNewPw !== newPw && (
                <p className="text-xs text-destructive mt-1">Passwords don't match.</p>
              )}
            </div>
            {pwError && <p className="text-sm text-destructive/80">{pwError}</p>}
            <Button className="w-full" disabled={!canSavePw || pwSaving} onClick={handleChangePassword}>
              {pwSaving ? <><Loader2 className="animate-spin" /> Saving...</> : 'Save new password'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

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
              onClick={async () => { setSignOutOpen(false); await signOut(); navigate('/signin', { replace: true }); }}
            >
              Sign out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete logs */}
      <AlertDialog open={deleteLogsOpen} onOpenChange={o => { if (!o) setDeleteLogsOpen(false); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete logs?</AlertDialogTitle>
            <AlertDialogDescription>
              Delete all logs between {deleteFrom} and {deleteTo}? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLogsBusy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteLogsBusy}
              onClick={handleDeleteLogs}
            >
              {deleteLogsBusy ? 'Deleting…' : 'Delete'}
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
              placeholder={user?.email ?? 'your@email.com'}
              disabled={deleteAccountBusy}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deleteAccountBusy}
              onClick={() => { setDeleteAccountStep(0); setDeleteAccountEmail(''); }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteAccountEmail !== user?.email || deleteAccountBusy}
              onClick={handleDeleteAccount}
            >
              {deleteAccountBusy ? 'Deleting…' : 'Delete account'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Settings;
