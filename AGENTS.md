# AGENTS.md

Anleitung für KI-Agenten (z. B. Codex, Claude, opencode) und Menschen, die an diesem
Projekt arbeiten. Lies diese Datei vor der ersten Änderung vollständig durch.

## Projektcharakter

- Statisches, frontend-only Proof of Concept eines kommunalen Wahl-O-Mat.
- **Kein Backend, keine Build-Pipeline, keine Bundler, keine Frameworks.**
- Reines Vanilla-JS (ESM), ein HTML-File, ein CSS-File, eine JSON-Datendatei.
- UI-Sprache ist **Deutsch**. Antwort-IDs (`agree`/`neutral`/`disagree`) bleiben sprachunabhängig.
- Alle Fragen, Parteipositionen und Ortsangaben sind erfundene Demo-Daten – keine Wahlempfehlung.

## Module und Verantwortung

| Datei | Aufgabe | darf nicht |
|---|---|---|
| `js/dataLoader.js` | `fetch` von `data/questions.json` + Strukturvalidierung | DOM berühren |
| `js/quiz.js` | Sitzungszustand im Speicher (Antworten, Skip, Wichtig) | DOM berühren, persistieren |
| `js/scoring.js` | Reine Bewertungslogik (Gewichtung, %, Sortierung) | DOM berühren, I/O |
| `js/app.js` | Verbindet Daten + Quiz + DOM, Rendering, Events | Geschäftslogik enthalten |
| `js/csv.js` | Reiner CSV-Parser/Serializer (vanilla) | DOM berühren, I/O |
| `js/admin.js` | Verwaltungsoberfläche: visueller Editor + CSV-Import/Export, Vorschau | Geschäftslogik enthalten |
| `data/questions.json` | Fragen, Parteien, Antwortoptionen, Metadaten (einzige Datenquelle) | UI-Strings oder Code |

Halte diese Trennung ein. Neue Logik kommt in das passende Modul, neue UI-Verkabelung in `app.js`.

## Verbindliche Konventionen

1. **Keine Kommentare im Quellcode**, außer es wird ausdrücklich verlangt. Module erklären sich selbst; JSDoc-Kurzkommentare am Modulanfang sind nur in `quiz.js`/`scoring.js`/`dataLoader.js` bereits vorhanden und dürfen dem Stil folgen.
2. **ESM** (`import`/`export`), keine CommonJS, kein `type="module"`-Wechsel.
3. **Keine neuen Runtime-Abhängigkeiten.** Dev-Dependencies nur für Tests (`@playwright/test`).
4. **Deutsche UI-Strings** in der Oberfläche und in Fehlermeldungen der Validierung.
5. **Antwort-IDs** immer `agree`/`neutral`/`disagree`. Labels über `ANSWER_LABELS` bzw. `data.answerOptions`.
6. **Keine Persistenz.** Seitenreload setzt den Fragebogen absichtlich zurück. Kein `localStorage`, keine Cookies.
7. **Mobile-First.** Standard-Viewport für Tests ist 420×900.
8. **Barrierefreiheit beachten**: `aria-pressed`/`aria-expanded`/`aria-current`, `aria-label`, sichtbarer Fokus, Tastaturbedienung, `#main-content`-Sprunglink.

## Wichtige Logikregeln (nicht verletzen)

- Übersprungene Fragen werden **nicht** gewertet und nicht in `totalWeight` gezählt.
- Wichtig-Markierungen verdoppeln das Gewicht nur in der **Prozentzahl**, nicht in `matches`/`differences`.
- Ergebnisse sortieren nach `percentage → weightedMatches → matches → name.localeCompare`.
- `getNextUnresolvedIndex` läuft zyklisch und gibt `null` zurück, wenn alles erledigt ist.

## Lokal starten

`file://` lädt JSON nicht. Immer einen Webserver nutzen:

```bash
node test/static-server.mjs   # oder: npx serve .
```

Die E2E-Suite startet diesen Server automatisch via `playwright.config.js` (`webServer`).

## Tests – Pflicht vor jedem Abschluss

Vor jedem Abschluss einer Aufgabe müssen **alle Tests grün** sein:

```bash
npm test           # 116 Tests: 58 Unit + 58 E2E
npm run test:unit  # nur Logik, kein Browser
npm run test:e2e   # nur Browser-Flows
```

- Einmalig: `npm install && npx playwright install chromium`.
- Änderungen an `quiz.js`/`scoring.js`/`dataLoader.js`/`csv.js` → entsprechende Unit-Tests in `test/unit/` pflegen.
- Änderungen an `app.js`/`admin.js`, `index.html`/`admin.html` oder Flows → E2E-Tests in `test/e2e/flows.spec.js` bzw. `test/e2e/admin.spec.js` pflegen.
- Neue Features brauchen neue Tests; rein visuelle Änderungen mindestens einen E2E-Check.
- Schreibe keine brittle CSS-Selektoren, die von der exakten DOM-Tiefe abhängen – bevorzugte Hooks: `[data-answer]`, `[data-result-toggle]`, `[data-question-index]`, `[data-weighting-question-id]`, `#progress-text`, `.match-score`.

## Git-Workflow

- Noch kein Commit vorhanden – beim ersten Commit die bestehende Struktur aufnehmen.
- Nur Dateien committen, die zur Aufgabe gehören. Keine `node_modules/`, `test-results/`, `.DS_Store`.
- Commit-Message-Stil: kurzer Imperativ auf Deutsch oder Englisch, konsistent innerhalb des Repos.
- Keine Secrets, keine persönlichen Daten – die Demo-Daten bleiben erfunden.

## Was du **nicht** tunen sollst

- Keine Frameworks (React/Vue/Svelte) einführen.
- Keinen Build-Schritt oder Bundler hinzufügen.
- Keine neuen Runtime-Abhängigkeiten installieren.
- Keine Kommentare in den Code streuen.
- Keine Persistenz oder Tracking einbauen.
- Keine echten Parteipositionen oder Orte eintragen.
- Keine Änderung committen, ohne dass `npm test` grün ist.

## Schnelle Referenz

| Aktion | Befehl |
|---|---|
| Server starten | `node test/static-server.mjs` |
| Unit-Tests | `npm run test:unit` |
| E2E-Tests | `npm run test:e2e` |
| Alle Tests | `npm test` |
| Browser installieren | `npx playwright install chromium` |
