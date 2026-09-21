export const CHOICE_LABELS = {
  left: "Position A",
  right: "Position B",
  neither: "Keine von beiden"
};

export function createQuiz(questions) {
  let currentIndex = 0;
  const states = new Map();

  const getState = (id) => ({ choice: null, actor: null, skipped: false, ...states.get(id) });
  const resolved = (id) => {
    const state = getState(id);
    return state.choice !== null || state.skipped;
  };

  return {
    getCurrentQuestion: () => questions[currentIndex],
    getCurrentIndex: () => currentIndex,
    getTotalQuestions: () => questions.length,
    getResolvedCount: () => questions.filter((question) => resolved(question.id)).length,
    getQuestionState: (id) => ({ ...getState(id) }),
    getQuestionStates: () => new Map(questions.map((question) => [question.id, { ...getState(question.id) }])),
    answer(choice) {
      const question = questions[currentIndex];
      const actor = choice === "left" ? question.leftActor : choice === "right" ? question.rightActor : null;
      states.set(question.id, { choice, actor, skipped: false });
    },
    skipCurrentQuestion() {
      const question = questions[currentIndex];
      states.set(question.id, { choice: null, actor: null, skipped: true });
    },
    unskipCurrentQuestion() {
      const question = questions[currentIndex];
      states.set(question.id, { choice: null, actor: null, skipped: false });
    },
    goToQuestion(index) {
      if (Number.isInteger(index) && index >= 0 && index < questions.length) currentIndex = index;
    },
    getNextUnresolvedIndex() {
      for (let offset = 1; offset <= questions.length; offset += 1) {
        const index = (currentIndex + offset) % questions.length;
        if (!resolved(questions[index].id)) return index;
      }
      return null;
    },
    isComplete: () => questions.every((question) => resolved(question.id))
  };
}
