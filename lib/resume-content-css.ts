/** Shared resume typography — keep screen preview and PDF export in sync. */
export const RESUME_CONTENT_CSS = `
  .resume-header { text-align: center; margin-bottom: 8pt; }
  .resume-name { font-size: 14pt; font-weight: bold; line-height: 1.2; }
  .resume-name strong { font-weight: bold; }
  .resume-contact { font-size: 9pt; margin-top: 3pt; line-height: 1.3; }
  .resume-contact a { color: #000; text-decoration: none; }
  .pipe-sep { padding: 0 2pt; }
  .resume-section { margin-bottom: 6pt; }
  .resume-section-title {
    font-size: 10.5pt;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    border-bottom: 0.75pt solid #000;
    padding-bottom: 1pt;
    margin: 7pt 0 4pt;
  }
  .resume-summary { font-size: 10pt; line-height: 1.35; margin-bottom: 4pt; text-align: left; }
  .resume-summary strong { font-weight: bold; }
  .resume-subheading-list, .resume-project-list { list-style: none; }
  .resume-subheading, .resume-project { margin-bottom: 5pt; }
  .subheading-row, .project-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 10pt;
    font-size: 10pt;
    line-height: 1.2;
  }
  .subheading-title, .project-title { font-weight: bold; flex: 1; }
  .subheading-date, .project-date { font-weight: normal; white-space: nowrap; text-align: right; }
  .subheading-row.sub { margin-top: 1pt; }
  .subheading-subtitle { font-style: italic; flex: 1; font-size: 9.5pt; }
  .subheading-location { font-style: normal; font-size: 9.5pt; white-space: nowrap; text-align: right; }
  .project-title em { font-style: italic; font-weight: normal; }
  .resume-item-list { margin: 2pt 0 2pt 0.12in; padding: 0; list-style: none; }
  .resume-item-list li {
    position: relative;
    padding-left: 9pt;
    margin-bottom: 1.5pt;
    font-size: 9.5pt;
    line-height: 1.3;
    list-style: none;
  }
  .resume-item-list li::before { content: "•"; position: absolute; left: 0; font-size: 9pt; }
  .resume-item-list li strong { font-weight: bold; }
  .resume-skills .skill-line { font-size: 9.5pt; line-height: 1.35; margin-bottom: 1pt; }
  .resume-skills .skill-line strong { font-weight: bold; }
  a { color: #000; text-decoration: none; }
`;

/** CSS for Puppeteer PDF export — page margins only, no extra body padding. */
export const RESUME_PRINT_CSS = `
  @page { size: letter; margin: 0.5in; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: "Times New Roman", Times, serif;
    font-size: 10pt;
    line-height: 1.15;
    color: #000;
    padding: 0;
    margin: 0;
    width: 100%;
  }
  ${RESUME_CONTENT_CSS}
`;
