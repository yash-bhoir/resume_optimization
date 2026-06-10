function htmlToLatexInline(html: string): string {
  return html
    .replace(/<span class="pipe-sep">\s*\|\s*<\/span>/gi, " $|$ ")
    .replace(/<strong>(.*?)<\/strong>/gi, "\\textbf{$1}")
    .replace(/<b>(.*?)<\/b>/gi, "\\textbf{$1}")
    .replace(/<em>(.*?)<\/em>/gi, "\\textit{$1}")
    .replace(/<i>(.*?)<\/i>/gi, "\\textit{$1}")
    .replace(/<u>(.*?)<\/u>/gi, "\\underline{$1}")
    .replace(/<a href="([^"]*)">(.*?)<\/a>/gi, "\\href{$1}{$2}")
    .replace(/<br\s*\/?>/gi, " \\\\ ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/<[^>]+>/g, "")
    .trim();
}

function buildHeaderLatex(header: Element): string {
  const name = htmlToLatexInline(
    header.querySelector('[data-field="name"]')?.innerHTML || ""
  );
  const contact = htmlToLatexInline(
    header.querySelector('[data-field="contact"]')?.innerHTML || ""
  );
  if (!name && !contact) return htmlToLatexInline(header.innerHTML);
  const lines = [name, contact].filter(Boolean).join(" \\\\ ");
  return `\\begin{center}\n${lines}\n\\end{center}`;
}

export function rebuildLatexFromEditableDom(
  container: HTMLElement,
  originalLatex: string
): string {
  const docMatch = originalLatex.match(/([\s\S]*\\begin\{document\})([\s\S]*)(\\end\{document\}[\s\S]*)/i);
  if (!docMatch) return originalLatex;

  const preamble = docMatch[1];
  const footer = docMatch[3];
  let body = docMatch[2];

  const header = container.querySelector(".resume-header");
  if (header) {
    const headerLatex = buildHeaderLatex(header);
    const headerPattern = /(\\begin\{center\}[\s\S]*?\\end\{center\}|\\begin\{tabular\*?\}[\s\S]*?\\end\{tabular\*?\})/i;
    if (headerPattern.test(body)) {
      body = body.replace(headerPattern, headerLatex);
    }
  }

  const sections = container.querySelectorAll(".resume-section");
  sections.forEach((section) => {
    const title = section.getAttribute("data-section") || "";
    const sectionRegex = new RegExp(
      `(\\\\section\\{${escapeRegex(title)}\\})([\\s\\S]*?)(?=\\\\section\\{|$)`,
      "i"
    );

    const subheadings = section.querySelectorAll(".resume-subheading");
    if (subheadings.length > 0) {
      let sectionLatex = "";
      subheadings.forEach((sh) => {
        const t = htmlToLatexInline(sh.querySelector('[data-field="title"]')?.innerHTML || "");
        const d = htmlToLatexInline(sh.querySelector('[data-field="date"]')?.innerHTML || "");
        const st = htmlToLatexInline(sh.querySelector('[data-field="subtitle"]')?.innerHTML || "");
        const loc = htmlToLatexInline(sh.querySelector('[data-field="location"]')?.innerHTML || "");
        sectionLatex += `\n    \\resumeSubheading\n      {${t}}{${d}}\n      {${st}}{${loc}}`;
        const items = sh.querySelectorAll('[data-field="item"]');
        if (items.length) {
          sectionLatex += `\n      \\resumeItemListStart`;
          items.forEach((item) => {
            sectionLatex += `\n        \\resumeItem{${htmlToLatexInline(item.innerHTML)}}`;
          });
          sectionLatex += `\n      \\resumeItemListEnd`;
        }
      });
      sectionLatex = `\n  \\resumeSubHeadingListStart${sectionLatex}\n  \\resumeSubHeadingListEnd\n`;
      body = body.replace(sectionRegex, `$1${sectionLatex}`);
    }

    const projects = section.querySelectorAll(".resume-project");
    if (projects.length > 0) {
      let sectionLatex = `\n    \\resumeSubHeadingListStart`;
      projects.forEach((proj) => {
        const t = htmlToLatexInline(proj.querySelector('[data-field="title"]')?.innerHTML || "");
        const d = htmlToLatexInline(proj.querySelector('[data-field="date"]')?.innerHTML || "");
        sectionLatex += `\n      \\resumeProjectHeading\n          {${t}}{${d}}`;
        const items = proj.querySelectorAll('[data-field="item"]');
        if (items.length) {
          sectionLatex += `\n          \\resumeItemListStart`;
          items.forEach((item) => {
            sectionLatex += `\n            \\resumeItem{${htmlToLatexInline(item.innerHTML)}}`;
          });
          sectionLatex += `\n          \\resumeItemListEnd`;
        }
      });
      sectionLatex += `\n    \\resumeSubHeadingListEnd\n`;
      body = body.replace(sectionRegex, `$1${sectionLatex}`);
    }

    const summary = section.querySelector(".resume-summary");
    if (summary) {
      const content = htmlToLatexInline(summary.innerHTML);
      body = body.replace(sectionRegex, `$1\n  \\small{${content}}\n`);
      return;
    }

    const skills = section.querySelector(".resume-skills");
    if (skills) {
      const lines = Array.from(skills.querySelectorAll(".skill-line"))
        .map((l) => htmlToLatexInline(l.innerHTML))
        .join(" \\\\ ");
      const skillsLatex = ` \\begin{itemize}[leftmargin=0.15in, label={}]\n    \\small{\\item{\n     ${lines}\n    }}\n \\end{itemize}`;
      body = body.replace(sectionRegex, `$1\n${skillsLatex}\n`);
      return;
    }

    const generic = section.querySelector(".resume-generic");
    if (generic) {
      const content = htmlToLatexInline(generic.innerHTML);
      body = body.replace(sectionRegex, `$1\n ${content}\n`);
    }
  });

  return `${preamble}${body}${footer}`;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
