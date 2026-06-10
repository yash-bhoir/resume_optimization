import type { Metadata } from "next";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { getAllBlogPosts, type BlogCategory } from "@/lib/blog";
import { generateMetadata as buildSeo, PAGE_TITLES } from "@/lib/seo";

export const metadata: Metadata = buildSeo({
  title: PAGE_TITLES["blog-index"],
  description:
    "Resume tips, ATS guides, and career advice. Learn how to beat ATS, optimize resume keywords, and pass resume screening in 2025.",
  path: "/blog",
  exactTitle: true,
  keywords: [
    "how to pass ATS screening",
    "resume keywords guide",
    "ATS-friendly resume format",
  ],
});

const CATEGORIES: BlogCategory[] = ["ATS Tips", "Resume Writing", "Job Search"];

interface BlogIndexProps {
  searchParams: Promise<{ category?: string }>;
}

export default async function BlogIndexPage({ searchParams }: BlogIndexProps) {
  const { category: rawCategory } = await searchParams;
  const activeCategory = CATEGORIES.includes(rawCategory as BlogCategory)
    ? (rawCategory as BlogCategory)
    : null;

  const allPosts = getAllBlogPosts();
  const posts = activeCategory
    ? allPosts.filter((p) => p.category === activeCategory)
    : allPosts;

  return (
    <div className="app-shell">
      <AppHeader />
      <main className="app-main marketing-page">
        <h1>Resume Tips, ATS Guides &amp; Career Advice</h1>
        <p className="marketing-lead">
          Expert guides on beating ATS systems, resume keyword optimization, and landing more
          interviews. Updated for 2025 hiring trends.
        </p>

        <nav className="blog-category-filters" aria-label="Blog categories">
          <Link
            href="/blog"
            className={`blog-category-chip${!activeCategory ? " active" : ""}`}
          >
            All
          </Link>
          {CATEGORIES.map((cat) => (
            <Link
              key={cat}
              href={`/blog?category=${encodeURIComponent(cat)}`}
              className={`blog-category-chip${activeCategory === cat ? " active" : ""}`}
            >
              {cat}
            </Link>
          ))}
        </nav>

        <ul className="blog-index">
          {posts.map((post) => (
            <li key={post.slug} className="blog-index-item">
              <Link href={`/blog/${post.slug}`} className="blog-index-link">
                <p className="blog-index-meta">
                  <span className="blog-index-category">{post.category}</span>
                  <time dateTime={post.date}>{post.date}</time>
                  <span>{post.readingTimeMinutes} min read</span>
                </p>
                <h2>{post.title}</h2>
                <p>{post.description}</p>
              </Link>
            </li>
          ))}
        </ul>

        <p>
          Ready to optimize? Use our{" "}
          <Link href="/">free resume optimizer</Link> — ATS checker included.
        </p>
      </main>
      <Footer />
    </div>
  );
}
