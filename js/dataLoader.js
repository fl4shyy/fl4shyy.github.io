const ACTOR_IDS = ["cdu", "gruene"];

export async function loadQuestions(url = "data/questions.json") {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Die Datendatei konnte nicht geladen werden (Status ${response.status}).`);
  }
  const data = await response.json();
  validateQuestionData(data);
  return data;
}

export function validateQuestionData(data) {
  if (!data || !Array.isArray(data.fragen) || data.fragen.length === 0) {
    throw new Error("Die Datendatei enthält keine Themen.");
  }
  if (!data.kandidaten || !ACTOR_IDS.every((actor) => data.kandidaten[actor])) {
    throw new Error("Die Datendatei enthält nicht beide Kandidaten.");
  }
  if (!Array.isArray(data.gemeinsameThemen)) {
    throw new Error("Die Liste gemeinsamer Themen ist ungültig.");
  }

  const ids = new Set();
  data.fragen.forEach((frage, index) => {
    if (!frage.id || !frage.bereich || !frage.thema || !frage.positionen || !frage.kontext) {
      throw new Error(`Thema ${index + 1} ist unvollständig.`);
    }
    if (ids.has(frage.id)) {
      throw new Error(`Die Themen-ID „${frage.id}“ ist doppelt vorhanden.`);
    }
    ids.add(frage.id);
    if (!ACTOR_IDS.includes(frage.leftActor) || !ACTOR_IDS.includes(frage.rightActor) || frage.leftActor === frage.rightActor) {
      throw new Error(`Thema ${index + 1} besitzt keine gültige Links-Rechts-Zuordnung.`);
    }
    ACTOR_IDS.forEach((actor) => {
      const position = frage.positionen[actor];
      if (!position || !position.text || !Array.isArray(position.quellen)) {
        throw new Error(`Thema ${index + 1} enthält für „${actor}“ keine vollständige Position.`);
      }
      position.quellen.forEach((quelle) => {
        if (!quelle || typeof quelle.text !== "string" || typeof quelle.link !== "string") {
          throw new Error(`Thema ${index + 1} enthält eine ungültige Quelle.`);
        }
      });
    });
  });
}
