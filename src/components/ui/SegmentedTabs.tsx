import { motion } from 'framer-motion';

interface SegmentedTabsProps<T extends string> {
  options: T[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedTabs<T extends string>({ options, value, onChange }: SegmentedTabsProps<T>) {
  return (
    <div className="inline-flex rounded-sm border border-[color:var(--border)] bg-white/5 p-1">
      {options.map((option) => (
        <button
          key={option}
          className="relative rounded-sm px-3 py-2 text-sm font-semibold text-[color:var(--muted)] transition-colors duration-200 ease-expo data-[active=true]:text-white"
          data-active={value === option}
          onClick={() => onChange(option)}
        >
          {value === option && (
            <motion.span
              layoutId="segmented-active"
              className="absolute inset-0 rounded-sm bg-brand-500"
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            />
          )}
          <span className="relative">{option}</span>
        </button>
      ))}
    </div>
  );
}
