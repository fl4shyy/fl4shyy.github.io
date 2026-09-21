# Wahlguide Osnabrück – Stichwahl

Ein vollständig statischer, anonymisierter Positionsvergleich für die Stichwahl in Osnabrück am 27. September 2026. Zu 15 kommunalpolitischen Themen wählen Nutzende zwischen zwei zunächst anonymisierten Positionen oder „Keine von beiden“. Erst die Auswertung nennt die Kandidaten und zeigt die Tendenz.

Die Anwendung läuft ohne Backend, Datenbank, Cookies oder Speicherung personenbezogener Daten und eignet sich für GitHub Pages. Sie ist keine Wahlempfehlung und kein offizielles Angebot der Stadt Osnabrück.

## Funktionsumfang

- Feste, über die Themen durchmischte Links-Rechts-Zuordnung
- Je Thema zwei Positionen mit getrennten Quellen und zusätzlichem Kontext
- „Keine von beiden“ als bewusste neutrale Antwort
- Überspringen ohne Einfluss auf die Auswertung
- Laufende anonyme Tendenz während des Vergleichs
- Finale Auswertung zwischen Katharina Pötter (CDU) und Volker Bajus (BÜNDNIS 90/DIE GRÜNEN)
- Gemeinsame Themen als pflegbare Tag-Cloud
- Responsive, tastaturbedienbare Mobile-First-Oberfläche
- Keine Persistenz: Ein Neuladen startet den Vergleich neu
- Vollständige vorherige Kommunalwahl-Version unter `legacy/`

## Projektstruktur

```text
.
├── index.html              # Neue Stichwahl-Version
├── weitere-infos.html      # Methodik, Hinweise und Kontakt
├── admin.html              # Hinweis auf direkte JSON-Pflege
├── assets/                 # Gemeinsame UI-Icons
├── css/style.css           # Design der Stichwahl-Version
├── data/questions.json     # Kandidaten, Themen, Positionen, Quellen und gemeinsame Themen
├── js/
│   ├── app.js              # DOM, Navigation und Rendering
│   ├── quiz.js             # Sitzungszustand im Browser
│   ├── scoring.js          # Reine Tendenzberechnung
│   └── dataLoader.js       # Laden und Validierung der Daten
├── legacy/                 # Selbstständige vorherige Version einschließlich Admin-Editor
└── test/                   # Unit- und Browser-Tests beider Versionen
```

## Daten pflegen

`data/questions.json` ist die einzige Laufzeit-Datenquelle der Stichwahl-Version. Fehlende Quellenlinks sind mit `"link": ""` und `"linkFehlt": true` markiert. Nach dem Eintragen eines Links sollte `linkFehlt` auf `false` gesetzt werden.

Die feste Darstellungsseite wird je Thema über `leftActor` und `rightActor` gesteuert. Beide Werte müssen entweder `cdu` oder `gruene` enthalten und dürfen nicht identisch sein.

Gemeinsame Themen werden im Array `gemeinsameThemen` gepflegt:

```json
"gemeinsameThemen": [
  "Beispielthema"
]
```

## Berechnung

Jede Auswahl einer Position zählt als ein Punkt für den intern zugeordneten Kandidaten. Die Prozentwerte berechnen sich ausschließlich aus diesen eindeutigen Positionswahlen. „Keine von beiden“ und übersprungene Themen werden gezählt, bleiben aber außerhalb des Nenners. Ohne eindeutige Positionswahl zeigt die Anwendung keine Prozentwerte, sondern „Keine eindeutige Tendenz“.

## Lokal starten

Die Seite muss über einen lokalen Webserver laufen, da Browser JSON-Dateien bei `file://` nicht zuverlässig laden.

```bash
npm install
npm run serve
```

Danach `http://localhost:8765` öffnen.

## Tests

```bash
npm run test:unit
npm run test:e2e
npm test
```

## Legacy-Version

Die bisherige Kommunalwahl-Anwendung liegt vollständig unter `legacy/` und wird über `legacy/index.html` gestartet. Sie besitzt weiterhin ihre ursprünglichen Daten, Berechnung, Gewichtung und Verwaltungsoberfläche.

## Lizenz

Der Quellcode steht unter der [MIT-Lizenz](LICENSE).
