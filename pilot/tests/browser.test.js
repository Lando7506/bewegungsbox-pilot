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
 *  - Breit, Handy 390 px und kleines Handy 360 x 640: kein seitliches Scrollen, Schrift mindestens 20 px,
 *    "Weiter" immer ohne Scrollen sichtbar, Seite springt beim Antippen nicht nach oben, kein automatisches Weiter.
 *  - Rückfragen bei "Alles löschen" und bei "Nein" zur Einwilligung, Übersicht mit Ändern, Notfallhinweis zuerst.
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

// Seit dem letzten Seitenwechsel muss die Tipp-Sperre vorbei sein, sonst zählt "Weiter" nicht (Schutz vor Doppeltipps)
async function weiterTippen(seite) {
  await seite.waitForTimeout(650);
  await seite.locator("#weiter").click();
}

// "Weiter" muss ohne Scrollen sichtbar und nicht verdeckt sein
async function weiterSichtbar(seite, ort) {
  const ok = await seite.evaluate(() => {
    const b = document.getElementById("weiter");
    if (!b) return false;
    const r = b.getBoundingClientRect();
    if (r.top < 0 || r.bottom > window.innerHeight) return false;
    const oben = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return !!oben && (oben === b || b.contains(oben));
  });
  pruefe(ok, `${ort}: "Weiter" ist nicht ohne Scrollen sichtbar oder verdeckt`);
}

// Antippen einer Antwort darf die Seite nicht nach oben springen lassen
async function tippeAntwort(seite, ort, selektor) {
  const loc = seite.locator(selektor);
  await loc.scrollIntoViewIfNeeded();
  const vorher = await seite.evaluate(() => window.scrollY);
  await loc.click();
  const nachher = await seite.evaluate(() => window.scrollY);
  pruefe(nachher >= vorher - 5, `${ort}: Seite springt nach dem Antippen nach oben (${vorher} -> ${nachher})`);
}

// Beantwortet den Fragebogen über die Oberfläche mit den Antworten eines Profils, Bildschirm für Bildschirm
async function beantworte(seite, antworten, ort, bildPraefix) {
  await seite.getByRole("button", { name: "Los geht's" }).click();
  const gesehen = [];
  let bildschirme = 0;
  for (let schritt = 0; schritt < 60; schritt++) {
    if (!(await seite.locator(".frage-karte").count())) break;
    bildschirme++;
    const titel = (await seite.locator("h1").innerText()).trim();
    await weiterSichtbar(seite, `${ort} "${titel}"`);
    // Karten beantworten, bis keine neue (Folgefrage) mehr auftaucht
    for (let runde = 0; runde < 10; runde++) {
      const ids = await seite.locator(".frage-karte").evaluateAll((ks) => ks.map((k) => k.dataset.frage));
      const neu = ids.filter((id) => !gesehen.includes(id));
      if (!neu.length) break;
      for (const fid of neu) {
        gesehen.push(fid);
        const wert = antworten[fid];
        const karte = `#karte-${fid}`;
        if (wert === undefined) continue;
        if (Array.isArray(wert)) {
          for (const w of wert) await tippeAntwort(seite, `${ort} ${fid}`, `${karte} .wahl-knopf[data-wert="${w}"]`);
        } else if ((typeof wert === "number" || typeof wert === "string") && (await seite.locator(`#eingabe-${fid}`).count())) {
          await seite.locator(`#eingabe-${fid}`).fill(String(wert));
        } else {
          await tippeAntwort(seite, `${ort} ${fid}`, `${karte} .wahl-knopf[data-wert="${wert}"]`);
        }
      }
    }
    if (bildPraefix && ["Einverständnis", "Herz und Atmung", "Warnzeichen", "Körper", "Beine"].includes(titel)) {
      await bild(seite, `${bildPraefix}_seite_${titel.replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss").replace(/[^A-Za-z]+/g, "_")}.png`);
    }
    // Kein automatisches Weiter: nach dem Beantworten stehen wir noch auf demselben Bildschirm
    pruefe((await seite.locator("h1").innerText()).trim() === titel, `${ort}: Bildschirm "${titel}" wurde ohne Tipp auf Weiter verlassen`);
    await weiterTippen(seite);
  }
  // Übersicht zum Prüfen, dann auswerten
  pruefe((await seite.locator("h1").innerText()).trim() === "Bitte kurz prüfen", `${ort}: Übersicht zum Prüfen fehlt`);
  if (bildPraefix) await bild(seite, `${bildPraefix}_uebersicht.png`);
  await seite.locator("#auswerten").click();
  const fehlend = Object.keys(antworten).filter((k) => !gesehen.includes(k));
  pruefe(!fehlend.length, `${ort}: diese Fragen kamen in der Oberfläche nicht vor: ${fehlend.join(", ")}`);
  return bildschirme;
}

async function ampelText(seite) {
  return (await seite.locator(".ampel h1").innerText()).trim();
}

async function menue(seite) {
  if (!(await seite.locator("#pilot-menue").evaluate((d) => d.open))) await seite.locator("#pilot-menue summary").click();
}

async function allesLoeschen(seite, ort) {
  await menue(seite);
  await seite.locator("#loeschen").click();
  pruefe((await seite.locator("h1").innerText()).startsWith("Wirklich"), `${ort}: Alles löschen fragt nicht nach`);
  await seite.getByRole("button", { name: "Ja, alles löschen" }).click();
  pruefe((await seite.locator("h1").innerText()) === "So läuft es ab", `${ort}: Alles löschen führt nicht zum Start`);
}

const FARBWORT = { gruen: "Grün", gelb: "Gelb", orange: "Orange", rot: "Rot" };

async function lauf(browser, breite, hoehe, kennung) {
  const seite = await neueSeite(browser, breite, hoehe);
  const mitBildern = (name) => `${kennung}_${name}`;

  await hinweisDa(seite, `${kennung} Start`);
  await bild(seite, mitBildern("01_start.png"));

  // Grüner Fall über die Oberfläche
  const gruen = profil("A01");
  const anzahl = await beantworte(seite, gruen.antworten, `${kennung} A01`, kennung === "handy" ? "handy" : null);
  pruefe(anzahl <= 22, `${kennung} A01: ${anzahl} Bildschirme, erwartet höchstens 22`);
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
  pruefe(/Übungen, zusammen etwa \d+ Minuten/.test(await seite.locator(".plan-summe").innerText()), `${kennung} Plan: Gesamtdauer fehlt`);
  await bild(seite, mitBildern("03_gruen_plan.png"));

  // Player
  await seite.locator("#abspielen").click();
  await hinweisDa(seite, `${kennung} Player`);
  pruefe(await seite.getByText("Platzhalterstimme, keine echte Aufnahme").isVisible(), `${kennung} Player: Kennzeichnung Platzhalterstimme fehlt`);
  const titel1 = await seite.locator("h1").innerText();
  await seite.locator("#spielen").click();
  await seite.waitForTimeout(1500);
  const untertitel = await seite.locator("#untertitel").innerText();
  pruefe(untertitel.length > 20 && !untertitel.startsWith("Tippe"), `${kennung} Player: kein Text beim Abspielen (${untertitel})`);
  pruefe((await seite.locator("#spielen").innerText()).includes("Pause"), `${kennung} Player: Pause Knopf fehlt beim Abspielen`);
  const pauseSichtbar = await seite.evaluate(() => {
    const r = document.getElementById("spielen").getBoundingClientRect();
    return r.top >= 0 && r.bottom <= window.innerHeight;
  });
  pruefe(pauseSichtbar, `${kennung} Player: Pause ist nicht ohne Scrollen sichtbar`);
  await bild(seite, mitBildern("04_player.png"));
  await seite.locator("#spielen").click();
  pruefe((await seite.locator("#spielen").innerText()).includes("Weiter abspielen"), `${kennung} Player: Pause wirkt nicht`);
  await seite.locator("#naechste").click();
  const titel2 = await seite.locator("h1").innerText();
  pruefe(titel1 !== titel2, `${kennung} Player: Nächste Übung wechselt die Übung nicht`);
  await seite.locator("#wiederholen").click();
  pruefe((await seite.locator("h1").innerText()) === titel2, `${kennung} Player: Übung wiederholen wechselt die Übung`);
  pruefe((await seite.locator("#zeit").innerText()).startsWith("0:00"), `${kennung} Player: Übung wiederholen beginnt nicht bei 0:00`);
  await seite.locator("#vorige").click();
  pruefe((await seite.locator("h1").innerText()) === titel1, `${kennung} Player: Vorige Übung geht nicht zurück`);

  // Alles löschen nur nach Rückfrage
  await allesLoeschen(seite, kennung);

  // Einwilligung "Nein": erst Rückfrage, Antwort lässt sich ändern
  await seite.getByRole("button", { name: "Los geht's" }).click();
  await tippeAntwort(seite, `${kennung} W1`, '#karte-W1 .wahl-knopf[data-wert="nein"]');
  await tippeAntwort(seite, `${kennung} W2`, '#karte-W2 .wahl-knopf[data-wert="ja"]');
  await weiterTippen(seite);
  pruefe((await seite.locator("h1").innerText()).startsWith("Ohne Zustimmung"), `${kennung}: Nein bei der Einwilligung fragt nicht nach`);
  await seite.getByRole("button", { name: "Antwort ändern" }).click();
  pruefe((await seite.locator("#karte-W1").count()) === 1, `${kennung}: Antwort ändern führt nicht zur Einwilligung zurück`);
  await allesLoeschen(seite, kennung);

  // Roter Fall über die Oberfläche
  const rot = profil("N16");
  await beantworte(seite, rot.antworten, `${kennung} N16`, null);
  pruefe((await ampelText(seite)).startsWith("Rot"), `${kennung} N16: Ampel ${await ampelText(seite)}, erwartet Rot`);
  pruefe(await seite.locator(".notfall").isVisible(), `${kennung} N16: Notfallhinweis fehlt`);
  const notfallZuerst = await seite.evaluate(() => document.querySelector("#inhalt").firstElementChild.classList.contains("notfall"));
  pruefe(notfallZuerst, `${kennung} N16: Notfallhinweis steht nicht an erster Stelle`);
  pruefe(!(await seite.getByRole("button", { name: "Plan ansehen" }).count()), `${kennung} N16: bei Rot darf es keinen Plan geben`);
  await seite.locator("details.hinter summary").click();
  await bild(seite, mitBildern("05_rot_ergebnis.png"));

  // Beispiele aus dem Menü: alle vier Farben
  for (const farbe of ["gruen", "gelb", "orange", "rot"]) {
    const p = erwartung.profile.find((x) => x.auswertung && x.auswertung.ampel === farbe && ["A01", "A06", "N15", "N16"].includes(x.id));
    await menue(seite);
    await seite.selectOption("#beispiel", p.id);
    const t = await ampelText(seite);
    pruefe(t.startsWith(FARBWORT[farbe]), `${kennung} Beispiel ${p.id}: Ampel ${t}, erwartet ${farbe}`);
    pruefe((await seite.getByRole("button", { name: "Plan ansehen" }).count()) === (farbe === "gruen" || farbe === "gelb" ? 1 : 0),
      `${kennung} Beispiel ${p.id}: Plan Knopf passt nicht zur Farbe`);
    if (farbe === "orange") {
      pruefe(await seite.getByRole("heading", { name: "So geht es weiter" }).isVisible(), `${kennung} Beispiel ${p.id}: "So geht es weiter" fehlt`);
      await bild(seite, mitBildern("06_orange_ergebnis.png"));
    }
    if (farbe === "gelb") {
      await bild(seite, mitBildern("06_gelb_ergebnis.png"));
      await seite.getByRole("button", { name: "Plan ansehen" }).click();
      await bild(seite, mitBildern("07_gelb_plan.png"));
      const marken = await seite.locator(".marke-entscheidung").allInnerTexts();
      const soll = p.plan.bausteine.length + p.plan.ausgeschlossen.length;
      pruefe(marken.length === soll, `${kennung} Beispiel A06: ${marken.length} Übungen gezeigt, erwartet ${soll}`);
    }
  }

  // Übersicht mit Ändern
  await seite.getByRole("button", { name: "Zurück zur Ampel" }).count();
  await menue(seite);
  await seite.selectOption("#beispiel", "A06");
  await seite.getByRole("button", { name: "Antworten ansehen oder ändern" }).click();
  pruefe((await seite.locator("h1").innerText()).trim() === "Bitte kurz prüfen", `${kennung}: Antworten ansehen führt nicht zur Übersicht`);
  await seite.getByRole("button", { name: "Herz und Atmung ändern" }).click();
  pruefe((await seite.locator("#karte-B1").count()) === 1, `${kennung}: Ändern aus der Übersicht führt nicht zum Bildschirm`);
  await seite.getByRole("button", { name: "Fertig" }).click();
  pruefe((await seite.locator("h1").innerText()).trim() === "Bitte kurz prüfen", `${kennung}: Fertig führt nicht zur Übersicht zurück`);

  // Breite und Schriftgröße
  const masse = await seite.evaluate(() => {
    const zuKlein = [];
    for (const e of document.querySelectorAll("body *")) {
      if (!e.offsetParent) continue;
      const hatText = [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      if (!hatText) continue;
      const px = parseFloat(getComputedStyle(e).fontSize);
      if (px < 20) zuKlein.push(`${e.tagName}.${e.className}: ${px}px`);
    }
    return { breite: document.documentElement.scrollWidth, fenster: window.innerWidth, zuKlein };
  });
  pruefe(masse.breite <= masse.fenster, `${kennung}: seitliches Scrollen (${masse.breite} > ${masse.fenster})`);
  pruefe(!masse.zuKlein.length, `${kennung}: Schrift unter 20 px: ${masse.zuKlein.slice(0, 5).join("; ")}`);
  await menue(seite);
  const menueBreite = await seite.evaluate(() => document.documentElement.scrollWidth);
  pruefe(menueBreite <= masse.fenster, `${kennung}: Pilot-Menü verursacht seitliches Scrollen (${menueBreite})`);

  // Tastatur: Fragebogen ohne Maus beginnen
  await allesLoeschen(seite, kennung);
  await seite.getByRole("button", { name: "Los geht's" }).focus();
  await seite.keyboard.press("Enter");
  await seite.keyboard.press("Tab");
  await seite.keyboard.press("Space");
  const gewaehlt = await seite.locator("#karte-W1 input:checked").count();
  pruefe(gewaehlt === 1, `${kennung} Tastatur: Antwort lässt sich nicht mit Tab und Leertaste wählen`);
  await tippeAntwort(seite, `${kennung} W2`, '#karte-W2 .wahl-knopf[data-wert="ja"]');
  await seite.waitForTimeout(650);
  await seite.locator("#weiter").focus();
  await seite.keyboard.press("Enter");
  pruefe((await seite.locator("h1").innerText()).trim() === "Wer füllt aus?", `${kennung} Tastatur: Weiter mit Enter geht nicht`);

  await seite.context().close();
}

(async () => {
  fs.mkdirSync(BILDER, { recursive: true });
  const browser = await chromium.launch(fs.existsSync("/opt/pw-browsers/chromium") ? {} : {});
  try {
    await lauf(browser, 1280, 900, "breit");
    await lauf(browser, 390, 844, "handy");
    await lauf(browser, 360, 640, "klein");
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
