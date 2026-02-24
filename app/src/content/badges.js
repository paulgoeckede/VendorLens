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
      "#BC2C1A",
      "white",
      "logo-128.png",
      data.sellerUrl,
    );
    incrementChinaCounter();
  } else if (data.name === "Amazon") {
    createBadgeElement(product, "Amazon", "#169AEC", "white", "logo-128.png");

    return;
  } else if (data.isEU && config.markEU) {
    createBadgeElement(
      product,
      "EU Seller",
      "#169AEC",
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

  // make sure container is ready for absolute positioning
  if (window.getComputedStyle(parent).position === "static") {
    parent.style.position = "relative";
  }

  const badge = document.createElement("div");
  badge.className = "custom-badge";

  badge.style.backgroundColor = color;
  badge.style.color = textcolor;

  if (iconFileName) {
    const icon = document.createElement("img");
    icon.src = chrome.runtime.getURL("assets/icons/" + iconFileName);
    icon.className = "badge-icon";
    badge.appendChild(icon);
  }

  const textSpan = document.createElement("span");
  textSpan.textContent = text;
  textSpan.className = "badge-text"; // starts hidden with width = 0
  badge.appendChild(textSpan);

  if (sellerUrl) {
    badge.classList.add("is-clickable"); // activates css hover effect

    badge.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.open(sellerUrl, "_blank");
    });
  } else {
    badge.style.pointerEvents = "none";
  }

  // positioning: inline or absolute as fallback
  const titleElement = parent.querySelector("h2");

  if (titleElement) {
    badge.classList.add("badge-inline");
    titleElement.prepend(badge);
  } else {
    badge.classList.add("badge-absolute");
    parent.appendChild(badge);
  }
}

/**
 * Function to add badge styling to HTML
 */
function injectBadgeStyles() {
  if (document.getElementById("amz-badge-styles")) return;

  const style = document.createElement("style");
  style.id = "amz-badge-styles";
  style.textContent = `
    .custom-badge {
      display: inline-flex;
      align-items: center;
      border-radius: 20px; 
      font-family: system-ui, -apple-system, sans-serif;
      font-weight: 600; 
      font-size: 11px; 
      letter-spacing: 0.03em;
      -webkit-font-smoothing: antialiased;
      transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
      box-shadow: 1px 1px 3px rgba(0,0,0,0.2); 
      height: 22px; /* Fixe Höhe, damit beim Hovern nichts springt */
      box-sizing: border-box;
      overflow: hidden;
    }

    .custom-badge.is-clickable {
      cursor: pointer;
      pointer-events: auto;
    }

    .custom-badge.is-clickable:hover {
      transform: scale(1.05);
      filter: drop-shadow(0px 4px 4px rgba(0,0,0,0.3));
    }

    /* Das Icon */
    .custom-badge .badge-icon {
      width: 18px;
      height: 18px;
      display: block;
      flex-shrink: 0;
    }

    .custom-badge .badge-text {
      max-width: 0;
      opacity: 0;
      white-space: nowrap;
      margin-left: 0;
      transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    }

    .custom-badge:hover .badge-text {
      max-width: 120px; /* Breite für den Text */
      opacity: 1;
      margin-left: 6px;
      padding-right: 8px; /* Etwas Platz rechts */
    }

    .badge-inline {
      padding: 2px;
      margin-right: 8px;
      margin-bottom: 2px;
      vertical-align: middle;
    }

    .badge-absolute {
      padding: 2px;
      position: absolute;
      top: 4px;
      right: 4px;
      z-index: 5; 
    }
  `;
  document.head.appendChild(style);
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
