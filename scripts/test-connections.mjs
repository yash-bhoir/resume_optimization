import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

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
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnvLocal();

const results = [];

function pass(name, detail = "") {
  results.push({ name, ok: true, detail });
  console.log(`✅ ${name}${detail ? ` — ${detail}` : ""}`);
}

function fail(name, detail = "") {
  results.push({ name, ok: false, detail });
  console.log(`❌ ${name}${detail ? ` — ${detail}` : ""}`);
}

async function testMongo() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    fail("MongoDB", "MONGODB_URI not set");
    return;
  }
  try {
    const mongoose = (await import("mongoose")).default;
    const start = Date.now();
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    await mongoose.connection.db.admin().ping();
    const latency = Date.now() - start;
    await mongoose.disconnect();
    pass("MongoDB", `ping ok (${latency}ms)`);
  } catch (err) {
    fail("MongoDB", err instanceof Error ? err.message : String(err));
  }
}

async function testUpstash() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    fail("Upstash Redis", "UPSTASH_REDIS_REST_URL or TOKEN not set");
    return;
  }
  try {
    const { Redis } = await import("@upstash/redis");
    const redis = new Redis({ url, token });
    const pong = await redis.ping();
    pass("Upstash Redis", `ping: ${pong}`);
  } catch (err) {
    fail("Upstash Redis", err instanceof Error ? err.message : String(err));
  }
}

function testOpenAI() {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    fail("OpenAI", "OPENAI_API_KEY not set");
    return;
  }
  if (!key.startsWith("sk-")) {
    fail("OpenAI", "key format looks invalid");
    return;
  }
  pass("OpenAI", `key present (model: ${process.env.OPENAI_MODEL || "gpt-4o-mini"})`);
}

function testClerk() {
  const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
  const sk = process.env.CLERK_SECRET_KEY?.trim();
  if (!pk || !sk) {
    fail("Clerk", "publishable or secret key missing");
    return;
  }
  const mode = pk.startsWith("pk_live_") ? "live" : pk.startsWith("pk_test_") ? "test" : "unknown";
  pass("Clerk", `keys present (${mode} mode)`);
}

console.log("\nConnection tests (from .env.local)\n");

testOpenAI();
testClerk();
await testMongo();
await testUpstash();

const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} passed\n`);
process.exit(failed > 0 ? 1 : 0);
