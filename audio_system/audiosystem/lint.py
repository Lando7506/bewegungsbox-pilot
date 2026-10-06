"""Prüfung der Baustein Dateien: Struktur, Zeiten, Sicherheitssätze und Wortwahl.

Befunde haben drei Stufen: FEHLER (muss behoben werden), WARNUNG (bitte ansehen), HINWEIS (nur Info).
"""
from __future__ import annotations

import re

from .clips import clip_manifest, tempo
from .common import (
    ALLE_TYPEN, STATUS_ERLAUBT, WIEDERHOLUNGS_MODI, ZAHLWOERTER, block_cues, ist_block,
    lade_einstellungen, norm_text, segmente, sollsumme, wortzahl,
)

FEHLER, WARNUNG, HINWEIS = "FEHLER", "WARNUNG", "HINWEIS"
PFLICHTFELDER = (
    "id", "version", "status", "titel", "position", "teile", "stufen_zuordnung",
    "soll_gesamtdauer_s", "toleranz_prozent", "haltezeit_gesamt_s", "sprechtempo_woerter_pro_sekunde",
    "belastet_regionen",
)


def _b(stufe, code, text, ort=""):
    return {"stufe": stufe, "code": code, "text": text, "ort": ort}


def _gesprochene_texte(baustein: dict):
    """Alle Texte, die Lando vorliest, mit Ortsangabe und Teil."""
    for teil, i, seg in segmente(baustein):
        if seg["typ"] == "sprechen":
            yield teil, i, f"{teil['id']} Satz {i}", seg["text"]
            for v in seg.get("varianten", []):
                yield teil, i, f"{teil['id']} Satz {i} Variante {v['bei_zustand']}", v["text"]
        elif ist_block(seg):
            for c in block_cues(seg):
                yield teil, i, f"{teil['id']} Cue bei {c['bei_s']} s", c["text"]
                for v in c.get("varianten", []):
                    yield teil, i, f"{teil['id']} Cue bei {c['bei_s']} s Variante {v['bei_zustand']}", v["text"]


def _pruefe_wiederholungen(seg: dict, ort: str) -> list[dict]:
    """Zählen oder Wortsignal: Angaben vollständig, im Takt und innerhalb der Dauer."""
    b: list[dict] = []
    modus, anzahl, takt, start = seg.get("modus"), seg.get("anzahl"), seg.get("takt_s"), seg.get("start_s", 0)
    if modus not in WIEDERHOLUNGS_MODI:
        return [_b(FEHLER, "wdh_modus", f"modus muss {' oder '.join(WIEDERHOLUNGS_MODI)} sein", ort)]
    if not isinstance(anzahl, int) or isinstance(anzahl, bool) or anzahl < 1:
        return [_b(FEHLER, "wdh_anzahl", "anzahl muss eine ganze Zahl ab 1 sein", ort)]
    if not isinstance(takt, (int, float)) or takt <= 0:
        return [_b(FEHLER, "wdh_takt", "takt_s muss eine positive Zahl sein", ort)]
    if takt != int(takt) or start != int(start):
        b.append(_b(FEHLER, "wdh_ganze_sekunden", "takt_s und start_s müssen ganze Sekunden sein (Clip Nummern)", ort))
    if modus == "zaehlen":
        if anzahl > len(ZAHLWOERTER):
            return b + [_b(FEHLER, "wdh_zaehlen_zu_viel", f"Zählen geht höchstens bis {len(ZAHLWOERTER)} (so weit reicht der gemeinsame Zahlenbaustein)", ort)]
    else:
        if not seg.get("woerter"):
            return b + [_b(FEHLER, "wdh_woerter", "Wortsignal braucht eine Liste 'woerter', zum Beispiel Rauf und Runter", ort)]
        if any(not norm_text(w) for w in seg["woerter"]):
            b.append(_b(FEHLER, "wdh_woerter", "Ein Signalwort ist leer", ort))
    schritte = anzahl if modus == "zaehlen" else anzahl * len(seg.get("woerter") or [1])
    letzter = start + (schritte - 1) * takt
    if letzter + 1.0 > seg["soll_dauer_s"]:
        b.append(_b(FEHLER, "wdh_zu_kurz",
                    f"Der letzte Hinweis kommt bei {letzter:g} s, der Block dauert nur {seg['soll_dauer_s']:g} s. Mindestens eine Sekunde danach muss frei sein", ort))
    elif schritte * takt + start < seg["soll_dauer_s"] - takt * 2:
        b.append(_b(WARNUNG, "wdh_viel_leerlauf", "Nach dem letzten Hinweis bleibt mehr als ein doppelter Takt Stille", ort))
    return b


def pruefe_struktur(baustein: dict, stufen: dict, dateiname: str | None = None) -> list[dict]:
    b: list[dict] = []
    for feld in PFLICHTFELDER:
        if feld not in baustein:
            b.append(_b(FEHLER, "feld_fehlt", f"Pflichtfeld '{feld}' fehlt"))
    if any(x["code"] == "feld_fehlt" for x in b):
        return b
    if dateiname and dateiname != baustein["id"]:
        b.append(_b(FEHLER, "id_dateiname", f"Datei heißt {dateiname}, id im Baustein ist {baustein['id']}"))
    if baustein["status"] not in STATUS_ERLAUBT:
        b.append(_b(FEHLER, "status", f"Unbekannter Status '{baustein['status']}'"))
    regionen = baustein["belastet_regionen"]
    if not isinstance(regionen, list) or not regionen:
        b.append(_b(FEHLER, "regionen_leer", "belastet_regionen muss eine nicht leere Liste sein"))
    else:
        for r in regionen:
            if r not in stufen.get("regionen", {}):
                b.append(_b(FEHLER, "region_unbekannt", f"Region '{r}' steht nicht in regeln/stufen.json"))

    teil_ids = [t["id"] for t in baustein["teile"]]
    if len(teil_ids) != len(set(teil_ids)):
        b.append(_b(FEHLER, "teil_doppelt", "Teil IDs sind nicht eindeutig"))

    for teil, i, seg in segmente(baustein):
        ort = f"{teil['id']} Segment {i}"
        typ = seg.get("typ")
        if typ not in ALLE_TYPEN:
            b.append(_b(FEHLER, "typ", f"Unbekannter Typ '{typ}'", ort))
            continue
        if not isinstance(seg.get("soll_dauer_s"), (int, float)) or seg["soll_dauer_s"] <= 0:
            b.append(_b(FEHLER, "soll_dauer", "soll_dauer_s fehlt oder ist nicht positiv", ort))
            continue
        if typ == "sprechen" and not norm_text(seg.get("text", "")):
            b.append(_b(FEHLER, "text_leer", "Leerer Sprechtext", ort))
        if typ == "halten":
            if seg["soll_dauer_s"] != baustein["haltezeit_gesamt_s"]:
                b.append(_b(WARNUNG, "haltezeit", f"Haltezeit {seg['soll_dauer_s']} s weicht von haltezeit_gesamt_s ab", ort))
        if typ == "wiederholungen":
            b.extend(_pruefe_wiederholungen(seg, ort))
        if ist_block(seg):
            cues = block_cues(seg)
            zeiten = [c["bei_s"] for c in cues]
            if len(zeiten) != len(set(zeiten)):
                b.append(_b(FEHLER, "cue_doppelt", "Zwei Cues liegen auf demselben Zeitpunkt", ort))
            for c in cues:
                if not (0 <= c["bei_s"] < seg["soll_dauer_s"]):
                    b.append(_b(FEHLER, "cue_ausserhalb", f"Cue bei {c['bei_s']} s liegt außerhalb des Zeitblocks", ort))
                if not norm_text(c.get("text", "")):
                    b.append(_b(FEHLER, "cue_leer", f"Cue bei {c['bei_s']} s hat keinen Text", ort))
                for z in c.get("ausschluss_bei", []) + c.get("nur_bei", []):
                    if z not in stufen["zustaende"]:
                        b.append(_b(FEHLER, "zustand_unbekannt", f"Cue Zustand '{z}' steht nicht in stufen.json", ort))

    soll = sollsumme(baustein)
    if abs(soll - baustein["soll_gesamtdauer_s"]) > 0.05:
        b.append(_b(FEHLER, "gesamtdauer", f"soll_gesamtdauer_s ist {baustein['soll_gesamtdauer_s']}, die Summe der Segmente ist {soll}"))

    gesehen = set()
    for e in baustein["stufen_zuordnung"]:
        z = e["zustand"]
        if z in gesehen:
            b.append(_b(FEHLER, "zustand_doppelt", f"Zustand '{z}' ist doppelt eingetragen"))
        gesehen.add(z)
        if z not in stufen["zustaende"]:
            b.append(_b(FEHLER, "zustand_unbekannt", f"Zustand '{z}' steht nicht in stufen.json"))
            continue
        if e["stufe"] not in (1, 2, 3, 4):
            b.append(_b(FEHLER, "stufe", f"Stufe {e['stufe']} für '{z}' ist ungültig"))
            continue
        g = stufen["zustaende"][z].get("stufe_global")
        if g and e["stufe"] > g:
            b.append(_b(FEHLER, "globale_regel_abgeschwaecht", f"'{z}' ist global Stufe {g}, der Baustein setzt Stufe {e['stufe']}"))
        if e["stufe"] == 3:
            hat_variante = any(
                v["bei_zustand"] == z
                for _, _, seg in segmente(baustein)
                for v in (seg.get("varianten", []) + [vv for c in seg.get("cues", []) for vv in c.get("varianten", [])])
            )
            hat_cue_regel = any(
                z in c.get("ausschluss_bei", []) or z in c.get("nur_bei", [])
                for _, _, seg in segmente(baustein) for c in seg.get("cues", [])
            )
            if not hat_variante and not hat_cue_regel:
                b.append(_b(HINWEIS, "stufe3_ohne_anpassung",
                            f"'{z}' ist Stufe 3, aber es gibt weder Variantentext noch Cue Regel. Nur ein Hinweis auf dem Planblatt, Wording fehlt noch."))
    return b


def pruefe_zeiten(baustein: dict, einst: dict | None = None) -> list[dict]:
    """Passt die geschätzte Sprechzeit zu den Sollzeiten, und ist zwischen den Cues genug Platz?"""
    einst = einst or lade_einstellungen()
    wps = tempo(baustein)
    b: list[dict] = []
    for teil, i, seg in segmente(baustein):
        if seg["typ"] == "sprechen":
            est = wortzahl(seg["text"]) / wps
            if abs(est - seg["soll_dauer_s"]) / seg["soll_dauer_s"] > 0.25:
                b.append(_b(WARNUNG, "sprechzeit",
                            f"Geschätzte Sprechzeit {est:.1f} s bei {wps:g} Wörtern pro Sekunde, Soll {seg['soll_dauer_s']} s",
                            f"{teil['id']} Satz {i}"))
    manifest = clip_manifest(baustein, einst)
    for cid, info in manifest["clips"].items():
        if info["typ"] == "cue" and info["max_dauer_s"] is not None:
            est = info["woerter"] / wps
            if est > info["max_dauer_s"]:
                b.append(_b(WARNUNG, "cue_zu_lang",
                            f"Cue '{info['text'][:40]}...' braucht geschätzt {est:.1f} s, bis zum nächsten Cue sind nur {info['max_dauer_s']:g} s frei "
                            "(inklusive Sicherheitsabstand). Kürzer formulieren oder früher platzieren.", cid))
            elif est > 0.9 * info["max_dauer_s"]:
                b.append(_b(WARNUNG, "cue_knapp",
                            f"Cue '{info['text'][:40]}...' braucht geschätzt {est:.1f} s von {info['max_dauer_s']:g} s freiem Platz. "
                            "Schon ein etwas langsameres Sprechen sprengt das Fenster.", cid))
    return b


def pruefe_wording(baustein: dict, stufen: dict) -> list[dict]:
    """Verbotene Werbe und Heilaussagen, Fachbegriffe, lange Sätze und fehlende Sicherheitssätze."""
    lint = stufen.get("lint", {})
    b: list[dict] = []
    muster = [re.compile(m, re.IGNORECASE) for m in lint.get("verbotene_muster", [])]
    fach = [f.lower() for f in lint.get("fachbegriffe", [])]
    max_w = lint.get("max_woerter_pro_satz", 25)

    for teil, i, ort, text in _gesprochene_texte(baustein):
        for m in muster:
            if m.search(text):
                b.append(_b(FEHLER, "verbotenes_wort", f"Heil oder Wirkaussage ('{m.pattern}') im gesprochenen Text: \"{text[:70]}\"", ort))
        for f in fach:
            if f in text.lower():
                b.append(_b(WARNUNG, "fachbegriff", f"Fachbegriff '{f}' im Text, besser mit Körperstelle beschreiben", ort))
        if re.search(r"[–—]| - ", text):
            b.append(_b(HINWEIS, "gedankenstrich", "Gedankenstrich im Vorlesetext, besser ein Satzzeichen oder zwei Sätze", ort))
        if re.search(r"\d", text):
            b.append(_b(HINWEIS, "ziffer", "Ziffer im Vorlesetext, Zahlen als Wort schreiben (neunzig statt 90)", ort))
        for satz in re.split(r"(?<=[.!?])\s+", text):
            if wortzahl(satz) > max_w:
                b.append(_b(WARNUNG, "langer_satz", f"Satz mit {wortzahl(satz)} Wörtern, für Senioren besser kürzer", ort))

    pflicht = [p.lower() for p in lint.get("pflicht_vor_halten", [])]
    for teil in baustein["teile"]:
        gesehen = ""
        for seg in teil["segmente"]:
            if seg["typ"] == "sprechen":
                gesehen += " " + seg["text"].lower()
            elif seg["typ"] in ("halten", "wiederholungen"):
                for p in pflicht:
                    if p not in gesehen:
                        b.append(_b(FEHLER, "pflichtsatz_fehlt",
                                    f"Vor der Haltephase oder den Wiederholungen fehlt ein Satz mit '{p}' (Warnhinweis bei Schmerz)", teil["id"]))
    pos = baustein.get("position")
    for p in lint.get("pflicht_in_einleitung_bei_position", {}).get(pos, []):
        einleitung = " ".join(
            seg["text"].lower() for t in baustein["teile"] if t["id"] == "einleitung"
            for seg in t["segmente"] if seg["typ"] == "sprechen"
        )
        if p.lower() not in einleitung:
            b.append(_b(FEHLER, "pflichtsatz_einleitung", f"Die Einleitung für Position '{pos}' muss '{p}' ansprechen"))
    return b


def pruefe_alles(baustein: dict, stufen: dict, einst: dict | None = None, dateiname: str | None = None) -> list[dict]:
    befunde = pruefe_struktur(baustein, stufen, dateiname)
    if any(x["stufe"] == FEHLER and x["code"] == "feld_fehlt" for x in befunde):
        return befunde
    return befunde + pruefe_zeiten(baustein, einst) + pruefe_wording(baustein, stufen)


def bericht(befunde: list[dict]) -> str:
    if not befunde:
        return "Keine Befunde."
    zeilen = []
    for stufe in (FEHLER, WARNUNG, HINWEIS):
        for x in befunde:
            if x["stufe"] == stufe:
                ort = f" [{x['ort']}]" if x["ort"] else ""
                zeilen.append(f"{stufe:8}{ort} {x['text']}")
    return "\n".join(zeilen)
