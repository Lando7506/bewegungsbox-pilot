/* Oberfläche des Piloten: Fragebogen, Ampel, Plan, Abspielen.
 *
 * Alle Entscheidungen kommen aus logik.js (Nachbau des Python Systems). Diese Datei zeigt nur an.
 * Welche Fragen zusammen auf einem Bildschirm stehen und wie lange Texte gegliedert werden, steht in darstellung.js.
 * Datenschutz: Antworten liegen nur im Arbeitsspeicher dieser Seite. Nichts wird gespeichert oder gesendet.
 */
(function () {
  "use strict";

  const D = window.PILOT_DATEN;
  const L = window.PilotLogik;
  const A = window.PilotDarstellung;
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
  const ANTWORT_WN = { wert: "wn", text: "Weiß nicht", leise: true };
  const AMPEL_TEXT = {
    gruen: {
      wort: "Grün",
      zeichen: "✓",
      kurz: "Ein Plan ist möglich.",
      lang: "Nach deinen Angaben gibt es keine besonderen Hinweise. Lando schaut sich jeden Plan trotzdem persönlich an.",
    },
    gelb: {
      wort: "Gelb",
      zeichen: "!",
      kurz: "Ein Plan ist möglich, mit Rücksicht.",
      lang: "Manche Übungen werden angepasst oder weggelassen. Lando schaut sich den Plan persönlich an.",
    },
    orange: {
      wort: "Orange",
      zeichen: "☎",
      kurz: "Erst ein kurzes Gespräch.",
      lang: "Bevor es einen Plan gibt, möchte Lando kurz mit dir sprechen und ein paar Fragen klären.",
    },
    rot: {
      wort: "Rot",
      zeichen: "✕",
      kurz: "Im Moment gibt es keinen Plan.",
      lang: "Einige Angaben sollten zuerst ärztlich geklärt werden. Lando schaut sich deine Angaben persönlich an und meldet sich.",
    },
  };
  // Entscheidung je Übung: Begriff aus dem Regelwerk und was er für dich heißt
  const ENTSCHEIDUNG = {
    frei: { text: "frei", klasse: "e-frei", erklaerung: "Passt ohne Änderung." },
    info: { text: "Hinweis", klasse: "e-info", erklaerung: "Passt. Dazu gibt es einen Hinweis im Heft." },
    warnung: { text: "Warnung", klasse: "e-warnung", erklaerung: "Bleibt im Plan, wird aber angepasst oder bekommt einen Hinweis." },
    ersetzt: { text: "ersetzt", klasse: "e-ersetzt", erklaerung: "Steht anstelle einer Übung, die wegfällt." },
    gesperrt: { text: "gesperrt", klasse: "e-gesperrt", erklaerung: "Fällt weg." },
    manuell: { text: "Lando entscheidet", klasse: "e-manuell", erklaerung: "Lando entscheidet persönlich." },
  };
  const TIPP_SPERRE_MS = 600; // so lange nach einem Seitenwechsel zählt ein Tipp auf "Weiter" nicht (Doppeltipp, Zittern)

  // ------------------------------------------------------------------ Zustand (nur im Arbeitsspeicher)

  const zustand = {
    ansicht: "start",
    antworten: {}, // alles, was eingegeben wurde, auch Antworten auf gerade ausgeblendete Fragen
    seite: 0, // Index in A.SEITEN
    fehlend: [], // Frage IDs, die auf dieser Seite noch fehlen (nach Tipp auf Weiter)
    meldung: null,
    ausUebersicht: false,
    gezeigtUm: 0,
    jahr: new Date().getFullYear(),
    beispiel: null,
    ergebnis: null,
    plan: null,
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

  // Platz unten für die feste Leiste nur dort, wo es eine gibt
  function koerperKlasse() {
    document.body.classList.toggle("mit-leiste", zustand.ansicht === "frage");
    document.body.classList.toggle("mit-player", zustand.ansicht === "player");
  }

  function zeigen(...kinder) {
    koerperKlasse();
    const main = document.getElementById("inhalt");
    main.replaceChildren(...kinder.filter((k) => k !== null && k !== undefined && k !== false));
    zustand.gezeigtUm = performance.now();
    const h1 = main.querySelector("h1");
    if (h1) {
      h1.setAttribute("tabindex", "-1");
      h1.focus({ preventScroll: true });
    }
    window.scrollTo(0, 0);
  }

  const wenigBewegung = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

  function grossAnfang(t) {
    return t ? t[0].toUpperCase() + t.slice(1) : t;
  }

  // ------------------------------------------------------------------ Antworten bereinigen

  /* Nur Antworten auf Fragen, die im aktuellen Verlauf gestellt werden. Gewählte Bereiche in P0 und Ziele in Z3
   * müssen zu den früheren Antworten passen. Die Rohdaten bleiben erhalten, damit beim Zurückgehen nichts verloren geht. */
  function bereinigt(roh) {
    const a = {};
    for (const f of fb.fragen) {
      if (!(f.id in roh) || !L.istSichtbar(f, a, fb)) continue;
      let wert = roh[f.id];
      // Ein halb eingetipptes Jahr ("48") gilt als noch nicht beantwortet
      if (f.typ === "zahl" && typeof wert !== "number") continue;
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

  // Sichtbarkeit wie in der Auswertung. Fragen später im Fragebogen sehen nur die bereinigten früheren Antworten.
  function frageSichtbar(f) {
    return L.istSichtbar(f, bereinigt(zustand.antworten), fb);
  }

  function seiteSichtbar(seite) {
    return seite.fragen.some((id) => frageSichtbar(FRAGEN[id]));
  }

  function sichtbareSeiten() {
    return A.SEITEN.map((s, i) => i).filter((i) => seiteSichtbar(A.SEITEN[i]));
  }

  function seiteVon(fid) {
    return A.SEITEN.findIndex((s) => s.fragen.includes(fid));
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
        el("p", { text: "Bitte trag keine echten Gesundheitsdaten ein. Beispiele findest du oben im Pilot-Menü." })
      ),
      el(
        "ol",
        { klasse: "karte schritte" },
        el("li", {}, el("strong", { text: "Fragen. " }), "Ein paar Fragen pro Seite, etwa 20 Seiten. Du kannst jederzeit zurückgehen."),
        el("li", {}, el("strong", { text: "Ampel. " }), "Feste Regeln werten die Antworten aus: Grün, Gelb, Orange oder Rot."),
        el("li", {}, el("strong", { text: "Plan. " }), "Bei Grün und Gelb siehst du, welche Übungen passen."),
        el("li", {}, el("strong", { text: "Abspielen. " }), "Eine Platzhalterstimme liest die Übungen vor. Es gibt noch keine echten Aufnahmen.")
      ),
      el("p", { klasse: "leise" }, "Alles bleibt in diesem Browserfenster. Nichts wird gespeichert oder verschickt. Beim Schließen ist alles weg."),
      el("div", { klasse: "knopfreihe" }, knopf("Los geht's", () => starteFragebogen()))
    );
  }

  function starteFragebogen(frageId, ausUebersicht) {
    const seiten = sichtbareSeiten();
    zustand.seite = frageId ? seiteVon(frageId) : seiten[0];
    zustand.ausUebersicht = !!ausUebersicht;
    zustand.fehlend = [];
    zustand.meldung = null;
    zeigeSeite();
  }

  // ------------------------------------------------------------------ Fragetexte darstellen

  // Text mit fett gesetzten Zeitangaben ("in den letzten 3 Monaten"), Wortlaut unverändert
  function mitZeitangaben(text) {
    const teile = text.split(A.ZEITANGABE);
    return teile.map((t, i) => (i % 2 ? el("strong", { text: t }) : t));
  }

  // Fragetext, bei langen Fragen als Liste oder in Absätzen (siehe darstellung.js). Gibt [Haupttext, Zusatz] zurück.
  function frageText(f) {
    const g = A.GLIEDERUNG[f.id];
    if (!g) return [mitZeitangaben(f.text), null];
    const haupt = [];
    const zusatz = [];
    let ul = null;
    for (const [t, art] of g) {
      if (art === "punkt") {
        if (!ul) {
          ul = el("ul", { klasse: "frage-liste" });
          haupt.push(ul);
        }
        ul.append(el("li", {}, mitZeitangaben(t.replace(/,\s*$/, ""))));
        continue;
      }
      ul = null;
      if (art === "text") haupt.push(...mitZeitangaben(t));
      else if (art === "fett") haupt.push(el("strong", { text: t }));
      else if (art === "absatz") haupt.push(el("span", { klasse: "frage-absatz" }, mitZeitangaben(t)));
      else if (art === "hinweis") zusatz.push(el("p", { klasse: "frage-hinweis", text: t.trim() }));
    }
    return [haupt, zusatz.length ? zusatz : null];
  }

  // ------------------------------------------------------------------ Fragebogen: ein Bildschirm mit einer oder mehreren Fragen

  function zeigeSeite(behalten, fokusId) {
    zustand.ansicht = "frage";
    const seite = A.SEITEN[zustand.seite];
    const seiten = sichtbareSeiten();
    const pos = seiten.indexOf(zustand.seite);
    const ersteFrage = FRAGEN[seite.fragen[0]];
    const teil = ersteFrage.schritt;
    const imTeil = seiten.filter((i) => FRAGEN[A.SEITEN[i].fragen[0]].schritt === teil);
    const anteil = Math.round(((teil + (imTeil.indexOf(zustand.seite) + 1) / imTeil.length) / fb.schritte.length) * 100);
    const balken = el("span");
    balken.style.width = anteil + "%";
    const kopf = el(
      "div",
      { klasse: "fortschritt" },
      el("p", { klasse: "fortschritt-text", text: `Teil ${teil + 1} von ${fb.schritte.length}: ${A.TEILE[teil]}` }),
      el("div", {
        klasse: "fortschritt-balken",
        role: "progressbar",
        "aria-valuemin": "0",
        "aria-valuemax": "100",
        "aria-valuenow": String(anteil),
        "aria-valuetext": `Teil ${teil + 1} von ${fb.schritte.length}`,
        "aria-label": "Fortschritt",
      }, balken)
    );

    const karten = [];
    let letzteRegion = null;
    for (const id of seite.fragen) {
      const f = FRAGEN[id];
      if (!frageSichtbar(f)) continue;
      if (seite.nachRegion) {
        const r = f.nur_wenn && f.nur_wenn.enthaelt;
        if (r !== letzteRegion) karten.push(el("h2", { klasse: "region-titel", text: regionName(r) }));
        letzteRegion = r;
      }
      karten.push(frageKarte(f));
    }

    const meldung = zustand.meldung ? el("p", { klasse: "meldung", role: "alert", id: "meldung", text: zustand.meldung }) : null;
    const leiste = el(
      "div",
      { klasse: "aktionsleiste" },
      el(
        "div",
        { klasse: "aktionsleiste-innen" },
        pos > 0 ? knopf("Zurück", zurueck, "knopf-zweit", { id: "zurueck" }) : knopf("Zur Übersicht", zeigeStart, "knopf-zweit", { id: "zurueck" }),
        zustand.ausUebersicht ? knopf("Fertig", zeigeUebersicht, "knopf-zweit", { id: "fertig" }) : null,
        knopf("Weiter", weiter, "", { id: "weiter" })
      )
    );
    const teile = [kopf, el("h1", { klasse: "seiten-titel", "data-seite": String(zustand.seite), text: seite.titel }), meldung, ...karten, leiste];
    if (behalten) {
      const y = window.scrollY;
      koerperKlasse();
      document.getElementById("inhalt").replaceChildren(...teile.filter(Boolean));
      window.scrollTo(0, y);
      const ziel = fokusId && document.getElementById(fokusId);
      if (ziel) ziel.focus({ preventScroll: true });
    } else {
      zeigen(...teile);
    }
  }

  function frageKarte(f) {
    const [haupt, zusatz] = frageText(f);
    const fehlt = zustand.fehlend.includes(f.id);
    const hinweis = A.HINWEISE[f.id];
    const istFolge = f.nur_wenn && "wert" in f.nur_wenn || (f.nur_wenn && "werte" in f.nur_wenn);
    return el(
      "fieldset",
      {
        klasse: "frage-karte" + (fehlt ? " fehlt" : "") + (istFolge ? " folgefrage" : "") + (hinweis ? " besonders" : ""),
        "data-frage": f.id,
        id: "karte-" + f.id,
        "aria-invalid": fehlt ? "true" : null,
        "aria-describedby": fehlt ? "fehlt-" + f.id : null,
      },
      el("legend", { klasse: "frage-text", id: "frage-" + f.id }, haupt),
      zusatz,
      hinweis ? el("p", { klasse: "frage-achtung", text: hinweis }) : null,
      eingabe(f),
      fehlt ? el("p", { klasse: "fehlt-text", id: "fehlt-" + f.id, text: fehltText(f) }) : null
    );
  }

  function fehltText(f) {
    if (f.typ === "zahl") return `Bitte gib ein Jahr mit vier Ziffern ein, zwischen ${f.min} und ${Math.min(f.max, zustand.jahr)}.`;
    if (f.typ === "text") return "Bitte trag hier etwas ein.";
    if (["region_karte", "region_teilauswahl", "ziele"].includes(f.typ)) return "Bitte wähle mindestens eins aus.";
    return "Bitte wähle eine Antwort.";
  }

  // Nach einer Antwort: Seite an Ort und Stelle neu zeichnen (Folgefragen erscheinen) und sanft zur nächsten offenen Frage
  function nachAntwort(f, fokusId) {
    zustand.fehlend = zustand.fehlend.filter((x) => x !== f.id);
    if (!zustand.fehlend.length) zustand.meldung = null;
    zeigeSeite(true, fokusId);
    if (["ja_nein", "ja_nein_wn", "auswahl", "skala"].includes(f.typ)) zeigeNaechsteOffene(f.id);
  }

  function zeigeNaechsteOffene(nachId) {
    const karten = [...document.querySelectorAll(".frage-karte")];
    const i = karten.findIndex((k) => k.dataset.frage === nachId);
    const naechste = karten.slice(i + 1).find((k) => !(k.dataset.frage in zustand.antworten));
    const ziel = naechste || document.getElementById("weiter");
    if (!ziel) return;
    const leiste = document.querySelector(".aktionsleiste");
    const unten = window.innerHeight - (leiste ? leiste.offsetHeight : 0);
    const r = ziel.getBoundingClientRect();
    if (r.bottom > unten || r.top < 0) {
      window.scrollBy({ top: r.top - Math.max(16, (unten - r.height) / 3), behavior: wenigBewegung ? "auto" : "smooth" });
    }
  }

  function wahlId(f, wert) {
    return `w-${f.id}-${String(wert).replace(/[^A-Za-z0-9_-]/g, "_")}`;
  }

  // Einzelwahl als echte Optionsfelder (Pfeiltasten, Screenreader), sichtbar als große Knöpfe
  function einzelwahl(f, optionen, klasse) {
    const aktuell = zustand.antworten[f.id];
    return el(
      "div",
      { klasse: "wahl " + (klasse || "") },
      optionen.map((o) => {
        const id = wahlId(f, o.wert);
        const input = el("input", { type: "radio", name: f.id, id, value: String(o.wert), checked: aktuell === o.wert });
        input.addEventListener("change", () => {
          zustand.antworten[f.id] = o.wert;
          nachAntwort(f, id);
        });
        return el("label", { klasse: "wahl-knopf" + (o.leise ? " wahl-leise" : ""), for: id, "data-wert": String(o.wert) }, input, el("span", { text: o.text }));
      })
    );
  }

  // Mehrfachwahl als Kontrollkästchen. "Nichts davon" schließt alles andere aus, max begrenzt die Anzahl.
  function mehrfachwahl(f, optionen, maxWahl, klasse) {
    const aktuell = Array.isArray(zustand.antworten[f.id]) ? zustand.antworten[f.id] : [];
    const anzahl = aktuell.filter((x) => x !== NICHTS).length;
    return el(
      "div",
      { klasse: "wahl wahl-spalten " + (klasse || "") },
      optionen.map((o) => {
        const id = wahlId(f, o.wert);
        const gewaehlt = aktuell.includes(o.wert);
        const gesperrt = maxWahl && !gewaehlt && !o.exklusiv && anzahl >= maxWahl;
        const input = el("input", { type: "checkbox", id, value: String(o.wert), checked: gewaehlt, disabled: gesperrt });
        input.addEventListener("change", () => {
          let liste = [...aktuell];
          if (o.exklusiv) liste = gewaehlt ? [] : [o.wert];
          else {
            liste = liste.filter((x) => x !== NICHTS);
            if (gewaehlt) liste = liste.filter((x) => x !== o.wert);
            else if (!maxWahl || liste.length < maxWahl) liste.push(o.wert);
          }
          zustand.antworten[f.id] = liste;
          nachAntwort(f, id);
        });
        return el(
          "label",
          { klasse: "wahl-knopf mehrfach" + (o.exklusiv ? " wahl-exklusiv" : "") + (gesperrt ? " ist-gesperrt" : ""), for: id, "data-wert": String(o.wert) },
          input,
          el("span", { text: o.text })
        );
      })
    );
  }

  function textfeld(f, art) {
    const a = zustand.antworten[f.id];
    const id = "eingabe-" + f.id;
    const typen = {
      K3: { type: "email", inputmode: "email" },
      K4: { type: "tel", inputmode: "tel" },
    };
    const attrs = art === "zahl" ? { type: "text", inputmode: "numeric", maxlength: "4" } : typen[f.id] || { type: "text" };
    const input = el("input", {
      klasse: "eingabe",
      id,
      ...attrs,
      autocomplete: "off",
      "aria-labelledby": "frage-" + f.id,
      "aria-invalid": zustand.fehlend.includes(f.id) ? "true" : null,
      value: a === undefined ? "" : String(a),
    });
    input.addEventListener("input", () => {
      const t = input.value;
      if (art === "zahl") {
        zustand.antworten[f.id] = /^\d{4}$/.test(t.trim()) ? Number(t.trim()) : t;
      } else {
        zustand.antworten[f.id] = t;
      }
    });
    input.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") weiter();
    });
    const tipp = art === "zahl"
      ? "Vier Ziffern, zum Beispiel 1948."
      : f.pflicht ? "Für den Piloten reicht etwas Ausgedachtes." : "Freiwillig. Für den Piloten reicht etwas Ausgedachtes.";
    return el("div", {}, input, el("p", { klasse: "feld-hinweis leise", text: tipp }));
  }

  function eingabe(f) {
    switch (f.typ) {
      case "ja_nein":
        return einzelwahl(f, ANTWORT_JN, "wahl-reihe");
      case "ja_nein_wn":
        return einzelwahl(f, [...ANTWORT_JN, ANTWORT_WN], "wahl-reihe");
      case "auswahl":
        return einzelwahl(f, f.optionen.map((o) => ({ wert: o.wert, text: o.text, leise: o.wert === "wn" || o.wert === "weiss_nicht" })));
      case "skala": {
        const optionen = [];
        for (let i = f.min; i <= f.max; i++) optionen.push({ wert: i, text: String(i) });
        return el(
          "div",
          {},
          einzelwahl(f, optionen, "skala"),
          el("div", { klasse: "skala-enden leise", "aria-hidden": "true" }, el("span", { text: "keine" }), el("span", { text: "sehr groß" }))
        );
      }
      case "mehrfach":
        return el("div", {}, el("p", { klasse: "feld-hinweis leise", text: "Mehreres ist möglich. Trifft nichts zu, lass alles frei." }), mehrfachwahl(f, f.optionen));
      case "region_karte": {
        const optionen = Object.entries(stufen.regionen).map(([wert, text]) => ({ wert, text }));
        optionen.push({ wert: NICHTS, text: "Nichts davon", exklusiv: true });
        return mehrfachwahl(f, optionen);
      }
      case "region_teilauswahl": {
        const quelle = (zustand.antworten[f.teilmenge_von] || []).filter((x) => x !== NICHTS);
        const optionen = quelle.map((r) => ({ wert: r, text: regionName(r) }));
        optionen.push({ wert: NICHTS, text: "Keine Schmerzen", exklusiv: true });
        return mehrfachwahl(f, optionen, f.max || 3);
      }
      case "ziele": {
        const optionen = L.zielKandidaten(fb, bereinigt(zustand.antworten)).map((k) => ({ wert: k, text: grossAnfang(fb.ziele[k].text) }));
        return mehrfachwahl(f, optionen, 2);
      }
      case "zahl":
        return textfeld(f, "zahl");
      case "text":
        return textfeld(f, "text");
      default:
        return el("p", { text: `Unbekannter Fragetyp ${f.typ}` });
    }
  }

  // Prüft eine Frage. Gibt true zurück, wenn sie in Ordnung ist. Leere freiwillige Antworten werden entfernt.
  function frageInOrdnung(f) {
    const a = zustand.antworten[f.id];
    if (f.typ === "mehrfach") {
      if (a === undefined) zustand.antworten[f.id] = [];
      return true;
    }
    const leer = a === undefined || (typeof a === "string" && !a.trim()) || (Array.isArray(a) && !a.length);
    if (leer) {
      if (!f.pflicht) {
        delete zustand.antworten[f.id];
        return true;
      }
      return false;
    }
    if (f.typ === "zahl") return typeof a === "number" && a >= f.min && a <= Math.min(f.max, zustand.jahr);
    return true;
  }

  function weiter() {
    if (performance.now() - zustand.gezeigtUm < TIPP_SPERRE_MS) return; // Doppeltipp vom vorigen Bildschirm
    const seite = A.SEITEN[zustand.seite];
    const sichtbar = seite.fragen.map((id) => FRAGEN[id]).filter(frageSichtbar);
    zustand.fehlend = sichtbar.filter((f) => !frageInOrdnung(f)).map((f) => f.id);
    if (zustand.fehlend.length) {
      zustand.meldung = zustand.fehlend.length === 1 ? "Hier fehlt noch eine Antwort." : `Hier fehlen noch ${zustand.fehlend.length} Antworten.`;
      zeigeSeite(true);
      const erste = document.getElementById("karte-" + zustand.fehlend[0]);
      if (erste) {
        erste.scrollIntoView({ block: "center", behavior: wenigBewegung ? "auto" : "smooth" });
        const feld = erste.querySelector("input:not([disabled])");
        if (feld) feld.focus({ preventScroll: true });
      }
      return;
    }
    zustand.meldung = null;
    // Ohne Einwilligung geht es nicht weiter: erst nachfragen, dann beenden
    const ohne = ["W1", "W2"].find((id) => seite.fragen.includes(id) && zustand.antworten[id] === "nein");
    if (ohne) {
      zeigeBestaetigung(
        "Ohne Zustimmung geht es nicht weiter",
        "Du hast bei einer Zustimmung „Nein“ gewählt. Dann kann der Fragebogen nicht ausgewertet werden.",
        "Antwort ändern",
        () => zeigeSeite(),
        "Fragebogen beenden",
        zeigeErgebnis
      );
      return;
    }
    const seiten = sichtbareSeiten();
    const pos = seiten.indexOf(zustand.seite);
    if (pos + 1 < seiten.length && !zustand.ausUebersicht) {
      zustand.seite = seiten[pos + 1];
      zeigeSeite();
    } else if (pos + 1 < seiten.length && zustand.ausUebersicht) {
      // Beim Ändern aus der Übersicht: neue Folgeseiten (zum Beispiel nach einer neuen Region) noch zeigen
      const offen = seiten.slice(pos + 1).find((i) => A.SEITEN[i].fragen.some((id) => frageSichtbar(FRAGEN[id]) && FRAGEN[id].pflicht && !(id in zustand.antworten)));
      if (offen !== undefined) {
        zustand.seite = offen;
        zeigeSeite();
      } else {
        zeigeUebersicht();
      }
    } else {
      zeigeUebersicht();
    }
  }

  function zurueck() {
    const seiten = sichtbareSeiten();
    const pos = seiten.indexOf(zustand.seite);
    zustand.meldung = null;
    zustand.fehlend = [];
    if (pos > 0) {
      zustand.seite = seiten[pos - 1];
      zeigeSeite();
    } else {
      zeigeStart();
    }
  }

  // ------------------------------------------------------------------ Rückfrage (statt sofort zu löschen oder zu beenden)

  function zeigeBestaetigung(titel, text, neinText, neinFn, jaText, jaFn) {
    zustand.ansicht = "bestaetigung";
    zeigen(
      el("h1", { text: titel }),
      el("p", { klasse: "karte", text }),
      el(
        "div",
        { klasse: "knopfreihe" },
        knopf(neinText, neinFn, "", { id: "bestaetigung-nein" }),
        knopf(jaText, jaFn, "knopf-zweit knopf-gefahr", { id: "bestaetigung-ja" })
      )
    );
  }

  // ------------------------------------------------------------------ Übersicht der Antworten

  function antwortText(f, a) {
    if (a === undefined) return "noch offen";
    if (f.typ === "ja_nein" || f.typ === "ja_nein_wn") return { ja: "Ja", nein: "Nein", wn: "Weiß nicht" }[a] || a;
    if (f.typ === "auswahl") return (f.optionen.find((o) => o.wert === a) || {}).text || a;
    if (f.typ === "skala" || f.typ === "zahl") return String(a);
    if (f.typ === "text") return a.trim() ? a : "leer";
    if (Array.isArray(a)) {
      if (!a.length) return "nichts davon";
      return a.map((x) => {
        if (x === NICHTS) return f.typ === "region_teilauswahl" ? "Keine Schmerzen" : "Nichts davon";
        if (f.typ === "ziele") return grossAnfang(fb.ziele[x] ? fb.ziele[x].text : x);
        if (f.typ === "mehrfach") return (f.optionen.find((o) => o.wert === x) || {}).text || x;
        return regionName(x);
      }).join(", ");
    }
    return String(a);
  }

  function zeigeUebersicht() {
    zustand.ansicht = "uebersicht";
    zustand.ausUebersicht = false;
    const a = bereinigt(zustand.antworten);
    const teile = [
      el("h1", { text: "Bitte kurz prüfen" }),
      el("p", { text: "Hier stehen alle deine Antworten. Stimmt etwas nicht, tippe auf „Ändern“." }),
      el("div", { klasse: "knopfreihe" }, knopf("Alles richtig, auswerten", zeigeErgebnis, "", { id: "auswerten-oben" })),
    ];
    for (const i of sichtbareSeiten()) {
      const seite = A.SEITEN[i];
      const zeilen = seite.fragen
        .map((id) => FRAGEN[id])
        .filter((f) => L.istSichtbar(f, a, fb))
        .map((f) =>
          el(
            "div",
            { klasse: "uebersicht-zeile" + (f.id in a ? "" : " offen") },
            el("dt", { text: f.text }),
            el("dd", { text: antwortText(f, a[f.id]) })
          )
        );
      teile.push(
        el(
          "section",
          { klasse: "karte uebersicht-block" },
          el(
            "div",
            { klasse: "uebersicht-kopf" },
            el("h2", { text: seite.titel }),
            knopf("Ändern", () => starteFragebogen(seite.fragen[0], true), "knopf-leise", { "aria-label": `${seite.titel} ändern` })
          ),
          el("dl", {}, zeilen)
        )
      );
    }
    teile.push(el("div", { klasse: "knopfreihe" }, knopf("Alles richtig, auswerten", zeigeErgebnis, "", { id: "auswerten" })));
    zeigen(...teile);
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
    const a = zustand.antworten;

    if (r.status === "keine_einwilligung") {
      teile.push(ampelKarte("grau", "Ohne Zustimmung geht es nicht weiter.", "Ohne Zustimmung werden keine Angaben ausgewertet.", "■"));
    } else if (r.status === "unvollstaendig") {
      teile.push(ampelKarte("grau", "Es fehlen noch Antworten.", "Ohne alle nötigen Antworten gibt es keine Ampel.", "?"));
      teile.push(el("div", { klasse: "knopfreihe" }, knopf("Zur ersten offenen Frage", () => starteFragebogen(r.fehlende_fragen[0]))));
    } else if (r.status === "fehler") {
      teile.push(ampelKarte("grau", "Die Antworten passen nicht zusammen.", r.meldung, "!"));
    } else {
      // Notfallhinweis zuerst, vor allem anderen
      if (r.notfallhinweis) teile.push(el("div", { klasse: "notfall", role: "alert" }, r.notfallhinweis));
      const t = AMPEL_TEXT[r.ampel];
      teile.push(ampelKarte(r.ampel, `${t.wort}: ${t.kurz}`, t.lang, t.zeichen));
      if (r.ampel === "gelb" || r.ampel === "orange") {
        const namen = r.zustaende.map(zustandName);
        if (namen.length) {
          teile.push(el("section", { klasse: "karte" }, el("h2", { text: "Darauf wird Rücksicht genommen" }), el("ul", {}, namen.map((n) => el("li", { text: n })))));
        }
      }
      if (r.ampel === "gruen" || r.ampel === "gelb") {
        teile.push(el("div", { klasse: "knopfreihe" }, knopf("Plan ansehen", zeigePlan)));
      } else if (r.ampel === "orange") {
        teile.push(soGehtEsWeiter(r, a));
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
        knopf("Antworten ansehen oder ändern", zeigeUebersicht, "knopf-zweit"),
        knopf("Zum Anfang", zeigeStart, "knopf-zweit")
      )
    );
    zeigen(...teile);
  }

  // Orange: Wer ruft an, worüber, und fehlt die Telefonnummer?
  function soGehtEsWeiter(r, a) {
    const fuerJemand = a.W3 === "jemand_anderes";
    const telefon = typeof a.K4 === "string" && a.K4.trim();
    const gruende = r.orange.map((o) => o.grund);
    return el(
      "section",
      { klasse: "karte" },
      el("h2", { text: "So geht es weiter" }),
      el("p", { text: fuerJemand ? "Lando ruft dich an, nicht die Person, für die du ausfüllst." : "Lando ruft dich an." }),
      telefon
        ? el("p", { text: `Unter der Nummer, die du angegeben hast: ${a.K4.trim()}` })
        : el(
            "div",
            { klasse: "hinweis-box" },
            el("p", { text: "Du hast keine Telefonnummer angegeben. Für den Rückruf braucht Lando eine." }),
            knopf("Telefonnummer eintragen", () => starteFragebogen("K4", true), "knopf-zweit")
          ),
      el("p", { text: "Darüber möchte Lando sprechen:" }),
      el("ul", {}, gruende.map((g) => el("li", { text: g }))),
      el("p", { klasse: "leise", text: "Im Piloten endet der Ablauf hier. Erst nach dem Gespräch entsteht ein Plan." })
    );
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
      el("summary", { text: "Nur für Lando und die Fachperson: so kam die Ampel zustande" }),
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
    if (!L.hatWiederholungen(b)) return "Keine Zählung, die Übung wird gehalten.";
    if (e.wiederholungen_pro_satz) {
      const herkunft = {
        niveau: `Startwert aus dem Niveau ${plan.niveau}`,
        hand: "von Hand festgelegt",
        baustein: "Standard der Übung",
      }[plan.wiederholungen_quelle];
      return `${e.wiederholungen_pro_satz} Mal je Durchgang (${herkunft})`;
    }
    const seg = [...L.segmente(b)].map((x) => x[2]).find((s) => s.typ === "wiederholungen");
    return `${seg.anzahl} Mal je Durchgang (Standard der Übung)`;
  }

  function entscheidungVon(e) {
    return e.ersetzt ? "ersetzt" : e.entscheidung;
  }

  function planKarte(plan, e, imPlan) {
    const ent = ENTSCHEIDUNG[entscheidungVon(e)] || { text: e.entscheidung, klasse: "", erklaerung: "" };
    const wegen = [...new Set(e.treffer.map((t) => zustandName(t.zustand)))];
    const daten = [];
    if (imPlan) {
      daten.push(el("div", {}, el("dt", { text: "Wiederholungen:" }), el("dd", { text: wiederholungsText(plan, e) })));
      daten.push(el("div", {}, el("dt", { text: "Dauer:" }), el("dd", { text: minuten(e.soll_dauer_s) })));
      if (e.uebersprungene_cues.length) {
        daten.push(el("div", {}, el("dt", { text: "Angepasst:" }), el("dd", { text: `${e.uebersprungene_cues.length} Hinweis${e.uebersprungene_cues.length > 1 ? "e fallen" : " fällt"} weg` })));
      }
      if (e.varianten.length) daten.push(el("div", {}, el("dt", { text: "Angepasst:" }), el("dd", { text: "Text in einer anderen Fassung" })));
    }
    if (wegen.length) daten.push(el("div", {}, el("dt", { text: "Wegen:" }), el("dd", { text: wegen.join(", ") })));
    return el(
      "li",
      { klasse: "karte plan-eintrag" + (imPlan ? "" : " ist-gesperrt") },
      el("h3", { text: e.titel }),
      el("p", { klasse: "marken" }, el("span", { klasse: "marke-entscheidung " + ent.klasse, text: ent.text }), " ", ent.erklaerung),
      daten.length ? el("dl", { klasse: "daten" }, daten) : null
    );
  }

  function zeigePlan() {
    stoppePlayer();
    zustand.ansicht = "plan";
    const plan = berechnePlan();
    zustand.plan = plan;
    const gesamt = plan.bausteine.reduce((s, e) => s + e.soll_dauer_s, 0);
    const teile = [el("h1", { text: "Dein Plan (Entwurf)" })];
    if (plan.bausteine.length) {
      teile.push(
        el(
          "section",
          { klasse: "karte plan-kopf" },
          el("p", { klasse: "plan-summe", text: `${plan.bausteine.length} Übungen, zusammen ${minuten(gesamt)}` }),
          knopf("Abspielen", zeigePlayer, "knopf-breit", { id: "abspielen" })
        )
      );
    }
    teile.push(
      el(
        "div",
        { klasse: "hinweis-box" },
        el("p", { text: "Die Auswahl nach Alltag und Niveau ist noch nicht gebaut. Darum stehen hier alle Übungen, die es schon gibt. Alle sind Entwürfe." })
      )
    );
    if (plan.status === "kein_audio") {
      teile.push(el("p", { klasse: "karte", text: "Keine Übung passt. Im echten Ablauf meldet sich Lando." }));
    }
    if (plan.bausteine.length) {
      teile.push(el("h2", { text: `Im Plan (${plan.bausteine.length})` }));
      teile.push(el("ul", { klasse: "plan-liste" }, plan.bausteine.map((e) => planKarte(plan, e, true))));
    }
    if (plan.ausgeschlossen.length) {
      teile.push(el("h2", { text: `Nicht im Plan (${plan.ausgeschlossen.length})` }));
      teile.push(el("ul", { klasse: "plan-liste" }, plan.ausgeschlossen.map((e) => planKarte(plan, e, false))));
    }
    teile.push(
      el(
        "details",
        { klasse: "hinter" },
        el("summary", { text: "Nur für Lando: offene Punkte und interne Hinweise" }),
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
    // Liest die Stimme vor, sagt ein Screenreader den Text nicht noch einmal an
    const untertitel = el("p", { klasse: "untertitel", id: "untertitel", "aria-live": kannSprechen ? "off" : "polite", text: player.untertitel });
    const zeit = el("p", { klasse: "zeit", id: "zeit" });
    const symbol = (z) => el("span", { klasse: "symbol", "aria-hidden": "true", text: z });
    const spielKnopf = player.laeuft
      ? el("button", { type: "button", klasse: "knopf knopf-spielen", id: "spielen", onclick: anhalten }, symbol("❚❚"), "Pause")
      : el("button", { type: "button", klasse: "knopf knopf-spielen", id: "spielen", onclick: abspielen }, symbol("▶"), player.vergangen || player.s || player.u ? "Weiter abspielen" : "Abspielen");
    const leiste = el(
      "div",
      { klasse: "aktionsleiste player-leiste" },
      el(
        "div",
        { klasse: "aktionsleiste-innen player-knoepfe" },
        spielKnopf,
        el("button", {
          type: "button",
          klasse: "knopf knopf-zweit",
          id: "vorige",
          disabled: player.u === 0 && !player.zwischenpause,
          onclick: () => {
            springeZuUebung(player.zwischenpause ? player.u - 1 : Math.max(0, player.u - 1), false);
            zeichnePlayer();
          },
        }, symbol("⏮"), "Vorige"),
        el("button", {
          type: "button",
          klasse: "knopf knopf-zweit",
          id: "wiederholen",
          onclick: () => {
            springeZuUebung(player.u, false);
            if (!player.laeuft) zeichnePlayer();
          },
        }, symbol("↺"), "Nochmal"),
        el("button", {
          type: "button",
          klasse: "knopf knopf-zweit",
          id: "naechste",
          disabled: player.u + 1 >= player.uebungen.length && !player.zwischenpause,
          onclick: () => {
            springeZuUebung(player.zwischenpause ? player.u : player.u + 1, false);
            zeichnePlayer();
          },
        }, symbol("⏭"), "Nächste")
      )
    );
    const aktiv = document.activeElement;
    const fokusId = aktiv && ["spielen", "vorige", "wiederholen", "naechste"].includes(aktiv.id) ? aktiv.id : null;
    player.gezeichnet = playerSchluessel();
    const teile = [kopf, hinweis, untertitel, zeit, el("div", { klasse: "knopfreihe" }, knopf("Zurück zum Plan", zeigePlan, "knopf-zweit")), leiste];
    if (ersterAufruf) zeigen(...teile);
    else {
      koerperKlasse();
      document.getElementById("inhalt").replaceChildren(...teile.filter(Boolean));
    }
    const fokusZiel = fokusId && document.getElementById(fokusId);
    if (fokusZiel && !fokusZiel.disabled) fokusZiel.focus({ preventScroll: true });
    else if (fokusId) document.getElementById("spielen").focus({ preventScroll: true });
    aktualisiereAnzeige();
  }

  // ------------------------------------------------------------------ Pilot-Menü: Beispiele und Löschen

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
        allesLoeschen();
        return;
      }
      stoppePlayer();
      zustand.antworten = JSON.parse(JSON.stringify(p.antworten));
      zustand.jahr = p.jahr;
      zustand.beispiel = p.id;
      document.getElementById("pilot-menue").open = false;
      zeigeErgebnis();
    });
  }

  function allesLoeschen() {
    stoppePlayer();
    zustand.antworten = {};
    zustand.ergebnis = null;
    zustand.plan = null;
    zustand.beispiel = null;
    zustand.meldung = null;
    zustand.fehlend = [];
    zustand.jahr = new Date().getFullYear();
    document.getElementById("beispiel").value = "";
    document.getElementById("pilot-menue").open = false;
    zeigeStart();
  }

  // Erst nachfragen, dann löschen. Nein führt zurück zur vorigen Ansicht.
  function loeschenFragen() {
    const zurueckZu = {
      frage: () => zeigeSeite(),
      uebersicht: zeigeUebersicht,
      ergebnis: zeigeErgebnis,
      plan: zeigePlan,
      player: zeigePlan,
    }[zustand.ansicht] || zeigeStart;
    stoppePlayer();
    document.getElementById("pilot-menue").open = false;
    zeigeBestaetigung(
      "Wirklich alle Antworten löschen?",
      "Alle Antworten werden gelöscht. Das lässt sich nicht rückgängig machen.",
      "Nein, zurück",
      zurueckZu,
      "Ja, alles löschen",
      allesLoeschen
    );
  }

  document.getElementById("loeschen").addEventListener("click", loeschenFragen);
  if (kannSprechen && window.speechSynthesis.addEventListener) {
    window.speechSynthesis.addEventListener("voiceschanged", () => { player.stimme = waehleStimme(); });
  }
  // Warnen, bevor das Fenster geschlossen oder neu geladen wird und Antworten verloren gehen
  window.addEventListener("beforeunload", (ev) => {
    if (Object.keys(zustand.antworten).length && !zustand.beispiel) {
      ev.preventDefault();
      ev.returnValue = "";
    }
  });
  fuelleBeispiele();
  zeigeStart();
})();
