import confetti from 'canvas-confetti';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, Gauge, Loader2, Sparkles, ZoomIn, ZoomOut } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AtsWidget } from '../components/builder/AtsWidget';
import { ExperienceEditor } from '../components/builder/ExperienceEditor';
import { SkillsInput } from '../components/builder/SkillsInput';
import { StepRail } from '../components/builder/StepRail';
import { PageTransition } from '../components/layout/PageTransition';
import { ResumePreview } from '../components/resume/ResumePreview';
import { Button } from '../components/ui/Button';
import { FloatingField } from '../components/ui/FloatingField';
import { SegmentedTabs } from '../components/ui/SegmentedTabs';
import { useToast } from '../components/ui/toastContext';
import { templates } from '../data/templates';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { analyzeAts, enhanceResumeContent } from '../lib/ai';
import { exportResumePdf } from '../lib/pdf';
import { useResumeStore } from '../lib/resumeStore';
import type { AtsResult, EducationEntry, Resume, Tone } from '../types/resume';

const stepIds = ['personal', 'summary', 'experience', 'skills', 'education', 'ats'] as const;
type StepId = (typeof stepIds)[number];

const stepLabels: Record<StepId, string> = {
  personal: 'Personal',
  summary: 'Summary',
  experience: 'Experience',
  skills: 'Skills',
  education: 'Education',
  ats: 'ATS',
};

const defaultAts: AtsResult = {
  overallScore: 82,
  matchedKeywords: ['React', 'TypeScript', 'Accessibility'],
  missingKeywords: ['Testing', 'CI/CD'],
  sectionScores: { summary: 80, skills: 86, experience: 78 },
  recommendations: ['Paste a target job description to refine keyword matching.'],
};

const zoomOptions = [
  { label: 'Fit', value: 0.82 },
  { label: '100%', value: 1 },
  { label: '125%', value: 1.25 },
];

export function BuilderPage() {
  const { resumeId } = useParams();
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const previewRef = useRef<HTMLDivElement | null>(null);
  const aiButtonRef = useRef<HTMLButtonElement | null>(null);
  const { resumes, updateResume, setTemplate } = useResumeStore();
  const resume = resumes.find((item) => item.id === resumeId) ?? resumes[0];
  const debouncedResume = useDebouncedValue(resume, 300);
  const [activeStep, setActiveStep] = useState<StepId>('personal');
  const [tone, setTone] = useState<Tone>('professional');
  const [aiLoading, setAiLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [zoom, setZoom] = useState(0.82);
  const [jobDescription, setJobDescription] = useState('');
  const [atsResult, setAtsResult] = useState<AtsResult>(defaultAts);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!resume) navigate('/dashboard');
  }, [navigate, resume]);

  const steps = useMemo(
    () =>
      stepIds.map((id) => ({
        id,
        label: stepLabels[id],
        complete: isStepComplete(resume, id),
      })),
    [resume],
  );

  if (!resume) return null;

  const patchResume = (patch: Partial<Resume>) => updateResume(resume.id, patch);

  const enhanceActiveStep = async () => {
    setAiLoading(true);
    setStreamingText('');
    try {
      const section = activeStep === 'personal' || activeStep === 'ats' ? 'summary' : activeStep;
      const result = await enhanceResumeContent(
        {
          resumeId: resume.id,
          section: section as 'summary' | 'experience' | 'skills' | 'education',
          rawInput: getRawInput(resume, activeStep),
          jobRole: resume.jobRole,
          tone,
        },
        (chunk) => setStreamingText((value) => value + chunk),
      );

      if (activeStep === 'experience') {
        const [first, ...rest] = resume.experience;
        if (first) {
          patchResume({
            experience: [
              {
                ...first,
                enhancedBullets: result.enhancedContent
                  .split(/\n|•|-/)
                  .map((value) => value.trim())
                  .filter(Boolean)
                  .slice(0, 3),
                useEnhanced: true,
              },
              ...rest,
            ],
            atsScore: result.atsScore,
          });
        }
      } else if (activeStep === 'skills') {
        patchResume({
          skills: { ...resume.skills, aiSuggested: Array.from(new Set([...resume.skills.aiSuggested, ...result.atsKeywords])) },
          atsScore: result.atsScore,
        });
      } else {
        patchResume({
          summary: { ...resume.summary, enhancedText: result.enhancedContent, useEnhanced: true },
          atsScore: result.atsScore,
        });
      }

      burstConfetti();
      pushToast('success', 'AI enhancement applied.');
    } catch (error) {
      pushToast('error', error instanceof Error ? error.message : 'AI enhancement failed.');
    } finally {
      setAiLoading(false);
    }
  };

  const runAts = async () => {
    try {
      const result = await analyzeAts(resume, jobDescription);
      setAtsResult(result);
      patchResume({ atsScore: result.overallScore });
      pushToast('success', 'ATS analysis updated.');
    } catch (error) {
      pushToast('error', error instanceof Error ? error.message : 'ATS analysis failed.');
    }
  };

  const exportPdf = async () => {
    setExporting(true);
    try {
      await exportResumePdf(resume);
      pushToast('success', 'PDF export started.');
    } catch (error) {
      pushToast('error', error instanceof Error ? error.message : 'PDF export failed.');
    } finally {
      setExporting(false);
    }
  };

  const burstConfetti = () => {
    const rect = aiButtonRef.current?.getBoundingClientRect();
    confetti({
      particleCount: 80,
      spread: 65,
      scalar: 0.78,
      colors: ['#6366f1', '#14b8a6', '#f59e0b', '#ffffff'],
      origin: rect
        ? {
            x: (rect.left + rect.width / 2) / window.innerWidth,
            y: (rect.top + rect.height / 2) / window.innerHeight,
          }
        : { x: 0.5, y: 0.5 },
    });
  };

  return (
    <PageTransition>
      <div className="mx-auto max-w-[1560px] px-4 py-6 sm:px-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-400">Builder</p>
            <input
              className="mt-1 w-full max-w-xl bg-transparent font-display text-2xl font-extrabold outline-none sm:text-3xl"
              value={resume.title}
              onChange={(event) => patchResume({ title: event.target.value })}
              aria-label="Resume title"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SegmentedTabs<Tone> options={['professional', 'technical', 'creative']} value={tone} onChange={setTone} />
            <Button ref={aiButtonRef} variant="ai" onClick={enhanceActiveStep} loading={aiLoading} icon={<Sparkles className="h-4 w-4" />}>
              {aiLoading ? 'Enhancing...' : 'AI Enhance'}
            </Button>
            <Button variant="secondary" onClick={exportPdf} loading={exporting} icon={<Download className="h-4 w-4" />}>
              Export PDF
            </Button>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[230px_minmax(420px,0.9fr)_minmax(420px,1.1fr)]">
          <div className="xl:block">
            <StepRail steps={steps} activeStep={activeStep} onStepChange={(step) => setActiveStep(step as StepId)} />
          </div>

          <section className="min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, x: 28 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -28 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="surface-card rounded-md p-4 sm:p-5"
              >
                <StepContent
                  activeStep={activeStep}
                  resume={resume}
                  patchResume={patchResume}
                  jobDescription={jobDescription}
                  setJobDescription={setJobDescription}
                  runAts={runAts}
                  atsResult={atsResult}
                  streamingText={streamingText}
                  aiLoading={aiLoading}
                />
              </motion.div>
            </AnimatePresence>
          </section>

          <aside className="min-w-0 space-y-4 xl:sticky xl:top-24 xl:self-start">
            <div className="surface-card rounded-md p-3">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex max-w-full gap-2 overflow-x-auto">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      className={`min-w-24 rounded-sm border p-2 text-left text-xs font-bold transition-all duration-200 ease-expo ${
                        resume.templateId === template.id
                          ? 'border-brand-500 bg-brand-500/15 text-brand-100'
                          : 'border-[color:var(--border)] bg-white/5 text-[color:var(--muted)] hover:text-[color:var(--text)]'
                      }`}
                      onClick={() => setTemplate(resume.id, template.id)}
                    >
                      <span className="mb-2 block h-10 rounded-[3px]" style={{ background: `linear-gradient(135deg, ${template.accent}, #ffffff)` }} />
                      {template.name}
                    </button>
                  ))}
                </div>
                <div className="flex rounded-sm border border-[color:var(--border)] bg-white/5 p-1">
                  {zoomOptions.map((option) => (
                    <button
                      key={option.label}
                      className={`rounded-sm px-2 py-1 text-xs font-bold transition-colors duration-200 ${
                        zoom === option.value ? 'bg-brand-500 text-white' : 'text-[color:var(--muted)] hover:text-[color:var(--text)]'
                      }`}
                      onClick={() => setZoom(option.value)}
                      title={option.label}
                    >
                      {option.value < 1 ? <ZoomOut className="h-4 w-4" /> : option.value > 1 ? <ZoomIn className="h-4 w-4" /> : option.label}
                    </button>
                  ))}
                </div>
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={debouncedResume.templateId}
                  initial={{ opacity: 0.45 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0.3 }}
                  transition={{ duration: 0.3 }}
                >
                  <ResumePreview ref={previewRef} resume={debouncedResume} zoom={zoom} flashKey={debouncedResume.updatedAt} />
                </motion.div>
              </AnimatePresence>
            </div>
          </aside>
        </div>
      </div>
    </PageTransition>
  );
}

function StepContent({
  activeStep,
  resume,
  patchResume,
  jobDescription,
  setJobDescription,
  runAts,
  atsResult,
  streamingText,
  aiLoading,
}: {
  activeStep: StepId;
  resume: Resume;
  patchResume: (patch: Partial<Resume>) => void;
  jobDescription: string;
  setJobDescription: (value: string) => void;
  runAts: () => void;
  atsResult: AtsResult;
  streamingText: string;
  aiLoading: boolean;
}) {
  if (activeStep === 'personal') {
    return (
      <SectionScaffold title="Personal details">
        <div className="grid gap-3 sm:grid-cols-2">
          <FloatingField label="First name" value={resume.personalInfo.firstName} onChange={(event) => patchResume({ personalInfo: { ...resume.personalInfo, firstName: event.target.value } })} />
          <FloatingField label="Last name" value={resume.personalInfo.lastName} onChange={(event) => patchResume({ personalInfo: { ...resume.personalInfo, lastName: event.target.value } })} />
          <FloatingField label="Email" type="email" value={resume.personalInfo.email} onChange={(event) => patchResume({ personalInfo: { ...resume.personalInfo, email: event.target.value } })} />
          <FloatingField label="Phone" value={resume.personalInfo.phone} onChange={(event) => patchResume({ personalInfo: { ...resume.personalInfo, phone: event.target.value } })} />
          <FloatingField label="Location" value={resume.personalInfo.location} onChange={(event) => patchResume({ personalInfo: { ...resume.personalInfo, location: event.target.value } })} />
          <FloatingField label="Target role" value={resume.jobRole} onChange={(event) => patchResume({ jobRole: event.target.value })} />
          <FloatingField label="LinkedIn" value={resume.personalInfo.linkedin ?? ''} onChange={(event) => patchResume({ personalInfo: { ...resume.personalInfo, linkedin: event.target.value } })} />
          <FloatingField label="Portfolio" value={resume.personalInfo.portfolio ?? ''} onChange={(event) => patchResume({ personalInfo: { ...resume.personalInfo, portfolio: event.target.value } })} />
        </div>
      </SectionScaffold>
    );
  }

  if (activeStep === 'summary') {
    return (
      <SectionScaffold title="Professional summary">
        <FloatingField
          multiline
          label="Raw summary"
          value={resume.summary.rawText}
          onChange={(event) => patchResume({ summary: { ...resume.summary, rawText: event.target.value } })}
        />
        <FloatingField
          multiline
          className="mt-3"
          label="Enhanced summary"
          value={aiLoading ? streamingText : resume.summary.enhancedText}
          onChange={(event) => patchResume({ summary: { ...resume.summary, enhancedText: event.target.value } })}
        />
        <label className="mt-3 flex items-center gap-3 rounded-sm border border-[color:var(--border)] bg-white/5 px-3 py-3 text-sm font-semibold">
          <input
            type="checkbox"
            className="h-4 w-4 accent-brand-500"
            checked={resume.summary.useEnhanced}
            onChange={(event) => patchResume({ summary: { ...resume.summary, useEnhanced: event.target.checked } })}
          />
          Use enhanced summary in preview
        </label>
      </SectionScaffold>
    );
  }

  if (activeStep === 'experience') {
    return (
      <SectionScaffold title="Work experience">
        <ExperienceEditor entries={resume.experience} onChange={(experience) => patchResume({ experience })} />
        {aiLoading && streamingText && (
          <div className="mt-4 rounded-sm border border-brand-500/35 bg-brand-500/10 p-4 text-sm leading-6 text-brand-100">
            {streamingText}
            <span className="ml-1 animate-pulse">|</span>
          </div>
        )}
      </SectionScaffold>
    );
  }

  if (activeStep === 'skills') {
    return (
      <SectionScaffold title="Skills">
        <div className="space-y-3">
          <SkillsInput label="Technical" values={resume.skills.technical} onChange={(technical) => patchResume({ skills: { ...resume.skills, technical } })} />
          <SkillsInput label="Tools" values={resume.skills.tools} onChange={(tools) => patchResume({ skills: { ...resume.skills, tools } })} />
          <SkillsInput label="Soft" values={resume.skills.soft} onChange={(soft) => patchResume({ skills: { ...resume.skills, soft } })} />
          <SkillsInput label="AI suggested" values={resume.skills.aiSuggested} onChange={(aiSuggested) => patchResume({ skills: { ...resume.skills, aiSuggested } })} />
        </div>
      </SectionScaffold>
    );
  }

  if (activeStep === 'education') {
    return (
      <SectionScaffold title="Education">
        <EducationEditor
          entries={resume.education}
          onChange={(education) => patchResume({ education })}
        />
      </SectionScaffold>
    );
  }

  return (
    <SectionScaffold title="ATS optimization">
      <FloatingField
        multiline
        label="Target job description"
        value={jobDescription}
        onChange={(event) => setJobDescription(event.target.value)}
      />
      <Button className="mt-3" icon={<Gauge className="h-4 w-4" />} onClick={runAts}>
        Analyze ATS
      </Button>
      <div className="mt-4">
        <AtsWidget result={atsResult} />
      </div>
    </SectionScaffold>
  );
}

function SectionScaffold({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.28 }}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-bold">{title}</h2>
        <Loader2 className="hidden h-4 w-4 text-brand-300 sm:block" />
      </div>
      {children}
    </motion.div>
  );
}

function EducationEditor({ entries, onChange }: { entries: EducationEntry[]; onChange: (entries: EducationEntry[]) => void }) {
  const update = (id: string, patch: Partial<EducationEntry>) => onChange(entries.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)));
  const add = () =>
    onChange([
      ...entries,
      {
        id: crypto.randomUUID?.() ?? `${Date.now()}`,
        institution: '',
        degree: '',
        field: '',
        startYear: new Date().getFullYear(),
      },
    ]);

  return (
    <div className="space-y-4">
      {entries.map((entry) => (
        <div key={entry.id} className="surface-card rounded-md p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <FloatingField label="Institution" value={entry.institution} onChange={(event) => update(entry.id, { institution: event.target.value })} />
            <FloatingField label="Degree" value={entry.degree} onChange={(event) => update(entry.id, { degree: event.target.value })} />
            <FloatingField label="Field" value={entry.field} onChange={(event) => update(entry.id, { field: event.target.value })} />
            <FloatingField label="Start year" type="number" value={entry.startYear} onChange={(event) => update(entry.id, { startYear: Number(event.target.value) })} />
            <FloatingField label="End year" type="number" value={entry.endYear ?? ''} onChange={(event) => update(entry.id, { endYear: Number(event.target.value) })} />
            <FloatingField label="Honors" value={entry.honors ?? ''} onChange={(event) => update(entry.id, { honors: event.target.value })} />
          </div>
        </div>
      ))}
      <Button variant="secondary" onClick={add}>
        Add Education
      </Button>
    </div>
  );
}

function isStepComplete(resume: Resume, step: StepId) {
  switch (step) {
    case 'personal':
      return Boolean(resume.personalInfo.firstName && resume.personalInfo.email);
    case 'summary':
      return Boolean(resume.summary.rawText || resume.summary.enhancedText);
    case 'experience':
      return resume.experience.some((entry) => entry.company && entry.role);
    case 'skills':
      return resume.skills.technical.length + resume.skills.tools.length + resume.skills.soft.length > 0;
    case 'education':
      return resume.education.length > 0;
    case 'ats':
      return resume.atsScore > 0;
    default:
      return false;
  }
}

function getRawInput(resume: Resume, step: StepId): Record<string, unknown> {
  switch (step) {
    case 'experience':
      return { experience: resume.experience };
    case 'skills':
      return { skills: resume.skills };
    case 'education':
      return { education: resume.education };
    default:
      return { summary: resume.summary.rawText, personalInfo: resume.personalInfo };
  }
}
