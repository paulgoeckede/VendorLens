// listens for messages from the content script and performs actions like fetching product pages and updating badge counts
chrome.runtime.onMessage.addListener((request, sender, sendResponse)  => {
    if (request.action === "fetchPage") {
        // console.log("Analyse des Produkts gestartet für URL:", request.url);

        // Fetch the product page HTML and send it back to the content script for analysis
        fetch(request.url)
            .then(response => response.text())
            .then(htmlString => {
                sendResponse({
                    success: true,
                    html: htmlString
                });
            })
            .catch(error => {
                console.error("Fehler beim Abrufen der Produktseite:", error);
                sendResponse({
                    success: false,
                    error: error.message
                });
            });

        return true;
    }

    // Update the badge count on the extension icon based on messages from the content script
    if (request.action === "updateBadge") {
        chrome.action.setBadgeText({
            text: request.count.toString(),
            tabId: sender.tab.id 
        });

        chrome.action.setBadgeBackgroundColor({
            color: "#d32f2f",
            tabId: sender.tab.id
        });
    }
});