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
  test(`VendorLens HTML selectors are intact on ${market.domain}`, async () => {
    // --- INITIAL SETUP ---
    test.setTimeout(90000);

    const pathToExtension = path.join(process.cwd(), "dist", "chrome");
    const userDataDir = path.join(
      process.cwd(),
      "e2e",
      "test-profiles",
      `chrome-html-profile`,
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

    // --- TESTS START ---

    await test.step("1. Check if sponsoredContainer selector is working", async () => {
      const sponsoredProductSelector = 'div[id^="anonCarousel"] li';
      const sponsoredProduct = page.locator(sponsoredProductSelector).first();

      await expect(sponsoredProduct).toBeVisible({ timeout: 10000 });
    });

    await test.step("2. Check if productContainer and sellerLink selectors are working", async () => {
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

      const productLink = productContainer.locator("a").first();
      await productLink.click();
    });

    await test.step("3. Check if merchantContainer selector is working", async () => {
      const sellerContainerSelector =
        'div.offer-display-feature-text[offer-display-feature-name="desktop-merchant-info"]';
      const sellerContainer = page.locator(sellerContainerSelector).first();

      await expect(sellerContainer).toBeVisible({ timeout: 10000 });
    });

    await test.step("4. Check if sellerLink selector is working", async () => {
      const sellerLinkSelector = "#sellerProfileTriggerId";
      const sellerLink = page.locator(sellerLinkSelector).first();

      await expect(sellerLink).toBeAttached({ timeout: 10000 });
      await sellerLink.click({ force: true });
    });

    await test.step("5. Check if imprintContainer selector is working", async () => {
      const imprintContainerSelector = "div#page-section-detail-seller-info";
      const imprintContainer = page.locator(imprintContainerSelector).first();

      await expect(imprintContainer).toBeVisible({ timeout: 10000 });
    });

    await browserContext.close();
  });
}
