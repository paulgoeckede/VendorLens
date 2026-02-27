/**
 * @jest-environment jsdom
 */

const {
  createBadgeElement,
  removeBadge,
  applyBadge,
} = require("../app/src/content/badges.js");

describe("UI Badge Functions", () => {
  // mock chrome API
  beforeAll(() => {
    global.chrome = {
      runtime: {
        getURL: (path) => "mock-extension://" + path,
      },
    };
  });

  test("removeBadge removes an existing custom-badge from the parent element", () => {
    const parent = document.createElement("div");

    const oldBadge = document.createElement("div");
    oldBadge.className = "custom-badge";
    parent.appendChild(oldBadge);

    expect(parent.querySelector(".custom-badge")).not.toBeNull();

    removeBadge(parent);

    expect(parent.querySelector(".custom-badge")).toBeNull();
  });

  test("createBadgeElement appends a styled badge with text and icon", () => {
    const parent = document.createElement("div");

    createBadgeElement(
      parent,
      "Chinese Seller",
      "#d00",
      "white",
      "logo-128.png",
      "https://seller.url",
    );

    const badge = parent.querySelector(".custom-badge");

    expect(badge).not.toBeNull();

    const textSpan = badge.querySelector("span");
    expect(textSpan.textContent).toBe("Chinese Seller");

    expect(badge.style.backgroundColor).toBe("rgb(221, 0, 0)");

    const icon = badge.querySelector("img");
    expect(icon).not.toBeNull();
    expect(icon.src).toBe("mock-extension://assets/icons/logo-128.png");
  });
});

describe("applyBadge Function", () => {
  let product;

  beforeEach(() => {
    // create a fresh product object before each test
    product = document.createElement("div");

    // reset global config values
    global.config = {
      masterSwitch: true,
      hideChina: false,
      sellerUrl: "https://url",
      markEU: true,
    };

    // mock function to count times called
    global.incrementChinaCounter = jest.fn();

    // fake timer for setTimeout
    jest.useFakeTimers();
  });

  afterEach(() => {
    // reset timer after each use
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  test("does nothing if masterSwitch is false", () => {
    global.config.masterSwitch = false;

    applyBadge(product, { isFromChina: true });

    expect(product.innerHTML).toBe("");
    expect(global.incrementChinaCounter).not.toHaveBeenCalled();
  });

  test("fades out and hides product if china seller and hideChina is true", () => {
    global.config.hideChina = true;

    applyBadge(product, { isFromChina: true, name: "Test Seller" });

    // check if css animation class has been assigned
    expect(product.classList.contains("fade-out-product")).toBe(true);

    // check that display is not none at the start of animation
    expect(product.style.display).not.toBe("none");

    // fast forward 500ms
    jest.advanceTimersByTime(500);

    // check that display is none after animation is done
    expect(product.style.display).toBe("none");

    expect(global.incrementChinaCounter).toHaveBeenCalledTimes(1);
  });

  test("applies china badge if hideChina is false", () => {
    global.config.hideChina = false;

    applyBadge(product, { isFromChina: true }, "https://url");

    const badge = product.querySelector(".custom-badge");
    expect(badge).not.toBeNull();
    expect(badge.innerHTML).toContain("Chinese Seller");
    expect(global.incrementChinaCounter).toHaveBeenCalledTimes(1);
  });

  test("applies amazon badge if seller is Amazon", () => {
    applyBadge(product, { isFromChina: false, name: "Amazon" }, null);

    const badge = product.querySelector(".custom-badge");
    expect(badge).not.toBeNull();
    expect(badge.innerHTML).toContain("Amazon");
  });

  test("applies EU badge if seller is from EU and markEU is true", () => {
    global.config.markEU = true;

    applyBadge(product, { isFromChina: false, isEU: true }, "https://url");

    const badge = product.querySelector(".custom-badge");
    expect(badge).not.toBeNull();
    expect(badge.innerHTML).toContain("EU Seller");
  });

  test("creates 'International Seller' fallback badge if seller matches no specific criteria", () => {
    // simulate that there was an existing loading badge beforehand
    const oldBadge = document.createElement("div");
    oldBadge.className = "custom-badge is-loading";
    product.appendChild(oldBadge);

    // function call with vendor data not matching any regular criteria
    applyBadge(product, {
      isFromChina: false,
      isEU: false,
      name: "Unknown US Seller",
      sellerUrl: "https://amazon.com/seller",
    });

    // check if there is any badge at all
    const badge = product.querySelector(".custom-badge");
    expect(badge).not.toBeNull();

    // check if badge has the expected text content
    const badgeText = badge.querySelector(".badge-text");
    expect(badgeText.textContent).toBe("International Seller");

    // check removal of loading badge
    expect(badge.classList.contains("is-loading")).toBe(false);
  });
});
