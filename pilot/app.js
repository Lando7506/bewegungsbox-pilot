/* Oberfläche des Piloten: Fragebogen, Ampel, Plan, Abspielen.
 *
 * Alle Entscheidungen kommen aus logik.js (Nachbau des Python Systems). Diese Datei zeigt nur an.
 * Datenschutz: Antworten liegen nur im Arbeitsspeicher dieser Seite. Nichts wird gespeichert oder gesendet.
 */
(function () {
  "use strict";

  const D = window.PILOT_DATEN;
  const L = window.PilotLogik;
  const fb = D.fragebogen;
  const stufen = D.stufen;
  const bausteine = D.bausteine;
  const BAUSTEIN_IDS = Object.keys(bausteine).sort();
  const FRAGEN = {};
  for (const f of fb.fragen) FRAGEN[f.id] = f;
  const NICHTS = L.REGION_NICHTS;

  // Texte für die Bedienung (keine Gesundheitsfragen, die kommen alle aus fragebogen.json)
  const ANTWORT_JN = [
    { wert: "ja", text: "Ja" },
    { wert: "nein", text: "Nein" },
  ];
  const ANTWORT_WN = { wert: "wn", text: "Weiß nicht" };
  const AMPEL_TEXT = {
    gruen: {
      wort: "Grün",
      kurz: "Ein Plan ist möglich.",
      lang: "Nach deinen Angaben gibt es keine besonderen Hinweise. Lando schaut sich jeden Plan trotzdem persönlich an.",
    },
    gelb: {
      wort: "Gelb",
      kurz: "Ein Plan ist möglich, mit Hinweisen.",
      lang: "Einige Angaben brauchen Rücksicht. Manche Übungen werden angepasst oder weggelassen. Lando schaut sich den Plan persönlich an.",
    },
    orange: {
      wort: "Orange",
      kurz: "Rückruf nötig.",
      lang: "Bevor es einen Plan gibt, möchte Lando kurz mit dir sprechen. Lando ruft dich an und klärt ein paar Fragen.",
    },
    rot: {
      wort: "Rot",
      kurz: "Im Moment gibt es keinen Plan.",
      lang: "Einige Angaben sollten zuerst ärztlich geklärt werden. Lando schaut sich deine Angaben persönlich an und meldet sich.",
    },
  };
  const ENTSCHEIDUNG = {
    frei: { text: "frei", klasse: "e-frei", erklaerung: "Die Übung passt ohne Änderung." },
    info: { text: "Hinweis", klasse: "e-info", erklaerung: "Die Übung bleibt. Es gibt einen Hinweis im Heft." },
    warnung: { text: "Warnung", klasse: "e-warnung", erklaerung: "Die Übung bleibt, mit Änderung oder Hinweis auf dem Planblatt." },
    ersetzt: { text: "ersetzt", klasse: "e-ersetzt", erklaerung: "Diese Übung steht anstelle einer gesperrten Übung." },
    gesperrt: { text: "gesperrt", klasse: "e-gesperrt", erklaerung: "Die Übung kommt im Plan nicht vor." },
    manuell: { text: "Lando entscheidet", klasse: "e-manuell", erklaerung: "Kein automatischer Plan. Lando entscheidet persönlich." },
  };

  // ------------------------------------------------------------------ Zustand (nur im Arbeitsspeicher)

  const zustand = {
    ansicht: "start",
    antworten: {}, // alles, was eingegeben wurde, auch Antworten auf gerade ausgeblendete Fragen
    frageId: null,
    jahr: new Date().getFullYear(),
    beispiel: null,
    ergebnis: null,
    plan: null,
    meldung: null,
  };

  // ------------------------------------------------------------------ Hilfen

  function el(tag, attrs, ...kinder) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === null || v === undefined || v === false) continue;
      if (k === "klasse") e.className = v;
      else if (k === "text") e.textContent = v;
      else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v === true ? "" : v);
    }
    for (const kind of kinder.flat()) {
      if (kind === null || kind === undefined || kind === false) continue;
      e.append(typeof kind === "string" ? document.createTextNode(kind) : kind);
    }
    return e;
  }

  function knopf(text, onclick, klasse, attrs) {
    return el("button", { type: "button", klasse: "knopf " + (klasse || ""), onclick, ...(attrs || {}) }, text);
  }

  function zeigen(...kinder) {
    const main = document.getElementById("inhalt");
    main.replaceChildren(...kinder.filter((k) => k !== null && k !== undefined && k !== false));
    const h1 = main.querySelector("h1");
    if (h1) {
      h1.setAttribute("tabindex", "-1");
      h1.focus({ preventScroll: true });
    }
    window.scrollTo(0, 0);
  }

  function zustandName(z) {
    return (stufen.zustaende[z] && stufen.zustaende[z].name) || z;
  }

  function regionName(r) {
    return stufen.regionen[r] || r;
  }

  function minuten(sekunden) {
    const m = Math.round(sekunden / 60);
    return m <= 1 ? "etwa 1 Minute" : `etwa ${m} Minuten`;
  }

  function uhr(sekunden) {
    const s = Math.max(0, Math.round(sekunden));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  }

  // ------------------------------------------------------------------ Antworten bereinigen

  /* Nur Antworten auf Fragen, die im aktuellen Verlauf gestellt werden. Gewählte Bereiche in P0 und Ziele in Z3
   * müssen zu den früheren Antworten passen. Die Rohdaten bleiben erhalten, damit beim Zurückgehen nichts verloren geht. */
  function bereinigt(roh) {
    const a = {};
    for (const f of fb.fragen) {
      if (!(f.id in roh) || !L.istSichtbar(f, a, fb)) continue;
      let wert = roh[f.id];
      if (f.typ === "region_teilauswahl") {
        const quelle = (a[f.teilmenge_von] || []).filter((x) => x !== NICHTS);
        wert = wert.filter((x) => x === NICHTS || quelle.includes(x));
        if (!wert.length) continue;
      }
      if (f.typ === "ziele") {
        const kand = L.zielKandidaten(fb, a);
        wert = wert.filter((x) => kand.includes(x));
        if (!wert.length) continue;
      }
      a[f.id] = wert;
    }
    return a;
  }

  function sichtbar() {
    return L.sichtbareFragen(fb, bereinigt(zustand.antworten));
  }

  // ------------------------------------------------------------------ Start

  function zeigeStart() {
    zustand.ansicht = "start";
    zeigen(
      el("h1", { text: "So läuft es ab" }),
      el(
        "div",
        { klasse: "hinweis-box" },
        el("p", { text: "Dies ist ein Pilot zum Anschauen. Er ist kein Angebot und nicht fachlich geprüft." }),
        el("p", { klasse: "klein", text: "Bitte trag keine echten Gesundheitsdaten ein. Nimm lieber ein Beispiel oben aus der Liste." })
      ),
      el(
        "ol",
        { klasse: "karte schritte" },
        el("li", {}, el("strong", { text: "Fragebogen. " }), "Eine Frage pro Seite. Du kannst jederzeit zurückgehen."),
        el("li", {}, el("strong", { text: "Ampel. " }), "Feste Regeln werten die Antworten aus: Grün, Gelb, Orange oder Rot."),
        el("li", {}, el("strong", { text: "Plan. " }), "Bei Grün und Gelb siehst du, welche Übungen passen."),
        el("li", {}, el("strong", { text: "Abspielen. " }), "Eine Platzhalterstimme liest die Übungen vor. Es gibt noch keine echten Aufnahmen.")
      ),
      el(
        "p",
        { klasse: "leise klein" },
        "Alles bleibt in diesem Browserfenster. Nichts wird gespeichert oder verschickt. Beim Schließen ist alles weg."
      ),
      el("div", { klasse: "knopfreihe" }, knopf("Fragebogen starten", () => starteFragebogen()))
    );
  }

  function starteFragebogen(frageId) {
    const liste = sichtbar();
    zustand.frageId = frageId || liste[0].id;
    zustand.meldung = null;
    zeigeFrage();
  }

  // ------------------------------------------------------------------ Fragebogen

  /* Zeigt die aktuelle Frage. Mit behalten bleibt die Seite, wo sie ist (nach dem Antippen einer Antwort),
   * sonst beginnt sie oben und der Fokus geht auf die Frage. */
  function zeigeFrage(behalten) {
    zustand.ansicht = "frage";
    const f = FRAGEN[zustand.frageId];
    const liste = sichtbar();
    const pos = liste.findIndex((x) => x.id === f.id);
    const schritt = fb.schritte.find((s) => s.nr === f.schritt);
    const anteil = Math.round(((pos + 1) / liste.length) * 100);
    const balken = el("span");
    balken.style.width = anteil + "%";

    const kopf = el(
      "div",
      { klasse: "fortschritt" },
      el("p", { klasse: "fortschritt-text", text: `Frage ${pos + 1} von ${liste.length}` }),
      el("div", {
        klasse: "fortschritt-balken",
        role: "progressbar",
        "aria-valuemin": "0",
        "aria-valuemax": "100",
        "aria-valuenow": String(anteil),
        "aria-label": "Fortschritt",
      }, balken),
      el("p", { klasse: "leise klein", text: `Teil ${schritt.nr + 1} von ${fb.schritte.length}: ${schrittTitel(schritt)}` })
    );

    const eingabe = baueEingabe(f);
    const weiterText = weiterBeschriftung(f);
    const knoepfe = el(
      "div",
      { klasse: "knopfreihe" },
      pos > 0 ? knopf("Zurück", zurueck, "knopf-zweit") : knopf("Zur Übersicht", zeigeStart, "knopf-zweit"),
      knopf(weiterText, weiter, "", { id: "weiter" })
    );
    const meldung = zustand.meldung ? el("p", { klasse: "meldung", role: "alert", text: zustand.meldung }) : null;
    const teile = [kopf, el("h1", { klasse: "frage-text", id: "frage-titel", "data-frage": f.id, text: f.text }), eingabe, meldung, knoepfe];
    if (behalten) {
      const y = window.scrollY;
      document.getElementById("inhalt").replaceChildren(...teile.filter(Boolean));
      window.scrollTo(0, y);
    } else {
      zeigen(...teile);
    }
  }

  // Nach einer Antwort mit nur einer Wahl geht es kurz danach von selbst weiter, ohne extra Tippen auf "Weiter"
  const AUTO_WEITER_MS = 400;
  function autoWeiter(fid) {
    setTimeout(() => {
      if (zustand.ansicht === "frage" && zustand.frageId === fid) weiter();
    }, AUTO_WEITER_MS);
  }

  // Schritt Titel aus den Daten, der Zusatz "für alle" ist nur für Lando gedacht
  function schrittTitel(s) {
    return s.titel.replace(/, für alle$/, "");
  }

  function weiterBeschriftung(f) {
    const a = zustand.antworten[f.id];
    if (f.typ === "mehrfach" && (!a || !a.length)) return "Keins davon, weiter";
    if (!f.pflicht && (a === undefined || a === "")) return "Überspringen";
    return "Weiter";
  }

  function setze(fid, wert) {
    zustand.antworten[fid] = wert;
    zustand.meldung = null;
  }

  function wahlGruppe(f, optionen, mehrfach, klasse, maxWahl) {
    const aktuell = zustand.antworten[f.id];
    const gruppe = el("div", { klasse: "wahl " + (klasse || ""), role: "group", "aria-labelledby": "frage-titel" });
    for (const o of optionen) {
      const gewaehlt = mehrfach ? Array.isArray(aktuell) && aktuell.includes(o.wert) : aktuell === o.wert;
      const b = el(
        "button",
        {
          type: "button",
          klasse: "wahl-knopf" + (mehrfach ? " mehrfach" : ""),
          "aria-pressed": gewaehlt ? "true" : "false",
          "data-wert": String(o.wert),
          onclick: () => {
            if (!mehrfach) {
              setze(f.id, o.wert);
            } else {
              let liste = Array.isArray(aktuell) ? [...aktuell] : [];
              if (o.exklusiv) liste = gewaehlt ? [] : [o.wert];
              else {
                liste = liste.filter((x) => x !== NICHTS);
                if (gewaehlt) liste = liste.filter((x) => x !== o.wert);
                else if (!maxWahl || liste.length < maxWahl) liste.push(o.wert);
              }
              setze(f.id, liste);
            }
            zeigeFrage(true);
            if (!mehrfach) autoWeiter(f.id);
            const neu = document.querySelector(`.wahl-knopf[data-wert="${CSS.escape(String(o.wert))}"]`);
            if (neu) neu.focus({ preventScroll: true });
          },
        },
        o.text
      );
      // Höchstzahl erreicht: weitere Bereiche sind gesperrt, bis einer abgewählt wird
      if (mehrfach && maxWahl && !gewaehlt && !o.exklusiv && Array.isArray(aktuell)) {
        const anzahl = aktuell.filter((x) => x !== NICHTS).length;
        if (anzahl >= maxWahl) b.disabled = true;
      }
      gruppe.append(b);
    }
    return gruppe;
  }

  function baueEingabe(f) {
    const a = zustand.antworten[f.id];
    switch (f.typ) {
      case "ja_nein":
        return wahlGruppe(f, ANTWORT_JN, false, "wahl-zwei");
      case "ja_nein_wn":
        return wahlGruppe(f, [...ANTWORT_JN, ANTWORT_WN], false);
      case "auswahl":
        return wahlGruppe(f, f.optionen, false);
      case "mehrfach":
        return el(
          "div",
          {},
          el("p", { klasse: "leise klein", text: "Du kannst mehreres antippen. Trifft nichts zu, tippe unten auf „Keins davon, weiter“." }),
          wahlGruppe(f, f.optionen, true)
        );
      case "region_karte": {
        const optionen = Object.entries(stufen.regionen).map(([wert, text]) => ({ wert, text }));
        optionen.push({ wert: NICHTS, text: "Nichts davon", exklusiv: true });
        return el(
          "div",
          {},
          el("p", { klasse: "leise klein", text: "Tippe alle Bereiche an, die zutreffen. Trifft nichts zu, tippe auf „Nichts davon“." }),
          wahlGruppe(f, optionen, true)
        );
      }
      case "region_teilauswahl": {
        const quelle = (zustand.antworten[f.teilmenge_von] || []).filter((x) => x !== NICHTS);
        const optionen = quelle.map((r) => ({ wert: r, text: regionName(r) }));
        optionen.push({ wert: NICHTS, text: "Keine Schmerzen", exklusiv: true });
        const max = f.max || 3;
        return el(
          "div",
          {},
          el("p", { klasse: "leise klein", text: `Höchstens ${max} Bereiche.` }),
          wahlGruppe(f, optionen, true, "", max)
        );
      }
      case "ziele": {
        const optionen = L.zielKandidaten(fb, bereinigt(zustand.antworten)).map((k) => ({ wert: k, text: fb.ziele[k].text }));
        return el("div", {}, el("p", { klasse: "leise klein", text: "Höchstens zwei." }), wahlGruppe(f, optionen, true, "", 2));
      }
      case "skala": {
        const optionen = [];
        for (let i = f.min; i <= f.max; i++) optionen.push({ wert: i, text: String(i) });
        return el(
          "div",
          {},
          wahlGruppe(f, optionen, false, "skala"),
          el("div", { klasse: "skala-enden leise klein" }, el("span", { text: `${f.min} = keine` }), el("span", { text: `${f.max} = sehr groß` }))
        );
      }
      case "zahl": {
        const input = el("input", {
          klasse: "eingabe",
          id: "eingabe",
          type: "text",
          inputmode: "numeric",
          autocomplete: "off",
          "aria-labelledby": "frage-titel",
          "aria-describedby": "eingabe-hinweis",
          value: a === undefined ? "" : String(a),
        });
        input.addEventListener("input", () => {
          const t = input.value.trim();
          if (/^\d{4}$/.test(t)) zustand.antworten[f.id] = Number(t);
          else delete zustand.antworten[f.id];
        });
        input.addEventListener("keydown", (ev) => { if (ev.key === "Enter") weiter(); });
        return el("div", {}, input, el("p", { klasse: "feld-hinweis leise klein", id: "eingabe-hinweis", text: "Vier Ziffern, zum Beispiel 1948." }));
      }
      case "text": {
        const input = el("input", {
          klasse: "eingabe",
          id: "eingabe",
          type: "text",
          autocomplete: "off",
          "aria-labelledby": "frage-titel",
          "aria-describedby": "eingabe-hinweis",
          value: a === undefined ? "" : a,
        });
        input.addEventListener("input", () => {
          zustand.antworten[f.id] = input.value;
          const w = document.getElementById("weiter");
          if (w) w.textContent = weiterBeschriftung(f);
        });
        input.addEventListener("keydown", (ev) => { if (ev.key === "Enter") weiter(); });
        return el(
          "div",
          {},
          input,
          el("p", { klasse: "feld-hinweis leise klein", id: "eingabe-hinweis", text: "Bitte nichts Echtes eintragen. Für den Piloten reicht etwas Ausgedachtes." })
        );
      }
      default:
        return el("p", { text: `Unbekannter Fragetyp ${f.typ}` });
    }
  }

  // Prüft die aktuelle Antwort. Gibt einen Meldungstext zurück oder null.
  function pruefeAktuelle(f) {
    const a = zustand.antworten[f.id];
    const leer = a === undefined || (typeof a === "string" && !a.trim()) || (Array.isArray(a) && !a.length);
    if (f.typ === "mehrfach") {
      if (a === undefined) zustand.antworten[f.id] = [];
      return null;
    }
    if (leer) {
      if (!f.pflicht) {
        delete zustand.antworten[f.id];
        return null;
      }
      if (f.typ === "zahl") return "Bitte gib eine Jahreszahl mit vier Ziffern ein.";
      if (f.typ === "text") return "Bitte trag hier etwas ein.";
      return "Bitte wähle eine Antwort aus.";
    }
    if (f.typ === "zahl") {
      const max = Math.min(f.max, zustand.jahr);
      if (a < f.min || a > max) return `Bitte gib ein Jahr zwischen ${f.min} und ${max} ein.`;
    }
    return null;
  }

  function weiter() {
    const f = FRAGEN[zustand.frageId];
    const meldung = pruefeAktuelle(f);
    if (meldung) {
      zustand.meldung = meldung;
      zeigeFrage();
      return;
    }
    // Ohne Einwilligung geht es nicht weiter
    if ((f.id === "W1" || f.id === "W2") && zustand.antworten[f.id] === "nein") {
      zeigeErgebnis();
      return;
    }
    const liste = sichtbar();
    const pos = liste.findIndex((x) => x.id === f.id);
    if (pos + 1 < liste.length) {
      zustand.frageId = liste[pos + 1].id;
      zeigeFrage();
    } else {
      zeigeErgebnis();
    }
  }

  function zurueck() {
    const liste = sichtbar();
    const pos = liste.findIndex((x) => x.id === zustand.frageId);
    zustand.meldung = null;
    if (pos > 0) {
      zustand.frageId = liste[pos - 1].id;
      zeigeFrage();
    } else {
      zeigeStart();
    }
  }

  // ------------------------------------------------------------------ Ergebnis (Ampel)

  function auswerten() {
    const a = bereinigt(zustand.antworten);
    try {
      return L.auswerten(a, fb, stufen, zustand.jahr, zustand.beispiel || "PILOT");
    } catch (e) {
      return { status: "fehler", meldung: e.message };
    }
  }

  function zeigeErgebnis() {
    stoppePlayer();
    zustand.ansicht = "ergebnis";
    const r = auswerten();
    zustand.ergebnis = r;
    zustand.plan = null;
    const teile = [];

    if (r.status === "keine_einwilligung") {
      teile.push(ampelKarte("grau", "Ohne Einwilligung geht es nicht weiter.", "Ohne Zustimmung werden keine Angaben ausgewertet.", "Stopp"));
    } else if (r.status === "unvollstaendig") {
      teile.push(ampelKarte("grau", "Es fehlen noch Antworten.", "Ohne alle Pflichtantworten gibt es keine Ampel.", "?"));
      teile.push(el("div", { klasse: "knopfreihe" }, knopf("Zur ersten offenen Frage", () => starteFragebogen(r.fehlende_fragen[0]))));
    } else if (r.status === "fehler") {
      teile.push(ampelKarte("grau", "Die Antworten passen nicht zusammen.", r.meldung, "!"));
    } else {
      const t = AMPEL_TEXT[r.ampel];
      teile.push(ampelKarte(r.ampel, `${t.wort}: ${t.kurz}`, t.lang, t.wort[0]));
      if (r.notfallhinweis) teile.push(el("div", { klasse: "notfall", role: "alert" }, r.notfallhinweis));
      if (r.ampel === "gruen" || r.ampel === "gelb") {
        teile.push(el("div", { klasse: "knopfreihe" }, knopf("Plan ansehen", zeigePlan)));
      } else if (r.ampel === "orange") {
        teile.push(el("p", { klasse: "karte", text: "Im echten Ablauf ruft Lando an. Erst danach entsteht ein Plan. Im Piloten endet der Ablauf hier." }));
      } else {
        teile.push(el("p", { klasse: "karte", text: "Im echten Ablauf schaut Lando sich das persönlich an. Ein Plan entsteht hier nicht." }));
      }
      teile.push(hinterDenKulissen(r));
    }
    if (r.status === "keine_einwilligung") teile.push(el("p", { klasse: "karte", text: r.grund }));
    teile.push(
      el(
        "div",
        { klasse: "knopfreihe" },
        knopf("Antworten ansehen oder ändern", () => starteFragebogen(), "knopf-zweit"),
        knopf("Zur Übersicht", zeigeStart, "knopf-zweit")
      )
    );
    zeigen(...teile);
  }

  function ampelKarte(farbe, titel, text, zeichen) {
    return el(
      "section",
      { klasse: `ampel ampel-${farbe}`, "aria-labelledby": "ampel-titel" },
      el("div", { klasse: "ampel-licht", "aria-hidden": "true", text: zeichen }),
      el("div", {}, el("h1", { id: "ampel-titel", text: titel }), el("p", { text }))
    );
  }

  function liste(eintraege) {
    return eintraege.length ? el("ul", {}, eintraege.map((x) => el("li", {}, x))) : el("p", { text: "keine" });
  }

  function hinterDenKulissen(r) {
    const nurWn = new Set(r.zustaende_nur_wegen_weiss_nicht);
    const zielTexte = (r.ziele || []).map((z) => (fb.ziele[z] ? fb.ziele[z].text : z));
    return el(
      "details",
      { klasse: "hinter" },
      el("summary", { text: "Für Lando und die Fachperson: so kam die Ampel zustande" }),
      el("p", { klasse: "leise", text: "Regelprüfung P1 nach festen Regeln, ohne KI. Nachbau des Python Systems, Fragebogen Entwurf " + fb.version + ". Nicht fachlich geprüft." }),
      el("h3", { text: "Rot" }),
      liste(r.rot.map((x) => `${x.frage}: ${x.grund}`)),
      el("h3", { text: "Orange" }),
      liste(r.orange.map((x) => `${x.code}: ${x.grund} (Quelle ${x.quelle})`)),
      el("h3", { text: "Zustände" }),
      liste(r.zustaende.map((z) => [zustandName(z) + " ", el("code", { text: z }), nurWn.has(z) ? " (nur wegen Weiß nicht)" : ""])),
      el("h3", { text: "Körperbereiche" }),
      el("p", { text: "Gewählt: " + (r.regionen.length ? r.regionen.map(regionName).join(", ") : "keine") }),
      el("p", { text: "Genaueres unklar: " + (r.regionen_unklar.length ? r.regionen_unklar.map(regionName).join(", ") : "keine") }),
      el("h3", { text: "Vorläufiges Niveau" }),
      el("p", { text: `${r.niveau_vorlaeufig}` + (r.niveau_gruende.length ? ` (${r.niveau_gruende.join(", ")})` : "") }),
      el("h3", { text: "Ziele" }),
      liste(zielTexte),
      el("h3", { text: "Weiteres" }),
      el("p", { text: `Alter: ${r.alter} (laufendes Jahr ${zustand.jahr} minus Geburtsjahr)` }),
      el("p", { text: "Strittige Regeln beteiligt: " + (r.strittige_regeln_beteiligt.length ? r.strittige_regeln_beteiligt.join(", ") : "keine") }),
      el("h3", { text: "Noch nicht geprüft" }),
      liste(r.noch_nicht_geprueft)
    );
  }

  // ------------------------------------------------------------------ Plan

  function berechnePlan() {
    const r = zustand.ergebnis;
    const profil = { id: "PILOT", zustaende: r.zustaende, niveau: r.niveau_vorlaeufig };
    return L.erstellePlan(profil, BAUSTEIN_IDS, bausteine, stufen, { entwurf: true });
  }

  function wiederholungsText(plan, e) {
    const b = bausteine[e.id];
    if (!L.hatWiederholungen(b)) return "Keine Zählung. Die Übung wird gehalten.";
    if (e.wiederholungen_pro_satz) {
      const herkunft = {
        niveau: `Startwert aus dem Niveau ${plan.niveau}`,
        hand: "von Hand festgelegt",
        baustein: "Standard der Übung",
      }[plan.wiederholungen_quelle];
      return `${e.wiederholungen_pro_satz} je Satz (${herkunft})`;
    }
    const seg = [...L.segmente(b)].map((x) => x[2]).find((s) => s.typ === "wiederholungen");
    return `${seg.anzahl} je Satz (Standard der Übung)`;
  }

  function entscheidungVon(e) {
    return e.ersetzt ? "ersetzt" : e.entscheidung;
  }

  function planKarte(plan, e, imPlan) {
    const ent = ENTSCHEIDUNG[entscheidungVon(e)] || { text: e.entscheidung, klasse: "", erklaerung: "" };
    const daten = [];
    if (imPlan) {
      daten.push(el("div", {}, el("dt", { text: "Wiederholungen:" }), el("dd", { text: wiederholungsText(plan, e) })));
      daten.push(el("div", {}, el("dt", { text: "Dauer:" }), el("dd", { text: minuten(e.soll_dauer_s) })));
      if (e.uebersprungene_cues.length) {
        daten.push(el("div", {}, el("dt", { text: "Angepasst:" }), el("dd", { text: `${e.uebersprungene_cues.length} Hinweis${e.uebersprungene_cues.length > 1 ? "e fallen" : " fällt"} weg` })));
      }
      if (e.varianten.length) daten.push(el("div", {}, el("dt", { text: "Angepasst:" }), el("dd", { text: "Text in einer anderen Fassung" })));
    }
    return el(
      "li",
      { klasse: "karte plan-eintrag" + (imPlan ? "" : " ist-gesperrt") },
      el("h3", { text: e.titel }),
      el("div", { klasse: "marken" }, el("span", { klasse: "marke-entscheidung " + ent.klasse, text: ent.text })),
      el("p", { klasse: "klein", text: ent.erklaerung }),
      daten.length ? el("dl", { klasse: "daten klein" }, daten) : null
    );
  }

  function zeigePlan() {
    stoppePlayer();
    zustand.ansicht = "plan";
    const plan = berechnePlan();
    zustand.plan = plan;
    const teile = [el("h1", { text: "Dein Plan (Entwurf)" })];
    teile.push(
      el(
        "div",
        { klasse: "hinweis-box" },
        el("p", { text: "Die Auswahl der Übungen nach Alltag und Niveau ist noch nicht gebaut. Deshalb siehst du hier alle Übungen, die es schon gibt, und was die Regeln für sie entscheiden." }),
        el("p", { klasse: "klein", text: "Alle Übungen sind Entwürfe und nicht freigegeben." })
      )
    );
    if (plan.status === "kein_audio") {
      teile.push(el("p", { klasse: "karte", text: "Keine Übung passt. Im echten Ablauf meldet sich Lando." }));
    }
    if (plan.bausteine.length) {
      teile.push(el("h2", { text: `Im Plan (${plan.bausteine.length})` }));
      teile.push(el("ul", { klasse: "plan-liste" }, plan.bausteine.map((e) => planKarte(plan, e, true))));
      teile.push(el("div", { klasse: "knopfreihe" }, knopf("Abspielen", zeigePlayer)));
    }
    if (plan.ausgeschlossen.length) {
      teile.push(el("h2", { text: `Nicht im Plan (${plan.ausgeschlossen.length})` }));
      teile.push(el("ul", { klasse: "plan-liste" }, plan.ausgeschlossen.map((e) => planKarte(plan, e, false))));
    }
    teile.push(
      el(
        "details",
        { klasse: "hinter" },
        el("summary", { text: "Für Lando: offene Punkte und interne Hinweise" }),
        el("h3", { text: "Offene Punkte" }),
        liste(plan.offene_punkte),
        el("h3", { text: "Gründe je Übung (interne Texte aus den Bausteinen, nicht für Kunden)" }),
        liste(
          [...plan.bausteine, ...plan.ausgeschlossen]
            .filter((e) => e.treffer.length)
            .map((e) => `${e.id} ${ENTSCHEIDUNG[entscheidungVon(e)].text}: ` +
              e.treffer.map((t) => `${zustandName(t.zustand)} (Stufe ${t.stufe}, ${t.quelle})` + (t.hinweis && t.quelle === "baustein" ? `: ${t.hinweis}` : "")).join("; "))
        ),
        el("h3", { text: "Interne Hinweise" }),
        liste(plan.intern_hinweise.map((h) => `${zustandName(h.zustand)}: ${h.text}`)),
        el("p", { klasse: "leise", text: `Status: ${plan.status}. Wiederholungen: ${plan.wiederholungen_pro_satz || "Standard"} (Quelle ${plan.wiederholungen_quelle}).` })
      )
    );
    teile.push(el("div", { klasse: "knopfreihe" }, knopf("Zurück zur Ampel", zeigeErgebnis, "knopf-zweit")));
    zeigen(...teile);
  }

  // ------------------------------------------------------------------ Abspielen

  /* Ablauf aus dem Plan: je Baustein Sprechen, Pausen und Zeitblöcke mit Hinweisen.
   * Weggelassene Hinweise und Varianten wie im Plan (gleiche Logik). Wiederholungen aus dem Plan. */
  function baueAblauf(plan) {
    const z = new Set(plan.zustaende);
    const uebungen = [];
    for (const e of plan.bausteine) {
      const b = L.mitWiederholungen(bausteine[e.id], plan.wiederholungen_pro_satz);
      const schritte = [];
      for (const [, , seg] of L.segmente(b)) {
        if (seg.typ === "sprechen") {
          const t = L.effektiverText(seg, z);
          schritte.push({ art: "sprechen", text: t.text, dauer: t.soll_dauer_s });
        } else if (seg.typ === "pause") {
          schritte.push({ art: "pause", dauer: seg.soll_dauer_s });
        } else if (L.istBlock(seg)) {
          const cues = L.blockCues(seg)
            .filter((c) => L.cueAktiv(c, z))
            .map((c) => ({ bei_s: c.bei_s, text: L.effektiverText(c, z).text }));
          schritte.push({ art: "block", dauer: seg.soll_dauer_s, cues });
        }
      }
      uebungen.push({ id: e.id, titel: e.titel, schritte, dauer: schritte.reduce((s, x) => s + x.dauer, 0) });
    }
    return uebungen;
  }

  const player = {
    uebungen: [],
    u: 0, // aktuelle Übung
    s: 0, // aktueller Schritt
    laeuft: false,
    start: 0, // Zeitpunkt, an dem der Schritt begann (performance.now)
    vergangen: 0, // Sekunden im Schritt beim Anhalten
    naechsterCue: 0,
    gesprochen: false,
    sprechenFertig: false,
    zwischenpause: false,
    untertitel: "",
    fertig: false,
    timer: null,
    stimme: null,
  };

  const kannSprechen = typeof window.speechSynthesis !== "undefined" && typeof window.SpeechSynthesisUtterance !== "undefined";

  function waehleStimme() {
    if (!kannSprechen) return null;
    const stimmen = window.speechSynthesis.getVoices();
    return stimmen.find((v) => v.lang === "de-DE") || stimmen.find((v) => (v.lang || "").toLowerCase().startsWith("de")) || null;
  }

  function sprich(text, fertig) {
    player.untertitel = text;
    if (!kannSprechen) {
      if (fertig) fertig();
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "de-DE";
    u.rate = 0.9;
    if (!player.stimme) player.stimme = waehleStimme();
    if (player.stimme) u.voice = player.stimme;
    if (fertig) {
      u.onend = fertig;
      u.onerror = fertig;
    }
    window.speechSynthesis.speak(u);
  }

  function stille() {
    if (kannSprechen) window.speechSynthesis.cancel();
  }

  function sekundenImSchritt() {
    return player.laeuft ? (performance.now() - player.start) / 1000 : player.vergangen;
  }

  function schrittBeginnen(vergangen) {
    player.vergangen = vergangen || 0;
    player.start = performance.now() - player.vergangen * 1000;
    player.gesprochen = false;
    player.sprechenFertig = false;
    const schritt = aktuellerSchritt();
    if (schritt && schritt.art === "block") {
      player.naechsterCue = schritt.cues.findIndex((c) => c.bei_s >= player.vergangen);
      if (player.naechsterCue < 0) player.naechsterCue = schritt.cues.length;
      if (!player.vergangen) player.untertitel = "";
    }
    if (schritt && schritt.art === "pause" && !player.zwischenpause) player.untertitel = "";
  }

  function aktuellerSchritt() {
    if (player.zwischenpause) return { art: "pause", dauer: D.einstellungen.pause_zwischen_bausteinen_s };
    const u = player.uebungen[player.u];
    return u ? u.schritte[player.s] : null;
  }

  function naechsterSchritt() {
    stille();
    if (player.zwischenpause) {
      player.zwischenpause = false;
      player.s = 0;
      schrittBeginnen(0);
      return;
    }
    const u = player.uebungen[player.u];
    if (player.s + 1 < u.schritte.length) {
      player.s += 1;
      schrittBeginnen(0);
    } else {
      springeZuUebung(player.u + 1, true);
    }
  }

  function springeZuUebung(index, mitPause) {
    stille();
    if (index >= player.uebungen.length) {
      player.laeuft = false;
      player.fertig = true;
      player.untertitel = "Das war die letzte Übung. Gut gemacht.";
      sprich(player.untertitel);
      zeichnePlayer();
      return;
    }
    player.u = index;
    player.s = 0;
    player.fertig = false;
    player.zwischenpause = !!mitPause;
    if (player.zwischenpause) player.untertitel = `Kurze Pause. Gleich kommt: ${player.uebungen[index].titel}`;
    schrittBeginnen(0);
  }

  function takt() {
    if (!player.laeuft) return;
    const schritt = aktuellerSchritt();
    if (!schritt) return;
    const t = sekundenImSchritt();
    if (schritt.art === "sprechen") {
      if (!player.gesprochen) {
        player.gesprochen = true;
        sprich(schritt.text, () => { player.sprechenFertig = true; });
      }
      // Weiter, wenn die Sollzeit vorbei ist und die Stimme fertig ist. Ohne Rückmeldung der Stimme nach spätestens doppelter Zeit.
      if (t >= schritt.dauer && (player.sprechenFertig || t >= schritt.dauer * 2 + 5)) naechsterSchritt();
    } else if (schritt.art === "pause") {
      if (t >= schritt.dauer) naechsterSchritt();
    } else if (schritt.art === "block") {
      while (player.naechsterCue < schritt.cues.length && schritt.cues[player.naechsterCue].bei_s <= t) {
        sprich(schritt.cues[player.naechsterCue].text);
        player.naechsterCue += 1;
      }
      if (t >= schritt.dauer) naechsterSchritt();
    }
    // Neue Übung, Pause zwischen Übungen oder Ende: Kopf und Knöpfe neu zeichnen, sonst nur Text und Zeit
    if (playerSchluessel() !== player.gezeichnet) zeichnePlayer();
    else aktualisiereAnzeige();
  }

  function playerSchluessel() {
    return `${player.u}|${player.zwischenpause}|${player.laeuft}|${player.fertig}`;
  }

  function abspielen() {
    if (player.fertig) {
      springeZuUebung(0, false);
    }
    const schritt = aktuellerSchritt();
    // Ein angefangener Satz beginnt nach der Pause von vorn
    if (schritt && schritt.art === "sprechen") schrittBeginnen(0);
    else schrittBeginnen(player.vergangen);
    player.laeuft = true;
    if (!player.timer) player.timer = setInterval(takt, 100);
    zeichnePlayer();
    takt();
  }

  function anhalten() {
    player.vergangen = sekundenImSchritt();
    player.laeuft = false;
    stille();
    zeichnePlayer();
  }

  function stoppePlayer() {
    player.laeuft = false;
    if (player.timer) clearInterval(player.timer);
    player.timer = null;
    stille();
  }

  function zeigePlayer() {
    stoppePlayer();
    zustand.ansicht = "player";
    player.uebungen = baueAblauf(zustand.plan);
    player.u = 0;
    player.s = 0;
    player.fertig = false;
    player.zwischenpause = false;
    player.untertitel = "Tippe auf „Abspielen“, dann geht es los.";
    schrittBeginnen(0);
    zeichnePlayer(true);
  }

  function zeitInUebung() {
    const u = player.uebungen[player.u];
    if (!u || player.zwischenpause) return 0;
    let t = 0;
    for (let i = 0; i < player.s; i++) t += u.schritte[i].dauer;
    return t + Math.min(sekundenImSchritt(), u.schritte[player.s].dauer);
  }

  function aktualisiereAnzeige() {
    const ut = document.getElementById("untertitel");
    if (ut && ut.textContent !== player.untertitel) ut.textContent = player.untertitel;
    const zeit = document.getElementById("zeit");
    const u = player.uebungen[player.u];
    if (zeit && u) {
      if (player.zwischenpause) {
        zeit.textContent = `Pause, noch ${uhr(D.einstellungen.pause_zwischen_bausteinen_s - sekundenImSchritt())}`;
      } else {
        zeit.textContent = `${uhr(zeitInUebung())} von ${uhr(u.dauer)}`;
      }
    }
  }

  function zeichnePlayer(ersterAufruf) {
    if (zustand.ansicht !== "player") return;
    const u = player.uebungen[player.u];
    const kopf = el(
      "div",
      {},
      el("p", { klasse: "platzhalter", text: "Platzhalterstimme, keine echte Aufnahme" }),
      el("p", { klasse: "leise", text: `Übung ${player.u + 1} von ${player.uebungen.length}` }),
      el("h1", { klasse: "player-titel", text: u ? u.titel : "" })
    );
    const hinweis = kannSprechen
      ? null
      : el("p", { klasse: "hinweis-box", text: "Dein Browser kann nicht vorlesen. Der Text erscheint nur auf dem Bildschirm." });
    const untertitel = el("p", { klasse: "untertitel", id: "untertitel", "aria-live": "polite", text: player.untertitel });
    const zeit = el("p", { klasse: "zeit", id: "zeit" });
    const spielKnopf = player.laeuft
      ? el("button", { type: "button", klasse: "knopf", id: "spielen", onclick: anhalten }, el("span", { klasse: "symbol", "aria-hidden": "true", text: "❚❚" }), "Pause")
      : el("button", { type: "button", klasse: "knopf", id: "spielen", onclick: abspielen }, el("span", { klasse: "symbol", "aria-hidden": "true", text: "▶" }), player.vergangen || player.s || player.u ? "Weiter abspielen" : "Abspielen");
    const knoepfe = el(
      "div",
      { klasse: "player-knoepfe" },
      el("button", {
        type: "button",
        klasse: "knopf knopf-zweit",
        id: "wiederholen",
        onclick: () => {
          springeZuUebung(player.u, false);
          if (!player.laeuft) zeichnePlayer();
        },
      }, el("span", { klasse: "symbol", "aria-hidden": "true", text: "↺" }), "Übung wiederholen"),
      spielKnopf,
      el("button", {
        type: "button",
        klasse: "knopf knopf-zweit",
        id: "naechste",
        disabled: player.u + 1 >= player.uebungen.length && !player.zwischenpause,
        onclick: () => {
          springeZuUebung(player.zwischenpause ? player.u : player.u + 1, false);
          zeichnePlayer();
        },
      }, el("span", { klasse: "symbol", "aria-hidden": "true", text: "⏭" }), "Nächste Übung")
    );
    const aktiv = document.activeElement;
    const fokusId = aktiv && ["spielen", "wiederholen", "naechste"].includes(aktiv.id) ? aktiv.id : null;
    player.gezeichnet = playerSchluessel();
    const teile = [kopf, hinweis, untertitel, zeit, knoepfe, el("div", { klasse: "knopfreihe" }, knopf("Zurück zum Plan", zeigePlan, "knopf-zweit"))];
    if (ersterAufruf) zeigen(...teile);
    else document.getElementById("inhalt").replaceChildren(...teile.filter(Boolean));
    const fokusZiel = fokusId && document.getElementById(fokusId);
    if (fokusZiel && !fokusZiel.disabled) fokusZiel.focus();
    else if (fokusId) document.getElementById("spielen").focus();
    aktualisiereAnzeige();
  }

  // ------------------------------------------------------------------ Kopf: Beispiele und Löschen

  function fuelleBeispiele() {
    const sel = document.getElementById("beispiel");
    const farbe = { gruen: "Grün", gelb: "Gelb", orange: "Orange", rot: "Rot" };
    const art = (p) => (p.ampel ? farbe[p.ampel] : p.status === "unvollstaendig" ? "unvollständig" : "ohne Einwilligung");
    sel.append(el("option", { value: "", text: "Eigene Antworten" }));
    const vorn = el("optgroup", { label: "Je Ampelfarbe ein Beispiel" });
    for (const f of ["gruen", "gelb", "orange", "rot"]) {
      const p = D.demo.find((x) => x.hervorgehoben === f);
      if (p) vorn.append(el("option", { value: p.id, text: `${farbe[f]}: ${p.name}` }));
    }
    sel.append(vorn);
    const alle = el("optgroup", { label: "Alle Testprofile" });
    for (const p of D.demo) alle.append(el("option", { value: p.id, text: `${p.id} (${art(p)}): ${p.name}` }));
    sel.append(alle);
    sel.addEventListener("change", () => {
      const p = D.demo.find((x) => x.id === sel.value);
      if (!p) {
        allesLoeschen(true);
        return;
      }
      stoppePlayer();
      zustand.antworten = JSON.parse(JSON.stringify(p.antworten));
      zustand.jahr = p.jahr;
      zustand.beispiel = p.id;
      zeigeErgebnis();
    });
  }

  function allesLoeschen(ausAuswahl) {
    stoppePlayer();
    zustand.antworten = {};
    zustand.ergebnis = null;
    zustand.plan = null;
    zustand.beispiel = null;
    zustand.meldung = null;
    zustand.jahr = new Date().getFullYear();
    if (!ausAuswahl) document.getElementById("beispiel").value = "";
    zeigeStart();
  }

  document.getElementById("loeschen").addEventListener("click", () => allesLoeschen(false));
  if (kannSprechen && window.speechSynthesis.addEventListener) {
    window.speechSynthesis.addEventListener("voiceschanged", () => { player.stimme = waehleStimme(); });
  }
  fuelleBeispiele();
  zeigeStart();
})();
