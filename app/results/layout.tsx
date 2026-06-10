import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import { createPageMetadata } from "@/lib/seo";
import { softwareApplicationSchema } from "@/lib/structured-data";

export const metadata: Metadata = createPageMetadata({
  title: "Your Optimized Resume Results",
  description:
    "View your ATS optimization results with before-and-after scores, keyword analysis, and downloadable tailored resume.",
  path: "/results",
  noIndex: true,
});

export default function ResultsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={softwareApplicationSchema()} />
      {children}
    </>
  );
}
