import type {
  EduEntry,
  JobEntry,
  ProjectEntry,
  ResumeContact,
  ResumeDocument,
  SkillCategory,
} from "@/types/resume-document";
import { isLatexSource } from "./resume-text";
import { extractBullets } from "./metric-validator";

const SECTION_HEADERS =
  /^(summary|professional summary|experience|work experience|employment|education|projects|technical skills|skills|certifications)$/i;

const DATE_PATTERN =
  /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[.\s]*\d{4}\b|\b\d{1,2}\/\d{4}\b|\b\d{4}\s*[-–—]\s*(?:\d{4}|present)\b/i;

function emptyContact(): ResumeContact {
  return { name: "", title: "", phone: "", email: "", linkedin: "", github: "", location: "" };
}

export function documentToPlainText(doc: ResumeDocument): string {
  const parts: string[] = [];
  const c = doc.contact;
  if (c.name || c.title) parts.push(`${c.title} ${c.name}`.trim());
  const contactLine = [c.phone, c.email, c.linkedin, c.github, c.location].filter(Boolean).join(" | ");
  if (contactLine) parts.push(contactLine);
  if (doc.summary) {
    parts.push("Summary");
    parts.push(doc.summary);
  }
  if (doc.experience.length) {
    parts.push("Experience");
    for (const job of doc.experience) {
      parts.push(`${job.title} at ${job.company}`);
      parts.push(`${job.startDate} - ${job.endDate} | ${job.location}`);
      parts.push(...job.bullets);
    }
  }
  if (doc.education.length) {
    parts.push("Education");
    for (const edu of doc.education) {
      parts.push(`${edu.degree} — ${edu.institution}`);
      parts.push(`${edu.startDate} - ${edu.endDate}`);
    }
  }
  if (doc.projects.length) {
    parts.push("Projects");
    for (const p of doc.projects) {
      parts.push(`${p.name} | ${p.techStack}`);
      parts.push(...p.bullets);
    }
  }
  if (doc.skills.length) {
    parts.push("Technical Skills");
    for (const s of doc.skills) {
      parts.push(`${s.category}: ${s.skills}`);
    }
  }
  return parts.join("\n").trim() || doc.rawPlainText;
}

function extractContactFromText(text: string): ResumeContact {
  const contact = emptyContact();
  const lines = text.split(/\n/).map((l) => l.trim()).filter(Boolean);
  const header = lines.slice(0, 8).join("\n");

  const email = header.match(/[\w.+-]+@[\w.-]+\.\w+/);
  if (email) contact.email = email[0];

  const phone = header.match(/\+?\d[\d\s.-]{8,}\d/);
  if (phone) contact.phone = phone[0].trim();

  const linkedin = header.match(/linkedin\.com\/in\/[\w-]+/i);
  if (linkedin) contact.linkedin = linkedin[0];

  const github = header.match(/github\.com\/[\w-]+/i);
  if (github) contact.github = github[0];

  if (lines[0] && !lines[0].includes("@") && lines[0].length < 80) {
    const nameLine = lines[0];
    if (/developer|engineer|lead|manager|analyst|designer/i.test(nameLine)) {
      const dash = nameLine.split(/\s[-–—]\s/);
      if (dash.length >= 2) {
        contact.title = dash[0].trim();
        contact.name = dash.slice(1).join(" - ").trim();
      } else {
        contact.name = nameLine;
      }
    } else {
      contact.name = nameLine;
    }
  }

  const locMatch = header.match(
    /\b(?:Mumbai|Delhi|Bangalore|Bengaluru|Hyderabad|Pune|Chennai|Kolkata|India|Maharashtra)[^|\n]*/i
  );
  if (locMatch) contact.location = locMatch[0].trim();

  return contact;
}

function detectSection(line: string): string | null {
  const cleaned = line.replace(/[^\w\s]/g, "").trim();
  if (SECTION_HEADERS.test(cleaned)) return cleaned.toLowerCase();
  return null;
}

export function parsePlainTextToDocument(rawText: string): ResumeDocument {
  const lines = rawText.split(/\n/).map((l) => l.trim());
  const contact = extractContactFromText(rawText);

  let currentSection = "header";
  const summaryLines: string[] = [];
  const experience: JobEntry[] = [];
  const education: EduEntry[] = [];
  const projects: ProjectEntry[] = [];
  const skills: SkillCategory[] = [];

  let currentJob: JobEntry | null = null;
  let currentProject: ProjectEntry | null = null;
  let currentEdu: EduEntry | null = null;

  const bullets = extractBullets(rawText, false);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    const section = detectSection(line);
    if (section) {
      currentSection = section;
      if (currentJob) {
        experience.push(currentJob);
        currentJob = null;
      }
      if (currentProject) {
        projects.push(currentProject);
        currentProject = null;
      }
      if (currentEdu) {
        education.push(currentEdu);
        currentEdu = null;
      }
      continue;
    }

    if (currentSection === "header" || currentSection.includes("summary")) {
      if (currentSection.includes("summary") && line.length > 20 && !SECTION_HEADERS.test(line)) {
        summaryLines.push(line);
      }
      continue;
    }

    if (currentSection.includes("experience") || currentSection.includes("employment")) {
      if (DATE_PATTERN.test(line) && !currentJob) {
        currentJob = {
          title: lines[i - 1] || "Role",
          company: lines[i - 2] || "Company",
          location: "",
          startDate: line,
          endDate: "",
          bullets: [],
        };
      } else if (bullets.includes(line) || (line.length > 40 && /^[A-Z]/.test(line))) {
        if (!currentJob) {
          currentJob = { title: "Role", company: "Company", location: "", startDate: "", endDate: "", bullets: [] };
        }
        currentJob.bullets.push(line);
      }
      continue;
    }

    if (currentSection.includes("education")) {
      if (DATE_PATTERN.test(line)) {
        if (currentEdu) education.push(currentEdu);
        currentEdu = {
          degree: lines[i - 1] || "Degree",
          institution: lines[i - 2] || "Institution",
          location: "",
          startDate: line,
          endDate: "",
        };
      }
      continue;
    }

    if (currentSection.includes("project")) {
      if (line.length > 10 && line.length < 120 && !DATE_PATTERN.test(line)) {
        if (currentProject) projects.push(currentProject);
        const [name, stack] = line.split(/\s*[|–—]\s*/);
        currentProject = {
          name: name?.trim() || line,
          techStack: stack?.trim() || "",
          date: "",
          bullets: [],
        };
      } else if (bullets.includes(line) || line.length > 40) {
        if (!currentProject) {
          currentProject = { name: "Project", techStack: "", date: "", bullets: [] };
        }
        currentProject.bullets.push(line);
      }
      continue;
    }

    if (currentSection.includes("skill")) {
      const catMatch = line.match(/^([^:]+):\s*(.+)$/);
      if (catMatch) {
        skills.push({ category: catMatch[1].trim(), skills: catMatch[2].trim() });
      } else if (line.length > 3) {
        skills.push({ category: "Skills", skills: line });
      }
    }
  }

  if (currentJob) experience.push(currentJob);
  if (currentProject) projects.push(currentProject);
  if (currentEdu) education.push(currentEdu);

  if (!summaryLines.length) {
    const summaryMatch = rawText.match(/summary[\s\S]{0,600}/i);
    if (summaryMatch) {
      const chunk = summaryMatch[0].replace(/^summary\s*/i, "").trim();
      const firstPara = chunk.split(/\n\n/)[0]?.replace(/\n/g, " ").trim();
      if (firstPara && firstPara.length > 30) summaryLines.push(firstPara);
    }
  }

  return {
    contact,
    summary: summaryLines.join(" ").trim(),
    experience,
    education,
    projects,
    skills,
    rawPlainText: rawText,
  };
}

export function parseLatexToDocument(latex: string): ResumeDocument {
  const plain = latex
    .replace(/\\textbf\{([^{}]*)\}/g, "$1")
    .replace(/\\textit\{([^{}]*)\}/g, "$1")
    .replace(/\\emph\{([^{}]*)\}/g, "$1")
    .replace(/\\href\{[^}]*\}\{([^}]*)\}/g, "$1")
    .replace(/\\resumeItem\{([^}]*)\}/g, "• $1")
    .replace(/\\section\{([^}]*)\}/g, "\n$1\n")
    .replace(/[{}]/g, "")
    .replace(/\\\w+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const doc = parsePlainTextToDocument(plain);
  doc.rawPlainText = plain;

  const experience: JobEntry[] = [];
  const expSection = latex.match(/\\section\{Experience\}([\s\S]*?)(?=\\section\{|$)/i);
  if (expSection) {
    const items = extractBullets(expSection[1], true);
    const subheadings = expSection[1].match(/\\resumeSubheading/g)?.length || 1;
    const perJob = Math.ceil(items.length / Math.max(subheadings, 1));
    for (let j = 0; j < subheadings; j++) {
      experience.push({
        title: "Role",
        company: "Company",
        location: "",
        startDate: "",
        endDate: "",
        bullets: items.slice(j * perJob, (j + 1) * perJob),
      });
    }
  }

  const summaryMatch = latex.match(/\\section\{Summary\}[\s\S]*?\\small\{([^}]*)\}/i);
  const skillsSection = latex.match(/\\section\{Technical Skills\}([\s\S]*?)(?=\\section|\\end\{document\})/i);
  const skills: SkillCategory[] = [];
  if (skillsSection) {
    const cats = skillsSection[1].matchAll(/\\textbf\{([^}]+)\}\{:\s*([^}]+)\}/g);
    for (const m of cats) {
      skills.push({ category: m[1], skills: m[2].replace(/\\\\/g, ", ").trim() });
    }
  }

  return {
    ...doc,
    summary: summaryMatch?.[1]?.replace(/\\textbf\{([^}]*)\}/g, "$1").trim() || doc.summary,
    experience: experience.length ? experience : doc.experience,
    skills: skills.length ? skills : doc.skills,
    rawPlainText: plain,
  };
}

export function parseTextToDocument(text: string, isLatex?: boolean): ResumeDocument {
  if (isLatex ?? isLatexSource(text)) {
    return parseLatexToDocument(text);
  }
  return parsePlainTextToDocument(text);
}

export function parseOptimizedDocumentJson(raw: string): ResumeDocument | null {
  try {
    let cleaned = raw.trim();
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
    const parsed = JSON.parse(cleaned) as ResumeDocument;
    if (!parsed || typeof parsed !== "object") return null;
    if (!parsed.rawPlainText) parsed.rawPlainText = documentToPlainText(parsed);
    return parsed;
  } catch {
    return null;
  }
}

export function validateDocument(doc: ResumeDocument): boolean {
  return (
    doc.rawPlainText.length >= 20 ||
    doc.experience.length > 0 ||
    doc.summary.length > 20
  );
}
