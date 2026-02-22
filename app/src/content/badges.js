

// function to apply a badge to the product element based on the seller information and user settings
function applyBadge(product, data, sellerUrl) {

    if (!config.masterSwitch) return;

    if (data.isFromChina) {

        if (config.hideChina) {
            if (product.dataset.isFading) return;
            product.dataset.isFading = "true";

            // console.log("Verstecke Produkt von China-Händler: " + data.name);

            product.style.transition = "opacity 0.5s ease-out, transform 0.5s ease-out, filter 0.5s ease-out";
            product.style.opacity = "1";
            product.style.transform = "scale(1)";
            product.style.filter = "blur(0px)";

            void product.offsetWidth; // Trigger reflow

            // fade out logic
            product.style.opacity = "0";
            product.style.transform = "scale(0.9)";
            product.style.filter = "blur(4px)";
            product.style.pointerEvents = "none";

            setTimeout(() => {
                product.style.display = "none";
            }, 500);

            incrementChinaCounter();

            return;
        }

        // product.style.border = "4px solid #d00";
        createBadgeElement(product, "Chinese Seller", "#d00", "white", "logo-128.png", data.sellerUrl);
        incrementChinaCounter();
    
    } else if (data.name === "Amazon") {

        // product.style.border = "4px solid #2196F3";
        createBadgeElement(product, "Amazon", "#2196F3", "white", "logo-128.png");

        return;

    } else if (data.isEU && config.markEU) {

        // product.style.border = "4px solid #388e3c";
        createBadgeElement(product, "EU Seller", "#388e3c", "white", "logo-128.png", data.sellerUrl);

        return;
    } else {
        // product is neither from China, EU or Amazon

        const oldBadge = product.querySelector(".custom-badge");

        if (oldBadge) {
            oldBadge.remove();
        }
    }
}


// helper function to create and style a badge element and append it to the product card
function createBadgeElement(parent, text, color, textcolor, iconFileName, sellerUrl) {
    // remove old badge if there is one
    removeBadge(parent);

    parent.style.position = "relative";

    const badge = document.createElement("div");
    badge.className = "custom-badge";

    badge.style.cssText = `
        display: flex;
        align-items: center;
        gap: 6px; /* Abstand zwischen Icon und Text */
        position: absolute; 
        bottom: 10px; 
        left: 0; 
        padding: 4px 8px; 
        z-index: 1000; 
        font-weight: bold; 
        font-family: sans-serif; 
        font-size: 11px; 
        border-bottom-right-radius: 4px;
        border-radius: 5px; 
        drop-shadow: 1px 1px 3px rgba(0,0,0,0.2); 
        pointer-events: none; 
        background-color: ${color}; 
        color: ${textcolor};
    `;

    if (iconFileName) {
        const icon = document.createElement("img");
        icon.src = chrome.runtime.getURL("assets/icons/" + iconFileName);
        icon.style.width = "18px";
        icon.style.height = "18px";
        icon.style.display = "block";
        badge.appendChild(icon);
    }

    // apply seller imprint link and hover effects to badges in case of third party seller
    if (sellerUrl) {
        badge.style.cursor = "pointer";

        badge.style.pointerEvents = "auto";
        badge.style.transition = "all 0.2s ease-in-out";

        badge.addEventListener("mouseenter", () => {
            badge.style.transform = "scale(1.05)";
            badge.style.filter = "drop-shadow(0px 4px 4px rgba(0,0,0,0.3))";
        });

        badge.addEventListener("mouseleave", () => {
            badge.style.transform = "scale(1)";
            badge.style.filter = "drop-shadow: 1px 1px 3px rgba(0,0,0,0.2)";
        });

        badge.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            window.open(sellerUrl, "_blank");
        });
    }

    const textSpan = document.createElement("span");
    textSpan.innerText = text;
    badge.appendChild(textSpan);

    parent.appendChild(badge);
}


// function to remove an existing badge from product Container
function removeBadge(parent) {
    const oldBadge = parent.querySelector(".custom-badge");
    if (oldBadge) {
        oldBadge.remove();
    }
}


// conditional export for jest (ignored by browser)
if (typeof module != "undefined" && module.exports) {
    module.exports = {
        applyBadge,
        createBadgeElement,
        removeBadge
    };
}