import type { ChecklistItem, ResumeAnalysis } from "@/types";

export function buildPreDownloadChecklist(
  analysis: ResumeAnalysis,
  keywordMatch: number,
  hasJobDescription: boolean
): ChecklistItem[] {
  const items: ChecklistItem[] = [];

  const hasFirstPerson = analysis.issues.some(
    (i) => i.section === "Summary" && i.message.includes("first person")
  );
  items.push({
    id: "summary-tone",
    label: "Summary uses professional third-person tone",
    pass: !hasFirstPerson,
    tip: 'Rewrite summary without "I am" — lead with role title and years',
    critical: true,
  });

  const expMetric =
    analysis.experienceMeasurablePercent ?? analysis.measurablePercent;
  const missingCount = analysis.bulletsMissingMetrics?.length ?? 0;

  items.push({
    id: "metrics",
    label: `Experience bullets quantified (${expMetric}%)`,
    pass: missingCount === 0 && expMetric === 100,
    tip:
      missingCount > 0
        ? `${missingCount} experience bullet(s) still need numbers — see Quantify impact panel`
        : "Add %, team size, or scale to every experience bullet",
    critical: true,
  });

  items.push({
    id: "repetition",
    label: "No over-repeated action verbs (max 2 each)",
    pass: analysis.repetitionWarnings.length === 0,
    tip:
      analysis.repetitionWarnings.length > 0
        ? `Replace repeated "${analysis.repetitionWarnings[0].word}" with ${analysis.repetitionWarnings[0].alternatives.slice(0, 2).join(", ")}`
        : undefined,
    critical: false,
  });

  if (hasJobDescription) {
    items.push({
      id: "tailoring",
      label: `JD keyword match (${keywordMatch}%)`,
      pass: keywordMatch >= 55,
      tip: "Mirror exact skills and terms from the job description",
      critical: true,
    });
  } else {
    items.push({
      id: "tailoring",
      label: "Job description tailoring",
      pass: false,
      tip: "Paste a job description when optimizing for accurate tailoring score",
      critical: true,
    });
  }

  const contactOk = (analysis.sectionIssues.Contact || 0) === 0;
  items.push({
    id: "contact",
    label: "Contact information complete",
    pass: contactOk,
    tip: "Include phone, email, and full LinkedIn URL",
    critical: false,
  });

  const skillsOk = (analysis.sectionIssues.Skills || 0) === 0;
  items.push({
    id: "skills",
    label: "Technical skills section categorized",
    pass: skillsOk,
    tip: "Group skills: Languages, Frontend, Backend, Databases, Tools",
    critical: false,
  });

  return items;
}

export function checklistPassCount(items: ChecklistItem[]): number {
  return items.filter((i) => i.pass).length;
}
