import type { Metadata } from "next";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import TrustSignals from "@/components/TrustSignals";
import { generateMetadata as buildSeo, PAGE_TITLES } from "@/lib/seo";
import { breadcrumbSchema, productPricingSchema } from "@/lib/structured-data";
import { getPricingSettings } from "@/lib/app-settings";
import { isStripeConfigured } from "@/lib/stripe";
import PricingCheckout from "@/components/PricingCheckout";
import PaymentSetupNotice from "@/components/PaymentSetupNotice";

export const metadata: Metadata = buildSeo({
  title: PAGE_TITLES.pricing,
  description:
    "Resume optimizer pricing: free ATS checker forever, Pro at $12/mo, Job Sprint one-time pack. Compare plans and start optimizing free — no credit card.",
  path: "/pricing",
  exactTitle: true,
  keywords: ["resume optimizer pricing", "ATS checker free vs paid", "best free ATS resume checker"],
});

export const dynamic = "force-dynamic";

const PRICING_FAQ = [
  {
    q: "Is the free plan really free?",
    a: "Yes. ATS score preview requires no account and no payment. Signed-in users receive free monthly optimization credits plus a signup bonus — no credit card required.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Pro is a monthly subscription you can cancel anytime from your billing portal. Job Sprint credits never expire and require no subscription.",
  },
  {
    q: "What's included in Pro?",
    a: "Pro includes up to 50 optimizations per month, unlimited PDF and DOCX downloads, preserve-layout mode, full ATS analysis reports, and priority processing.",
  },
] as const;

export default async function PricingPage() {
  const p = await getPricingSettings();
  const stripeEnabled = isStripeConfigured();
  const freeTotal = p.freeCreditsPerMonth + p.signupBonusCredits;

  return (
    <div className="app-shell">
      <JsonLd
        data={[
          productPricingSchema(),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Pricing", path: "/pricing" },
          ]),
        ]}
      />
      <AppHeader />
      <main className="app-main marketing-page">
        <h1>Simple, Transparent Pricing — Free ATS Resume Checker</h1>
        <p className="marketing-lead">
          ATS score preview is always free — no account needed. Sign in to optimize your resume.
          Each optimization uses <strong>1 credit</strong>. Downloads are included at no extra cost.
        </p>

        <TrustSignals />
        <PaymentSetupNotice stripeEnabled={stripeEnabled} />

        <div className="pricing-grid">
          <div className="pricing-card">
            <h2>Free</h2>
            <p className="pricing-price">$0</p>
            <ul>
              <li>ATS score preview — no account</li>
              <li>
                <strong>{p.freeCreditsPerMonth} credits/month</strong> when signed in
              </li>
              <li>
                <strong>+{p.signupBonusCredits} bonus credit</strong> on first sign-up (
                {freeTotal} total first month)
              </li>
              <li>PDF, DOCX, LaTeX downloads included</li>
              <li>Before/after scores &amp; change log</li>
            </ul>
            <Link href="/" className="btn btn-secondary">
              Start free
            </Link>
          </div>

          <div className="pricing-card featured">
            <h2>Pro</h2>
            <p className="pricing-price">
              ${p.proMonthlyPriceUsd}<span>/mo</span>
            </p>
            <ul>
              <li>
                Up to <strong>{p.proMonthlyCreditCap} optimizations/month</strong>
              </li>
              <li>Unlimited PDF &amp; DOCX downloads</li>
              <li>Preserve layout mode (DOCX)</li>
              <li>Full ATS analysis report</li>
              <li>Priority processing</li>
            </ul>
            <PricingCheckout
              product="pro"
              label={`Upgrade to Pro — $${p.proMonthlyPriceUsd}/mo`}
              stripeEnabled={stripeEnabled}
            />
          </div>

          <div className="pricing-card">
            <h2>Job Sprint</h2>
            <p className="pricing-price">
              ${p.creditPackPriceUsd}<span> one-time</span>
            </p>
            <ul>
              <li>
                <strong>{p.creditPackSize} credits</strong> — never expire
              </li>
              <li>No subscription required</li>
              <li>Downloads included with each optimization</li>
              <li>Perfect for active job search sprints</li>
            </ul>
            <PricingCheckout
              product="credit_pack"
              label={`Job Sprint — $${p.creditPackPriceUsd}`}
              className="btn btn-secondary"
              stripeEnabled={stripeEnabled}
            />
          </div>
        </div>

        <section className="seo-section pricing-comparison">
          <h2>Feature comparison</h2>
          <div className="table-scroll">
            <table className="pricing-table">
              <thead>
                <tr>
                  <th>Feature</th>
                  <th>Free</th>
                  <th>Pro</th>
                  <th>Job Sprint</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>ATS score preview</td>
                  <td>✓</td>
                  <td>✓</td>
                  <td>✓</td>
                </tr>
                <tr>
                  <td>Resume optimization</td>
                  <td>{p.freeCreditsPerMonth}/mo</td>
                  <td>{p.proMonthlyCreditCap}/mo</td>
                  <td>{p.creditPackSize} pack</td>
                </tr>
                <tr>
                  <td>PDF &amp; DOCX download</td>
                  <td>✓</td>
                  <td>✓</td>
                  <td>✓</td>
                </tr>
                <tr>
                  <td>Preserve layout mode</td>
                  <td>—</td>
                  <td>✓</td>
                  <td>—</td>
                </tr>
                <tr>
                  <td>Priority processing</td>
                  <td>—</td>
                  <td>✓</td>
                  <td>—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="seo-section">
          <h2>Pricing FAQ</h2>
          <div className="faq-accordion">
            {PRICING_FAQ.map((item) => (
              <details key={item.q} className="faq-accordion-item">
                <summary className="faq-accordion-question">{item.q}</summary>
                <div className="faq-accordion-answer">
                  <p>{item.a}</p>
                </div>
              </details>
            ))}
          </div>
          <p>
            <Link href="/faq">More ATS FAQ</Link> ·{" "}
            <Link href="/">Try the free ATS checker</Link>
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
