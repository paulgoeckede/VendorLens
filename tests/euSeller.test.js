const { euKeywords, euPhoneCodes } = require('../app/src/content/i18n_config.js');

global.euKeywords = euKeywords;
global.euPhoneCodes = euPhoneCodes;

const { isEUSeller } = require('../app/src/content/helpers.js');

describe("isEUSeller", () => {

    test("returns false for empty or null inputs", () => {
        expect(isEUSeller(null)).toBe(false);
        expect(isEUSeller(undefined)).toBe(false);
        expect(isEUSeller("")).toBe(false);
    });

    test("detects EU countries case-insensitively", () => {
        expect(isEUSeller("Sitz in Deutschland")).toBe(true);
        expect(isEUSeller("Made in FRANCE")).toBe(true);
        expect(isEUSeller("Seller from iTaLy")).toBe(true);
    });

    test("detects countries with special characters and accents", () => {
        expect(isEUSeller("Ubicación: España")).toBe(true);
        expect(isEUSeller("Wien, Österreich")).toBe(true);
        expect(isEUSeller("Praha, Česko")).toBe(true);
        expect(isEUSeller("Nicosia, Kýpros")).toBe(true);
    });

    test("detects EU phone codes", () => {
        expect(isEUSeller("Call us at +49 123456789")).toBe(true);
        expect(isEUSeller("Tel: +33-98765432")).toBe(true);
        expect(isEUSeller("Contact: +43 123 456")).toBe(true);
    });

    test("returns false for non-EU texts", () => {
        expect(isEUSeller("Seller based in USA")).toBe(false);
        expect(isEUSeller("Tokyo, Japan")).toBe(false);
        expect(isEUSeller("Contact us at +1 555-1234")).toBe(false);
    });

    test("handles texts with numbers that are not valid EU phone codes", () => {
        expect(isEUSeller("Order number 4912345")).toBe(false);
        expect(isEUSeller("Call +14 91234")).toBe(false);
    });
});