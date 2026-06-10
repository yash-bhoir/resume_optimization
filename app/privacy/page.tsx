import type { Metadata } from "next";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { generateMetadata as buildSeo } from "@/lib/seo";

export const metadata: Metadata = buildSeo({
  title: "Privacy Policy",
  description: "Resume Fit privacy policy — how we handle your resume data, account information, and analytics.",
  path: "/privacy",
  noIndex: true,
});

export default function PrivacyPage() {
  return (
    <div className="app-shell">
      <AppHeader />
      <main className="app-main marketing-page marketing-long">
        <h1>Privacy Policy</h1>
        <p className="marketing-lead">Last updated: June 2025</p>
        <p>
          Resume Fit (&ldquo;we&rdquo;) respects your privacy. Resumes you upload are processed to
          provide ATS scoring and optimization. We do not sell your resume data. Account information
          is managed through our authentication provider. Contact us via the FAQ page for data
          requests.
        </p>
        <p>
          <Link href="/">Back to resume optimizer</Link>
        </p>
      </main>
      <Footer />
    </div>
  );
}
