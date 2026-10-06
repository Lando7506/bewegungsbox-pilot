"""Clip Verzeichnis eines Bausteins: welche Sätze müssen aufgenommen werden, wie lang, wo kommen sie vor.

Jeder gesprochene Satz und jeder Cue in der Haltephase ist ein eigener Clip. Gleicher Text im selben
Baustein wird nur einmal aufgenommen (z. B. "Noch zehn Sekunden" für rechtes und linkes Bein).
"""
from __future__ import annotations

import csv
import shutil
from datetime import datetime
from pathlib import Path

from .common import (
    WDH_MAX,
    ZAHLEN_ID,
    ZAHLWOERTER,
    zahlen_clip_id,
    mit_wiederholungen,
    block_cues,
    ist_block,
    CLIPS_DIR,
    AUSGABE_DIR,
    lade_einstellungen,
    lade_json,
    norm_text,
    schreibe_json,
    segmente,
    text_hash,
    wortzahl,
)

AUDIO_ENDUNGEN = (".wav", ".m4a", ".mp3", ".aiff", ".aif", ".flac", ".ogg", ".mp4", ".caf", ".opus")


def tempo(baustein: dict) -> float:
    return float(baustein.get("sprechtempo_woerter_pro_sekunde", 2))


def cue_aktiv(cue: dict, zustaende: set[str] | frozenset[str]) -> bool:
    """Optionale Cues fallen weg, wenn ein Ausschlusszustand vorliegt (oder ein Pflichtzustand fehlt)."""
    z = set(zustaende)
    if z & set(cue.get("ausschluss_bei", [])):
        return False
    nur = cue.get("nur_bei")
    if nur and not (z & set(nur)):
        return False
    return True


def effektiver_text(item: dict, zustaende: set[str] | frozenset[str], standard_soll: float | None = None):
    """Gibt (text, soll_dauer_s, variante_zustand) zurück. Varianten gelten in Listenreihenfolge."""
    for v in item.get("varianten", []):
        if v["bei_zustand"] in zustaende:
            soll = v.get("soll_dauer_s", item.get("soll_dauer_s", standard_soll))
            return v["text"], soll, v["bei_zustand"]
    return item["text"], item.get("soll_dauer_s", standard_soll), None


def clip_manifest(baustein: dict, einst: dict | None = None) -> dict:
    """Baut das Clip Verzeichnis. Rückgabe: {"clips": {id: info}, "text_zu_id": {normtext: id}}."""
    einst = einst or lade_einstellungen()
    # Aufnahmeliste und Clip Prüfung gelten für die größte erlaubte Wiederholungszahl, damit eine Person mit mehr
    # Wiederholungen keine fehlenden Clips findet. Die Clip Nummern ändern sich dadurch nicht.
    baustein = mit_wiederholungen(baustein, WDH_MAX)
    bid = baustein["id"]
    wps = tempo(baustein)
    clips: dict[str, dict] = {}
    text_zu_id: dict[str, str] = {}

    def registriere(basis_id, text, soll, typ, ort, max_dauer=None, variante_fuer=None, optional=False, eigner=None):
        key = norm_text(text)
        if key in text_zu_id:
            cid = text_zu_id[key]
            info = clips[cid]
            info["orte"].append(ort)
            if max_dauer is not None:
                info["max_dauer_s"] = max_dauer if info.get("max_dauer_s") is None else min(info["max_dauer_s"], max_dauer)
            if not optional:
                info["optional"] = False
            return cid
        text_zu_id[key] = basis_id
        clips[basis_id] = {
            "id": basis_id,
            "text": key,
            "text_sha": text_hash(key),
            "typ": typ,
            "soll_dauer_s": round(float(soll), 2),
            "max_dauer_s": max_dauer,
            "woerter": wortzahl(key),
            "variante_fuer": variante_fuer,
            "optional": optional,
            "orte": [ort],
        }
        if eigner:
            clips[basis_id]["eigner"] = eigner  # Aufnahme liegt im gemeinsamen Baustein, nicht in diesem
        return basis_id

    for teil, i, seg in segmente(baustein):
        if seg["typ"] == "sprechen":
            basis = f"{bid}_{teil['id']}_s{i:02d}"
            ort = {"teil": teil["id"], "index": i}
            registriere(basis, seg["text"], seg["soll_dauer_s"], "sprechen", ort)
            for v in seg.get("varianten", []):
                soll = v.get("soll_dauer_s", seg["soll_dauer_s"])
                registriere(f"{basis}_v_{v['bei_zustand']}", v["text"], soll, "sprechen", ort, variante_fuer=v["bei_zustand"])
        elif ist_block(seg):
            cues = block_cues(seg)
            for k, cue in enumerate(cues):
                if k + 1 < len(cues):
                    max_d = cues[k + 1]["bei_s"] - cue["bei_s"] - einst["cue_sicherheitsabstand_s"]
                else:
                    max_d = seg["soll_dauer_s"] - cue["bei_s"] - 0.3
                max_d = round(max_d, 2)
                basis = f"{bid}_{teil['id']}_s{i:02d}_c{int(cue['bei_s']):03d}" if seg["typ"] != "halten" else f"{bid}_{teil['id']}_c{int(cue['bei_s']):03d}"
                ort = {"teil": teil["id"], "index": i, "bei_s": cue["bei_s"]}
                soll_cue = cue.get("soll_dauer_s", max(1.0, wortzahl(cue["text"]) / tempo(baustein)))
                opt = bool(cue.get("optional"))
                if cue.get("erzeugt") and seg.get("modus") == "zaehlen" and cue["text"] in ZAHLWOERTER and bid != ZAHLEN_ID:
                    registriere(zahlen_clip_id(cue["text"]), cue["text"], soll_cue, "cue", ort, max_dauer=max_d, eigner=ZAHLEN_ID)
                else:
                    registriere(basis, cue["text"], soll_cue, "cue", ort, max_dauer=max_d, optional=opt)
                for v in cue.get("varianten", []):
                    soll_v = v.get("soll_dauer_s", max(1.0, wortzahl(v["text"]) / tempo(baustein)))
                    registriere(f"{basis}_v_{v['bei_zustand']}", v["text"], soll_v, "cue", ort, max_dauer=max_d, variante_fuer=v["bei_zustand"])
    return {"clips": clips, "text_zu_id": text_zu_id}


def finde_clip_datei(clips_dir: Path | str, baustein_id: str, clip_id: str) -> Path | None:
    ordner = Path(clips_dir) / baustein_id
    for endung in AUDIO_ENDUNGEN:
        p = ordner / f"{clip_id}{endung}"
        if p.exists():
            return p
    return None


def stand_datei(clips_dir: Path | str, baustein_id: str) -> Path:
    return Path(clips_dir) / baustein_id / "clips_stand.json"


def schreibe_aufnahmeliste(
    baustein: dict,
    clips_dir: Path | str | None = None,
    ausgabe_dir: Path | str | None = None,
    einst: dict | None = None,
) -> dict:
    """Erzeugt die Aufnahmeliste (Markdown und CSV) und hält fest, welcher Text zu welchem Clip gehört.

    Hat sich der Text eines Clips seit der letzten Liste geändert, wird eine vorhandene Aufnahme in den
    Ordner _veraltet verschoben. So kann nie eine Aufnahme mit altem Text in ein Audio rutschen.
    """
    clips_dir = Path(clips_dir or CLIPS_DIR)
    ausgabe_dir = Path(ausgabe_dir or AUSGABE_DIR)
    einst = einst or lade_einstellungen()
    bid = baustein["id"]
    manifest = clip_manifest(baustein, einst)
    alle_clips = manifest["clips"]
    clips = {cid: i for cid, i in alle_clips.items() if not i.get("eigner")}
    geteilt = len(alle_clips) - len(clips)

    stand_pfad = stand_datei(clips_dir, bid)
    alter_stand = lade_json(stand_pfad)["clips"] if stand_pfad.exists() else {}
    veraltet = []
    for cid, info in clips.items():
        if cid in alter_stand and alter_stand[cid] != info["text_sha"]:
            datei = finde_clip_datei(clips_dir, bid, cid)
            if datei:
                ziel_ordner = clips_dir / bid / "_veraltet"
                ziel_ordner.mkdir(parents=True, exist_ok=True)
                stempel = datetime.now().strftime("%Y%m%d_%H%M%S")
                shutil.move(str(datei), str(ziel_ordner / f"{datei.stem}_{stempel}{datei.suffix}"))
                veraltet.append(cid)
    (clips_dir / bid).mkdir(parents=True, exist_ok=True)
    schreibe_json(stand_pfad, {
        "baustein": bid,
        "textfassung": baustein.get("version"),
        "erzeugt": datetime.now().isoformat(timespec="seconds"),
        "clips": {cid: info["text_sha"] for cid, info in clips.items()},
    })

    ausgabe_dir.mkdir(parents=True, exist_ok=True)
    md_pfad = ausgabe_dir / f"aufnahmeliste_{bid}.md"
    csv_pfad = ausgabe_dir / f"aufnahmeliste_{bid}.csv"

    zeilen = [
        f"# Aufnahmeliste {bid}: {baustein['titel']}",
        "",
        f"Textfassung {baustein.get('version')}, Status: {baustein.get('status')}. Insgesamt {len(clips)} Clips.",
        "",
        "## So nimmst du auf",
        "",
        "- Jeder Satz ist eine eigene Datei. Der Dateiname ist genau die ID aus der Liste, zum Beispiel "
        f"`{next(iter(clips))}.wav`. WAV, m4a oder mp3 ist egal.",
        "- Alle Dateien eines Bausteins in einer Sitzung aufnehmen: gleicher Raum, gleicher Abstand zum Mikrofon.",
        "- Sprich ruhig, etwa zwei Wörter pro Sekunde. Vor und nach dem Satz eine Sekunde Stille lassen, das schneidet das Skript weg.",
        "- Bei einem Versprecher nur diese eine Datei neu aufnehmen.",
        "- Cues in der Haltephase haben eine Höchstdauer, damit sie nicht in den nächsten Cue hineinreichen.",
        f"- Ablegen in: `clips/{bid}/`",
        *([f"- Die Zahlen eins bis zwölf sind hier nicht dabei. Sie liegen im gemeinsamen Baustein ZAHLEN (Aufnahmeliste ZAHLEN) und werden von allen Bausteinen genutzt."] if geteilt else []),
        "",
    ]
    gruppen: dict[str, list[dict]] = {}
    for info in clips.values():
        gruppen.setdefault(info["orte"][0]["teil"], []).append(info)
    for teil in baustein["teile"]:
        liste = gruppen.get(teil["id"], [])
        if not liste:
            continue
        titel = teil["id"] + (f" ({teil['seite']})" if teil.get("seite") else "")
        zeilen += [f"## {titel}", ""]
        for info in liste:
            ziel = f"Ziel etwa {info['soll_dauer_s']:g} Sekunden"
            if info["typ"] == "cue":
                ziel += f", höchstens {info['max_dauer_s']:g} Sekunden"
                zeit = ", ".join(sorted({f"{int(o['bei_s'] // 60)}:{int(o['bei_s'] % 60):02d}" for o in info["orte"] if 'bei_s' in o}))
                ziel += f", kommt in der Haltephase bei {zeit}"
            extra = ""
            if info["optional"]:
                extra += " Optionaler Cue, wird nicht für jeden Kunden eingebaut."
            if info["variante_fuer"]:
                extra += f" Variante für: {info['variante_fuer']}."
            mehrfach = sorted({o["teil"] for o in info["orte"]})
            if len(mehrfach) > 1:
                extra += f" Wird in mehreren Teilen verwendet ({', '.join(mehrfach)}), nur einmal aufnehmen."
            zeilen += [f"- [ ] **{info['id']}** ({ziel}).{extra}", f"      \"{info['text']}\"", ""]
    gesamt_soll = sum(i["soll_dauer_s"] for i in clips.values() if i["typ"] == "sprechen")
    zeilen += [f"Reine Sprechzeit aller Sätze (ohne Cues): etwa {gesamt_soll:.0f} Sekunden.", ""]
    md_pfad.write_text("\n".join(zeilen), encoding="utf-8")

    with open(csv_pfad, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f, delimiter=";")
        w.writerow(["clip_id", "datei", "teil", "typ", "soll_dauer_s", "max_dauer_s", "woerter", "optional", "variante_fuer", "text"])
        for info in clips.values():
            w.writerow([info["id"], f"{info['id']}.wav", info["orte"][0]["teil"], info["typ"], info["soll_dauer_s"],
                        info["max_dauer_s"] if info["max_dauer_s"] is not None else "", info["woerter"],
                        "ja" if info["optional"] else "", info["variante_fuer"] or "", info["text"]])
    return {"anzahl_clips": len(clips), "markdown": md_pfad, "csv": csv_pfad, "veraltet_verschoben": veraltet}
