import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

type State = 'request' | 'confirm' | 'new-password' | 'complete';

const VisualPanel = ({ children }: { children: React.ReactNode }) => (
  <div className="relative h-full w-full overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-secondary via-background to-muted" />
    <div className="absolute -top-24 -left-16 h-[28rem] w-[28rem] rounded-full bg-primary/25 blur-3xl" />
    <div className="absolute top-1/3 -right-24 h-[24rem] w-[24rem] rounded-full bg-accent/20 blur-3xl" />
    <div className="absolute -bottom-32 left-1/4 h-[22rem] w-[22rem] rounded-full bg-primary/15 blur-3xl" />
    <div
      className="absolute inset-0 opacity-[0.04] mix-blend-multiply"
      style={{
        backgroundImage: 'radial-gradient(hsl(var(--foreground)) 1px, transparent 1px)',
        backgroundSize: '4px 4px',
      }}
    />
    <div className="relative flex h-full items-center justify-center px-[20px]">
      {children}
    </div>
  </div>
);

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

const ResetPassword = () => {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();

  const [state, setState] = useState<State>('request');

  // STATE 1 — request
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  // STATE 3 — new password
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setState('new-password');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSendReset = async () => {
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError('Enter a valid email address.');
      return;
    }
    setEmailError(null);
    setSending(true);
    const { error } = await resetPassword(trimmed);
    setSending(false);
    if (error) {
      const lower = error.toLowerCase();
      setEmailError(
        lower.includes('not found') || lower.includes('no user')
          ? "Couldn't find that email."
          : 'Something went wrong, please try again.'
      );
    } else {
      setState('confirm');
    }
  };

  const pwValid = (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
  const canSave = pwValid && confirmPw === password;

  const handleSavePassword = async () => {
    if (!canSave) return;
    setSaving(true);
    setSaveError(null);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setSaveError('Something went wrong, please try again.');
      } else {
        setState('complete');
      }
    } catch {
      setState('complete');
    } finally {
      setSaving(false);
    }
  };

  const layout = (content: React.ReactNode) => (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-2">
      <div className="h-36 lg:hidden">
        <VisualPanel>
          <Link to="/" aria-label="KWI Within home" className="flex items-center justify-center h-full w-full">
            <img src="/LogoMain.png" alt="KWI Within" className="max-h-[75%] max-w-[75%] h-auto w-auto drop-shadow-sm" />
          </Link>
        </VisualPanel>
      </div>
      <div className="flex items-center justify-center px-6 py-10 lg:py-16">
        <div className="w-full max-w-sm">
          {content}
        </div>
      </div>
      <div className="relative hidden lg:block">
        <VisualPanel>
          <div className="flex flex-col items-center justify-center h-full w-full">
            <Link to="/" aria-label="KWI Within home">
              <img src="/LogoMain.png" alt="KWI Within" className="max-w-[75%] max-h-[75%] h-auto w-auto drop-shadow-sm" />
            </Link>
            <p className="mt-8 text-xs uppercase tracking-[0.25em] text-muted-foreground">KWI Within</p>
          </div>
        </VisualPanel>
      </div>
    </div>
  );

  if (state === 'request') {
    return layout(
      <>
        <h1 className="font-serif text-4xl font-medium tracking-tight text-foreground">
          Reset your password.
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          Enter your email and we'll send you a link to set a new password.
        </p>
        <div className="mt-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setEmailError(null); }}
              disabled={sending}
              className="h-11"
            />
            {emailError && <p className="text-sm text-destructive/80">{emailError}</p>}
          </div>
          <Button className="w-full h-11" disabled={sending} onClick={handleSendReset}>
            {sending ? <><Loader2 className="animate-spin" /> Sending...</> : 'Send reset link'}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Remembered it?{' '}
            <button type="button" onClick={() => navigate('/signin')} className="text-primary hover:underline underline-offset-4 font-medium">
              Back to sign in
            </button>
          </p>
        </div>
      </>
    );
  }

  if (state === 'confirm') {
    return layout(
      <>
        <h1 className="font-serif text-4xl font-medium tracking-tight text-foreground">
          Check your email.
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          We've sent a password reset link to <span className="text-foreground font-medium">{email}</span>. Click it to set a new password.
        </p>
        <div className="mt-8 space-y-3">
          <p className="text-sm text-muted-foreground">
            Didn't get it?{' '}
            <button
              type="button"
              onClick={() => { setSending(true); resetPassword(email.trim()).finally(() => setSending(false)); }}
              disabled={sending}
              className="text-primary hover:underline underline-offset-4 font-medium disabled:opacity-50"
            >
              {sending ? 'Resending…' : 'Resend link'}
            </button>
          </p>
          <p className="text-sm text-muted-foreground">
            Wrong email?{' '}
            <button type="button" onClick={() => setState('request')} className="text-primary hover:underline underline-offset-4 font-medium">
              Try a different one
            </button>
          </p>
        </div>
      </>
    );
  }

  if (state === 'new-password') {
    return layout(
      <>
        <h1 className="font-serif text-4xl font-medium tracking-tight text-foreground">
          Set your new password.
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          Choose something secure.
        </p>
        <div className="mt-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={saving}
              className="h-11"
            />
            {password.length > 0 && <PasswordReqs password={password} />}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm password</Label>
            <Input
              id="confirm"
              type="password"
              value={confirmPw}
              onChange={e => setConfirmPw(e.target.value)}
              disabled={saving}
              className="h-11"
            />
            {confirmPw.length > 0 && confirmPw !== password && (
              <p className="text-sm text-destructive/80">Passwords don't match.</p>
            )}
          </div>
          {saveError && <p className="text-sm text-destructive/80">{saveError}</p>}
          <Button className="w-full h-11" disabled={!canSave || saving} onClick={handleSavePassword}>
            {saving ? <><Loader2 className="animate-spin" /> Saving...</> : 'Save password'}
          </Button>
        </div>
      </>
    );
  }

  // state === 'complete'
  return layout(
    <>
      <h1 className="font-serif text-4xl font-medium tracking-tight text-foreground">
        Password updated.
      </h1>
      <p className="mt-3 text-base text-muted-foreground">
        You're all set. Sign in with your new password to continue.
      </p>
      <Button className="w-full h-11 mt-8" onClick={() => navigate('/signin')}>
        Go to sign in
      </Button>
    </>
  );
};

export default ResetPassword;
