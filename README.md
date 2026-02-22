<p align="center">
  <img src="images/header.png" alt="VendorLens Header Banner" width="440px">
</p>

# VendorLens

VendorLens ist eine Browser-Erweiterung für Google Chrome und Mozilla Firefox, die Produkt- und Händlerinformationen auf Amazon analysiert. Sie hilft dabei, Verkäufer aus bestimmten Regionen (wie China oder der EU) direkt auf der Suchergebnisseite transparent zu markieren oder auszublenden.

## Features

* **Händler-Erkennung:** Automatische Analyse der Verkäuferdaten im Hintergrund.
* **Visuelle Badges:** Hebt EU-Händler und andere definierte Verkäufergruppen optisch hervor.
* **Filter-Funktion (Hide China):** Blendet Produkte von chinesischen Händlern auf Wunsch komplett aus den Suchergebnissen aus.
* **Badge-Counter:** Zählt gefundene Händler und zeigt die Anzahl direkt am Extension-Icon an.
* **Master-Switch:** Die gesamte Erweiterung lässt sich mit einem Klick im Popup de- oder aktivieren.

## Architektur & Tech Stack

Das Projekt nutzt eine einheitliche Codebasis (Single Source of Truth) im `app/`-Ordner und generiert über ein Node.js-Build-Skript automatisch die passenden Manifest-Dateien für Chrome (Manifest V3 mit Service Worker) und Firefox (Manifest V3 mit Background Scripts).

* **Vanilla JavaScript** (keine externen Frameworks)
* **Manifest V3**
* **Node.js** (für den Build-Prozess)

## Entwicklung & Build-Prozess

Um an der Extension zu arbeiten oder die fertigen Dateien für den Browser zu generieren, benötigst du [Node.js](https://nodejs.org/).

1. Klone das Repository.
2. Nimm deine Code-Änderungen ausschließlich im `app/`-Ordner vor.
3. Führe das Build-Skript im Hauptverzeichnis aus:

    ```bash
    node build.js
    ```

Das Skript erstellt automatisch einen neuen `dist/`-Ordner, der von Git ignoriert wird, mit zwei Unterordnern:
* `dist/chrome/` (Fertig für den Chrome Web Store)
* `dist/firefox/` (Fertig für Mozilla Add-ons)

## Lokales Testen

**Google Chrome:**
1. Navigiere zu `chrome://extensions/`
2. Aktiviere oben rechts den "Entwicklermodus".
3. Klicke auf "Entpackte Erweiterung laden" und wähle den Ordner `dist/chrome` aus.

**Mozilla Firefox:**
1. Navigiere zu `about:debugging`
2. Klicke links auf "Dieser Firefox".
3. Klicke auf "Temporäres Add-on laden..." und wähle die `manifest.json` aus dem Ordner `dist/firefox` aus.