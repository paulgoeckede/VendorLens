document.addEventListener("DOMContentLoaded", () => {
  const defaults = {
    masterSwitch: true,
    hideChina: false,
    onlyLocal: false,
  };

  chrome.storage.sync.get(defaults, (items) => {
    document.getElementById("hideChina").checked = items.hideChina;
    document.getElementById("masterSwitch").checked = items.masterSwitch;
    document.getElementById("onlyLocal").checked = items.onlyLocal;
  });

  document.getElementById("masterSwitch").addEventListener("change", (e) => {
    updateSetting("masterSwitch", e.target.checked);
  });

  document.getElementById("hideChina").addEventListener("change", (e) => {
    updateSetting("hideChina", e.target.checked);
  });

  document.getElementById("onlyLocal").addEventListener("change", (e) => {
    updateSetting("onlyLocal", e.target.checked);
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
