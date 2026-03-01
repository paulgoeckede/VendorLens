/**
 * @jest-environment jsdom
 */

const { saveAsinToSessionCache } = require("../app/src/content/helpers.js");

describe("saveAsinToSessionCache", () => {
  let setItemSpy;

  beforeEach(() => {
    document.body.innerHTML = "";

    setItemSpy = jest.spyOn(
      Object.getPrototypeOf(window.sessionStorage),
      "setItem",
    );
    setItemSpy.mockClear();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  const dummyData = { region: "DE", isLocal: true };

  it("should extract asin from DOM attribute", () => {
    const container = document.createElement("div");
    container.setAttribute("data-asin", "B08TEST123");

    const product = document.createElement("div");
    container.appendChild(product);
    document.body.appendChild(container);

    // Act
    saveAsinToSessionCache(
      product,
      "https://amazon.de/dp/B08IRRELEVANT",
      dummyData,
    );

    // Assert
    expect(setItemSpy).toHaveBeenCalledTimes(1);
    expect(setItemSpy).toHaveBeenCalledWith(
      "asin_cache_B08TEST123",
      JSON.stringify(dummyData),
    );
  });

  it("should use fallback function if it cant find a dom attribute", () => {
    const product = document.createElement("div");
    document.body.appendChild(product);

    const validAmazonUrl = "https://www.amazon.de/dp/B08FALLBAC/";

    saveAsinToSessionCache(product, validAmazonUrl, dummyData);

    expect(setItemSpy).toHaveBeenCalledTimes(1);
    expect(setItemSpy).toHaveBeenCalledWith(
      "asin_cache_B08FALLBAC",
      JSON.stringify(dummyData),
    );
  });

  it("should not store anything to session cache if no asin is found", () => {
    const product = document.createElement("div");

    const invalidAmazonUrl = "https://www.amazon.de/search/q=hdmi+cable";

    saveAsinToSessionCache(product, invalidAmazonUrl, dummyData);

    expect(setItemSpy).not.toHaveBeenCalled();
  });
});
