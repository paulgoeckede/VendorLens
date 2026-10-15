// Zählerstand im Popup anzeigen
chrome.storage.local.get({ scannedCount: 0, chinaCount: 0 }, (data) => {
  const countEl = document.getElementById("scannedCount");
  if (countEl) {
    countEl.textContent = Number(data.scannedCount) || 0;
  }

  const chinaCountEl = document.getElementById("chinaCount");
  if (chinaCountEl) {
    chinaCountEl.textContent = Number(data.chinaCount) || 0;
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const defaults = {
    masterSwitch: true,
    hideChina: false,
  };

  chrome.storage.sync.get(defaults, (items) => {
    document.getElementById("hideChina").checked = items.hideChina;
    document.getElementById("masterSwitch").checked = items.masterSwitch;
  });

  document.getElementById("masterSwitch").addEventListener("change", (e) => {
    updateSetting("masterSwitch", e.target.checked);
  });

  document.getElementById("hideChina").addEventListener("change", (e) => {
    updateSetting("hideChina", e.target.checked);
  });
});

function updateSetting(key, value) {
  let setting = {};
  setting[key] = value;
  chrome.storage.sync.set(setting);

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "updateSettings",
        settings: setting,
      });
    }
  });
}
