// tests/helpers.test.js

const { extractAsinFromUrl } = require('../app/src/content/helpers.js');


describe("ASIN Extraction (extractAsinFromUrl)", () => {

    test("return null on empty inputs", () => {
        expect(extractAsinFromUrl(null)).toBeNull();
        expect(extractAsinFromUrl(undefined)).toBeNull();
        expect(extractAsinFromUrl("")).toBeNull();
    });

    test("finds ASIN in regular urls", () => {
        expect(extractAsinFromUrl("https://www.amazon.de/dp/B08N5WRWNW")).toBe("B08N5WRWNW");
        expect(extractAsinFromUrl("https://www.amazon.it/Irgendein-Name/dp/B08N5WRWNW/ref=sr_1_1")).toBe("B08N5WRWNW");
        expect(extractAsinFromUrl("https://www.amazon.com/gp/product/B08N5WRWNW")).toBe("B08N5WRWNW");
    });

    test("finds ASIN in alternative urls", () => {
        expect(extractAsinFromUrl("https://www.amazon.de/d/B08N5WRWNW")).toBe("B08N5WRWNW");
        expect(extractAsinFromUrl("https://www.amazon.fr/aw/d/B08N5WRWNW")).toBe("B08N5WRWNW");
        expect(extractAsinFromUrl("https://www.amazon.com/s?k=test&asin=B08N5WRWNW")).toBe("B08N5WRWNW");
        expect(extractAsinFromUrl("https://www.amazon.co.uk/dp/s?k=test/dp/B08N5WRWNW")).toBe("B08N5WRWNW");
    });

    test("decodes single and double encoded URLs", () => {
        expect(extractAsinFromUrl("https://amazon.de/click?url=%2Fdp%2FB08N5WRWNW%3Fref%3D123")).toBe("B08N5WRWNW");
        expect(extractAsinFromUrl("https://amazon.de/click?url=%252Fdp%252FB08N5WRWNW")).toBe("B08N5WRWNW");
    });

    test("uses bruteforce-fallback on irregular URLs", () => {
        expect(extractAsinFromUrl("https://www.amazon.de/unbekannter-pfad/B08N5WRWNW?ref=test")).toBe("B08N5WRWNW");
    });

    test("returns null, if no ASIN is found", () => {
        expect(extractAsinFromUrl("https://www.amazon.de/gp/cart/view.html")).toBeNull();
        expect(extractAsinFromUrl("https://www.google.de")).toBeNull();
    });

    test("catches error on invalid URI-Encoding", () => {
        expect(extractAsinFromUrl("https://amazon.de/click?url=%2Fdp%2FB08N5WRWNW%A")).toBeNull();    
    });

    test("ignores broken URL parameters if ASIN is readable", () => {
        expect(extractAsinFromUrl("https://amazon.de/dp/B08N5WRWNW?test=%A")).toBe("B08N5WRWNW");
    });
});