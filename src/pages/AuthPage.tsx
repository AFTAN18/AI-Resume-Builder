import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';
import { AuthForm } from '../components/auth/AuthForm';
import { PageTransition } from '../components/layout/PageTransition';

export function AuthPage({ mode }: { mode: 'login' | 'signup' }) {
  const isSignup = mode === 'signup';

  return (
    <PageTransition>
      <div className="grid min-h-screen bg-[color:var(--surface)] lg:grid-cols-[1.05fr_0.95fr]">
        <section className="auth-mesh relative hidden overflow-hidden lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent,rgba(0,0,0,0.42))]" />
          <div className="relative z-10 flex h-full flex-col justify-between p-12">
            <div className="flex items-center gap-3 text-white">
              <span className="grid h-11 w-11 place-items-center rounded-sm bg-white/15 backdrop-blur">
                <FileText className="h-5 w-5" />
              </span>
              <span className="font-display text-lg font-bold">AI Resume Builder</span>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-xl"
            >
              <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-white/70">
                AI-powered resume studio
              </p>
              <h1 className="font-display text-5xl font-extrabold leading-tight text-white">
                Build resumes with AI polish and privacy controls.
              </h1>
              <p className="mt-5 text-lg leading-8 text-white/76">
                Designed for students, job seekers, and professionals who want a focused resume workflow.
              </p>
            </motion.div>
            <div className="text-sm font-semibold text-white/65">Supabase - Gemini - React - Antigravity</div>
          </div>
        </section>

        <section className="flex items-center justify-center px-4 py-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md rounded-md bg-[color:var(--surface-2)] p-6 shadow-float sm:p-8"
          >
            <div className="mb-8">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-400">
                {isSignup ? 'Create workspace' : 'Welcome back'}
              </p>
              <h2 className="mt-3 font-display text-3xl font-extrabold">{isSignup ? 'Start building' : 'Sign in'}</h2>
            </div>
            <AuthForm mode={mode} />
          </motion.div>
        </section>
      </div>
    </PageTransition>
  );
}
