# Wahlguide Osnabrück

Ein vollständig statischer Wahlguide für die Kommunalwahl in der Stadt Osnabrück am 13. September 2026. Er macht die Positionen der teilnehmenden Parteien zu 24 kommunalpolitischen Thesen vergleichbar. Das Projekt läuft ohne Backend, Datenbank, Cookies oder Speicherung personenbezogener Daten und ist für GitHub Pages geeignet.

Der Wahlguide ist keine Wahlempfehlung und kein offizielles Angebot der Stadt Osnabrück. Quellen, Hinweise zur Datengrundlage und eine Kontaktmöglichkeit für Fehler sind direkt im Projekt unter [weitere-infos.html](weitere-infos.html) zu finden.

## Features

- 24 Thesen und acht Parteien für die Kommunalwahl in Osnabrück
- Drei Antworten für Nutzende: `agree`, `neutral` und `disagree`
- Direkte Navigation über Fortschrittspunkte; beantwortete, übersprungene und wichtige Thesen sind erkennbar
- Überspringen ohne Einfluss auf das Ergebnis
- Markierung wichtiger Thesen: Sie zählen bei der Prozentzahl doppelt, nicht aber bei den sichtbaren Antwortzählern
- Parteiposition `unknown`: Eine nicht auffindbare Position wird als „Keine Aussage gefunden“ dargestellt und für diese Partei nicht gewertet
- Quellen direkt oberhalb der jeweiligen These
- Aufklappbare Ergebnis-Karten mit vergleichbaren Antworten und Parteibegründungen
- Kategorien sind in Gewichtungs- und Ergebnisansicht fest oben rechts positioniert
- Responsives, zugängliches Mobile-First-Layout
- Sitzung nur im Arbeitsspeicher: Nach einem Neuladen beginnt der Fragebogen erneut

## Projektstruktur

```text
.
├── index.html              # Wahlguide
├── weitere-infos.html      # Quellen, Hinweise und Fehlerkontakt
├── admin.html              # Lokaler Dateneditor für die Weiterentwicklung
├── assets/                 # Logo und UI-Icons
├── css/style.css           # Responsives Design
├── data/questions.json     # Metadaten, Parteien, Thesen, Quellen und Begründungen
├── js/
│   ├── app.js              # DOM, Navigation und Rendering
│   ├── quiz.js             # Sitzungszustand im Browser
│   ├── scoring.js          # Isolierte Bewertungslogik
│   ├── dataLoader.js       # Laden und Validierung der JSON-Daten
│   ├── csv.js              # CSV-Import und -Export
│   └── admin.js            # Dateneditor
└── test/
    ├── unit/               # Tests der reinen Logik
    └── e2e/                # Playwright-Tests der Browser-Flows
```

## Lokal starten

Die Seite muss über einen lokalen Webserver laufen, weil Browser JSON-Dateien bei `file://` aus Sicherheitsgründen nicht zuverlässig laden.

```bash
npm install
npm run serve
```

Anschließend `http://localhost:8765` öffnen. Alternativ funktioniert jeder statische Webserver, etwa `python -m http.server 8000`.

## Deployment mit GitHub Pages

1. Repository auf GitHub anlegen und die Dateien in den Standard-Branch pushen.
2. Unter **Settings → Pages** bei **Build and deployment** „Deploy from a branch“ auswählen.
3. Den Branch (meist `main`) und den Ordner `/(root)` wählen.
4. Speichern. GitHub Pages stellt anschließend die URL bereit.

Da `index.html` im Repository-Stamm liegt und alle Pfade relativ sind, ist kein Build-Schritt erforderlich.

## Architektur und Datenmodell

`data/questions.json` ist die einzige Laufzeit-Datenquelle. Die Module trennen Datenzugriff, Quiz-Zustand, Berechnung und Oberfläche bewusst voneinander:

- `dataLoader.js` lädt und prüft die JSON-Struktur.
- `quiz.js` verwaltet Antworten, Überspringen und Wichtig-Markierungen nur für die aktuelle Browser-Sitzung.
- `scoring.js` berechnet die Ergebnisse ohne DOM-Zugriff. Gleiche Antworten erhalten einen Punkt, unterschiedliche null Punkte. Übersprungene Antworten und `unknown`-Positionen der jeweiligen Partei bleiben aus Zählern und Nenner heraus.
- `app.js` verbindet diese Teile mit dem HTML.

Jede These lässt sich um weitere Felder ergänzen und enthält bereits Kategorie, Quellen, Gewicht, Antworten und Parteibegründungen:

```json
{
  "id": "1",
  "question": "Beispielthese",
  "category": "Verkehr",
  "weight": 1,
  "sources": ["https://example.org/quelle"],
  "parties": {
    "volt": "agree",
    "afd": "unknown"
  },
  "partyExplanations": {
    "volt": "Begründung der Partei.",
    "afd": "Keine Position auffindbar."
  }
}
```

`unknown` ist ausschließlich eine Parteiposition. Nutzende können weiterhin nur zustimmen, neutral antworten, nicht zustimmen oder eine These überspringen.

## Daten bearbeiten

`admin.html` ist ein lokaler Editor für Parteien und Thesen mit CSV-Import/-Export und JSON-Download. Er wird nicht in der öffentlichen Navigation verlinkt. Änderungen werden erst wirksam, wenn die heruntergeladene `data/questions.json` bewusst in den Projektordner übernommen und veröffentlicht wird.

Beim Bearbeiten gilt:

- Für Parteien sind `agree`, `neutral`, `disagree` und `unknown` gültige Werte.
- Quellen und Parteibegründungen werden beim CSV-Import nach bestehender Thesen-ID erhalten; die veröffentlichte JSON-Datei bleibt die maßgebliche, vollständige Datenquelle.
- Eine geänderte Partei-ID wird auch in Antworten und Parteibegründungen aktualisiert.

## Tests

```bash
npm run test:unit
npm run test:e2e
npm test
```

Für die End-to-End-Tests wird einmalig ein Playwright-Browser benötigt:

```bash
npx playwright install chromium
```

## Roadmap

- Redaktioneller Workflow für Quellen- und Positionsupdates
- Themenauswertung und Diagramme
- Ergebnis als Bild exportieren
- Mehrere Kommunen und getrennte Fragensätze
- Zusätzliche Antwortoptionen und konfigurierbare Sprachversionen
- Erweiterte Barrierefreiheits- und Plausibilitätsprüfungen

## Lizenz

Der Quellcode steht unter der [MIT-Lizenz](LICENSE).
