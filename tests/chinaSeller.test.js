const { chinaKeywords } = require('../app/src/content/i18n_config.js');

global.chinaKeywords = chinaKeywords;

const { isChinaSeller } = require('../app/src/content/helpers.js');

describe("isChinaSeller (imprint parsing)", () => {
    test("returns false on empty input", () => {
        expect(isChinaSeller(null)).toBe(false);
        expect(isChinaSeller(undefined)).toBe(false);
        expect(isChinaSeller('')).toBe(false);
    });

    test("recognizes matching keywords from given array", () => {
        expect(isChinaSeller("based in Shenzhen, Guangdong")).toBe(true);
        expect(isChinaSeller("Company located in CHINA")).toBe(true); 
        expect(isChinaSeller("HongKong seller")).toBe(true);
    });

    test('recognizes chinese characters', () => {
        expect(isChinaSeller("深圳市")).toBe(true); // Shenzhen
        expect(isChinaSeller("中国")).toBe(true); // China
    });

    test("recognizes phone codes", () => {
        expect(isChinaSeller("Phone: +86 123456789")).toBe(true);
        expect(isChinaSeller("Tel: +852-98765432")).toBe(true);
    });

    test('recognizes case sensitive countrry codes', () => {
        expect(isChinaSeller("Country: CN")).toBe(true);
        expect(isChinaSeller("Region: HK")).toBe(true);
        expect(isChinaSeller("CHN")).toBe(true);
    });

    test("ignores country codes in lowercase", () => {
        expect(isChinaSeller("country: cn")).toBe(false); 
    });

    test("returns false on non-chinese or irrelevant inputs ", () => {
        expect(isChinaSeller("Sitz der Gesellschaft: München, Deutschland")).toBe(false);
        expect(isChinaSeller("Contact us at +49 89 123456")).toBe(false);
        expect(isChinaSeller("US Seller based in New York")).toBe(false);
    });
});