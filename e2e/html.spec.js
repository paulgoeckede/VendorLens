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
    test.setTimeout(90000);

    const pathToExtension = path.join(process.cwd(), "dist", "chrome");
    const userDataDir = path.join(
      process.cwd(),
      "e2e",
      "test-profiles",
      `chrome-html-profile-${market.domain}`,
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
