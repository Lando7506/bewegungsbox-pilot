/* Klickt den Piloten in Chromium durch und macht Screenshots.
 *
 * Aufruf aus dem Repo Ordner:  node pilot/tests/browser.test.js
 * Braucht Playwright (in der Entwicklungsumgebung vorinstalliert, sonst: npm install playwright).
 *
 * Geprüft wird:
 *  - Ein grüner Fall (A01) und ein roter Fall (N16) werden Frage für Frage über die Oberfläche beantwortet.
 *    Die angezeigte Ampel muss zur Python Erwartung passen.
 *  - Die Beispiele aus dem Auswahlmenü zeigen alle vier Ampelfarben.
 *  - Plan und Player funktionieren (Abspielen, Pause, Nächste Übung, Übung wiederholen).
 *  - Fester Hinweis auf jeder Ansicht, keine Fehler in der Konsole, keine Netzwerkanfragen nach außen.
 *  - Handybreite 390 px: kein seitliches Scrollen, Schrift mindestens 20 px.
 * Screenshots landen in pilot/screenshots/.
 */
"use strict";

const path = require("path");
const fs = require("fs");
const zlib = require("zlib");

let chromium;
try {
  ({ chromium } = require("playwright"));
} catch (e) {
  // Globale Installation (zum Beispiel in der Cloud Umgebung)
  const global = require("child_process").execSync("npm root -g").toString().trim();
  ({ chromium } = require(path.join(global, "playwright")));
}

const PILOT = path.resolve(__dirname, "..");
const URL = "file://" + path.join(PILOT, "index.html");
const BILDER = path.join(PILOT, "screenshots");
const HINWEIS = "Pilot zur Veranschaulichung. Inhalte sind nicht fachlich geprüft und ersetzen keine ärztliche Beratung.";

const erwartung = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(__dirname, "erwartung.json.gz"))).toString("utf8"));
const profil = (id) => erwartung.profile.find((p) => p.id === id);

const fehler = [];
let checks = 0;
function pruefe(bedingung, text) {
  checks++;
  if (!bedingung) fehler.push(text);
}

async function neueSeite(browser, breite, hoehe) {
  const kontext = await browser.newContext({ viewport: { width: breite, height: hoehe }, locale: "de-DE" });
  const seite = await kontext.newPage();
  seite.on("console", (m) => {
    if (m.type() === "error") fehler.push(`Konsole (${breite}px): ${m.text()}`);
  });
  seite.on("pageerror", (e) => fehler.push(`Seitenfehler (${breite}px): ${e.message}`));
  seite.on("request", (r) => {
    if (!r.url().startsWith("file://")) fehler.push(`Anfrage nach außen: ${r.url()}`);
  });
  await seite.goto(URL);
  return seite;
}

async function hinweisDa(seite, ort) {
  const text = (await seite.locator(".hinweis-fest").innerText()).trim();
  const sichtbar = await seite.locator(".hinweis-fest").isVisible();
  pruefe(text === HINWEIS && sichtbar, `${ort}: fester Hinweis fehlt oder ist anders`);
}

async function bild(seite, name) {
  // Nebenbei: nirgends darf "null" oder "undefined" als Text stehen
  const text = await seite.locator("#inhalt").innerText();
  pruefe(!/\b(null|undefined|NaN)\b/.test(text), `${name}: Text enthält null, undefined oder NaN`);
  await seite.screenshot({ path: path.join(BILDER, name), fullPage: true });
}

// Beantwortet den Fragebogen über die Oberfläche mit den Antworten eines Profils
async function beantworte(seite, antworten, ort, bildPraefix) {
  await seite.getByRole("button", { name: "Fragebogen starten" }).click();
  const gesehen = [];
  for (let schritt = 0; schritt < 120; schritt++) {
    const h1 = seite.locator("h1[data-frage]");
    if (!(await h1.count())) break;
    const fid = await h1.getAttribute("data-frage");
    gesehen.push(fid);
    const wert = antworten[fid];
    if (bildPraefix && ["W1", "C4a", "R0", "P0"].includes(fid)) await bild(seite, `${bildPraefix}_frage_${fid}.png`);
    if (Array.isArray(wert)) {
      for (const w of wert) await seite.locator(`.wahl-knopf[data-wert="${w}"]`).click();
    } else if (typeof wert === "number" && (await seite.locator("#eingabe").count())) {
      await seite.locator("#eingabe").fill(String(wert));
    } else if (typeof wert === "string" && (await seite.locator("#eingabe").count())) {
      await seite.locator("#eingabe").fill(wert);
    } else if (wert !== undefined) {
      await seite.locator(`.wahl-knopf[data-wert="${wert}"]`).click();
    }
    await seite.locator("#weiter").click();
  }
  // Jede beantwortete Frage muss vorgekommen sein, und es darf keine Frage ohne Antwort geben (außer freiwilligen)
  const fehlend = Object.keys(antworten).filter((k) => !gesehen.includes(k));
  pruefe(!fehlend.length, `${ort}: diese Fragen kamen in der Oberfläche nicht vor: ${fehlend.join(", ")}`);
  return gesehen;
}

async function ampelText(seite) {
  return (await seite.locator(".ampel h1").innerText()).trim();
}

const FARBWORT = { gruen: "Grün", gelb: "Gelb", orange: "Orange", rot: "Rot" };

async function lauf(browser, breite, hoehe, kennung) {
  const seite = await neueSeite(browser, breite, hoehe);
  const mitBildern = (name) => `${kennung}_${name}`;

  await hinweisDa(seite, `${kennung} Start`);
  await bild(seite, mitBildern("01_start.png"));

  // Grüner Fall über die Oberfläche
  const gruen = profil("A01");
  await beantworte(seite, gruen.antworten, `${kennung} A01`, kennung === "handy" ? "handy" : null);
  pruefe((await ampelText(seite)).startsWith(FARBWORT[gruen.auswertung.ampel]), `${kennung} A01: Ampel ${await ampelText(seite)}, erwartet ${gruen.auswertung.ampel}`);
  await hinweisDa(seite, `${kennung} Ergebnis grün`);
  await bild(seite, mitBildern("02_gruen_ergebnis.png"));

  // Plan
  await seite.getByRole("button", { name: "Plan ansehen" }).click();
  await hinweisDa(seite, `${kennung} Plan`);
  const imPlan = await seite.locator(".plan-eintrag:not(.ist-gesperrt)").count();
  pruefe(imPlan === gruen.plan.bausteine.length, `${kennung} A01: ${imPlan} Übungen im Plan, erwartet ${gruen.plan.bausteine.length}`);
  const wdh = await seite.locator(".plan-eintrag").first().innerText();
  pruefe(/Wiederholungen|Zählung/.test(wdh), `${kennung} Plan: keine Angabe zu Wiederholungen`);
  await bild(seite, mitBildern("03_gruen_plan.png"));

  // Player
  await seite.getByRole("button", { name: "Abspielen" }).click();
  await hinweisDa(seite, `${kennung} Player`);
  pruefe(await seite.getByText("Platzhalterstimme, keine echte Aufnahme").isVisible(), `${kennung} Player: Kennzeichnung Platzhalterstimme fehlt`);
  const titel1 = await seite.locator("h1").innerText();
  await seite.locator("#spielen").click();
  await seite.waitForTimeout(1500);
  const untertitel = await seite.locator("#untertitel").innerText();
  pruefe(untertitel.length > 20 && !untertitel.startsWith("Tippe"), `${kennung} Player: kein Text beim Abspielen (${untertitel})`);
  pruefe((await seite.locator("#spielen").innerText()).includes("Pause"), `${kennung} Player: Pause Knopf fehlt beim Abspielen`);
  await bild(seite, mitBildern("04_player.png"));
  await seite.locator("#spielen").click();
  pruefe((await seite.locator("#spielen").innerText()).includes("Weiter abspielen"), `${kennung} Player: Pause wirkt nicht`);
  await seite.locator("#naechste").click();
  const titel2 = await seite.locator("h1").innerText();
  pruefe(titel1 !== titel2, `${kennung} Player: Nächste Übung wechselt die Übung nicht`);
  await seite.locator("#wiederholen").click();
  pruefe((await seite.locator("h1").innerText()) === titel2, `${kennung} Player: Übung wiederholen wechselt die Übung`);
  pruefe((await seite.locator("#zeit").innerText()).startsWith("0:00"), `${kennung} Player: Übung wiederholen beginnt nicht bei 0:00`);

  // Alles löschen
  await seite.getByRole("button", { name: "Alles löschen" }).click();
  pruefe((await seite.locator("h1").innerText()) === "So läuft es ab", `${kennung}: Alles löschen führt nicht zum Start`);

  // Roter Fall über die Oberfläche
  const rot = profil("N16");
  await beantworte(seite, rot.antworten, `${kennung} N16`, null);
  pruefe((await ampelText(seite)).startsWith("Rot"), `${kennung} N16: Ampel ${await ampelText(seite)}, erwartet Rot`);
  pruefe(await seite.locator(".notfall").isVisible(), `${kennung} N16: Notfallhinweis fehlt`);
  pruefe(!(await seite.getByRole("button", { name: "Plan ansehen" }).count()), `${kennung} N16: bei Rot darf es keinen Plan geben`);
  await seite.locator("details.hinter summary").click();
  await bild(seite, mitBildern("05_rot_ergebnis.png"));

  // Beispiele aus dem Menü: alle vier Farben
  for (const farbe of ["gruen", "gelb", "orange", "rot"]) {
    const p = erwartung.profile.find((x) => x.auswertung && x.auswertung.ampel === farbe && ["A01", "A06", "N15", "N16"].includes(x.id));
    await seite.selectOption("#beispiel", p.id);
    const t = await ampelText(seite);
    pruefe(t.startsWith(FARBWORT[farbe]), `${kennung} Beispiel ${p.id}: Ampel ${t}, erwartet ${farbe}`);
    pruefe((await seite.getByRole("button", { name: "Plan ansehen" }).count()) === (farbe === "gruen" || farbe === "gelb" ? 1 : 0),
      `${kennung} Beispiel ${p.id}: Plan Knopf passt nicht zur Farbe`);
    if (farbe === "orange") await bild(seite, mitBildern("06_orange_ergebnis.png"));
    if (farbe === "gelb") {
      await seite.getByRole("button", { name: "Plan ansehen" }).click();
      await bild(seite, mitBildern("07_gelb_plan.png"));
      const marken = await seite.locator(".marke-entscheidung").allInnerTexts();
      const soll = p.plan.bausteine.length + p.plan.ausgeschlossen.length;
      pruefe(marken.length === soll, `${kennung} Beispiel A06: ${marken.length} Übungen gezeigt, erwartet ${soll}`);
    }
  }

  // Handy: Breite und Schriftgröße
  const masse = await seite.evaluate(() => {
    const zuKlein = [];
    for (const e of document.querySelectorAll("body *")) {
      if (!e.offsetParent && e.tagName !== "FOOTER") continue;
      const hatText = [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      if (!hatText) continue;
      const px = parseFloat(getComputedStyle(e).fontSize);
      if (px < 20) zuKlein.push(`${e.tagName}.${e.className}: ${px}px`);
    }
    return { breite: document.documentElement.scrollWidth, fenster: window.innerWidth, zuKlein };
  });
  pruefe(masse.breite <= masse.fenster, `${kennung}: seitliches Scrollen (${masse.breite} > ${masse.fenster})`);
  pruefe(!masse.zuKlein.length, `${kennung}: Schrift unter 20 px: ${masse.zuKlein.slice(0, 5).join("; ")}`);

  // Tastatur: Fragebogen ohne Maus beginnen
  await seite.getByRole("button", { name: "Alles löschen" }).click();
  await seite.getByRole("button", { name: "Fragebogen starten" }).focus();
  await seite.keyboard.press("Enter");
  await seite.keyboard.press("Tab");
  await seite.keyboard.press("Space");
  const gedrueckt = await seite.locator('.wahl-knopf[aria-pressed="true"]').count();
  pruefe(gedrueckt === 1, `${kennung} Tastatur: Antwort lässt sich nicht mit Tab und Leertaste wählen`);
  await seite.locator("#weiter").focus();
  await seite.keyboard.press("Enter");
  pruefe((await seite.locator("h1").getAttribute("data-frage")) === "W2", `${kennung} Tastatur: Weiter mit Enter geht nicht`);

  await seite.context().close();
}

(async () => {
  fs.mkdirSync(BILDER, { recursive: true });
  const browser = await chromium.launch(fs.existsSync("/opt/pw-browsers/chromium") ? {} : {});
  try {
    await lauf(browser, 1280, 900, "breit");
    await lauf(browser, 390, 844, "handy");
  } finally {
    await browser.close();
  }
  console.log(`${checks} Prüfungen im Browser, ${fehler.length} Fehler`);
  if (fehler.length) {
    for (const f of fehler) console.log("FEHLER " + f);
    process.exit(1);
  }
  console.log("Screenshots in pilot/screenshots/");
})();
