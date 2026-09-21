import { parseCsv, serializeCsv } from "./csv.js";

const PARTY_HEADER = ["id", "name", "shortName", "color"];
const QUESTION_BASE_HEADER = ["id", "question", "category", "weight"];
const VALID_ANSWERS = ["agree", "neutral", "disagree", "unknown"];
const VALID_ANSWER_SET = new Set(VALID_ANSWERS);

const elements = {
  partiesCsv: document.querySelector("#parties-csv"),
  questionsCsv: document.querySelector("#questions-csv"),
  partiesFile: document.querySelector("#parties-file"),
  questionsFile: document.querySelector("#questions-file"),
  previewButton: document.querySelector("#preview-button"),
  downloadJsonButton: document.querySelector("#download-json-button"),
  resetButton: document.querySelector("#reset-button"),
  status: document.querySelector("#admin-status"),
  partiesPreview: document.querySelector("#parties-preview"),
  questionsPreview: document.querySelector("#questions-preview"),
  templatePartiesButton: document.querySelector("#template-parties-button"),
  templateQuestionsButton: document.querySelector("#template-questions-button"),
  partiesEditor: document.querySelector("#parties-editor"),
  questionsEditor: document.querySelector("#questions-editor"),
  addPartyButton: document.querySelector("#add-party-button"),
  addQuestionButton: document.querySelector("#add-question-button")
};

let model = { parties: [], questions: [] };
let baseModel = null;
let metadata = defaultMetadata();
let answerOptions = defaultAnswerOptions();

initialize();

async function initialize() {
  try {
    const response = await fetch("data/questions.json", { cache: "no-store" });
    if (response.ok) {
      const data = await response.json();
      if (data.metadata) metadata = data.metadata;
      if (data.answerOptions) answerOptions = data.answerOptions;
      model = dataToModel(data);
    } else {
      model = { parties: [], questions: [] };
    }
    baseModel = cloneModel(model);
    renderAll();
    setStatus("Daten aus data/questions.json geladen. Bearbeite Felder oder CSV; „Herunterladen“ speichert die komplette Datei.", "info");
  } catch (error) {
    setStatus(`Fehler beim Laden der Daten: ${error.message}`, "error");
    model = { parties: [], questions: [] };
    baseModel = cloneModel(model);
    renderAll();
  }
  bindEvents();
}

function dataToModel(data) {
  return {
    parties: (data.parties || []).map((p) => ({
      id: p.id,
      name: p.name,
      shortName: p.shortName ?? p.name,
      color: p.color ?? "#000000",
      wahlprogramm: p.wahlprogramm
    })),
    questions: (data.questions || []).map((q) => ({
      id: q.id,
      question: q.question,
      category: q.category,
      weight: q.weight ?? 1,
      parties: { ...(q.parties || {}) },
      sources: q.sources || [],
      links: q.links || [],
      partyExplanations: q.partyExplanations || {}
    }))
  };
}

function cloneModel(m) {
  return {
    parties: m.parties.map((p) => ({ ...p })),
    questions: m.questions.map((q) => ({
      ...q,
      parties: { ...q.parties },
      sources: [...(q.sources || [])],
      links: [...(q.links || [])],
      partyExplanations: { ...(q.partyExplanations || {}) }
    }))
  };
}

function defaultMetadata() {
  return {
    title: "Wahlguide Osnabrück",
    municipality: "Osnabrück",
    electionDate: "2026-09-13",
    electionYear: 2026,
    version: "1.0.0",
    description: "Wahlguide für die Kommunalwahl in Osnabrück am 13. September 2026."
  };
}

function defaultAnswerOptions() {
  return [
    { id: "agree", label: "Stimme zu", sortOrder: 1 },
    { id: "neutral", label: "Neutral", sortOrder: 2 },
    { id: "disagree", label: "Stimme nicht zu", sortOrder: 3 }
  ];
}

function bindEvents() {
  elements.previewButton.addEventListener("click", handlePreview);
  elements.downloadJsonButton.addEventListener("click", handleDownloadJson);
  elements.resetButton.addEventListener("click", () => {
    model = cloneModel(baseModel || { parties: [], questions: [] });
    renderAll();
    setStatus("Auf die geladenen Daten zurückgesetzt.", "info");
  });
  elements.partiesFile.addEventListener("change", async (event) => {
    await handleFileLoad(event, elements.partiesCsv);
    syncModelFromCsv();
  });
  elements.questionsFile.addEventListener("change", async (event) => {
    await handleFileLoad(event, elements.questionsCsv);
    syncModelFromCsv();
  });
  elements.templatePartiesButton.addEventListener("click", () => {
    elements.partiesCsv.value = serializeCsv([PARTY_HEADER, ["spd", "SPD", "SPD", "#e3000f"]]);
    syncModelFromCsv();
  });
  elements.templateQuestionsButton.addEventListener("click", () => {
    elements.questionsCsv.value = serializeCsv([
      [...QUESTION_BASE_HEADER, "spd"],
      ["beispiel-these", "Dies ist eine Beispielthese.", "Verkehr", "1", "agree"]
    ]);
    syncModelFromCsv();
  });
  elements.addPartyButton.addEventListener("click", handleAddParty);
  elements.addQuestionButton.addEventListener("click", handleAddQuestion);

  elements.partiesCsv.addEventListener("input", () => {
    // raw CSV edits are synced into the editor via "Vorschau aktualisieren"
  });
}

function syncModelFromCsv() {
  try {
    const parsed = parseAndValidate();
    model = { parties: parsed.parties, questions: parsed.questions };
    renderVisualEditor();
    renderPreviews(model.parties, model.questions);
    setStatus("CSV in den Editor übernommen.", "info");
  } catch (error) {
    setStatus(error.message, "error");
  }
}

function renderAll() {
  renderVisualEditor();
  syncCsvTextareas();
  renderPreviews(model.parties, model.questions);
}

function syncCsvTextareas() {
  elements.partiesCsv.value = modelToPartiesCsv(model);
  elements.questionsCsv.value = modelToQuestionsCsv(model);
}

function modelToPartiesCsv(m) {
  const rows = [PARTY_HEADER, ...m.parties.map((p) => [p.id, p.name, p.shortName, p.color])];
  return serializeCsv(rows);
}

function modelToQuestionsCsv(m) {
  const partyIds = m.parties.map((p) => p.id);
  const rows = [[...QUESTION_BASE_HEADER, ...partyIds]];
  for (const q of m.questions) {
    rows.push([q.id, q.question, q.category, String(q.weight), ...partyIds.map((id) => q.parties[id] || "")]);
  }
  return serializeCsv(rows);
}

function currentPartiesRows() {
  return parseCsv(elements.partiesCsv.value);
}

function currentQuestionsRows() {
  return parseCsv(elements.questionsCsv.value);
}

function handlePreview() {
  try {
    const parsed = parseAndValidate();
    model = { parties: parsed.parties, questions: parsed.questions };
    renderAll();
    setStatus(`Vorschau aktualisiert: ${parsed.parties.length} Parteien, ${parsed.questions.length} Thesen. Bereit zum Export.`, "success");
  } catch (error) {
    setStatus(error.message, "error");
    elements.partiesPreview.replaceChildren();
    elements.questionsPreview.replaceChildren();
  }
}

function parseAndValidate() {
  const partyRows = currentPartiesRows();
  const questionRows = currentQuestionsRows();

  if (partyRows.length < 2) {
    throw new Error("Parteien-CSV enthält keine Datenzeilen (nur Kopfzeile oder leer).");
  }
  if (questionRows.length < 2) {
    throw new Error("Thesen-CSV enthält keine Datenzeilen (nur Kopfzeile oder leer).");
  }

  const partyHeader = partyRows[0];
  if (!PARTY_HEADER.every((col) => partyHeader.includes(col))) {
    throw new Error(`Parteien-CSV braucht die Spalten: ${PARTY_HEADER.join(", ")}.`);
  }

  const partyIdIndex = partyHeader.indexOf("id");
  const partyNameIndex = partyHeader.indexOf("name");
  const partyShortIndex = partyHeader.indexOf("shortName");
  const partyColorIndex = partyHeader.indexOf("color");

  const parties = [];
  const partyIds = new Set();
  partyRows.slice(1).forEach((row, lineIndex) => {
    const id = row[partyIdIndex]?.trim();
    if (!id) throw new Error(`Partei in Zeile ${lineIndex + 2} hat keine ID.`);
    if (partyIds.has(id)) throw new Error(`Partei-ID „${id}“ ist doppelt vorhanden.`);
    partyIds.add(id);
    parties.push({
      id,
      name: row[partyNameIndex]?.trim() || id,
      shortName: row[partyShortIndex]?.trim() || row[partyNameIndex]?.trim() || id,
      color: row[partyColorIndex]?.trim() || "#000000",
      wahlprogramm: model.parties.find((party) => party.id === id)?.wahlprogramm
    });
  });

  const questionHeader = questionRows[0];
  for (const col of QUESTION_BASE_HEADER) {
    if (!questionHeader.includes(col)) {
      throw new Error(`Thesen-CSV fehlt Pflichtspalte: ${col}.`);
    }
  }

  const partyColumns = questionHeader
    .map((col, index) => ({ col: (col || "").trim(), index }))
    .filter((entry) => !QUESTION_BASE_HEADER.includes(entry.col));

  if (partyColumns.length === 0) {
    throw new Error("Thesen-CSV hat keine Parteispalten.");
  }

  for (const entry of partyColumns) {
    if (!partyIds.has(entry.col)) {
      throw new Error(`Thesen-Spalte „${entry.col}“ ist keine bekannte Partei-ID.`);
    }
  }

  const idIndex = questionHeader.indexOf("id");
  const questionIndex = questionHeader.indexOf("question");
  const categoryIndex = questionHeader.indexOf("category");
  const weightIndex = questionHeader.indexOf("weight");

  const questions = [];
  const questionIds = new Set();
  questionRows.slice(1).forEach((row, lineIndex) => {
    const id = row[idIndex]?.trim();
    if (!id) throw new Error(`These in Zeile ${lineIndex + 2} hat keine ID.`);
    if (questionIds.has(id)) throw new Error(`These-ID „${id}“ ist doppelt vorhanden.`);
    questionIds.add(id);

    const qp = {};
    for (const entry of partyColumns) {
      const value = (row[entry.index] ?? "").trim();
      if (!VALID_ANSWER_SET.has(value)) {
        throw new Error(
          `These „${id}“, Spalte „${entry.col}“: ungültige Antwort „${value}“. Erlaubt: agree, neutral, disagree, unknown.`
        );
      }
      qp[entry.col] = value;
    }
    for (const partyId of partyIds) {
      if (!Object.prototype.hasOwnProperty.call(qp, partyId)) {
        qp[partyId] = "unknown";
      }
    }

    const weightRaw = (row[weightIndex] ?? "1").trim();
    const weight = Number(weightRaw);
    if (!Number.isFinite(weight) || weight <= 0) {
      throw new Error(`These „${id}“: Gewicht muss eine positive Zahl sein („${weightRaw}“).`);
    }

    const existingQuestion = model.questions.find((question) => question.id === id);
    questions.push({
      id,
      question: row[questionIndex]?.trim() || id,
      category: row[categoryIndex]?.trim() || "Allgemein",
      weight,
      parties: qp,
      sources: [...(existingQuestion?.sources || [])],
      links: [...(existingQuestion?.links || [])],
      partyExplanations: { ...(existingQuestion?.partyExplanations || {}) }
    });
  });

  return { parties, questions, partyIds: [...partyIds] };
}

function handleDownloadJson() {
  try {
    const parsed = parseAndValidate();
    const data = { metadata, answerOptions, parties: parsed.parties, questions: parsed.questions };
    downloadFile("questions.json", JSON.stringify(data, null, 2), "application/json");
    setStatus(`questions.json exportiert: ${parsed.parties.length} Parteien, ${parsed.questions.length} Thesen. Lege die Datei in data/ ab.`, "success");
  } catch (error) {
    setStatus(error.message, "error");
  }
}

function renderPreviews(parties, questions) {
  elements.partiesPreview.replaceChildren(buildPartiesTable(parties));
  elements.questionsPreview.replaceChildren(buildQuestionsTable(questions));
}

function buildPartiesTable(parties) {
  const table = document.createElement("table");
  table.className = "admin-table";
  const head = document.createElement("thead");
  head.innerHTML = "<tr><th>ID</th><th>Name</th><th>Kürzel</th><th>Farbe</th></tr>";
  const body = document.createElement("tbody");
  for (const party of parties) {
    const tr = document.createElement("tr");
    const swatch = document.createElement("span");
    swatch.className = "color-swatch";
    swatch.style.background = party.color;
    tr.innerHTML = `<td>${escapeHtml(party.id)}</td><td>${escapeHtml(party.name)}</td><td>${escapeHtml(party.shortName)}</td>`;
    const colorCell = document.createElement("td");
    colorCell.append(swatch, document.createTextNode(party.color));
    tr.append(colorCell);
    body.append(tr);
  }
  table.append(head, body);
  return table;
}

function buildQuestionsTable(questions) {
  const table = document.createElement("table");
  table.className = "admin-table";
  const head = document.createElement("thead");
  const headRow = document.createElement("tr");
  headRow.innerHTML = "<th>ID</th><th>These</th><th>Kategorie</th><th>Gewicht</th><th>Partei-Antworten</th>";
  head.append(headRow);
  const body = document.createElement("tbody");
  for (const question of questions) {
    const tr = document.createElement("tr");
    const answers = Object.entries(question.parties)
      .map(([id, answer]) => `<span class="answer-chip answer-${escapeHtml(answer)}">${escapeHtml(id)}: ${escapeHtml(answer)}</span>`)
      .join(" ");
    tr.innerHTML = `<td>${escapeHtml(question.id)}</td><td>${escapeHtml(question.question)}</td><td>${escapeHtml(question.category)}</td><td>${escapeHtml(String(question.weight))}</td><td>${answers}</td>`;
    body.append(tr);
  }
  table.append(head, body);
  return table;
}

function renderVisualEditor() {
  renderPartiesEditor();
  renderQuestionsEditor();
}

function renderPartiesEditor() {
  const container = elements.partiesEditor;
  container.replaceChildren();

  model.parties.forEach((party, index) => {
    const row = document.createElement("div");
    row.className = "editor-row";
    row.dataset.partyIndex = String(index);
    row.dataset.partyId = party.id;

    const idInput = makeInput("text", party.id, "ID", "editor-field-small");
    idInput.dataset.field = "id";
    idInput.addEventListener("input", () => {
      party.id = idInput.value;
    });
    idInput.addEventListener("change", () => {
      const newId = idInput.value.trim();
      if (!newId) {
        idInput.value = party.id;
        return;
      }
      const oldId = row.dataset.partyId;
      if (newId !== oldId) {
        migratePartyId(oldId, newId);
        row.dataset.partyId = newId;
        renderQuestionsEditor();
      }
      afterModelChange();
    });

    const nameInput = makeInput("text", party.name, "Name", "editor-field");
    nameInput.dataset.field = "name";
    nameInput.addEventListener("input", () => {
      party.name = nameInput.value;
      afterModelChange();
    });

    const shortInput = makeInput("text", party.shortName, "Kürzel", "editor-field-small");
    shortInput.dataset.field = "shortName";
    shortInput.addEventListener("input", () => {
      party.shortName = shortInput.value;
      afterModelChange();
    });

    const colorInput = document.createElement("input");
    colorInput.type = "color";
    colorInput.value = normalizeColor(party.color);
    colorInput.dataset.field = "color";
    colorInput.addEventListener("input", () => {
      party.color = colorInput.value;
      colorText.value = colorInput.value;
      afterModelChange();
    });

    const colorText = makeInput("text", party.color, "#hex", "editor-field-small");
    colorText.dataset.field = "color-text";
    colorText.addEventListener("input", () => {
      const v = colorText.value.trim();
      if (/^#[0-9a-fA-F]{6}$/.test(v)) {
        party.color = v;
        colorInput.value = v;
        afterModelChange();
      }
    });

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "text-button danger";
    removeBtn.textContent = "Entfernen";
    removeBtn.addEventListener("click", () => {
      model.parties.splice(index, 1);
      model.questions.forEach((q) => {
        delete q.parties[party.id];
        delete q.partyExplanations[party.id];
      });
      renderVisualEditor();
      afterModelChange();
    });

    row.append(idInput, nameInput, shortInput, colorInput, colorText, removeBtn);
    container.append(row);
  });
}

function renderQuestionsEditor() {
  const container = elements.questionsEditor;
  container.replaceChildren();

  model.questions.forEach((question, index) => {
    const card = document.createElement("div");
    card.className = "qe-card";
    card.dataset.questionIndex = String(index);

    const head = document.createElement("div");
    head.className = "qe-head";

    const idInput = makeInput("text", question.id, "ID", "editor-field-small");
    idInput.addEventListener("input", () => {
      question.id = idInput.value;
      afterModelChange();
    });

    const categoryInput = makeInput("text", question.category, "Kategorie", "editor-field");
    categoryInput.addEventListener("input", () => {
      question.category = categoryInput.value;
      afterModelChange();
    });

    const weightInput = document.createElement("input");
    weightInput.type = "number";
    weightInput.min = "1";
    weightInput.step = "1";
    weightInput.value = String(question.weight);
    weightInput.className = "editor-field-small";
    weightInput.addEventListener("input", () => {
      const n = Number(weightInput.value);
      if (Number.isFinite(n) && n > 0) {
        question.weight = n;
        afterModelChange();
      }
    });

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "text-button danger";
    removeBtn.textContent = "These entfernen";
    removeBtn.addEventListener("click", () => {
      model.questions.splice(index, 1);
      renderQuestionsEditor();
      afterModelChange();
    });

    head.append(idInput, categoryInput, weightInput, removeBtn);

    const textArea = document.createElement("textarea");
    textArea.className = "qe-text";
    textArea.value = question.question;
    textArea.rows = 2;
    textArea.addEventListener("input", () => {
      question.question = textArea.value;
      afterModelChange();
    });

    const answersWrap = document.createElement("div");
    answersWrap.className = "qe-answers";
    for (const party of model.parties) {
      const label = document.createElement("label");
      label.className = "qe-answer";
      const name = document.createElement("span");
      name.textContent = party.shortName || party.id;
      const select = document.createElement("select");
      for (const answer of VALID_ANSWERS) {
        const option = document.createElement("option");
        option.value = answer;
        option.textContent = answer === "unknown" ? "Keine Aussage gefunden" : answer;
        if (question.parties[party.id] === answer) option.selected = true;
        select.append(option);
      }
      select.addEventListener("change", () => {
        question.parties[party.id] = select.value;
        afterModelChange();
      });
      label.append(name, select);
      answersWrap.append(label);
    }

    card.append(head, textArea, answersWrap);
    container.append(card);
  });
}

function makeInput(type, value, placeholder, className) {
  const input = document.createElement("input");
  input.type = type;
  input.value = value;
  input.placeholder = placeholder;
  input.className = className || "editor-field";
  return input;
}

function normalizeColor(value) {
  const v = String(value || "").trim();
  if (/^#[0-9a-fA-F]{6}$/.test(v)) return v;
  return "#000000";
}

function migratePartyId(oldId, newId) {
  const party = model.parties.find((p) => p.id === oldId);
  if (!party) return;
  party.id = newId;
  for (const q of model.questions) {
    if (Object.prototype.hasOwnProperty.call(q.parties, oldId)) {
      q.parties[newId] = q.parties[oldId];
      delete q.parties[oldId];
    }
    if (Object.prototype.hasOwnProperty.call(q.partyExplanations, oldId)) {
      q.partyExplanations[newId] = q.partyExplanations[oldId];
      delete q.partyExplanations[oldId];
    }
  }
}

function handleAddParty() {
  const existing = model.parties.length;
  const id = `neue-partei-${existing + 1}`;
  model.parties.push({ id, name: "Neue Partei", shortName: "Neu", color: "#888888" });
  for (const q of model.questions) {
    q.parties[id] = "unknown";
  }
  renderVisualEditor();
  afterModelChange();
  setStatus(`Partei „${id}“ hinzugefügt. Vergib Name und Farbe.`, "info");
}

function handleAddQuestion() {
  const existing = model.questions.length;
  const id = `neue-these-${existing + 1}`;
  const parties = {};
  for (const p of model.parties) parties[p.id] = "unknown";
  model.questions.push({
    id,
    question: "Neue These eingeben …",
    category: "Allgemein",
    weight: 1,
    parties,
    sources: [],
    links: [],
    partyExplanations: {}
  });
  renderQuestionsEditor();
  afterModelChange();
  setStatus(`These „${id}“ hinzugefügt. Bearbeite Text und Antworten.`, "info");
}

function afterModelChange() {
  syncCsvTextareas();
  renderPreviews(model.parties, model.questions);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function handleFileLoad(event, target) {
  const file = event.target.files?.[0];
  if (!file) return;
  const text = await file.text();
  target.value = text;
  setStatus(`Datei „${file.name}“ geladen. Klicke auf „Vorschau aktualisieren“, um den Editor zu synchronisieren.`, "info");
  event.target.value = "";
}

function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function setStatus(message, kind) {
  elements.status.textContent = message;
  elements.status.dataset.kind = kind || "info";
}
