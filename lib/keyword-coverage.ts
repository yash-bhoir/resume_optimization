import { extractPriorityKeywords } from "./match-score";
import { stripLatex } from "./resume-text";

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

export interface KeywordCoverageResult {
  matched: string[];
  missing: string[];
  total: number;
  percent: number;
}

export function analyzeKeywordCoverage(
  jobDescription: string,
  resumeText: string
): KeywordCoverageResult {
  const keywords = extractPriorityKeywords(jobDescription);
  const resumePlain = stripLatex(resumeText).toLowerCase();
  const matched: string[] = [];
  const missing: string[] = [];

  for (const keyword of keywords) {
    if (keywordMatchesResume(resumePlain, keyword)) {
      matched.push(keyword);
    } else {
      missing.push(keyword);
    }
  }

  const total = keywords.length;
  const percent = total > 0 ? Math.round((matched.length / total) * 100) : 0;

  return { matched, missing, total, percent };
}
