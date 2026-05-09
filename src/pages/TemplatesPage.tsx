import { AnimatePresence, motion } from 'framer-motion';
import { Eye, Filter, LayoutTemplate } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageTransition } from '../components/layout/PageTransition';
import { ResumePreview } from '../components/resume/ResumePreview';
import { Button } from '../components/ui/Button';
import { templates } from '../data/templates';
import { useResumeStore } from '../lib/resumeStore';
import type { TemplateDefinition } from '../types/resume';

const categories = ['All', 'Modern', 'Classic', 'Creative', 'ATS-Optimized'] as const;
type Category = (typeof categories)[number];

export function TemplatesPage() {
  const navigate = useNavigate();
  const { resumes, setTemplate, createResume } = useResumeStore();
  const activeResume = resumes[0];
  const [category, setCategory] = useState<Category>('All');
  const [selected, setSelected] = useState<TemplateDefinition | null>(null);

  const filtered = useMemo(
    () => (category === 'All' ? templates : templates.filter((template) => template.category === category)),
    [category],
  );

  const applyTemplate = (template: TemplateDefinition) => {
    const resumeId = activeResume?.id ?? createResume();
    setTemplate(resumeId, template.id);
    navigate(`/builder/${resumeId}`);
  };

  return (
    <PageTransition>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-400">Template gallery</p>
            <h1 className="mt-3 font-display text-4xl font-extrabold">Choose a resume system</h1>
          </div>
          <div className="flex max-w-full gap-2 overflow-x-auto rounded-sm border border-[color:var(--border)] bg-white/5 p-1">
            {categories.map((item) => (
              <button
                key={item}
                className="relative whitespace-nowrap rounded-sm px-3 py-2 text-sm font-bold text-[color:var(--muted)] transition-colors duration-200 data-[active=true]:text-white"
                data-active={category === item}
                onClick={() => setCategory(item)}
              >
                {category === item && (
                  <motion.span layoutId="template-tab" className="absolute inset-x-2 bottom-1 h-0.5 rounded-full bg-brand-500" />
                )}
                <span className="relative inline-flex items-center gap-2">
                  {item === 'All' && <Filter className="h-4 w-4" />}
                  {item}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {filtered.map((template) => (
            <motion.article
              key={template.id}
              layoutId={`template-${template.id}`}
              className="group surface-card overflow-hidden rounded-md"
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <button className="relative block w-full overflow-hidden text-left" onClick={() => setSelected(template)}>
                <div className="h-72 origin-center transition-transform duration-300 ease-expo group-hover:scale-105">
                  <TemplateMini accent={template.accent} />
                </div>
                <div className="absolute inset-0 grid place-items-center bg-black/45 opacity-0 transition-opacity duration-200 ease-expo group-hover:opacity-100">
                  <span className="inline-flex items-center gap-2 rounded-sm bg-white px-4 py-2 text-sm font-bold text-slate-950">
                    <Eye className="h-4 w-4" />
                    Use This Template
                  </span>
                </div>
              </button>
              <div className="p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-300">{template.category}</p>
                <h2 className="mt-2 font-display text-xl font-bold">{template.name}</h2>
                <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">{template.description}</p>
                <Button className="mt-4 w-full" icon={<LayoutTemplate className="h-4 w-4" />} onClick={() => applyTemplate(template)}>
                  Use Template
                </Button>
              </div>
            </motion.article>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selected && activeResume && (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
          >
            <motion.div
              layoutId={`template-${selected.id}`}
              className="max-h-[92vh] w-full max-w-5xl overflow-auto rounded-md bg-[color:var(--surface-2)] p-4 shadow-float"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-300">{selected.category}</p>
                  <h2 className="font-display text-2xl font-bold">{selected.name}</h2>
                </div>
                <Button onClick={() => applyTemplate(selected)}>Use This Template</Button>
              </div>
              <ResumePreview resume={{ ...activeResume, templateId: selected.id }} zoom={0.82} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}

function TemplateMini({ accent }: { accent: string }) {
  return (
    <div className="h-full bg-white p-6 text-slate-900">
      <div className="mb-5 h-10 w-2/3 rounded-[3px]" style={{ background: accent }} />
      <div className="space-y-2">
        <div className="h-2 w-full rounded-full bg-slate-200" />
        <div className="h-2 w-5/6 rounded-full bg-slate-200" />
        <div className="h-2 w-4/6 rounded-full bg-slate-200" />
      </div>
      <div className="mt-8 space-y-4">
        {[0, 1, 2].map((item) => (
          <div key={item}>
            <div className="mb-2 h-3 w-1/3 rounded-full" style={{ background: accent }} />
            <div className="space-y-2">
              <div className="h-2 w-full rounded-full bg-slate-200" />
              <div className="h-2 w-11/12 rounded-full bg-slate-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
