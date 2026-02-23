import { test, chromium, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

const marketplaces = [
  { domain: "amazon.de", search: "hdmi+cable" },
  { domain: "amazon.com", search: "hdmi+cable" },
  { domain: "amazon.co.uk", search: "hdmi+cable" },
  { domain: "amazon.it", search: "hdmi+cable" },
  { domain: "amazon.es", search: "hdmi+cable" },
  { domain: "amazon.fr", search: "hdmi+cable" },
];

for (const market of marketplaces) {
  test(`VendorLens Extension loads on ${market.domain} and applies loading badges`, async () => {
    const pathToExtension = path.join(process.cwd(), "dist", "chrome");
    const userDataDir = path.join(
      process.cwd(),
      "e2e",
      "test-profiles",
      `chrome-test-profile-${market.domain}`,
    );

    // delete test-profile folder if it exists for a clean state
    if (fs.existsSync(userDataDir)) {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    }

    // start Chromium browser with injected extension
    const browserContext = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36", // to avoid bot detection
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
    });

    const page = await browserContext.newPage();

    await page.goto(`https://www.${market.domain}/s?k=${market.search}`);
    const badge = page.locator(".custom-badge").first();
    await expect(badge).toBeVisible({ timeout: 15000 });
    await expect(badge).toHaveText("Loading..");
    await browserContext.close();
  });

  test(`VendorLens Extension loads on ${market.domain} and applies different seller type badges`, async () => {
    const pathToExtension = path.join(process.cwd(), "dist", "chrome");
    const userDataDir = path.join(
      process.cwd(),
      "e2e",
      "test-profiles",
      `chrome-test-profile-${market.domain}`,
    );

    // delete test-profile folder if it exists for a clean state
    if (fs.existsSync(userDataDir)) {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    }

    // start Chromium browser with injected extension
    const browserContext = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36", // to avoid bot detection
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
    });

    const page = await browserContext.newPage();

    await page.goto(`https://www.${market.domain}/s?k=${market.search}`);

    for (let i = 0; i < 5; i++) {
      await page.mouse.wheel(0, 1500);
      await page.waitForTimeout(2000);
    }

    const amazonBadge = page
      .locator(".custom-badge", { hasText: "Amazon" })
      .first();
    const chineseSellerBadge = page
      .locator(".custom-badge", { hasText: "Chinese Seller" })
      .first();

    await expect(amazonBadge).toBeVisible({ timeout: 10000 });
    if (market.domain != "amazon.com" && market.domain != "amazon.co.uk") {
      const euSellerBadge = page
        .locator(".custom-badge", { hasText: "EU Seller" })
        .first();
      await expect(euSellerBadge).toBeVisible({ timeout: 10000 });
    }
    await expect(chineseSellerBadge).toBeVisible({ timeout: 10000 });

    await browserContext.close();
  });

  test(`VendorLens extension caches seller data on ${market.domain}`, async () => {
    const pathToExtension = path.join(process.cwd(), "dist", "chrome");
    const userDataDir = path.join(
      process.cwd(),
      "e2e",
      "test-profiles",
      `chrome-test-profile-cache-${market.domain}`,
    );

    // delete test-profile folder if it exists for a clean state
    if (fs.existsSync(userDataDir)) {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    }

    // start Chromium browser with injected extension
    const browserContext = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36", // to avoid bot detection
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
    });

    const page = await browserContext.newPage();
    await page.goto(`https://www.${market.domain}/s?k=${market.search}`);

    const badge = page.locator(".custom-badge").first();

    // wait for product check to be finished
    await expect(badge).toBeVisible({ timeout: 15000 });
    await expect(badge).not.toHaveText("Loading..", { timeout: 15000 });

    // grab extension cache
    let [background] = browserContext.serviceWorkers();
    if (!background) {
      background = await browserContext.waitForEvent("serviceworker");
    }

    const extensionStorage = await background.evaluate(() => {
      return new Promise((resolve) => {
        chrome.storage.local.get(null, (result) => {
          resolve(result);
        });
      });
    });

    // check if items have been stored in extension cache
    expect(extensionStorage.cachedSellers).toBeDefined();
    expect(Object.keys(extensionStorage.cachedSellers).length).toBeGreaterThan(
      0,
    );

    await browserContext.close();
  });
}
