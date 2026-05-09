import { AnimatePresence, motion } from 'framer-motion';
import { Eye, EyeOff, Mail, UserRound } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFunctionUrl, supabase } from '../../lib/supabase';
import { validatePassword } from '../../lib/validators';
import { Button } from '../ui/Button';
import { FloatingField } from '../ui/FloatingField';
import { useToast } from '../ui/toastContext';

interface AuthFormProps {
  mode: 'login' | 'signup';
}

export function AuthForm({ mode }: AuthFormProps) {
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [consentAi, setConsentAi] = useState(mode === 'login');
  const [consentStorage, setConsentStorage] = useState(mode === 'login');

  const passwordValidation = validatePassword(password);
  const isSignup = mode === 'signup';

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSignup && !passwordValidation.valid) {
      pushToast('error', passwordValidation.issues[0] ?? 'Password policy not met.');
      return;
    }
    if (isSignup && (!consentAi || !consentStorage)) {
      pushToast('error', 'Consent is required before creating an account.');
      return;
    }

    setStatus('loading');
    try {
      if (supabase) {
        const result = isSignup
          ? await signupWithPolicy({ fullName, email, password, consentAi, consentStorage })
          : await supabase.auth.signInWithPassword({ email, password });
        if (result.error) throw result.error;
        if (!isSignup) await recordLoginAndPromptMfa(pushToast);
      } else {
        await new Promise((resolve) => window.setTimeout(resolve, 800));
      }
      setStatus('success');
      pushToast('success', isSignup ? 'Account ready. Check email confirmation in Supabase mode.' : 'Welcome back.');
      window.setTimeout(() => navigate('/dashboard'), 650);
    } catch (error) {
      setStatus('idle');
      pushToast('error', error instanceof Error ? error.message : 'Authentication failed.');
    }
  };

  const onGoogle = async () => {
    if (!supabase) {
      pushToast('success', 'Demo mode enabled.');
      navigate('/dashboard');
      return;
    }
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) pushToast('error', error.message);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {isSignup && (
        <FloatingField
          label="Full name"
          value={fullName}
          minLength={2}
          required
          onChange={(event) => setFullName(event.target.value)}
        />
      )}
      <FloatingField label="Email" type="email" value={email} required onChange={(event) => setEmail(event.target.value)} />
      <div className="floating-field">
        <input
          placeholder=" "
          type={showPassword ? 'text' : 'password'}
          value={password}
          required
          minLength={isSignup ? 10 : 1}
          onChange={(event) => setPassword(event.target.value)}
        />
        <label>Password</label>
        <button
          type="button"
          className="absolute right-3 top-3 rounded-sm p-1 text-[color:var(--muted)] transition-opacity duration-200 ease-expo hover:text-[color:var(--text)]"
          onClick={() => setShowPassword((value) => !value)}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={showPassword ? 'show' : 'hide'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </motion.span>
          </AnimatePresence>
        </button>
      </div>

      {isSignup && (
        <div className="space-y-2 rounded-sm border border-[color:var(--border)] bg-white/5 p-3 text-sm">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-brand-500"
              checked={consentAi}
              onChange={(event) => setConsentAi(event.target.checked)}
            />
            <span>I consent to AI processing for resume generation and ATS feedback.</span>
          </label>
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-brand-500"
              checked={consentStorage}
              onChange={(event) => setConsentStorage(event.target.checked)}
            />
            <span>I consent to secure resume data storage with edit, export, and delete controls.</span>
          </label>
        </div>
      )}

      {isSignup && password && !passwordValidation.valid && (
        <p className="text-sm text-amber-300">{passwordValidation.issues[0]}</p>
      )}

      <div className="flex justify-center">
        <button
          type="submit"
          className={`auth-submit gradient-cta inline-flex h-12 items-center justify-center rounded-sm font-bold text-white ${
            status === 'idle' ? 'w-full' : 'w-12 rounded-full'
          }`}
          disabled={status !== 'idle'}
        >
          {status === 'loading' && <span className="spinner" />}
          {status === 'success' && (
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
              <path className="draw-check" d="M5 13l4 4L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          {status === 'idle' && (isSignup ? 'Create account' : 'Sign in')}
        </button>
      </div>

      <motion.div
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.06 } },
        }}
        className="grid gap-3 pt-2"
      >
        <motion.div variants={{ hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } }}>
          <Button type="button" variant="secondary" className="w-full" icon={<Mail className="h-4 w-4" />} onClick={onGoogle}>
            Continue with Google
          </Button>
        </motion.div>
        <motion.div variants={{ hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } }}>
          <Button type="button" variant="ghost" className="w-full" icon={<UserRound className="h-4 w-4" />} onClick={() => navigate(isSignup ? '/login' : '/signup')}>
            {isSignup ? 'Already have an account' : 'Create a new account'}
          </Button>
        </motion.div>
        {!isSignup && (
          <motion.div variants={{ hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } }}>
            <Button type="button" variant="ghost" className="w-full" onClick={() => resetPassword(email, pushToast)}>
              Reset password
            </Button>
          </motion.div>
        )}
      </motion.div>
    </form>
  );
}

async function resetPassword(email: string, pushToast: (type: 'success' | 'error', message: string) => void) {
  if (!email) {
    pushToast('error', 'Enter your email first.');
    return;
  }
  if (!supabase) {
    pushToast('success', 'Demo mode: password reset email simulated.');
    return;
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/login`,
  });
  if (error) pushToast('error', error.message);
  else pushToast('success', 'Password reset email sent.');
}

async function recordLoginAndPromptMfa(pushToast: (type: 'success' | 'error', message: string) => void) {
  if (!supabase) return;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: profile } = await supabase
    .from('profiles')
    .select('login_count,mfa_prompted_at')
    .eq('id', user.id)
    .maybeSingle();

  const nextLoginCount = Number(profile?.login_count ?? 0) + 1;
  const shouldPrompt = nextLoginCount >= 3 && !profile?.mfa_prompted_at;

  await supabase
    .from('profiles')
    .update({
      login_count: nextLoginCount,
      mfa_prompted_at: shouldPrompt ? new Date().toISOString() : profile?.mfa_prompted_at,
    })
    .eq('id', user.id);

  if (shouldPrompt) {
    pushToast('success', 'For extra security, enroll TOTP MFA from Supabase account security.');
  }
}

async function signupWithPolicy(input: {
  fullName: string;
  email: string;
  password: string;
  consentAi: boolean;
  consentStorage: boolean;
}) {
  const endpoint = getFunctionUrl('auth/signup');
  if (!endpoint) return { error: new Error('Auth endpoint is not configured.') };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | { error?: { message?: string } }
      | null;
    return { error: new Error(body?.error?.message ?? `Signup failed with ${response.status}`) };
  }

  return { error: null };
}
