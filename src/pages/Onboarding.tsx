import { useState, useRef, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Loader2, Mail } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
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

// ── Progress indicator ─────────────────────────────────────────

const PROGRESS_LABELS = [
  'Sign up',
  'Confirm',
  'About your body',
  'About your lifestyle',
  'What you want to understand',
];

// Maps internal screen index to progress step index (0-4)
const screenToStep = (screen: number): number => {
  if (screen === 1) return 0;
  if (screen === 2) return 1;
  if (screen === 3 || screen === 4) return 2;
  if (screen === 5) return 3;
  if (screen === 6) return 4;
  return -1;
};

const ProgressIndicator = ({ screen }: { screen: number }) => {
  const current = screenToStep(screen);
  return (
    <div className="flex gap-1.5">
      {PROGRESS_LABELS.map((label, i) => {
        const status = i < current ? 'done' : i === current ? 'active' : 'future';
        return (
          <div key={label} className="flex flex-col items-center flex-1 gap-1.5">
            <div
              className={cn(
                'h-1.5 w-full rounded-full transition-colors',
                status === 'done'   ? 'bg-primary/40' :
                status === 'active' ? 'bg-primary'    :
                'bg-muted',
              )}
            />
            <span
              className={cn(
                'text-[9px] text-center leading-tight',
                status === 'active' ? 'text-primary font-medium' : 'text-muted-foreground',
              )}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ── Password requirements ──────────────────────────────────────

const PasswordReqs = ({ password }: { password: string }) => {
  const checks = [
    { label: 'At least 8 characters',  ok: password.length >= 8 },
    { label: 'One uppercase letter',    ok: /[A-Z]/.test(password) },
    { label: 'One number',             ok: /[0-9]/.test(password) },
    { label: 'One special character',  ok: /[^A-Za-z0-9]/.test(password) },
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

// ── Shared input style ─────────────────────────────────────────

const inputCls =
  'mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring';

const inputDisabledCls =
  'mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm opacity-50 cursor-not-allowed';

// ── Main component ─────────────────────────────────────────────

const Onboarding = () => {
  const { onboarded, setOnboarded } = useApp();
  const { signUp, isAuthenticated, hasCompletedOnboarding, loading: authLoading, user, refreshProfile } = useAuth();
  const navigate = useNavigate();

  // ── Screen (0=Welcome … 7=Closing) ──
  const [screen, setScreen] = useState(0);

  // ── Sign up fields ──
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastInitial, setLastInitial] = useState('');
  const [dobMonth, setDobMonth] = useState('01');
  const [dobYear, setDobYear] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // ── Sign up async state ──
  const [signUpLoading, setSignUpLoading] = useState(false);
  const [signUpError, setSignUpError] = useState<'exists' | 'generic' | null>(null);

  // ── Finish async state ──
  const [finishLoading, setFinishLoading] = useState(false);
  const [finishError, setFinishError] = useState(false);

  // ── Step 1 — Body ──
  const [fibroids, setFibroids] = useState('');
  const [hormonalOn, setHormonalOn] = useState('');
  const [hormonalDetail, setHormonalDetail] = useState('');
  const [conditions, setConditions] = useState<string[]>([]);
  const [conditionsOther, setConditionsOther] = useState('');
  const [perimenopause, setPerimenopause] = useState('');
  const [regularCycle, setRegularCycle] = useState('');
  const [joints, setJoints] = useState('');
  const [jointsDetail, setJointsDetail] = useState('');

  // ── Step 2 — Lifestyle ──
  const [exerciseReg, setExerciseReg] = useState('');
  const [exerciseTypes, setExerciseTypes] = useState<string[]>([]);
  const [exerciseOther, setExerciseOther] = useState('');
  const [tracksFood, setTracksFood] = useState('');
  const [stress, setStress] = useState('');

  // ── Step 3 — Goals ──
  const [goals, setGoals] = useState<string[]>([]);

  // Prevent double-handling the auth transition
  const hasHandledAuth = useRef(false);

  // Detect magic link return or arriving already authenticated
  useEffect(() => {
    if (authLoading || !isAuthenticated || hasHandledAuth.current) return;
    hasHandledAuth.current = true;

    if (hasCompletedOnboarding) {
      navigate('/', { replace: true });
      return;
    }

    // Write name/DOB from user_metadata into user_profile
    const meta = user?.user_metadata ?? {};
    const fn = (meta.first_name as string) || '';
    const li = (meta.last_initial as string) || '';
    const dm = meta.date_of_birth_month ? Number(meta.date_of_birth_month) : null;
    const dy = meta.date_of_birth_year ? Number(meta.date_of_birth_year) : null;

    if (fn) setFirstName(fn);
    if (li) setLastInitial(li);
    if (dm) setDobMonth(String(dm).padStart(2, '0'));
    if (dy) setDobYear(String(dy));

    if (user && (fn || li || dm || dy)) {
      supabase
        .from('user_profile')
        .update({
          first_name: fn || null,
          last_initial: li || null,
          date_of_birth_month: dm,
          date_of_birth_year: dy,
        })
        .eq('id', user.id)
        .then(() => setScreen(3));
    } else {
      setScreen(3);
    }
  }, [isAuthenticated, authLoading]);

  // ── Redirect if already onboarded (localStorage guard) ──
  if (onboarded) return <Navigate to="/" replace />;

  // ── Sign-up validation ──
  const pwChecks = {
    length:  password.length >= 8,
    upper:   /[A-Z]/.test(password),
    number:  /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
  const pwValid     = Object.values(pwChecks).every(Boolean);
  const emailValid  = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const signUpValid =
    emailValid &&
    pwValid &&
    confirmPw === password &&
    firstName.trim().length > 0 &&
    lastInitial.trim().length > 0 &&
    dobYear.trim().length >= 4 &&
    agreedToTerms;

  // ── Handle sign up ──
  const handleSignUp = async () => {
    if (!signUpValid) return;
    setSignUpLoading(true);
    setSignUpError(null);
    const { error } = await signUp(email.trim(), password, {
      first_name: firstName.trim(),
      last_initial: lastInitial.trim(),
      date_of_birth_month: parseInt(dobMonth, 10),
      date_of_birth_year: parseInt(dobYear, 10),
    });
    setSignUpLoading(false);
    if (error) {
      console.error('[SignUp error]', error);
      const lower = error.toLowerCase();
      if (lower.includes('already registered') || lower.includes('already exists')) {
        setSignUpError('exists');
      } else {
        setSignUpError('generic');
      }
    } else {
      setScreen(2);
    }
  };

  // ── Resend confirmation email ──
  const handleResend = async () => {
    await signUp(email.trim(), password, {
      first_name: firstName.trim(),
      last_initial: lastInitial.trim(),
      date_of_birth_month: parseInt(dobMonth, 10),
      date_of_birth_year: parseInt(dobYear, 10),
    });
    toast('Confirmation email resent.');
  };

  // ── Build Supabase update payload from current state ──
  const buildUpdatePayload = () => {
    const cycleMap: Record<string, 'regular' | 'irregular' | 'no_cycle'> = {
      yes: 'regular', irregular: 'irregular', no: 'no_cycle',
    };
    return {
      has_fibroids:              (fibroids as 'no' | 'yes' | 'suspected' | 'removed') || null,
      hormonal_treatment:        hormonalOn === 'yes' ? true : hormonalOn === 'no' ? false : null,
      hormonal_treatment_type:   hormonalOn === 'yes' ? (hormonalDetail.trim() || null) : null,
      diagnosed_conditions:      conditions.filter(c => c !== 'other').length > 0
                                   ? conditions.filter(c => c !== 'other') : null,
      diagnosed_conditions_other: conditions.includes('other') ? (conditionsOther.trim() || null) : null,
      perimenopause_status:      (perimenopause as 'yes' | 'suspected' | 'no' | 'unsure') || null,
      cycle_regularity:          regularCycle ? (cycleMap[regularCycle] ?? null) : null,
      joint_conditions:          joints === 'yes' ? true : joints === 'no' ? false : null,
      joint_conditions_detail:   joints === 'yes' ? (jointsDetail.trim() || null) : null,
      exercises_regularly:       exerciseReg === 'yes' ? true : exerciseReg === 'no' ? false : null,
      exercise_types:            exerciseTypes.filter(t => t !== 'other').length > 0
                                   ? exerciseTypes.filter(t => t !== 'other') : null,
      exercise_types_other:      exerciseTypes.includes('other') ? (exerciseOther.trim() || null) : null,
      tracks_food:               tracksFood === 'yes' ? true : tracksFood === 'no' ? false : null,
      stress_baseline:           (stress as 'low' | 'moderate' | 'high') || null,
      tracking_goals:            goals.length > 0 ? goals : null,
      onboarding_completed:      true,
      updated_at:                new Date().toISOString(),
    };
  };

  // ── Skip handlers ──
  const handleSkip4 = () => {
    setFibroids(''); setHormonalOn(''); setHormonalDetail('');
    setConditions([]); setConditionsOther('');
    setPerimenopause(''); setRegularCycle('');
    setJoints(''); setJointsDetail('');
    setScreen(5);
  };
  const handleSkip5 = () => {
    setExerciseReg(''); setExerciseTypes([]); setExerciseOther('');
    setTracksFood(''); setStress('');
    setScreen(6);
  };
  const handleSkip6 = async () => {
    if (!user) { setGoals([]); setScreen(7); return; }
    setFinishLoading(true);
    const payload = { ...buildUpdatePayload(), tracking_goals: null };
    setGoals([]);
    await supabase.from('user_profile').update(payload).eq('id', user.id);
    await refreshProfile();
    setFinishLoading(false);
    setScreen(7);
  };

  const skipHandlers: Record<number, () => void | Promise<void>> = {
    4: handleSkip4, 5: handleSkip5, 6: handleSkip6,
  };

  // ── Finish ──
  const handleFinish = async () => {
    if (!user) return;
    setFinishLoading(true);
    setFinishError(false);
    const { error } = await supabase
      .from('user_profile')
      .update(buildUpdatePayload())
      .eq('id', user.id);
    if (error) {
      console.error('[Onboarding finish error]', error);
      setFinishError(true);
      setFinishLoading(false);
      return;
    }
    await refreshProfile();
    setFinishLoading(false);
    setScreen(7);
  };

  // ── Layout helpers ──
  const showProgress = screen >= 1 && screen <= 6;
  const showSkip     = screen >= 4 && screen <= 6;

  const MONTHS = [
    ['01','January'],  ['02','February'], ['03','March'],
    ['04','April'],    ['05','May'],      ['06','June'],
    ['07','July'],     ['08','August'],   ['09','September'],
    ['10','October'],  ['11','November'], ['12','December'],
  ] as const;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="mx-auto w-full max-w-lg px-6 py-8 flex-1 flex flex-col">

        {/* ── Progress indicator + Skip ── */}
        {showProgress && (
          <div className="flex items-start gap-3 mb-8">
            <div className="flex-1 min-w-0">
              <ProgressIndicator screen={screen} />
            </div>
            {showSkip && (
              <button
                type="button"
                onClick={skipHandlers[screen]}
                disabled={screen === 6 && finishLoading}
                className={cn(
                  'shrink-0 text-sm transition-colors pt-0.5',
                  screen === 6 && finishLoading
                    ? 'text-muted-foreground/30 cursor-not-allowed'
                    : 'text-muted-foreground/60 hover:text-muted-foreground',
                )}
              >
                Skip
              </button>
            )}
          </div>
        )}

        {/* ════════════════════════════════════
            SCREEN 0 — WELCOME
            ════════════════════════════════════ */}
        {screen === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-10">
            <img src="/LogoMain.png" alt="KWI Within" className="w-[120px]" />
            <div className="space-y-4 max-w-sm">
              <h1 className="text-2xl font-bold">Welcome to KWI Within.</h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                A space to log what your body is doing — energy, cycle, mood,
                symptoms, the things that don't fit anywhere else.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The more you log, the more patterns we can show you. It takes
                about three minutes to get set up.
              </p>
            </div>
            <Button className="w-full max-w-sm" onClick={() => setScreen(1)}>
              Let's start →
            </Button>
          </div>
        )}

        {/* ════════════════════════════════════
            SCREEN 1 — SIGN UP
            ════════════════════════════════════ */}
        {screen === 1 && (
          <div className="flex-1 flex flex-col gap-5">
            <div>
              <h1 className="text-2xl font-bold mb-1">Create your account</h1>
              <p className="text-sm text-muted-foreground">
                We'll keep your data private and yours alone.
              </p>
            </div>

            <div className="space-y-4 flex-1">
              {/* Email */}
              <div>
                <label className="text-sm font-medium">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  disabled={signUpLoading}
                  className={signUpLoading ? inputDisabledCls : inputCls}
                />
                {email.length > 0 && !emailValid && (
                  <p className="text-xs text-destructive mt-1">Enter a valid email address.</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="text-sm font-medium">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={signUpLoading}
                  className={signUpLoading ? inputDisabledCls : inputCls}
                />
                {password.length > 0 && <PasswordReqs password={password} />}
              </div>

              {/* Confirm password */}
              <div>
                <label className="text-sm font-medium">Confirm password</label>
                <input
                  type="password"
                  value={confirmPw}
                  onChange={e => setConfirmPw(e.target.value)}
                  disabled={signUpLoading}
                  className={signUpLoading ? inputDisabledCls : inputCls}
                />
                {confirmPw.length > 0 && confirmPw !== password && (
                  <p className="text-xs text-destructive mt-1">Passwords don't match.</p>
                )}
              </div>

              {/* Name row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">First name</label>
                  <input
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    placeholder="Kui"
                    disabled={signUpLoading}
                    className={signUpLoading ? inputDisabledCls : inputCls}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Last initial</label>
                  <input
                    value={lastInitial}
                    onChange={e => setLastInitial(e.target.value.charAt(0))}
                    maxLength={1}
                    placeholder="N"
                    disabled={signUpLoading}
                    className={signUpLoading ? inputDisabledCls : inputCls}
                  />
                </div>
              </div>

              {/* Date of birth */}
              <div>
                <label className="text-sm font-medium">Date of birth</label>
                <div className="mt-1 flex gap-2">
                  <select
                    value={dobMonth}
                    onChange={e => setDobMonth(e.target.value)}
                    disabled={signUpLoading}
                    className="flex-1 rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                  >
                    {MONTHS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                  <input
                    type="number"
                    value={dobYear}
                    onChange={e => setDobYear(e.target.value)}
                    placeholder="YYYY"
                    min="1900"
                    max={new Date().getFullYear()}
                    disabled={signUpLoading}
                    className="w-24 rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Terms checkbox */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreedToTerms}
                  onChange={e => setAgreedToTerms(e.target.checked)}
                  disabled={signUpLoading}
                  className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer"
                />
                <label htmlFor="terms" className="text-sm text-muted-foreground leading-snug cursor-pointer">
                  I agree to the{' '}
                  <button
                    type="button"
                    onClick={() => toast('Coming soon.')}
                    className="underline text-foreground hover:text-primary"
                  >
                    Terms of Service
                  </button>
                  {' '}and{' '}
                  <button
                    type="button"
                    onClick={() => toast('Coming soon.')}
                    className="underline text-foreground hover:text-primary"
                  >
                    Privacy Policy
                  </button>
                </label>
              </div>

              <p className="text-xs text-muted-foreground">
                Your data stays yours. We will never sell it or share it with
                anyone, ever.
              </p>

              {/* Sign up errors */}
              {signUpError === 'exists' && (
                <p className="text-sm text-destructive/80">
                  An account with this email already exists.{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/signin')}
                    className="underline underline-offset-2 hover:text-destructive"
                  >
                    Sign in instead?
                  </button>
                </p>
              )}
              {signUpError === 'generic' && (
                <p className="text-sm text-destructive/80">
                  Something went wrong, please try again.
                </p>
              )}
            </div>

            <Button
              className="w-full"
              disabled={!signUpValid || signUpLoading}
              onClick={handleSignUp}
            >
              {signUpLoading ? (
                <><Loader2 className="animate-spin" /> Creating your account...</>
              ) : (
                'Continue'
              )}
            </Button>
          </div>
        )}

        {/* ════════════════════════════════════
            SCREEN 2 — CONFIRM SIGN UP (magic link)
            ════════════════════════════════════ */}
        {screen === 2 && (
          <div className="flex-1 flex flex-col items-center justify-center gap-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-8 w-8 text-primary" />
            </div>

            <div className="space-y-3 max-w-sm">
              <h1 className="text-2xl font-bold">Check your email</h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We've sent a confirmation link to{' '}
                <span className="font-medium text-foreground">{email}</span>.
                Click it to verify your account, then come back here.
              </p>
            </div>

            <div className="flex flex-col items-center gap-3 text-sm">
              <button
                type="button"
                onClick={handleResend}
                className="text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
              >
                Didn't get it? Resend link
              </button>
              <button
                type="button"
                onClick={() => setScreen(1)}
                className="text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
              >
                Wrong email? Go back
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════
            SCREEN 3 — ONBOARDING WELCOME
            ════════════════════════════════════ */}
        {screen === 3 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-10">
            <div className="space-y-4 max-w-sm">
              <h1 className="text-2xl font-bold">
                Welcome, {firstName || 'there'}.
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                A few quick questions so we can shape KWI Within around what
                you actually need.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                You can skip any step and update your answers later in Settings.
              </p>
            </div>
            <Button className="w-full max-w-sm" onClick={() => setScreen(4)}>
              Let's go →
            </Button>
          </div>
        )}

        {/* ════════════════════════════════════
            SCREEN 4 — STEP 1: ABOUT YOUR BODY
            ════════════════════════════════════ */}
        {screen === 4 && (
          <div className="flex-1 flex flex-col gap-6">
            <div>
              <h1 className="text-2xl font-bold mb-1">About your body</h1>
              <p className="text-sm text-muted-foreground">
                These shape what you'll see in the app.
              </p>
            </div>

            <div className="space-y-7 flex-1">
              {/* A — Fibroids */}
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

              {/* B — Hormonal treatment */}
              <div>
                <p className="text-sm font-medium mb-2">
                  Are you currently on any hormonal treatment or contraception?
                </p>
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
                    placeholder="Type — e.g. pill, IUD, HRT"
                    className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                )}
              </div>

              {/* C — Diagnosed conditions */}
              <div>
                <p className="text-sm font-medium mb-1">
                  Do you have any diagnosed conditions?
                </p>
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

              {/* D — Perimenopause */}
              <div>
                <p className="text-sm font-medium mb-2">
                  Are you currently in perimenopause, or suspect you are?
                </p>
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

              {/* E — Regular cycle */}
              <div>
                <p className="text-sm font-medium mb-2">
                  Do you have a regular menstrual cycle?
                </p>
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

              {/* F — Joints */}
              <div>
                <p className="text-sm font-medium mb-2">
                  Any known joint or musculoskeletal conditions?
                </p>
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
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setScreen(3)}>
                Back
              </Button>
              <Button className="flex-1" onClick={() => setScreen(5)}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════
            SCREEN 5 — STEP 2: ABOUT YOUR LIFESTYLE
            ════════════════════════════════════ */}
        {screen === 5 && (
          <div className="flex-1 flex flex-col gap-6">
            <div>
              <h1 className="text-2xl font-bold mb-1">About your lifestyle</h1>
              <p className="text-sm text-muted-foreground">
                Helps us see how movement and stress shape your patterns.
              </p>
            </div>

            <div className="space-y-7 flex-1">
              {/* A — Exercise */}
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
                        { value: 'yoga_pilates', label: 'Yoga or Pilates' },
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

              {/* B — Food tracking */}
              <div>
                <p className="text-sm font-medium mb-2">
                  Do you track your food or have dietary considerations?
                </p>
                <OptionPicker
                  value={tracksFood}
                  onChange={setTracksFood}
                  options={[
                    { value: 'yes', label: 'Yes' },
                    { value: 'no',  label: 'No' },
                  ]}
                />
              </div>

              {/* C — Stress */}
              <div>
                <p className="text-sm font-medium mb-2">
                  How would you describe your stress baseline?
                </p>
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
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setScreen(4)}>
                Back
              </Button>
              <Button className="flex-1" onClick={() => setScreen(6)}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════
            SCREEN 6 — STEP 3: WHAT YOU WANT
            ════════════════════════════════════ */}
        {screen === 6 && (
          <div className="flex-1 flex flex-col gap-6">
            <div>
              <h1 className="text-2xl font-bold mb-1">What do you want to understand?</h1>
              <p className="text-sm text-muted-foreground">
                Pick anything that resonates. We'll prioritise these in your dashboard.
              </p>
            </div>

            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-3">Tap any that apply</p>
              <MultiSelect
                selected={goals}
                onChange={setGoals}
                options={[
                  { value: 'energy',           label: 'My energy patterns' },
                  { value: 'cycle',            label: 'My cycle and hormonal shifts' },
                  { value: 'fibroids',         label: 'My fibroid symptoms' },
                  { value: 'mental_emotional', label: 'My mental and emotional state' },
                  { value: 'exercise',         label: "My body's response to exercise" },
                  { value: 'general',          label: "General pattern tracking — I don't know yet" },
                ]}
              />
            </div>

            {finishError && (
              <p className="text-sm text-destructive/80 text-center">
                Something went wrong saving your answers.{' '}
                <button
                  type="button"
                  onClick={handleFinish}
                  className="underline underline-offset-2 hover:text-destructive"
                >
                  Try again?
                </button>
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setScreen(5)} disabled={finishLoading}>
                Back
              </Button>
              <Button className="flex-1" onClick={handleFinish} disabled={finishLoading}>
                {finishLoading ? <><Loader2 className="animate-spin" /> Saving...</> : 'Finish'}
              </Button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════
            SCREEN 7 — CLOSING
            ════════════════════════════════════ */}
        {screen === 7 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-10">
            <div className="space-y-4 max-w-sm">
              <h1 className="text-2xl font-bold">You're set up.</h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your dashboard is ready. We'll only show you what's relevant
                based on what you just told us — you can change any of these
                answers anytime in Settings.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Log when you can. Even partial entries are useful.
              </p>
            </div>
            <Button className="w-full max-w-sm" onClick={() => { setOnboarded(true); navigate('/'); }}>
              Take me to my dashboard →
            </Button>
          </div>
        )}

      </div>
    </div>
  );
};

export default Onboarding;
