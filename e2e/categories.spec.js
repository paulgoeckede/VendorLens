import { test, chromium, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

const marketplaces = [
  {
    domain: "amazon.de",
    categoryLink: "https://www.amazon.de/b?node=569604",
    dealLink: "https://www.amazon.de/-/en/deals",
  },
  {
    domain: "amazon.com",
    categoryLink: "",
    dealLink: "https://www.amazon.com/-/en/deals",
  },
  {
    domain: "amazon.co.uk",
    categoryLink: "https://www.amazon.co.uk/b?node=560800",
    dealLink: "https://www.amazon.co.uk/-/en/deals",
  },
  {
    domain: "amazon.it",
    categoryLink: "https://www.amazon.it/b?node=460002031",
    dealLink: "https://www.amazon.it/-/en/deals",
  },
  {
    domain: "amazon.es",
    categoryLink: "https://www.amazon.es/b?node=599371031",
    dealLink: "https://www.amazon.es/-/en/deals",
  },
  {
    domain: "amazon.fr",
    categoryLink: "https://www.amazon.fr/b?node=13910671",
    dealLink: "https://www.amazon.fr/-/en/deals",
  },
];

for (const market of marketplaces) {
  test(`Edge case HTML selectors are working on ${market.domain}`, async () => {
    // --- INTITIAL SETUP ---
    const pathToExtension = path.join(process.cwd(), "dist", "chrome");
    const userDataDir = path.join(
      process.cwd(),
      "e2e",
      "test-profiles",
      `chrome-specific-html-profile`,
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
    (await (market.domain != "amazon.com"))
      ? page.goto(`${market.categoryLink}`)
      : page.goto(`${market.dealLink}`);

    // scroll down a bit to fully load everything
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press("PageDown");
      await page.waitForTimeout(2000);
    }

    // --- TESTS START ---
    if (market.domain != "amazon.com") {
      await test.step(`[${market.domain}] 1. Check if octopus selector is working`, async () => {
        const productSelector = "div.octopus-pc-card-content li";
        const product = page.locator(productSelector).first();

        await expect(product).toBeVisible({ timeout: 10000 });
      });

      await test.step(`[${market.domain}] 2. Check if categorie results selector is working`, async () => {
        const productSelector =
          "div._octopus-search-result-card_style_apbSearchResultItem__2-mx4";
        const product = page.locator(productSelector).first();

        await expect(product).toBeVisible({ timeout: 10000 });
      });
    }

    await page.goto(`${market.dealLink}`);

    await test.step(`[${market.domain}] 3. Check if deal item selector is working`, async () => {
      const productSelector =
        "div.ProductCard-module__card_uyr_Jh7WpSkPx4iEpn4w";
      const product = page.locator(productSelector).first();

      await expect(product).toBeVisible({ timeout: 10000 });
    });

    await browserContext.close();
  });
}
