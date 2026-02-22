const fs = require('fs');

const srcDir = './app';
const chromeDir = './dist/chrome';
const firefoxDir = './dist/firefox';

console.log("Starte Build-Prozess...");

// Remove old dist folder and create a new one
fs.rmSync('./dist', { recursive: true, force: true });
fs.mkdirSync(chromeDir, { recursive: true });
fs.mkdirSync(firefoxDir, { recursive: true });

// copy source code
fs.cpSync(srcDir, chromeDir, { recursive: true });
fs.cpSync(srcDir, firefoxDir, { recursive: true });

// generate chrome manifest
fs.renameSync(`${chromeDir}/manifest.chrome.json`, `${chromeDir}/manifest.json`);
fs.rmSync(`${chromeDir}/manifest.firefox.json`);

// generate firefox manifest
fs.renameSync(`${firefoxDir}/manifest.firefox.json`, `${firefoxDir}/manifest.json`);
fs.rmSync(`${firefoxDir}/manifest.chrome.json`);

console.log("✅ Build erfolgreich! Chrome und Firefox Versionen liegen im 'dist'-Ordner.");