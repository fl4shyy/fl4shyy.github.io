/**
 * Lädt und prüft den Fragenkatalog. Die schlanke Validierung gibt bei fehlerhaften
 * Datensätzen früh eine verständliche Meldung aus, ohne eine Bibliothek zu benötigen.
 */
export async function loadQuestions(url = "data/questions.json") {
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Die Fragendatei konnte nicht geladen werden (Status ${response.status}).`);
  }

  const data = await response.json();
  validateQuestionData(data);
  return data;
}

function validateQuestionData(data) {
  if (!data || !Array.isArray(data.questions) || data.questions.length === 0) {
    throw new Error("Die Fragendatei enthält keine Fragen.");
  }

  if (!Array.isArray(data.parties) || data.parties.length === 0) {
    throw new Error("Die Fragendatei enthält keine Parteien.");
  }

  const partyIds = new Set(data.parties.map((party) => party.id));
  const answerIds = new Set((data.answerOptions || []).map((option) => option.id));
  const partyAnswerIds = new Set([...answerIds, "unknown"]);
  const questionIds = new Set();

  if (partyIds.size !== data.parties.length || partyIds.has(undefined)) {
    throw new Error("Die Parteien benötigen eindeutige IDs.");
  }

  if (answerIds.size === 0) {
    throw new Error("Die Fragendatei enthält keine Antwortoptionen.");
  }

  data.questions.forEach((question, index) => {
    const hasRequiredFields =
      question.id && question.question && question.category && question.parties;
    if (!hasRequiredFields) {
      throw new Error(`Frage ${index + 1} ist unvollständig.`);
    }

    if (questionIds.has(question.id)) {
      throw new Error(`Die Frage-ID „${question.id}“ ist doppelt vorhanden.`);
    }
    questionIds.add(question.id);

    partyIds.forEach((partyId) => {
      if (!partyAnswerIds.has(question.parties[partyId])) {
        throw new Error(`Frage ${index + 1} enthält für „${partyId}“ keine gültige Antwort.`);
      }
    });
  });
}
