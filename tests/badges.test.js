/**
 * @jest-environment jsdom
 */

const { createBadgeElement, removeBadge, applyBadge } = require("../app/src/content/badges.js");

describe("UI Badge Functions", () => {

    // mock chrome API
    beforeAll(() => {
        global.chrome = {
            runtime: {
                getURL: (path) => "mock-extension://" + path
            }
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

        createBadgeElement(parent, "Chinese Seller", "#d00", "white", "logo-128.png", "https://seller.url");

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
            markEU: true
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
        
        applyBadge(product, { isFromChina: true }, "https://url");
        
        expect(product.innerHTML).toBe("");
        expect(global.incrementChinaCounter).not.toHaveBeenCalled();
    });

    test("fades out and hides product if china seller and hideChina is true", () => {
        global.config.hideChina = true;
        
        applyBadge(product, { isFromChina: true, name: "Test Seller" }, "https://url");
        
        // check if css styles have been set for fadeout
        expect(product.style.opacity).toBe("0");
        expect(product.style.pointerEvents).toBe("none");
        
        expect(product.style.display).not.toBe("none");
        
        jest.advanceTimersByTime(500);
        
        // check if product has disappeared
        expect(product.style.display).toBe("none");
        
        // check if incrementChinaCounter has been called successfully
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

    test("removes existing badge if seller matches no criteria", () => {
        const oldBadge = document.createElement("div");
        oldBadge.className = "custom-badge";
        product.appendChild(oldBadge);
        
        applyBadge(product, { isFromChina: false, isEU: false, name: "Unknown" }, null);
        
        expect(product.querySelector(".custom-badge")).toBeNull();
    });
});