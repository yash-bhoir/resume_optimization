import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { siteLinksSearchBoxSchema } from "@/lib/structured-data";

const COMPANY_LINKS = [
  { href: "/how-it-works", label: "About" },
  { href: "/blog", label: "Blog" },
  { href: "/pricing", label: "Pricing" },
  { href: "/faq", label: "Contact" },
] as const;

const RESOURCE_LINKS = [
  { href: "/how-it-works", label: "How It Works" },
  { href: "/faq", label: "FAQ" },
  { href: "/blog/how-to-beat-ats-systems-2025", label: "ATS Guide" },
  { href: "/blog", label: "Resume Tips" },
] as const;

const TOOL_LINKS = [
  { href: "/", label: "Resume Optimizer" },
  { href: "/", label: "ATS Checker" },
  { href: "/blog/resume-keywords-complete-guide", label: "Keyword Tool" },
] as const;

const ROLE_LINKS = [
  { href: "/resume-optimizer/software-engineer", label: "Software Engineer" },
  { href: "/resume-optimizer/data-scientist", label: "Data Scientist" },
  { href: "/resume-optimizer/product-manager", label: "Product Manager" },
  { href: "/resume-optimizer/marketing-manager", label: "Marketing Manager" },
] as const;

const LEGAL_LINKS = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
] as const;

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: readonly { href: string; label: string }[];
}) {
  return (
    <div className="site-footer-column">
      <p className="site-footer-column-title">{title}</p>
      <ul className="site-footer-column-list">
        {links.map((link) => (
          <li key={`${title}-${link.href}-${link.label}`}>
            <Link href={link.href} className="site-footer-link">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="site-footer">
      <JsonLd data={siteLinksSearchBoxSchema()} />
      <div className="site-footer-inner site-footer-grid">
        <div className="site-footer-brand">
          <p className="site-footer-name">Resume Fit</p>
          <p className="site-footer-tagline">
            Free ATS resume checker and resume optimizer — tailor your resume to any job
            description and pass ATS screening.
          </p>
          <Link href="/" className="site-footer-keyword-link">
            Free ATS Resume Checker
          </Link>
        </div>
        <FooterColumn title="Company" links={COMPANY_LINKS} />
        <FooterColumn title="Resources" links={RESOURCE_LINKS} />
        <FooterColumn title="Tools" links={TOOL_LINKS} />
        <FooterColumn title="Popular roles" links={ROLE_LINKS} />
        <FooterColumn title="Legal" links={LEGAL_LINKS} />
      </div>
      <p className="site-footer-copy">
        © {new Date().getFullYear()} Resume Fit. Free ATS Resume Checker &amp; Optimizer.
      </p>
    </footer>
  );
}
