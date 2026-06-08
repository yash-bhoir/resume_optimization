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
    .replace(/\\href\{([^}]*)\}\{([^}]*)\}/g, '<a href="$1">$2</a>')
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
    <div class="resume-name">${name}</div>
    ${contact ? `<div class="resume-contact">${contact}</div>` : ""}
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

  return html || `<pre class="resume-fallback">${escapeHtml(body.slice(0, 5000))}</pre>`;
}

export function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const RESUME_PRINT_CSS = `
  @page { size: letter; margin: 0.5in; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: "Times New Roman", Times, serif;
    font-size: 10pt;
    line-height: 1.15;
    color: #000;
    padding: 0.45in 0.5in;
    width: 8.5in;
    min-height: 11in;
  }
  .resume-header { text-align: center; margin-bottom: 8pt; }
  .resume-name { font-size: 13.5pt; font-weight: bold; line-height: 1.2; }
  .resume-name strong { font-weight: bold; }
  .resume-contact { font-size: 9pt; margin-top: 3pt; line-height: 1.3; }
  .resume-contact a { color: #000; text-decoration: none; }
  .pipe-sep { padding: 0 2pt; }
  .resume-section { margin-bottom: 6pt; }
  .resume-section-title {
    font-size: 10.5pt;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    border-bottom: 0.75pt solid #000;
    padding-bottom: 1pt;
    margin: 7pt 0 4pt;
  }
  .resume-summary { font-size: 10pt; line-height: 1.35; margin-bottom: 4pt; text-align: left; }
  .resume-summary strong { font-weight: bold; }
  .resume-subheading-list, .resume-project-list { list-style: none; }
  .resume-subheading, .resume-project { margin-bottom: 5pt; }
  .subheading-row, .project-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 10pt;
    font-size: 10pt;
    line-height: 1.2;
  }
  .subheading-title, .project-title { font-weight: bold; flex: 1; }
  .subheading-date, .project-date { font-weight: normal; white-space: nowrap; text-align: right; }
  .subheading-row.sub { margin-top: 1pt; }
  .subheading-subtitle { font-style: italic; flex: 1; font-size: 9.5pt; }
  .subheading-location { font-style: normal; font-size: 9.5pt; white-space: nowrap; text-align: right; }
  .project-title em { font-style: italic; font-weight: normal; }
  .resume-item-list { margin: 2pt 0 2pt 0.12in; padding: 0; list-style: none; }
  .resume-item-list li {
    position: relative;
    padding-left: 9pt;
    margin-bottom: 1.5pt;
    font-size: 9.5pt;
    line-height: 1.3;
    list-style: none;
  }
  .resume-item-list li::before { content: "•"; position: absolute; left: 0; font-size: 9pt; }
  .resume-item-list li strong { font-weight: bold; }
  .resume-skills .skill-line { font-size: 9.5pt; line-height: 1.35; margin-bottom: 1pt; }
  .resume-skills .skill-line strong { font-weight: bold; }
  a { color: #000; text-decoration: none; }
`;

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
