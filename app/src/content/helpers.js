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


// conditional export for jest (ignored by browser)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        extractAsinFromUrl
    };
}