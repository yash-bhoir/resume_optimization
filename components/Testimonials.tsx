import JsonLd from "@/components/JsonLd";
import { reviewSchema } from "@/lib/structured-data";

const TESTIMONIALS = [
  {
    quote:
      "I uploaded my Word resume and kept the layout — only the bullet points changed. Got two callbacks the same week after using the ATS resume checker.",
    name: "Priya M.",
    role: "Software engineer",
  },
  {
    quote:
      "The before/after score and highlight diff made it obvious what keywords I was missing. Way better than a generic template tool for tailoring my resume.",
    name: "James K.",
    role: "Product manager",
  },
  {
    quote:
      "Pasted the job posting, ran one optimization, downloaded DOCX. The free resume optimizer output was actually usable — not just a score report.",
    name: "Elena R.",
    role: "Data analyst",
  },
] as const;

export default function Testimonials() {
  return (
    <section className="seo-section testimonials-section" aria-labelledby="testimonials-heading">
      <JsonLd
        data={reviewSchema(
          TESTIMONIALS.map((t) => ({
            author: t.name,
            reviewBody: t.quote,
            ratingValue: 5,
          }))
        )}
      />
      <h2 id="testimonials-heading">Resume Optimizer Results — Real Before &amp; After</h2>
      <p>
        Job seekers use our ATS checker to see keyword match improve before and after optimization.
        Average users report stronger alignment with job description requirements within one session.
      </p>
      <div className="testimonials-grid">
        {TESTIMONIALS.map((item) => (
          <blockquote key={item.name} className="testimonial-card">
            <p>&ldquo;{item.quote}&rdquo;</p>
            <footer>
              <cite>{item.name}</cite> — {item.role}
            </footer>
          </blockquote>
        ))}
      </div>
    </section>
  );
}
