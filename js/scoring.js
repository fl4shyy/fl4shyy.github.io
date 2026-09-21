export function calculateTendency(questionStates) {
  const totals = { cdu: 0, gruene: 0, neither: 0, skipped: 0, directional: 0 };
  questionStates.forEach((state) => {
    if (state.skipped) {
      totals.skipped += 1;
    } else if (state.choice === "neither") {
      totals.neither += 1;
    } else if (state.actor === "cdu" || state.actor === "gruene") {
      totals[state.actor] += 1;
      totals.directional += 1;
    }
  });

  if (totals.directional === 0) {
    return { ...totals, cduPercentage: null, gruenePercentage: null, markerPercentage: 50, leader: null };
  }

  const cduPercentage = Math.round((totals.cdu / totals.directional) * 100);
  const gruenePercentage = 100 - cduPercentage;
  const markerPercentage = Math.round((totals.gruene / totals.directional) * 100);
  const leader = totals.cdu === totals.gruene ? "tie" : totals.cdu > totals.gruene ? "cdu" : "gruene";
  return { ...totals, cduPercentage, gruenePercentage, markerPercentage, leader };
}

export function calculateTendenciesByArea(questions, questionStates) {
  const areaStates = new Map();

  questions.forEach((question) => {
    if (!areaStates.has(question.bereich)) areaStates.set(question.bereich, new Map());
    areaStates.get(question.bereich).set(question.id, questionStates.get(question.id));
  });

  return Array.from(areaStates, ([bereich, states]) => ({
    bereich,
    result: calculateTendency(states)
  }));
}
