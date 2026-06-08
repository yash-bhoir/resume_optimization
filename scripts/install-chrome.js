/**
 * Installs Puppeteer's bundled Chrome if no system browser is found.
 * Skips silently when Chrome/Edge is already available.
 */
const { existsSync } = require("fs");
const { homedir } = require("os");
const { join } = require("path");
const { execSync } = require("child_process");

const paths = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  join(homedir(), "AppData", "Local", "Google", "Chrome", "Application", "chrome.exe"),
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
];

const hasSystemBrowser = paths.some((p) => existsSync(p));
if (hasSystemBrowser) {
  console.log("System Chrome/Edge found — skipping Puppeteer Chrome download.");
  process.exit(0);
}

console.log("Installing Puppeteer Chrome for PDF export...");
try {
  execSync("npx puppeteer browsers install chrome", {
    stdio: "inherit",
    env: { ...process.env, PUPPETEER_SKIP_DOWNLOAD: "false" },
  });
} catch {
  console.warn(
    "Could not install Puppeteer Chrome. PDF export may fail until you run:\n" +
      "  npx puppeteer browsers install chrome"
  );
}
