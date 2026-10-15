let chinaCounter = 0; // global counter for products from China displayed in the extension icon
const MILESTONES = [150, 300, 500, 1000]; // milestones for the toast notification

/**
 * Function to extract a products ASIN from a given URL
 * @param {String} url The URL which the ASIN should be extracted from
 * @returns {String} The ASIN code which was extracted from the given URL.
 */
function extractAsinFromUrl(url) {
  if (!url) return null;

  try {
    let decodedUrl = url;

    // decode url
    while (decodedUrl.includes("%2F") || decodedUrl.includes("%252F")) {
      decodedUrl = decodeURIComponent(decodedUrl);
    }

    const regex =
      /(?:\/dp\/|\/product\/|\/d\/|\/aw\/d\/|asin=)([A-Z0-9]{10})(?:[/?&]|$)/i; // to filter out asin in url
    const match = decodedUrl.match(regex);

    if (match && match[1]) {
      return match[1];
    }

    // bruteforce fallback, most asins start with B0
    const b0Match = decodedUrl.match(/(B0[A-Z0-9]{8})/);
    if (b0Match && b0Match[1]) {
      return b0Match[1];
    }
  } catch (e) {}

  return null;
}

/**
 * Function to check a given imprint text against known keywords to identify a sellers origin.
 * @param {String} text A sellers imprint
 * @returns {String} The sellers country code or UNKNOWN
 */
function detectSellerOrigin(text) {
  if (!text) return "INTERNATIONAL";

  const lowerText = text.toLowerCase();

  // check imprint text for country codes
  for (const rule of regionRules) {
    if (rule.exactMatches && rule.exactMatches.length > 0) {
      for (const match of rule.exactMatches) {
        const regex = new RegExp(`>[\\s\\n]*${match}[\\s\\n]*<`); // format >US<, >DE<, >FR< and so on..
        if (regex.test(text)) {
          return rule.id;
        }
      }
    }
  }

  // check imprint text for known country keywords
  for (const rule of regionRules) {
    if (rule.keywords && rule.keywords.some((kw) => lowerText.includes(kw))) {
      return rule.id;
    }
  }

  // double check if text includes chinese phonenumbers if no keywords matched
  if (text.includes("+86") || text.includes("+852")) {
    return "CN";
  }

  return "INTERNATIONAL";
}

/**
 * Function to increment the China product counter and update the badge in the extension icon.
 * Calls action "updateBadge" in the background worker.
 */
function incrementChinaCounter() {
  chinaCounter++;
  chrome.runtime.sendMessage({
    action: "updateBadge",
    count: chinaCounter,
  });
}

/**
 * Function to save the ASIN from a given product to session Cache
 * @param {HTMLElement} product Product element on search result page
 * @param {String} productLink Link to product page as fallback
 * @param {Object} cachedData Seller info to be saved
 */
function saveAsinToSessionCache(product, productLink, cachedData) {
  const asinContainer = product.closest("[data-asin]");
  const foundAsin = asinContainer
    ? asinContainer.getAttribute("data-asin")
    : extractAsinFromUrl(productLink);

  if (foundAsin) {
    sessionStorage.setItem(
      "asin_cache_" + foundAsin,
      JSON.stringify(cachedData),
    );
  }
}

// conditional export for jest (ignored by browser)
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    extractAsinFromUrl,
    detectSellerOrigin,
    saveAsinToSessionCache,
  };
}

// call this function if a vendor has been succesfully scanned
function recordSuccessfulScan(isChina = false) {
  chrome.storage.local.get(
    { scannedCount: 0, milestoneDismissed: false, chinaCount: 0 },
    (data) => {
      const newCount = data.scannedCount + 1;
      const newChinaCount = isChina ? data.chinaCount + 1 : data.chinaCount;
      chrome.storage.local.set({
        scannedCount: newCount,
        chinaCount: newChinaCount,
      });

      // show milestone toast if the scanned count reaches a milestone and the user hasn't dismissed it yet
      if (
        MILESTONES.includes(newCount) &&
        !data.milestoneDismissed &&
        !document.getElementById("vl-milestone-toast")
      ) {
        showMilestoneToast(newCount);
      } else if (
        newCount > 1000 &&
        newCount % 1000 === 0 &&
        !data.milestoneDismissed &&
        !document.getElementById("vl-milestone-toast")
      ) {
        showMilestoneToast(newCount);
      }
    },
  );
}

function showMilestoneToast(count) {
  const safeCount = Number(count) || 0; // Ensure count is a number
  const toast = document.createElement("div");
  toast.id = "vl-milestone-toast";
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 280px;
    background: #ffffff;
    border: 1px solid #d5d9d9;
    border-left: 4px solid #FF5E5B;
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.14);
    padding: 14px;
    z-index: 2147483647;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
    color: #0F1111;
    font-size: 13px;
    line-height: 1.4;
  `;

  toast.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 6px;">
      <strong style="font-size: 14px;">🎉 ${safeCount} Products Analyzed!</strong>
      <button id="vl-close-toast" style="background:none; border:none; cursor:pointer; font-size:16px; color:#565959; padding:0; line-height:1;">&times;</button>
    </div>
    <p style="margin: 0 0 10px 0; font-size: 12px; color: #565959;">
      VendorLens is built by a CS student — 100% ad-free & no tracking. Has it saved you from a bad purchase yet?
    </p>
    <div style="display: flex; gap: 8px; align-items: center;">
      <a id="vl-kofi-link" href="https://ko-fi.com/VendorLens" target="_blank" rel="noopener noreferrer"
         style="flex: 1; text-align: center; background: #FF5E5B; color: #fff; text-decoration: none; padding: 6px 10px; border-radius: 5px; font-weight: 600; font-size: 12px;">
        ☕ Buy me a coffee ($3)
      </a>
      <button id="vl-dismiss-btn" style="background: none; border: none; color: #565959; font-size: 11px; cursor: pointer; text-decoration: underline;">
        Don't show again
      </button>
    </div>
  `;

  document.body.appendChild(toast);

  const dismissPermanently = () => {
    chrome.storage.local.set({ milestoneDismissed: true });
    toast.remove();
  };

  const dismissTemporarily = () => {
    toast.remove();
  };

  document
    .getElementById("vl-close-toast")
    .addEventListener("click", dismissTemporarily);
  document
    .getElementById("vl-dismiss-btn")
    .addEventListener("click", dismissPermanently);
  document
    .getElementById("vl-kofi-link")
    .addEventListener("click", dismissTemporarily);
}
