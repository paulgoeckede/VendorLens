/**
 * Function to apply a badge to the product element based on the seller information and user config.
 * @param {HTMLElement} product The DOM-Element of the product the badge should be applied to
 * @param {Object} data The extracted vendor information which the badge is based on
 * @returns {void}
 */
function applyBadge(product, data) {
  if (!config.masterSwitch) return;

  if (data.isFromChina) {
    if (config.hideChina) {
      if (product.dataset.isFading) return;
      product.dataset.isFading = "true";

      // console.log("Verstecke Produkt von China-Händler: " + data.name);

      product.style.transition =
        "opacity 0.5s ease-out, transform 0.5s ease-out, filter 0.5s ease-out";
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

    createBadgeElement(
      product,
      "Chinese Seller",
      "#d00",
      "white",
      "logo-128.png",
      data.sellerUrl,
    );
    incrementChinaCounter();
  } else if (data.name === "Amazon") {
    createBadgeElement(product, "Amazon", "#2196F3", "white", "logo-128.png");

    return;
  } else if (data.isEU && config.markEU) {
    createBadgeElement(
      product,
      "EU Seller",
      "#388e3c",
      "white",
      "logo-128.png",
      data.sellerUrl,
    );

    return;
  } else {
    // product is neither from China, EU or Amazon
    removeBadge(product);
  }
}

/**
 * Helper function to create and style a badge element and append it to the product card.
 * @param {HTMLElement} parent The DOM-Element of the product to which the badge should be applied to
 * @param {String} text The textContent of the adge
 * @param {String} color The color of the badge
 * @param {String} textcolor The textcolor of the textContent of the badge
 * @param {String} iconFileName The icon filename of the extension icon which will be placed inside the badge
 * @param {String} sellerUrl The sellers imprint URL which will be linked inside the badge
 * @returns {void}
 */
function createBadgeElement(
  parent,
  text,
  color,
  textcolor,
  iconFileName,
  sellerUrl,
) {
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
  textSpan.textContent = text;
  badge.appendChild(textSpan);

  parent.appendChild(badge);
}

/**
 * Function to remove an existing badge from product Container.
 * @param {HTMLElement} parent The DOM-Element of the product from which the badge should be removed from.
 * @returns {void}
 */
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
    removeBadge,
  };
}
