// function to extract a products ASIN from a given url
function extractAsinFromUrl(url) {
    if (!url) return null;

    try {
        let decodedUrl = url;

        // decode url
        while (decodedUrl.includes("%2F") || decodedUrl.includes("%252F")) {
            decodedUrl = decodeURIComponent(decodedUrl);
        }

        const regex = /(?:\/dp\/|\/product\/|\/d\/|\/aw\/d\/|asin=)([A-Z0-9]{10})(?:[/?&]|$)/i; // to filter out asin in url
        const match = decodedUrl.match(regex);

        if (match && match[1]) {
            return match[1];
        }

        // bruteforce fallback, most asins start with B0
        const b0Match = decodedUrl.match(/(B0[A-Z0-9]{8})/);
        if (b0Match && b0Match[1]) {
            return b0Match[1];
        }
    } catch (e) {

    }

    return null;
}


// function to check if seller is from china based on known keywords
function isChinaSeller(text) {
    if (!text) return false;

    const lowerText = text.toLowerCase();

    const hasKeyword = chinaKeywords.some(keyword => lowerText.includes(keyword));
    if (hasKeyword) return true;

    if (text.includes("+86")) return true; // China
    if (text.includes("+852")) return true; // Hongkong


    if (text.includes("CN")) return true;
    if (text.includes("CHN")) return true;
    if (text.includes("HK")) return true;

    return false;
}


// function to check if seller is from EU based on known keywords
function isEUSeller(text) {
    if (!text) return false;

    const lowerText = text.toLowerCase();

    const hasCountryName = euKeywords.some(keyword => lowerText.includes(keyword));
    if (hasCountryName) return true;

    const hasPhoneCode = euPhoneCodes.some(code => text.includes(code));
    if (hasPhoneCode) return true;

    return false;
}


// conditional export for jest (ignored by browser)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        extractAsinFromUrl,
        isChinaSeller,
        isEUSeller
    };
}