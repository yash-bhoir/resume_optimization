import { sanitizeUrl, sanitizeHtml } from "./sanitize-html";
import { RESUME_PRINT_CSS } from "./resume-content-css";

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Jake template uses $|$ (LaTeX math pipe) between contact fields, GPA, project stacks, etc. */
export function stripLatexPipeMarkers(text: string): string {
  return text
    .replace(/\$\s*\|\s*\$/g, " | ")
    .replace(/\$\s*\|/g, " | ")
    .replace(/\|\s*\$/g, " | ")
    .replace(/\$\|/g, " | ");
}

function formatInlineLatex(text: string): string {
  let result = stripLatexPipeMarkers(text);

  for (let i = 0; i < 8; i++) {
    const next = result
      .replace(/\\textbf\{([^{}]*)\}/g, "<strong>$1</strong>")
      .replace(/\\textit\{([^{}]*)\}/g, "<em>$1</em>")
      .replace(/\\emph\{([^{}]*)\}/g, "<em>$1</em>");
    if (next === result) break;
    result = next;
  }

  return result
    .replace(/\\href\{([^}]*)\}\{([^}]*)\}/g, (_, url: string, label: string) => {
      const safeUrl = sanitizeUrl(url);
      return `<a href="${escapeHtml(safeUrl)}" rel="noopener noreferrer">${escapeHtml(label)}</a>`;
    })
    .replace(/\\underline\{([^}]*)\}/g, "$1")
    .replace(/\\%/g, "%")
    .replace(/\\scshape/g, "")
    .replace(/\\Huge/g, "")
    .replace(/\\Large/g, "")
    .replace(/\\large/g, "")
    .replace(/\\small/g, "")
    .replace(/\\&/g, "&")
    .replace(/\$[^$]*\$/g, "")
    .replace(/\$/g, "")
    .replace(/\\\\/g, "<br/>")
    .replace(/\\vspace\{[^}]*\}/g, "")
    .replace(/\\[a-zA-Z@]+\*?(\[[^\]]*\])?(\{[^}]*\})?/g, "")
    .replace(/[{}]/g, "")
    .replace(/\s+\|\s+/g, '<span class="pipe-sep"> | </span>')
    .replace(/\s{2,}/g, " ")
    .trim();
}

function extractBraceArgs(text: string, startIndex = 0): string[] {
  const args: string[] = [];
  let i = startIndex;
  while (i < text.length) {
    while (i < text.length && text[i] !== "{") i++;
    if (i >= text.length) break;
    let depth = 1;
    let j = i + 1;
    while (j < text.length && depth > 0) {
      if (text[j] === "{") depth++;
      if (text[j] === "}") depth--;
      j++;
    }
    args.push(text.slice(i + 1, j - 1));
    i = j;
  }
  return args;
}

function extractCommandBlocks(body: string, command: string): string[] {
  const blocks: string[] = [];
  const regex = new RegExp(`\\\\${command}`, "g");
  let match;
  const indices: number[] = [];
  while ((match = regex.exec(body)) !== null) {
    indices.push(match.index);
  }

  for (let i = 0; i < indices.length; i++) {
    const start = indices[i] + command.length + 1;
    const end = i + 1 < indices.length ? indices[i + 1] : body.length;
    blocks.push(body.slice(start, end));
  }
  return blocks;
}

function extractResumeItems(text: string): string[] {
  const items: string[] = [];
  const regex = /\\resumeItem\{/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const start = match.index + "\\resumeItem{".length;
    let depth = 1;
    let j = start;
    while (j < text.length && depth > 0) {
      if (text[j] === "{") depth++;
      if (text[j] === "}") depth--;
      j++;
    }
    items.push(text.slice(start, j - 1));
  }
  return items;
}

function renderHeader(body: string): string {
  const centerMatch = body.match(/\\begin\{center\}([\s\S]*?)\\end\{center\}/i);
  if (!centerMatch) return "";

  const raw = centerMatch[1];
  const parts = raw.split(/\\\\/).map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return "";

  const name = formatInlineLatex(parts[0]);
  const contactParts = parts.slice(1).map((p) => formatInlineLatex(p));
  const contact = contactParts.join('<span class="pipe-sep"> | </span>');

  return `<div class="resume-header" data-latex-block="header">
    <div class="resume-name" data-field="name">${name}</div>
    ${contact ? `<div class="resume-contact" data-field="contact">${contact}</div>` : ""}
  </div>`;
}

function renderSubheadingBlock(block: string): string {
  const args = extractBraceArgs(block);
  if (args.length < 4) return "";

  const [title, rightTop, subtitle, rightBottom] = args;
  const items = extractResumeItems(block);

  let html = `<li class="resume-subheading">`;
  html += `<div class="subheading-row">`;
  html += `<span class="subheading-title" data-field="title">${formatInlineLatex(title)}</span>`;
  html += `<span class="subheading-date" data-field="date">${formatInlineLatex(rightTop)}</span>`;
  html += `</div>`;
  html += `<div class="subheading-row sub">`;
  html += `<span class="subheading-subtitle" data-field="subtitle">${formatInlineLatex(subtitle)}</span>`;
  html += `<span class="subheading-location" data-field="location">${formatInlineLatex(rightBottom)}</span>`;
  html += `</div>`;

  if (items.length) {
    html += '<ul class="resume-item-list">';
    for (const item of items) {
      html += `<li class="resume-item" data-field="item">${formatInlineLatex(item)}</li>`;
    }
    html += "</ul>";
  }
  html += "</li>";
  return html;
}

function renderProjectBlock(block: string): string {
  const args = extractBraceArgs(block);
  if (args.length < 2) return "";

  const items = extractResumeItems(block);
  let html = `<li class="resume-project">`;
  html += `<div class="project-row">`;
  html += `<span class="project-title" data-field="title">${formatInlineLatex(args[0])}</span>`;
  html += `<span class="project-date" data-field="date">${formatInlineLatex(args[1])}</span>`;
  html += `</div>`;

  if (items.length) {
    html += '<ul class="resume-item-list">';
    for (const item of items) {
      html += `<li class="resume-item" data-field="item">${formatInlineLatex(item)}</li>`;
    }
    html += "</ul>";
  }
  html += "</li>";
  return html;
}

function renderSummary(body: string): string {
  const summaryMatch = body.match(/\\small\{([\s\S]*?)\}(?=\s*(?:\\section|$))/);
  const raw = summaryMatch ? summaryMatch[1] : body.trim();
  const text = formatInlineLatex(raw);
  return `<p class="resume-summary" data-field="content">${text}</p>`;
}

function extractBracedContent(text: string, startIndex: number): string {
  let i = startIndex;
  while (i < text.length && text[i] !== "{") i++;
  if (i >= text.length) return "";
  let depth = 1;
  let j = i + 1;
  while (j < text.length && depth > 0) {
    if (text[j] === "{") depth++;
    if (text[j] === "}") depth--;
    j++;
  }
  return text.slice(i + 1, j - 1);
}

function renderSkills(body: string): string {
  const itemIdx = body.indexOf("\\item{");
  const raw =
    itemIdx !== -1
      ? extractBracedContent(body, itemIdx + "\\item".length)
      : body;

  const lines = raw
    .split("\\\\")
    .map((l) => formatInlineLatex(l))
    .filter(Boolean);

  let html = '<div class="resume-skills" data-field="content">';
  for (const line of lines) {
    html += `<div class="skill-line">${line}</div>`;
  }
  html += "</div>";
  return html;
}

function renderSection(title: string, body: string): string {
  const sectionTitle = title.trim();
  let content = "";
  const lower = sectionTitle.toLowerCase();

  if (lower === "summary") {
    content = renderSummary(body);
  } else if (lower.includes("skill")) {
    content = renderSkills(body);
  } else if (body.includes("\\resumeProjectHeading")) {
    const blocks = extractCommandBlocks(body, "resumeProjectHeading");
    content = '<ul class="resume-project-list">';
    for (const block of blocks) {
      content += renderProjectBlock(block);
    }
    content += "</ul>";
  } else if (body.includes("\\resumeSubheading")) {
    const blocks = extractCommandBlocks(body, "resumeSubheading");
    content = '<ul class="resume-subheading-list">';
    for (const block of blocks) {
      const rendered = renderSubheadingBlock(block);
      if (rendered) content += rendered;
    }
    content += "</ul>";
  } else {
    content = `<div class="resume-generic" data-field="content">${formatInlineLatex(body)}</div>`;
  }

  return `<section class="resume-section" data-section="${escapeHtml(sectionTitle)}">
    <h2 class="resume-section-title">${escapeHtml(sectionTitle)}</h2>
    ${content}
  </section>`;
}

export function latexToHtml(latexSource: string): string {
  const contentMatch = latexSource.match(/\\begin\{document\}([\s\S]*?)\\end\{document\}/i);
  const body = contentMatch ? contentMatch[1] : latexSource;

  let html = renderHeader(body);
  const bodyWithoutHeader = body.replace(/\\begin\{center\}[\s\S]*?\\end\{center\}/i, "");
  const sectionParts = bodyWithoutHeader.split(/\\section\{([^}]+)\}/);

  for (let i = 1; i < sectionParts.length; i += 2) {
    html += renderSection(sectionParts[i], sectionParts[i + 1] || "");
  }

  const rawHtml = html || `<pre class="resume-fallback">${escapeHtml(body.slice(0, 5000))}</pre>`;
  return sanitizeHtml(rawHtml);
}

export function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/h2>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function buildExportHtml(latexSource: string, title = "Optimized Resume"): string {
  const resumeHtml = latexToHtml(latexSource);
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>${RESUME_PRINT_CSS}</style>
</head>
<body>${resumeHtml}</body>
</html>`;
}

export function getResumeStyles(): string {
  return RESUME_PRINT_CSS;
}
