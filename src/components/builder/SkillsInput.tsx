import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { KeyboardEvent, useState } from 'react';

interface SkillsInputProps {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
}

export function SkillsInput({ label, values, onChange }: SkillsInputProps) {
  const [draft, setDraft] = useState('');

  const commit = () => {
    const next = draft.trim().replace(/,$/, '');
    if (!next || values.some((value) => value.toLowerCase() === next.toLowerCase())) return;
    onChange([...values, next]);
    setDraft('');
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      commit();
    }
    if (event.key === 'Backspace' && !draft && values.length) {
      onChange(values.slice(0, -1));
    }
  };

  return (
    <div className="rounded-sm border border-[color:var(--border)] bg-white/5 p-3">
      <label className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--muted)]">{label}</label>
      <div className="flex flex-wrap gap-2">
        <AnimatePresence initial={false}>
          {values.map((value) => (
            <motion.span
              key={value}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ type: 'spring', stiffness: 430, damping: 28 }}
              className="inline-flex items-center gap-1 rounded-full bg-brand-500/15 px-3 py-1 text-sm font-semibold text-brand-100"
            >
              {value}
              <button
                className="rounded-full p-0.5 text-brand-100/80 hover:bg-white/12 hover:text-white"
                onClick={() => onChange(values.filter((item) => item !== value))}
                aria-label={`Remove ${value}`}
              >
                <X className="h-3 w-3" />
              </button>
            </motion.span>
          ))}
        </AnimatePresence>
        <input
          className="min-w-32 flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-[color:var(--muted)]"
          value={draft}
          onBlur={commit}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Type and press Enter"
        />
      </div>
    </div>
  );
}
