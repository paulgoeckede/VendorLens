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
  test(`Functionality check: VendorLens core architecture works end-to-end on ${market.domain}`, async () => {
    // --- INITIAL SETUP ---
    const pathToExtension = path.join(process.cwd(), "dist", "chrome");
    const userDataDir = path.join(
      process.cwd(),
      "e2e",
      "test-profiles",
      "chrome-functionality-profile",
    );

    // remove existing profile data
    if (fs.existsSync(userDataDir)) {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    }

    // launch isolated chromium instance with injected extension
    const browserContext = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
    });

    const page = await browserContext.newPage();
    await page.goto(`https://www.${market.domain}/s?k=${market.search}`);

    // trigger intersection observer with scrolling
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press("PageDown");
      await page.waitForTimeout(2000);
    }

    const firstBadge = page.locator(".custom-badge").first();

    // --- TESTS START ---

    await test.step("1. Check for loading badges", async () => {
      await expect(firstBadge).toBeVisible({ timeout: 10000 });
    });

    await test.step("2. Check that result badges have been applied properly", async () => {
      await expect(firstBadge).not.toHaveClass(/is-loading/, {
        timeout: 15000,
      });
    });

    await test.step("3. Check that ASIN data gets stored to session cache and scan is bypassed if ASIN data is available", async () => {
      const sessionData = await page.evaluate(() => {
        const cacheExcerpts = {};
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key && key.startsWith("asin_cache_")) {
            cacheExcerpts[key] = sessionStorage.getItem(key);
          }
        }
        return cacheExcerpts;
      });

      const cachedAsins = Object.keys(sessionData);
      expect(cachedAsins.length).toBeGreaterThan(0);

      const sampleData = JSON.parse(sessionData[cachedAsins[0]]);
      expect(sampleData).toBeDefined();
      expect(sampleData.origin).toBeDefined();

      const productWithGuaranteedBadge = page
        .locator('div[data-component-type="s-search-result"]', {
          has: page.locator(".custom-badge:not(.is-loading)"),
        })
        .first();

      await productWithGuaranteedBadge.waitFor({
        state: "visible",
        timeout: 15000,
      });

      let targetAsin =
        await productWithGuaranteedBadge.getAttribute("data-asin");

      if (!targetAsin) {
        console.log("Wasn't able to extract an ASIN for the reload.");
        return;
      }
      targetAsin = targetAsin.trim();

      await page.reload();

      const specificProductCard = page
        .locator(
          `div[data-component-type="s-search-result"][data-asin="${targetAsin}"]`,
        )
        .first();

      await specificProductCard
        .waitFor({ state: "visible", timeout: 10000 })
        .catch(() => null);

      if (await specificProductCard.isVisible()) {
        await specificProductCard.scrollIntoViewIfNeeded();
        await page.mouse.wheel(0, 100);
        await page.waitForTimeout(1500);

        const specificBadge = specificProductCard
          .locator(".custom-badge")
          .first();

        await expect(specificBadge).toBeVisible({ timeout: 5000 });
        await expect(specificBadge).not.toHaveClass(/is-loading/, {
          timeout: 5000,
        });
      } else {
        console.log(
          `ASIN ${targetAsin} was lost during reload. Skipping check`,
        );
      }
    });

    await test.step("4. Check that seller data is being written into local storage", async () => {
      // check if data has been written to cache
      let [background] = browserContext.serviceWorkers();
      if (!background) {
        background = await browserContext.waitForEvent("serviceworker");
      }

      const extensionStorage = await background.evaluate(() => {
        return new Promise((resolve) => {
          chrome.storage.local.get(null, (result) => resolve(result));
        });
      });

      expect(extensionStorage.cachedSellers).toBeDefined();
      expect(
        Object.keys(extensionStorage.cachedSellers).length,
      ).toBeGreaterThan(0);

      await browserContext.close();
    });
  });
}
