/* Vergleicht die JS Logik (pilot/logik.js) mit dem Python System.
 *
 * Aufruf aus dem Repo Ordner:  node pilot/tests/vergleich.test.js
 *
 * Die Erwartungswerte erzeugt pilot/werkzeuge/export.py aus dem Python System (nicht von Hand).
 * Geprüft wird:
 *  1. daten.js enthält genau die Daten aus audio_system (Fragebogen, Stufen, Bausteine).
 *  2. Alle Antwortprofile aus profile/testantworten.json (A01 bis A30, N01 bis N25):
 *     vollständige Auswertung (Ampel, Zustände, Niveau, Orange Codes und alle übrigen Felder) und Plan.
 *  3. Die 400 Zufallsverläufe aus regeltest.py (gleicher Startwert) und 400 milde Zufallsverläufe.
 *  4. Das Regelwerk direkt: jeder Zustand allein und jedes Paar, Entscheidung je Baustein und Plan.
 * Bei der kleinsten Abweichung endet der Test mit Fehlercode 1.
 */
"use strict";

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const assert = require("assert");

const PILOT = path.resolve(__dirname, "..");
const REPO = path.resolve(PILOT, "..");
const L = require(path.join(PILOT, "logik.js"));

function ladeJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function ladeDatenJs() {
  const text = fs.readFileSync(path.join(PILOT, "daten.js"), "utf8");
  const fenster = {};
  new Function("window", text)(fenster);
  return fenster.PILOT_DATEN;
}

const erwartung = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(__dirname, "erwartung.json.gz"))).toString("utf8"));
const D = ladeDatenJs();
const fb = D.fragebogen;
const stufen = D.stufen;
const bausteine = D.bausteine;
const bausteinIds = Object.keys(bausteine).sort();

let checks = 0;
const fehler = [];

// Nur die Felder vergleichen, die aus JSON kommen (undefined fällt weg wie in Python)
function norm(x) {
  return JSON.parse(JSON.stringify(x));
}

function gleich(ist, soll, ort) {
  checks++;
  try {
    assert.deepStrictEqual(norm(ist), soll);
  } catch (e) {
    fehler.push(`${ort}: ${e.message.split("\n").slice(0, 12).join("\n")}`);
  }
}

// 1. Daten in daten.js gleich den Quelldateien
const AS = path.join(REPO, "audio_system");
gleich(fb, ladeJson(path.join(AS, "regeln", "fragebogen.json")), "daten.js Fragebogen");
gleich(stufen, ladeJson(path.join(AS, "regeln", "stufen.json")), "daten.js Stufen");
const quellBausteine = {};
for (const datei of fs.readdirSync(path.join(AS, "bausteine")).filter((d) => d.endsWith(".json"))) {
  quellBausteine[datei.replace(/\.json$/, "")] = ladeJson(path.join(AS, "bausteine", datei));
}
gleich(bausteine, quellBausteine, "daten.js Bausteine");

// 2. und 3. Antwortverläufe
function pruefeFall(f, gruppe) {
  const ort = `${gruppe} ${f.id} (${f.name})`;
  if (f.fehler) {
    checks++;
    try {
      L.auswerten(f.antworten, fb, stufen, f.jahr, f.id);
      fehler.push(`${ort}: hätte als ungültig abgelehnt werden müssen (Python: ${f.fehler})`);
    } catch (e) {
      if (!(e instanceof L.SystemFehler)) fehler.push(`${ort}: falscher Fehlertyp ${e}`);
      // Python zeigt die Antwort mit repr(), JS mit JSON. Verglichen wird die Meldung ohne diesen Teil.
      else gleich(e.message.split(" (Antwort:")[0], f.fehler.split(" (Antwort:")[0], `${ort} Fehlermeldung`);
    }
    return;
  }
  let r;
  try {
    r = L.auswerten(f.antworten, fb, stufen, f.jahr, f.id);
  } catch (e) {
    fehler.push(`${ort}: unerwarteter Abbruch: ${e.message}`);
    return;
  }
  const soll = f.auswertung;
  // Die wichtigsten Felder einzeln, damit eine Abweichung klar benannt wird
  gleich(r.status, soll.status, `${ort} Status`);
  gleich(r.ampel, soll.ampel, `${ort} Ampel`);
  if (soll.status === "ausgewertet") {
    gleich(r.zustaende, soll.zustaende, `${ort} Zustände`);
    gleich(r.niveau_vorlaeufig, soll.niveau_vorlaeufig, `${ort} Niveau`);
    gleich(r.orange.map((o) => o.code), soll.orange.map((o) => o.code), `${ort} Orange Codes`);
  }
  gleich(r, soll, `${ort} vollständige Auswertung`);
  if (f.plan) {
    const profil = { id: "PILOT", zustaende: r.zustaende, niveau: r.niveau_vorlaeufig };
    const plan = L.erstellePlan(profil, bausteinIds, bausteine, stufen, { entwurf: true });
    gleich(plan, f.plan, `${ort} Plan`);
  }
}

const zaehler = {};
for (const gruppe of ["profile", "zufall", "mild"]) {
  zaehler[gruppe] = { faelle: erwartung[gruppe].length, ampel: {} };
  for (const f of erwartung[gruppe]) {
    pruefeFall(f, gruppe);
    const a = f.auswertung ? f.auswertung.ampel || f.auswertung.status : "ungültig";
    zaehler[gruppe].ampel[a] = (zaehler[gruppe].ampel[a] || 0) + 1;
  }
}

// 4. Regelwerk direkt
for (const k of erwartung.kombinationen) {
  const ort = `Zustände [${k.zustaende.join(", ")}]`;
  for (const [bid, soll] of Object.entries(k.bewertung)) {
    gleich(L.bewerteBaustein(bausteine[bid], k.zustaende, stufen), soll, `${ort} ${bid}`);
  }
  for (const [niv, soll] of Object.entries(k.plaene)) {
    const profil = { id: "K", zustaende: k.zustaende, niveau: niv === "-" ? null : niv };
    gleich(L.erstellePlan(profil, bausteinIds, bausteine, stufen, { entwurf: true }), soll, `${ort} Plan Niveau ${niv}`);
  }
}

// Ein unbekannter Zustand muss abbrechen, wie in Python
checks++;
try {
  L.erstellePlan({ id: "X", zustaende: ["gibt_es_nicht"] }, bausteinIds, bausteine, stufen, { entwurf: true });
  fehler.push("Unbekannter Zustand wurde nicht abgelehnt");
} catch (e) {
  if (!(e instanceof L.SystemFehler)) fehler.push("Unbekannter Zustand: falscher Fehlertyp");
}

for (const [g, z] of Object.entries(zaehler)) console.log(`${g}: ${z.faelle} Fälle, ${JSON.stringify(z.ampel)}`);
console.log(`Zustandskombinationen: ${erwartung.kombinationen.length}`);
console.log(`${checks} Prüfungen, ${fehler.length} Abweichungen`);
if (fehler.length) {
  for (const f of fehler.slice(0, 20)) console.log("\nFEHLER " + f);
  if (fehler.length > 20) console.log(`\n... und ${fehler.length - 20} weitere`);
  process.exit(1);
}
console.log("Alles stimmt mit dem Python System überein.");
