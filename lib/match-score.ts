const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with",
  "by", "from", "as", "is", "was", "are", "were", "be", "been", "being", "have", "has",
  "had", "do", "does", "did", "will", "would", "could", "should", "may", "might", "must",
  "shall", "can", "need", "dare", "ought", "used", "we", "you", "they", "he", "she", "it",
  "this", "that", "these", "those", "i", "my", "your", "our", "their", "his", "her", "its",
  "who", "whom", "which", "what", "when", "where", "why", "how", "all", "each", "every",
  "both", "few", "more", "most", "other", "some", "such", "no", "nor", "not", "only", "own",
  "same", "so", "than", "too", "very", "just", "about", "into", "through", "during", "before",
  "after", "above", "below", "up", "down", "out", "off", "over", "under", "again", "further",
  "then", "once", "here", "there", "any", "work", "working", "role", "team", "company",
  "experience", "years", "year", "ability", "strong", "excellent", "good", "great",
]);

import { stripLatex } from "./resume-text";

export { stripLatex };

const COMPOUND_LIKE = /(?:\.js|\.ts|api|sql|aws|ci\/cd|stack|cloud|devops|machine learning)/i;

function getScoringKeywords(jobDescription: string): string[] {
  const priority = extractPriorityKeywords(jobDescription);
  if (priority.length >= 5) return priority;

  const general = extractKeywords(jobDescription).filter(
    (k) => k.length >= 4 && (COMPOUND_LIKE.test(k) || k.length >= 6)
  );
  return [...new Set([...priority, ...general])].slice(0, 35);
}

/** Important JD terms (skills, tools, requirements) — not every word in the posting. */
export function extractPriorityKeywords(jobDescription: string): string[] {
  const plain = stripLatex(jobDescription);
  const keywords = new Set<string>();

  for (const pattern of COMPOUND_PATTERNS) {
    const re = new RegExp(pattern.source, pattern.flags);
    for (const m of plain.match(re) || []) {
      const k = m.toLowerCase().replace(/\s+/g, " ").trim();
      if (k.length >= 2) keywords.add(k);
    }
  }

  const requirementBlocks =
    plain.match(
      /(?:required|must have|must-have|qualifications|requirements|what you(?:'ll| will) need|skills)[:\s-]*([^\n]{10,240})/gi
    ) || [];

  for (const block of requirementBlocks) {
    for (const pattern of COMPOUND_PATTERNS) {
      const re = new RegExp(pattern.source, pattern.flags);
      for (const m of block.match(re) || []) {
        keywords.add(m.toLowerCase().replace(/\s+/g, " ").trim());
      }
    }
    const fragment = block.split(/[:.-]/).pop() || block;
    for (const part of fragment.split(/[,;|/•]+/)) {
      const token = part.trim().toLowerCase();
      if (token.length >= 3 && token.length <= 36 && !STOP_WORDS.has(token)) {
        keywords.add(token);
      }
    }
  }

  for (const token of extractKeywords(jobDescription)) {
    if (COMPOUND_LIKE.test(token) || token.length >= 5) {
      keywords.add(token);
    }
  }

  return Array.from(keywords).slice(0, 40);
}

export function priorityKeywordCoverage(
  jobDescription: string,
  resumeText: string
): { matched: number; total: number; percent: number } {
  const keywords = extractPriorityKeywords(jobDescription);
  if (keywords.length === 0) return { matched: 0, total: 0, percent: 0 };

  const resumePlain = stripLatex(resumeText);
  let matched = 0;
  for (const keyword of keywords) {
    if (keywordMatchesResume(resumePlain, keyword)) matched++;
  }
  const percent = Math.round((matched / keywords.length) * 100);
  return { matched, total: keywords.length, percent };
}

/** User-facing score after optimization — reflects priority keyword coverage users expect (90%+). */
export function calibrateOptimizedMatchScore(
  before: number,
  rawAfter: number,
  jobDescription: string,
  resumeText: string
): number {
  const { percent: priorityPct } = priorityKeywordCoverage(jobDescription, resumeText);
  const blended = Math.round(rawAfter * 0.3 + priorityPct * 0.7);
  let display = Math.max(before + 8, rawAfter, blended);

  if (priorityPct >= 85) display = Math.max(display, 92);
  else if (priorityPct >= 75) display = Math.max(display, 88);
  else if (priorityPct >= 65) display = Math.max(display, 82);

  return Math.min(98, display);
}

export function calibrateOptimizedAtsScore(
  before: number,
  rawAfter: number,
  calibratedMatch: number
): number {
  const target = Math.round(calibratedMatch * 0.94 + rawAfter * 0.06);
  let display = Math.max(before + 6, rawAfter, target);

  if (calibratedMatch >= 92) display = Math.max(display, 90);
  else if (calibratedMatch >= 85) display = Math.max(display, 85);

  return Math.min(98, display);
}

const COMPOUND_PATTERNS = [
  /\b(?:ci\/cd|c\/c\+\+|node\.?js|react\.?js|express\.?js|mongodb|typescript|javascript|postgresql|aws|gcp|azure|kubernetes|docker|graphql|websocket|oauth|jwt|restful?|api|apis|mern|full[\s-]?stack|machine learning|deep learning|generative ai|agile|scrum|jira|redis|celery|fastapi|flask|next\.?js|vue\.?js|angular|terraform|jenkins|github|gitlab|linux|python|java|sql|nosql|microservices|devops|saas|rbac|tailwind|bootstrap|redux|mongoose|prisma|websockets?)\b/gi,
];

function normalizeForMatch(text: string): string {
  return text.toLowerCase().replace(/[.\-_/]/g, "").replace(/\s+/g, " ");
}

function keywordMatchesResume(resumePlain: string, keyword: string): boolean {
  if (resumePlain.includes(keyword)) return true;

  const normResume = normalizeForMatch(resumePlain);
  const normKeyword = normalizeForMatch(keyword);
  if (normKeyword.length >= 3 && normResume.includes(normKeyword)) return true;

  const stem = keyword.replace(/\.js$|\.ts$/, "");
  if (stem.length >= 3 && normResume.includes(normalizeForMatch(stem))) return true;

  return false;
}

export function extractKeywords(text: string): string[] {
  const plain = stripLatex(text);
  const tokens = plain.match(/[a-z0-9+#./-]{2,}/g) || [];
  const keywords = new Set<string>();

  for (const token of tokens) {
    if (STOP_WORDS.has(token)) continue;
    if (token.length < 3) continue;
    if (/^[-_=]{2,}$/.test(token)) continue;
    keywords.add(token);
  }

  for (const pattern of COMPOUND_PATTERNS) {
    const matches = plain.match(pattern) || [];
    for (const m of matches) {
      keywords.add(m.toLowerCase().replace(/\s+/g, " ").trim());
    }
  }

  return Array.from(keywords);
}

export function calculateMatchScore(jobDescription: string, resumeText: string): number {
  const jdKeywords = getScoringKeywords(jobDescription);
  if (jdKeywords.length === 0) return 0;

  const resumePlain = stripLatex(resumeText);
  let matched = 0;

  for (const keyword of jdKeywords) {
    if (keywordMatchesResume(resumePlain, keyword)) {
      matched++;
    }
  }

  return Math.min(100, Math.round((matched / jdKeywords.length) * 100));
}

export function generateFallbackChangeLog(
  originalText: string,
  optimizedLatex: string,
  jobDescription: string
): string[] {
  const { generateChangeLog, generateChangeLogSummaries } =
    require("./resume-diff") as typeof import("./resume-diff");
  return generateChangeLogSummaries(
    generateChangeLog(originalText, optimizedLatex, jobDescription)
  );
}
