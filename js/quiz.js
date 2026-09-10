/** Antwortwerte werden unabhängig von der Sprache in der Datendatei gespeichert. */
export const ANSWER_LABELS = {
  agree: "Stimme zu",
  neutral: "Neutral",
  disagree: "Stimme nicht zu"
};

export const PARTY_ANSWER_LABELS = {
  ...ANSWER_LABELS,
  unknown: "Keine Aussage gefunden"
};

/**
 * Hält nur den aktuellen Sitzungszustand im Speicher.
 * Ein Seiten-Reload setzt den Fragebogen absichtlich zurück.
 */
export function createQuiz(questions) {
  let currentIndex = 0;
  const questionStates = new Map();

  const getState = (questionId) => ({
    answer: null,
    skipped: false,
    isImportant: false,
    ...questionStates.get(questionId)
  });

  const isResolved = (questionId) => {
    const state = getState(questionId);
    return state.answer !== null || state.skipped;
  };

  return {
    getCurrentQuestion: () => questions[currentIndex],
    getCurrentIndex: () => currentIndex,
    getTotalQuestions: () => questions.length,
    getQuestionState: (questionId) => ({ ...getState(questionId) }),
    getQuestionStates: () => new Map(
      questions.map((question) => [question.id, { ...getState(question.id) }])
    ),
    getResolvedCount: () => questions.filter((question) => isResolved(question.id)).length,
    getImportantAnsweredCount: () => questions.filter((question) => {
      const state = getState(question.id);
      return state.isImportant && state.answer !== null;
    }).length,
    answer(answer) {
      const questionId = questions[currentIndex].id;
      questionStates.set(questionId, { ...getState(questionId), answer, skipped: false });
    },
    skipCurrentQuestion() {
      const questionId = questions[currentIndex].id;
      questionStates.set(questionId, { ...getState(questionId), answer: null, skipped: true });
    },
    unskipCurrentQuestion() {
      const questionId = questions[currentIndex].id;
      questionStates.set(questionId, { ...getState(questionId), skipped: false });
    },
    toggleImportant() {
      const questionId = questions[currentIndex].id;
      const nextState = { ...getState(questionId), isImportant: !getState(questionId).isImportant };
      questionStates.set(questionId, nextState);
      return nextState.isImportant;
    },
    setImportant(questionId, isImportant) {
      const nextState = { ...getState(questionId), isImportant: Boolean(isImportant) };
      questionStates.set(questionId, nextState);
      return nextState.isImportant;
    },
    goToQuestion(index) {
      if (index >= 0 && index < questions.length) currentIndex = index;
    },
    getNextUnresolvedIndex() {
      for (let offset = 1; offset <= questions.length; offset += 1) {
        const index = (currentIndex + offset) % questions.length;
        if (!isResolved(questions[index].id)) return index;
      }
      return null;
    },
    isComplete: () => questions.every((question) => isResolved(question.id))
  };
}
