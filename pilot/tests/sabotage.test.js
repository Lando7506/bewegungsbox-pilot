/* Sabotagetest: Zeigt, dass der Vergleichstest eine falsche Rot Regel wirklich bemerkt.
 *
 * Aufruf aus dem Repo Ordner:  node pilot/tests/sabotage.test.js
 *
 * Arbeitet in einer Kopie im Temp Ordner, das Original bleibt unberührt (also automatisch "zurück").
 * Sabotage: Brustschmerz bei leichter Belastung (B1 = ja) löst kein Rot mehr aus.
 * Erwartet: vergleich.test.js schlägt in der Kopie fehl und läuft im Original durch.
 */
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const REPO = path.resolve(__dirname, "..", "..");
const ORIGINAL = 'if ("rot" in wirk) {';
const SABOTAGE = 'if ("rot" in wirk && f.id !== "B1") {';

function lauf(repo) {
  return spawnSync(process.execPath, [path.join(repo, "pilot", "tests", "vergleich.test.js")], { encoding: "utf8" });
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "pilot-sabotage-"));
try {
  fs.cpSync(path.join(REPO, "pilot"), path.join(tmp, "pilot"), { recursive: true, filter: (q) => !q.includes("screenshots") });
  fs.cpSync(path.join(REPO, "audio_system"), path.join(tmp, "audio_system"), { recursive: true });
  const logik = path.join(tmp, "pilot", "logik.js");
  const text = fs.readFileSync(logik, "utf8");
  if (text.split(ORIGINAL).length !== 2) throw new Error("Stelle für die Sabotage nicht eindeutig gefunden");
  fs.writeFileSync(logik, text.replace(ORIGINAL, SABOTAGE));

  const kaputt = lauf(tmp);
  const zeilen = kaputt.stdout.split("\n");
  console.log("Mit Sabotage (B1 ohne Rot):");
  console.log("  " + (zeilen.find((z) => z.includes("Prüfungen,")) || "(keine Zusammenfassung)"));
  console.log("  erste Meldung: " + (zeilen.find((z) => z.startsWith("FEHLER")) || "(keine)"));
  const heil = lauf(REPO);
  console.log("Original:");
  console.log("  " + (heil.stdout.split("\n").find((z) => z.includes("Prüfungen,")) || "(keine Zusammenfassung)"));

  if (kaputt.status === 0) {
    console.log("FEHLER: Der Vergleichstest hat die Sabotage nicht bemerkt.");
    process.exit(1);
  }
  if (heil.status !== 0) {
    console.log("FEHLER: Das Original besteht den Vergleichstest nicht.");
    process.exit(1);
  }
  console.log("Sabotage erkannt, Original in Ordnung.");
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
