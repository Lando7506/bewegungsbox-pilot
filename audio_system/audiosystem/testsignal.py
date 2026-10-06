"""Künstliche Testclips, damit sich das ganze System ohne echte Aufnahme ausprobieren lässt.

Das Signal ist kein Sprechen, aber es hat eine Silbenhüllkurve, Wortlücken, etwas Rauschen und Stille
vorn und hinten. Dazu lassen sich gezielt Fehler einbauen, um zu sehen, ob die Prüfung sie findet.
"""
from __future__ import annotations

from pathlib import Path

import numpy as np

from .audio import schreibe_wav
from .clips import clip_manifest
from .common import CLIPS_DIR, SAMPLE_RATE

FEHLERARTEN = ("zu_kurz", "zu_lang", "zu_leise", "uebersteuert", "rauschen", "lange_pause", "fehlt", "leicht_lang")


def sprachaehnlich(
    dauer_s: float,
    seed: int = 0,
    rms_dbfs: float = -24.0,
    rauschen_dbfs: float = -64.0,
    stille_vorn_s: float = 0.4,
    stille_hinten_s: float = 0.5,
    lange_pause_s: float = 0.0,
) -> np.ndarray:
    rng = np.random.default_rng(seed)
    n = int(dauer_s * SAMPLE_RATE)
    t = np.arange(n) / SAMPLE_RATE
    f0 = 125 + 18 * np.sin(2 * np.pi * 0.6 * t + rng.uniform(0, 6))
    phase = 2 * np.pi * np.cumsum(f0) / SAMPLE_RATE
    traeger = sum(np.sin(k * phase) / (k ** 1.1) for k in range(1, 14))
    silbe = np.clip(np.sin(2 * np.pi * 4.2 * t + rng.uniform(0, 6)), 0, None) ** 0.6
    wort = 1.0 - 0.9 * (np.sin(2 * np.pi * 0.9 * t + rng.uniform(0, 6)) > 0.97)
    huelle = 0.15 + 0.85 * silbe * wort
    sprache = traeger * huelle
    if lange_pause_s > 0:
        mitte = n // 2
        a, b = mitte, min(n, mitte + int(lange_pause_s * SAMPLE_RATE))
        sprache = np.concatenate([sprache[:a], np.zeros(b - a), sprache[a:]])
    aktuell = np.sqrt(np.mean(sprache ** 2) + 1e-12)
    sprache = sprache * (10 ** (rms_dbfs / 20) / aktuell)
    vorn = np.zeros(int(stille_vorn_s * SAMPLE_RATE))
    hinten = np.zeros(int(stille_hinten_s * SAMPLE_RATE))
    signal = np.concatenate([vorn, sprache, hinten])
    signal = signal + rng.standard_normal(len(signal)) * 10 ** (rauschen_dbfs / 20)
    return signal.astype(np.float32)


def erzeuge_testclips(
    baustein: dict,
    clips_dir: Path | str | None = None,
    fehler: dict[str, str] | None = None,
    seed: int = 1,
    streuung: float = 0.04,
) -> dict:
    """Erzeugt für jeden Clip eine Datei mit etwa der Sollzeit.

    fehler: {clip_id: Fehlerart} baut absichtlich einen Fehler ein.
    """
    clips_dir = Path(clips_dir or CLIPS_DIR)
    fehler = fehler or {}
    manifest = clip_manifest(baustein)
    rng = np.random.default_rng(seed)
    erzeugt = []
    for k, (cid, info) in enumerate(manifest["clips"].items()):
        art = fehler.get(cid)
        if info.get("eigner"):
            continue
        if art == "fehlt":
            continue
        soll = info["soll_dauer_s"]
        faktor = 1.0 + rng.uniform(-streuung, streuung)
        kwargs = {}
        if art == "zu_kurz":
            faktor = 0.5
        elif art == "zu_lang":
            faktor = 1.7
        elif art == "leicht_lang":
            faktor = 1.18
        elif art == "zu_leise":
            kwargs["rms_dbfs"] = -52.0
        elif art == "uebersteuert":
            kwargs["rms_dbfs"] = -4.0
        elif art == "rauschen":
            kwargs["rauschen_dbfs"] = -30.0
            kwargs["rms_dbfs"] = -26.0
        elif art == "lange_pause":
            kwargs["lange_pause_s"] = 3.5
        if "rms_dbfs" not in kwargs:
            kwargs["rms_dbfs"] = -24.0 + rng.uniform(-6, 6)
        x = sprachaehnlich(soll * faktor, seed=seed * 1000 + k, **kwargs)
        if art == "uebersteuert":
            x = np.clip(x * 6.0, -1.0, 1.0)
        ziel = clips_dir / baustein["id"] / f"{cid}.wav"
        schreibe_wav(ziel, x)
        erzeugt.append(cid)
    return {"erzeugt": erzeugt, "anzahl": len(erzeugt)}
