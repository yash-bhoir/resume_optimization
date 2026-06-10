import JSZip from "jszip";
import type { ResumeDocument } from "@/types/resume-document";
import { documentToPlainText } from "./resume-schema";

interface TextSegment {
  paragraphIndex: number;
  runIndex: number;
  text: string;
  fullParagraphText: string;
}

function collectParagraphs(xml: string): { paragraphs: string[]; segments: TextSegment[] } {
  const paragraphs: string[] = [];
  const segments: TextSegment[] = [];
  const pRegex = /<w:p[\s>][\s\S]*?<\/w:p>/g;
  let pMatch;
  let pIdx = 0;

  while ((pMatch = pRegex.exec(xml)) !== null) {
    const pBlock = pMatch[0];
    const tRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
    let tMatch;
    let runIdx = 0;
    const texts: string[] = [];

    while ((tMatch = tRegex.exec(pBlock)) !== null) {
      const text = tMatch[1];
      texts.push(text);
      segments.push({
        paragraphIndex: pIdx,
        runIndex: runIdx,
        text,
        fullParagraphText: "",
      });
      runIdx++;
    }

    const fullText = texts.join("");
    paragraphs.push(fullText);
    for (const seg of segments.filter((s) => s.paragraphIndex === pIdx)) {
      seg.fullParagraphText = fullText;
    }
    pIdx++;
  }

  return { paragraphs, segments };
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

function similarity(a: string, b: string): number {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.85;
  const wordsA = new Set(na.split(" "));
  const wordsB = new Set(nb.split(" "));
  let overlap = 0;
  for (const w of wordsA) {
    if (wordsB.has(w) && w.length > 3) overlap++;
  }
  return overlap / Math.max(wordsA.size, wordsB.size, 1);
}

function buildReplacementMap(
  originalParagraphs: string[],
  originalDoc: ResumeDocument,
  optimizedDoc: ResumeDocument
): Map<string, string> {
  const map = new Map<string, string>();

  const originalChunks: string[] = [];
  const optimizedChunks: string[] = [];

  if (originalDoc.summary) originalChunks.push(originalDoc.summary);
  if (optimizedDoc.summary) optimizedChunks.push(optimizedDoc.summary);

  for (const job of originalDoc.experience) {
    originalChunks.push(...job.bullets);
  }
  for (const job of optimizedDoc.experience) {
    optimizedChunks.push(...job.bullets);
  }
  for (const p of originalDoc.projects) {
    originalChunks.push(...p.bullets);
  }
  for (const p of optimizedDoc.projects) {
    optimizedChunks.push(...p.bullets);
  }

  const plainOrig = documentToPlainText(originalDoc);
  const plainOpt = documentToPlainText(optimizedDoc);
  if (originalDoc.summary && optimizedDoc.summary) {
    map.set(normalize(originalDoc.summary), optimizedDoc.summary);
  }

  const minLen = Math.min(originalChunks.length, optimizedChunks.length);
  for (let i = 0; i < minLen; i++) {
    if (originalChunks[i] && optimizedChunks[i]) {
      map.set(normalize(originalChunks[i]), optimizedChunks[i]);
    }
  }

  for (const para of originalParagraphs) {
    const n = normalize(para);
    if (map.has(n)) continue;
    let bestKey = "";
    let bestScore = 0;
    for (const [key] of map) {
      const score = similarity(para, key);
      if (score > bestScore) {
        bestScore = score;
        bestKey = key;
      }
    }
    if (bestScore > 0.5 && bestKey) {
      map.set(n, map.get(bestKey)!);
    }
  }

  if (plainOrig !== plainOpt && originalDoc.summary) {
    for (const para of originalParagraphs) {
      if (similarity(para, originalDoc.summary) > 0.4) {
        map.set(normalize(para), optimizedDoc.summary);
      }
    }
  }

  return map;
}

function replaceParagraphText(pBlock: string, newText: string): string {
  const tRegex = /(<w:t[^>]*>)([^<]*)(<\/w:t>)/;
  const match = pBlock.match(tRegex);
  if (!match) return pBlock;

  const escaped = newText
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  let replaced = false;
  return pBlock.replace(/<w:t[^>]*>[^<]*<\/w:t>/g, (m) => {
    if (replaced) return "<w:t></w:t>";
    replaced = true;
    return m.replace(tRegex, `$1${escaped}$3`);
  });
}

export async function applyDocxPreserve(
  originalBase64: string,
  originalDoc: ResumeDocument,
  optimizedDoc: ResumeDocument
): Promise<Buffer> {
  const zip = await JSZip.loadAsync(Buffer.from(originalBase64, "base64"));
  const docXmlFile = zip.file("word/document.xml");
  if (!docXmlFile) throw new Error("Invalid DOCX: missing document.xml");

  let xml = await docXmlFile.async("string");
  const { paragraphs } = collectParagraphs(xml);
  const replacementMap = buildReplacementMap(paragraphs, originalDoc, optimizedDoc);

  const pRegex = /<w:p[\s>][\s\S]*?<\/w:p>/g;
  xml = xml.replace(pRegex, (pBlock) => {
    const texts: string[] = [];
    const tRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
    let m;
    while ((m = tRegex.exec(pBlock)) !== null) texts.push(m[1]);
    const fullText = texts.join("");
    const key = normalize(fullText);
    const replacement = replacementMap.get(key);
    if (replacement && replacement !== fullText) {
      return replaceParagraphText(pBlock, replacement);
    }
    for (const [origKey, newVal] of replacementMap) {
      if (similarity(fullText, origKey) > 0.55) {
        return replaceParagraphText(pBlock, newVal);
      }
    }
    return pBlock;
  });

  zip.file("word/document.xml", xml);
  const out = await zip.generateAsync({ type: "nodebuffer" });
  return out;
}
