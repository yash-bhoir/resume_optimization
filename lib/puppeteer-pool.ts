import type { Browser } from "puppeteer";
import puppeteer from "puppeteer";
import { getPuppeteerLaunchOptions } from "./puppeteer-browser";
import { logger } from "./logger";

const IDLE_TIMEOUT_MS = 60_000;
const MAX_PAGES_PER_BROWSER = 20;

let browser: Browser | null = null;
let idleTimer: ReturnType<typeof setTimeout> | null = null;
let pageCount = 0;
let launching: Promise<Browser> | null = null;

function scheduleIdleClose() {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    void closeBrowser();
  }, IDLE_TIMEOUT_MS);
}

export async function closeBrowser(): Promise<void> {
  if (idleTimer) {
    clearTimeout(idleTimer);
    idleTimer = null;
  }
  if (browser) {
    try {
      await browser.close();
    } catch (err) {
      logger.warn({ err }, "Puppeteer browser close failed");
    }
    browser = null;
    pageCount = 0;
  }
}

async function getBrowser(): Promise<Browser> {
  if (browser?.connected) return browser;

  if (launching) return launching;

  launching = (async () => {
    const launchOptions = getPuppeteerLaunchOptions();
    if (!launchOptions.executablePath) {
      throw new Error("PDF export needs Chrome or Edge installed");
    }
    const instance = await puppeteer.launch(launchOptions);
    browser = instance;
    pageCount = 0;
    instance.on("disconnected", () => {
      browser = null;
      pageCount = 0;
    });
    return instance;
  })();

  try {
    return await launching;
  } finally {
    launching = null;
  }
}

export async function withBrowserPage<T>(
  fn: (page: Awaited<ReturnType<Browser["newPage"]>>) => Promise<T>
): Promise<T> {
  if (idleTimer) {
    clearTimeout(idleTimer);
    idleTimer = null;
  }

  const instance = await getBrowser();

  if (pageCount >= MAX_PAGES_PER_BROWSER) {
    await closeBrowser();
    const fresh = await getBrowser();
    return runWithPage(fresh, fn);
  }

  return runWithPage(instance, fn);
}

async function runWithPage<T>(
  instance: Browser,
  fn: (page: Awaited<ReturnType<Browser["newPage"]>>) => Promise<T>
): Promise<T> {
  const page = await instance.newPage();
  pageCount += 1;
  try {
    return await fn(page);
  } finally {
    try {
      await page.close();
    } catch {
      /* ignore */
    }
    pageCount = Math.max(0, pageCount - 1);
    scheduleIdleClose();
  }
}
