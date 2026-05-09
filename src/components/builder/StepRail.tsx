import { Check } from 'lucide-react';
import { motion } from 'framer-motion';

interface Step {
  id: string;
  label: string;
  complete: boolean;
}

interface StepRailProps {
  steps: Step[];
  activeStep: string;
  onStepChange: (step: string) => void;
}

export function StepRail({ steps, activeStep, onStepChange }: StepRailProps) {
  const activeIndex = Math.max(
    0,
    steps.findIndex((step) => step.id === activeStep),
  );
  const progress = steps.length <= 1 ? 0 : activeIndex / (steps.length - 1);

  return (
    <aside className="surface-card sticky top-24 rounded-md p-4">
      <div className="relative">
        <svg className="absolute left-4 top-5 h-[calc(100%-2.5rem)] w-1" preserveAspectRatio="none">
          <line x1="2" x2="2" y1="0" y2="100%" stroke="rgba(255,255,255,0.14)" strokeWidth="3" />
          <motion.line
            x1="2"
            x2="2"
            y1="0"
            y2="100%"
            stroke="#6366f1"
            strokeWidth="3"
            initial={false}
            animate={{ pathLength: progress }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          />
        </svg>
        <div className="space-y-3">
          {steps.map((step) => {
            const active = step.id === activeStep;
            return (
              <button
                key={step.id}
                className="relative flex w-full items-center gap-3 rounded-sm px-1 py-2 text-left transition-colors duration-200 ease-expo hover:bg-white/6"
                onClick={() => onStepChange(step.id)}
              >
                <span
                  className={`relative z-10 grid h-8 w-8 place-items-center rounded-full border text-xs font-bold ${
                    active
                      ? 'progress-pulse border-brand-500 bg-brand-500 text-white'
                      : step.complete
                        ? 'border-emerald-400 bg-emerald-500 text-white'
                        : 'border-[color:var(--border)] bg-[color:var(--card)] text-[color:var(--muted)]'
                  }`}
                >
                  {step.complete ? <Check className="draw-check h-4 w-4" /> : steps.indexOf(step) + 1}
                </span>
                <span className={active ? 'font-bold text-white' : 'font-semibold text-[color:var(--muted)]'}>{step.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
