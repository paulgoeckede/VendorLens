/**
 * @jest-environment jsdom
 */

const { createBadgeElement, removeBadge } = require("../app/src/content/badges.js");

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
        expect(textSpan.innerText).toBe("Chinese Seller");

        expect(badge.style.backgroundColor).toBe("rgb(221, 0, 0)");

        const icon = badge.querySelector("img");
        expect(icon).not.toBeNull();
        expect(icon.src).toBe("mock-extension://assets/icons/logo-128.png");
    });
});