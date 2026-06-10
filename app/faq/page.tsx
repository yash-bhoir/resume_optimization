import type { Metadata } from "next";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import FaqAccordion from "@/components/FaqAccordion";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { generateMetadata as buildSeo, PAGE_TITLES } from "@/lib/seo";
import { breadcrumbSchema, faqPageSchema, HOMEPAGE_FAQS } from "@/lib/structured-data";

export const metadata: Metadata = buildSeo({
  title: PAGE_TITLES.faq,
  description:
    "ATS resume checker FAQ: optimize resume for ATS, check compatibility free, best file formats, keyword tips, and what a good ATS score looks like.",
  path: "/faq",
  exactTitle: true,
  keywords: [
    "ATS resume checker FAQ",
    "check if resume is ATS compatible free",
    "why is my resume getting rejected by ATS",
    "best free ATS resume checker",
  ],
});

export default function FaqPage() {
  return (
    <div className="app-shell">
      <JsonLd
        data={[
          faqPageSchema(HOMEPAGE_FAQS),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "FAQ", path: "/faq" },
          ]),
        ]}
      />
      <AppHeader />
      <main className="app-main marketing-page">
        <h1>Resume ATS FAQ — Everything You Need to Know</h1>
        <p className="marketing-lead">
          Answers about our free resume optimizer, ATS resume checker, keyword optimization, and how
          to pass ATS screening. Check if your resume is ATS compatible free before you apply.
        </p>

        <FaqAccordion items={HOMEPAGE_FAQS} idPrefix="faq-page" />

        <div className="marketing-cta-row">
          <Link href="/" className="btn btn-primary">
            Try free ATS resume checker
          </Link>
          <Link href="/how-it-works" className="btn btn-secondary">
            How ATS works
          </Link>
          <Link href="/pricing" className="btn btn-secondary">
            View pricing
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
