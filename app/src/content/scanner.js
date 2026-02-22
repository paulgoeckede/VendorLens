let sellerCache = {}; // Cache for seller information to avoid redundant fetches
let isCacheLoaded = false; // flag to indicate if the cache has been loaded from storage
let currentDomain = window.location.hostname; // get TLD in form of www.amazon.**
currentDomain = currentDomain.replace("www.", "");
const activeConfig =
  localeConfigs[currentDomain] || localeConfigs["main_config"]; // grab corresponding querySelector keywords from localeConfigs, main_config as default

let config = {
  masterSwitch: true,
  hideChina: false,
  markEU: true,
};

/** LOAD SETTINGS AND CACHE */

// load config from storage and apply defaults if not set
chrome.storage.sync.get(config, (items) => {
  config = items;
  // console.log("Einstellungen geladen:", config);
});

// load seller cache from local storage on startup
chrome.storage.local.get(["cachedSellers"], (result) => {
  if (result.cachedSellers) {
    sellerCache = result.cachedSellers;
    // console.log("Verkäufer-Cache geladen: " + Object.keys(sellerCache).length + " Händler bekannt.");
  }
  isCacheLoaded = true;
  startScannerLoop();
});

// listen for settings updates from the extension popup and update config accordingly
chrome.runtime.onMessage.addListener((request) => {
  if (request.action === "updateSettings") {
    config = { ...config, ...request.settings };

    if (
      request.settings.hideChina !== undefined ||
      request.settings.masterSwitch !== undefined
    ) {
      location.reload();
    }
  }
});

// initialize an IntersectionObserver to detect when product elements come into view and trigger the scanning process
const observer = new IntersectionObserver(
  (entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const product = entry.target;
        obs.unobserve(product);
        startScan(product);
      }
    });
  },
  { rootMargin: "200px" },
);

/** MAIN FUNCTIONALITY */

/**
 * regularly scan the page for new product elements and observe them with the IntersectionObserver, but only after the cache has been loaded to ensure we have seller information available when products come into view
 * @returns {void}
 */
function startScannerLoop() {
  if (!config.masterSwitch) return; // do not scan any products if master switch is switched off

  setInterval(() => {
    if (!isCacheLoaded) return;
    const products = document.querySelectorAll(activeConfig.productContainer);

    if (products.length > 0) {
      products.forEach((product) => {
        if (product.dataset.isObserved) return;
        product.dataset.isObserved = "true";

        observer.observe(product);
      });
    }
  }, 1000);
}

/**
 * function to start the scanning process for a given product element.
 * @param {HTMLElement} product - the DOM-Element of a given product in the search results
 * @returns {void}
 */
function startScan(product) {
  if (product.dataset.isScanned) return;

  const allLinks = product.querySelectorAll(activeConfig.productLink);
  let cleanUrl = null;

  // scan all link elements for a valid ASIN and build the product URL
  for (let link of allLinks) {
    let href = link.getAttribute("href");
    if (!href || href === "#" || href.includes("javascript.")) continue;

    let foundAsin = extractAsinFromUrl(href);

    if (foundAsin) {
      cleanUrl = "/dp/" + foundAsin;

      const cachedData = sessionStorage.getItem("asin_cache_" + foundAsin);

      // completely skip background fetch if ASIN number is found in session cache
      if (cachedData) {
        const sellerInfo = JSON.parse(cachedData);
        product.dataset.isScanned = "true";

        applyBadge(product, sellerInfo);
        return;
      }
      break;
    }
  }

  if (!cleanUrl) {
    removeBadge(product);
    return;
  }

  product.dataset.isScanned = "true";
  createBadgeElement(product, "Loading..", "#e0e0e0", "#555", "logo-128.png"); // Loading badge

  const fetchUrl = "https://" + currentDomain + cleanUrl;

  const randomDelay = Math.floor(Math.random() * 1500) + 500;
  setTimeout(() => {
    startDeepScan(fetchUrl, product);
  }, randomDelay);
}

/**
 * - main function -
 * fetches the product page html and grabs the vendor information.
 * if third party seller, loads vendor imprint and scans for country, then applies appropriate badge.
 * @param {String} url - the product link url for the product to be checked
 * @param {HTMLElement} product - the DOM-Element of the product to be checked
 * @returns {void}
 */
function startDeepScan(url, product) {
  const link = url;
  // console.log("Starte Analyse für Produkt: " + link);

  chrome.runtime.sendMessage(
    {
      action: "fetchPage",
      url: link,
    },
    function (response) {
      if (response && response.html) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(response.html, "text/html");

        // find merchant info box on product page
        const merchantBox = doc.querySelector(activeConfig.merchantContainer);

        let sellerName = "";
        let sellerUrl = "";
        let isAmazon = false;

        if (merchantBox) {
          // check if there is a link to the seller profile (which is usually the case for third-party sellers)
          const linkElement =
            merchantBox.querySelector(activeConfig.merchantLink) ||
            merchantBox.querySelector('a[href*="seller="]');

          let sellerText;

          if (linkElement) {
            sellerText = linkElement.textContent.trim().toLowerCase();
          } else {
            sellerText = merchantBox.textContent.trim().toLowerCase();
          }

          if (sellerText.includes("amazon")) {
            sellerName = "Amazon";
            isAmazon = true;
          } else if (linkElement) {
            sellerName = linkElement.textContent.trim();
            sellerUrl = linkElement.getAttribute("href");

            // repair relative URLs
            if (sellerUrl && !sellerUrl.startsWith("http")) {
              sellerUrl = "https://www." + currentDomain + sellerUrl;
            }
          }
        } else {
          // Wenn kein Verkäufer Container auf der Produktseite gefunden wurde.
          // console.log("Layout-Fehler: Kein Verkäufer-Container gefunden.");
          removeBadge(product);
          return;
        }

        // final check to avoid empty seller names
        if (!sellerName) {
          // console.log("Container gefunden, aber Name leer.");
          removeBadge(product);
          return;
        }

        // check if we already have information about this seller in our cache to avoid unnecessary fetches of the seller profile page
        if (sellerCache[sellerName]) {
          const cachedData = sellerCache[sellerName];
          applyBadge(product, cachedData);

          // save asin info to session cache
          const foundAsin = extractAsinFromUrl(sellerUrl);
          if (foundAsin) {
            sessionStorage.setItem(
              "asin_cache_" + foundAsin,
              JSON.stringify(cachedData),
            );
          }

          return;
        }

        // check if the seller is Amazon itself based on the name or other indicators, as Amazon's own products often don't have a link to a seller profile and require a different handling than third-party sellers
        if (isAmazon || sellerName === "Amazon") {
          const resultData = {
            isFromChina: false,
            isEU: false,
            name: "Amazon",
            sellerUrl: "",
            text: "Verkauf und Versand durch Amazon",
          };

          // store and cache the results, apply badge, and return early since we don't need to fetch a seller profile for Amazon itself
          sellerCache["Amazon"] = resultData;
          chrome.storage.local.set({ cachedSellers: sellerCache });
          applyBadge(product, resultData);

          // save asin info to session cache
          const foundAsin = extractAsinFromUrl(sellerUrl);
          if (foundAsin) {
            sessionStorage.setItem(
              "asin_cache_" + foundAsin,
              JSON.stringify(resultData),
            );
          }

          return;
        }

        // case: third party seller
        if (sellerUrl) {
          // console.log("Händler neu: " + sellerName + ". Lade Impressum...");

          // fetch seller profile page through background script
          chrome.runtime.sendMessage(
            {
              action: "fetchPage",
              url: sellerUrl,
            },
            function (sellerResponse) {
              if (sellerResponse && sellerResponse.html) {
                const sellerDoc = parser.parseFromString(
                  sellerResponse.html,
                  "text/html",
                );

                // fetch imprint container
                const addressElement = sellerDoc.querySelector(
                  activeConfig.imprintContainer,
                );

                if (addressElement) {
                  const addressText = addressElement.textContent.trim();
                  const isFromChina = isChinaSeller(addressText); // check if the seller is from China based on the imprint information
                  let isEU = false;

                  if (!isFromChina) {
                    isEU = isEUSeller(addressText); // if not from China, check if it's from the EU based on the imprint information
                  }

                  const resultData = {
                    isFromChina: isFromChina,
                    isEU: isEU,
                    name: sellerName,
                    sellerUrl: sellerUrl,
                    text: addressText,
                  };

                  // store and cache the results for this seller to speed up future scans of products from the same seller and reduce the number of fetches needed
                  sellerCache[sellerName] = resultData;
                  chrome.storage.local.set({ cachedSellers: sellerCache });
                  applyBadge(product, resultData);

                  // save asin info to session cache
                  const foundAsin = extractAsinFromUrl(sellerUrl);
                  if (foundAsin) {
                    sessionStorage.setItem(
                      "asin_cache_" + foundAsin,
                      JSON.stringify(resultData),
                    );
                  }
                } else {
                  // console.log("Impressum nicht gefunden für: " + sellerName);
                  removeBadge(product);
                }
              }
            },
          );
        }
      } else {
        // Fehlerbehandlung für den ersten Fetch
        // console.log("Konnte Produktseite nicht laden.");
        removeBadge(product);
      }
    },
  );
}
