const fs = require("fs");
const AdmZip = require("adm-zip");

const version = require("./package.json").version;
const srcDir = "./app";
const distDir = "./dist";
const releaseDir = "./releases";
const chromeDir = `${distDir}/chrome`;
const firefoxDir = `${distDir}/firefox`;

console.log(`Starting build and zip process for version ${version}..`);

// Clean up and prepare directories
[distDir, releaseDir].forEach((dir) => {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
});

fs.mkdirSync(chromeDir, { recursive: true });
fs.mkdirSync(firefoxDir, { recursive: true });

// copy source code
fs.cpSync(srcDir, chromeDir, { recursive: true });
fs.cpSync(srcDir, firefoxDir, { recursive: true });

// adjust manifests
const updateExtensionFiles = (targetDir, manifestName) => {
  // rename manifest and set version number
  const manifestPath = `${targetDir}/manifest.json`;
  const tempManifestPath = `${targetDir}/${manifestName}`;

  let manifest = JSON.parse(fs.readFileSync(tempManifestPath, "utf8"));
  manifest.version = version; // set version from package.json

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  // delete old manifest files
  fs.rmSync(`${targetDir}/manifest.chrome.json`);
  fs.rmSync(`${targetDir}/manifest.firefox.json`);

  // update hello.html
  const popupPath = `${targetDir}/src/popup/hello.html`;
  if (fs.existsSync(popupPath)) {
    let html = fs.readFileSync(popupPath, "utf8");
    html = html.replace(/__VERSION__/g, version);
    fs.writeFileSync(popupPath, html);
  }
};

console.log("Updating versions in manifests and html..");
updateExtensionFiles(chromeDir, "manifest.chrome.json");
updateExtensionFiles(firefoxDir, "manifest.firefox.json");

// zip
function createZip(sourceDir, outPath) {
  const zip = new AdmZip();
  zip.addLocalFolder(sourceDir);
  zip.writeZip(outPath);
}

console.log("Creating zip folders..");
createZip(chromeDir, `${releaseDir}/vendorlens-chrome-v${version}.zip`);
createZip(firefoxDir, `${releaseDir}/vendorlens-firefox-v${version}.zip`);

console.log(
  `Success: Zip folders for v${version} can be found unter 'releases'.`,
);
