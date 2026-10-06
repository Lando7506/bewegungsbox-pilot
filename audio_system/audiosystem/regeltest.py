"""Automatische Tests für das Regelwerk.

Damit musst du keine Playlist einzeln durchhören oder durchlesen: Das Regelwerk wird einmal gründlich
mit erfundenen Kundenprofilen und mit allen Kombinationen von bis zu drei Zuständen geprüft.
"""
from __future__ import annotations

import random
from itertools import combinations
from pathlib import Path

from .common import ROOT, block_cues, SystemFehler, lade_alle_bausteine, lade_json, lade_stufen
from .fragebogen import (
    JA_NEIN,
    JA_NEIN_WN,
    REGION_NICHTS,
    auswerten,
    ist_sichtbar,
    lade_fragebogen,
    pruefe_fragebogen,
    sichtbare_fragen,
    ziel_kandidaten,
)
from .regeln import RANG, bewerte_baustein, erstelle_plan, kanonischer_hash, region_aus_zustand


def lade_profile(pfad: Path | str):
    return lade_json(pfad)["profile"]


def teste_profile(profile: list[dict], bausteine: dict, stufen: dict) -> tuple[int, list[str]]:
    """Vergleicht für jedes Profil die erwartete Entscheidung je Baustein mit dem Ergebnis."""
    checks, fehler = 0, []
    for p in profile:
        z = set(p["zustaende"])
        for bid, erwartet in p.get("erwartung", {}).items():
            checks += 1
            ist = bewerte_baustein(bausteine[bid], z, stufen)["entscheidung"]
            if ist != erwartet:
                fehler.append(f"{p['id']} ({p['name']}), {bid}: erwartet {erwartet}, bekommen {ist}")
        if "plan_status" in p:
            checks += 1
            plan = erstelle_plan(p, sorted(bausteine), bausteine, stufen, entwurf=True)
            if plan["status"] != p["plan_status"]:
                fehler.append(f"{p['id']} ({p['name']}): Plan Status erwartet {p['plan_status']}, bekommen {plan['status']}")
    return checks, fehler


def teste_eigenschaften(bausteine: dict, stufen: dict, max_groesse: int = 3) -> tuple[int, list[str]]:
    """Prüft Grundregeln über alle Zustandskombinationen bis max_groesse."""
    checks, fehler = 0, []
    alle = sorted(stufen["zustaende"])
    globale_eins = {z for z, d in stufen["zustaende"].items() if d.get("stufe_global") == 1}

    # Entscheidungen für alle Kombinationen vorberechnen.
    tabelle: dict[frozenset, dict[str, str]] = {}
    for k in range(0, max_groesse + 1):
        for kombi in combinations(alle, k):
            s = frozenset(kombi)
            tabelle[s] = {bid: bewerte_baustein(b, s, stufen)["entscheidung"] for bid, b in bausteine.items()}

    # 1. Monotonie: Ein zusätzlicher Zustand macht nie etwas weniger streng.
    for s, ergebnis in tabelle.items():
        if len(s) >= max_groesse:
            continue
        for z in alle:
            if z in s:
                continue
            t = s | {z}
            for bid in bausteine:
                checks += 1
                if RANG[tabelle[t][bid]] < RANG[ergebnis[bid]]:
                    fehler.append(f"Monotonie verletzt bei {bid}: {sorted(s)} -> +{z} wird weniger streng")

    # 2. Globale Stufe 1 gilt für jeden Baustein.
    for s, ergebnis in tabelle.items():
        if s & globale_eins:
            for bid in bausteine:
                checks += 1
                if ergebnis[bid] != "manuell":
                    fehler.append(f"Globale Stufe 1 ({sorted(s & globale_eins)}) nicht manuell bei {bid}: {ergebnis[bid]}")

    # 3. Keine Abschwächung globaler Regeln im Baustein.
    for bid, b in bausteine.items():
        for e in b.get("stufen_zuordnung", []):
            g = stufen["zustaende"].get(e["zustand"], {}).get("stufe_global")
            checks += 1
            if g and e["stufe"] > g:
                fehler.append(f"{bid}: {e['zustand']} schwächt globale Stufe {g} auf {e['stufe']} ab")

    # 4. Pläne: Stufe 1 und 2 landen nie im Plan, optionale Cues mit Ausschluss fehlen, Entwurfsplan ist deterministisch.
    for s in tabelle:
        if len(s) > 2:
            continue
        profil = {"id": "TEST", "zustaende": sorted(s)}
        plan = erstelle_plan(profil, sorted(bausteine), bausteine, stufen, entwurf=True)
        for e in plan["bausteine"]:
            checks += 1
            if e["entscheidung"] in ("manuell", "gesperrt"):
                fehler.append(f"{sorted(s)}: {e['id']} ist {e['entscheidung']}, steht aber im Plan")
            b = bausteine[e["id"]]
            uebersprungen = {(c["teil"], c["bei_s"]) for c in e.get("uebersprungene_cues", [])}
            for teil in b["teile"]:
                for seg in teil["segmente"]:
                    for cue in block_cues(seg):
                        if set(cue.get("ausschluss_bei", [])) & s:
                            checks += 1
                            if (teil["id"], cue["bei_s"]) not in uebersprungen:
                                fehler.append(f"{sorted(s)}: Cue {e['id']} {teil['id']} bei {cue['bei_s']} s müsste wegfallen")
        plan2 = erstelle_plan(profil, sorted(bausteine), bausteine, stufen, entwurf=True)
        checks += 1
        a = dict(plan); b2 = dict(plan2)
        for k in ("erstellt",):
            a.pop(k, None); b2.pop(k, None)
        if kanonischer_hash(a) != kanonischer_hash(b2):
            fehler.append(f"{sorted(s)}: Plan ist nicht deterministisch")

    # 4b. Unbekannter Zustand muss einen Fehler auslösen.
    checks += 1
    try:
        erstelle_plan({"id": "X", "zustaende": ["gibt_es_nicht"]}, sorted(bausteine), bausteine, stufen, entwurf=True)
        fehler.append("Unbekannter Zustand wurde nicht abgelehnt")
    except SystemFehler:
        pass
    return checks, fehler


# ---------------------------------------------------------------------------------------------
# Fragebogen: Antworten -> Zustände -> Entscheidungen
# ---------------------------------------------------------------------------------------------

def baue_antworten(basis: dict, aenderungen: dict, fb: dict, stufen: dict, entferne=(), fuelle: bool = True) -> dict:
    """Basis plus Änderungen. Mit fuelle werden übrige sichtbare Pflichtfragen neutral beantwortet (Nein, erste Option, kleinster Wert)."""
    a = dict(basis)
    a.update(aenderungen)
    for k in entferne:
        a.pop(k, None)
    if fuelle:
        fb2 = dict(fb)
        fb2["_regionen"] = stufen["regionen"]
        geaendert = True
        while geaendert:
            geaendert = False
            for f in fb2["fragen"]:
                if f["id"] in a or not f["pflicht"] or not ist_sichtbar(f, a, fb2):
                    continue
                if f["typ"] in ("ja_nein", "ja_nein_wn"):
                    a[f["id"]] = "nein"
                elif f["typ"] == "auswahl":
                    a[f["id"]] = f["optionen"][0]["wert"]
                elif f["typ"] == "skala":
                    a[f["id"]] = f["min"]
                elif f["typ"] == "text":
                    a[f["id"]] = "x"
                elif f["typ"] == "region_teilauswahl":
                    a[f["id"]] = [REGION_NICHTS]
                else:
                    continue
                geaendert = True
    return a


def _entscheidungen(profil: dict, bausteine: dict, stufen: dict) -> tuple[dict, str]:
    ents = {bid: bewerte_baustein(b, set(profil["zustaende"]), stufen)["entscheidung"] for bid, b in bausteine.items()}
    plan = erstelle_plan(profil, sorted(bausteine), bausteine, stufen, entwurf=True)
    return ents, plan["status"]


def teste_antwortprofile(antworten_datei, profile_datei, bausteine: dict, stufen: dict, fb: dict) -> tuple[int, list[str]]:
    """Alle Antwortprofile. A01 bis A30 müssen dieselben Entscheidungen ergeben wie P01 bis P30."""
    checks, fehler = 0, []
    daten = lade_json(antworten_datei)
    alt = {p["id"]: p for p in lade_json(profile_datei)["profile"]}
    jahr = daten["jahr"]

    def pruefe(pid, name, spec, erwartung, plan_status):
        nonlocal checks
        a = baue_antworten(daten["basis"], spec.get("aenderungen", {}), fb, stufen, spec.get("entferne", ()), spec.get("fuelle_nein", True))
        ort = f"{pid} ({name})"
        if spec.get("fehler"):
            checks += 1
            try:
                auswerten(a, fb, stufen, jahr, pid)
                fehler.append(f"{ort}: hätte als ungültig abgelehnt werden müssen")
            except SystemFehler:
                pass
            return
        try:
            r = auswerten(a, fb, stufen, jahr, pid)
        except SystemFehler as e:
            fehler.append(f"{ort}: unerwarteter Abbruch: {e}")
            return
        if "status" in spec:
            checks += 1
            if r["status"] != spec["status"]:
                fehler.append(f"{ort}: Status erwartet {spec['status']}, bekommen {r['status']}")
            if spec["status"] == "unvollstaendig" and "fehlende" in spec:
                checks += 1
                if sorted(r.get("fehlende_fragen", [])) != sorted(spec["fehlende"]):
                    fehler.append(f"{ort}: fehlende Fragen erwartet {spec['fehlende']}, bekommen {r.get('fehlende_fragen')}")
            if r["ampel"] is not None:
                fehler.append(f"{ort}: bei Status {r['status']} darf es keine Ampel geben")
            return
        if "ampel" in spec:
            checks += 1
            if r["ampel"] != spec["ampel"]:
                fehler.append(f"{ort}: Ampel erwartet {spec['ampel']}, bekommen {r['ampel']} (Zustände {r['zustaende']}, orange {[o['code'] for o in r['orange']]})")
        if "orange" in spec:
            checks += 1
            if sorted({o["code"] for o in r["orange"]}) != sorted(spec["orange"]):
                fehler.append(f"{ort}: Orange erwartet {spec['orange']}, bekommen {sorted({o['code'] for o in r['orange']})}")
        if "zustaende" in spec:
            checks += 1
            if r["zustaende"] != sorted(spec["zustaende"]):
                fehler.append(f"{ort}: Zustände erwartet {sorted(spec['zustaende'])}, bekommen {r['zustaende']}")
        if "nur_wn" in spec:
            checks += 1
            if r["zustaende_nur_wegen_weiss_nicht"] != sorted(spec["nur_wn"]):
                fehler.append(f"{ort}: nur wegen Weiß nicht erwartet {spec['nur_wn']}, bekommen {r['zustaende_nur_wegen_weiss_nicht']}")
        for feld, key in (("niveau", "niveau_vorlaeufig"), ("ziele", "ziele"), ("strittig", "strittige_regeln_beteiligt")):
            if feld in spec:
                checks += 1
                if r[key] != spec[feld]:
                    fehler.append(f"{ort}: {feld} erwartet {spec[feld]}, bekommen {r[key]}")
        if "notfall" in spec:
            checks += 1
            if bool(r["notfallhinweis"]) != spec["notfall"]:
                fehler.append(f"{ort}: Notfallhinweis erwartet {spec['notfall']}")
        if erwartung is not None:
            ents, status = _entscheidungen(r["profil"], bausteine, stufen)
            for bid, soll in erwartung.items():
                checks += 1
                if ents[bid] != soll:
                    fehler.append(f"{ort}, {bid}: erwartet {soll}, bekommen {ents[bid]}")
            checks += 1
            if plan_status and status != plan_status:
                fehler.append(f"{ort}: Plan Status erwartet {plan_status}, bekommen {status}")

    for spec in daten["profile"]:
        p = alt.get(spec["bezug"])
        if p is None:
            fehler.append(f"{spec['id']}: Bezug {spec['bezug']} nicht in den Zustandsprofilen")
            continue
        pruefe(spec["id"], p["name"], spec, p["erwartung"], p.get("plan_status"))
    # Jedes alte Profil muss nachgebildet sein, sonst fällt eine Lücke nicht auf.
    checks += 1
    fehlend = sorted(set(alt) - {s["bezug"] for s in daten["profile"]})
    if fehlend:
        fehler.append("Zustandsprofile ohne Antwortprofil: " + ", ".join(fehlend))
    for spec in daten["zusatz"]:
        pruefe(spec["id"], spec["name"], spec, spec.get("erwartung"), spec.get("plan_status"))
    return checks, fehler


def _zufallsantworten(fb: dict, stufen: dict, rng: random.Random, jahr: int) -> dict:
    fb2 = dict(fb)
    fb2["_regionen"] = stufen["regionen"]
    a: dict = {}
    for f in fb2["fragen"]:
        if not ist_sichtbar(f, a, fb2):
            continue
        t = f["typ"]
        if t == "ja_nein_wn":
            a[f["id"]] = rng.choices(JA_NEIN_WN, weights=[12, 76, 12])[0]
        elif t == "ja_nein":
            a[f["id"]] = "ja" if f["id"] in ("W1", "W2", "W3a") else rng.choice(JA_NEIN)
        elif t == "auswahl":
            a[f["id"]] = rng.choice([o["wert"] for o in f["optionen"]])
        elif t == "text":
            a[f["id"]] = "x"
        elif t == "zahl":
            a[f["id"]] = rng.randint(1920, jahr - 60)
        elif t == "skala":
            a[f["id"]] = rng.randint(f["min"], f["max"])
        elif t == "mehrfach":
            a[f["id"]] = [o["wert"] for o in f["optionen"] if rng.random() < 0.25]
        elif t == "region_karte":
            regionen = list(stufen["regionen"])
            a[f["id"]] = [REGION_NICHTS] if rng.random() < 0.4 else [r for r in regionen if rng.random() < 0.3] or [rng.choice(regionen)]
        elif t == "region_teilauswahl":
            gewaehlt = [r for r in a.get(f["teilmenge_von"], []) if r != REGION_NICHTS]
            a[f["id"]] = [REGION_NICHTS] if rng.random() < 0.3 else rng.sample(gewaehlt, k=rng.randint(1, min(f.get("max", 3), len(gewaehlt))))
        elif t == "ziele":
            kand = ziel_kandidaten(fb2, a)
            a[f["id"]] = rng.sample(kand, k=rng.randint(1, min(2, len(kand))))
    return a


def _voraussetzung(fb: dict, fid: str, a: dict | None = None) -> dict:
    """Antworten, die nötig sind, damit Frage fid gestellt wird."""
    a = {} if a is None else a
    f = {x["id"]: x for x in fb["fragen"]}[fid]
    bed = f.get("nur_wenn")
    if bed:
        _voraussetzung(fb, bed["frage"], a)
        if "wert" in bed:
            a[bed["frage"]] = bed["wert"]
        elif "werte" in bed:
            a[bed["frage"]] = bed["werte"][0]
        elif "enthaelt" in bed:
            a[bed["frage"]] = [bed["enthaelt"]]
            # Teilauswahl (P0): die Region muss auch in der Quellfrage (R0) gewählt sein
            quelle = {x["id"]: x for x in fb["fragen"]}[bed["frage"]].get("teilmenge_von")
            if quelle:
                a[quelle] = [bed["enthaelt"]]
        elif bed.get("hat_region"):
            a[bed["frage"]] = ["knie"]
    return a


def teste_fragebogen_eigenschaften(bausteine: dict, stufen: dict, fb: dict, basis: dict, jahr: int, anzahl_zufall: int = 400, seed: int = 20261003) -> tuple[int, list[str]]:
    checks, fehler = 0, []

    # 1. Daten des Fragebogens passen zum Regelwerk
    checks += 1
    fehler += [f"Fragebogen: {f}" for f in pruefe_fragebogen(fb, stufen)]

    global_eins = {z for z, d in stufen["zustaende"].items() if d.get("stufe_global") == 1}
    fb2 = dict(fb)
    fb2["_regionen"] = stufen["regionen"]
    fragen = {f["id"]: f for f in fb["fragen"]}

    # 2. Jede Rot Antwort führt wirklich zu Rot, Notfallhinweis wie angegeben, und alle globalen Stufe 1 Zustände sind erreichbar
    erreicht = set()
    for f in fb["fragen"]:
        for wert, w in (f.get("wirkung") or {}).items():
            if "rot" not in w:
                continue
            a = baue_antworten(basis, {**_voraussetzung(fb, f["id"]), f["id"]: wert}, fb, stufen)
            r = auswerten(a, fb, stufen, jahr)
            checks += 1
            if r["ampel"] != "rot":
                fehler.append(f"{f['id']}={wert} ergibt {r['ampel']}, soll Rot sein")
            checks += 1
            if bool(r["notfallhinweis"]) != bool(w.get("notfall")):
                fehler.append(f"{f['id']}={wert}: Notfallhinweis stimmt nicht mit der Regel überein")
            erreicht.update(set(r["zustaende"]) & global_eins)
    checks += 1
    if erreicht != global_eins:
        fehler.append("Globale Stufe 1 Zustände ohne erreichbare Rot Antwort: " + ", ".join(sorted(global_eins - erreicht)))

    # 3. Weiß nicht ist nie dasselbe wie Nein
    leer = auswerten(baue_antworten(basis, {}, fb, stufen), fb, stufen, jahr)
    for f in fb["fragen"]:
        if f["typ"] != "ja_nein_wn":
            continue
        wirk = f.get("wirkung") or {}
        if not any(wirk.get(v) for v in JA_NEIN):
            continue
        a = baue_antworten(basis, {**_voraussetzung(fb, f["id"]), f["id"]: "wn"}, fb, stufen)
        r = auswerten(a, fb, stufen, jahr)
        checks += 1
        if r["ampel"] == "gruen" and r["zustaende"] == leer["zustaende"]:
            fehler.append(f"{f['id']}: Weiß nicht wirkt wie Nein (Ampel grün, keine Zustände)")

    # 4. Regionen: gewählt und nicht erklärt, entsteht region_unklar. Erklärt durch eine Antwort, entsteht es nicht
    for r_key in stufen["regionen"]:
        a = baue_antworten(basis, {"R0": [r_key]}, fb, stufen)
        r = auswerten(a, fb, stufen, jahr)
        checks += 1
        if f"region_unklar_{r_key}" not in r["zustaende"]:
            fehler.append(f"Region {r_key}: alle Folgefragen Nein, aber kein Zustand region_unklar")
        for f in fb["fragen"]:
            if r_key in f.get("region", []) and f["typ"] == "ja_nein_wn":
                a = baue_antworten(basis, {"R0": [r_key], **_voraussetzung(fb, f["id"]), f["id"]: "wn"}, fb, stufen)
                r2 = auswerten(a, fb, stufen, jahr)
                checks += 1
                if f"region_unklar_{r_key}" in r2["zustaende"]:
                    fehler.append(f"Region {r_key}: {f['id']}=wn erklärt die Region, region_unklar dürfte nicht entstehen")

    # 5. Standardregel im Regelwerk: Baustein mit der Region wird mindestens Warnung, Baustein ohne sie bleibt unberührt
    for r_key in stufen["regionen"]:
        z = {f"region_unklar_{r_key}"}
        for bid, b in bausteine.items():
            e = bewerte_baustein(b, z, stufen)["entscheidung"]
            checks += 1
            if r_key in b["belastet_regionen"] and RANG[e] < RANG["warnung"]:
                fehler.append(f"{bid}: Region {r_key} ist belastet, Entscheidung aber nur {e}")
            if r_key not in b["belastet_regionen"] and e != "frei" and not any(x["zustand"] in z for x in b["stufen_zuordnung"]):
                fehler.append(f"{bid}: Region {r_key} wird nicht belastet, Entscheidung aber {e}")

    # 6. Zufallsantworten, Eigenschaften über viele Verläufe
    rng = random.Random(seed)
    gruppe_von = {z: g for g, zs in fb["ampel"]["zaehlgruppen"].items() for z in zs}
    for i in range(anzahl_zufall):
        a = _zufallsantworten(fb, stufen, rng, jahr)
        r = auswerten(a, fb, stufen, jahr, f"Z{i}")
        ort = f"Zufall {i}"
        checks += 1
        if r["status"] != "ausgewertet":
            if r["status"] == "keine_einwilligung":
                continue
            fehler.append(f"{ort}: Status {r['status']} bei vollständigen Antworten, fehlend {r.get('fehlende_fragen')}")
            continue
        z = set(r["zustaende"])
        # Rot genau dann, wenn ein globaler Stufe 1 Zustand gesetzt ist
        checks += 1
        if (r["ampel"] == "rot") != bool(z & global_eins):
            fehler.append(f"{ort}: Rot und globale Stufe 1 passen nicht zusammen ({r['ampel']}, {sorted(z & global_eins)})")
        ents, status = _entscheidungen(r["profil"], bausteine, stufen)
        checks += 1
        if r["ampel"] == "rot" and any(e != "manuell" for e in ents.values()):
            fehler.append(f"{ort}: Rot, aber nicht jeder Baustein ist manuell: {ents}")
        if r["ampel"] != "rot" and any(e == "manuell" for e in ents.values()):
            fehler.append(f"{ort}: nicht Rot, aber ein Baustein ist manuell: {ents}")
        # Weiß nicht bei Fragen, die zu Rot führen können, ergibt mindestens Orange
        for f in sichtbare_fragen(fb2, a):
            w = (f.get("wirkung") or {}).get("wn", {})
            if a.get(f["id"]) == "wn" and "O11" in w.get("orange", []):
                checks += 1
                if r["ampel"] not in ("orange", "rot") or "O11" not in {o["code"] for o in r["orange"]}:
                    fehler.append(f"{ort}: {f['id']}=wn ergibt {r['ampel']}, O11 fehlt")
        # Grün heißt: nichts, was Auflagen auslöst
        checks += 1
        if r["ampel"] == "gruen" and (r["orange"] or any(x in gruppe_von for x in z)):
            fehler.append(f"{ort}: Ampel grün trotz Auflagen oder Orange Gründen")
        # region_unklar unabhängig nachgerechnet
        erklaert = set()
        for f in sichtbare_fragen(fb2, a):
            if a.get(f["id"]) in ("ja", "wn"):
                erklaert.update(f.get("region", []))
        soll_unklar = sorted(x for x in (a.get("R0") or []) if x != REGION_NICHTS and x not in erklaert)
        checks += 1
        if sorted(r["regionen_unklar"]) != soll_unklar:
            fehler.append(f"{ort}: regionen_unklar {r['regionen_unklar']}, erwartet {soll_unklar}")
        # Niveau A bei fremder Hilfe oder Rollstuhl
        checks += 1
        if (a["C5"] == "fremde_hilfe" or a["C6"] == "rollstuhl") and r["niveau_vorlaeufig"] != "A":
            fehler.append(f"{ort}: Niveau müsste A sein")
        # Deterministisch
        checks += 1
        r2 = auswerten(a, fb, stufen, jahr, f"Z{i}")
        if kanonischer_hash(r) != kanonischer_hash(r2):
            fehler.append(f"{ort}: Auswertung ist nicht deterministisch")
    return checks, fehler


def alle_regeltests(profil_datei: Path | str, baustein_dir=None, stufen_datei=None, max_groesse: int = 3,
                    antworten_datei: Path | str | None = None, fragebogen_datei: Path | str | None = None,
                    anzahl_zufall: int = 400):
    bausteine = lade_alle_bausteine(baustein_dir)
    stufen = lade_stufen(stufen_datei)
    c1, f1 = teste_profile(lade_profile(profil_datei), bausteine, stufen)
    c2, f2 = teste_eigenschaften(bausteine, stufen, max_groesse)
    ergebnis = {"profile_checks": c1, "eigenschafts_checks": c2, "fehler": f1 + f2, "fragebogen_checks": 0}
    antworten_datei = antworten_datei or ROOT / "profile" / "testantworten.json"
    if Path(antworten_datei).exists():
        fb = lade_fragebogen(fragebogen_datei)
        daten = lade_json(antworten_datei)
        c3, f3 = teste_antwortprofile(antworten_datei, profil_datei, bausteine, stufen, fb)
        c4, f4 = teste_fragebogen_eigenschaften(bausteine, stufen, fb, daten["basis"], daten["jahr"], anzahl_zufall)
        ergebnis["fragebogen_checks"] = c3 + c4
        ergebnis["fehler"] += f3 + f4
    return ergebnis
