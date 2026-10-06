"""Erzeugt die Daten für den Piloten aus dem Python System (Referenz).

Aufruf aus dem Repo Ordner:  python pilot/werkzeuge/export.py

Schreibt
- pilot/daten.js            Fragebogen, Stufen, Bausteine, Einstellungen und Demo Profile für die Web App
- pilot/tests/erwartung.json.gz Erwartungswerte des Python Systems für den Node Test

Nichts hier wird von Hand gepflegt. Ändern sich Daten oder Logik in audio_system, das Skript erneut laufen lassen.
"""
from __future__ import annotations

import gzip
import json
import random
import sys
from itertools import combinations
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
PILOT = REPO / "pilot"
sys.path.insert(0, str(REPO / "audio_system"))

from audiosystem.common import SystemFehler, lade_alle_bausteine, lade_einstellungen, lade_json, lade_stufen  # noqa: E402
from audiosystem.fragebogen import JA_NEIN, JA_NEIN_WN, REGION_NICHTS, auswerten, ist_sichtbar, lade_fragebogen, ziel_kandidaten  # noqa: E402
from audiosystem.regeln import bewerte_baustein, erstelle_plan  # noqa: E402
from audiosystem.regeltest import _zufallsantworten, baue_antworten  # noqa: E402

ANTWORTEN_DATEI = REPO / "audio_system" / "profile" / "testantworten.json"
PROFILE_DATEI = REPO / "audio_system" / "profile" / "testprofile.json"
SEED = 20261003  # derselbe Startwert wie in regeltest.py
ANZAHL_ZUFALL = 400
SEED_MILD = 20261006  # zusätzlicher Satz, damit Gelb und Grün öfter vorkommen
ANZAHL_MILD = 400

# Felder, die vom Zeitpunkt abhängen und deshalb nicht verglichen werden
PLAN_OHNE = ("plan_id", "erstellt", "stufen_sha", "system_version")
EINTRAG_OHNE = ("baustein_sha",)
AUSWERTUNG_OHNE = ("antworten_sha",)

# Beispiele für das Auswahlmenü oben in der App, je Ampelfarbe eins
DEMO_HERVORGEHOBEN = {"A01": "gruen", "A06": "gelb", "N15": "orange", "N16": "rot"}


def _milde_antworten(fb: dict, stufen: dict, rng: random.Random, jahr: int) -> dict:
    """Zufallsverlauf, der Rot meistens meidet: Antworten mit Rot Wirkung kommen nur in 2 von 100 Fällen.

    Sonst wie _zufallsantworten in regeltest.py. So kommen Gelb, Grün und Orange häufiger vor als im Satz von dort.
    """
    fb2 = dict(fb)
    fb2["_regionen"] = stufen["regionen"]
    a: dict = {}
    for f in fb2["fragen"]:
        if not ist_sichtbar(f, a, fb2):
            continue
        t, wirk = f["typ"], f.get("wirkung") or {}
        if t in ("ja_nein_wn", "ja_nein", "auswahl"):
            if t == "auswahl":
                werte = [o["wert"] for o in f["optionen"]]
            else:
                werte = list(JA_NEIN_WN if t == "ja_nein_wn" else JA_NEIN)
            if f["id"] in ("W1", "W2"):
                werte = ["ja"]
            ohne_rot = [w for w in werte if "rot" not in wirk.get(w, {})]
            if rng.random() < 0.02 or not ohne_rot:
                a[f["id"]] = rng.choice(werte)
            else:
                # Meist die Antwort ohne jede Wirkung, sonst eine beliebige ohne Rot
                ruhig = [w for w in ohne_rot if not wirk.get(w)]
                a[f["id"]] = rng.choice(ruhig) if ruhig and rng.random() < 0.8 else rng.choice(ohne_rot)
        elif t == "text":
            a[f["id"]] = rng.choice(["x", ""]) if not f["pflicht"] else "x"
        elif t == "zahl":
            a[f["id"]] = rng.randint(1920, jahr - 60)
        elif t == "skala":
            a[f["id"]] = rng.randint(f["min"], f["max"])
        elif t == "mehrfach":
            a[f["id"]] = [o["wert"] for o in f["optionen"] if rng.random() < 0.25]
        elif t == "region_karte":
            regionen = list(stufen["regionen"])
            a[f["id"]] = [REGION_NICHTS] if rng.random() < 0.3 else [r for r in regionen if rng.random() < 0.25] or [rng.choice(regionen)]
        elif t == "region_teilauswahl":
            gewaehlt = [r for r in a.get(f["teilmenge_von"], []) if r != REGION_NICHTS]
            a[f["id"]] = [REGION_NICHTS] if rng.random() < 0.3 else rng.sample(gewaehlt, k=rng.randint(1, min(f.get("max", 3), len(gewaehlt))))
        elif t == "ziele":
            kand = ziel_kandidaten(fb2, a)
            a[f["id"]] = rng.sample(kand, k=rng.randint(1, min(2, len(kand))))
    return a


def plan_fuer(r: dict, bausteine: dict, stufen: dict) -> dict:
    """Plan wie im Piloten: alle vorhandenen Bausteine, Niveau aus der Auswertung, Entwurfsmodus."""
    profil = {"id": "PILOT", "zustaende": r["zustaende"], "niveau": r["niveau_vorlaeufig"]}
    return erstelle_plan(profil, sorted(bausteine), bausteine, stufen, entwurf=True)


def bereinige_plan(plan: dict) -> dict:
    p = {k: v for k, v in plan.items() if k not in PLAN_OHNE}
    for liste in ("bausteine", "ausgeschlossen"):
        p[liste] = [{k: v for k, v in e.items() if k not in EINTRAG_OHNE} for e in p[liste]]
    return p


def fall(fid: str, name: str, antworten: dict, jahr: int, bausteine: dict, stufen: dict, fb: dict) -> dict:
    eintrag = {"id": fid, "name": name, "jahr": jahr, "antworten": antworten}
    try:
        r = auswerten(antworten, fb, stufen, jahr, fid)
    except SystemFehler as e:
        eintrag["fehler"] = str(e)
        return eintrag
    eintrag["auswertung"] = {k: v for k, v in r.items() if k not in AUSWERTUNG_OHNE}
    if r["status"] == "ausgewertet":
        eintrag["plan"] = bereinige_plan(plan_fuer(r, bausteine, stufen))
    return eintrag


def main() -> None:
    fb = lade_fragebogen()
    stufen = lade_stufen()
    bausteine = lade_alle_bausteine()
    einst = lade_einstellungen()
    daten = lade_json(ANTWORTEN_DATEI)
    alt = {p["id"]: p for p in lade_json(PROFILE_DATEI)["profile"]}
    jahr = daten["jahr"]

    faelle, demo = [], []
    for spec in daten["profile"] + daten["zusatz"]:
        name = spec.get("name") or alt[spec["bezug"]]["name"]
        a = baue_antworten(daten["basis"], spec.get("aenderungen", {}), fb, stufen,
                           spec.get("entferne", ()), spec.get("fuelle_nein", True))
        f = fall(spec["id"], name, a, jahr, bausteine, stufen, fb)
        faelle.append(f)
        if "fehler" not in f:
            demo.append({"id": spec["id"], "name": name, "jahr": jahr, "antworten": a,
                         "ampel": f["auswertung"]["ampel"], "status": f["auswertung"]["status"],
                         "hervorgehoben": DEMO_HERVORGEHOBEN.get(spec["id"])})

    rng = random.Random(SEED)
    zufall = []
    for i in range(ANZAHL_ZUFALL):
        a = _zufallsantworten(fb, stufen, rng, jahr)
        zufall.append(fall(f"Z{i}", f"Zufall {i}", a, jahr, bausteine, stufen, fb))

    # Zusätzlich: milde Zufallsverläufe (selten Ja oder Weiß nicht), sonst gleiche Erzeugung wie regeltest.py.
    # Im Satz oben ist fast jeder Verlauf Rot, hier kommen Gelb und Grün häufiger vor.
    mild_rng = random.Random(SEED_MILD)
    mild = []
    for i in range(ANZAHL_MILD):
        a = _milde_antworten(fb, stufen, mild_rng, jahr)
        mild.append(fall(f"M{i}", f"Mild {i}", a, jahr, bausteine, stufen, fb))

    # Regelwerk direkt: alle Zustände einzeln und zu zweit. Plan ohne Niveau für alle, mit Niveau A und B für bis zu einem Zustand
    alle = sorted(stufen["zustaende"])
    kombis = []
    for k in (0, 1, 2):
        for kombi in combinations(alle, k):
            z = sorted(kombi)
            ents = {bid: bewerte_baustein(b, set(z), stufen) for bid, b in bausteine.items()}
            plaene = {}
            for niveau in ((None, "A", "B") if k <= 1 else (None,)):
                profil = {"id": "K", "zustaende": z, "niveau": niveau}
                plaene[niveau or "-"] = bereinige_plan(erstelle_plan(profil, sorted(bausteine), bausteine, stufen, entwurf=True))
            kombis.append({"zustaende": z, "bewertung": ents, "plaene": plaene})

    erwartung = {
        "hinweis": "Automatisch erzeugt von pilot/werkzeuge/export.py aus dem Python System. Nicht von Hand ändern.",
        "jahr": jahr,
        "seed": SEED,
        "profile": faelle,
        "zufall": zufall,
        "mild": mild,
        "kombinationen": kombis,
    }
    (PILOT / "tests").mkdir(parents=True, exist_ok=True)
    # Gepackt, weil die Datei sonst viele Megabyte groß ist. mtime=0, damit gleiche Daten die gleiche Datei ergeben.
    text = json.dumps(erwartung, ensure_ascii=False, separators=(",", ":"), sort_keys=True) + "\n"
    with open(PILOT / "tests" / "erwartung.json.gz", "wb") as f:
        f.write(gzip.compress(text.encode("utf-8"), mtime=0))

    app_daten = {
        "fragebogen": fb,
        "stufen": stufen,
        "bausteine": bausteine,
        "einstellungen": einst,
        "demo": demo,
    }
    with open(PILOT / "daten.js", "w", encoding="utf-8") as f:
        f.write("// Automatisch erzeugt von pilot/werkzeuge/export.py aus audio_system. Nicht von Hand ändern.\n")
        f.write("window.PILOT_DATEN = ")
        json.dump(app_daten, f, ensure_ascii=False, indent=1)
        f.write(";\n")

    n_fehler = sum(1 for x in faelle if "fehler" in x)
    print(f"Profile: {len(faelle)} (davon {n_fehler} absichtlich ungültig), Zufall: {len(zufall)}, "
          f"mild: {len(mild)}, Zustandskombinationen: {len(kombis)}, Demo Profile: {len(demo)}")


if __name__ == "__main__":
    main()
