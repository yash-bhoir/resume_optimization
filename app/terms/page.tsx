import type { Metadata } from "next";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { generateMetadata as buildSeo } from "@/lib/seo";

export const metadata: Metadata = buildSeo({
  title: "Terms of Service",
  description: "Resume Fit terms of service for the free ATS resume checker and optimization tool.",
  path: "/terms",
  noIndex: true,
});

export default function TermsPage() {
  return (
    <div className="app-shell">
      <AppHeader />
      <main className="app-main marketing-page marketing-long">
        <h1>Terms of Service</h1>
        <p className="marketing-lead">Last updated: June 2025</p>
        <p>
          By using Resume Fit you agree to use the service lawfully. ATS scores are estimates — review
          optimized content before applying. You are responsible for the accuracy of your resume. Paid
          plans are subject to the pricing shown at checkout.
        </p>
        <p>
          <Link href="/">Back to resume optimizer</Link>
        </p>
      </main>
      <Footer />
    </div>
  );
}
