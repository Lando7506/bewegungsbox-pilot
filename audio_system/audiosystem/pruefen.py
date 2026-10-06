"""Prüfung der aufgenommenen Clips. Ziel: Lando hört nur an, was auffällt.

Ergebnis je Clip:
  ok        automatisch in Ordnung, geht ohne Anhören in den Bau
  pruefen   bitte anhören, danach mit `abnehmen` bestätigen oder neu aufnehmen
  fehler    neu aufnehmen
  fehlt     Datei nicht vorhanden
"""
from __future__ import annotations

from datetime import datetime
from pathlib import Path
from typing import Callable

from .asr import transkribiere, vergleiche_text
from .audio import AudioFehler, lese_audio, messe
from .clips import clip_manifest, finde_clip_datei, stand_datei
from .common import (
    CLIPS_DIR,
    AUSGABE_DIR,
    datei_hash,
    lade_einstellungen,
    lade_json,
    schreibe_json,
)

REIHENFOLGE = {"ok": 0, "pruefen": 1, "fehler": 2, "fehlt": 3}


def _bef(stufe, code, text):
    return {"stufe": stufe, "code": code, "text": text}


def bewerte_messwerte(info: dict, m: dict, tol_prozent: float, einst: dict) -> list[dict]:
    """Reine Bewertungslogik auf Basis der Messwerte (gut testbar ohne Dateien)."""
    b: list[dict] = []
    if m.get("leer") or m.get("stumm"):
        return [_bef("fehler", "stumm", "Die Datei enthält keine Sprache.")]
    soll = info["soll_dauer_s"]
    dauer = m["sprechdauer_s"]
    tol = max(soll * tol_prozent / 100.0, 1.0)
    abw = abs(dauer - soll)
    if abw > tol:
        stark = abw / soll > 0.35 and abw > 2.0
        b.append(_bef("fehler" if stark else "warnung", "dauer",
                      f"Dauer {dauer:.1f} s, Soll {soll:g} s (erlaubt plus minus {tol:.1f} s)"
                      + (". Vermutlich fehlt etwas oder es ist zu viel gesagt." if stark else ".")))
    if info.get("max_dauer_s") is not None and dauer > info["max_dauer_s"]:
        b.append(_bef("fehler", "cue_zu_lang",
                      f"Cue dauert {dauer:.1f} s, erlaubt sind höchstens {info['max_dauer_s']:g} s bis zum nächsten Cue."))
    if m["clipping_anteil"] > 0.001:
        b.append(_bef("fehler", "uebersteuert", "Die Aufnahme ist übersteuert. Mikrofon leiser stellen oder weiter weg."))
    elif m["clipping_anteil"] > 0.0001:
        b.append(_bef("warnung", "leichtes_clipping", "Einzelne Spitzen sind übersteuert."))
    if m["rms_sprache_dbfs"] < -45:
        b.append(_bef("fehler", "zu_leise", f"Sprache ist sehr leise ({m['rms_sprache_dbfs']:.0f} dBFS)."))
    elif m["rms_sprache_dbfs"] < -38:
        b.append(_bef("warnung", "recht_leise", f"Sprache ist recht leise ({m['rms_sprache_dbfs']:.0f} dBFS)."))
    if m["snr_db"] < 12:
        b.append(_bef("fehler", "rauschen", f"Zu viel Hintergrundgeräusch, Abstand zur Sprache nur {m['snr_db']:.0f} dB."))
    elif m["snr_db"] < einst["min_snr_db"]:
        b.append(_bef("warnung", "rauschen_leicht", f"Etwas Hintergrundgeräusch, Abstand zur Sprache {m['snr_db']:.0f} dB."))
    if m["laengste_pause_s"] > einst["stille_pause_warnung_s"]:
        b.append(_bef("warnung", "lange_pause", f"Pause von {m['laengste_pause_s']:.1f} s mitten im Satz."))
    if dauer > 0:
        wps = info["woerter"] / dauer
        if wps > einst["max_sprechtempo_wps"]:
            b.append(_bef("warnung", "zu_schnell", f"Sprechtempo {wps:.1f} Wörter pro Sekunde, für Senioren eher langsamer."))
        elif wps < einst["min_sprechtempo_wps"] and info["woerter"] > 3:
            b.append(_bef("warnung", "sehr_langsam", f"Sprechtempo nur {wps:.1f} Wörter pro Sekunde."))
    return b


def _status(befunde: list[dict]) -> str:
    if any(x["stufe"] == "fehler" for x in befunde):
        return "fehler"
    if any(x["stufe"] == "warnung" for x in befunde):
        return "pruefen"
    return "ok"


def pruefe_baustein_clips(
    baustein: dict,
    clips_dir: Path | str | None = None,
    einst: dict | None = None,
    asr_modell: str | None = None,
    asr_funktion: Callable[[Path, str], str] | None = None,
) -> dict:
    clips_dir = Path(clips_dir or CLIPS_DIR)
    einst = einst or lade_einstellungen()
    bid = baustein["id"]
    manifest = clip_manifest(baustein, einst)
    stand_p = stand_datei(clips_dir, bid)
    stand = lade_json(stand_p)["clips"] if stand_p.exists() else None
    tol = float(baustein["toleranz_prozent"])
    transkribiere_fn = asr_funktion or transkribiere
    ergebnisse: dict[str, dict] = {}

    for cid, info in manifest["clips"].items():
        if info.get("eigner"):
            continue  # wird beim gemeinsamen Baustein geprüft
        datei = finde_clip_datei(clips_dir, bid, cid)
        eintrag = {"status": "fehlt", "datei": None, "audio_sha256": None, "text_sha": info["text_sha"],
                   "messwerte": {}, "befunde": [], "geprueft_am": datetime.now().isoformat(timespec="seconds")}
        if datei is None:
            eintrag["befunde"].append(_bef("fehler", "fehlt", "Aufnahme fehlt."))
            ergebnisse[cid] = eintrag
            continue
        eintrag["datei"] = datei.name
        eintrag["audio_sha256"] = datei_hash(datei)
        befunde: list[dict] = []
        if stand is not None and stand.get(cid) not in (None, info["text_sha"]):
            befunde.append(_bef("fehler", "text_geaendert", "Der Text wurde nach der Aufnahmeliste geändert. Neu aufnehmen."))
        try:
            m = messe(lese_audio(datei))
            befunde += bewerte_messwerte(info, m, tol, einst)
            eintrag["messwerte"] = {k: m.get(k) for k in
                                    ("sprechdauer_s", "rms_sprache_dbfs", "rauschen_dbfs", "snr_db", "peak_dbfs",
                                     "clipping_anteil", "laengste_pause_s")}
            if asr_modell and not any(x["code"] == "stumm" for x in befunde):
                ist = transkribiere_fn(datei, asr_modell)
                befunde += vergleiche_text(info["text"], ist)["befunde"]
                eintrag["erkannter_text"] = ist
        except AudioFehler as e:
            befunde.append(_bef("fehler", "nicht_lesbar", str(e)))
        eintrag["befunde"] = befunde
        eintrag["status"] = _status(befunde)
        ergebnisse[cid] = eintrag

    zaehlung = {s: sum(1 for e in ergebnisse.values() if e["status"] == s) for s in REIHENFOLGE}
    gesamt = {
        "baustein": bid,
        "textfassung": baustein.get("version"),
        "erzeugt": datetime.now().isoformat(timespec="seconds"),
        "asr": asr_modell,
        "keine_aufnahmeliste": stand is None,
        "zaehlung": zaehlung,
        "clips": ergebnisse,
    }
    schreibe_json(clips_dir / bid / "pruefung.json", gesamt)
    return gesamt


def schreibe_pruefbericht(baustein: dict, ergebnis: dict, ausgabe_dir: Path | str | None = None, abnahmen: dict | None = None) -> Path:
    ausgabe_dir = Path(ausgabe_dir or AUSGABE_DIR)
    ausgabe_dir.mkdir(parents=True, exist_ok=True)
    pfad = ausgabe_dir / f"pruefbericht_{baustein['id']}.md"
    abnahmen = abnahmen or {}
    manifest = clip_manifest(baustein)["clips"]
    z = ergebnis["zaehlung"]
    zeilen = [
        f"# Prüfbericht {baustein['id']}: {baustein['titel']}",
        "",
        f"Textfassung {baustein.get('version')}. {len(ergebnis['clips'])} Clips: "
        f"{z['ok']} in Ordnung, {z['pruefen']} zum Anhören, {z['fehler']} neu aufnehmen, {z['fehlt']} fehlen.",
        "",
    ]
    if ergebnis.get("keine_aufnahmeliste"):
        zeilen += ["Hinweis: Für diesen Baustein wurde noch keine Aufnahmeliste erzeugt, deshalb konnte nicht geprüft werden, "
                   "ob sich Texte nach der Aufnahme geändert haben.", ""]

    def block(titel, status, anleitung):
        eintraege = [(cid, e) for cid, e in ergebnis["clips"].items() if e["status"] == status]
        if not eintraege:
            return
        zeilen.extend([f"## {titel} ({len(eintraege)})", "", anleitung, ""])
        for cid, e in eintraege:
            abgenommen = cid in abnahmen and abnahmen[cid].get("audio_sha256") == e["audio_sha256"]
            marke = " (angehört und abgenommen)" if abgenommen else ""
            zeilen.append(f"- **{cid}**{marke}: \"{manifest[cid]['text']}\"")
            for bf in e["befunde"]:
                zeilen.append(f"    * {bf['text']}")
            if e.get("erkannter_text"):
                zeilen.append(f"    * Erkannt: \"{e['erkannter_text']}\"")
        zeilen.append("")

    block("Neu aufnehmen", "fehler", "Diese Clips sind nicht verwendbar. Nur diese Dateien ersetzen.")
    block("Fehlt", "fehlt", "Diese Dateien wurden nicht gefunden.")
    block("Bitte anhören", "pruefen",
          "Nur diese Clips musst du dir anhören. Wenn sie gut klingen: `python -m audiosystem abnehmen CLIP_ID --von DEINNAME`.")
    zeilen.append(f"{z['ok']} Clips sind automatisch in Ordnung und müssen nicht angehört werden.")
    pfad.write_text("\n".join(zeilen) + "\n", encoding="utf-8")
    return pfad


def abnahmen_datei(clips_dir: Path | str, baustein_id: str) -> Path:
    return Path(clips_dir) / baustein_id / "abnahmen.json"


def lade_abnahmen(clips_dir: Path | str, baustein_id: str) -> dict:
    p = abnahmen_datei(clips_dir, baustein_id)
    return lade_json(p) if p.exists() else {}


def nimm_ab(clips_dir: Path | str, baustein_id: str, clip_ids: list[str], von: str) -> list[str]:
    """Bestätigt, dass ein auffälliger Clip angehört wurde und passt. Gilt nur für genau diese Aufnahme."""
    pruef_p = Path(clips_dir) / baustein_id / "pruefung.json"
    if not pruef_p.exists():
        raise AudioFehler("Es gibt noch keine Prüfung. Erst `clips` ausführen.")
    pruef = lade_json(pruef_p)["clips"]
    abnahmen = lade_abnahmen(clips_dir, baustein_id)
    erledigt = []
    for cid in clip_ids:
        e = pruef.get(cid)
        if e is None:
            raise AudioFehler(f"Clip {cid} ist unbekannt.")
        if e["status"] != "pruefen":
            raise AudioFehler(f"Clip {cid} hat den Status '{e['status']}'. Abnehmen geht nur bei 'pruefen'.")
        abnahmen[cid] = {"audio_sha256": e["audio_sha256"], "text_sha": e["text_sha"], "von": von,
                         "am": datetime.now().isoformat(timespec="seconds")}
        erledigt.append(cid)
    schreibe_json(abnahmen_datei(clips_dir, baustein_id), abnahmen)
    return erledigt


def clip_bereit(clips_dir: Path | str, baustein_id: str, clip_id: str, text_sha: str, pruefung: dict, abnahmen: dict) -> tuple[bool, str]:
    """Darf dieser Clip in ein Kundenaudio? Prüft Datei, Text und Prüfstatus gegen den aktuellen Stand."""
    datei = finde_clip_datei(clips_dir, baustein_id, clip_id)
    if datei is None:
        return False, "Aufnahme fehlt"
    e = pruefung.get("clips", {}).get(clip_id)
    if e is None:
        return False, "Clip wurde nie geprüft"
    if e["audio_sha256"] != datei_hash(datei):
        return False, "Datei wurde nach der Prüfung verändert, bitte erneut prüfen"
    if e["text_sha"] != text_sha:
        return False, "Text wurde nach der Prüfung geändert, bitte neu aufnehmen und prüfen"
    if e["status"] == "ok":
        return True, "ok"
    if e["status"] == "pruefen":
        a = abnahmen.get(clip_id)
        if a and a["audio_sha256"] == e["audio_sha256"]:
            return True, f"abgenommen von {a['von']}"
        return False, "auffällig und noch nicht abgenommen"
    return False, f"Status {e['status']}"
