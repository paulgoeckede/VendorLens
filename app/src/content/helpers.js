let chinaCounter = 0; // global counter for products from China displayed in the extension icon

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
  if (!text) return "UNKNOWN";

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

  return "UNKNOWN";
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

// conditional export for jest (ignored by browser)
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    extractAsinFromUrl,
    isChinaSeller,
    isEUSeller,
  };
}
