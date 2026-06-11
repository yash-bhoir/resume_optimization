import { ensureHttpsUrl } from "./contact-normalize";
import type { ResumeDocument } from "@/types/resume-document";

function esc(value: unknown): string {
  const s = value == null ? "" : String(value);
  return s.replace(/\\/g, "\\textbackslash{}").replace(/%/g, "\\%").replace(/&/g, "\\&");
}

function contactLine(doc: ResumeDocument): string {
  const c = doc.contact;
  const parts: string[] = [];
  if (c.phone) parts.push(esc(c.phone));
  if (c.email) parts.push(`\\href{mailto:${c.email}}{${esc(c.email)}}`);
  if (c.linkedin) {
    const url = ensureHttpsUrl(c.linkedin);
    parts.push(`\\href{${url}}{${esc(url)}}`);
  }
  if (c.github) {
    const url = ensureHttpsUrl(c.github);
    parts.push(`\\href{${url}}{${esc(url)}}`);
  }
  if (c.location) parts.push(esc(c.location));
  return parts.join(" $|$ ");
}

export function renderDocumentToJakeLatex(doc: ResumeDocument): string {
  const c = doc.contact;
  const headerTitle = c.title && c.name ? `${esc(c.title)} - ${esc(c.name)}` : esc(c.name || c.title || "Candidate");

  let body = `\\begin{center}\n    \\textbf{\\large ${headerTitle}} \\\\ \\vspace{1pt}\n    \\small ${contactLine(doc)}\n\\end{center}\n`;

  if (doc.summary) {
    body += `\n\\section{Summary}\n  \\small{${esc(doc.summary)}}\n`;
  }

  if (doc.education.length) {
    body += `\n\\section{Education}\n  \\resumeSubHeadingListStart\n`;
    for (const edu of doc.education) {
      const degree = edu.gpa ? `${esc(edu.degree)} $|$ GPA: ${esc(edu.gpa)}` : esc(edu.degree);
      body += `    \\resumeSubheading\n      {${esc(edu.institution)}}{${esc(edu.location)}}\n      {${degree}}{${esc(edu.startDate)} -- ${esc(edu.endDate)}}\n`;
    }
    body += `  \\resumeSubHeadingListEnd\n`;
  }

  if (doc.experience.length) {
    body += `\n\\section{Experience}\n  \\resumeSubHeadingListStart\n`;
    for (const job of doc.experience) {
      body += `    \\resumeSubheading\n      {${esc(job.title)}}{${esc(job.startDate)} -- ${esc(job.endDate)}}\n      {${esc(job.company)}}{${esc(job.location)}}\n      \\resumeItemListStart\n`;
      for (const bullet of job.bullets) {
        body += `        \\resumeItem{${esc(bullet)}}\n`;
      }
      body += `      \\resumeItemListEnd\n`;
    }
    body += `  \\resumeSubHeadingListEnd\n`;
  }

  if (doc.projects.length) {
    body += `\n\\section{Projects}\n    \\resumeSubHeadingListStart\n`;
    for (const p of doc.projects) {
      const heading = p.techStack
        ? `\\textbf{${esc(p.name)}} $|$ \\emph{${esc(p.techStack)}}`
        : `\\textbf{${esc(p.name)}}`;
      body += `      \\resumeProjectHeading\n          {${heading}}{${esc(p.date)}}\n          \\resumeItemListStart\n`;
      for (const bullet of p.bullets) {
        body += `            \\resumeItem{${esc(bullet)}}\n`;
      }
      body += `          \\resumeItemListEnd\n`;
    }
    body += `    \\resumeSubHeadingListEnd\n`;
  }

  if (doc.skills.length) {
    body += `\n\\section{Technical Skills}\n \\begin{itemize}[leftmargin=0.15in, label={}]\n    \\small{\\item{\n`;
    body += doc.skills.map((s) => `     \\textbf{${esc(s.category)}}{: ${esc(s.skills)}} \\\\`).join("\n");
    body += `\n    }}\n \\end{itemize}\n`;
  }

  return body;
}
