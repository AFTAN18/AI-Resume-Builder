import type { TemplateDefinition } from '../types/resume';

export const templates: TemplateDefinition[] = [
  {
    id: 'classic',
    name: 'Classic',
    category: 'Classic',
    accent: '#1f2937',
    description: 'Dense, readable, recruiter-friendly layout with conservative spacing.',
  },
  {
    id: 'modern',
    name: 'Modern',
    category: 'Modern',
    accent: '#6366f1',
    description: 'Balanced visual hierarchy for product, design, and technology roles.',
  },
  {
    id: 'executive',
    name: 'Executive',
    category: 'Creative',
    accent: '#0f766e',
    description: 'Polished editorial pacing for senior leadership resumes.',
  },
  {
    id: 'ats',
    name: 'ATS Focus',
    category: 'ATS-Optimized',
    accent: '#475569',
    description: 'Single-column structure optimized for parser accuracy.',
  },
];
