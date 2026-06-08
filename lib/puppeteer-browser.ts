import { existsSync, readdirSync } from "fs";
import { homedir } from "os";
import { join } from "path";

const WINDOWS_BROWSER_PATHS = [
  process.env.PUPPETEER_EXECUTABLE_PATH,
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  join(homedir(), "AppData", "Local", "Google", "Chrome", "Application", "chrome.exe"),
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
].filter(Boolean) as string[];

function findPuppeteerCacheChrome(): string | undefined {
  const cacheRoot = join(homedir(), ".cache", "puppeteer", "chrome");
  if (!existsSync(cacheRoot)) return undefined;

  // Puppeteer stores chrome under win64-<version>/chrome-win64/chrome.exe
  try {
    for (const entry of readdirSync(cacheRoot)) {
      const candidate = join(
        cacheRoot,
        entry,
        "chrome-win64",
        "chrome.exe"
      );
      if (existsSync(candidate)) return candidate;
      const alt = join(cacheRoot, entry, "chrome-win", "chrome.exe");
      if (existsSync(alt)) return alt;
    }
  } catch {
    // ignore
  }
  return undefined;
}

export function resolveBrowserExecutable(): string | undefined {
  for (const p of WINDOWS_BROWSER_PATHS) {
    if (existsSync(p)) return p;
  }
  return findPuppeteerCacheChrome();
}

export function getPuppeteerLaunchOptions(): {
  headless: boolean;
  args: string[];
  executablePath?: string;
} {
  const executablePath = resolveBrowserExecutable();
  return {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    ...(executablePath ? { executablePath } : {}),
  };
}
