import { forwardRef } from 'react';
import { templates } from '../../data/templates';
import type { Resume } from '../../types/resume';
import { cn } from '../../lib/cn';

interface ResumePreviewProps {
  resume: Resume;
  zoom?: number;
  flashKey?: string | number;
}

export const ResumePreview = forwardRef<HTMLDivElement, ResumePreviewProps>(
  ({ resume, zoom = 1, flashKey }, ref) => {
    const template = templates.find((item) => item.id === resume.templateId) ?? templates[0];
    const summary = resume.summary.useEnhanced ? resume.summary.enhancedText : resume.summary.rawText;
    const compact = resume.templateId === 'ats';

    return (
      <div className="overflow-auto rounded-sm border border-[color:var(--border)] bg-black/20 p-4">
        <div
          className="origin-top transition-transform duration-300 ease-expo"
          style={{ transform: `scale(${zoom})`, width: `${100 / zoom}%` }}
        >
          <div
            key={flashKey}
            ref={ref}
            className={cn(
              'paper-texture soft-flash mx-auto min-h-[1050px] w-full max-w-[760px] rounded-[2px] p-10 text-slate-900 shadow-float',
              compact && 'p-8',
            )}
          >
            <header
              className={cn(
                'border-b pb-5',
                resume.templateId === 'modern' ? 'grid gap-4 sm:grid-cols-[1.3fr_0.7fr]' : '',
              )}
              style={{ borderColor: template.accent }}
            >
              <div>
                <h1 className="font-display text-4xl font-extrabold tracking-normal text-slate-950">
                  {resume.personalInfo.firstName} {resume.personalInfo.lastName}
                </h1>
                <p className="mt-2 text-base font-semibold" style={{ color: template.accent }}>
                  {resume.jobRole || resume.title}
                </p>
              </div>
              <div className="mt-3 space-y-1 text-sm text-slate-600 sm:mt-0 sm:text-right">
                <p>{resume.personalInfo.email}</p>
                <p>{resume.personalInfo.phone}</p>
                <p>{resume.personalInfo.location}</p>
                <p>{[resume.personalInfo.linkedin, resume.personalInfo.github, resume.personalInfo.portfolio].filter(Boolean).join(' | ')}</p>
              </div>
            </header>

            <ResumeSection title="Summary" accent={template.accent}>
              <p className="text-sm leading-6 text-slate-700">{summary}</p>
            </ResumeSection>

            <ResumeSection title="Experience" accent={template.accent}>
              <div className="space-y-5">
                {resume.experience.map((entry) => {
                  const bullets = entry.useEnhanced ? entry.enhancedBullets : entry.rawBullets;
                  return (
                    <article key={entry.id}>
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <div>
                          <h3 className="text-base font-bold text-slate-950">{entry.role}</h3>
                          <p className="text-sm font-semibold text-slate-700">{entry.company}</p>
                        </div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                          {entry.startDate} - {entry.current ? 'Present' : entry.endDate || 'Present'}
                        </p>
                      </div>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-700">
                        {bullets.map((bullet, index) => (
                          <li key={`${entry.id}-${index}`}>{bullet}</li>
                        ))}
                      </ul>
                    </article>
                  );
                })}
              </div>
            </ResumeSection>

            <div className={cn('grid gap-8', compact ? '' : 'md:grid-cols-[0.9fr_1.1fr]')}>
              <ResumeSection title="Skills" accent={template.accent}>
                <SkillGroup label="Technical" skills={resume.skills.technical} />
                <SkillGroup label="Tools" skills={resume.skills.tools} />
                <SkillGroup label="Soft" skills={resume.skills.soft} />
                {resume.skills.aiSuggested.length > 0 && <SkillGroup label="Targeted" skills={resume.skills.aiSuggested} />}
              </ResumeSection>

              <ResumeSection title="Education" accent={template.accent}>
                <div className="space-y-4">
                  {resume.education.map((entry) => (
                    <article key={entry.id}>
                      <h3 className="font-bold text-slate-950">{entry.institution}</h3>
                      <p className="text-sm text-slate-700">
                        {entry.degree}, {entry.field}
                      </p>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                        {entry.startYear} - {entry.endYear ?? 'Present'}
                      </p>
                      {entry.honors && <p className="mt-1 text-sm text-slate-600">{entry.honors}</p>}
                    </article>
                  ))}
                </div>
              </ResumeSection>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

ResumePreview.displayName = 'ResumePreview';

function ResumeSection({ title, accent, children }: { title: string; accent: string; children: React.ReactNode }) {
  return (
    <section className="mt-7">
      <h2 className="mb-3 flex items-center gap-3 font-display text-sm font-extrabold uppercase tracking-[0.16em] text-slate-950">
        <span className="h-2 w-2 rounded-full" style={{ background: accent }} />
        {title}
      </h2>
      {children}
    </section>
  );
}

function SkillGroup({ label, skills }: { label: string; skills: string[] }) {
  if (!skills.length) return null;
  return (
    <div className="mb-3">
      <p className="mb-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="text-sm leading-6 text-slate-700">{skills.join(' · ')}</p>
    </div>
  );
}
