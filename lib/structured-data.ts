import { absoluteUrl, getBaseUrl, SITE_NAME } from "@/lib/seo";

export interface FaqItem {
  question: string;
  answer: string;
}

export function webApplicationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE_NAME,
    url: getBaseUrl(),
    description:
      "Free ATS resume checker and resume optimizer. Tailor your resume to any job description, score ATS compatibility, and download an optimized resume.",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web Browser",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Free ATS score preview; monthly credits when signed in",
    },
    featureList: [
      "ATS Score Checker",
      "Resume Keyword Optimizer",
      "PDF Export",
      "Job Description Matching",
    ],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "127",
      bestRating: "5",
      worstRating: "1",
    },
  };
}

export function faqPageSchema(faqs: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function howToOptimizeResumeSchema() {
  const base = getBaseUrl();
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to optimize your resume for ATS in 3 steps",
    description:
      "Upload your resume, paste a job description, and get an ATS score with AI-powered keyword optimization to pass applicant tracking systems.",
    totalTime: "PT5M",
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "Upload your resume",
        text: "Upload a PDF or DOCX resume. Our ATS resume checker parses your content and checks formatting compatibility instantly — no account required for a score preview.",
        image: `${base}/api/og?title=Upload%20Resume&type=howto`,
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "Paste the job description",
        text: "Copy the full job posting and paste it into the optimizer. We extract required skills, tools, and keywords so you can tailor your resume to the specific role.",
        image: `${base}/api/og?title=Paste%20Job%20Description&type=howto`,
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "Get your ATS score and optimized resume",
        text: "Review your ATS compatibility score and keyword match. Run optimization to align bullet points and skills, then download an ATS-friendly PDF or DOCX.",
        image: `${base}/api/og?title=ATS%20Score%20%26%20Optimize&type=howto`,
      },
    ],
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function webPageSchema(options: {
  name: string;
  description: string;
  path: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: options.name,
    description: options.description,
    url: absoluteUrl(options.path),
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: getBaseUrl(),
    },
  };
}

export function siteLinksSearchBoxSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: getBaseUrl(),
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${getBaseUrl()}/blog?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function softwareApplicationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `${SITE_NAME} Results`,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web Browser",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    description:
      "ATS optimization results with before-and-after scores, keyword analysis, and downloadable tailored resume.",
  };
}

export function productPricingSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${SITE_NAME} — ATS Resume Optimizer`,
    description:
      "Free ATS resume checker with Pro and Job Sprint plans for unlimited optimizations and downloads.",
    brand: { "@type": "Brand", name: SITE_NAME },
    offers: [
      {
        "@type": "Offer",
        name: "Free",
        price: "0",
        priceCurrency: "USD",
        description: "ATS score preview free; monthly optimization credits when signed in",
        url: absoluteUrl("/pricing"),
      },
      {
        "@type": "Offer",
        name: "Pro",
        price: "12",
        priceCurrency: "USD",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: "12",
          priceCurrency: "USD",
          billingDuration: "P1M",
        },
        description: "Up to 50 optimizations per month, unlimited downloads, preserve-layout mode",
        url: absoluteUrl("/pricing"),
      },
      {
        "@type": "Offer",
        name: "Job Sprint",
        price: "19",
        priceCurrency: "USD",
        description: "One-time credit pack for active job searches — credits never expire",
        url: absoluteUrl("/pricing"),
      },
    ],
  };
}

export function articleSchema(options: {
  title: string;
  description: string;
  slug: string;
  datePublished: string;
  dateModified?: string;
  image?: string;
}) {
  const pageUrl = absoluteUrl(`/blog/${options.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: options.title,
    description: options.description,
    datePublished: options.datePublished,
    dateModified: options.dateModified ?? options.datePublished,
    image:
      options.image ??
      `${getBaseUrl()}/api/og?title=${encodeURIComponent(options.title)}`,
    author: {
      "@type": "Organization",
      name: SITE_NAME,
      url: getBaseUrl(),
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: getBaseUrl(),
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": pageUrl,
    },
  };
}

export function reviewSchema(
  reviews: { author: string; reviewBody: string; ratingValue?: number }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: SITE_NAME,
    review: reviews.map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.author },
      reviewBody: r.reviewBody,
      reviewRating: {
        "@type": "Rating",
        ratingValue: r.ratingValue ?? 5,
        bestRating: 5,
      },
    })),
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      reviewCount: String(reviews.length),
      bestRating: "5",
    },
  };
}

export const HOMEPAGE_FAQS: FaqItem[] = [
  {
    question: "What is an ATS resume checker?",
    answer:
      "An ATS resume checker scans your resume against a job description to measure keyword match, formatting compatibility, and parsing accuracy. Applicant Tracking Systems filter resumes before a human recruiter sees them, so an ATS checker helps you identify gaps and improve your chances of passing automated screening.",
  },
  {
    question: "How do I optimize my resume for ATS?",
    answer:
      "Upload your resume and paste the full job description into our resume optimizer. Review your ATS score preview, then run optimization to align skills, keywords, and bullet points with the role. Use standard section headings, avoid complex tables, and download an ATS-friendly PDF or DOCX.",
  },
  {
    question: "What keywords should I include in my resume?",
    answer:
      "Include keywords from the job description: required skills, tools, certifications, and action verbs the employer uses. Mirror exact phrases where truthful, such as project management or Python. Our resume keyword optimizer highlights missing terms so you can tailor content without keyword stuffing.",
  },
  {
    question: "Is my resume ATS friendly?",
    answer:
      "Upload your resume to get an instant ATS compatibility score. We check parsing, section structure, keyword density, and common ATS pitfalls like images, headers, and non-standard fonts. Scores are estimates based on industry heuristics but closely reflect what major ATS platforms evaluate.",
  },
  {
    question: "Why do resumes get rejected by ATS systems?",
    answer:
      "Resumes fail ATS screening due to low keyword match, unreadable formatting, missing sections, or incorrect file types. Scanned PDFs, multi-column layouts, and graphics often break parsers. Tailoring your resume to the job description and using clean, text-based formats dramatically improves pass rates.",
  },
  {
    question: "How long should a resume be for ATS?",
    answer:
      "For most roles, one page is ideal for early-career candidates and two pages for experienced professionals. ATS systems do not penalize length directly, but concise, relevant content scores higher on keyword match. Remove outdated roles and focus on achievements aligned with the target job.",
  },
  {
    question: "What file format is best for ATS — PDF or Word?",
    answer:
      "DOCX and text-based PDF files work best for ATS. Avoid scanned PDFs, JPEG resumes, and design-heavy formats with text in images. When in doubt, export a simple DOCX with standard fonts like Arial or Calibri and clear section headings.",
  },
  {
    question: "Can I check if my resume is ATS compatible for free?",
    answer:
      "Yes. Our free ATS resume scanner lets you upload a resume and paste a job description without creating an account. You get an instant keyword match and ATS score preview. Sign in to optimize your resume — free accounts receive monthly credits plus a signup bonus.",
  },
  {
    question: "How does AI resume optimization work?",
    answer:
      "Our AI reads your resume and the job description, identifies missing keywords and weak bullet points, then rewrites content to improve ATS match while preserving your facts. You review a before-and-after score, a change log, and download an ATS-friendly file — no fabricated experience is added.",
  },
  {
    question: "What is a good ATS score for a resume?",
    answer:
      "Aim for 75% or higher keyword match against the specific job description. Scores above 85% typically pass initial ATS filters at most employers. Scores below 60% often mean missing required skills or formatting issues. Use our free checker to see your score before applying.",
  },
];
