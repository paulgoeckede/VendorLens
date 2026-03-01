// mock data for regionRules
global.regionRules = [
  {
    id: "DE",
    keywords: ["berlin", "münchen", "gmbh"],
    exactMatches: ["DE", "DEU"],
  },
  {
    id: "US",
    keywords: ["new york", "llc"],
    exactMatches: ["US", "USA"],
  },
  {
    id: "FR",
    keywords: ["paris", "sas"],
    exactMatches: ["FR"],
  },
  {
    id: "CN",
    keywords: ["shenzhen", "dongguan"],
    exactMatches: ["CN", "HK"],
  },
];

const { detectSellerOrigin } = require("../app/src/content/helpers.js");

// -----------------------------------------------------------------------------------------

describe("detectSellerOrigin", () => {
  describe("Edge Cases & Invalid Inputs", () => {
    it("should return INTERNATIONAL for null input", () => {
      expect(detectSellerOrigin(null)).toBe("INTERNATIONAL");
    });

    it("should return INTERNATIONAL for undefined input", () => {
      expect(detectSellerOrigin(undefined)).toBe("INTERNATIONAL");
    });

    it("should return INTERNATIONAL for empty string", () => {
      expect(detectSellerOrigin("")).toBe("INTERNATIONAL");
    });
  });

  describe("Phase 1: Exact Matches (HTML Tags)", () => {
    it("should detect a clean exact match inside HTML tags", () => {
      const html = "<span>123 Main St</span><span>US</span>";
      expect(detectSellerOrigin(html)).toBe("US");
    });

    it("should detect exact matches with spaces and newlines inside tags", () => {
      const html = "<div>\n  DE \n</div>";
      expect(detectSellerOrigin(html)).toBe("DE");
    });

    it("should IGNORE false positive exact matches NOT wrapped in tags (e.g. DECATUR)", () => {
      // "DE" is inside DECATUR, but not isolated by tags >DE<
      const html = "<span>DECATUR</span><span>TX</span>";
      expect(detectSellerOrigin(html)).toBe("INTERNATIONAL");
    });
  });

  describe("Phase 2: Keywords", () => {
    it("should fallback to keywords if no exact match is found", () => {
      const html = "<div>123 Paris Street</div><div>No Country Code</div>";
      expect(detectSellerOrigin(html)).toBe("FR");
    });

    it("should match keywords case-insensitively", () => {
      const html = "<div>BERLIN</div>";
      expect(detectSellerOrigin(html)).toBe("DE");
    });
  });

  describe("Phase 3: Fallbacks (Phone Numbers & Default)", () => {
    it("should detect China (+86) if no exact match or keyword is found", () => {
      const html = "<div>Support: +86 123456789</div>";
      expect(detectSellerOrigin(html)).toBe("CN");
    });

    it("should detect Hong Kong (+852) if no exact match or keyword is found", () => {
      const html = "<div>Support: +852 987654</div>";
      expect(detectSellerOrigin(html)).toBe("CN");
    });

    it("should return INTERNATIONAL if absolutely no rules match", () => {
      const html = "<div>Just a random seller in</div><div>Poland</div>";
      expect(detectSellerOrigin(html)).toBe("INTERNATIONAL");
    });
  });

  describe("Logic Prioritization", () => {
    it("should prioritize exact matches (Phase 1) OVER keywords (Phase 2)", () => {
      // The keyword "Berlin" is in the text, but the exact match >US< is at the end.
      // Since exact matches are checked first, it should return US.
      const html = "<div>Müller GmbH</div><div>Berlin</div><span>US</span>";
      expect(detectSellerOrigin(html)).toBe("US");
    });

    it("should prioritize keywords (Phase 2) OVER phone numbers (Phase 3)", () => {
      // Has a Chinese phone number, but strictly contains "gmbh" (DE keyword).
      // Since keywords are checked before phone numbers, it should return DE.
      const html = "<div>Test GmbH</div><div>Call: +86 123</div>";
      expect(detectSellerOrigin(html)).toBe("DE");
    });
  });
});
