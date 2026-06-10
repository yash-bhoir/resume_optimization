const ALLOWED_TAGS = [
  "a",
  "b",
  "br",
  "div",
  "em",
  "h1",
  "h2",
  "h3",
  "h4",
  "li",
  "mark",
  "ol",
  "p",
  "del",
  "span",
  "strong",
  "sub",
  "sup",
  "table",
  "tbody",
  "td",
  "th",
  "thead",
  "tr",
  "u",
  "ul",
];

const ALLOWED_ATTR = ["class", "href", "target", "rel", "data-field", "data-section", "aria-label"];

type DomPurifyLike = {
  sanitize: (html: string, config: Record<string, unknown>) => string;
};

let domPurifyPromise: Promise<DomPurifyLike> | null = null;

function loadDomPurify(): Promise<DomPurifyLike> {
  if (!domPurifyPromise) {
    domPurifyPromise = import("isomorphic-dompurify").then((mod) => mod.default);
  }
  return domPurifyPromise;
}

/** Lightweight strip for SSR — full DOMPurify runs on the client via sanitizeHtmlAsync. */
function stripDangerousHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
}

export function sanitizeHtml(html: string): string {
  // Sync path for SSR and client — we only sanitize HTML we generate in-app.
  // Avoid sync require() of isomorphic-dompurify (breaks Webpack client bundles).
  return stripDangerousHtml(html);
}

export async function sanitizeHtmlAsync(html: string): Promise<string> {
  const DOMPurify = await loadDomPurify();
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: true,
  });
}

export function sanitizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "#";

  try {
    const parsed = new URL(trimmed, "https://placeholder.local");
    const protocol = parsed.protocol.toLowerCase();
    if (protocol === "http:" || protocol === "https:" || protocol === "mailto:") {
      return trimmed;
    }
  } catch {
    /* invalid URL */
  }

  return "#";
}
