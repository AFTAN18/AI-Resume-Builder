import { AnimatePresence, Reorder, motion } from 'framer-motion';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { FloatingField } from '../ui/FloatingField';
import type { ExperienceEntry } from '../../types/resume';

interface ExperienceEditorProps {
  entries: ExperienceEntry[];
  onChange: (entries: ExperienceEntry[]) => void;
}

const createEntry = (): ExperienceEntry => ({
  id: crypto.randomUUID?.() ?? `${Date.now()}`,
  company: '',
  role: '',
  startDate: '',
  endDate: '',
  current: false,
  location: '',
  rawBullets: [''],
  enhancedBullets: [],
  useEnhanced: false,
});

export function ExperienceEditor({ entries, onChange }: ExperienceEditorProps) {
  const updateEntry = (id: string, patch: Partial<ExperienceEntry>) => {
    onChange(entries.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)));
  };

  return (
    <div className="space-y-4">
      <Reorder.Group axis="y" values={entries} onReorder={onChange} className="space-y-4">
        <AnimatePresence initial={false}>
          {entries.map((entry) => (
            <Reorder.Item key={entry.id} value={entry} as="div">
              <motion.article
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="surface-card rounded-md p-4"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-[color:var(--muted)]">
                    <GripVertical className="h-4 w-4" />
                    Experience
                  </div>
                  <Button
                    variant="ghost"
                    className="h-9 w-9 px-0 text-red-300"
                    onClick={() => onChange(entries.filter((item) => item.id !== entry.id))}
                    aria-label="Delete experience"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FloatingField label="Company" value={entry.company} onChange={(event) => updateEntry(entry.id, { company: event.target.value })} />
                  <FloatingField label="Role" value={entry.role} onChange={(event) => updateEntry(entry.id, { role: event.target.value })} />
                  <FloatingField label="Start date" type="month" value={entry.startDate} onChange={(event) => updateEntry(entry.id, { startDate: event.target.value })} />
                  <FloatingField label="End date" type="month" value={entry.endDate} disabled={entry.current} onChange={(event) => updateEntry(entry.id, { endDate: event.target.value })} />
                  <FloatingField label="Location" value={entry.location} onChange={(event) => updateEntry(entry.id, { location: event.target.value })} />
                  <label className="flex items-center gap-3 rounded-sm border border-[color:var(--border)] bg-white/5 px-3 py-3 text-sm font-semibold">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-brand-500"
                      checked={entry.current}
                      onChange={(event) => updateEntry(entry.id, { current: event.target.checked })}
                    />
                    I currently work here
                  </label>
                </div>
                <FloatingField
                  multiline
                  className="mt-3"
                  label="Impact bullets"
                  value={entry.rawBullets.join('\n')}
                  onChange={(event) => updateEntry(entry.id, { rawBullets: event.target.value.split('\n') })}
                />
              </motion.article>
            </Reorder.Item>
          ))}
        </AnimatePresence>
      </Reorder.Group>
      <Button variant="secondary" icon={<Plus className="h-4 w-4" />} onClick={() => onChange([...entries, createEntry()])}>
        Add Experience
      </Button>
    </div>
  );
}
