import { stripLatexInline, resumeToPlainText } from "./resume-text";

const METRIC_PATTERN =
  /\b\d+[\s–-]\d+\s*%|\b\d+\s*%|\b\d+\+|%\s*\d+|\b\d{1,4}\s*(?:users|clients|customers|teams|squads|sprints|projects|releases|hrs|hours|devices|transactions|videos|developers|engineers|products|apis|endpoints|components|departments|members|monthly|daily)\b|\b(?:team|squad)s?\s+of\s+\d+|\b(?:mentored|led|managed|supervised|onboarded|coordinated)\s+\d+|\b(?:reduced|increased|improved|cut|grew|saved|delivered|shipped|optimized|achieving|achieved|processing|generating|mentored|conducted|resulting|over|across)\b[^.]{0,80}\d/i;

const FIRST_PERSON = /\b(?:i am|i'm|my |me |our team and i)\b/i;

const BULLET_VERB_START =
  /^(?:owned|led|built|developed|designed|implemented|managed|ensured|actively|promoted|optimized|created|delivered|shipped|mentored|defined|conducted|participated|integrated|automated|collaborated|worked|utilized|improved|reduced|increased|architected|spearheaded|established|migrated|deployed|configured|streamlined|enhanced|achieved|generated|processed|coordinated|maintained|supported|analyzed|resolved|executed)\b/i;

const SECTION_END_MARKERS = [
  "projects",
  "technical skills",
  "skills",
  "education",
  "certifications",
  "awards",
  "summary",
];

function extractLatexSection(text: string, sectionPattern: RegExp): string {
  const match = text.match(sectionPattern);
  return match ? match[1] : "";
}

function extractPlainSection(text: string, sectionNames: string[]): string {
  const lower = text.toLowerCase();
  let start = -1;
  for (const name of sectionNames) {
    const idx = lower.search(new RegExp(`\\b${name.replace(/\s+/g, "\\s+")}\\b`, "i"));
    if (idx !== -1 && (start === -1 || idx < start)) start = idx;
  }
  if (start === -1) return "";

  const slice = text.slice(start);
  const sliceLower = slice.toLowerCase();
  let end = slice.length;
  for (const marker of SECTION_END_MARKERS) {
    const idx = sliceLower.search(new RegExp(`\\n\\s*${marker}\\b`, "i"));
    if (idx > 40 && idx < end) end = idx;
  }
  return slice.slice(0, end);
}

function extractLatexBullets(fragment: string): string[] {
  const bullets: string[] = [];
  const regex = /\\resumeItem\{/g;
  let match;
  while ((match = regex.exec(fragment)) !== null) {
    const start = match.index + "\\resumeItem{".length;
    let depth = 1;
    let j = start;
    while (j < fragment.length && depth > 0) {
      if (fragment[j] === "{") depth++;
      if (fragment[j] === "}") depth--;
      j++;
    }
    bullets.push(fragment.slice(start, j - 1));
  }
  return bullets;
}

function extractPlainBullets(fragment: string): string[] {
  const lines = fragment
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const bullets: string[] = [];
  for (const line of lines) {
    if (/^[\s•\-\*▪·]/.test(line)) {
      const cleaned = line.replace(/^[\s•\-\*▪·]+/, "").trim();
      if (cleaned.length > 20) bullets.push(cleaned);
      continue;
    }
    if (line.length > 35 && BULLET_VERB_START.test(line)) {
      bullets.push(line);
      continue;
    }
    if (line.length > 55 && /[.!?]$/.test(line) && /\d/.test(line)) {
      bullets.push(line);
    }
  }

  if (bullets.length < 2) {
    const sentences = fragment
      .replace(/\n+/g, " ")
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 40 && (BULLET_VERB_START.test(s) || /\d/.test(s)));
    for (const s of sentences) {
      if (!bullets.includes(s)) bullets.push(s);
    }
  }

  return bullets.filter((l) => l.length > 20);
}

export function extractBullets(text: string, isLatex: boolean, sectionOnly?: string): string[] {
  if (isLatex) {
    const fragment = sectionOnly
      ? extractLatexSection(
          text,
          new RegExp(`\\\\section\\{${sectionOnly}\\}([\\s\\S]*?)(?=\\\\section\\{|$)`, "i")
        )
      : text;
    return extractLatexBullets(fragment);
  }

  const fragment = sectionOnly
    ? extractPlainSection(text, [sectionOnly])
    : text;
  return extractPlainBullets(fragment);
}

export function extractExperienceBullets(text: string, isLatex: boolean): string[] {
  const names = isLatex ? ["Experience"] : ["experience", "work history", "employment"];
  if (isLatex) {
    const fragment = extractLatexSection(
      text,
      /\\section\{Experience\}([\s\S]*?)(?=\\section\{|$)/i
    );
    return extractLatexBullets(fragment);
  }
  return extractPlainBullets(extractPlainSection(text, names));
}

export function bulletHasMetric(bullet: string): boolean {
  const plain = bullet.includes("\\") ? stripLatexInline(bullet) : bullet.toLowerCase();
  if (METRIC_PATTERN.test(plain)) return true;
  const numbers = plain.match(/\b\d+\b/g) || [];
  return numbers.some((n) => {
    const num = parseInt(n, 10);
    return !(n.length === 4 && num >= 1990 && num <= 2099);
  });
}

export type BulletMetricResult = {
  ok: boolean;
  total: number;
  withMetrics: number;
  missing: string[];
};

function toDisplayBullet(b: string): string {
  return (b.includes("\\") ? stripLatexInline(b) : b).slice(0, 200);
}

export function validateExperienceBulletMetrics(
  text: string,
  isLatex: boolean
): BulletMetricResult {
  const bullets = extractExperienceBullets(text, isLatex).filter((b) => {
    const p = b.includes("\\") ? stripLatexInline(b) : b;
    return p.length > 20;
  });

  if (bullets.length === 0) {
    return { ok: true, total: 0, withMetrics: 0, missing: [] };
  }

  const missing: string[] = [];
  let withMetrics = 0;
  for (const b of bullets) {
    if (bulletHasMetric(b)) withMetrics++;
    else missing.push(toDisplayBullet(b));
  }

  return {
    ok: missing.length === 0,
    total: bullets.length,
    withMetrics,
    missing,
  };
}

export function validateBulletMetrics(text: string, isLatex: boolean): BulletMetricResult {
  const bullets = extractBullets(text, isLatex);
  if (bullets.length === 0) {
    return { ok: true, total: 0, withMetrics: 0, missing: [] };
  }

  const missing: string[] = [];
  let withMetrics = 0;
  for (const b of bullets) {
    if (bulletHasMetric(b)) withMetrics++;
    else missing.push(toDisplayBullet(b));
  }

  return {
    ok: missing.length === 0,
    total: bullets.length,
    withMetrics,
    missing: missing.slice(0, 12),
  };
}

export function validateDocumentExperienceMetrics(
  doc: import("@/types/resume-document").ResumeDocument
): BulletMetricResult {
  const missing: string[] = [];
  let total = 0;
  let withMetrics = 0;

  for (const job of doc.experience) {
    for (const bullet of job.bullets) {
      if (bullet.trim().length < 15) continue;
      total++;
      if (bulletHasMetric(bullet)) withMetrics++;
      else missing.push(bullet.slice(0, 200));
    }
  }

  return {
    ok: total === 0 || missing.length === 0,
    total,
    withMetrics,
    missing,
  };
}

export function hasFirstPersonSummary(text: string, isLatex: boolean): boolean {
  const plain = resumeToPlainText(text, isLatex);
  const summaryMatch = plain.match(/summary[\s\S]{0,400}/i);
  const slice = summaryMatch ? summaryMatch[0] : plain.slice(0, 400);
  return FIRST_PERSON.test(slice);
}

export function buildMetricRetryPrompt(missing: string[]): string {
  return `CRITICAL (Enhancv-style): ${missing.length} EXPERIENCE bullet(s) lack measurable results.
EVERY experience bullet MUST include at least one number: %, team size, user count, API count, sprint count, or time saved.
Examples: "mentoring 4 junior developers", "across 3 squads", "50+ users", "25% reduction", "12+ releases/year".

Bullets missing metrics — rewrite ALL of these:
${missing.map((b, i) => `${i + 1}. ${b}`).join("\n")}

Rewrite ONLY the bullets listed above. Keep all jobs, titles, dates, and other bullets unchanged.
Return the FULL corrected output.`;
}
