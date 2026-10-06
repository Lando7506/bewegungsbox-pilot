"""Regelwerk: aus Zuständen eines Kunden wird pro Baustein eine Entscheidung und daraus ein Plan.

Keine KI. Alles hier ist feste Logik, die sich mit Testprofilen automatisch prüfen lässt.
"""
from __future__ import annotations

import hashlib
import json
from datetime import datetime

from .clips import cue_aktiv
from .common import (
    hat_wiederholungen,
    mit_wiederholungen,
    wiederholungen_fuer_profil,
    block_cues,
    ist_block,
    STATUS_FREIGEGEBEN,
    SYSTEM_VERSION,
    SystemFehler,
    lade_einstellungen,
    segmente,
    sollsumme,
)

# Je höher der Rang, desto strenger.
RANG = {"frei": 0, "info": 1, "warnung": 2, "gesperrt": 3, "manuell": 4}
STUFE_ZU_ENTSCHEIDUNG = {1: "manuell", 2: "gesperrt", 3: "warnung", 4: "info"}


def kanonischer_hash(daten) -> str:
    text = json.dumps(daten, sort_keys=True, ensure_ascii=False)
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]


REGION_PRAEFIX = "region_unklar_"


def region_aus_zustand(zustand: str) -> str | None:
    """'region_unklar_knie' -> 'knie', sonst None."""
    return zustand[len(REGION_PRAEFIX):] if zustand.startswith(REGION_PRAEFIX) else None


def pruefe_zustaende(zustaende, stufen: dict) -> set[str]:
    """Unbekannte Zustände sind ein Fehler, damit sich kein Tippfehler als 'gesund' auswirkt."""
    z = set(zustaende)
    unbekannt = sorted(z - set(stufen["zustaende"]))
    if unbekannt:
        raise SystemFehler(
            "Unbekannte Zustände (Tippfehler?): " + ", ".join(unbekannt)
            + ". Erlaubt sind nur Zustände aus regeln/stufen.json."
        )
    return z


def bewerte_baustein(baustein: dict, zustaende, stufen: dict) -> dict:
    """Entscheidung für einen Baustein: frei, info, warnung, gesperrt oder manuell."""
    z = pruefe_zustaende(zustaende, stufen)
    bmap = {e["zustand"]: e for e in baustein.get("stufen_zuordnung", [])}
    treffer = []
    for zustand in sorted(z):
        kandidaten = []
        g = stufen["zustaende"][zustand].get("stufe_global")
        if g:
            kandidaten.append({"quelle": "global", "stufe": g, "hinweis": stufen["zustaende"][zustand]["name"]})
        r = region_aus_zustand(zustand)
        if r and r in baustein.get("belastet_regionen", []):
            # Standardregel: Region genannt, Genaueres unklar. Mindestens Stufe 3, ein Baustein darf nur verschärfen.
            kandidaten.append({
                "quelle": "region_standard",
                "stufe": stufen["region_unklar"]["stufe"],
                "hinweis": stufen["zustaende"][zustand]["name"],
            })
        b = bmap.get(zustand)
        if b:
            kandidaten.append({"quelle": "baustein", "stufe": b["stufe"], "hinweis": b.get("hinweis", "")})
        if kandidaten:
            streng = min(kandidaten, key=lambda k: k["stufe"])
            treffer.append({"zustand": zustand, **streng})
    if not treffer:
        return {"entscheidung": "frei", "stufe": None, "treffer": []}
    stufe = min(t["stufe"] for t in treffer)
    return {"entscheidung": STUFE_ZU_ENTSCHEIDUNG[stufe], "stufe": stufe, "treffer": treffer}


def anpassungen(baustein: dict, zustaende) -> dict:
    """Welche optionalen Cues fallen weg und welche Varianten werden genommen."""
    z = set(zustaende)
    uebersprungen, varianten = [], []
    soll = 0.0
    for teil, i, seg in segmente(baustein):
        if ist_block(seg):
            soll += seg["soll_dauer_s"]
            for cue in block_cues(seg):
                if not cue_aktiv(cue, z):
                    uebersprungen.append({"teil": teil["id"], "bei_s": cue["bei_s"], "text": cue["text"]})
                    continue
                for v in cue.get("varianten", []):
                    if v["bei_zustand"] in z:
                        varianten.append({"teil": teil["id"], "index": i, "bei_s": cue["bei_s"], "zustand": v["bei_zustand"]})
                        break
        else:
            s = seg["soll_dauer_s"]
            if seg["typ"] == "sprechen":
                for v in seg.get("varianten", []):
                    if v["bei_zustand"] in z:
                        s = v.get("soll_dauer_s", s)
                        varianten.append({"teil": teil["id"], "index": i, "zustand": v["bei_zustand"]})
                        break
            soll += s
    return {"uebersprungene_cues": uebersprungen, "varianten": varianten, "soll_dauer_s": round(soll, 3)}


def erstelle_plan(
    profil: dict,
    baustein_ids: list[str],
    bausteine: dict[str, dict],
    stufen: dict,
    entwurf: bool = False,
    stufe1_freigabe: str | None = None,
    einst: dict | None = None,
) -> dict:
    """Wählt aus den angefragten Bausteinen aus, was für dieses Profil erlaubt ist.

    Nicht freigegebene Bausteine werden nur mit entwurf=True verarbeitet.
    Stufe 1 (kein automatischer Plan) führt zu Status manuell_pruefen, außer Lando gibt den Fall
    mit seinem Namen frei (stufe1_freigabe). Die Freigabe wird im Plan festgehalten.
    """
    einst = einst or lade_einstellungen()
    zustaende = pruefe_zustaende(profil.get("zustaende", []), stufen)
    wdh, wdh_quelle = wiederholungen_fuer_profil(profil)
    eintraege, ausgeschlossen, offene_punkte = [], [], []

    def baue_eintrag(bid: str, ersetzt: str | None = None):
        b = bausteine.get(bid)
        if b is None:
            raise SystemFehler(f"Baustein {bid} existiert nicht")
        if b.get("status") != STATUS_FREIGEGEBEN and not entwurf:
            raise SystemFehler(
                f"Baustein {bid} hat den Status '{b.get('status')}' und ist nicht freigegeben. "
                "Für Tests mit --entwurf bauen, für Kunden erst freigeben."
            )
        bew = bewerte_baustein(b, zustaende, stufen)
        entscheidung = bew["entscheidung"]
        if entscheidung == "manuell" and stufe1_freigabe:
            entscheidung = "manuell_freigegeben"
        eintrag = {
            "id": bid,
            "titel": b["titel"],
            "textfassung": b.get("version"),
            "status_baustein": b.get("status"),
            "entscheidung": entscheidung,
            "stufe": bew["stufe"],
            "treffer": bew["treffer"],
            "ersetzt": ersetzt,
            "baustein_sha": kanonischer_hash(b),
        }
        return b, eintrag

    for bid in baustein_ids:
        b, e = baue_eintrag(bid)
        if e["entscheidung"] in ("frei", "info", "warnung", "manuell_freigegeben"):
            a = anpassungen(mit_wiederholungen(b, wdh), zustaende)
            e.update(a)
            if wdh and hat_wiederholungen(b):
                e["wiederholungen_pro_satz"] = wdh
            if e["entscheidung"] == "warnung" and not a["varianten"] and not a["uebersprungene_cues"]:
                offene_punkte.append(
                    f"{bid}: Stufe 3, aber weder Variantentext noch angepasster Cue hinterlegt. "
                    "Der Hinweis muss auf dem Planblatt stehen (Wording von Lando)."
                )
            eintraege.append(e)
            continue
        if e["entscheidung"] == "gesperrt":
            for ersatz_id in b.get("ersatz", []):
                eb, ee = baue_eintrag(ersatz_id, ersetzt=bid)
                if ee["entscheidung"] in ("frei", "info", "warnung"):
                    ee.update(anpassungen(mit_wiederholungen(eb, wdh), zustaende))
                    if wdh and hat_wiederholungen(eb):
                        ee["wiederholungen_pro_satz"] = wdh
                    eintraege.append(ee)
                    e["ersatz_verwendet"] = ersatz_id
                    break
        ausgeschlossen.append(e)

    manuell = [e for e in ausgeschlossen if e["entscheidung"] == "manuell"]
    if manuell:
        status = "manuell_pruefen"
        offene_punkte.append(
            "Stufe 1: " + ", ".join(e["id"] for e in manuell)
            + " nicht automatisch. Lando entscheidet persönlich (Plan erneut mit Freigabe erzeugen oder Absage)."
        )
    elif not eintraege:
        status = "kein_audio"
        offene_punkte.append("Kein Baustein im Plan, weil alle gesperrt sind. Ersatzbaustein oder Rückmeldung an den Kunden nötig.")
    else:
        status = "bereit"
    for e in ausgeschlossen:
        if e["entscheidung"] == "gesperrt" and "ersatz_verwendet" not in e:
            offene_punkte.append(f"{e['id']}: gesperrt, kein Ersatzbaustein hinterlegt.")

    hinweise = []
    for z in sorted(zustaende):
        t = stufen["zustaende"][z].get("intern_hinweis")
        if t:
            hinweise.append({"zustand": z, "text": t})

    return {
        "plan_id": f"{profil['id']}_{datetime.now().strftime('%Y%m%d')}",
        "profil_id": profil["id"],
        "erstellt": datetime.now().isoformat(timespec="seconds"),
        "system_version": SYSTEM_VERSION,
        "entwurf": bool(entwurf),
        "zustaende": sorted(zustaende),
        "wiederholungen_pro_satz": wdh,
        "wiederholungen_quelle": wdh_quelle,
        "niveau": profil.get("niveau"),
        "status": status,
        "stufe1_freigabe": (
            {"von": stufe1_freigabe, "am": datetime.now().isoformat(timespec="seconds")} if stufe1_freigabe else None
        ),
        "bausteine": eintraege,
        "ausgeschlossen": ausgeschlossen,
        "intern_hinweise": hinweise,
        "offene_punkte": offene_punkte,
        "stufen_sha": kanonischer_hash(stufen),
    }
