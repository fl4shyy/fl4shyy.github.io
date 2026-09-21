import { loadQuestions } from "./dataLoader.js";
import { CHOICE_LABELS, createQuiz } from "./quiz.js";
import { calculateTendency, calculateTendenciesByArea } from "./scoring.js";

const elements = {
  loading: document.querySelector("#loading-state"),
  error: document.querySelector("#error-state"),
  errorMessage: document.querySelector("#error-message"),
  welcome: document.querySelector("#welcome-screen"),
  quiz: document.querySelector("#quiz-screen"),
  results: document.querySelector("#result-screen"),
  startButton: document.querySelector("#start-button"),
  restartButton: document.querySelector("#restart-button"),
  progressText: document.querySelector("#progress-text"),
  resolvedText: document.querySelector("#resolved-text"),
  progressNavigation: document.querySelector("#progress-navigation"),
  questionAreaLabel: document.querySelector("#question-area-label"),
  questionTitle: document.querySelector("#question-title"),
  leftCard: document.querySelector("#left-position-card"),
  rightCard: document.querySelector("#right-position-card"),
  leftButton: document.querySelector("#left-position-button"),
  rightButton: document.querySelector("#right-position-button"),
  leftText: document.querySelector("#left-position-text"),
  rightText: document.querySelector("#right-position-text"),
  leftSources: document.querySelector("#left-position-sources"),
  rightSources: document.querySelector("#right-position-sources"),
  neitherButton: document.querySelector("#neither-button"),
  contextSection: document.querySelector("#context-section"),
  contextText: document.querySelector("#context-text"),
  skipButton: document.querySelector("#skip-button"),
  liveTrack: document.querySelector("#live-tendency-track"),
  liveMarker: document.querySelector("#live-tendency-marker"),
  liveStatus: document.querySelector("#live-tendency-status"),
  resultTitle: document.querySelector("#result-title"),
  finalTrack: document.querySelector("#final-tendency-track"),
  finalMarker: document.querySelector("#final-tendency-marker"),
  cduPercentage: document.querySelector("#cdu-percentage"),
  gruenePercentage: document.querySelector("#gruene-percentage"),
  finalResultText: document.querySelector("#final-result-text"),
  resultCounts: document.querySelector("#result-counts"),
  areaTendencyList: document.querySelector("#area-tendency-list"),
  answerReviewList: document.querySelector("#answer-review-list"),
  commonThemesCloud: document.querySelector("#common-themes-cloud")
};

let data;
let quiz;

initialize();

async function initialize() {
  try {
    data = await loadQuestions();
    quiz = createQuiz(data.fragen);
    bindEvents();
    showScreen("welcome");
  } catch (error) {
    showError(error);
  }
}

function bindEvents() {
  elements.startButton.addEventListener("click", startQuiz);
  elements.restartButton.addEventListener("click", () => window.location.reload());
  elements.leftButton.addEventListener("click", () => choose("left"));
  elements.rightButton.addEventListener("click", () => choose("right"));
  elements.neitherButton.addEventListener("click", () => choose("neither"));
  elements.skipButton.addEventListener("click", handleSkip);
  elements.progressNavigation.addEventListener("click", handleNavigation);
}

function startQuiz() {
  document.body.classList.add("quiz-started");
  showScreen("quiz");
  renderQuestion();
  elements.questionTitle.focus();
}

function renderQuestion() {
  const question = quiz.getCurrentQuestion();
  const state = quiz.getQuestionState(question.id);
  const index = quiz.getCurrentIndex();
  const leftPosition = question.positionen[question.leftActor];
  const rightPosition = question.positionen[question.rightActor];

  elements.progressText.textContent = `Thema ${index + 1} von ${quiz.getTotalQuestions()}`;
  elements.resolvedText.textContent = `${quiz.getResolvedCount()} bearbeitet`;
  elements.questionAreaLabel.textContent = question.bereich;
  elements.questionTitle.textContent = question.thema;
  elements.leftText.textContent = leftPosition.text;
  elements.rightText.textContent = rightPosition.text;
  renderSources(elements.leftSources, leftPosition.quellen);
  renderSources(elements.rightSources, rightPosition.quellen);
  renderContext(question.kontext);
  renderSelection(state);
  renderProgressNavigation();
  renderLiveTendency();
  elements.skipButton.textContent = state.skipped ? "Überspringen zurücknehmen" : "Thema überspringen";
}

function renderSources(container, sources) {
  if (!sources.length) {
    const missing = document.createElement("span");
    missing.className = "source-tag is-missing";
    missing.textContent = "Quelle noch nicht hinterlegt";
    container.replaceChildren(missing);
    return;
  }
  container.replaceChildren(...sources.map((source) => {
    if (source.link) {
      const link = document.createElement("a");
      link.className = "source-tag";
      link.href = source.link;
      link.target = "_blank";
      link.rel = "noreferrer";
      link.textContent = source.text;
      return link;
    }
    const label = document.createElement("span");
    label.className = `source-tag${source.linkFehlt ? " is-missing" : ""}`;
    label.textContent = source.text;
    if (source.linkFehlt) label.title = "Link noch nicht hinterlegt";
    return label;
  }));
}

function renderContext(context) {
  if (!context || context === "-") {
    elements.contextSection.hidden = true;
    elements.contextText.replaceChildren();
    return;
  }
  elements.contextSection.hidden = false;
  const parts = context.split(/(https?:\/\/[^\s]+)/g);
  elements.contextText.replaceChildren(...parts.filter(Boolean).map((part) => {
    if (!/^https?:\/\//.test(part)) return document.createTextNode(part);
    const link = document.createElement("a");
    link.href = part;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = "Weitere Informationen öffnen";
    return link;
  }));
}

function renderSelection(state) {
  const selected = state.skipped ? null : state.choice;
  [[elements.leftButton, elements.leftCard, "left"], [elements.rightButton, elements.rightCard, "right"]].forEach(([button, card, choice]) => {
    const active = selected === choice;
    button.setAttribute("aria-pressed", String(active));
    card.classList.toggle("is-selected", active);
  });
  const neitherSelected = selected === "neither";
  elements.neitherButton.setAttribute("aria-pressed", String(neitherSelected));
  elements.neitherButton.classList.toggle("is-selected", neitherSelected);
}

function renderProgressNavigation() {
  const currentIndex = quiz.getCurrentIndex();
  elements.progressNavigation.replaceChildren(...data.fragen.map((question, index) => {
    const state = quiz.getQuestionState(question.id);
    const status = state.skipped ? "übersprungen" : state.choice ? "beantwortet" : "offen";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "progress-dot";
    button.dataset.questionIndex = String(index);
    button.setAttribute("aria-label", `Thema ${index + 1}: ${status}`);
    button.title = `Thema ${index + 1}: ${status}`;
    if (index === currentIndex) button.setAttribute("aria-current", "page");
    button.classList.toggle("is-current", index === currentIndex);
    button.classList.toggle("is-answered", Boolean(state.choice));
    button.classList.toggle("is-skipped", state.skipped);
    return button;
  }));
}

function renderLiveTendency() {
  const result = calculateTendency(quiz.getQuestionStates());
  setMarker(elements.liveMarker, result.markerPercentage);
  if (result.directional === 0) {
    elements.liveStatus.textContent = "Noch keine Tendenz";
    elements.liveTrack.setAttribute("aria-label", "Noch keine Tendenz");
    return;
  }
  const status = result.leader === "tie" ? "Ausgeglichene Tendenz" : `Tendenz zu ${result.leader === "cdu" ? "Kandidat A" : "Kandidat B"}`;
  elements.liveStatus.textContent = status;
  elements.liveTrack.setAttribute("aria-label", `${status}. ${result.cdu} Auswahl für Kandidat A, ${result.gruene} für Kandidat B.`);
}

function choose(choice) {
  quiz.answer(choice);
  advanceAfterResponse();
}

function handleSkip() {
  const question = quiz.getCurrentQuestion();
  const state = quiz.getQuestionState(question.id);
  if (state.skipped) {
    quiz.unskipCurrentQuestion();
    renderQuestion();
    elements.skipButton.focus();
    return;
  }
  quiz.skipCurrentQuestion();
  advanceAfterResponse();
}

function handleNavigation(event) {
  const button = event.target.closest("[data-question-index]");
  if (!button) return;
  quiz.goToQuestion(Number(button.dataset.questionIndex));
  renderQuestion();
  elements.questionTitle.focus();
}

function advanceAfterResponse() {
  setQuizControlsDisabled(true);
  window.setTimeout(() => {
    if (quiz.isComplete()) {
      renderResults();
      showScreen("results");
      elements.resultTitle.focus();
      return;
    }
    quiz.goToQuestion(quiz.getNextUnresolvedIndex());
    renderQuestion();
    setQuizControlsDisabled(false);
    elements.questionTitle.focus();
  }, 180);
}

function renderResults() {
  const states = quiz.getQuestionStates();
  const result = calculateTendency(states);
  setMarker(elements.finalMarker, result.markerPercentage);
  if (result.directional === 0) {
    elements.cduPercentage.textContent = "–";
    elements.gruenePercentage.textContent = "–";
    elements.finalResultText.textContent = "Keine eindeutige Tendenz: Du hast keine der beiden Positionen ausgewählt.";
    elements.finalTrack.setAttribute("aria-label", "Keine eindeutige Tendenz");
  } else {
    elements.cduPercentage.textContent = `${result.cduPercentage} %`;
    elements.gruenePercentage.textContent = `${result.gruenePercentage} %`;
    elements.finalResultText.textContent = result.leader === "tie"
      ? "Deine eindeutigen Positionswahlen sind ausgeglichen."
      : `Deine Auswahl tendiert zu ${result.leader === "cdu" ? "Katharina Pötter (CDU)" : "Volker Bajus (BÜNDNIS 90/DIE GRÜNEN)"}.`;
    elements.finalTrack.setAttribute("aria-label", `${result.cduPercentage} Prozent CDU und ${result.gruenePercentage} Prozent BÜNDNIS 90/DIE GRÜNEN.`);
  }
  elements.resultCounts.replaceChildren(
    createCount(`${result.cdu}`, "Positionen für CDU"),
    createCount(`${result.gruene}`, "Positionen für GRÜNE"),
    createCount(`${result.neither}`, "Keine von beiden"),
    createCount(`${result.skipped}`, "Übersprungen")
  );
  renderAreaTendencies(states);
  renderAnswerReview(states);
  renderCommonThemes();
}

function renderAreaTendencies(states) {
  const areaResults = calculateTendenciesByArea(data.fragen, states);
  elements.areaTendencyList.replaceChildren(...areaResults.map(({ bereich, result }) => {
    const card = document.createElement("section");
    card.className = "area-tendency-card";

    const heading = document.createElement("h3");
    heading.textContent = bereich;

    const values = document.createElement("div");
    values.className = "area-tendency-values";
    values.append(
      createAreaValue("CDU", result.cduPercentage),
      createAreaValue("GRÜNE", result.gruenePercentage)
    );

    const track = document.createElement("div");
    track.className = "tendency-track tendency-track-final area-tendency-track";
    track.setAttribute("role", "img");
    track.setAttribute("aria-label", result.directional === 0
      ? `${bereich}: Keine eindeutige Tendenz.`
      : `${bereich}: ${result.cduPercentage} Prozent CDU und ${result.gruenePercentage} Prozent BÜNDNIS 90/DIE GRÜNEN.`);
    const marker = document.createElement("span");
    marker.className = "tendency-marker";
    setMarker(marker, result.markerPercentage);
    track.append(marker);

    const note = document.createElement("p");
    note.textContent = result.directional === 0
      ? "Keine eindeutige Positionswahl in diesem Themenbereich."
      : `${result.directional} eindeutige ${result.directional === 1 ? "Positionswahl" : "Positionswahlen"}`;

    card.append(heading, values, track, note);
    return card;
  }));
}

function createAreaValue(label, percentage) {
  const value = document.createElement("span");
  const name = document.createElement("strong");
  const number = document.createElement("b");
  name.textContent = label;
  number.textContent = percentage === null ? "–" : `${percentage} %`;
  value.append(name, number);
  return value;
}

function renderAnswerReview(states) {
  elements.answerReviewList.replaceChildren(...data.fragen.map((question) => {
    const state = states.get(question.id);
    const item = document.createElement("li");
    const topic = document.createElement("strong");
    topic.textContent = question.thema;
    const result = document.createElement("span");
    if (state.skipped) {
      result.textContent = "Übersprungen";
    } else if (state.choice === "neither") {
      result.textContent = "Keine von beiden";
    } else {
      const candidate = data.kandidaten[state.actor];
      result.textContent = `${CHOICE_LABELS[state.choice]} · ${candidate.name} (${candidate.partei})`;
    }
    item.append(topic, result);
    return item;
  }));
}

function renderCommonThemes() {
  if (data.gemeinsameThemen.length === 0) {
    const pending = document.createElement("p");
    pending.className = "common-themes-pending";
    pending.textContent = "Die Liste gemeinsamer Themen wird noch ergänzt.";
    elements.commonThemesCloud.replaceChildren(pending);
    return;
  }
  elements.commonThemesCloud.replaceChildren(...data.gemeinsameThemen.map((theme, index) => {
    const tag = document.createElement("span");
    tag.className = `theme-tag theme-tag-${(index % 3) + 1}`;
    tag.textContent = theme;
    return tag;
  }));
}

function createCount(value, label) {
  const box = document.createElement("div");
  const strong = document.createElement("strong");
  const span = document.createElement("span");
  strong.textContent = value;
  span.textContent = label;
  box.append(strong, span);
  return box;
}

function setMarker(marker, percentage) {
  marker.style.left = `${Math.max(0, Math.min(100, percentage))}%`;
}

function setQuizControlsDisabled(disabled) {
  [elements.leftButton, elements.rightButton, elements.neitherButton, elements.skipButton].forEach((button) => {
    button.disabled = disabled;
  });
  elements.progressNavigation.querySelectorAll("button").forEach((button) => {
    button.disabled = disabled;
  });
}

function showScreen(name) {
  ["loading", "error", "welcome", "quiz", "results"].forEach((screen) => {
    elements[screen].classList.toggle("is-hidden", screen !== name);
  });
}

function showError(error) {
  console.error(error);
  elements.errorMessage.textContent = error.message || "Unbekannter Fehler beim Laden der Daten.";
  showScreen("error");
}
