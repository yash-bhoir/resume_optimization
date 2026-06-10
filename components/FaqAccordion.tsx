import type { FaqItem } from "@/lib/structured-data";

interface FaqAccordionProps {
  items: FaqItem[];
  idPrefix?: string;
}

export default function FaqAccordion({ items, idPrefix = "faq" }: FaqAccordionProps) {
  return (
    <div className="faq-accordion">
      {items.map((item, index) => {
        const headingId = `${idPrefix}-q-${index}`;
        const panelId = `${idPrefix}-a-${index}`;
        return (
          <details key={headingId} className="faq-accordion-item">
            <summary id={headingId} className="faq-accordion-question">
              {item.question}
            </summary>
            <div id={panelId} className="faq-accordion-answer" role="region" aria-labelledby={headingId}>
              <p>{item.answer}</p>
            </div>
          </details>
        );
      })}
    </div>
  );
}
