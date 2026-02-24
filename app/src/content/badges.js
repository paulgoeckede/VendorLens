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

      // animation trigger
      product.classList.add("fade-out-product");

      // wait until animation is finished, then remove from DOM
      setTimeout(() => {
        product.style.display = "none";
      }, 500);

      incrementChinaCounter();
      return;
    }

    // china badge
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
    // amazon badge
    createBadgeElement(
      product,
      "Amazon",
      "#28a745",
      "white",
      "logo-128.png",
      null,
    );
  } else if (data.isEU && config.markEU) {
    // eu badge
    createBadgeElement(
      product,
      "EU Seller",
      "#28a745",
      "white",
      "logo-128.png",
      data.sellerUrl,
    );
  } else {
    // "other" badge: UK, US, etc.
    createBadgeElement(
      product,
      "International Seller",
      "#28a745",
      "white",
      "logo-128.png",
      data.sellerUrl,
    );
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
 * @param {boolean} [isLoading=false] To check whether loading state should be applied to badge
 * @returns {void}
 */
function createBadgeElement(
  parent,
  text,
  color,
  textcolor,
  iconFileName,
  sellerUrl,
  isLoading = false,
) {
  // remove old badge if there is one
  removeBadge(parent);

  // make sure container is ready for absolute positioning
  if (window.getComputedStyle(parent).position === "static") {
    parent.style.position = "relative";
  }

  const badge = document.createElement("div");
  badge.className = "custom-badge";

  if (isLoading) {
    badge.classList.add("is-loading");
  }

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
  }

  badge.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (sellerUrl) {
      window.open(sellerUrl, "_blank");
    }
  });

  // positioning: inline or absolute as fallback
  const titleElement = parent.querySelector("h2");

  if (titleElement) {
    badge.classList.add("badge-inline");
    titleElement.prepend(badge);

    // suppress product link functionality and visual styles while hovering over badge
    const amazonLink = titleElement.closest("a");

    if (amazonLink) {
      badge.addEventListener("mouseenter", () => {
        amazonLink.classList.add("suppress-amz-hover");
      });

      badge.addEventListener("mouseleave", () => {
        amazonLink.classList.remove("suppress-amz-hover");
      });
    }
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
    /* main styling for badge */
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
      height: 22px; 
      box-sizing: border-box;
      overflow: hidden; 
      pointer-events: auto;
      border: 1px solid transparent;
      cursor: default !important;
    }

    /* styling for clickable badges with url */
    .custom-badge.is-clickable {
      cursor: pointer !important;
    }

    /* hover effect */
    .custom-badge.is-clickable:hover {
      transform: scale(1.05);
      filter: drop-shadow(0px 4px 4px rgba(0,0,0,0.3));
    }

    .custom-badge .badge-icon {
      width: 18px;
      height: 18px;
      display: block;
      flex-shrink: 0;
    }

    /* hidden text */
    .custom-badge .badge-text {
      max-width: 0;
      opacity: 0;
      white-space: nowrap;
      margin-left: 0;
      transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    }

    /* expand text when hovering */
    .custom-badge:hover .badge-text {
      max-width: 120px; /* Breite für den Text */
      opacity: 1;
      margin-left: 6px;
      padding-right: 8px; /* Etwas Platz rechts */
    }

    /* inline styling */
    .badge-inline {
      padding: 2px;
      margin-right: 8px;
      margin-bottom: 2px;
      vertical-align: middle;
    }

    /* absolute styling */
    .badge-absolute {
      padding: 2px;
      position: absolute;
      top: 4px;
      right: 4px;
      z-index: 5; 
    }

    /* animation class for hiding chinese products */
    .fade-out-product {
      opacity: 0 !important;
      transform: scale(0.9) !important;
      filter: blur(4px) !important;
      pointer-events: none !important;
      transition: opacity 0.5s ease-out, transform 0.5s ease-out, filter 0.5s ease-out !important;
    }

    /* pulse animation for loading badge */
    @keyframes badge-pulse {
      0% { opacity: 0.4; }
      50% { opacity: 1; }
      100% { opacity: 0.4; }
    }

    /* class for loading badge */
    .custom-badge.is-loading {
      animation: badge-pulse 1.5s infinite ease-in-out;
      pointer-events: none !important; /* Blockiert Hover und Klicks während des Ladens */
      cursor: wait;
    }

    .suppress-amz-hover .a-text-normal,
    .suppress-amz-hover h2,
    .suppress-amz-hover span:not(.badge-text) {
      color: #0f1111 !important; 
      text-decoration: none !important;
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
