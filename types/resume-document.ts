export type OptimizationMode = "preserve" | "template";

export interface ResumeContact {
  name: string;
  title: string;
  phone: string;
  email: string;
  linkedin: string;
  github: string;
  location: string;
}

export interface JobEntry {
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  bullets: string[];
}

export interface EduEntry {
  degree: string;
  institution: string;
  location: string;
  startDate: string;
  endDate: string;
  gpa?: string;
}

export interface ProjectEntry {
  name: string;
  techStack: string;
  date: string;
  bullets: string[];
}

export interface SkillCategory {
  category: string;
  skills: string;
}

export interface ResumeDocument {
  contact: ResumeContact;
  summary: string;
  experience: JobEntry[];
  education: EduEntry[];
  projects: ProjectEntry[];
  skills: SkillCategory[];
  rawPlainText: string;
}

export interface ParseResumeResult {
  rawText: string;
  resumeDocument: ResumeDocument;
  detectedFormat: import("@/types").DetectedFormat;
  originalFileBase64?: string;
  originalTexSource?: string;
  preserveLayoutSupported: boolean;
  preserveLayoutNote?: string;
  scannedWarning?: string;
}
