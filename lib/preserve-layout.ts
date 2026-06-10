import type { DetectedFormat } from "@/types";
import type { OptimizationMode, ResumeDocument } from "@/types/resume-document";
import { applyDocxPreserve } from "./docx-preserve";
import { mergeDocumentIntoLatex } from "./latex-preserve";
import { renderDocumentToJakeLatex } from "./render-jake";
import { wrapLatexContent } from "./latex-template";
import { getPreserveLayoutSupport } from "./parse-resume";
import { canPreserveLayout as canPreserve } from "./preserve-layout-utils";

export interface PreserveRenderResult {
  latexSource: string;
  preservedDocxBase64?: string;
  preservedTexSource?: string;
  effectiveMode: OptimizationMode;
  layoutNote?: string;
}

export async function renderOptimizedOutput(
  mode: OptimizationMode,
  format: DetectedFormat,
  optimizedDoc: ResumeDocument,
  options: {
    originalFileBase64?: string;
    originalTexSource?: string;
    originalDoc?: ResumeDocument;
  }
): Promise<PreserveRenderResult> {
  const preserve = getPreserveLayoutSupport(format);
  const usePreserve = mode === "preserve" && preserve.supported;

  if (usePreserve && format === "docx" && options.originalFileBase64 && options.originalDoc) {
    const buffer = await applyDocxPreserve(
      options.originalFileBase64,
      options.originalDoc,
      optimizedDoc
    );
    const jakeBody = renderDocumentToJakeLatex(optimizedDoc);
    return {
      latexSource: wrapLatexContent(jakeBody),
      preservedDocxBase64: buffer.toString("base64"),
      effectiveMode: "preserve",
    };
  }

  if (usePreserve && (format === "tex" || options.originalTexSource) && options.originalTexSource) {
    const preservedTex = mergeDocumentIntoLatex(options.originalTexSource, optimizedDoc);
    return {
      latexSource: preservedTex.includes("\\documentclass")
        ? preservedTex
        : wrapLatexContent(preservedTex),
      preservedTexSource: preservedTex,
      effectiveMode: "preserve",
    };
  }

  const layoutNote =
    mode === "preserve" && !preserve.supported ? preserve.note : undefined;

  return {
    latexSource: wrapLatexContent(renderDocumentToJakeLatex(optimizedDoc)),
    effectiveMode: "template",
    layoutNote,
  };
}

export function canPreserveLayout(format: DetectedFormat): boolean {
  return canPreserve(format);
}
