import { loadQuestions } from "./dataLoader.js";
import { ANSWER_LABELS, PARTY_ANSWER_LABELS, createQuiz } from "./quiz.js";
import { calculateResults } from "./scoring.js";

const ANSWER_ICON_PATHS = {
  agree: "assets/stimme zu.svg",
  neutral: "assets/neutral.svg",
  disagree: "assets/stimme nicht zu.svg"
};

const elements = {
  loading: document.querySelector("#loading-state"),
  error: document.querySelector("#error-state"),
  errorMessage: document.querySelector("#error-message"),
  welcome: document.querySelector("#welcome-screen"),
  quiz: document.querySelector("#quiz-screen"),
  weighting: document.querySelector("#weighting-screen"),
  results: document.querySelector("#result-screen"),
  startButton: document.querySelector("#start-button"),
  restartButton: document.querySelector("#restart-button"),
  questionText: document.querySelector("#question-text"),
  resultTitle: document.querySelector("#result-title"),
  weightingTitle: document.querySelector("#weighting-title"),
  weightingCount: document.querySelector("#weighting-count"),
  weightingList: document.querySelector("#weighting-list"),
  weightingBackButton: document.querySelector("#weighting-back-button"),
  weightingContinueButton: document.querySelector("#weighting-continue-button"),
  categoryLabel: document.querySelector("#category-label"),
  questionSources: document.querySelector("#question-sources"),
  progressText: document.querySelector("#progress-text"),
  progressNavigation: document.querySelector("#progress-navigation"),
  answerOptions: document.querySelector("#answer-options"),
  skipButton: document.querySelector("#skip-button"),
  resultsNote: document.querySelector("#results-note"),
  resultList: document.querySelector("#result-list")
};

let quiz;
let data;

initialize();

async function initialize() {
  try {
    data = await loadQuestions();
    quiz = createQuiz(data.questions);
    showScreen("welcome");
    bindEvents();
  } catch (error) {
    showError(error);
  }
}

function bindEvents() {
  elements.startButton.addEventListener("click", startQuiz);
  elements.restartButton.addEventListener("click", () => window.location.reload());
  elements.answerOptions.addEventListener("click", handleAnswer);
  elements.skipButton.addEventListener("click", handleSkip);
  elements.progressNavigation.addEventListener("click", handleQuestionNavigation);
  elements.resultList.addEventListener("click", handleResultToggle);
  elements.weightingList.addEventListener("click", handleWeightingToggle);
  elements.weightingBackButton.addEventListener("click", handleWeightingBack);
  elements.weightingContinueButton.addEventListener("click", handleWeightingContinue);
}

function startQuiz() {
  showScreen("quiz");
  renderQuestion();
  elements.questionText.focus();
}

function renderQuestion() {
  const question = quiz.getCurrentQuestion();
  const state = quiz.getQuestionState(question.id);
  const currentNumber = quiz.getCurrentIndex() + 1;
  const total = quiz.getTotalQuestions();

  elements.questionText.textContent = question.question;
  elements.categoryLabel.textContent = question.category;
  elements.progressText.textContent = `These ${currentNumber} von ${total} · ${quiz.getResolvedCount()} erledigt`;
  renderQuestionSources(question.sources);
  renderProgressNavigation();
  renderAnswerSelection(state.answer);
  updateSkipButton(state.skipped);
}

function renderQuestionSources(sources) {
  elements.questionSources.replaceChildren(
    ...(sources || []).map((source) => {
      const tag = document.createElement("span");
      tag.className = "source-tag";
      tag.textContent = source;
      return tag;
    })
  );
}

function renderProgressNavigation() {
  const currentIndex = quiz.getCurrentIndex();

  elements.progressNavigation.replaceChildren(
    ...data.questions.map((question, index) => {
      const state = quiz.getQuestionState(question.id);
      const status = state.skipped ? "übersprungen" : state.answer ? "beantwortet" : "offen";
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "progress-dot";
      dot.dataset.questionIndex = String(index);
      dot.setAttribute("aria-label", `These ${index + 1}: ${status}`);
      dot.setAttribute("title", `These ${index + 1}: ${status}`);
      dot.setAttribute("aria-current", String(index === currentIndex));
      dot.classList.toggle("is-current", index === currentIndex);
      dot.classList.toggle("is-answered", Boolean(state.answer));
      dot.classList.toggle("is-skipped", state.skipped);
      dot.classList.toggle("is-important", state.isImportant);
      return dot;
    })
  );
}

function renderAnswerSelection(answer) {
  elements.answerOptions.querySelectorAll("[data-answer]").forEach((button) => {
    const isSelected = button.dataset.answer === answer;
    button.classList.toggle("is-selected", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  });
}

function updateSkipButton(isSkipped) {
  elements.skipButton.textContent = isSkipped
    ? "Überspringen zurücknehmen"
    : "Frage überspringen";
}

function handleAnswer(event) {
  const button = event.target.closest("[data-answer]");
  if (!button || quiz.isComplete()) return;

  quiz.answer(button.dataset.answer);
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

function handleQuestionNavigation(event) {
  const dot = event.target.closest("[data-question-index]");
  if (!dot) return;

  quiz.goToQuestion(Number(dot.dataset.questionIndex));
  renderQuestion();
  elements.questionText.focus();
}

function advanceAfterResponse() {
  // Verhindert Mehrfachklicks während der kurzen Übergangsanimation.
  setQuizControlsDisabled(true);

  window.setTimeout(() => {
    if (quiz.isComplete()) {
      renderWeighting();
      showScreen("weighting");
      elements.weightingTitle.focus();
      return;
    }

    quiz.goToQuestion(quiz.getNextUnresolvedIndex());
    renderQuestion();
    setQuizControlsDisabled(false);
    elements.questionText.focus();
  }, 180);
}

function renderWeighting() {
  const states = quiz.getQuestionStates();
  const importantCount = quiz.getImportantAnsweredCount();

  elements.weightingCount.textContent = importantCount
    ? `${importantCount} ${importantCount === 1 ? "These ist" : "Thesen sind"} als wichtig markiert (zählen doppelt).`
    : "Keine These als wichtig markiert.";

  elements.weightingList.replaceChildren(
    ...data.questions.map((question, index) => {
      const state = states.get(question.id);
      const item = document.createElement("li");
      item.className = "weighting-item";
      item.dataset.weightingQuestionId = question.id;
      if (state.skipped) item.classList.add("is-skipped");

      const meta = document.createElement("div");
      meta.className = "weighting-item-meta";
      const q = document.createElement("p");
      q.className = "weighting-question";
      q.textContent = `${index + 1}. ${question.question}`;
      const category = document.createElement("span");
      category.className = "category-label question-category";
      category.textContent = question.category;

      const answer = document.createElement("p");
      answer.className = "weighting-answer";
      if (state.skipped) {
        answer.textContent = "Übersprungen";
      } else {
        const icon = document.createElement("img");
        icon.className = "comparison-answer-icon";
        icon.src = ANSWER_ICON_PATHS[state.answer];
        icon.alt = "";
        icon.setAttribute("aria-hidden", "true");
        answer.append(icon, document.createTextNode(ANSWER_LABELS[state.answer]));
      }
      meta.append(q, category, answer);

      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "weighting-toggle";
      if (state.isImportant) toggle.classList.add("is-active");
      toggle.dataset.weightingQuestionId = question.id;
      toggle.setAttribute("aria-pressed", String(state.isImportant));
      const badge = document.createElement("span");
      badge.className = "weighting-badge";
      badge.textContent = "2×";
      badge.setAttribute("aria-hidden", "true");
      const label = document.createTextNode(state.isImportant ? "Wichtig" : "Als wichtig");
      toggle.append(badge, label);
      if (state.skipped) {
        toggle.disabled = true;
        toggle.setAttribute("aria-label", "Übersprungene Thesen können nicht gewichtet werden.");
      }

      item.append(meta, toggle);
      return item;
    })
  );
}

function handleWeightingToggle(event) {
  const item = event.target.closest(".weighting-item");
  if (!item) return;

  const toggle = item.querySelector("[data-weighting-question-id]");
  if (!toggle || toggle.disabled) return;

  const questionId = item.dataset.weightingQuestionId;
  const isImportant = toggle.getAttribute("aria-pressed") === "true";
  const next = quiz.setImportant(questionId, !isImportant);

  toggle.classList.toggle("is-active", next);
  toggle.setAttribute("aria-pressed", String(next));
  toggle.lastChild.nodeValue = next ? "Wichtig" : "Als wichtig";

  const importantCount = quiz.getImportantAnsweredCount();
  elements.weightingCount.textContent = importantCount
    ? `${importantCount} ${importantCount === 1 ? "These ist" : "Thesen sind"} als wichtig markiert (zählen doppelt).`
    : "Keine These als wichtig markiert.";
}

function handleWeightingBack() {
  showScreen("quiz");
  const lastIndex = data.questions.length - 1;
  quiz.goToQuestion(lastIndex);
  renderQuestion();
  setQuizControlsDisabled(false);
  elements.questionText.focus();
}

function handleWeightingContinue() {
  renderResults();
  showScreen("results");
  elements.resultTitle.focus();
}

function renderResults() {
  const questionStates = quiz.getQuestionStates();
  const results = calculateResults({
    questions: data.questions,
    parties: data.parties,
    questionStates
  });
  const importantAnswers = quiz.getImportantAnsweredCount();

  elements.resultsNote.textContent = importantAnswers
    ? `${importantAnswers} wichtige ${importantAnswers === 1 ? "Antwort wurde" : "Antworten wurden"} doppelt gewichtet.`
    : "Keine Antwort wurde zusätzlich gewichtet.";
  elements.resultList.replaceChildren(
    ...results.map((result, index) => createResultCard(result, questionStates, index === 0))
  );
}

function createResultCard(result, questionStates, isTopMatch) {
  const card = document.createElement("article");
  card.className = `result-card${isTopMatch ? " is-top-match" : ""}`;
  card.style.setProperty("--party-color", result.color);

  const detailId = `party-details-${result.id}`;
  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "result-toggle";
  toggle.dataset.resultToggle = "";
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-controls", detailId);

  const summary = document.createElement("span");
  summary.className = "result-summary";
  const title = document.createElement("span");
  title.className = "party-name";
  title.textContent = result.name;
  const score = document.createElement("span");
  score.className = "match-score";
  score.textContent = `${result.percentage} %`;
  summary.append(title, score);

  const bar = document.createElement("span");
  bar.className = "result-bar";
  bar.setAttribute("aria-label", `${result.percentage} Prozent Übereinstimmung`);
  const fill = document.createElement("span");
  fill.style.width = `${result.percentage}%`;
  bar.append(fill);

  const details = document.createElement("span");
  details.className = "result-details";
  details.append(
    createTextSpan("same-answer", `${result.matches} gleiche Antworten`),
    createTextSpan("", `${result.differences} unterschiedliche Antworten`)
  );
  if (result.skipped) {
    details.append(createTextSpan("", `${result.skipped} übersprungen`));
  }
  if (result.unknown) {
    details.append(createTextSpan("", `${result.unknown} keine Aussage`));
  }

  const arrow = document.createElement("img");
  arrow.className = "result-arrow";
  arrow.src = "assets/arrowdown.svg";
  arrow.alt = "";
  arrow.setAttribute("aria-hidden", "true");

  toggle.append(summary, bar, details, arrow);

  const detailPanel = document.createElement("section");
  detailPanel.id = detailId;
  detailPanel.className = "comparison-panel";
  detailPanel.hidden = true;
  detailPanel.append(createComparisonList(result, questionStates));

  card.append(toggle, detailPanel);
  return card;
}

function createComparisonList(result, questionStates) {
  const wrapper = document.createDocumentFragment();
  const intro = document.createElement("p");
  intro.className = "comparison-intro";
  intro.textContent = `Deine Antworten im Vergleich mit ${result.name}`;
  const list = document.createElement("ol");
  list.className = "comparison-list";

  data.questions.forEach((question, index) => {
    const state = questionStates.get(question.id);
    const partyAnswer = question.parties[result.id];
    const item = document.createElement("li");
    item.className = "comparison-item";

    const questionMeta = document.createElement("div");
    questionMeta.className = "question-meta-head";
    const questionText = document.createElement("p");
    questionText.className = "comparison-question";
    questionText.textContent = `${index + 1}. ${question.question}`;
    const category = document.createElement("span");
    category.className = "category-label question-category";
    category.textContent = question.category;
    questionMeta.append(questionText, category);

    const answers = document.createElement("div");
    answers.className = "comparison-answers";
    answers.append(
      createAnswerDisplay("Deine Antwort", state.answer, state.skipped, state.isImportant),
      createAnswerDisplay(
        `${result.name}`,
        partyAnswer,
        false,
        false,
        question.partyExplanations?.[result.id]
      )
    );

    const comparison = document.createElement("p");
    comparison.className = "comparison-status";
    if (state.skipped) {
      comparison.textContent = "Nicht gewertet";
    } else if (partyAnswer === "unknown") {
      comparison.textContent = "Nicht gewertet · Keine Aussage der Partei gefunden";
    } else if (state.answer === partyAnswer) {
      comparison.classList.add("is-match");
      comparison.textContent = "Gleiche Antwort";
    } else {
      comparison.textContent = "Unterschiedliche Antwort";
    }

    item.append(questionMeta, answers, comparison);
    list.append(item);
  });

  wrapper.append(intro, list);
  return wrapper;
}

function createAnswerDisplay(label, answer, skipped, isImportant, explanation = "") {
  const display = document.createElement("div");
  display.className = "comparison-answer";
  const answerLabel = document.createElement("span");
  answerLabel.className = "comparison-answer-label";
  answerLabel.textContent = label;
  const value = document.createElement("span");
  value.className = "comparison-answer-value";

  if (skipped) {
    value.classList.add("is-skipped");
    value.textContent = "Übersprungen";
  } else if (answer === "unknown") {
    value.classList.add("is-unknown");
    value.textContent = PARTY_ANSWER_LABELS.unknown;
  } else {
    const icon = document.createElement("img");
    icon.className = `comparison-answer-icon answer-${answer}`;
    icon.src = ANSWER_ICON_PATHS[answer];
    icon.alt = "";
    value.append(icon, document.createTextNode(ANSWER_LABELS[answer]));
  }

  display.append(answerLabel, value);
  if (isImportant && !skipped) {
    display.append(createTextSpan("important-note", "Wichtig · doppelt gewertet"));
  }
  if (explanation) {
    display.append(createTextSpan("party-explanation", explanation));
  }
  return display;
}

function createTextSpan(className, text) {
  const span = document.createElement("span");
  if (className) span.className = className;
  span.textContent = text;
  return span;
}

function handleResultToggle(event) {
  const toggle = event.target.closest("[data-result-toggle]");
  if (!toggle) return;

  const panel = document.querySelector(`#${toggle.getAttribute("aria-controls")}`);
  const isExpanded = toggle.getAttribute("aria-expanded") === "true";
  toggle.setAttribute("aria-expanded", String(!isExpanded));
  panel.hidden = isExpanded;
  toggle.closest(".result-card").classList.toggle("is-expanded", !isExpanded);
}

function setQuizControlsDisabled(disabled) {
  elements.answerOptions.querySelectorAll("button").forEach((button) => {
    button.disabled = disabled;
  });
  elements.skipButton.disabled = disabled;
  elements.progressNavigation.querySelectorAll("button").forEach((button) => {
    button.disabled = disabled;
  });
}

function showScreen(name) {
  ["loading", "error", "welcome", "quiz", "weighting", "results"].forEach((screen) => {
    elements[screen].classList.toggle("is-hidden", screen !== name);
  });
}

function showError(error) {
  console.error(error);
  elements.errorMessage.textContent = error.message || "Unbekannter Fehler beim Laden der Daten.";
  showScreen("error");
}
