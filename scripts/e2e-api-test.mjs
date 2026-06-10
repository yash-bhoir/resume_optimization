/**
 * End-to-end API test script — run while dev server is up: npm run dev
 * Usage: node scripts/e2e-api-test.mjs [--optimize]
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";
import JSZip from "jszip";
import { createClerkClient } from "@clerk/backend";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnvLocal() {
  const envPath = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (key && !process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

const BASE = process.env.TEST_BASE_URL || "http://localhost:3000";
const RUN_OPTIMIZE = process.argv.includes("--optimize");
const CLERK_SECRET = process.env.CLERK_SECRET_KEY;

let clerkSessionToken = process.env.CLERK_SESSION_TOKEN || null;

const SAMPLE_JD = `
Senior Software Engineer — Acme Corp
Requirements: 5+ years experience with JavaScript, TypeScript, React, Next.js, Node.js,
RESTful APIs, MongoDB, AWS, Docker, CI/CD, Agile. Build scalable web applications.
Lead code reviews, mentor junior developers, collaborate with product and design teams.
Bachelor's degree in Computer Science or equivalent. Strong communication skills required.
`.trim();

const SAMPLE_RESUME = `
John Smith
Software Engineer | john.smith@email.com | (555) 123-4567 | linkedin.com/in/johnsmith

SUMMARY
Full-stack engineer with 6 years building React and Node.js applications serving 100k+ users.

EXPERIENCE
Software Engineer | Tech Corp | 2020–Present
- Built Next.js dashboard used by 50+ internal teams, reducing report time by 40%
- Designed RESTful APIs handling 2M requests/day with 99.9% uptime on AWS
- Led migration to TypeScript across 12 microservices, cutting production bugs by 35%

Junior Developer | Startup Inc | 2018–2020
- Developed React components for customer portal with 25k monthly active users
- Implemented MongoDB data layer and Docker-based CI/CD pipeline with GitHub Actions

EDUCATION
B.S. Computer Science | State University | 2018

SKILLS
JavaScript, TypeScript, React, Next.js, Node.js, MongoDB, AWS, Docker, Git, Agile
`.trim();

const results = [];

function pass(name, detail = "") {
  results.push({ name, ok: true, detail });
  console.log(`  ✅ ${name}${detail ? ` — ${detail}` : ""}`);
}

function fail(name, detail = "") {
  results.push({ name, ok: false, detail });
  console.log(`  ❌ ${name}${detail ? ` — ${detail}` : ""}`);
}

function skip(name, detail = "") {
  results.push({ name, ok: true, skipped: true, detail });
  console.log(`  ⏭️  ${name}${detail ? ` — ${detail}` : ""}`);
}

async function getClerkAuthHeaders() {
  if (!clerkSessionToken && CLERK_SECRET) {
    try {
      const clerk = createClerkClient({ secretKey: CLERK_SECRET });
      const { data: users } = await clerk.users.getUserList({ limit: 1 });
      let userId = RUN_OPTIMIZE ? null : users[0]?.id;
      if (!userId) {
        const user = await clerk.users.createUser({
          emailAddress: [`e2e+${Date.now()}@example.com`],
          skipPasswordRequirement: true,
        });
        userId = user.id;
      }
      const session = await clerk.sessions.createSession({ userId });
      const token = await clerk.sessions.getToken(session.id);
      clerkSessionToken = token.jwt;
      pass("Clerk session JWT created", `user=${userId.slice(0, 12)}…`);
    } catch (e) {
      fail("Clerk session JWT", e.message);
    }
  } else if (!clerkSessionToken && !CLERK_SECRET) {
    fail("Clerk session JWT", "CLERK_SECRET_KEY missing — check .env.local");
  }
  if (!clerkSessionToken) return {};
  return {
    Authorization: `Bearer ${clerkSessionToken}`,
  };
}

async function request(method, urlPath, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.authenticated) {
    Object.assign(headers, await getClerkAuthHeaders());
  }
  const res = await fetch(`${BASE}${urlPath}`, { method, ...options, headers });
  const contentType = res.headers.get("content-type") || "";
  let body;
  if (contentType.includes("application/json")) {
    body = await res.json();
  } else if (
    contentType.includes("application/pdf") ||
    contentType.includes("octet-stream") ||
    contentType.includes("wordprocessingml") ||
    contentType.includes("application/x-tex")
  ) {
    body = { _binary: true, size: (await res.arrayBuffer()).byteLength };
  } else if (contentType.includes("text/plain")) {
    const text = await res.text();
    body = { _text: text, size: text.length };
  } else {
    const text = await res.text();
    try {
      body = JSON.parse(text);
    } catch {
      body = { _text: text.slice(0, 200) };
    }
  }
  return { status: res.status, body, ok: res.ok };
}

async function createTestDocx(filePath) {
  const zip = new JSZip();
  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`
  );
  zip.file(
    "word/document.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body><w:p><w:r><w:t>${SAMPLE_RESUME.replace(/&/g, "&amp;").slice(0, 500)}</w:t></w:r></w:p></w:body>
</w:document>`
  );
  zip.file(
    "_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
  );
  const buf = await zip.generateAsync({ type: "nodebuffer" });
  fs.writeFileSync(filePath, buf);
  return buf;
}

async function main() {
  console.log(`\n🧪 E2E API tests → ${BASE}\n`);

  // --- Health ---
  console.log("── Public / health ──");
  try {
    const h = await request("GET", "/api/health");
    if (h.ok && h.body.status) pass("GET /api/health", `status=${h.body.status}, mongo=${h.body.checks?.mongodb}`);
    else fail("GET /api/health", JSON.stringify(h.body));
  } catch (e) {
    fail("GET /api/health", e.message);
    console.error("\n⚠️  Is the dev server running? Run: npm run dev\n");
    process.exit(1);
  }

  // --- Clerk public pages ---
  console.log("\n── Clerk / pages ──");
  for (const p of ["/", "/sign-in", "/sign-up", "/pricing", "/faq"]) {
    try {
      const r = await fetch(`${BASE}${p}`);
      if (r.status === 200) pass(`GET ${p}`, `HTTP ${r.status}`);
      else fail(`GET ${p}`, `HTTP ${r.status}`);
    } catch (e) {
      fail(`GET ${p}`, e.message);
    }
  }

  // --- Validation ---
  console.log("\n── Validation ──");
  const badJd = await request("POST", "/api/score-preview", {
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resumeText: SAMPLE_RESUME, jobDescription: "too short" }),
  });
  if (badJd.status === 400) pass("POST /api/score-preview rejects short JD", `HTTP ${badJd.status}`);
  else fail("POST /api/score-preview rejects short JD", `HTTP ${badJd.status}`);

  const emptyParse = await request("POST", "/api/parse-resume", { body: new FormData() });
  if (emptyParse.status === 400) pass("POST /api/parse-resume rejects empty upload");
  else fail("POST /api/parse-resume rejects empty upload", `HTTP ${emptyParse.status}`);

  // --- Score preview ---
  console.log("\n── Score preview ──");
  const preview = await request("POST", "/api/score-preview", {
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resumeText: SAMPLE_RESUME, jobDescription: SAMPLE_JD }),
  });
  if (preview.ok && typeof preview.body.matchScoreBefore === "number") {
    pass("POST /api/score-preview", `match=${preview.body.matchScoreBefore}%, ats=${preview.body.atsScoreBefore}`);
  } else fail("POST /api/score-preview", JSON.stringify(preview.body));

  // --- Parse resume ---
  console.log("\n── Parse resume ──");
  const fixturesDir = path.join(__dirname, "..", "scripts", "fixtures");
  fs.mkdirSync(fixturesDir, { recursive: true });
  const docxPath = path.join(fixturesDir, "test-resume.docx");
  const docxBuf = await createTestDocx(docxPath);

  const form = new FormData();
  form.append("file", new Blob([docxBuf], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }), "test-resume.docx");

  const parsed = await request("POST", "/api/parse-resume", { body: form });
  let parsedText = SAMPLE_RESUME;
  if (parsed.ok && parsed.body.rawText?.length >= 200) {
    parsedText = parsed.body.rawText;
    pass("POST /api/parse-resume (DOCX)", `${parsedText.length} chars extracted`);
  } else if (parsed.status === 429) {
    skip("POST /api/parse-resume (DOCX)", "rate limited — using built-in sample resume");
  } else {
    fail("POST /api/parse-resume (DOCX)", parsed.body.error || JSON.stringify(parsed.body).slice(0, 120));
  }

  // --- Clerk protected routes (no auth) ---
  console.log("\n── Clerk auth gates (no session) ──");
  const exportPdf = await request("POST", "/api/export/pdf", {
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ latexSource: "\\section{Test}" }),
  });
  if (exportPdf.status === 401) {
    pass("POST /api/export/pdf blocked without auth", `HTTP ${exportPdf.status}`);
  } else fail("POST /api/export/pdf blocked without auth", `HTTP ${exportPdf.status} ${JSON.stringify(exportPdf.body).slice(0, 60)}`);

  const usage = await request("GET", "/api/usage");
  if (usage.status === 401) {
    pass("GET /api/usage blocked without auth", `HTTP ${usage.status}`);
  } else fail("GET /api/usage blocked without auth", `HTTP ${usage.status}`);

  const session = await request("POST", "/api/session", {
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId: "00000000-0000-0000-0000-000000000001", data: {} }),
  });
  if (session.status === 401) {
    pass("POST /api/session blocked without auth", `HTTP ${session.status}`);
  } else fail("POST /api/session blocked without auth", `HTTP ${session.status}`);

  // --- Clerk authenticated routes ---
  console.log("\n── Clerk authenticated routes ──");
  const usageAuthed = await request("GET", "/api/usage", { authenticated: true });
  if (usageAuthed.ok && usageAuthed.body.plan) {
    pass("GET /api/usage (Clerk authed)", `plan=${usageAuthed.body.plan}, opts=${usageAuthed.body.optimizations?.used}/${usageAuthed.body.optimizations?.limit}`);
  } else if (usageAuthed.status === 401) {
    fail("GET /api/usage (Clerk authed)", "401 — session JWT not accepted");
  } else {
    fail("GET /api/usage (Clerk authed)", `HTTP ${usageAuthed.status} ${JSON.stringify(usageAuthed.body).slice(0, 80)}`);
  }

  const sessionAuthed = await request("POST", "/api/session", {
    authenticated: true,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: randomUUID(),
      data: { rawText: "test" },
    }),
  });
  if (sessionAuthed.ok) pass("POST /api/session (Clerk authed)", "saved");
  else if (sessionAuthed.status === 401) fail("POST /api/session (Clerk authed)", "401 unauthorized");
  else fail("POST /api/session (Clerk authed)", JSON.stringify(sessionAuthed.body).slice(0, 100));

  // --- Optimize (optional — costs OpenAI) ---
  let latexSource = "";
  if (RUN_OPTIMIZE) {
    console.log("\n── Optimize (calls OpenAI ~30-90s) ──");
    const optimizeBody = {
      resumeText: parsedText,
      jobDescription: SAMPLE_JD,
      optimizationMode: "template",
      detectedFormat: "docx",
    };

    let opt = await request("POST", "/api/optimize", {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(optimizeBody),
    });

    if (
      !opt.ok &&
      (opt.status === 401 || opt.body.code === "LOGIN_REQUIRED") &&
      CLERK_SECRET
    ) {
      opt = await request("POST", "/api/optimize", {
        authenticated: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(optimizeBody),
      });
    }

    if (opt.ok && opt.body.latexSource) {
      latexSource = opt.body.latexSource;
      pass(
        "POST /api/optimize",
        `before=${opt.body.matchScoreBefore}% → after=${opt.body.matchScoreAfter}%`
      );
    } else if (opt.status === 429) {
      skip("POST /api/optimize", "rate limited — restart dev server or wait 1 hour");
    } else if (opt.status === 403 && opt.body.code === "CREDITS_EXCEEDED") {
      fail("POST /api/optimize", "out of credits — check admin panel or wait for reset");
    } else {
      fail("POST /api/optimize", opt.body.error || JSON.stringify(opt.body).slice(0, 150));
    }
  } else {
    console.log("\n── Optimize (skipped) ──");
    console.log("  ⏭️  Pass --optimize to run OpenAI optimization test");
  }

  // --- Authenticated export ---
  if (latexSource) {
    console.log("\n── Authenticated export ──");
    const exportBody = { latexSource };
    const exportRoutes = [
      ["POST /api/export/pdf", "/api/export/pdf", exportBody],
      ["POST /api/export/docx", "/api/export/docx", exportBody],
      ["POST /api/export/tex", "/api/export/tex", { ...exportBody, format: "txt" }],
    ];

    let downloadQuotaHit = false;
    for (const [name, routePath, body] of exportRoutes) {
      const r = await request("POST", routePath, {
        authenticated: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (r.ok && (r.body._binary || r.body._text)) {
        pass(name, `${r.body.size} bytes`);
      } else if (r.status === 401) {
        fail(name, "401 unauthorized");
      } else if (r.status === 403 && r.body.code === "QUOTA_EXCEEDED") {
        downloadQuotaHit = true;
        skip(name, "download quota exceeded (free tier: 1/month)");
      } else if (r.status === 429) {
        skip(name, "rate limited");
      } else {
        fail(name, `HTTP ${r.status} ${JSON.stringify(r.body).slice(0, 80)}`);
      }
    }

    if (!downloadQuotaHit) {
      const preserveDocx = await request("POST", "/api/export/docx-preserve", {
        authenticated: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preservedDocxBase64: docxBuf.toString("base64") }),
      });
      if (preserveDocx.ok && preserveDocx.body._binary) {
        pass("POST /api/export/docx-preserve", `${preserveDocx.body.size} bytes`);
      } else if (preserveDocx.status === 403 && preserveDocx.body.code === "QUOTA_EXCEEDED") {
        skip("POST /api/export/docx-preserve", "download quota exceeded (free tier: 1/month)");
      } else if (preserveDocx.status === 401) {
        fail("POST /api/export/docx-preserve", "401 unauthorized");
      } else {
        fail("POST /api/export/docx-preserve", `HTTP ${preserveDocx.status}`);
      }
    } else {
      skip("POST /api/export/docx-preserve", "skipped after download quota used");
    }
  } else if (RUN_OPTIMIZE) {
    console.log("\n── Authenticated export (skipped — no latex) ──");
  }

  // --- Summary ---
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${"═".repeat(50)}`);
  console.log(`Results: ${passed} passed, ${failed} failed, ${results.length} total`);
  console.log(`${"═".repeat(50)}\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
