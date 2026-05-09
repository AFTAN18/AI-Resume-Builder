const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/gi,
  /disregard\s+(all\s+)?previous\s+instructions/gi,
  /system\s*:/gi,
  /developer\s*:/gi,
  /assistant\s*:/gi,
  /you\s+are\s+now/gi,
  /act\s+as\s+(a|an)\s+/gi,
  /jailbreak/gi,
  /do\s+not\s+follow/gi,
];

export function sanitizeInput(value: unknown): unknown {
  if (typeof value === 'string') return sanitizeString(value);
  if (Array.isArray(value)) return value.map(sanitizeInput);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [sanitizeString(key), sanitizeInput(item)]));
  }
  return value;
}

export function sanitizeString(value: string) {
  return PROMPT_INJECTION_PATTERNS.reduce(
    (text, pattern) => text.replace(pattern, '[removed]'),
    value,
  ).slice(0, 8000);
}

export function estimateTokens(value: string) {
  return Math.ceil(value.length / 4);
}

export function extractKeywords(text: string, limit = 12) {
  const stopWords = new Set([
    'with',
    'that',
    'from',
    'this',
    'your',
    'will',
    'have',
    'role',
    'work',
    'team',
    'using',
    'and',
    'the',
  ]);
  return Array.from(new Set(text.match(/\b[A-Za-z][A-Za-z.+#-]{2,}\b/g) ?? []))
    .filter((word) => !stopWords.has(word.toLowerCase()) && word.length > 3)
    .slice(0, limit);
}

export function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}
