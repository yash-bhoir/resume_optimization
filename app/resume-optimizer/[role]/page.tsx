import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import HomeUploadTool from "@/components/HomeUploadTool";
import JsonLd from "@/components/JsonLd";
import TrustSignals from "@/components/TrustSignals";
import {
  generateMetadata as buildSeo,
  rolePageDescription,
  rolePageTitle,
} from "@/lib/seo";
import { breadcrumbSchema, webPageSchema } from "@/lib/structured-data";
import { ROLE_SLUGS, getRole } from "@/lib/roles";

interface RolePageProps {
  params: Promise<{ role: string }>;
}

export function generateStaticParams() {
  return ROLE_SLUGS.map((role) => ({ role }));
}

export async function generateMetadata({ params }: RolePageProps): Promise<Metadata> {
  const { role: slug } = await params;
  const role = getRole(slug);
  if (!role) return {};

  return buildSeo({
    title: role.title,
    description: rolePageDescription(role.title),
    path: `/resume-optimizer/${slug}`,
    pageType: "role",
    keywords: role.keywords,
  });
}

export default async function RoleLandingPage({ params }: RolePageProps) {
  const { role: slug } = await params;
  const role = getRole(slug);
  if (!role) notFound();

  const pageTitle = rolePageTitle(role.title);

  return (
    <div className="app-shell">
      <JsonLd
        data={[
          webPageSchema({
            name: pageTitle,
            description: rolePageDescription(role.title),
            path: `/resume-optimizer/${slug}`,
          }),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: role.title, path: `/resume-optimizer/${slug}` },
          ]),
        ]}
      />
      <AppHeader />
      <main className="app-main">
        <header className="page-intro hero-intro">
          <h1>Free Resume Optimizer for {role.title}</h1>
          <p className="role-intro">{role.intro}</p>
          <TrustSignals />
          <Link href="#upload" className="btn btn-primary hero-cta">
            Upload {role.title.toLowerCase()} resume — free ATS check
          </Link>
        </header>

        <HomeUploadTool />

        <section className="seo-section">
          <h2>Top ATS Keywords for {role.title} Resumes</h2>
          <p>
            Include these terms when truthful and relevant to your experience. Our{" "}
            <Link href="/">ATS resume checker</Link> highlights which keywords from the job
            description are missing from your resume:
          </p>
          <ul className="seo-list role-keyword-list">
            {role.atsKeywords.map((kw) => (
              <li key={kw}>{kw}</li>
            ))}
          </ul>
        </section>

        <section className="seo-section">
          <h2>Common ATS Mistakes {role.title} Candidates Make</h2>
          <ul className="seo-list">
            {role.mistakes.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </section>

        <section className="seo-section">
          <h2>How to Structure Your {role.title} Resume for ATS</h2>
          <ul className="seo-list">
            {role.structureTips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
          <p>
            <Link href="/how-it-works">How ATS screening works</Link> ·{" "}
            <Link href="/faq">ATS FAQ</Link> ·{" "}
            <Link href="/">Optimize your resume free</Link>
          </p>
        </section>

        {role.relatedBlogSlugs.length > 0 ? (
          <section className="seo-section">
            <h2>Related resume guides</h2>
            <ul className="seo-list">
              {role.relatedBlogSlugs.map((blogSlug) => (
                <li key={blogSlug}>
                  <Link href={`/blog/${blogSlug}`}>
                    {blogSlug.replace(/-/g, " ")}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}
