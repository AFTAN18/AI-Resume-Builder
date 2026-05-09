import { AnimatePresence, motion } from 'framer-motion';
import { Download, RotateCcw, ShieldCheck, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { PageTransition } from '../components/layout/PageTransition';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/toastContext';
import { supabase } from '../lib/supabase';
import { useResumeStore } from '../lib/resumeStore';

export function SettingsPage() {
  const { profile, resumes, resetDemoData } = useResumeStore();
  const { pushToast } = useToast();
  const [consentAi, setConsentAi] = useState(profile.consentAi);
  const [consentStorage, setConsentStorage] = useState(profile.consentStorage);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!confirmOpen) {
      setProgress(0);
      return;
    }
    const started = performance.now();
    const tick = (time: number) => {
      const value = Math.min(((time - started) / 2600) * 100, 100);
      setProgress(value);
      if (value < 100) requestAnimationFrame(tick);
    };
    const frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [confirmOpen]);

  const downloadData = async () => {
    let exportPayload: unknown = { profile, resumes, exportedAt: new Date().toISOString() };

    if (supabase) {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const baseUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '');
      if (baseUrl && session?.access_token) {
        const response = await fetch(`${baseUrl}/functions/v1/user/data`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
          },
        });
        if (!response.ok) throw new Error(`Data export failed with ${response.status}`);
        const json = (await response.json()) as { success: true; data: unknown };
        exportPayload = json.data;
      }
    }

    const payload = JSON.stringify(exportPayload, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'ai-resume-builder-data.json';
    anchor.click();
    URL.revokeObjectURL(url);
    pushToast('success', 'Data export downloaded.');
  };

  const deleteAccount = async () => {
    if (supabase) {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const baseUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '');
      if (baseUrl && session?.access_token) {
        const response = await fetch(`${baseUrl}/functions/v1/user/data`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
          },
        });
        if (!response.ok && response.status !== 204) throw new Error(`Deletion failed with ${response.status}`);
      }
    }
    resetDemoData();
    setConfirmOpen(false);
    pushToast('success', 'Local workspace reset. Supabase mode calls GDPR deletion.');
  };

  return (
    <PageTransition>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-400">Settings & privacy</p>
          <h1 className="mt-3 font-display text-4xl font-extrabold">Data controls</h1>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
          <section className="surface-card rounded-md p-5">
            <div className="mb-5 flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-brand-300" />
              <h2 className="font-display text-2xl font-bold">Consent</h2>
            </div>
            <div className="space-y-4">
              <ConsentToggle label="AI processing" checked={consentAi} onChange={setConsentAi} />
              <ConsentToggle label="Resume data storage" checked={consentStorage} onChange={setConsentStorage} />
            </div>
          </section>

          <section className="surface-card rounded-md p-5">
            <h2 className="font-display text-2xl font-bold">Manage data</h2>
            <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
              Export a portable JSON copy, or remove your account and stored files through the Supabase Edge Function.
            </p>
            <div className="mt-5 grid gap-3">
              <Button variant="secondary" icon={<Download className="h-4 w-4" />} onClick={downloadData}>
                Download My Data
              </Button>
              <Button variant="secondary" icon={<RotateCcw className="h-4 w-4" />} onClick={resetDemoData}>
                Restore Demo Data
              </Button>
              <Button variant="danger" icon={<Trash2 className="h-4 w-4" />} onClick={() => setConfirmOpen(true)}>
                Delete My Account
              </Button>
            </div>
          </section>
        </div>
      </div>

      <AnimatePresence>
        {confirmOpen && (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-md rounded-md bg-[color:var(--surface-2)] p-6 shadow-float"
            >
              <h2 className="font-display text-2xl font-bold">Confirm deletion</h2>
              <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
                This removes profile, resumes, sections, exports, AI audit rows, rate limits, and storage files.
              </p>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                <motion.div className="h-full bg-red-500" animate={{ width: `${progress}%` }} />
              </div>
              <div className="mt-5 flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
                  Cancel
                </Button>
                <Button variant="danger" disabled={progress < 100} onClick={deleteAccount}>
                  Delete
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}

function ConsentToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button
      className="flex w-full items-center justify-between rounded-sm border border-[color:var(--border)] bg-white/5 p-4 text-left"
      onClick={() => onChange(!checked)}
    >
      <span className="font-semibold">{label}</span>
      <span className={`relative h-7 w-12 rounded-full transition-colors duration-300 ${checked ? 'bg-brand-500' : 'bg-white/15'}`}>
        <motion.span
          className="absolute top-1 h-5 w-5 rounded-full bg-white shadow"
          animate={{ left: checked ? 24 : 4 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        />
      </span>
    </button>
  );
}
