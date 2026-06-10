const TESTIMONIALS: { quote: string; name: string; role: string }[] = [
  {
    quote:
      "I uploaded my Word resume and kept the layout — only the bullet points changed. Got two callbacks the same week.",
    name: "Priya M.",
    role: "Software engineer",
  },
  {
    quote:
      "The before/after score and highlight diff made it obvious what keywords I was missing. Way better than a generic template tool.",
    name: "James K.",
    role: "Product manager",
  },
  {
    quote:
      "Pasted the job posting, ran one optimization, downloaded DOCX. Took longer than a score-only checker but the output was actually usable.",
    name: "Elena R.",
    role: "Data analyst",
  },
];

export default function TestimonialsSection() {
  return (
    <section className="seo-section testimonials-section" aria-labelledby="testimonials-heading">
      <h2 id="testimonials-heading">What job seekers say</h2>
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
