/**
 * Build download name from the uploaded file: `My_Resume.docx` → `My_Resume_op.pdf`
 */
export function getOptimizedFileName(
  originalFileName: string | undefined,
  targetExt: "pdf" | "docx" | "tex" | "txt"
): string {
  const ext = `.${targetExt}`;
  if (!originalFileName?.trim()) {
    return `optimized-resume${ext}`;
  }

  const base = originalFileName.replace(/\.[^.]+$/i, "").trim();
  const safe = base.replace(/[^\w.\-()+ ]+/g, "_").replace(/_+/g, "_") || "resume";
  return `${safe}_op${ext}`;
}
