import { normalizeLatexContactUrls } from "./contact-normalize";

export const LATEX_TEMPLATE = `%-------------------------
% Resume in Latex
% Author : Jake Gutierrez
% Based off of: https://github.com/sb2nov/resume
% License : MIT
%------------------------

\\documentclass[letterpaper,11pt]{article}

\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage[english]{babel}
\\usepackage{tabularx}
\\input{glyphtounicode}

\\pagestyle{fancy}
\\fancyhf{}
\\fancyfoot{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}

\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1in}
\\addtolength{\\topmargin}{-.5in}
\\addtolength{\\textheight}{1.0in}

\\urlstyle{same}
\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}

\\titleformat{\\section}{
  \\vspace{-4pt}\\scshape\\raggedright\\large
}{}{0em}{}[\\color{black}\\titlerule \\vspace{-5pt}]

\\pdfgentounicode=1

\\newcommand{\\resumeItem}[1]{
  \\item\\small{{#1 \\vspace{-2pt}}}
}

\\newcommand{\\resumeSubheading}[4]{
  \\vspace{-2pt}\\item
    \\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
      \\textbf{#1} & #2 \\\\
      \\textit{\\small#3} & \\textit{\\small #4} \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeProjectHeading}[2]{
    \\item
    \\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}
      \\small#1 & #2 \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeSubItem}[1]{\\resumeItem{#1}\\vspace{-4pt}}
\\renewcommand\\labelitemii{$\\vcenter{\\hbox{\\tiny$\\bullet$}}$}
\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.15in, label={}]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}

\\begin{document}

{{CONTENT}}

\\end{document}`;

/** Reference structure matching Yash Bhoir resume layout. */
export const JAKE_TEMPLATE_EXAMPLE = `
%----------HEADING (centered: Role - Name, then contact line)----------
\\begin{center}
    \\textbf{\\large Full Stack Developer - Candidate Name} \\\\ \\vspace{1pt}
    \\small +91-XXXXXXXXXX $|$ \\href{mailto:email@example.com}{email@example.com} $|$
    \\href{https://linkedin.com/in/profile}{linkedin.com/in/profile} $|$
    \\href{https://github.com/username}{github.com/username} $|$ City, State
\\end{center}

%-----------SUMMARY (paragraph with \\textbf{} on key terms)-----------
\\section{Summary}
  \\small{Full Stack Developer with \\textbf{3+ years} of experience in \\textbf{Node.js}, \\textbf{React.js}, and \\textbf{MongoDB}. Tailored summary for the target role and company from the job description.}

%-----------EDUCATION-----------
\\section{Education}
  \\resumeSubHeadingListStart
    \\resumeSubheading
      {University Name}{City, Country}
      {Degree Name (e.g. Master of Computer Applications)}{Jan. 2024 -- Jan. 2026}
    \\resumeSubheading
      {University Name}{City, Country}
      {Bachelor Degree $|$ GPA: 8.6 CGPA}{Jan. 2020 -- Jan. 2023}
  \\resumeSubHeadingListEnd

%-----------EXPERIENCE-----------
\\section{Experience}
  \\resumeSubHeadingListStart
    \\resumeSubheading
      {Job Title}{Mar. 2026 -- Present}
      {Company Name}{City, Country}
      \\resumeItemListStart
        \\resumeItem{Led \\textbf{code reviews} and \\textbf{Agile/Scrum} delivery, improving quality by \\textbf{30\\%}}
        \\resumeItem{Built \\textbf{Node.js/Express} APIs and \\textbf{React.js} UIs with measurable impact}
      \\resumeItemListEnd
    \\resumeSubheading
      {Previous Job Title}{Jun. 2023 -- Feb. 2026}
      {Company Name}{City, Country}
      \\resumeItemListStart
        \\resumeItem{Achievement bullet with \\textbf{technologies} and \\textbf{metrics}}
      \\resumeItemListEnd
  \\resumeSubHeadingListEnd

%-----------PROJECTS-----------
\\section{Projects}
    \\resumeSubHeadingListStart
      \\resumeProjectHeading
          {\\textbf{Project Name} $|$ \\emph{React.js, Node.js, Express, MongoDB}}{2025}
          \\resumeItemListStart
            \\resumeItem{Owned \\textbf{full-stack MERN} delivery with \\textbf{REST APIs} and \\textbf{MongoDB} schemas}
          \\resumeItemListEnd
    \\resumeSubHeadingListEnd

%-----------TECHNICAL SKILLS-----------
\\section{Technical Skills}
 \\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{\\item{
     \\textbf{Languages}{: JavaScript, TypeScript, Python} \\\\
     \\textbf{Frontend}{: React.js, Redux, HTML5, CSS3} \\\\
     \\textbf{Backend}{: Node.js, Express.js, RESTful APIs} \\\\
     \\textbf{Databases}{: MongoDB, SQL} \\\\
     \\textbf{Tools}{: Docker, Git, Postman}
    }}
 \\end{itemize}
`;

export const SYSTEM_PROMPT = `You are a professional resume optimizer focused on INCREASING interview selection chances. Output ONLY valid LaTeX body content using the Jake Gutierrez / sb2nov template — exact layout only, no deviations.

PHILOSOPHY:
- Optimization means strengthening ATS match and impact — NOT reducing length or removing content.
- First inventory the ENTIRE resume: every job, bullet, project, education entry, and skill category.
- Never delete jobs, projects, education, or skill categories. You MAY add JD keywords and stronger metrics.
- Two pages is acceptable. Do NOT cut bullets to fit one page.

VISUAL FORMAT (must match reference exactly):
- Header: centered \\textbf{\\large Job Title - Full Name} then contact line with $|$ separators (phone, email, linkedin, github, city).
- Sections: Summary, Education, Experience, Projects, Technical Skills — in that order unless JD requires reorder.
- Use \\textbf{} liberally inside summary and bullets to bold technologies, metrics, and key achievements.
- Education/Experience: line 1 = bold title/institution left, location/dates right; line 2 = italic degree/company left, dates/location right.
- Projects: \\textbf{Project Name} $|$ \\emph{tech stack} on left, year on right.
- Technical Skills: \\textbf{Category}{: skill, list} format with \\\\ line breaks — include ALL categories from original.

STRICT RULES:
- Output ONLY LaTeX. No markdown, no code fences, no explanations.
- MUST use \\begin{center}, \\section{}, \\resumeSubHeadingListStart/End, \\resumeSubheading, \\resumeProjectHeading, \\resumeItem, \\resumeItemListStart/End.
- Preserve ALL jobs, projects, education entries, bullets, and skills from the original resume.`;

export function buildOptimizePrompt(resumeText: string, jobDescription: string): string {
  return `Here is the candidate's raw resume text:
${resumeText}

Here is the job description to optimize for:
${jobDescription}

MANDATORY TEMPLATE — copy this EXACT structure, replacing placeholders with the candidate's real data:
${JAKE_TEMPLATE_EXAMPLE}

STEP 1 — Read the complete resume: count every job, project, education entry, and skill before writing.
STEP 2 — Optimize for selection (not shortening):
1. Extract every keyword, skill, and technology from the job description. Inject them naturally using exact JD phrasing.
2. Rewrite EVERY experience bullet as: [Strong action verb] → [What you did] → [Measurable result]. Each experience bullet MUST include at least one number (100% required — e.g. 30%, 4 developers, 12+ sprints, 50 users).
3. NEVER use first person (I, my, me). NEVER use weak phrases: "responsible for", "worked on", "helped with".
4. Vary verbs — NEVER use the same action verb more than TWICE (2 times). Especially avoid overusing: designed (use architected, built, engineered, planned), managed (use led, oversaw, directed, supervised), automated (use streamlined, systematized).
5. Preserve ALL content from the original resume — reword and strengthen, NEVER remove jobs, projects, bullets, or skills.
6. Two pages is fine. Do NOT compress or delete content to fit one page.
7. Match seniority language of the JD role title.
8. Summary: 2-4 sentences, NO "I am" — start with role title, years, core stack, and 1-2 metrics. Reference target company/role from JD.
9. Reorder sections only if the JD clearly emphasizes skills before experience.
10. Bold key technologies and metrics inside bullets using \\textbf{}.
11. Header MUST be \\textbf{\\large Role Title - Full Name} centered, NOT small caps name only.
12. Technical Skills MUST list every category from the original (Languages, Frontend, Backend, Databases, Tools, etc.) with JD-relevant skills first in each line.
13. Include GPA in Education if present in original resume.

OUTPUT: Return ONLY the LaTeX body content. Follow the template example EXACTLY.`;
}

export function buildPageFitPrompt(
  latexContent: string,
  issue: "overflow" | "underflow",
  jobDescription: string
): string {
  const action =
    issue === "underflow"
      ? "Expand bullets with more JD-aligned detail and metrics where truthful."
      : "Keep all content. Two pages is acceptable — do NOT remove jobs, projects, or bullets.";

  return `Review page layout. ${issue === "underflow" ? "Resume may be sparse." : "Resume may span two pages — that is OK."}

Job description:
${jobDescription}

Current LaTeX body:
${latexContent}

${action}

Return ONLY revised LaTeX body content. Keep the Jake Gutierrez template structure exactly.`;
}

export function buildChangeLogPrompt(
  originalText: string,
  latexSource: string,
  jobDescription: string
): string {
  return `List 5 impactful resume optimization changes as a JSON array of strings.

Original: ${originalText}
Optimized LaTeX: ${latexSource}
Job description: ${jobDescription}

Return ONLY a JSON array of 5 strings.`;
}

export function wrapLatexContent(content: string): string {
  const trimmed = normalizeLatexContactUrls(content.trim());
  if (trimmed.includes("\\documentclass")) {
    return trimmed;
  }
  return LATEX_TEMPLATE.replace("{{CONTENT}}", trimmed);
}

export function extractDocumentContent(latexSource: string): string {
  const match = latexSource.match(/\\begin\{document\}([\s\S]*?)\\end\{document\}/i);
  return match ? match[1].trim() : latexSource.trim();
}

export function sanitizeLatexOutput(raw: string): string {
  let text = raw.trim();
  text = text.replace(/^```(?:latex|tex)?\s*/i, "").replace(/```\s*$/i, "");
  text = text.replace(/^\\begin\{document\}/i, "").replace(/\\end\{document\}\s*$/i, "");
  return text.trim();
}

export function normalizeLatexBody(content: string): string {
  let body = sanitizeLatexOutput(content);

  if (!body.includes("\\begin{center}")) {
    const nameMatch = body.match(/\\textbf\{\\Huge[^}]*\{([^}]+)\}/);
    if (nameMatch) {
      body = `\\begin{center}\n    \\textbf{\\Huge \\scshape ${nameMatch[1]}}\n\\end{center}\n\n` + body;
    }
  }

  body = body.replace(/\\section\s*\{([^}]+)\}/g, (_, title: string) => {
    const normalized = title.trim();
    if (normalized.toLowerCase() === "summary" && !body.includes("\\small{")) {
      return `\\section{${normalized}}`;
    }
    return `\\section{${normalized}}`;
  });

  return body;
}

export function validateLatexStructure(content: string): boolean {
  const required = [
    "\\begin{center}",
    "\\section{",
    "\\resumeSubheading",
    "\\resumeItem",
    "\\section{Technical Skills}",
  ];
  const hasSkillCategories = (content.match(/\\textbf\{[^}]+\}\{:/g) || []).length >= 2;
  return required.every((token) => content.includes(token)) && hasSkillCategories;
}
