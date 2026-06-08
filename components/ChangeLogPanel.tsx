"use client";

import type { ChangeItem } from "@/types";

interface ChangeLogPanelProps {
  items: ChangeItem[];
  summaries?: string[];
}

export default function ChangeLogPanel({ items, summaries }: ChangeLogPanelProps) {
  const list =
    items.length > 0
      ? items
      : (summaries || []).map((s) => ({
          summary: s,
          section: "Change",
          type: "modified" as const,
        }));

  if (list.length === 0) return null;

  return (
    <div className="change-log-panel">
      <h3>What changed</h3>
      <ul className="change-log-detailed">
        {items.length > 0
          ? items.map((item, i) => (
              <li key={i} className="change-item">
                <span className="change-section">{item.section}</span>
                {item.summary}
              </li>
            ))
          : summaries?.map((s, i) => (
              <li key={i} className="change-item">
                {s}
              </li>
            ))}
      </ul>
    </div>
  );
}
