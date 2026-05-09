import { motion } from 'framer-motion';
import { useMemo } from 'react';
import type { AtsResult } from '../../types/resume';
import { useCountUp } from '../../hooks/useCountUp';

interface AtsWidgetProps {
  result: AtsResult;
}

export function AtsWidget({ result }: AtsWidgetProps) {
  const score = useCountUp(result.overallScore, 850);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = useMemo(() => {
    if (score <= 40) return '#ef4444';
    if (score <= 70) return '#f59e0b';
    return '#22c55e';
  }, [score]);

  return (
    <div className="surface-card rounded-md p-4">
      <div className="flex items-center gap-4">
        <div className="relative h-28 w-28">
          <svg className="-rotate-90" viewBox="0 0 110 110">
            <circle cx="55" cy="55" r={radius} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="10" />
            <motion.circle
              cx="55"
              cy="55"
              r={radius}
              fill="none"
              stroke={color}
              strokeLinecap="round"
              strokeWidth="10"
              strokeDasharray={circumference}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <span className="font-display text-2xl font-extrabold">{score}</span>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-[color:var(--muted)]">ATS score</p>
          <p className="mt-1 text-2xl font-bold">{score >= 80 ? 'Strong match' : score >= 60 ? 'Close match' : 'Needs work'}</p>
          <p className="mt-2 text-sm text-[color:var(--muted)]">{result.recommendations[0]}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <KeywordList title="Matched" tone="green" keywords={result.matchedKeywords} />
        <KeywordList title="Missing" tone="red" keywords={result.missingKeywords} />
      </div>
    </div>
  );
}

function KeywordList({ title, keywords, tone }: { title: string; keywords: string[]; tone: 'green' | 'red' }) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--muted)]">{title}</p>
      <div className="flex flex-wrap gap-2">
        {keywords.length === 0 ? (
          <span className="text-sm text-[color:var(--muted)]">None yet</span>
        ) : (
          keywords.map((keyword, index) => (
            <motion.span
              key={keyword}
              initial={{ opacity: 0, x: tone === 'green' ? -12 : 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.04, duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                tone === 'green' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300'
              }`}
            >
              {keyword}
            </motion.span>
          ))
        )}
      </div>
    </div>
  );
}
