import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { IBM_Plex_Sans, Outfit } from "next/font/google";
import Analytics from "@/components/Analytics";
import ChunkLoadRecovery from "@/components/ChunkLoadRecovery";
import {
  BRAND_COLOR,
  DEFAULT_DESCRIPTION,
  HOMEPAGE_TITLE,
  SITE_NAME,
  absoluteUrl,
  buildOgImageUrl,
  getBaseUrl,
} from "@/lib/seo";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-outfit",
  weight: ["500", "600", "700"],
  preload: true,
});

const plex = IBM_Plex_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-plex",
  weight: ["400", "500", "600"],
  preload: true,
});

const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;
const ogImage = buildOgImageUrl(HOMEPAGE_TITLE, DEFAULT_DESCRIPTION, "home");

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  title: {
    default: HOMEPAGE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  category: "business",
  manifest: "/manifest.json",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: absoluteUrl("/"),
    siteName: SITE_NAME,
    title: HOMEPAGE_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        alt: `${HOMEPAGE_TITLE} — ${SITE_NAME}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: HOMEPAGE_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [ogImage],
  },
  ...(googleVerification
    ? { verification: { google: googleVerification } }
    : {}),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: BRAND_COLOR,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
    >
      <html lang="en" className={`${outfit.variable} ${plex.variable}`} suppressHydrationWarning>
        <head>
          {googleVerification ? (
            <meta name="google-site-verification" content={googleVerification} />
          ) : null}
          <link rel="preconnect" href="https://api.openai.com" />
          <link rel="dns-prefetch" href="https://api.openai.com" />
          <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
          <link rel="dns-prefetch" href="https://www.google-analytics.com" />
          <link rel="dns-prefetch" href="https://img.clerk.com" />
          <link rel="dns-prefetch" href="https://clerk.accounts.dev" />
        </head>
        <body suppressHydrationWarning>
          <ChunkLoadRecovery />
          {children}
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
