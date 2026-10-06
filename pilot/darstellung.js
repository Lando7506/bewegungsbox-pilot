/* Darstellung des Fragebogens: welche Fragen zusammen auf einem Bildschirm stehen und wie lange Fragetexte
 * gegliedert werden. Nur Darstellung. Fragetexte, Reihenfolge der Auswertung und Regeln bleiben unverändert
 * (die kommen aus fragebogen.json und logik.js).
 *
 * Grundlage: Rückmeldungen aus simulierten Kundentests (Tablet, Handy, Angehörige, Zittern) und einer
 * UX Prüfung vom 06.10.2026. Der Test pilot/tests/darstellung.test.js prüft:
 *  - jede Frage steht auf genau einem Bildschirm,
 *  - Bedingungen verweisen nur auf Fragen auf demselben oder einem früheren Bildschirm,
 *  - die gegliederten Texte ergeben zusammengesetzt Zeichen für Zeichen den Fragetext.
 */
(function (global) {
  "use strict";

  // Bildschirme in Anzeigereihenfolge. Folgefragen (A2a, C3a, C4a, D2a ...) erscheinen auf demselben
  // Bildschirm, sobald ihre Bedingung erfüllt ist.
  const SEITEN = [
    { titel: "Einverständnis", fragen: ["W1", "W2"] },
    { titel: "Wer füllt aus?", fragen: ["W3", "W3a", "W3b"] },
    { titel: "Kontakt", fragen: ["K1", "K2", "K3", "K4", "K5"] },
    { titel: "Operationen und Gelenke", fragen: ["A1", "A2", "A2a", "A3"] },
    { titel: "Herz und Atmung", fragen: ["B1", "B2", "B7"] },
    { titel: "Beine", fragen: ["B5"] },
    { titel: "Weitere Angaben zur Gesundheit", fragen: ["B3", "B4", "B6", "M1"] },
    { titel: "Schwindel und Stürze", fragen: ["C1", "C2", "C3", "C3a", "C3b"] },
    { titel: "Sicherheit beim Stehen", fragen: ["C4", "C4a"] },
    { titel: "Beweglichkeit im Alltag", fragen: ["C5", "C6", "F1"] },
    { titel: "Knochen", fragen: ["D1", "D2", "D2a"] },
    { titel: "Schmerzen und ärztlicher Rat", fragen: ["E1", "E2", "E6", "E7"] },
    { titel: "Warnzeichen", fragen: ["E5a"] },
    { titel: "Körper", fragen: ["R0"] },
    { titel: "Fragen zu deinen Bereichen", fragen: ["E3h", "E3k", "E8", "E3f", "E4", "E5", "E9", "E10", "E11"], nachRegion: true },
    { titel: "Schmerzen", fragen: ["P0"] },
    { titel: "Schmerz im Nacken", fragen: ["P1n", "P2n", "P3n"] },
    { titel: "Schmerz in der Schulter", fragen: ["P1s", "P2s", "P3s"] },
    { titel: "Schmerz im Rücken", fragen: ["P1r", "P2r", "P3r"] },
    { titel: "Schmerz in der Hüfte", fragen: ["P1h", "P2h", "P3h"] },
    { titel: "Schmerz im Knie", fragen: ["P1k", "P2k", "P3k"] },
    { titel: "Schmerz in Oberschenkel oder Wade", fragen: ["P1w", "P2w", "P3w"] },
    { titel: "Schmerz in Fuß oder Knöchel", fragen: ["P1f", "P2f", "P3f"] },
    { titel: "Alltag", fragen: ["Z1", "Z2"] },
    { titel: "Dein Ziel", fragen: ["Z3"] },
    { titel: "Dein Wunsch", fragen: ["Z4"] },
  ];

  // Teile für die Fortschrittsanzeige (nach "schritt" in fragebogen.json), in Alltagssprache
  const TEILE = {
    0: "Einverständnis und Kontakt",
    1: "Gesundheit und Sicherheit",
    2: "Beschwerden",
    3: "Fragen zu deinen Bereichen",
    4: "Schmerzen genauer",
    5: "Alltag und Ziel",
  };

  /* Gliederung langer Fragetexte. Jedes Stück ist [Text, Art]. Zusammengesetzt ergeben die Texte genau den
   * Fragetext. Art: "text" normal, "punkt" Listenpunkt (ein Komma am Ende wird nicht angezeigt),
   * "fett" hervorgehoben, "absatz" neuer Absatz, "hinweis" leiser Absatz darunter. */
  const GLIEDERUNG = {
    E5a: [
      ["Gibt es eines davon: ", "text"],
      ["Taubheit im Gesäß oder im Schritt, ", "punkt"],
      ["neue Probleme beim Wasserlassen oder Stuhlgang, ", "punkt"],
      ["ein Bein, das immer schwächer wird?", "punkt"],
    ],
    B1: [
      ["Treten Brustschmerzen, Engegefühl oder Atemnot ", "text"],
      ["schon bei leichter Belastung", "fett"],
      [" auf, ", "text"],
      ["zum Beispiel auf der Treppe oder beim Anziehen?", "hinweis"],
    ],
    B5: [
      ["Ist ein Bein in letzter Zeit neu angeschwollen, warm oder schmerzhaft, und zwar ", "text"],
      ["nur auf einer Seite", "fett"],
      ["? ", "text"],
      ["Oder wurde eine Thrombose vermutet, die noch nicht behandelt ist?", "absatz"],
    ],
    R0: [
      ["Wo gibt es Beschwerden, eine Operation, einen Gelenkersatz oder eine Verletzung? ", "text"],
      ["Mehrere Bereiche sind möglich.", "hinweis"],
    ],
    P0: [
      ["Bei welchen dieser Bereiche gibt es Schmerzen? ", "text"],
      ["Höchstens drei auswählen, die am meisten stören. ", "hinweis"],
      ['Gibt es keine Schmerzen, bitte "Keine Schmerzen" wählen.', "hinweis"],
    ],
  };

  // Zeitangaben werden in allen Fragetexten fett gezeigt, weil sie von Frage zu Frage wechseln
  const ZEITANGABE = /(in den letzten \d+ (?:Monaten|Wochen)|in letzter Zeit|länger als \d+ Monate)/;

  // Hinweise der Oberfläche zu einzelnen Fragen (Bedienungstexte, keine Gesundheitsfragen)
  const HINWEISE = {
    F1: "Achtung, hier ist andersherum gefragt: Ja heißt, das klappt.",
  };

  const PilotDarstellung = { SEITEN, TEILE, GLIEDERUNG, ZEITANGABE, HINWEISE };
  if (typeof module !== "undefined" && module.exports) module.exports = PilotDarstellung;
  else global.PilotDarstellung = PilotDarstellung;
})(typeof window !== "undefined" ? window : globalThis);
