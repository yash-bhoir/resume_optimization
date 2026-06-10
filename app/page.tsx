import Link from "next/link";
import { Suspense } from "react";
import AppHeader from "@/components/AppHeader";
import AdminDeniedBanner from "@/components/AdminDeniedBanner";
import Footer from "@/components/Footer";
import HomeSeoContent from "@/components/HomeSeoContent";
import HomeUploadTool from "@/components/HomeUploadTool";
import JsonLd from "@/components/JsonLd";
import SocialProof from "@/components/SocialProof";
import TrustSignals from "@/components/TrustSignals";
import {
  faqPageSchema,
  HOMEPAGE_FAQS,
  howToOptimizeResumeSchema,
  webApplicationSchema,
} from "@/lib/structured-data";

export default function HomePage() {
  return (
    <div className="app-shell">
      <JsonLd
        data={[webApplicationSchema(), faqPageSchema(HOMEPAGE_FAQS), howToOptimizeResumeSchema()]}
      />
      <AppHeader />

      <Suspense fallback={null}>
        <AdminDeniedBanner />
      </Suspense>

      <main className="app-main">
        <header className="page-intro hero-intro">
          <h1>Free Resume Optimizer — Beat ATS &amp; Land More Interviews</h1>
          <p>
            Upload your resume, paste a job description, and get an ATS score with AI-powered
            keyword optimization in 30 seconds. Our <strong>ATS resume checker</strong> helps you{" "}
            <strong>optimize resume for job description</strong> requirements and{" "}
            <strong>tailor resume to job description</strong> keywords — free online.
          </p>
          <Suspense fallback={null}>
            <SocialProof />
          </Suspense>
          <TrustSignals />
          <Link href="#upload" className="btn btn-primary hero-cta">
            Upload resume — free ATS check
          </Link>
        </header>

        <HomeUploadTool />
        <HomeSeoContent />
      </main>

      <Footer />
    </div>
  );
}
