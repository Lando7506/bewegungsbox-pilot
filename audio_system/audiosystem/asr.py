"""Optionale Spracherkennung als Gegenprobe: Sagt die Aufnahme das, was im Skript steht?

Die Vergleichslogik (vergleiche_text) ist unabhängig von der Spracherkennung und wird mit Tests geprüft.
Die Erkennung selbst (transkribiere) braucht das Paket faster-whisper und lädt beim ersten Mal ein Modell
aus dem Internet. Das ist hier in der Entwicklungsumgebung nicht getestet worden und muss auf deinem Rechner
einmal ausprobiert werden.
"""
from __future__ import annotations

import re
from difflib import SequenceMatcher
from pathlib import Path

RECHTS = {"rechts", "rechte", "rechten", "rechter", "rechtes", "rechtem"}
LINKS = {"links", "linke", "linken", "linker", "linkes", "linkem"}
KRITISCH = {
    "rechts", "rechte", "rechten", "links", "linke", "linken", "schmerz", "warnsignal", "sofort",
    "durchgestreckt", "schwindelig", "arzt", "hohlkreuz", "null", "zehn", "zwei", "sechzig", "dreißig", "neunzig",
}


def woerter(text: str) -> list[str]:
    text = text.lower().replace("ß", "ss")
    return [w for w in re.split(r"[^a-zäöüéèa-z0-9]+", text) if w]


def _seiten(ws: list[str]) -> set[str]:
    s = set()
    for w in ws:
        if w in {x.replace("ß", "ss") for x in RECHTS}:
            s.add("rechts")
        if w in {x.replace("ß", "ss") for x in LINKS}:
            s.add("links")
    return s


def vergleiche_text(soll: str, ist: str) -> dict:
    """Vergleicht Skripttext und erkannten Text und liefert Befunde in der Form der Clip Prüfung."""
    sw, iw = woerter(soll), woerter(ist)
    ratio = SequenceMatcher(None, sw, iw).ratio() if sw else 1.0
    fehlend = [w for w in sw if w not in iw]
    kritisch_fehlend = [w for w in fehlend if w in {k.replace("ß", "ss") for k in KRITISCH}]
    seiten_soll, seiten_ist = _seiten(sw), _seiten(iw)
    befunde = []
    if seiten_soll and seiten_ist and not (seiten_soll & seiten_ist):
        befunde.append({"stufe": "fehler", "code": "seite_vertauscht",
                        "text": f"Im Skript steht {', '.join(sorted(seiten_soll))}, erkannt wurde {', '.join(sorted(seiten_ist))}. Bitte anhören."})
    elif seiten_soll and not seiten_ist:
        befunde.append({"stufe": "warnung", "code": "seite_nicht_erkannt",
                        "text": "Die Seitenangabe (rechts oder links) wurde nicht erkannt. Bitte anhören."})
    if ratio < 0.85:
        befunde.append({"stufe": "warnung", "code": "text_abweichung",
                        "text": f"Erkannter Text passt nur zu {ratio:.0%} zum Skript. Erkannt: \"{ist[:120]}\""})
    elif kritisch_fehlend:
        befunde.append({"stufe": "warnung", "code": "kritisches_wort_fehlt",
                        "text": "Nicht erkannt: " + ", ".join(sorted(set(kritisch_fehlend))) + ". Bitte anhören."})
    return {"aehnlichkeit": round(ratio, 3), "fehlend": fehlend, "befunde": befunde}


_MODELL_CACHE: dict = {}


def transkribiere(pfad: Path | str, modell: str = "small") -> str:
    """Erkennt gesprochenen deutschen Text. Braucht: pip install faster-whisper."""
    try:
        from faster_whisper import WhisperModel
    except ImportError as e:  # pragma: no cover
        raise RuntimeError(
            "Für die Spracherkennung wird faster-whisper gebraucht: pip install faster-whisper"
        ) from e
    if modell not in _MODELL_CACHE:  # pragma: no cover
        _MODELL_CACHE[modell] = WhisperModel(modell, device="cpu", compute_type="int8")
    segs, _ = _MODELL_CACHE[modell].transcribe(str(pfad), language="de", beam_size=5)  # pragma: no cover
    return " ".join(s.text.strip() for s in segs)  # pragma: no cover
