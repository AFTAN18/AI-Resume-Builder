import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { demoProfile, demoResume } from '../data/demoResume';
import type { Profile, Resume, TemplateId } from '../types/resume';

interface ResumeState {
  profile: Profile;
  resumes: Resume[];
  upsertResume: (resume: Resume) => void;
  updateResume: (resumeId: string, patch: Partial<Resume>) => void;
  deleteResume: (resumeId: string) => void;
  createResume: () => string;
  setTemplate: (resumeId: string, templateId: TemplateId) => void;
  resetDemoData: () => void;
}

const createId = () => crypto.randomUUID?.() ?? `resume-${Date.now()}`;

export const useResumeStore = create<ResumeState>()(
  persist(
    (set, get) => ({
      profile: demoProfile,
      resumes: [demoResume],
      upsertResume: (resume) =>
        set((state) => ({
          resumes: state.resumes.some((item) => item.id === resume.id)
            ? state.resumes.map((item) => (item.id === resume.id ? resume : item))
            : [resume, ...state.resumes],
        })),
      updateResume: (resumeId, patch) =>
        set((state) => ({
          resumes: state.resumes.map((resume) =>
            resume.id === resumeId
              ? { ...resume, ...patch, updatedAt: new Date().toISOString() }
              : resume,
          ),
        })),
      deleteResume: (resumeId) =>
        set((state) => ({ resumes: state.resumes.filter((resume) => resume.id !== resumeId) })),
      createResume: () => {
        const id = createId();
        const profile = get().profile;
        const resume: Resume = {
          ...demoResume,
          id,
          userId: profile.id,
          title: 'Untitled Resume',
          templateId: 'classic',
          jobRole: profile.jobRoleTarget ?? '',
          isPrimary: false,
          updatedAt: new Date().toISOString(),
          personalInfo: {
            ...demoResume.personalInfo,
            firstName: profile.fullName.split(' ')[0] ?? '',
            lastName: profile.fullName.split(' ').slice(1).join(' '),
            email: profile.email,
          },
        };
        set((state) => ({ resumes: [resume, ...state.resumes] }));
        return id;
      },
      setTemplate: (resumeId, templateId) =>
        set((state) => ({
          resumes: state.resumes.map((resume) =>
            resume.id === resumeId ? { ...resume, templateId, updatedAt: new Date().toISOString() } : resume,
          ),
        })),
      resetDemoData: () => set({ profile: demoProfile, resumes: [demoResume] }),
    }),
    {
      name: 'ai-resume-builder-state-v5',
      partialize: (state) => ({ profile: state.profile, resumes: state.resumes }),
    },
  ),
);
