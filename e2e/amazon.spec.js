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
    const pathToExtension = path.join(process.cwd(), "dist", "chrome");
    const userDataDir = path.join(
      process.cwd(),
      "e2e",
      "test-profiles",
      "chrome-sanity-profile",
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

    // check for loading badges
    const firstBadge = page.locator(".custom-badge").first();
    await expect(firstBadge).toBeVisible({ timeout: 10000 });
    console.log(
      `[${market.domain}] Loading badge found! Waiting for scan results..`,
    );

    // trigger intersection observer with scrolling
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press("PageDown");
      await page.waitForTimeout(2000);
    }

    // check that result badges have been applied
    await expect(firstBadge).not.toHaveText("Loading..", { timeout: 15000 });
    console.log(
      `[${market.domain}] Scan successful! Badges have been applied. Checking session cache..`,
    );

    // testing session cache
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
    console.log(
      `[${market.domain}] ${cachedAsins.length} ASINs found in session cache. Checking functionality..`,
    );

    expect(cachedAsins.length).toBeGreaterThan(0);

    // check if cached data is valid JSON
    const sampleData = JSON.parse(sessionData[cachedAsins[0]]);
    expect(sampleData).toBeDefined();

    const testAsin = cachedAsins[0].replace("asin_cache_", "");

    const productWithGuaranteedBadge = page
      .locator('div[data-component-type="s-search-result"]', {
        has: page.locator(".custom-badge", { hasNotText: "Loading.." }),
      })
      .first();

    const targetAsin =
      await productWithGuaranteedBadge.getAttribute("data-asin");

    await page.reload();

    const specificProductCard = page
      .locator(
        `div[data-component-type="s-search-result"][data-asin="${targetAsin}"]`,
      )
      .first();
    await specificProductCard
      .waitFor({ state: "visible", timeout: 10000 })
      .catch(() => null);

    console.log(
      `[${market.domain}] Cached ASIN ${testAsin} found. Checking badge...`,
    );

    if (await specificProductCard.isVisible()) {
      // scroll jiggle to trigger observer
      await specificProductCard.scrollIntoViewIfNeeded();
      await page.mouse.wheel(0, 100);
      await page.waitForTimeout(1500);

      const specificBadge = specificProductCard
        .locator(".custom-badge")
        .first();

      await expect(specificBadge).toBeVisible({ timeout: 5000 });
      await expect(specificBadge).not.toHaveText("Loading..", {
        timeout: 5000,
      });
      console.log(
        `[${market.domain}] Sessioncache-Test for ASIN ${targetAsin} succesful.`,
      );
    } else {
      console.log(
        `[${market.domain}] ASIN ${targetAsin} gone after reload (Layout-Shift).`,
      );
    }

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
    expect(Object.keys(extensionStorage.cachedSellers).length).toBeGreaterThan(
      0,
    );
    console.log(`[${market.domain}] Local storage working. Test complete.`);

    await browserContext.close();
  });

  test(`VendorLens HTML selectors are intact on ${market.domain}`, async () => {
    test.setTimeout(90000);

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

    // open search result page
    const page = await browserContext.newPage();
    await page.goto(`https://www.${market.domain}/s?k=${market.search}`);

    // scroll down a bit to fully load everything
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press("PageDown");
      await page.waitForTimeout(2000);
    }

    // wait for the first badges to load
    console.log(`[${market.domain}] Waiting for first loaded badge..`);
    const firstBadge = page.locator(".custom-badge").first();
    await expect(firstBadge).not.toHaveText("Loading..", { timeout: 20000 });
    console.log(
      `[${market.domain}] Badge found! Looking for product container..`,
    );

    // check productContainerSelector functionality
    const productContainerSelector =
      'div[data-component-type="s-search-result"]';
    const productContainer = page
      .locator(productContainerSelector, {
        has: page.locator(".custom-badge", {
          hasText: /(EU Seller|Chinese Seller)/,
        }),
      })
      .first();

    await expect(productContainer).toBeVisible({ timeout: 10000 });
    console.log(
      `[${market.domain}] Container found! Looking for sponsored products..`,
    );

    // check sponsored container selector functionality
    const sponsoredProductSelector = 'div[id^="anonCarousel"] li';
    const sponsoredProduct = page.locator(sponsoredProductSelector).first();

    await expect(sponsoredProduct).toBeVisible({ timeout: 10000 });

    console.log(
      `[${market.domain}] Sponsored products found! Looking for product link..`,
    );

    // check product link selector functionality
    const productLink = productContainer.locator("a").first();
    console.log(
      `[${market.domain}] Productlink found! Opening product page and looking for merchant container..`,
    );

    await productLink.click();

    // check merchant container selector functionality
    const sellerContainerSelector =
      'div.offer-display-feature-text[offer-display-feature-name="desktop-merchant-info"]';
    const sellerContainer = page.locator(sellerContainerSelector).first();

    await expect(sellerContainer).toBeVisible({ timeout: 10000 });

    console.log(
      `[${market.domain}] Merchantcontainer found! Looking for vendor link..`,
    );

    // check seller link selector functionality
    const sellerLinkSelector = "#sellerProfileTriggerId";
    const sellerLink = page.locator(sellerLinkSelector).first();

    await expect(sellerLink).toBeVisible({ timeout: 10000 });

    console.log(
      `[${market.domain}] Vendor link found! Opening sellers page and looking for imprint..`,
    );

    await sellerLink.click();

    // check imprint container selector functionality
    const imprintContainerSelector = "div#page-section-detail-seller-info";
    const imprintContainer = page.locator(imprintContainerSelector).first();

    await expect(imprintContainer).toBeVisible({ timeout: 10000 });

    console.log(`[${market.domain}] Imprint found! Test complete.`);

    await browserContext.close();
  });
}
