import type { AiEnhancementResult, AtsResult, Resume, Tone } from '../types/resume';
import { getFunctionUrl, hasSupabaseConfig, supabase } from './supabase';

interface EnhanceInput {
  resumeId: string;
  section: 'summary' | 'experience' | 'skills' | 'education';
  rawInput: Record<string, unknown>;
  jobRole?: string;
  tone?: Tone;
}

const fallbackKeywords = ['React', 'TypeScript', 'Accessibility', 'Performance', 'ATS', 'Supabase'];

function localEnhancement(input: EnhanceInput): AiEnhancementResult {
  const source = JSON.stringify(input.rawInput)
    .replace(/[{}[\]"]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const role = input.jobRole || 'target role';
  const tone = input.tone ?? 'professional';

  return {
    enhancedContent:
      input.section === 'experience'
        ? `Delivered measurable ${role} outcomes by combining ${source || 'cross-functional execution'} with clear ownership, quality standards, and ${tone} communication.`
        : `Results-focused ${role} candidate with strengths in ${source || 'modern product delivery'}, communication, and continuous improvement.`,
    atsKeywords: fallbackKeywords,
    atsScore: 84,
    suggestions: [
      'Add numeric impact where possible.',
      'Mirror important job description keywords naturally.',
      'Keep bullets action-led and outcome-focused.',
    ],
  };
}

export async function enhanceResumeContent(
  input: EnhanceInput,
  onChunk?: (chunk: string) => void,
): Promise<AiEnhancementResult> {
  if (!hasSupabaseConfig || !supabase) {
    const fallback = localEnhancement(input);
    await streamText(fallback.enhancedContent, onChunk);
    return fallback;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const endpoint = getFunctionUrl('resume/generate');

  if (!endpoint || !session?.access_token) {
    const fallback = localEnhancement(input);
    await streamText(fallback.enhancedContent, onChunk);
    return fallback;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok || !response.body) {
    throw new Error(`AI request failed with ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let final: AiEnhancementResult | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split('\n\n');
    buffer = events.pop() ?? '';

    for (const event of events) {
      const dataLine = event
        .split('\n')
        .find((line) => line.startsWith('data:'))
        ?.replace(/^data:\s*/, '');
      if (!dataLine) continue;
      const payload = JSON.parse(dataLine) as { type: 'chunk' | 'complete'; chunk?: string; data?: AiEnhancementResult };
      if (payload.type === 'chunk' && payload.chunk) onChunk?.(payload.chunk);
      if (payload.type === 'complete' && payload.data) final = payload.data;
    }
  }

  if (!final) throw new Error('AI stream ended without a completion payload');
  return final;
}

export async function analyzeAts(resume: Resume, jobDescription: string): Promise<AtsResult> {
  if (!hasSupabaseConfig || !supabase) return localAtsScore(resume, jobDescription);

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const endpoint = getFunctionUrl('resume/ats-score');

  if (!endpoint || !session?.access_token) return localAtsScore(resume, jobDescription);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ resumeId: resume.id, jobDescription }),
  });

  if (!response.ok) throw new Error(`ATS request failed with ${response.status}`);
  const json = (await response.json()) as { success: true; data: AtsResult };
  return json.data;
}

function localAtsScore(resume: Resume, jobDescription: string): AtsResult {
  const normalizedDescription = normalize(jobDescription);
  const keywords = Array.from(
    new Set(
      (jobDescription.match(/\b[A-Za-z][A-Za-z.+#-]{2,}\b/g) ?? [])
        .filter((word) => word.length > 3)
        .slice(0, 18),
    ),
  );
  const resumeText = normalize(
    [
      resume.summary.useEnhanced ? resume.summary.enhancedText : resume.summary.rawText,
      resume.experience.flatMap((entry) => (entry.useEnhanced ? entry.enhancedBullets : entry.rawBullets)).join(' '),
      Object.values(resume.skills).flat().join(' '),
    ].join(' '),
  );
  const matchedKeywords = keywords.filter((keyword) => resumeText.includes(normalize(keyword)));
  const missingKeywords = keywords.filter((keyword) => !matchedKeywords.includes(keyword)).slice(0, 8);
  const score = keywords.length
    ? Math.min(100, Math.round((matchedKeywords.length / keywords.length) * 100) + 16)
    : resume.atsScore;

  return {
    overallScore: Math.max(38, score),
    matchedKeywords,
    missingKeywords,
    sectionScores: {
      summary: score,
      skills: Math.min(100, score + 8),
      experience: Math.max(20, score - 4),
    },
    recommendations: [
      normalizedDescription
        ? 'Add two role-specific keywords to your summary and experience sections.'
        : 'Paste a job description to receive targeted keyword feedback.',
      'Keep keyword usage natural and supported by real experience.',
    ],
  };
}

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

async function streamText(text: string, onChunk?: (chunk: string) => void) {
  if (!onChunk) return;
  for (const char of text) {
    onChunk(char);
    await new Promise((resolve) => window.setTimeout(resolve, 8));
  }
}
