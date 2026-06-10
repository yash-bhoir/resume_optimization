import { describe, expect, it } from "vitest";
import {
  calculateMatchScore,
  calibrateOptimizedMatchScore,
  extractPriorityKeywords,
} from "@/lib/match-score";

const SAMPLE_JD = `
Senior Software Engineer — Acme Corp
Requirements: 5+ years experience with JavaScript, TypeScript, React, Next.js, Node.js,
RESTful APIs, MongoDB, AWS, Docker, CI/CD, Agile. Build scalable web applications.
`.trim();

const RESUME_BEFORE = `
John Smith - Software Engineer
Built React apps. Used Node.js and MongoDB. 5 years experience.
Skills: JavaScript, TypeScript, Git
`.trim();

const RESUME_AFTER = `
John Smith - Senior Software Engineer
Built Next.js and React applications on Node.js with TypeScript serving 100k users.
Designed RESTful APIs on AWS with Docker and CI/CD pipelines. MongoDB data layer. Agile teams.
Skills: JavaScript, TypeScript, React, Next.js, Node.js, MongoDB, AWS, Docker, CI/CD, Agile
`.trim();

describe("match-score", () => {
  it("extracts priority keywords instead of every JD word", () => {
    const keywords = extractPriorityKeywords(SAMPLE_JD);
    expect(keywords.length).toBeGreaterThanOrEqual(5);
    expect(keywords.length).toBeLessThanOrEqual(40);
    expect(keywords).toContain("react");
  });

  it("shows meaningful uplift after optimization toward 90%+", () => {
    const before = calculateMatchScore(SAMPLE_JD, RESUME_BEFORE);
    const afterRaw = calculateMatchScore(SAMPLE_JD, RESUME_AFTER);
    const after = calibrateOptimizedMatchScore(before, afterRaw, SAMPLE_JD, RESUME_AFTER);

    expect(before).toBeLessThan(75);
    expect(after).toBeGreaterThanOrEqual(88);
    expect(after).toBeGreaterThan(before + 5);
  });
});
