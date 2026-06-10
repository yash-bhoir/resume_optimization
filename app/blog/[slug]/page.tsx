import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import {
  extractHeadings,
  getAllBlogSlugs,
  getBlogPost,
  getRelatedPosts,
  renderMarkdown,
} from "@/lib/blog";
import { generateMetadata as buildSeo } from "@/lib/seo";
import { articleSchema, breadcrumbSchema } from "@/lib/structured-data";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getAllBlogSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};

  return buildSeo({
    title: post.title,
    description: post.description,
    path: `/blog/${slug}`,
    pageType: "blog-post",
    keywords: [post.category, "resume optimizer", "ATS resume checker"],
  });
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const html = renderMarkdown(post.content);
  const headings = extractHeadings(post.content);
  const showToc = post.readingTimeMinutes >= 5;
  const related = getRelatedPosts(slug);

  return (
    <div className="app-shell">
      <JsonLd
        data={[
          articleSchema({
            title: post.title,
            description: post.description,
            slug: post.slug,
            datePublished: post.date,
            dateModified: post.updated,
          }),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Blog", path: "/blog" },
            { name: post.title, path: `/blog/${slug}` },
          ]),
        ]}
      />
      <AppHeader />
      <main className="app-main marketing-page blog-article">
        <article>
          <header className="blog-article-header">
            <p className="blog-index-meta">
              <span className="blog-index-category">{post.category}</span>
              <time dateTime={post.date}>{post.date}</time>
              <span>{post.readingTimeMinutes} min read</span>
            </p>
            <h1>{post.title}</h1>
            <p className="blog-article-desc">{post.description}</p>
          </header>

          {showToc && headings.length > 0 ? (
            <nav className="blog-toc" aria-label="Table of contents">
              <p className="blog-toc-title">In this article</p>
              <ol>
                {headings.map((h) => (
                  <li key={h.id} className={h.level === 3 ? "blog-toc-h3" : undefined}>
                    <a href={`#${h.id}`}>{h.text}</a>
                  </li>
                ))}
              </ol>
            </nav>
          ) : null}

          <div className="blog-article-body" dangerouslySetInnerHTML={{ __html: html }} />

          <footer className="blog-article-footer">
            <p>
              Ready to optimize your resume?{" "}
              <Link href="/">Try it free →</Link> — our ATS resume checker scores your match in
              seconds.
            </p>

            {related.length > 0 ? (
              <section className="related-posts">
                <h2>Related articles</h2>
                <ul>
                  {related.map((r) => (
                    <li key={r.slug}>
                      <Link href={`/blog/${r.slug}`}>{r.title}</Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <Link href="/blog" className="btn btn-secondary">
              ← All articles
            </Link>
          </footer>
        </article>
      </main>
      <Footer />
    </div>
  );
}
