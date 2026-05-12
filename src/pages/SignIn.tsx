import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const VisualPanel = ({ children }: { children: React.ReactNode }) => (
  <div className="relative h-full w-full overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-secondary via-background to-muted" />
    <div className="absolute -top-24 -left-16 h-[28rem] w-[28rem] rounded-full bg-primary/25 blur-3xl" />
    <div className="absolute top-1/3 -right-24 h-[24rem] w-[24rem] rounded-full bg-accent/20 blur-3xl" />
    <div className="absolute -bottom-32 left-1/4 h-[22rem] w-[22rem] rounded-full bg-primary/15 blur-3xl" />
    <div
      className="absolute inset-0 opacity-[0.04] mix-blend-multiply"
      style={{
        backgroundImage:
          'radial-gradient(hsl(var(--foreground)) 1px, transparent 1px)',
        backgroundSize: '4px 4px',
      }}
    />
    <div className="relative flex h-full items-center justify-center px-[20px]">
      {children}
    </div>
  </div>
);

const SignIn = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const next: typeof errors = {};
    if (!email.trim()) next.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = 'Email looks wrong';
    if (!password) next.password = 'Password is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    console.log('Sign in:', { email, password });
    setTimeout(() => {
      setLoading(false);
      console.log('Signed in (stub)');
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-2">
      {/* Mobile banner — logo on coloured background */}
      <div className="h-36 lg:hidden">
        <VisualPanel>
          <Link to="/" aria-label="KWI Within home" className="flex items-center justify-center h-full w-full">
            <img
              src="/LogoMain.png"
              alt="KWI Within"
              className="max-h-[75%] max-w-[75%] h-auto w-auto drop-shadow-sm"
            />
          </Link>
        </VisualPanel>
      </div>

      {/* Form column */}
      <div className="flex items-center justify-center px-6 py-10 lg:py-16">
        <div className="w-full max-w-sm">
          <h1 className="font-serif text-4xl font-medium tracking-tight text-foreground">
            Welcome back.
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            Sign in to pick up where you left off.
          </p>

          <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!errors.email}
                className="h-11"
              />
              {errors.email && (
                <p className="text-sm text-destructive/80">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={!!errors.password}
                className="h-11"
              />
              {errors.password && (
                <p className="text-sm text-destructive/80">{errors.password}</p>
              )}
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => console.log('Forgot password clicked')}
                  className="text-sm text-primary hover:underline underline-offset-4"
                >
                  Forgot password?
                </button>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full h-11">
              {loading ? (
                <>
                  <Loader2 className="animate-spin" />
                  Signing you in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              New here?{' '}
              <button
                type="button"
                onClick={() => navigate('/onboarding')}
                className="text-primary hover:underline underline-offset-4 font-medium"
              >
                Create an account →
              </button>
            </p>
          </form>
        </div>
      </div>

      {/* Visual column — logo prominent */}
      <div className="relative hidden lg:block">
        <VisualPanel>
          <div className="flex flex-col items-center justify-center h-full w-full">
            <Link to="/" aria-label="KWI Within home">
              <img
                src="/LogoMain.png"
                alt="KWI Within"
                className="max-w-[75%] max-h-[75%] h-auto w-auto drop-shadow-sm"
              />
            </Link>
            <p className="mt-8 text-xs uppercase tracking-[0.25em] text-muted-foreground">
              KWI Within
            </p>
          </div>
        </VisualPanel>
      </div>
    </div>
  );
};

export default SignIn;
