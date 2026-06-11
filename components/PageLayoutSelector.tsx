"use client";

import type { PageLayoutMode } from "@/types";

interface PageLayoutSelectorProps {
  value: PageLayoutMode;
  onChange: (mode: PageLayoutMode) => void;
  disabled?: boolean;
}

const OPTIONS: { value: PageLayoutMode; label: string; hint: string }[] = [
  {
    value: "balanced",
    label: "Balanced",
    hint: "Keep all content; auto-expand if the page looks sparse",
  },
  {
    value: "single_page",
    label: "Fit to 1 page",
    hint: "Compress bullets and skills if content spills to a second page",
  },
  {
    value: "fill_page",
    label: "Fill the page",
    hint: "Expand sparse sections so the resume uses a full page",
  },
];

export default function PageLayoutSelector({
  value,
  onChange,
  disabled = false,
}: PageLayoutSelectorProps) {
  return (
    <fieldset className="page-layout-panel" disabled={disabled}>
      <legend className="page-layout-legend">Page layout</legend>
      <div className="page-layout-options">
        {OPTIONS.map((opt) => (
          <label key={opt.value} className="page-layout-option">
            <input
              type="radio"
              name="pageLayout"
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
            />
            <span className="page-layout-option-body">
              <span className="page-layout-option-label">{opt.label}</span>
              <span className="page-layout-option-hint">{opt.hint}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
