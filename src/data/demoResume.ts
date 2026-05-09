import type { Profile, Resume } from '../types/resume';

export const demoProfile: Profile = {
  id: 'demo-user',
  fullName: 'Champ',
  email: 'champ@example.com',
  consentAi: true,
  consentStorage: true,
  jobRoleTarget: 'Frontend Engineer',
};

export const demoResume: Resume = {
  id: 'demo-resume',
  userId: demoProfile.id,
  title: 'Frontend Engineer Resume',
  templateId: 'modern',
  jobRole: 'Frontend Engineer',
  status: 'draft',
  atsScore: 82,
  isPrimary: true,
  updatedAt: new Date().toISOString(),
  personalInfo: {
    firstName: 'Champ',
    lastName: '',
    email: 'champ@example.com',
    phone: '+91 98765 43210',
    location: 'Chennai, India',
    linkedin: 'linkedin.com/in/champ',
    github: 'github.com/champ',
    portfolio: 'champ.dev',
  },
  summary: {
    rawText:
      'Frontend engineer focused on React, TypeScript, accessible interfaces, and performance-minded product experiences.',
    enhancedText:
      'Frontend Engineer specializing in React, TypeScript, accessibility, and high-performance product interfaces, with a strong record of turning complex workflows into polished user experiences.',
    useEnhanced: true,
  },
  experience: [
    {
      id: 'exp-1',
      company: 'NovaLabs',
      role: 'Frontend Developer Intern',
      startDate: '2025-01',
      endDate: '2025-06',
      current: false,
      location: 'Remote',
      rawBullets: [
        'Built dashboard components with React and Tailwind.',
        'Improved Lighthouse performance score.',
      ],
      enhancedBullets: [
        'Built reusable React and Tailwind dashboard components that reduced delivery time for new analytics views.',
        'Improved Lighthouse performance from 78 to 94 by optimizing bundle loading, image delivery, and rendering paths.',
      ],
      useEnhanced: true,
    },
  ],
  education: [
    {
      id: 'edu-1',
      institution: 'State University',
      degree: 'B.Tech.',
      field: 'Computer Science and Engineering',
      startYear: 2022,
      endYear: 2026,
      honors: 'Dean\'s List',
    },
  ],
  skills: {
    technical: ['React', 'TypeScript', 'Supabase', 'PostgreSQL'],
    soft: ['Communication', 'Ownership', 'Collaboration'],
    tools: ['Vite', 'Tailwind CSS', 'Framer Motion', 'Gemini'],
    aiSuggested: ['ATS Optimization', 'Accessibility', 'Performance'],
  },
};
