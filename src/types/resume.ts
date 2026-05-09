export type Tone = 'professional' | 'creative' | 'technical';

export type ResumeSectionKey =
  | 'personal_info'
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'certifications'
  | 'projects'
  | 'languages'
  | 'custom';

export type TemplateId = 'classic' | 'modern' | 'executive' | 'ats';

export interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
}

export interface SummaryContent {
  rawText: string;
  enhancedText: string;
  useEnhanced: boolean;
}

export interface ExperienceEntry {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  location: string;
  rawBullets: string[];
  enhancedBullets: string[];
  useEnhanced: boolean;
}

export interface EducationEntry {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startYear: number;
  endYear?: number;
  gpa?: string;
  honors?: string;
}

export interface SkillsContent {
  technical: string[];
  soft: string[];
  tools: string[];
  aiSuggested: string[];
}

export interface AtsResult {
  overallScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  sectionScores: {
    summary: number;
    skills: number;
    experience: number;
  };
  recommendations: string[];
}

export interface Resume {
  id: string;
  userId: string;
  title: string;
  templateId: TemplateId;
  jobRole: string;
  status: 'draft' | 'complete' | 'archived';
  atsScore: number;
  isPrimary: boolean;
  updatedAt: string;
  personalInfo: PersonalInfo;
  summary: SummaryContent;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  skills: SkillsContent;
}

export interface TemplateDefinition {
  id: TemplateId;
  name: string;
  category: 'Modern' | 'Classic' | 'Creative' | 'ATS-Optimized';
  accent: string;
  description: string;
}

export interface AiEnhancementResult {
  enhancedContent: string;
  atsKeywords: string[];
  atsScore: number;
  suggestions: string[];
}

export interface Profile {
  id: string;
  fullName: string;
  email: string;
  consentAi: boolean;
  consentStorage: boolean;
  jobRoleTarget?: string;
}
