# Resume Optimizer

AI-powered resume tailoring app that optimizes your resume for a specific job description, formats it with a professional LaTeX template, and shows before/after ATS compatibility scores.

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-green)

## Dual optimization modes

| Mode | Best for | What changes |
|------|----------|--------------|
| **Keep my layout** | DOCX, LaTeX (.tex) | Content only — fonts, colors, columns stay the same |
| **Professional template** | PDF, TXT, image, or max ATS | Jake Gutierrez LaTeX layout |

- **DOCX preserve** — Original Word file styling via XML text replacement
- **LaTeX preserve** — In-place edit of `\resumeItem`, summary, and skills
- **PDF** — Layout preserve falls back to template (upload DOCX for exact design)

## Features

- **Upload & parse** — PDF, DOCX, TEX, TXT, or image resumes (OCR via Tesseract)
- **Review step** — Confirm parsed content before optimization
- **JD tailoring** — Paste a job description; keywords are injected into summary, experience, skills, and projects
- **Professional output** — Jake Gutierrez LaTeX template (fixed layout, 2 pages OK)
- **Before / after scores** — Keyword match, ATS score, and Enhancv-style category breakdown
- **Resume check report** — Issues by section (Contact, Summary, Experience, Skills, Content)
- **Pre-download checklist** — Summary tone, metrics, repetition, tailoring, contact
- **Side-by-side diff** — Highlight what changed between original and optimized resume
- **Export** — PDF, DOCX, `.tex`, and plain text
- **Edit mode** — Tweak the optimized resume in the browser before download
- **Auto quality retries** — Completeness, bullet metrics, and verb repetition fixes

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| AI | OpenAI API (`gpt-4o-mini` by default) |
| PDF export | Puppeteer (system Chrome/Edge) |
| Parsing | pdf-parse, mammoth, tesseract.js |
| Storage | Browser localStorage (session); optional MongoDB |

## Prerequisites

- **Node.js** 18+ and npm
- **OpenAI API key** — [platform.openai.com](https://platform.openai.com/api-keys)
- **Chrome or Edge** (for PDF export; installed automatically via postinstall when possible)

## Quick Start

```bash
# Clone the repository
git clone https://github.com/yash-bhoir/resume_optimization.git
cd resume_optimization

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local and set OPENAI_API_KEY

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

Create `.env.local` in the project root:

```env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
```

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | OpenAI API key for resume optimization |
| `OPENAI_MODEL` | No | Model name (default: `gpt-4o-mini`) |

> Never commit `.env` or `.env.local` — they are listed in `.gitignore`.

## How to Use

1. **Upload** your resume (DOCX for layout preserve, PDF for template mode).
2. Click **Parse & review resume** and confirm the extracted text is complete.
3. Choose **Keep my layout** or **Professional template**.
4. **Paste the full job description** (requirements, skills, responsibilities).
5. Click **Optimize for this job** and wait ~30–60 seconds.
5. On the **results** page, review:
   - Keyword match and ATS scores (before → after)
   - Category breakdown (Content, Tailoring, Repetition, etc.)
   - Pre-download checklist
   - Optimized resume preview or change diff
6. **Download** PDF/DOCX or edit inline, then export.

## Scoring System

Scores are **estimates** to guide improvements, not guarantees from real ATS vendors.

| Metric | Weight / meaning |
|--------|------------------|
| **Keyword match** | % of JD keywords found in resume |
| **ATS score** | Composite: keywords, skills, structure, parse quality, metrics, content |
| **Report score (0–100)** | Enhancv-style blend of content, tailoring, repetition, sections |
| **Category scores** | Content, Tailoring, Repetition, Quantifying impact, Sections, ATS essentials |

Optimization aims to **increase** scores by:

- Removing first-person summary ("I am…")
- Adding metrics to every bullet
- Varying repeated verbs (`designed`, `managed`, etc.)
- Mirroring exact JD terms (MERN, Express.js, RESTful APIs, etc.)

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/parse-resume` | POST | Upload file, return extracted text |
| `/api/optimize` | POST | Optimize resume for job description |
| `/api/export/pdf` | POST | Generate PDF from LaTeX |
| `/api/export/docx` | POST | Generate DOCX (from template HTML) |
| `/api/export/docx-preserve` | POST | Download layout-preserved DOCX |
| `/api/export/tex` | POST | Download `.tex` or `.txt` |
| `/api/session` | GET/POST | Session persistence (optional) |
| `/api/health` | GET | Health check |

## Project Structure

```
resume_optimization/
├── app/
│   ├── page.tsx              # Upload & optimize flow
│   ├── results/page.tsx      # Scores, report, preview, diff
│   └── api/                  # Backend routes
├── components/               # UI components
├── lib/
│   ├── openai.ts             # AI optimization + retries
│   ├── latex-template.ts     # Jake Gutierrez template & prompts
│   ├── ats-score.ts          # ATS scoring
│   ├── resume-analysis.ts    # Resume check report
│   ├── category-scores.ts    # Enhancv-style categories
│   ├── match-score.ts        # JD keyword matching
│   ├── metric-validator.ts   # Bullet metrics validation
│   ├── latex-to-html.ts      # LaTeX → HTML renderer
│   └── export.ts             # PDF/DOCX export
├── types/                    # TypeScript types
└── scripts/install-chrome.js # Puppeteer browser setup
```

## Scripts

```bash
npm run dev      # Start dev server (port 3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint
```

## Optimization Philosophy

- **Strengthen, don't shorten** — All jobs, projects, and bullets are preserved
- **Two pages is fine** — No aggressive one-page compression
- **Fixed template only** — Consistent Jake Gutierrez professional layout
- **Truthful metrics** — Prompts require numbers; content comes from your original resume

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 3000 in use | Next.js will use 3001, 3002, etc. — check terminal output |
| OpenAI quota / rate limit | Wait and retry; check billing on OpenAI dashboard |
| PDF export fails | Ensure Chrome or Edge is installed; run `npm install` again |
| Scores look wrong after old session | Re-optimize to refresh; old browser session data may be stale |
| Skills section cut off | Fixed in renderer — pull latest and re-optimize |

## Author

**Yash Bhoir** — [GitHub](https://github.com/yash-bhoir)

## License

This project is open source. Use and modify freely; attribution appreciated.
