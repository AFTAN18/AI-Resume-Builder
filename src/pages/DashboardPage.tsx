import { motion } from 'framer-motion';
import { Download, FilePlus2, Gauge, MoreHorizontal, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageTransition } from '../components/layout/PageTransition';
import { Button } from '../components/ui/Button';
import { useCountUp } from '../hooks/useCountUp';
import { useResumeStore } from '../lib/resumeStore';

export function DashboardPage() {
  const navigate = useNavigate();
  const { profile, resumes, createResume } = useResumeStore();
  const [typedName, setTypedName] = useState('');
  const firstName = profile.fullName.split(' ')[0] ?? profile.fullName;
  const averageScore = Math.round(resumes.reduce((sum, resume) => sum + resume.atsScore, 0) / Math.max(resumes.length, 1));
  const countResumes = useCountUp(resumes.length);
  const countScore = useCountUp(averageScore);
  const countDownloads = useCountUp(12);

  useEffect(() => {
    setTypedName('');
    let index = 0;
    const interval = window.setInterval(() => {
      setTypedName(firstName.slice(0, index + 1));
      index += 1;
      if (index >= firstName.length) window.clearInterval(interval);
    }, 58);
    return () => window.clearInterval(interval);
  }, [firstName]);

  const stats = useMemo(
    () => [
      { label: 'Resumes', value: countResumes, icon: FilePlus2 },
      { label: 'ATS average', value: countScore, suffix: '%', icon: Gauge },
      { label: 'Downloads', value: countDownloads, icon: Download },
    ],
    [countDownloads, countResumes, countScore],
  );

  const handleCreate = () => {
    const id = createResume();
    navigate(`/builder/${id}`);
  };

  return (
    <PageTransition>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <section className="mb-8 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-400">Dashboard</p>
            <h1 className="mt-3 font-display text-4xl font-extrabold leading-tight sm:text-5xl">
              Hello, <span className="type-cursor pr-1">{typedName}</span>
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-[color:var(--muted)]">
              Pick up a draft, tune keywords, or create a targeted resume for your next role.
            </p>
          </div>
          <div className="surface-card grid grid-cols-3 gap-3 rounded-md p-4">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-sm bg-white/5 p-3">
                <stat.icon className="mb-3 h-5 w-5 text-brand-300" />
                <p className="font-display text-2xl font-extrabold">
                  {stat.value}
                  {stat.suffix}
                </p>
                <p className="text-xs font-semibold text-[color:var(--muted)]">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-bold">Your resumes</h2>
          <motion.div layoutId="create-resume">
            <Button icon={<Sparkles className="h-4 w-4" />} onClick={handleCreate}>
              Create New Resume
            </Button>
          </motion.div>
        </div>

        <motion.div
          variants={{ show: { transition: { staggerChildren: 0.08 } } }}
          initial="hidden"
          animate="show"
          className="columns-1 gap-4 md:columns-2 xl:columns-3"
        >
          {resumes.map((resume, index) => (
            <motion.article
              key={resume.id}
              variants={{
                hidden: { opacity: 0, y: 24 },
                show: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="surface-card mb-4 break-inside-avoid rounded-md p-5 transition-all duration-200 ease-expo hover:-translate-y-1 hover:shadow-float"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-300">{resume.templateId}</p>
                  <h3 className="mt-2 font-display text-xl font-bold">{resume.title}</h3>
                  <p className="mt-2 text-sm text-[color:var(--muted)]">{resume.jobRole || 'No target role set'}</p>
                </div>
                <Button variant="ghost" className="h-9 w-9 px-0" aria-label="More">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/8">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-brand-500 to-emerald-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${resume.atsScore}%` }}
                  transition={{ delay: index * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
              <div className="mt-5 flex items-center justify-between">
                <span className="text-sm font-semibold text-[color:var(--muted)]">ATS {resume.atsScore}%</span>
                <Button variant="secondary" onClick={() => navigate(`/builder/${resume.id}`)}>
                  Open
                </Button>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </PageTransition>
  );
}
