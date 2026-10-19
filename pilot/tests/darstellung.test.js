/* Prüft die Darstellung des Fragebogens (pilot/darstellung.js) gegen die Daten.
 *
 * Aufruf aus dem Repo Ordner:  node pilot/tests/darstellung.test.js
 *
 *  - Jede Frage aus fragebogen.json steht auf genau einem Bildschirm, es gibt keine unbekannten IDs.
 *  - Bedingungen (nur_wenn, teilmenge_von, Ziele aus Z1 und Z2) verweisen nur auf Fragen auf demselben
 *    oder einem früheren Bildschirm. Sonst könnte eine Frage erscheinen, bevor ihre Grundlage beantwortet ist.
 *  - Gegliederte Fragetexte ergeben zusammengesetzt Zeichen für Zeichen den Text aus fragebogen.json.
 *  - Hervorhebungen von Zeitangaben ändern keinen Text.
 */
"use strict";

const fs = require("fs");
const path = require("path");
const A = require(path.resolve(__dirname, "..", "darstellung.js"));

const fenster = {};
new Function("window", fs.readFileSync(path.resolve(__dirname, "..", "daten.js"), "utf8"))(fenster);
const fb = fenster.PILOT_DATEN.fragebogen;
const fragen = {};
for (const f of fb.fragen) fragen[f.id] = f;

const fehler = [];
let checks = 0;
function pruefe(ok, text) {
  checks++;
  if (!ok) fehler.push(text);
}

// 1. Jede Frage genau einmal
const seiteVon = {};
A.SEITEN.forEach((s, i) => {
  for (const id of s.fragen) {
    pruefe(id in fragen, `Seite "${s.titel}": unbekannte Frage ${id}`);
    pruefe(!(id in seiteVon), `Frage ${id} steht auf mehr als einem Bildschirm`);
    seiteVon[id] = i;
  }
});
for (const id of Object.keys(fragen)) pruefe(id in seiteVon, `Frage ${id} steht auf keinem Bildschirm`);

// 2. Bedingungen zeigen nur nach hinten oder auf denselben Bildschirm
for (const f of fb.fragen) {
  const quellen = [];
  if (f.nur_wenn) quellen.push(f.nur_wenn.frage);
  if (f.teilmenge_von) quellen.push(f.teilmenge_von);
  if (f.typ === "ziele") quellen.push("Z1", "Z2");
  for (const q of quellen) {
    pruefe(seiteVon[q] <= seiteVon[f.id], `${f.id} hängt von ${q} ab, das erst auf einem späteren Bildschirm kommt`);
    // Auf demselben Bildschirm muss die Grundlage vorher stehen
    if (seiteVon[q] === seiteVon[f.id]) {
      const liste = A.SEITEN[seiteVon[f.id]].fragen;
      pruefe(liste.indexOf(q) < liste.indexOf(f.id), `${f.id} steht auf dem Bildschirm vor ${q}, von dem es abhängt`);
    }
  }
}

// 3. Gliederung ergibt genau den Fragetext
for (const [id, teile] of Object.entries(A.GLIEDERUNG)) {
  pruefe(id in fragen, `Gliederung für unbekannte Frage ${id}`);
  if (!(id in fragen)) continue;
  const zusammen = teile.map((t) => t[0]).join("");
  pruefe(zusammen === fragen[id].text, `Gliederung ${id} weicht vom Fragetext ab:\n  ${JSON.stringify(zusammen)}\n  ${JSON.stringify(fragen[id].text)}`);
  for (const [, art] of teile) pruefe(["text", "punkt", "fett", "absatz", "hinweis"].includes(art), `Gliederung ${id}: unbekannte Art ${art}`);
}

// 4. Zeitangaben: Aufteilen und wieder Zusammensetzen ändert nichts
for (const f of fb.fragen) {
  const teile = f.text.split(A.ZEITANGABE);
  pruefe(teile.join("") === f.text, `Zeitangabe verändert Text von ${f.id}`);
}

// 5. Hinweise nur zu bekannten Fragen, Teile für alle Schritte
for (const id of Object.keys(A.HINWEISE)) pruefe(id in fragen, `Hinweis zu unbekannter Frage ${id}`);
for (const s of fb.schritte) pruefe(s.nr in A.TEILE, `Kein Anzeigename für Teil ${s.nr}`);

console.log(`${A.SEITEN.length} Bildschirme für ${Object.keys(fragen).length} Fragen, ${checks} Prüfungen, ${fehler.length} Fehler`);
if (fehler.length) {
  for (const f of fehler) console.log("FEHLER " + f);
  process.exit(1);
}
console.log("Darstellung passt zu den Daten, Fragetexte unverändert.");
