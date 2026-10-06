"""Gemeinsame Hilfen: Pfade, Einstellungen, Hashes und Zugriff auf Bausteine."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Iterator

ROOT = Path(__file__).resolve().parent.parent
BAUSTEINE_DIR = ROOT / "bausteine"
CLIPS_DIR = ROOT / "clips"
AUSGABE_DIR = ROOT / "ausgabe"
REGELN_FILE = ROOT / "regeln" / "stufen.json"
EINSTELLUNGEN_FILE = ROOT / "einstellungen.json"

SYSTEM_VERSION = "1.0"
SAMPLE_RATE = 44100

STATUS_FREIGEGEBEN = "freigegeben"
STATUS_ERLAUBT = ("entwurf_nicht_freigegeben", "in_pruefung", STATUS_FREIGEGEBEN)

STANDARD_EINSTELLUNGEN = {
    "vorlauf_s": 1.0,
    "nachlauf_s": 2.0,
    "pause_zwischen_bausteinen_s": 15.0,
    "ziel_rms_dbfs": -20.0,
    "fade_ms": 15,
    "raumton": True,
    "raumton_min_dbfs": -75.0,
    "raumton_max_dbfs": -58.0,
    "formate": ["wav", "mp3"],
    "mp3_bitrate": "128k",
    "cue_sicherheitsabstand_s": 1.0,
    "max_sprechtempo_wps": 2.8,
    "min_sprechtempo_wps": 1.0,
    "min_snr_db": 20.0,
    "stille_pause_warnung_s": 2.5,
}


class SystemFehler(Exception):
    """Fehler, bei dem das System bewusst anhält, statt weiterzumachen."""


def lade_json(pfad: Path | str):
    with open(pfad, encoding="utf-8") as f:
        return json.load(f)


def schreibe_json(pfad: Path | str, daten) -> None:
    Path(pfad).parent.mkdir(parents=True, exist_ok=True)
    with open(pfad, "w", encoding="utf-8") as f:
        json.dump(daten, f, ensure_ascii=False, indent=2, sort_keys=False)
        f.write("\n")


def lade_einstellungen(pfad: Path | str | None = None) -> dict:
    einst = dict(STANDARD_EINSTELLUNGEN)
    p = Path(pfad) if pfad else EINSTELLUNGEN_FILE
    if p.exists():
        einst.update(lade_json(p))
    return einst


def norm_text(text: str) -> str:
    return " ".join(text.split())


def text_hash(text: str) -> str:
    return hashlib.sha256(norm_text(text).encode("utf-8")).hexdigest()[:16]


def datei_hash(pfad: Path | str) -> str:
    h = hashlib.sha256()
    with open(pfad, "rb") as f:
        for block in iter(lambda: f.read(1 << 20), b""):
            h.update(block)
    return h.hexdigest()


def wortzahl(text: str) -> int:
    return len([w for w in text.replace("?", " ").replace(".", " ").split() if w])


def lade_baustein(baustein_id: str, verzeichnis: Path | str | None = None) -> dict:
    p = Path(verzeichnis or BAUSTEINE_DIR) / f"{baustein_id}.json"
    if not p.exists() and baustein_id == ZAHLEN_ID:
        p = Path(verzeichnis or BAUSTEINE_DIR) / "_gemeinsam" / f"{baustein_id}.json"
    if not p.exists():
        raise SystemFehler(f"Baustein {baustein_id} nicht gefunden: {p}")
    return lade_json(p)


def alle_baustein_ids(verzeichnis: Path | str | None = None) -> list[str]:
    return sorted(p.stem for p in Path(verzeichnis or BAUSTEINE_DIR).glob("*.json"))


def lade_alle_bausteine(verzeichnis: Path | str | None = None) -> dict[str, dict]:
    return {bid: lade_baustein(bid, verzeichnis) for bid in alle_baustein_ids(verzeichnis)}


def lade_stufen(pfad: Path | str | None = None) -> dict:
    return lade_json(pfad or REGELN_FILE)


def segmente(baustein: dict) -> Iterator[tuple[dict, int, dict]]:
    """Liefert (teil, index im Teil, segment) in Abspielreihenfolge."""
    for teil in baustein["teile"]:
        for i, seg in enumerate(teil["segmente"]):
            yield teil, i, seg


def sollsumme(baustein: dict) -> float:
    return round(sum(seg["soll_dauer_s"] for _, _, seg in segmente(baustein)), 3)


ZAHLWOERTER = ("eins", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun", "zehn", "elf", "zwölf")
ZAHLEN_ID = "ZAHLEN"  # gemeinsamer Baustein mit den Zahlenclips, wird von allen zählenden Bausteinen genutzt


def zahlen_clip_id(wort: str) -> str:
    return f"{ZAHLEN_ID}_zahlen_s{ZAHLWOERTER.index(wort):02d}"
# Zeitblöcke: feste Dauer mit Hinweisen zu bestimmten Zeitpunkten
ZEITBLOCK_TYPEN = ("halten", "wiederholungen", "satzpause")
ALLE_TYPEN = ("sprechen", "pause") + ZEITBLOCK_TYPEN
WIEDERHOLUNGS_MODI = ("zaehlen", "wortsignal")


# Wiederholungen pro Satz: Standard ist der Wert im Baustein (meist 10). Pro Person einstellbar von WDH_MIN bis WDH_MAX.
WDH_MIN = 5
WDH_MAX = 12


def pruefe_wiederholungszahl(n) -> int | None:
    """None bleibt None (Standard des Bausteins). Sonst eine ganze Zahl von WDH_MIN bis WDH_MAX."""
    if n is None:
        return None
    if isinstance(n, bool) or not isinstance(n, int) or not (WDH_MIN <= n <= WDH_MAX):
        raise SystemFehler(f"wiederholungen_pro_satz muss eine ganze Zahl von {WDH_MIN} bis {WDH_MAX} sein, nicht {n!r}.")
    return n


# Startwert aus dem Niveau (Landos Vorgabe vom 06.10.2026, Beispiel Horst): Niveau A (kaum mobil) 8, Niveau B und C 10.
# Das Alter spielt keine Rolle. Nie unter 8 oder über 10 automatisch. 5 bis 7 und 11 bis 12 nur von Hand (Rückruf).
NIVEAUS = ("A", "B", "C")
WDH_START_NACH_NIVEAU = {"A": 8, "B": 10, "C": 10}


def pruefe_niveau(n) -> str | None:
    """None bleibt None (kein Startwert). Sonst genau A, B oder C."""
    if n is None:
        return None
    if not isinstance(n, str) or n not in NIVEAUS:
        raise SystemFehler(f"niveau muss A, B oder C sein, nicht {n!r}.")
    return n


def wiederholungen_fuer_profil(profil: dict) -> tuple[int | None, str]:
    """Wiederholungen pro Satz für dieses Profil und woher der Wert kommt.

    Vorrang: 1. Handwert (wiederholungen_pro_satz, 5 bis 12), 2. Startwert aus dem Niveau,
    3. nichts angegeben, dann gilt der Wert im Baustein. Die Quelle steht im Plan ("hand", "niveau", "baustein").
    """
    hand = pruefe_wiederholungszahl(profil.get("wiederholungen_pro_satz"))
    if hand is not None:
        return hand, "hand"
    niveau = pruefe_niveau(profil.get("niveau"))
    if niveau is not None:
        return WDH_START_NACH_NIVEAU[niveau], "niveau"
    return None, "baustein"


def hat_wiederholungen(baustein: dict) -> bool:
    return any(seg.get("typ") == "wiederholungen" for _, _, seg in segmente(baustein))


def mit_wiederholungen(baustein: dict, n) -> dict:
    """Kopie des Bausteins mit n Wiederholungen pro Satz. Die Blockdauer wächst oder schrumpft im Takt mit.

    Bei Zählen kommt ein Hinweis pro Wiederholung, beim Wortsignal ein Hinweis pro Wort. Die Pause nach dem letzten
    Hinweis bleibt so lang wie vorher.
    """
    import copy

    n = pruefe_wiederholungszahl(n)
    if n is None or not hat_wiederholungen(baustein):
        return baustein
    b = copy.deepcopy(baustein)
    for _, _, seg in segmente(b):
        if seg.get("typ") != "wiederholungen":
            continue
        if not isinstance(seg.get("anzahl"), int) or not isinstance(seg.get("takt_s"), (int, float)):
            continue  # kaputter Block, die Prüfung meldet ihn
        pro_wdh = len(seg.get("woerter") or [1]) if seg.get("modus") == "wortsignal" else 1
        seg["soll_dauer_s"] = seg["soll_dauer_s"] + (n - seg["anzahl"]) * pro_wdh * seg["takt_s"]
        seg["anzahl"] = n
    b["soll_gesamtdauer_s"] = sollsumme(b)
    return b


def ist_block(seg: dict) -> bool:
    return seg.get("typ") in ZEITBLOCK_TYPEN


def erzeugte_cues(seg: dict) -> list[dict]:
    """Cues, die ein Segment vom Typ 'wiederholungen' selbst erzeugt (Zählen oder Wortsignal)."""
    if seg.get("typ") != "wiederholungen":
        return []
    modus, anzahl, takt = seg.get("modus"), seg.get("anzahl"), seg.get("takt_s")
    start = seg.get("start_s", 0)
    if modus not in WIEDERHOLUNGS_MODI or not isinstance(anzahl, int) or anzahl < 1 or not isinstance(takt, (int, float)) or takt <= 0:
        return []
    cues = []
    if modus == "zaehlen":
        if anzahl > len(ZAHLWOERTER):
            return []
        for k in range(anzahl):
            cues.append({"bei_s": start + k * takt, "text": ZAHLWOERTER[k], "erzeugt": True})
    else:
        woerter = seg.get("woerter") or []
        if not woerter:
            return []
        for k in range(anzahl * len(woerter)):
            cues.append({"bei_s": start + k * takt, "text": woerter[k % len(woerter)], "erzeugt": True})
    return cues


def block_cues(seg: dict) -> list[dict]:
    """Alle Cues eines Zeitblocks (ausdrücklich angegebene und erzeugte), nach Zeit sortiert."""
    if not ist_block(seg):
        return []
    return sorted(list(seg.get("cues", [])) + erzeugte_cues(seg), key=lambda c: c["bei_s"])


def formatiere_zeit(sekunden: float) -> str:
    s = int(round(sekunden))
    return f"{s // 60}:{s % 60:02d}"
