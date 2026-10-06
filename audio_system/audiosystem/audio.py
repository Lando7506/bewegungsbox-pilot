"""Audio Grundfunktionen: lesen, messen, trimmen, angleichen, schreiben.

Alles mit numpy und der Standardbibliothek. ffmpeg wird nur gebraucht, um m4a, mp3 und ähnliche Formate zu lesen
und um MP3 zu schreiben.
"""
from __future__ import annotations

import shutil
import subprocess
import tempfile
import wave
from pathlib import Path

import numpy as np

from .common import SAMPLE_RATE, SystemFehler

FRAME_MS = 20
EPS = 1e-12


class AudioFehler(SystemFehler):
    pass


def ffmpeg_vorhanden() -> bool:
    return shutil.which("ffmpeg") is not None


def _lese_wav_pcm(pfad: Path):
    with wave.open(str(pfad), "rb") as w:
        kanaele, breite, rate, n = w.getnchannels(), w.getsampwidth(), w.getframerate(), w.getnframes()
        roh = w.readframes(n)
    if breite == 2:
        x = np.frombuffer(roh, dtype="<i2").astype(np.float32) / 32768.0
    elif breite == 3:
        b = np.frombuffer(roh, dtype=np.uint8).reshape(-1, 3).astype(np.int32)
        v = b[:, 0] | (b[:, 1] << 8) | (b[:, 2] << 16)
        v = np.where(v & 0x800000, v - 0x1000000, v)
        x = v.astype(np.float32) / 8388608.0
    elif breite == 4:
        x = np.frombuffer(roh, dtype="<i4").astype(np.float32) / 2147483648.0
    elif breite == 1:
        x = (np.frombuffer(roh, dtype=np.uint8).astype(np.float32) - 128.0) / 128.0
    else:
        raise AudioFehler(f"Nicht unterstützte WAV Bittiefe: {breite * 8}")
    if kanaele > 1:
        x = x.reshape(-1, kanaele).mean(axis=1)
    return x, rate


def _konvertiere_mit_ffmpeg(pfad: Path) -> np.ndarray:
    if not ffmpeg_vorhanden():
        raise AudioFehler(
            f"{pfad.name} kann ohne ffmpeg nicht gelesen werden. Entweder ffmpeg installieren "
            "oder die Aufnahme als WAV (16 oder 24 Bit) exportieren."
        )
    with tempfile.TemporaryDirectory() as tmp:
        ziel = Path(tmp) / "x.wav"
        r = subprocess.run(
            ["ffmpeg", "-y", "-v", "error", "-i", str(pfad), "-ac", "1", "-ar", str(SAMPLE_RATE),
             "-acodec", "pcm_s16le", str(ziel)],
            capture_output=True, text=True,
        )
        if r.returncode != 0 or not ziel.exists():
            raise AudioFehler(f"ffmpeg konnte {pfad.name} nicht lesen: {r.stderr.strip()[:200]}")
        x, _ = _lese_wav_pcm(ziel)
    return x


def lese_audio(pfad: Path | str) -> np.ndarray:
    """Liest eine Datei als Mono Signal mit 44100 Hz (float32, Werte zwischen -1 und 1)."""
    pfad = Path(pfad)
    if not pfad.exists():
        raise AudioFehler(f"Datei fehlt: {pfad}")
    if pfad.suffix.lower() == ".wav":
        try:
            x, rate = _lese_wav_pcm(pfad)
            if rate == SAMPLE_RATE:
                return x
        except (wave.Error, EOFError):
            pass
    return _konvertiere_mit_ffmpeg(pfad)


def schreibe_wav(pfad: Path | str, x: np.ndarray) -> None:
    Path(pfad).parent.mkdir(parents=True, exist_ok=True)
    daten = (np.clip(x, -1.0, 1.0) * 32767.0).astype("<i2")
    with wave.open(str(pfad), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SAMPLE_RATE)
        w.writeframes(daten.tobytes())


def schreibe_mp3(pfad: Path | str, x: np.ndarray, bitrate: str = "128k") -> bool:
    """Schreibt MP3 über ffmpeg. Gibt False zurück, wenn ffmpeg fehlt."""
    if not ffmpeg_vorhanden():
        return False
    with tempfile.TemporaryDirectory() as tmp:
        wav = Path(tmp) / "x.wav"
        schreibe_wav(wav, x)
        r = subprocess.run(
            ["ffmpeg", "-y", "-v", "error", "-i", str(wav), "-codec:a", "libmp3lame", "-b:a", bitrate,
             "-ac", "1", "-map_metadata", "-1", "-fflags", "+bitexact", "-flags:a", "+bitexact", str(pfad)],
            capture_output=True, text=True,
        )
    return r.returncode == 0


def frame_pegel(x: np.ndarray, rate: int = SAMPLE_RATE):
    n = int(rate * FRAME_MS / 1000)
    k = len(x) // n
    if k == 0:
        return np.array([-120.0]), n
    f = x[: k * n].astype(np.float64).reshape(k, n)
    leistung = (f ** 2).mean(axis=1) + EPS
    return 10 * np.log10(leistung), n


def aktivitaetsschwelle(db: np.ndarray) -> float:
    rauschen = np.percentile(db, 3)
    sprache = np.percentile(db, 90)
    return float(max(-65.0, min(rauschen + 12.0, sprache - 20.0)))


def messe(x: np.ndarray, rate: int = SAMPLE_RATE) -> dict:
    """Messwerte eines Clips. Alle Pegel in dBFS."""
    if len(x) == 0:
        return {"leer": True, "dauer_s": 0.0, "sprechdauer_s": 0.0}
    db, n = frame_pegel(x, rate)
    schwelle = aktivitaetsschwelle(db)
    aktiv = db > schwelle
    peak = float(20 * np.log10(np.max(np.abs(x)) + 1e-9))
    rauschen = float(np.percentile(db, 3))
    ergebnis = {
        "leer": False,
        "dauer_s": round(len(x) / rate, 3),
        "peak_dbfs": round(peak, 1),
        "rauschen_dbfs": round(rauschen, 1),
        "clipping_anteil": float(np.mean(np.abs(x) >= 0.999)),
        "schwelle_dbfs": round(schwelle, 1),
    }
    if not aktiv.any():
        ergebnis.update({"stumm": True, "sprechdauer_s": 0.0, "rms_sprache_dbfs": -120.0, "snr_db": 0.0, "laengste_pause_s": 0.0})
        return ergebnis
    erste = int(np.argmax(aktiv))
    letzte = int(len(aktiv) - 1 - np.argmax(aktiv[::-1]))
    rms = float(10 * np.log10(np.mean(10 ** (db[aktiv] / 10))))
    innen = aktiv[erste:letzte + 1]
    laengste, aktuell = 0, 0
    for a in innen:
        aktuell = 0 if a else aktuell + 1
        laengste = max(laengste, aktuell)
    ergebnis.update({
        "stumm": False,
        "sprechdauer_s": round((letzte - erste + 1) * n / rate, 3),
        "beginn_s": round(erste * n / rate, 3),
        "ende_s": round((letzte + 1) * n / rate, 3),
        "rms_sprache_dbfs": round(rms, 1),
        "snr_db": round(rms - rauschen, 1),
        "laengste_pause_s": round(laengste * n / rate, 3),
    })
    return ergebnis


def trimme(x: np.ndarray, rate: int = SAMPLE_RATE, rand_s: float = 0.06) -> np.ndarray:
    """Schneidet Stille vorn und hinten ab und lässt einen kleinen Rand stehen."""
    m = messe(x, rate)
    if m.get("leer") or m.get("stumm"):
        return x[:0]
    a = max(0, int((m["beginn_s"] - rand_s) * rate))
    b = min(len(x), int((m["ende_s"] + rand_s) * rate))
    return x[a:b]


def begrenze(x: np.ndarray, start: float = 0.7, grenze: float = 0.97) -> np.ndarray:
    """Weicher Begrenzer, damit nach der Lautstärke Angleichung nichts übersteuert."""
    y = x.copy()
    a = np.abs(y)
    m = a > start
    if m.any():
        y[m] = np.sign(y[m]) * (start + (grenze - start) * np.tanh((a[m] - start) / (grenze - start)))
    return y


def normalisiere(x: np.ndarray, ziel_rms_dbfs: float = -20.0) -> tuple[np.ndarray, float]:
    """Gleicht die Sprachlautstärke an. Gibt das Ergebnis und die angewendete Verstärkung in dB zurück."""
    m = messe(x)
    if m.get("leer") or m.get("stumm"):
        return x, 0.0
    gain_db = ziel_rms_dbfs - m["rms_sprache_dbfs"]
    y = begrenze(x * (10 ** (gain_db / 20.0)))
    return y.astype(np.float32), float(gain_db)


def fade(x: np.ndarray, ms: float = 15, rate: int = SAMPLE_RATE) -> np.ndarray:
    n = min(int(rate * ms / 1000), len(x) // 2)
    if n <= 0:
        return x
    y = x.copy()
    rampe = 0.5 - 0.5 * np.cos(np.linspace(0, np.pi, n))
    y[:n] *= rampe
    y[-n:] *= rampe[::-1]
    return y


def raumton(n_samples: int, pegel_dbfs: float, seed: int) -> np.ndarray:
    rng = np.random.default_rng(seed)
    return (rng.standard_normal(n_samples) * (10 ** (pegel_dbfs / 20.0))).astype(np.float32)
