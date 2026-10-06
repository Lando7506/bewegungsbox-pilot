"""Fragebogen: aus Antworten werden Zustände, Ampel und Niveau (Regelprüfung P1, ohne KI).

Grundsätze, die hier technisch durchgesetzt werden:
- Unbekannt gilt nie als gesund. Eine Antwort "Weiß nicht" hat bei jeder Frage eine Wirkung, wenn auch ein Ja eine hat.
- Wer eine Körperregion angibt und dessen Problem keine Folgefrage genauer erklärt, bekommt den Zustand region_unklar_<region>.
- Jede Rot Antwort setzt einen Zustand der globalen Stufe 1, und jeder globale Stufe 1 Zustand hat eine Rot Antwort.
- Unvollständige Antworten bekommen keine Ampel.
"""
from __future__ import annotations

import re
from datetime import date

from .common import ROOT, SystemFehler, lade_json
from .regeln import kanonischer_hash

FRAGEBOGEN_FILE = ROOT / "regeln" / "fragebogen.json"
JA_NEIN = ("ja", "nein")
JA_NEIN_WN = ("ja", "nein", "wn")
RANG_AMPEL = {"gruen": 0, "gelb": 1, "orange": 2, "rot": 3}
REGION_NICHTS = "nichts"
# Wörter, die in Fragen an Kunden nicht vorkommen dürfen (Dokument 13: nie "Diagnose", "Sturzrisiko-Test", Heilversprechen).
FRAGE_VERBOTEN = ["schmerzfrei", "schmerzlos", "therapie", r"\bheil(t|en|ung)\b", "rehab", "diagnos", "sturzrisiko", "nie wieder", "garantier", "mit sicherheit"]


def lade_fragebogen(pfad=None) -> dict:
    return lade_json(pfad or FRAGEBOGEN_FILE)


def fragen_nach_id(fb: dict) -> dict[str, dict]:
    return {f["id"]: f for f in fb["fragen"]}


# ------------------------------------------------------------------ Sichtbarkeit und Ziele

def _bedingung_erfuellt(bed: dict, antworten: dict) -> bool:
    a = antworten.get(bed["frage"])
    if bed.get("hat_region"):
        return isinstance(a, list) and any(x != REGION_NICHTS for x in a)
    if "wert" in bed:
        return a == bed["wert"]
    if "werte" in bed:
        return a in bed["werte"]
    if "enthaelt" in bed:
        return isinstance(a, list) and bed["enthaelt"] in a
    raise SystemFehler(f"Unbekannte Bedingung {bed}")


def ziel_kandidaten(fb: dict, antworten: dict) -> list[str]:
    """Mögliche Ziele aus Z1 und Z2 (Kopplung nach Dokument 13)."""
    z1, z2 = antworten.get("Z1") or [], antworten.get("Z2") or []
    kand = []
    for key, z in fb["ziele"].items():
        if z.get("aus_z1") and any(x in z1 for x in z["aus_z1"]):
            kand.append(key)
        elif z.get("wenn_z2_nicht_leer") and z2:
            kand.append(key)
        elif z.get("wenn_z1_und_z2_leer") and not z1 and not z2:
            kand.append(key)
    return kand


def ist_sichtbar(frage: dict, antworten: dict, fb: dict) -> bool:
    if frage["typ"] == "ziele":
        return len(ziel_kandidaten(fb, antworten)) > 1
    bed = frage.get("nur_wenn")
    return True if not bed else _bedingung_erfuellt(bed, antworten)


def sichtbare_fragen(fb: dict, antworten: dict) -> list[dict]:
    return [f for f in fb["fragen"] if ist_sichtbar(f, antworten, fb)]


# ------------------------------------------------------------------ Prüfen der Antworten

def _pruefe_wert(f: dict, wert, fb: dict, antworten: dict, jahr: int):
    """Wirft SystemFehler bei ungültigem Wert. Gibt True zurück, wenn die Antwort als 'leer' gilt."""
    typ, fid = f["typ"], f["id"]

    def fehler(text):
        raise SystemFehler(f"Frage {fid}: {text} (Antwort: {wert!r})")

    if typ in ("ja_nein", "ja_nein_wn"):
        erlaubt = JA_NEIN_WN if typ == "ja_nein_wn" else JA_NEIN
        if wert not in erlaubt:
            fehler("erlaubt sind " + ", ".join(erlaubt))
        return False
    if typ == "auswahl":
        if wert not in [o["wert"] for o in f["optionen"]]:
            fehler("kein gültiger Wert")
        return False
    if typ == "text":
        if not isinstance(wert, str):
            fehler("Text erwartet")
        return not wert.strip()
    if typ == "zahl":
        if isinstance(wert, bool) or not isinstance(wert, int):
            fehler("ganze Zahl erwartet")
        if not (f.get("min", -10**9) <= wert <= min(f.get("max", 10**9), jahr)):
            fehler("Zahl außerhalb des erlaubten Bereichs")
        return False
    if typ == "skala":
        if isinstance(wert, bool) or not isinstance(wert, int) or not (f["min"] <= wert <= f["max"]):
            fehler(f"Zahl von {f['min']} bis {f['max']} erwartet")
        return False
    if typ == "mehrfach":
        erlaubt = [o["wert"] for o in f["optionen"]]
        if not isinstance(wert, list) or any(x not in erlaubt for x in wert) or len(set(wert)) != len(wert):
            fehler("Liste gültiger, nicht doppelter Werte erwartet")
        return False
    if typ == "region_karte":
        erlaubt = list(fb_regionen(fb)) + [REGION_NICHTS]
        if not isinstance(wert, list) or any(x not in erlaubt for x in wert) or len(set(wert)) != len(wert):
            fehler("Liste gültiger, nicht doppelter Regionen erwartet")
        if not wert:
            return True  # leer gilt als nicht beantwortet
        if REGION_NICHTS in wert and len(wert) > 1:
            fehler("'Nichts davon' lässt sich nicht mit einer Region kombinieren")
        return False
    if typ == "region_teilauswahl":
        # Teilmenge der in teilmenge_von gewählten Regionen, höchstens max, oder ausdrücklich "nichts"
        quelle = antworten.get(f["teilmenge_von"]) or []
        erlaubt = [x for x in quelle if x != REGION_NICHTS] + [REGION_NICHTS]
        if not isinstance(wert, list) or any(x not in erlaubt for x in wert) or len(set(wert)) != len(wert):
            fehler(f"Liste aus den in {f['teilmenge_von']} gewählten Bereichen erwartet")
        if REGION_NICHTS in wert and len(wert) > 1:
            fehler("'Keine Schmerzen' lässt sich nicht mit einem Bereich kombinieren")
        if len([x for x in wert if x != REGION_NICHTS]) > f.get("max", 3):
            fehler(f"höchstens {f.get('max', 3)} Bereiche erlaubt")
        return not wert
    if typ == "ziele":
        kand = ziel_kandidaten(fb, antworten)
        if not isinstance(wert, list) or any(x not in kand for x in wert) or len(set(wert)) != len(wert) or len(wert) > 2:
            fehler("bis zu zwei Ziele aus den angezeigten erwartet")
        return not wert
    raise SystemFehler(f"Unbekannter Fragetyp {typ}")


def fb_regionen(fb: dict) -> dict:
    return fb.get("_regionen") or {}


def pruefe_antworten(fb: dict, antworten: dict, jahr: int) -> tuple[list[dict], list[str]]:
    """Gibt (sichtbare Fragen, fehlende Pflicht IDs) zurück. Ungültiges stoppt mit SystemFehler."""
    ids = fragen_nach_id(fb)
    unbekannt = sorted(set(antworten) - set(ids))
    if unbekannt:
        raise SystemFehler("Antworten zu unbekannten Fragen (Tippfehler?): " + ", ".join(unbekannt))
    sichtbar, fehlend = [], []
    for f in fb["fragen"]:
        if not ist_sichtbar(f, antworten, fb):
            if f["id"] in antworten:
                raise SystemFehler(f"Frage {f['id']} wurde beantwortet, wird in diesem Verlauf aber nicht gestellt")
            continue
        sichtbar.append(f)
        if f["id"] not in antworten:
            if f["pflicht"]:
                fehlend.append(f["id"])
            continue
        leer = _pruefe_wert(f, antworten[f["id"]], fb, antworten, jahr)
        if leer and f["pflicht"] and f["typ"] in ("text", "region_karte", "region_teilauswahl", "ziele"):
            fehlend.append(f["id"])
    return sichtbar, fehlend


# ------------------------------------------------------------------ Auswerten

def _niveau(antworten: dict) -> tuple[str, list[str]]:
    c4, c5, c6 = antworten.get("C4"), antworten.get("C5"), antworten.get("C6")
    gruende_a = []
    if c5 == "fremde_hilfe":
        gruende_a.append("C5 nur mit fremder Hilfe")
    if c6 == "rollstuhl":
        gruende_a.append("C6 Rollstuhl")
    if gruende_a:
        return "A", gruende_a
    gruende_b = []
    if c5 == "abstuetzen":
        gruende_b.append("C5 nur mit Abstützen")
    if c6 in ("stock", "rollator"):
        gruende_b.append(f"C6 {c6}")
    if c4 == "oft":
        gruende_b.append("C4 oft unsicher")
    if gruende_b:
        return "B", gruende_b
    return "C", []


def auswerten(antworten: dict, fb: dict, stufen: dict, jahr: int | None = None, profil_id: str = "FB") -> dict:
    """Regelprüfung P1: Ampel, Zustände, vorläufiges Niveau, Ziele. Keine KI.

    Das Ergebnis hat immer einen Status. Nur bei 'ausgewertet' gibt es eine Ampel.
    """
    jahr = jahr or date.today().year
    fb = dict(fb)
    fb["_regionen"] = stufen["regionen"]
    sichtbar, fehlend = pruefe_antworten(fb, antworten, jahr)
    basis = {"antworten_sha": kanonischer_hash(antworten), "fragebogen_version": fb["version"]}

    for fid in ("W1", "W2"):
        if antworten.get(fid) == "nein":
            return {**basis, "status": "keine_einwilligung", "ampel": None, "grund": fb_frage(fb, fid)["wirkung"]["nein"]["stopp"]}
    if fehlend:
        return {**basis, "status": "unvollstaendig", "ampel": None, "fehlende_fragen": fehlend}

    sicher: set[str] = set()
    vorsicht: set[str] = set()
    rot, orange, notfall, strittig = [], [], [], []

    def orange_add(code, quelle):
        orange.append({"code": code, "grund": fb["orange_codes"][code], "quelle": quelle})

    for f in sichtbar:
        wert = antworten.get(f["id"])
        wirk = (f.get("wirkung") or {}).get(wert) if isinstance(wert, str) else None
        if not wirk:
            continue
        sicher.update(wirk.get("zustaende", []))
        vorsicht.update(wirk.get("vorsicht", []))
        if "rot" in wirk:
            rot.append({"frage": f["id"], "antwort": wert, "grund": wirk["rot"], "zustaende": wirk.get("zustaende", [])})
            if wirk.get("strittig"):
                strittig.append(f["id"])
        for code in wirk.get("orange", []):
            orange_add(code, f["id"])
        if wirk.get("notfall"):
            notfall.append(f["id"])

    # Körperregionen: gewählt, aber durch keine Antwort erklärt -> Zustand region_unklar_<region>
    regionen = [r for r in (antworten.get("R0") or []) if r != REGION_NICHTS]
    erklaert: set[str] = set()
    for f in sichtbar:
        if antworten.get(f["id"]) in ("ja", "wn"):
            erklaert.update(f.get("region", []))
    unklar = [r for r in regionen if r not in erklaert]
    for r in unklar:
        sicher.add(f"region_unklar_{r}")

    # Kombinationsregeln für Orange
    gruppen = fb["ampel"]["zaehlgruppen"]
    nur_wn = vorsicht - sicher
    alle = sicher | vorsicht
    gruppe_von = {z: g for g, zs in gruppen.items() for z in zs}
    gruppen_sicher = sorted({gruppe_von[z] for z in sicher if z in gruppe_von})
    if len(gruppen_sicher) >= fb["ampel"]["o4_min_gruppen"]:
        orange_add("O4", "Gruppen: " + ", ".join(gruppen_sicher))
    c4a = antworten.get("C4a")
    if "sturz_unter_12_monate_abgeklaert" in sicher and isinstance(c4a, int) and c4a >= fb["ampel"]["o5_skala_min"]:
        orange_add("O5", f"C4a = {c4a}")
    alter = jahr - antworten["K2"]
    if alter >= fb["ampel"]["o6_alter"] and any(z in gruppe_von for z in sicher):
        orange_add("O6", f"Alter {alter} (laufendes Jahr minus Geburtsjahr)")
    for w in fb["ampel"]["o7_widersprueche"]:
        if all(antworten.get(k) == v for k, v in w["wenn"].items()):
            orange_add("O7", w["text"])

    if rot:
        ampel = "rot"
    elif orange:
        ampel = "orange"
    elif any(z in gruppe_von for z in alle):
        ampel = "gelb"
    else:
        ampel = "gruen"

    niveau, niveau_gruende = _niveau(antworten)
    kand = ziel_kandidaten(fb, antworten)
    ziele = antworten.get("Z3") if len(kand) > 1 else kand
    zustaende = sorted(alle)
    return {
        **basis,
        "status": "ausgewertet",
        "ampel": ampel,
        "rot": rot,
        "orange": orange,
        "strittige_regeln_beteiligt": sorted(set(strittig)),
        "notfallhinweis": fb["notfallhinweis"] if notfall else None,
        "notfall_fragen": notfall,
        "zustaende": zustaende,
        "zustaende_nur_wegen_weiss_nicht": sorted(nur_wn),
        "regionen": regionen,
        "regionen_unklar": unklar,
        "niveau_vorlaeufig": niveau,
        "niveau_gruende": niveau_gruende,
        "ziele": ziele,
        "alter": alter,
        "noch_nicht_geprueft": fb["ampel"]["noch_nicht_geprueft"],
        "profil": {"id": profil_id, "name": "aus Fragebogen", "zustaende": zustaende},
    }


def fb_frage(fb: dict, fid: str) -> dict:
    return fragen_nach_id(fb)[fid]


# ------------------------------------------------------------------ Prüfung der Fragebogen Daten

def pruefe_fragebogen(fb: dict, stufen: dict) -> list[str]:
    """Strukturelle Prüfung der Fragebogen Daten gegen das Regelwerk. Gibt eine Liste von Fehlern zurück."""
    fehler: list[str] = []
    zust = stufen["zustaende"]
    regionen = stufen["regionen"]
    ids = [f["id"] for f in fb["fragen"]]
    if len(ids) != len(set(ids)):
        fehler.append("Frage IDs sind nicht eindeutig")
    gesehen: set[str] = set()
    global_eins = {z for z, d in zust.items() if d.get("stufe_global") == 1}
    rot_zustaende: set[str] = set()
    verboten = [re.compile(p, re.I) for p in FRAGE_VERBOTEN]
    du_wort = re.compile(r"\b(du|dein\w*|dich|dir)\b", re.I)

    for f in fb["fragen"]:
        fid = f["id"]
        bed = f.get("nur_wenn")
        if bed and bed["frage"] not in gesehen:
            fehler.append(f"{fid}: Bedingung verweist auf {bed['frage']}, das nicht früher kommt")
        gesehen_vorher = set(gesehen)
        gesehen.add(fid)
        for r in f.get("region", []):
            if r not in regionen:
                fehler.append(f"{fid}: unbekannte Region {r}")
        if f["typ"] == "region_teilauswahl" and f.get("teilmenge_von") not in gesehen_vorher:
            fehler.append(f"{fid}: teilmenge_von verweist auf {f.get('teilmenge_von')}, das nicht früher kommt")
        if bed and "enthaelt" in bed and bed["enthaelt"] not in regionen:
            fehler.append(f"{fid}: Bedingung nennt unbekannte Region {bed['enthaelt']}")
        if f["bereich"] in fb["gesundheitsbereiche"]:
            if du_wort.search(f["text"]):
                fehler.append(f"{fid}: Gesundheitsfrage spricht mit du, muss neutral sein (Angehörige füllen aus)")
            for p in verboten:
                if p.search(f["text"]):
                    fehler.append(f"{fid}: verbotenes Muster im Fragetext ({p.pattern})")
        werte_erlaubt = {
            "ja_nein": set(JA_NEIN), "ja_nein_wn": set(JA_NEIN_WN),
            "auswahl": {o["wert"] for o in f.get("optionen", [])},
        }.get(f["typ"], set())
        wirk = f.get("wirkung", {})
        for wert, w in wirk.items():
            if wert not in werte_erlaubt:
                fehler.append(f"{fid}: Wirkung für unbekannte Antwort '{wert}'")
            for z in list(w.get("zustaende", [])) + list(w.get("vorsicht", [])):
                if z not in zust:
                    fehler.append(f"{fid}: Zustand '{z}' steht nicht in stufen.json")
            for c in w.get("orange", []):
                if c not in fb["orange_codes"]:
                    fehler.append(f"{fid}: unbekannter Orange Code {c}")
            if "rot" in w:
                rot_zustaende.update(w.get("zustaende", []))
                if not w.get("zustaende"):
                    fehler.append(f"{fid}: Rot Antwort ohne Zustand")
                for z in w.get("zustaende", []):
                    if z not in global_eins:
                        fehler.append(f"{fid}: Rot setzt '{z}', das ist aber nicht globale Stufe 1")
        # Unbekannt gilt nie als gesund
        if f["typ"] == "ja_nein_wn":
            hat_wirkung = any(v != "wn" and wirk.get(v) for v in JA_NEIN)
            if hat_wirkung and not wirk.get("wn"):
                fehler.append(f"{fid}: 'Weiß nicht' hat keine Wirkung, obwohl eine andere Antwort eine hat")
            if f["id"] in ("C3", "D2") and not wirk.get("wn"):
                fehler.append(f"{fid}: Weiß nicht muss zu Orange führen")
    if rot_zustaende != global_eins:
        if global_eins - rot_zustaende:
            fehler.append("Globale Stufe 1 ohne Rot Antwort im Fragebogen: " + ", ".join(sorted(global_eins - rot_zustaende)))
    # Jede Region braucht mindestens eine Folgefrage, sonst ist sie immer 'unklar'
    for r in regionen:
        if not any(r in f.get("region", []) for f in fb["fragen"]):
            fehler.append(f"Region {r} hat keine Frage, die sie erklären kann")
    # Schmerzblock: P0 verweist auf R0, und jede Region hat genau je eine Frage P1, P2 und P3 mit Bedingung auf P0
    p0 = next((f for f in fb["fragen"] if f["id"] == "P0"), None)
    if p0 is not None:
        for r in regionen:
            for nr in ("P1", "P2", "P3"):
                qs = [f for f in fb["fragen"] if f["id"].startswith(nr) and (f.get("nur_wenn") or {}).get("enthaelt") == r
                      and (f.get("nur_wenn") or {}).get("frage") == "P0"]
                if len(qs) != 1:
                    fehler.append(f"Schmerzblock: Region {r} hat {len(qs)} Fragen {nr}, soll genau eine sein")
    for g, zs in fb["ampel"]["zaehlgruppen"].items():
        for z in zs:
            if z not in zust:
                fehler.append(f"Zählgruppe {g}: Zustand '{z}' steht nicht in stufen.json")
    # Jede Region braucht ihren Zustand region_unklar_<region>
    for r in regionen:
        if f"region_unklar_{r}" not in zust:
            fehler.append(f"Zustand region_unklar_{r} fehlt in stufen.json")
    return fehler


# ------------------------------------------------------------------ Dokument erzeugen

def _wirkung_text(f: dict, fb: dict) -> str:
    teile = []
    namen = {"ja": "Ja", "nein": "Nein", "wn": "Weiß nicht"}
    optionen = {o["wert"]: o["text"] for o in f.get("optionen", [])}
    for wert, w in (f.get("wirkung") or {}).items():
        x = []
        if "stopp" in w:
            x.append("kein Fortfahren")
        if "rot" in w:
            x.append("Rot" + (" (strittig)" if w.get("strittig") else "") + (", Notfallhinweis" if w.get("notfall") else ""))
        if w.get("orange"):
            x.append("Orange " + ", ".join(w["orange"]))
        if w.get("zustaende") and "rot" not in w:
            x.append("Zustand " + ", ".join(f"`{z}`" for z in w["zustaende"]))
        if w.get("vorsicht"):
            x.append("vorsichtshalber `" + "`, `".join(w["vorsicht"]) + "`")
        if x:
            teile.append(f"{namen.get(wert) or optionen.get(wert, wert)}: " + ", ".join(x))
    return "; ".join(teile)


def _antwort_text(f: dict) -> str:
    t = f["typ"]
    if t == "ja_nein":
        return "Ja / Nein"
    if t == "ja_nein_wn":
        return "Ja / Nein / Weiß nicht"
    if t == "auswahl":
        return " / ".join(o["text"] for o in f["optionen"])
    if t == "mehrfach":
        return "Mehrfachauswahl: " + ", ".join(o["text"] for o in f["optionen"])
    if t == "region_karte":
        return "Kacheln, Mehrfachauswahl, Pflicht. Auch 'Nichts davon' ist eine Antwort"
    if t == "skala":
        return f"Skala {f['min']} bis {f['max']}"
    if t == "zahl":
        return "Zahl"
    if t == "region_teilauswahl":
        return f"Bis zu {f.get('max', 3)} der in {f['teilmenge_von']} gewählten Bereiche, oder 'Keine Schmerzen'"
    if t == "ziele":
        return "Bis zu zwei aus den möglichen Zielen"
    return "Text" + ("" if f["pflicht"] else ", freiwillig")


def _bedingung_text(f: dict) -> str:
    b = f.get("nur_wenn")
    if not b:
        return ""
    if "wert" in b:
        return f"nur wenn {b['frage']} = {b['wert']}"
    if "werte" in b:
        return f"nur wenn {b['frage']} = " + " oder ".join(b["werte"])
    if b.get("hat_region"):
        return f"nur wenn in {b['frage']} mindestens ein Bereich gewählt wurde"
    if b["frage"] == "P0":
        return f"nur wenn in P0 der Bereich {b['enthaelt']} gewählt wurde"
    return f"nur wenn Region {b['enthaelt']} gewählt"


def erzeuge_dokument(fb: dict, stufen: dict) -> str:
    """Lesbare Fassung des Fragebogens (Markdown), erzeugt aus den Daten. Eine Quelle, kein Abweichen von Doku und Code."""
    z = []
    z.append("# Fragebogen Entwurf 4, Fassung aus den Daten")
    z.append("")
    z.append("Diese Datei wird aus `regeln/fragebogen.json` erzeugt (`python -m audiosystem fragebogen-doc`). "
             "Wer etwas ändern will, ändert die Daten, nicht diese Datei. Das Prüfwerkzeug stellt dann sicher, dass Text, Regeln und Tests zusammenpassen.")
    z.append("")
    z.append("WN steht für Weiß nicht. Fragen, die an Angehörige gerichtet sein können, sind ohne du formuliert und beziehen sich auf die Person, die trainieren soll.")
    z.append("")
    for s in fb["schritte"]:
        z.append(f"## Schritt {s['nr']}: {s['titel']}")
        z.append("")
        z.append("| ID | Frage | Antwort | Wirkung | Bedingung | Quelle |")
        z.append("| --- | --- | --- | --- | --- | --- |")
        for f in fb["fragen"]:
            if f["schritt"] != s["nr"]:
                continue
            quelle = {"entwurf3": "Dokument 13", "entwurf4": "neu in Entwurf 4", "vorschlag": "Vorschlag, ungeprüft", "gegenleser": "Hinweis Gegenleser, Fragetext ungeprüft"}[f["quelle"]]
            frage = f["text"].replace("|", "/")
            z.append(f"| {f['id']} | {frage} | {_antwort_text(f)} | {_wirkung_text(f, fb)} | {_bedingung_text(f)} | {quelle} |")
        z.append("")
    z.append("## Wirkung der Körperkarte")
    z.append("")
    z.append("Wer in R0 eine Region wählt, bekommt die Folgefragen dieser Region. Gibt es zu einer gewählten Region keine Antwort Ja oder Weiß nicht, die sie erklärt, entsteht der Zustand `region_unklar_<region>`. "
             "Jeder Baustein, der diese Region in `belastet_regionen` nennt, bekommt dann mindestens Stufe 3.")
    z.append("")
    z.append("| Region | Erklärende Fragen |")
    z.append("| --- | --- |")
    for r, name in stufen["regionen"].items():
        ids = [f["id"] for f in fb["fragen"] if r in f.get("region", [])]
        z.append(f"| {name} | {', '.join(ids)} |")
    z.append("")
    z.append("## Orange Codes")
    z.append("")
    z.append("| Code | Bedeutung |")
    z.append("| --- | --- |")
    for c, t in fb["orange_codes"].items():
        z.append(f"| {c} | {t} |")
    z.append("")
    z.append("## Zählgruppen für O4 und Gelb")
    z.append("")
    z.append("| Gruppe | Zustände |")
    z.append("| --- | --- |")
    for g, zs in fb["ampel"]["zaehlgruppen"].items():
        z.append(f"| {g} | " + ", ".join(f"`{x}`" for x in zs) + " |")
    z.append("")
    z.append("## Noch nicht von der Regelprüfung abgedeckt")
    z.append("")
    for t in fb["ampel"]["noch_nicht_geprueft"]:
        z.append(f"- {t}")
    z.append("")
    return "\n".join(z)
