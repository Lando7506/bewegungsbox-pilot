/* Regelprüfung und Plan für den Piloten.
 *
 * Nachbau von audio_system/audiosystem/fragebogen.py (auswerten) und regeln.py (erstelle_plan).
 * Das Python System ist die Referenz. Weicht diese Datei davon ab, ist diese Datei falsch.
 * Der Test pilot/tests/vergleich.test.js prüft das gegen Erwartungswerte aus Python.
 *
 * Läuft im Browser (window.PilotLogik) und in Node (module.exports). Keine Abhängigkeiten.
 */
(function (global) {
  "use strict";

  class SystemFehler extends Error {}

  const JA_NEIN = ["ja", "nein"];
  const JA_NEIN_WN = ["ja", "nein", "wn"];
  const REGION_NICHTS = "nichts";

  // ------------------------------------------------------------------ Hilfen

  function istListe(x) {
    return Array.isArray(x);
  }

  function istGanzzahl(x) {
    return typeof x === "number" && Number.isInteger(x);
  }

  function hatDoppelte(liste) {
    return new Set(liste).size !== liste.length;
  }

  // Sortiert wie Python sorted() bei Texten (nach Codepunkten)
  function sortiert(liste) {
    return [...liste].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  }

  // Python round(x, 3)
  function runde3(x) {
    return Math.round(x * 1000) / 1000;
  }

  function fragenNachId(fb) {
    const m = {};
    for (const f of fb.fragen) m[f.id] = f;
    return m;
  }

  // ------------------------------------------------------------------ Sichtbarkeit und Ziele

  function bedingungErfuellt(bed, antworten) {
    const a = antworten[bed.frage];
    if (bed.hat_region) return istListe(a) && a.some((x) => x !== REGION_NICHTS);
    if ("wert" in bed) return a === bed.wert;
    if ("werte" in bed) return bed.werte.includes(a);
    if ("enthaelt" in bed) return istListe(a) && a.includes(bed.enthaelt);
    throw new SystemFehler("Unbekannte Bedingung " + JSON.stringify(bed));
  }

  function zielKandidaten(fb, antworten) {
    const z1 = antworten.Z1 || [];
    const z2 = antworten.Z2 || [];
    const kand = [];
    for (const [key, z] of Object.entries(fb.ziele)) {
      if (z.aus_z1 && z.aus_z1.some((x) => z1.includes(x))) kand.push(key);
      else if (z.wenn_z2_nicht_leer && z2.length) kand.push(key);
      else if (z.wenn_z1_und_z2_leer && !z1.length && !z2.length) kand.push(key);
    }
    return kand;
  }

  function istSichtbar(frage, antworten, fb) {
    if (frage.typ === "ziele") return zielKandidaten(fb, antworten).length > 1;
    const bed = frage.nur_wenn;
    return !bed ? true : bedingungErfuellt(bed, antworten);
  }

  function sichtbareFragen(fb, antworten) {
    return fb.fragen.filter((f) => istSichtbar(f, antworten, fb));
  }

  // ------------------------------------------------------------------ Prüfen der Antworten

  // Wirft SystemFehler bei ungültigem Wert. Gibt true zurück, wenn die Antwort als leer gilt.
  function pruefeWert(f, wert, regionen, fb, antworten, jahr) {
    const typ = f.typ;
    const fehler = (text) => {
      throw new SystemFehler(`Frage ${f.id}: ${text} (Antwort: ${JSON.stringify(wert)})`);
    };
    if (typ === "ja_nein" || typ === "ja_nein_wn") {
      const erlaubt = typ === "ja_nein_wn" ? JA_NEIN_WN : JA_NEIN;
      if (!erlaubt.includes(wert)) fehler("erlaubt sind " + erlaubt.join(", "));
      return false;
    }
    if (typ === "auswahl") {
      if (!f.optionen.map((o) => o.wert).includes(wert)) fehler("kein gültiger Wert");
      return false;
    }
    if (typ === "text") {
      if (typeof wert !== "string") fehler("Text erwartet");
      return !wert.trim();
    }
    if (typ === "zahl") {
      if (!istGanzzahl(wert)) fehler("ganze Zahl erwartet");
      const min = "min" in f ? f.min : -1e9;
      const max = Math.min("max" in f ? f.max : 1e9, jahr);
      if (!(min <= wert && wert <= max)) fehler("Zahl außerhalb des erlaubten Bereichs");
      return false;
    }
    if (typ === "skala") {
      if (!istGanzzahl(wert) || !(f.min <= wert && wert <= f.max)) fehler(`Zahl von ${f.min} bis ${f.max} erwartet`);
      return false;
    }
    if (typ === "mehrfach") {
      const erlaubt = f.optionen.map((o) => o.wert);
      if (!istListe(wert) || wert.some((x) => !erlaubt.includes(x)) || hatDoppelte(wert)) {
        fehler("Liste gültiger, nicht doppelter Werte erwartet");
      }
      return false;
    }
    if (typ === "region_karte") {
      const erlaubt = [...Object.keys(regionen), REGION_NICHTS];
      if (!istListe(wert) || wert.some((x) => !erlaubt.includes(x)) || hatDoppelte(wert)) {
        fehler("Liste gültiger, nicht doppelter Regionen erwartet");
      }
      if (!wert.length) return true; // leer gilt als nicht beantwortet
      if (wert.includes(REGION_NICHTS) && wert.length > 1) fehler("'Nichts davon' lässt sich nicht mit einer Region kombinieren");
      return false;
    }
    if (typ === "region_teilauswahl") {
      const quelle = antworten[f.teilmenge_von] || [];
      const erlaubt = [...quelle.filter((x) => x !== REGION_NICHTS), REGION_NICHTS];
      if (!istListe(wert) || wert.some((x) => !erlaubt.includes(x)) || hatDoppelte(wert)) {
        fehler(`Liste aus den in ${f.teilmenge_von} gewählten Bereichen erwartet`);
      }
      if (wert.includes(REGION_NICHTS) && wert.length > 1) fehler("'Keine Schmerzen' lässt sich nicht mit einem Bereich kombinieren");
      const max = "max" in f ? f.max : 3;
      if (wert.filter((x) => x !== REGION_NICHTS).length > max) fehler(`höchstens ${max} Bereiche erlaubt`);
      return !wert.length;
    }
    if (typ === "ziele") {
      const kand = zielKandidaten(fb, antworten);
      if (!istListe(wert) || wert.some((x) => !kand.includes(x)) || hatDoppelte(wert) || wert.length > 2) {
        fehler("bis zu zwei Ziele aus den angezeigten erwartet");
      }
      return !wert.length;
    }
    throw new SystemFehler(`Unbekannter Fragetyp ${typ}`);
  }

  // Gibt [sichtbare Fragen, fehlende Pflicht IDs] zurück. Ungültiges stoppt mit SystemFehler.
  function pruefeAntworten(fb, regionen, antworten, jahr) {
    const ids = fragenNachId(fb);
    const unbekannt = sortiert(Object.keys(antworten).filter((k) => !(k in ids)));
    if (unbekannt.length) throw new SystemFehler("Antworten zu unbekannten Fragen (Tippfehler?): " + unbekannt.join(", "));
    const sichtbar = [];
    const fehlend = [];
    for (const f of fb.fragen) {
      if (!istSichtbar(f, antworten, fb)) {
        if (f.id in antworten) throw new SystemFehler(`Frage ${f.id} wurde beantwortet, wird in diesem Verlauf aber nicht gestellt`);
        continue;
      }
      sichtbar.push(f);
      if (!(f.id in antworten)) {
        if (f.pflicht) fehlend.push(f.id);
        continue;
      }
      const leer = pruefeWert(f, antworten[f.id], regionen, fb, antworten, jahr);
      if (leer && f.pflicht && ["text", "region_karte", "region_teilauswahl", "ziele"].includes(f.typ)) fehlend.push(f.id);
    }
    return [sichtbar, fehlend];
  }

  // ------------------------------------------------------------------ Auswerten

  function niveau(antworten) {
    const c4 = antworten.C4;
    const c5 = antworten.C5;
    const c6 = antworten.C6;
    const gruendeA = [];
    if (c5 === "fremde_hilfe") gruendeA.push("C5 nur mit fremder Hilfe");
    if (c6 === "rollstuhl") gruendeA.push("C6 Rollstuhl");
    if (gruendeA.length) return ["A", gruendeA];
    const gruendeB = [];
    if (c5 === "abstuetzen") gruendeB.push("C5 nur mit Abstützen");
    if (c6 === "stock" || c6 === "rollator") gruendeB.push(`C6 ${c6}`);
    if (c4 === "oft") gruendeB.push("C4 oft unsicher");
    if (gruendeB.length) return ["B", gruendeB];
    return ["C", []];
  }

  /* Regelprüfung P1: Ampel, Zustände, vorläufiges Niveau, Ziele. Keine KI.
   * Das Ergebnis hat immer einen Status. Nur bei "ausgewertet" gibt es eine Ampel.
   * antworten_sha aus Python fehlt hier bewusst (Prüfsumme für den internen Prüfbogen). */
  function auswerten(antworten, fb, stufen, jahr, profilId) {
    jahr = jahr || new Date().getFullYear();
    profilId = profilId || "FB";
    const regionenDef = stufen.regionen;
    const [sichtbar, fehlend] = pruefeAntworten(fb, regionenDef, antworten, jahr);
    const basis = { fragebogen_version: fb.version };
    const fragen = fragenNachId(fb);

    for (const fid of ["W1", "W2"]) {
      if (antworten[fid] === "nein") {
        return { ...basis, status: "keine_einwilligung", ampel: null, grund: fragen[fid].wirkung.nein.stopp };
      }
    }
    if (fehlend.length) return { ...basis, status: "unvollstaendig", ampel: null, fehlende_fragen: fehlend };

    const sicher = new Set();
    const vorsicht = new Set();
    const rot = [];
    const orange = [];
    const notfall = [];
    const strittig = [];
    const orangeAdd = (code, quelle) => orange.push({ code, grund: fb.orange_codes[code], quelle });

    for (const f of sichtbar) {
      const wert = antworten[f.id];
      const wirk = typeof wert === "string" ? (f.wirkung || {})[wert] : null;
      if (!wirk) continue;
      for (const z of wirk.zustaende || []) sicher.add(z);
      for (const z of wirk.vorsicht || []) vorsicht.add(z);
      if ("rot" in wirk) {
        rot.push({ frage: f.id, antwort: wert, grund: wirk.rot, zustaende: wirk.zustaende || [] });
        if (wirk.strittig) strittig.push(f.id);
      }
      for (const code of wirk.orange || []) orangeAdd(code, f.id);
      if (wirk.notfall) notfall.push(f.id);
    }

    // Körperregionen: gewählt, aber durch keine Antwort erklärt -> Zustand region_unklar_<region>
    const regionen = (antworten.R0 || []).filter((r) => r !== REGION_NICHTS);
    const erklaert = new Set();
    for (const f of sichtbar) {
      if (antworten[f.id] === "ja" || antworten[f.id] === "wn") for (const r of f.region || []) erklaert.add(r);
    }
    const unklar = regionen.filter((r) => !erklaert.has(r));
    for (const r of unklar) sicher.add(`region_unklar_${r}`);

    // Kombinationsregeln für Orange
    const gruppen = fb.ampel.zaehlgruppen;
    const nurWn = [...vorsicht].filter((z) => !sicher.has(z));
    const alle = new Set([...sicher, ...vorsicht]);
    const gruppeVon = {};
    for (const [g, zs] of Object.entries(gruppen)) for (const z of zs) gruppeVon[z] = g;
    const gruppenSicher = sortiert([...new Set([...sicher].filter((z) => z in gruppeVon).map((z) => gruppeVon[z]))]);
    if (gruppenSicher.length >= fb.ampel.o4_min_gruppen) orangeAdd("O4", "Gruppen: " + gruppenSicher.join(", "));
    const c4a = antworten.C4a;
    if (sicher.has("sturz_unter_12_monate_abgeklaert") && istGanzzahl(c4a) && c4a >= fb.ampel.o5_skala_min) {
      orangeAdd("O5", `C4a = ${c4a}`);
    }
    const alter = jahr - antworten.K2;
    if (alter >= fb.ampel.o6_alter && [...sicher].some((z) => z in gruppeVon)) {
      orangeAdd("O6", `Alter ${alter} (laufendes Jahr minus Geburtsjahr)`);
    }
    for (const w of fb.ampel.o7_widersprueche) {
      if (Object.entries(w.wenn).every(([k, v]) => antworten[k] === v)) orangeAdd("O7", w.text);
    }

    let ampel;
    if (rot.length) ampel = "rot";
    else if (orange.length) ampel = "orange";
    else if ([...alle].some((z) => z in gruppeVon)) ampel = "gelb";
    else ampel = "gruen";

    const [niv, nivGruende] = niveau(antworten);
    const kand = zielKandidaten(fb, antworten);
    const ziele = kand.length > 1 ? antworten.Z3 : kand;
    const zustaende = sortiert([...alle]);
    return {
      ...basis,
      status: "ausgewertet",
      ampel,
      rot,
      orange,
      strittige_regeln_beteiligt: sortiert([...new Set(strittig)]),
      notfallhinweis: notfall.length ? fb.notfallhinweis : null,
      notfall_fragen: notfall,
      zustaende,
      zustaende_nur_wegen_weiss_nicht: sortiert(nurWn),
      regionen,
      regionen_unklar: unklar,
      niveau_vorlaeufig: niv,
      niveau_gruende: nivGruende,
      ziele,
      alter,
      noch_nicht_geprueft: fb.ampel.noch_nicht_geprueft,
      profil: { id: profilId, name: "aus Fragebogen", zustaende },
    };
  }

  // ------------------------------------------------------------------ Bausteine (common.py, clips.py)

  const ZEITBLOCK_TYPEN = ["halten", "wiederholungen", "satzpause"];
  const WIEDERHOLUNGS_MODI = ["zaehlen", "wortsignal"];
  const ZAHLWOERTER = ["eins", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun", "zehn", "elf", "zwölf"];
  const WDH_MIN = 5;
  const WDH_MAX = 12;
  const NIVEAUS = ["A", "B", "C"];
  const WDH_START_NACH_NIVEAU = { A: 8, B: 10, C: 10 };

  function* segmente(baustein) {
    for (const teil of baustein.teile) {
      for (let i = 0; i < teil.segmente.length; i++) yield [teil, i, teil.segmente[i]];
    }
  }

  function sollsumme(baustein) {
    let s = 0;
    for (const [, , seg] of segmente(baustein)) s += seg.soll_dauer_s;
    return runde3(s);
  }

  function pruefeWiederholungszahl(n) {
    if (n === null || n === undefined) return null;
    if (!istGanzzahl(n) || !(WDH_MIN <= n && n <= WDH_MAX)) {
      throw new SystemFehler(`wiederholungen_pro_satz muss eine ganze Zahl von ${WDH_MIN} bis ${WDH_MAX} sein, nicht ${JSON.stringify(n)}.`);
    }
    return n;
  }

  function pruefeNiveau(n) {
    if (n === null || n === undefined) return null;
    if (typeof n !== "string" || !NIVEAUS.includes(n)) throw new SystemFehler(`niveau muss A, B oder C sein, nicht ${JSON.stringify(n)}.`);
    return n;
  }

  // Vorrang: 1. Handwert, 2. Startwert aus dem Niveau, 3. Wert im Baustein. Gibt [zahl oder null, quelle] zurück.
  function wiederholungenFuerProfil(profil) {
    const hand = pruefeWiederholungszahl(profil.wiederholungen_pro_satz);
    if (hand !== null) return [hand, "hand"];
    const niv = pruefeNiveau(profil.niveau);
    if (niv !== null) return [WDH_START_NACH_NIVEAU[niv], "niveau"];
    return [null, "baustein"];
  }

  function hatWiederholungen(baustein) {
    for (const [, , seg] of segmente(baustein)) if (seg.typ === "wiederholungen") return true;
    return false;
  }

  // Kopie des Bausteins mit n Wiederholungen pro Satz. Die Blockdauer wächst oder schrumpft im Takt mit.
  function mitWiederholungen(baustein, n) {
    n = pruefeWiederholungszahl(n);
    if (n === null || !hatWiederholungen(baustein)) return baustein;
    const b = JSON.parse(JSON.stringify(baustein));
    for (const [, , seg] of segmente(b)) {
      if (seg.typ !== "wiederholungen") continue;
      if (!istGanzzahl(seg.anzahl) || typeof seg.takt_s !== "number") continue;
      const proWdh = seg.modus === "wortsignal" ? (seg.woerter && seg.woerter.length ? seg.woerter.length : 1) : 1;
      seg.soll_dauer_s = seg.soll_dauer_s + (n - seg.anzahl) * proWdh * seg.takt_s;
      seg.anzahl = n;
    }
    b.soll_gesamtdauer_s = sollsumme(b);
    return b;
  }

  function istBlock(seg) {
    return ZEITBLOCK_TYPEN.includes(seg.typ);
  }

  function erzeugteCues(seg) {
    if (seg.typ !== "wiederholungen") return [];
    const { modus, anzahl, takt_s: takt } = seg;
    const start = "start_s" in seg ? seg.start_s : 0;
    if (!WIEDERHOLUNGS_MODI.includes(modus) || !istGanzzahl(anzahl) || anzahl < 1 || typeof takt !== "number" || takt <= 0) return [];
    const cues = [];
    if (modus === "zaehlen") {
      if (anzahl > ZAHLWOERTER.length) return [];
      for (let k = 0; k < anzahl; k++) cues.push({ bei_s: start + k * takt, text: ZAHLWOERTER[k], erzeugt: true });
    } else {
      const woerter = seg.woerter || [];
      if (!woerter.length) return [];
      for (let k = 0; k < anzahl * woerter.length; k++) cues.push({ bei_s: start + k * takt, text: woerter[k % woerter.length], erzeugt: true });
    }
    return cues;
  }

  function blockCues(seg) {
    if (!istBlock(seg)) return [];
    return [...(seg.cues || []), ...erzeugteCues(seg)].sort((a, b) => a.bei_s - b.bei_s);
  }

  function cueAktiv(cue, zustaende) {
    const z = zustaende instanceof Set ? zustaende : new Set(zustaende);
    if ((cue.ausschluss_bei || []).some((x) => z.has(x))) return false;
    const nur = cue.nur_bei;
    if (nur && nur.length && !nur.some((x) => z.has(x))) return false;
    return true;
  }

  // Text und Solldauer unter Beachtung der Varianten (clips.effektiver_text). Varianten gelten in Listenreihenfolge.
  function effektiverText(item, zustaende) {
    const z = zustaende instanceof Set ? zustaende : new Set(zustaende);
    for (const v of item.varianten || []) {
      if (z.has(v.bei_zustand)) return { text: v.text, soll_dauer_s: "soll_dauer_s" in v ? v.soll_dauer_s : item.soll_dauer_s, variante: v.bei_zustand };
    }
    return { text: item.text, soll_dauer_s: item.soll_dauer_s, variante: null };
  }

  // ------------------------------------------------------------------ Regelwerk (regeln.py)

  const RANG = { frei: 0, info: 1, warnung: 2, gesperrt: 3, manuell: 4 };
  const STUFE_ZU_ENTSCHEIDUNG = { 1: "manuell", 2: "gesperrt", 3: "warnung", 4: "info" };
  const REGION_PRAEFIX = "region_unklar_";

  function regionAusZustand(zustand) {
    return zustand.startsWith(REGION_PRAEFIX) ? zustand.slice(REGION_PRAEFIX.length) : null;
  }

  // Unbekannte Zustände sind ein Fehler, damit sich kein Tippfehler als "gesund" auswirkt.
  function pruefeZustaende(zustaende, stufen) {
    const z = new Set(zustaende);
    const unbekannt = sortiert([...z].filter((x) => !(x in stufen.zustaende)));
    if (unbekannt.length) {
      throw new SystemFehler(
        "Unbekannte Zustände (Tippfehler?): " + unbekannt.join(", ") + ". Erlaubt sind nur Zustände aus regeln/stufen.json."
      );
    }
    return z;
  }

  function bewerteBaustein(baustein, zustaende, stufen) {
    const z = pruefeZustaende(zustaende, stufen);
    const bmap = {};
    for (const e of baustein.stufen_zuordnung || []) bmap[e.zustand] = e;
    const treffer = [];
    for (const zustand of sortiert([...z])) {
      const kandidaten = [];
      const g = stufen.zustaende[zustand].stufe_global;
      if (g) kandidaten.push({ quelle: "global", stufe: g, hinweis: stufen.zustaende[zustand].name });
      const r = regionAusZustand(zustand);
      if (r && (baustein.belastet_regionen || []).includes(r)) {
        kandidaten.push({ quelle: "region_standard", stufe: stufen.region_unklar.stufe, hinweis: stufen.zustaende[zustand].name });
      }
      const b = bmap[zustand];
      if (b) kandidaten.push({ quelle: "baustein", stufe: b.stufe, hinweis: b.hinweis || "" });
      if (kandidaten.length) {
        // wie Python min(): bei Gleichstand gewinnt der erste
        let streng = kandidaten[0];
        for (const k of kandidaten) if (k.stufe < streng.stufe) streng = k;
        treffer.push({ zustand, ...streng });
      }
    }
    if (!treffer.length) return { entscheidung: "frei", stufe: null, treffer: [] };
    const stufe = Math.min(...treffer.map((t) => t.stufe));
    return { entscheidung: STUFE_ZU_ENTSCHEIDUNG[stufe], stufe, treffer };
  }

  // Welche optionalen Cues fallen weg und welche Varianten werden genommen.
  function anpassungen(baustein, zustaende) {
    const z = new Set(zustaende);
    const uebersprungen = [];
    const varianten = [];
    let soll = 0;
    for (const [teil, i, seg] of segmente(baustein)) {
      if (istBlock(seg)) {
        soll += seg.soll_dauer_s;
        for (const cue of blockCues(seg)) {
          if (!cueAktiv(cue, z)) {
            uebersprungen.push({ teil: teil.id, bei_s: cue.bei_s, text: cue.text });
            continue;
          }
          for (const v of cue.varianten || []) {
            if (z.has(v.bei_zustand)) {
              varianten.push({ teil: teil.id, index: i, bei_s: cue.bei_s, zustand: v.bei_zustand });
              break;
            }
          }
        }
      } else {
        let s = seg.soll_dauer_s;
        if (seg.typ === "sprechen") {
          for (const v of seg.varianten || []) {
            if (z.has(v.bei_zustand)) {
              s = "soll_dauer_s" in v ? v.soll_dauer_s : s;
              varianten.push({ teil: teil.id, index: i, zustand: v.bei_zustand });
              break;
            }
          }
        }
        soll += s;
      }
    }
    return { uebersprungene_cues: uebersprungen, varianten, soll_dauer_s: runde3(soll) };
  }

  /* Wählt aus den angefragten Bausteinen aus, was für dieses Profil erlaubt ist (regeln.erstelle_plan).
   * Ohne plan_id, erstellt, stufen_sha und baustein_sha, die hängen von Zeit und Prüfsummen ab. */
  function erstellePlan(profil, bausteinIds, bausteine, stufen, optionen) {
    const entwurf = !!(optionen && optionen.entwurf);
    const stufe1Freigabe = (optionen && optionen.stufe1_freigabe) || null;
    const zustaende = pruefeZustaende(profil.zustaende || [], stufen);
    const [wdh, wdhQuelle] = wiederholungenFuerProfil(profil);
    const eintraege = [];
    const ausgeschlossen = [];
    const offenePunkte = [];

    function baueEintrag(bid, ersetzt) {
      const b = bausteine[bid];
      if (b === undefined) throw new SystemFehler(`Baustein ${bid} existiert nicht`);
      if (b.status !== "freigegeben" && !entwurf) {
        throw new SystemFehler(
          `Baustein ${bid} hat den Status '${b.status}' und ist nicht freigegeben. Für Tests mit --entwurf bauen, für Kunden erst freigeben.`
        );
      }
      const bew = bewerteBaustein(b, zustaende, stufen);
      let entscheidung = bew.entscheidung;
      if (entscheidung === "manuell" && stufe1Freigabe) entscheidung = "manuell_freigegeben";
      return [
        b,
        {
          id: bid,
          titel: b.titel,
          textfassung: "version" in b ? b.version : null,
          status_baustein: "status" in b ? b.status : null,
          entscheidung,
          stufe: bew.stufe,
          treffer: bew.treffer,
          ersetzt: ersetzt || null,
        },
      ];
    }

    for (const bid of bausteinIds) {
      const [b, e] = baueEintrag(bid, null);
      if (["frei", "info", "warnung", "manuell_freigegeben"].includes(e.entscheidung)) {
        const a = anpassungen(mitWiederholungen(b, wdh), zustaende);
        Object.assign(e, a);
        if (wdh && hatWiederholungen(b)) e.wiederholungen_pro_satz = wdh;
        if (e.entscheidung === "warnung" && !a.varianten.length && !a.uebersprungene_cues.length) {
          offenePunkte.push(
            `${bid}: Stufe 3, aber weder Variantentext noch angepasster Cue hinterlegt. ` +
              "Der Hinweis muss auf dem Planblatt stehen (Wording von Lando)."
          );
        }
        eintraege.push(e);
        continue;
      }
      if (e.entscheidung === "gesperrt") {
        for (const ersatzId of b.ersatz || []) {
          const [eb, ee] = baueEintrag(ersatzId, bid);
          if (["frei", "info", "warnung"].includes(ee.entscheidung)) {
            Object.assign(ee, anpassungen(mitWiederholungen(eb, wdh), zustaende));
            if (wdh && hatWiederholungen(eb)) ee.wiederholungen_pro_satz = wdh;
            eintraege.push(ee);
            e.ersatz_verwendet = ersatzId;
            break;
          }
        }
      }
      ausgeschlossen.push(e);
    }

    const manuell = ausgeschlossen.filter((e) => e.entscheidung === "manuell");
    let status;
    if (manuell.length) {
      status = "manuell_pruefen";
      offenePunkte.push(
        "Stufe 1: " + manuell.map((e) => e.id).join(", ") +
          " nicht automatisch. Lando entscheidet persönlich (Plan erneut mit Freigabe erzeugen oder Absage)."
      );
    } else if (!eintraege.length) {
      status = "kein_audio";
      offenePunkte.push("Kein Baustein im Plan, weil alle gesperrt sind. Ersatzbaustein oder Rückmeldung an den Kunden nötig.");
    } else {
      status = "bereit";
    }
    for (const e of ausgeschlossen) {
      if (e.entscheidung === "gesperrt" && !("ersatz_verwendet" in e)) offenePunkte.push(`${e.id}: gesperrt, kein Ersatzbaustein hinterlegt.`);
    }

    const hinweise = [];
    for (const z of sortiert([...zustaende])) {
      const t = stufen.zustaende[z].intern_hinweis;
      if (t) hinweise.push({ zustand: z, text: t });
    }

    return {
      profil_id: profil.id,
      entwurf,
      zustaende: sortiert([...zustaende]),
      wiederholungen_pro_satz: wdh,
      wiederholungen_quelle: wdhQuelle,
      niveau: "niveau" in profil ? profil.niveau : null,
      status,
      stufe1_freigabe: stufe1Freigabe ? { von: stufe1Freigabe } : null,
      bausteine: eintraege,
      ausgeschlossen,
      intern_hinweise: hinweise,
      offene_punkte: offenePunkte,
    };
  }

  const PilotLogik = {
    SystemFehler,
    REGION_NICHTS,
    RANG,
    sichtbareFragen,
    istSichtbar,
    zielKandidaten,
    pruefeAntworten,
    auswerten,
    bewerteBaustein,
    anpassungen,
    erstellePlan,
    mitWiederholungen,
    wiederholungenFuerProfil,
    hatWiederholungen,
    segmente,
    istBlock,
    blockCues,
    cueAktiv,
    effektiverText,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = PilotLogik;
  else global.PilotLogik = PilotLogik;
})(typeof window !== "undefined" ? window : globalThis);
