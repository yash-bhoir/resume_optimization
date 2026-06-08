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

import { generateChangeLog, generateChangeLogSummaries } from "./resume-diff";
import { stripLatex } from "./resume-text";

export { stripLatex };

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
  const jdKeywords = extractKeywords(jobDescription);
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
  return generateChangeLogSummaries(
    generateChangeLog(originalText, optimizedLatex, jobDescription)
  );
}
