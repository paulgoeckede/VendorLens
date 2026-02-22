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
 * Function to check if seller is from China based on known keywords.
 * @param {String} text The imprint/adress information of a vendor
 * @returns {boolean} Returns whether the given vendor is based in China or Hongkong.
 */
function isChinaSeller(text) {
  if (!text) return false;

  const lowerText = text.toLowerCase();

  const hasKeyword = chinaKeywords.some((keyword) =>
    lowerText.includes(keyword),
  );
  if (hasKeyword) return true;

  if (text.includes("+86")) return true; // China
  if (text.includes("+852")) return true; // Hongkong

  if (text.includes("CN")) return true;
  if (text.includes("CHN")) return true;
  if (text.includes("HK")) return true;

  return false;
}

/**
 * Function to check if a vendor is from EU based on known keywords.
 * @param {String} text The imprint/adress information of a vendor.
 * @returns {String} Returns whether the given vendor is based in the EU.
 */
function isEUSeller(text) {
  if (!text) return false;

  const lowerText = text.toLowerCase();

  const hasCountryName = euKeywords.some((keyword) =>
    lowerText.includes(keyword),
  );
  if (hasCountryName) return true;

  const hasPhoneCode = euPhoneCodes.some((code) => text.includes(code));
  if (hasPhoneCode) return true;

  return false;
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
