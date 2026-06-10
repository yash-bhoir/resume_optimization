import Link from "next/link";
import FaqAccordion from "@/components/FaqAccordion";
import Testimonials from "@/components/Testimonials";
import { HOMEPAGE_FAQS } from "@/lib/structured-data";

const CHECK_ITEMS = [
  {
    title: "Keyword match score",
    text: "Compares your resume against the job description to find missing skills, tools, and certifications recruiters search for in ATS.",
  },
  {
    title: "ATS parsing compatibility",
    text: "Detects formatting issues — scanned PDFs, tables, columns, and non-standard headings — that cause parsers to misread your experience.",
  },
  {
    title: "Section structure",
    text: "Validates standard headings (Experience, Education, Skills) so applicant tracking systems map your content to the right fields.",
  },
  {
    title: "Bullet point optimization",
    text: "AI rewrites achievements to include role-specific keywords and quantified impact while keeping every claim truthful.",
  },
  {
    title: "Before & after comparison",
    text: "See your ATS score improve side-by-side with a highlighted diff of every change made to tailor your resume.",
  },
  {
    title: "ATS-friendly export",
    text: "Download optimized resumes as PDF or DOCX formatted for Workday, Greenhouse, Lever, and other major ATS platforms.",
  },
] as const;

export default function HomeSeoContent() {
  return (
    <div className="home-seo-sections">
      <section className="seo-section" aria-labelledby="how-works-heading">
        <h2 id="how-works-heading">How Our ATS Resume Optimizer Works</h2>
        <ol className="seo-steps">
          <li>
            <strong>Upload your resume</strong> — PDF or DOCX, up to 5 MB. Our free ATS resume
            scanner parses your content instantly with no account required.
          </li>
          <li>
            <strong>Paste the job description</strong> — Copy the full posting to optimize resume
            for job description keywords. See ATS score before you optimize.
          </li>
          <li>
            <strong>Get your score &amp; download</strong> — Run the resume keyword optimizer to
            tailor bullet points. Sign in to download your ATS-friendly resume in 30 seconds.
          </li>
        </ol>
        <p>
          <Link href="/how-it-works">Learn how ATS screening works</Link> ·{" "}
          <Link href="/resume-optimizer/software-engineer">Software engineer resume optimizer</Link>
        </p>
      </section>

      <section className="seo-section" aria-labelledby="rejected-heading">
        <h2 id="rejected-heading">
          Why 75% of Resumes Get Rejected Before a Human Reads Them
        </h2>
        <p>
          Over 90% of large employers use Applicant Tracking Systems to filter applications before a
          human recruiter reviews them. When you apply online, your resume is parsed into a database —
          not opened like a Word document. If the parser cannot read your layout, or your keyword
          match is too low, you are rejected automatically.
        </p>
        <p>Common reasons resumes fail ATS resume screening include:</p>
        <ul className="seo-list">
          <li>Low keyword match against the job description</li>
          <li>Scanned PDFs and image-based text that parsers cannot extract</li>
          <li>Complex tables, columns, headers, and non-standard section names</li>
          <li>Missing skills, tools, or certifications listed as requirements</li>
          <li>Generic bullet points with no measurable impact or role-specific language</li>
        </ul>
        <p>
          A tailored resume that mirrors the employer&apos;s terminology dramatically improves your
          chances of passing the first filter. Read{" "}
          <Link href="/blog/why-resume-rejected-ats">
            why your resume gets rejected by ATS
          </Link>{" "}
          and how to fix it.
        </p>
      </section>

      <section className="seo-section" aria-labelledby="checks-heading">
        <h2 id="checks-heading">What Our Resume Optimizer Checks</h2>
        <div className="feature-check-grid">
          {CHECK_ITEMS.map((item) => (
            <div key={item.title} className="feature-check-card">
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <Testimonials />

      <section className="seo-section" aria-labelledby="faq-heading">
        <h2 id="faq-heading">Frequently Asked Questions</h2>
        <FaqAccordion items={HOMEPAGE_FAQS} idPrefix="home-faq" />
        <p className="seo-section-cta">
          <Link href="/faq">View all FAQ</Link> ·{" "}
          <Link href="/pricing">Compare free vs paid plans</Link> ·{" "}
          <Link href="/blog">Resume tips &amp; ATS guides</Link>
        </p>
      </section>
    </div>
  );
}
