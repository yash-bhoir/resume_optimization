import type { Metadata } from "next";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { generateMetadata as buildSeo, PAGE_TITLES } from "@/lib/seo";
import {
  breadcrumbSchema,
  howToOptimizeResumeSchema,
} from "@/lib/structured-data";

export const metadata: Metadata = buildSeo({
  title: PAGE_TITLES["how-it-works"],
  description:
    "Learn how ATS filters resumes, why yours gets rejected, and how to optimize your resume for ATS screening with keyword matching — step by step.",
  path: "/how-it-works",
  exactTitle: true,
  pageType: "default",
  keywords: [
    "how does ATS work",
    "how to make resume ATS friendly",
    "ATS resume tips",
    "optimize resume for job description",
  ],
});

export default function HowItWorksPage() {
  return (
    <div className="app-shell">
      <JsonLd
        data={[
          howToOptimizeResumeSchema(),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "How It Works", path: "/how-it-works" },
          ]),
        ]}
      />
      <AppHeader />
      <main className="app-main marketing-page marketing-long">
        <h1>How Our ATS Resume Optimizer Works</h1>

        <p className="marketing-lead">
          If you have applied to dozens of jobs and heard nothing back, the problem might not be
          your experience — it might be the Applicant Tracking System standing between you and a
          recruiter. This guide explains how ATS platforms filter resumes, why qualified candidates
          get rejected, and how to optimize your resume to pass automated screening.
        </p>

        <h2>What is an ATS System?</h2>
        <p>
          An Applicant Tracking System (ATS) is software employers use to collect, sort, and rank job
          applications. Companies like Workday, Greenhouse, Lever, Taleo, and iCIMS power hiring for
          most Fortune 500 firms and a growing share of mid-size businesses. When you click
          &ldquo;Apply,&rdquo; your resume is uploaded into a database — not emailed directly to a
          hiring manager.
        </p>
        <p>
          The ATS parses your resume into structured fields: name, contact info, work history,
          education, and skills. Recruiters then search and filter candidates by keywords, years of
          experience, job titles, and location. Many systems also assign a match score based on how
          closely your resume aligns with the job description. Understanding this pipeline is the
          first step to learning how to pass ATS screening.
        </p>

        <h2>Why Your Resume Gets Filtered Out</h2>
        <p>
          ATS rejection is rarely personal. It is mechanical. The system either cannot read your file,
          or your resume scores below the cutoff for keyword relevance. Here are the most common
          failure modes job seekers encounter when applying through online portals.
        </p>
        <h3>Parsing failures</h3>
        <p>
          Scanned PDFs — documents that are essentially photographs of paper — contain no extractable
          text. Multi-column layouts, text boxes, headers, footers, and tables often scramble the
          reading order. Fancy fonts and icons may be stripped entirely. The result is a garbled
          profile with missing skills and employment dates that no recruiter will ever see.
        </p>
        <h3>Low keyword match</h3>
        <p>
          Job descriptions are keyword-rich by design. If the posting requires Python, AWS, and CI/CD
          but your resume says programming and cloud tools, the match score drops. Recruiters
          filtering for exact terms will not find your application. This is why you must tailor your
          resume to each specific job description rather than sending a generic document.
        </p>
        <h3>Formatting and structure issues</h3>
        <p>
          Non-standard section headings like My Journey instead of Experience confuse parsers.
          Submitting unsupported file types guarantees failure. Even creative one-page designs from
          Canva often break in enterprise ATS platforms used by large employers.
        </p>

        <h2>Step 1: Upload Your Resume</h2>
        <p>
          Start with a PDF or DOCX file exported from Word or Google Docs — not a scan or screenshot.
          Our resume optimizer accepts files up to 5 MB and parses your content into structured
          sections: experience, education, skills, and certifications. We detect common ATS pitfalls
          like image-based text, broken columns, and missing contact fields during this first step.
        </p>
        <p>
          You do not need an account to upload and preview your ATS score. The parser extracts
          keywords from your existing bullet points and compares them against standard section
          expectations used by major applicant tracking systems.
        </p>

        <h2>Step 2: Paste the Job Description</h2>
        <p>
          Copy the entire job posting — requirements, responsibilities, and preferred qualifications
          — and paste it into the optimizer. Our system extracts required skills, tools,
          certifications, and repeated phrases that ATS filters weight heavily. This keyword
          extraction step mirrors what recruiters search for when they filter candidate databases.
        </p>
        <p>
          The more complete your job description input, the more accurate your keyword match score.
          Partial postings miss seniority signals, domain terms, and soft skills that differentiate
          strong candidates from automatic rejections.
        </p>

        <h2>Step 3: Get Your ATS Score &amp; Optimized Resume</h2>
        <p>
          Your ATS score reflects keyword alignment, formatting compatibility, and section structure
          — three factors that determine whether your resume survives the first automated filter. Scores
          below 60% often indicate missing required skills or parsing issues. Scores above 75%
          typically pass initial screening at most employers.
        </p>
        <p>
          When you run optimization, our AI rewrites bullet points and skills to improve match while
          preserving your facts. You receive before-and-after scores, a detailed change log, and an
          ATS-friendly download. Sign in only when you are ready to export — free accounts include
          monthly credits.
        </p>

        <h2>Tips to Maximize Your ATS Score</h2>
        <ul className="seo-list">
          <li>Tailor every application — generic resumes lose on keyword match every time</li>
          <li>Use exact phrases from the job description where truthful and accurate</li>
          <li>Quantify achievements with metrics recruiters and parsers can scan quickly</li>
          <li>Stick to one or two pages with clear section headings: Experience, Education, Skills</li>
          <li>Export as DOCX or text-based PDF — never submit scanned images or photos</li>
          <li>Test with a free ATS resume scanner before you apply to each role</li>
          <li>Mirror job title language in your summary when it reflects your actual experience</li>
          <li>Place critical keywords in both your skills section and experience bullets</li>
        </ul>

        <p>
          Ready to see your score? Use our{" "}
          <Link href="/">free resume optimizer</Link> — upload your resume and paste a job
          description to get started in under a minute. Read the{" "}
          <Link href="/faq">ATS resume FAQ</Link> for answers to common questions about
          compatibility, file formats, and scoring.
        </p>

        <div className="marketing-cta-row">
          <Link href="/" className="btn btn-primary">
            Try free ATS resume checker
          </Link>
          <Link href="/faq" className="btn btn-secondary">
            Read FAQ
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
