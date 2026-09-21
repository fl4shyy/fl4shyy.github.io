/**
 * Zentrale Bewertungslogik. Übersprungene Fragen werden nicht gewertet.
 * Als wichtig markierte Antworten fließen mit dem doppelten Gewicht ein;
 * die sichtbare Anzahl gleicher Antworten bleibt davon bewusst unberührt.
 */
export function calculateResults({ questions, parties, questionStates }) {
  return parties
    .map((party) => {
      const result = questions.reduce(
        (totals, question) => {
          const state = questionStates.get(question.id);
          if (!state?.answer) {
            if (state?.skipped) totals.skipped += 1;
            return totals;
          }

          const weight = (question.weight || 1) * (state.isImportant ? 2 : 1);
          const userAnswer = state.answer;
          const partyAnswer = question.parties[party.id];

          if (partyAnswer === "unknown") {
            totals.unknown += 1;
            return totals;
          }

          totals.totalWeight += weight;

          if (userAnswer === partyAnswer) {
            totals.matches += 1;
            totals.weightedMatches += weight;
          } else {
            totals.differences += 1;
          }
          return totals;
        },
        {
          matches: 0,
          differences: 0,
          skipped: 0,
          unknown: 0,
          weightedMatches: 0,
          totalWeight: 0
        }
      );

      return {
        ...party,
        ...result,
        percentage: result.totalWeight
          ? Math.round((result.weightedMatches / result.totalWeight) * 100)
          : 0
      };
    })
    .sort(
      (a, b) =>
        b.percentage - a.percentage ||
        b.weightedMatches - a.weightedMatches ||
        b.matches - a.matches ||
        a.name.localeCompare(b.name)
    );
}
