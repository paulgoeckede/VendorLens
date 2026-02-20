let sellerCache = {}; // Cache for seller information to avoid redundant fetches
let isCacheLoaded = false; // flag to indicate if the cache has been loaded from storage
let chinaCounter = 0; // global counter for products from China displayed in the extension icon
let currentDomain = window.location.hostname; // get TLD in form of www.amazon.**
currentDomain = currentDomain.replace("www.", "");
const activeConfig = localeConfigs[currentDomain] || localeConfigs["main_config"]; // grab corresponding querySelector keywords from localeConfigs, amazon.de as fallback

let config = {
    masterSwitch: true,
    hideChina: false,
    markEU: true
};


// load config from storage and apply defaults if not set
chrome.storage.sync.get(config, (items) => {
    config = items;
    // console.log("Einstellungen geladen:", config);
});


// load seller cache from local storage on startup
chrome.storage.local.get(["cachedSellers"], (result) => {
    if (result.cachedSellers) {
        sellerCache = result.cachedSellers;
        // console.log("Verkäufer-Cache geladen: " + Object.keys(sellerCache).length + " Händler bekannt.");
    }
    isCacheLoaded = true;
    startScannerLoop();
});


// listen for settings updates from the extension popup and update config accordingly
chrome.runtime.onMessage.addListener((request) => {
    if (request.action === "updateSettings") {
        config = { ...config, ...request.settings };

        if (request.settings.hideChina !== undefined || request.settings.masterSwitch !== undefined) {
            location.reload();
        }
    }
});


// function to increment the China product counter and update the badge in the extension icon
function incrementChinaCounter() {
    chinaCounter++;
    chrome.runtime.sendMessage({
        action: "updateBadge",
        count: chinaCounter
    })
}


// initialize an IntersectionObserver to detect when product elements come into view and trigger the scanning process
const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const product = entry.target;
            obs.unobserve(product);
            startScan(product);
        }
    });
}, { rootMargin: "200px" });


// regularly scan the page for new product elements and observe them with the IntersectionObserver, but only after the cache has been loaded to ensure we have seller information available when products come into view
function startScannerLoop() {
    setInterval(() => {
        if (!isCacheLoaded) return;
        const products = document.querySelectorAll(activeConfig.productContainer);

        if (products.length > 0) {
            products.forEach(product => {
                if (product.dataset.isObserved) return;

                product.dataset.isObserved = "true";

                observer.observe(product);
            });
        }
    }, 1000);
}


// function to start the scanning process for a given product element
function startScan(product) {

    if (product.dataset.isScanned) return;

    const allLinks = product.querySelectorAll(activeConfig.productLink); 
    let cleanUrl = null;

    // scan all link elements for a valid ASIN and build the product URL
    for (let link of allLinks) {
        let href = link.getAttribute("href");
        if (!href) continue;

        const asinMatch = href.match(/\/(?:dp|product)\/([A-Z0-9]{10})/i);
        const encodedAsinMatch = href.match(/%2F(?:dp|product)%2F([A-Z0-9]{10})/i);

        if (asinMatch && asinMatch[1]) {
            cleanUrl = "/dp/" + asinMatch[1];
            break;
        } else if (encodedAsinMatch && encodedAsinMatch[1]) {
            cleanUrl = "/dp/" + encodedAsinMatch[1];
            break;
        }
    }

    if (!cleanUrl) {
        // console.log("Keine gültige ASIN auf der Produktkarte gefunden. Überspringe Produkt.");
        return;
    }

    product.dataset.isScanned = "true";
    createBadgeElement(product, "Loading..", "#e0e0e0", "#555", "logo-128.png"); // Loading badge

    const fetchUrl = "https://" + currentDomain + cleanUrl;

    const randomDelay = Math.floor(Math.random() * 1500) + 500;
    setTimeout(() => {
        startDeepScan(fetchUrl, product);
    }, randomDelay);
}


function startDeepScan(url, product) {

    const link = url;
    // console.log("Starte Analyse für Produkt: " + link);

    chrome.runtime.sendMessage({
        action: "fetchPage",
        url: link
    }, function (response) {

        if (response && response.html) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(response.html, "text/html");


            // find merchant info box on product page
            const merchantBox = doc.querySelector(activeConfig.merchantContainer);

            let sellerName = "";
            let sellerUrl = "";
            let isAmazon = false;

            if (merchantBox) {

                // check if there is a link to the seller profile (which is usually the case for third-party sellers)
                const linkElement = merchantBox.querySelector(activeConfig.merchantLink) ||
                    merchantBox.querySelector('a[href*="seller="]');

                if (linkElement) {
                    sellerName = linkElement.textContent.trim();
                    sellerUrl = linkElement.getAttribute("href");

                    // repair relative URLs
                    if (sellerUrl && !sellerUrl.startsWith("http")) {
                        sellerUrl = "https://www." + currentDomain + sellerUrl;
                    }
                }
                // fallback: if there is no link, the seller is usually amazon itself, do a final check to be sure
                else {
                    const boxText = merchantBox.textContent.trim().toLowerCase();

                    if (activeConfig.amazonKeywords.some(keyword => boxText.includes(keyword))) {
                        sellerName = "Amazon";
                        isAmazon = true;
                    }
                }
            } else {
                // console.log("Layout-Fehler: Kein Verkäufer-Container gefunden.");
                return;
            }

            // final check to avoid empty seller names
            if (!sellerName) {
                // console.log("Container gefunden, aber Name leer.");
                return;
            }

            // check if we already have information about this seller in our cache to avoid unnecessary fetches of the seller profile page
            if (sellerCache[sellerName]) {
                const cachedData = sellerCache[sellerName];
                applyBadge(product, cachedData);
                if (cachedData.isFromChina) incrementChinaCounter();
                return;
            }

            // check if the seller is Amazon itself based on the name or other indicators, as Amazon's own products often don't have a link to a seller profile and require a different handling than third-party sellers
            if (isAmazon || sellerName === "Amazon") {
                const resultData = {
                    isFromChina: false,
                    isEU: false,
                    name: "Amazon",
                    text: "Verkauf und Versand durch Amazon"
                };

                // store and cache the results, apply badge, and return early since we don't need to fetch a seller profile for Amazon itself
                sellerCache["Amazon"] = resultData;
                chrome.storage.local.set({ cachedSellers: sellerCache });
                applyBadge(product, resultData);
                return;
            }

            // case: third party seller
            if (sellerUrl) {
                // console.log("Händler neu: " + sellerName + ". Lade Impressum...");

                // fetch seller profile page through background script
                chrome.runtime.sendMessage({
                    action: "fetchPage",
                    url: sellerUrl
                }, function (sellerResponse) {
                    if (sellerResponse && sellerResponse.html) {
                        const sellerDoc = parser.parseFromString(sellerResponse.html, "text/html");

                        // fetch imprint container
                        const addressElement = sellerDoc.querySelector(activeConfig.imprintContainer);

                        if (addressElement) {
                            const addressText = addressElement.textContent.trim();
                            const isFromChina = isChinaSeller(addressText); // check if the seller is from China based on the imprint information
                            let isEU = false;

                            if (!isFromChina) {
                                isEU = isEUSeller(addressText); // if not from China, check if it's from the EU based on the imprint information
                            }

                            if (isFromChina) incrementChinaCounter();

                            const resultData = {
                                isFromChina: isFromChina,
                                isEU: isEU,
                                name: sellerName,
                                text: addressText
                            };

                            // store and cache the results for this seller to speed up future scans of products from the same seller and reduce the number of fetches needed
                            sellerCache[sellerName] = resultData;
                            chrome.storage.local.set({ cachedSellers: sellerCache });
                            applyBadge(product, resultData);
                        } else {
                            // console.log("Impressum nicht gefunden für: " + sellerName);
                        }
                    }
                });
            }

        } else {
            // Fehlerbehandlung für den ersten Fetch
            // console.log("Konnte Produktseite nicht laden.");
        }
    });
}


// function to check if seller is from china based on known keywords
function isChinaSeller(text) {
    if (!text) return false;

    const lowerText = text.toLowerCase();

    const hasKeyword = chinaKeywords.some(keyword => lowerText.includes(keyword));
    if (hasKeyword) return true;

    if (text.includes("+86")) return true;

    if (text.includes("CN")) return true;
    if (text.includes("CHN")) return true;

    return false;
}


// function to check if seller is from EU based on known keywords
function isEUSeller(text) {
    if (!text) return false;

    const lowerText = text.toLowerCase();

    const hasCountryName = euKeywords.some(keyword => lowerText.includes(keyword));
    if (hasCountryName) return true;

    const hasPhoneCode = euPhoneCodes.some(code => text.includes(code));
    if (hasPhoneCode) return true;

    return false;
}


// function to apply a badge to the product element based on the seller information and user settings
function applyBadge(product, data) {

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

            return;
        }

        // product.style.border = "4px solid #d00";
        createBadgeElement(product, "Chinese Seller", "#d00", "white", "logo-128.png");
    
    } else if (data.name === "Amazon") {

        // product.style.border = "4px solid #2196F3";
        createBadgeElement(product, "Amazon", "#2196F3", "white", "logo-128.png");

        return;

    } else if (data.isEU && config.markEU) {

        // product.style.border = "4px solid #388e3c";
        createBadgeElement(product, "EU Seller", "#388e3c", "white", "logo-128.png");

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
function createBadgeElement(parent, text, color, textcolor, iconFileName) {
    // remove loading badge or previous badge
    const oldBadge = parent.querySelector(".custom-badge");
    if (oldBadge) {
        // console.log("Found previous badge: " + oldBadge);
        oldBadge.remove();
    }

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
        box-shadow: 1px 1px 3px rgba(0,0,0,0.2); 
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
        icon.style.filter = "drop-shadow(0px 0px 3px rgba(255, 255, 255, 0.9))";
        badge.appendChild(icon);
    }

    const textSpan = document.createElement("span");
    textSpan.innerText = text;
    badge.appendChild(textSpan);

    parent.appendChild(badge);
}