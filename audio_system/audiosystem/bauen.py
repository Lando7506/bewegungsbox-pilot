"""Zusammenbau: aus geprüften Einzelclips und dem Plan entstehen die fertigen Audios und die Playlist.

Pausen und Haltezeiten sind exakte Stille (bzw. leiser Raumton) in der Länge aus dem Baustein. Cues landen
auf die Sekunde genau in der Haltephase. Nichts wird von Hand geschnitten.
"""
from __future__ import annotations

import hashlib
from datetime import datetime
from pathlib import Path

import numpy as np

from .audio import fade, lese_audio, messe, normalisiere, raumton, schreibe_mp3, schreibe_wav, trimme
from .clips import clip_manifest, cue_aktiv, effektiver_text, finde_clip_datei
from .common import (
    mit_wiederholungen,
    block_cues,
    ist_block,
    AUSGABE_DIR,
    CLIPS_DIR,
    SAMPLE_RATE,
    SYSTEM_VERSION,
    SystemFehler,
    datei_hash,
    formatiere_zeit,
    lade_einstellungen,
    lade_json,
    norm_text,
    schreibe_json,
    segmente,
)
from .lint import FEHLER, pruefe_alles
from .pruefen import clip_bereit, lade_abnahmen


def lade_profil(pfad: Path | str, profil_id: str | None = None) -> dict:
    daten = lade_json(pfad)
    if "profile" in daten:
        if not profil_id:
            raise SystemFehler("Die Datei enthält mehrere Profile, bitte --profil angeben.")
        for p in daten["profile"]:
            if p["id"] == profil_id:
                return p
        raise SystemFehler(f"Profil {profil_id} nicht in {pfad} gefunden.")
    return daten


def benoetigte_clips(baustein: dict, zustaende: set[str], text_zu_id: dict) -> dict[str, str]:
    """Alle Clip IDs, die für dieses Profil gebraucht werden. Rückgabe: {clip_id: text}."""
    ids: dict[str, str] = {}
    for teil, i, seg in segmente(baustein):
        if seg["typ"] == "sprechen":
            text, _, _ = effektiver_text(seg, zustaende)
            ids[text_zu_id[norm_text(text)]] = norm_text(text)
        elif ist_block(seg):
            for cue in block_cues(seg):
                if cue_aktiv(cue, zustaende):
                    text, _, _ = effektiver_text(cue, zustaende)
                    ids[text_zu_id[norm_text(text)]] = norm_text(text)
    return ids


def verarbeite_clip(rohdaten: np.ndarray, einst: dict) -> tuple[np.ndarray, dict]:
    """Trimmen, Lautstärke angleichen, kurze Ein und Ausblendung."""
    roh = messe(rohdaten)
    getrimmt = trimme(rohdaten)
    norm, gain = normalisiere(getrimmt, einst["ziel_rms_dbfs"])
    ergebnis = fade(norm, einst["fade_ms"])
    return ergebnis, {"gain_db": round(gain, 1), "rauschen_nach_gain_dbfs": roh.get("rauschen_dbfs", -90.0) + gain}


def setze_baustein_zusammen(
    baustein: dict,
    zustaende: set[str],
    clip_audio: dict[str, np.ndarray],
    text_zu_id: dict,
    einst: dict,
) -> dict:
    """Setzt einen Baustein aus Clips, Pausen und Haltephasen zusammen. Gibt Audio und Zeitplan zurück."""
    rate = SAMPLE_RATE
    vorlauf = float(einst["vorlauf_s"])
    t = 0.0
    platziert: list[tuple[float, np.ndarray]] = []
    zeitplan: list[dict] = []

    for teil, i, seg in segmente(baustein):
        if seg["typ"] == "sprechen":
            text, soll, variante = effektiver_text(seg, zustaende)
            cid = text_zu_id[norm_text(text)]
            arr = clip_audio[cid]
            dauer = len(arr) / rate
            platziert.append((t, arr))
            zeitplan.append({"typ": "sprechen", "teil": teil["id"], "clip": cid, "variante": variante, "text": norm_text(text),
                             "start_s": round(vorlauf + t, 3), "ende_s": round(vorlauf + t + dauer, 3)})
            t += dauer
        elif seg["typ"] == "pause":
            zeitplan.append({"typ": "pause", "teil": teil["id"], "start_s": round(vorlauf + t, 3),
                             "ende_s": round(vorlauf + t + seg["soll_dauer_s"], 3)})
            t += seg["soll_dauer_s"]
        elif ist_block(seg):
            start, ende = t, t + seg["soll_dauer_s"]
            cue_liste, letztes_ende = [], None
            for cue in block_cues(seg):
                if not cue_aktiv(cue, zustaende):
                    continue
                text, _, variante = effektiver_text(cue, zustaende)
                cid = text_zu_id[norm_text(text)]
                arr = clip_audio[cid]
                c_start = start + cue["bei_s"]
                c_ende = c_start + len(arr) / rate
                if c_ende > ende + 1e-6:
                    raise SystemFehler(f"{baustein['id']}: Cue {cid} reicht über das Ende der Haltephase oder Zeitblock hinaus ({c_ende - start:.1f} s von {seg['soll_dauer_s']} s).")
                if letztes_ende is not None and c_start < letztes_ende - 1e-6:
                    raise SystemFehler(f"{baustein['id']}: Cue {cid} überschneidet sich mit dem vorherigen Cue.")
                platziert.append((c_start, arr))
                cue_liste.append({"clip": cid, "variante": variante, "text": norm_text(text), "bei_s": cue["bei_s"],
                                  "start_s": round(vorlauf + c_start, 3), "ende_s": round(vorlauf + c_ende, 3)})
                letztes_ende = c_ende
            zeitplan.append({"typ": seg["typ"], "teil": teil["id"], "start_s": round(vorlauf + start, 3),
                             "ende_s": round(vorlauf + ende, 3), "cues": cue_liste})
            t = ende

    gesamt_s = vorlauf + t + float(einst["nachlauf_s"])
    n = int(round(gesamt_s * rate))
    audio = np.zeros(n, dtype=np.float32)
    for start, arr in platziert:
        a = int(round((vorlauf + start) * rate))
        audio[a:a + len(arr)] += arr[: max(0, n - a)]
    return {"audio": audio, "zeitplan": zeitplan, "kern_dauer_s": round(t, 3), "gesamt_dauer_s": round(gesamt_s, 3)}


def _seed(*teile: str) -> int:
    return int(hashlib.sha256("|".join(teile).encode("utf-8")).hexdigest()[:8], 16)


def baue_plan(
    plan: dict,
    bausteine: dict[str, dict],
    stufen: dict,
    clips_dir: Path | str | None = None,
    ausgabe_dir: Path | str | None = None,
    einst: dict | None = None,
) -> dict:
    """Baut alle Audios eines Plans und schreibt Playlist, Prüfbogen und Planblatt Entwurf."""
    clips_dir = Path(clips_dir or CLIPS_DIR)
    ausgabe_dir = Path(ausgabe_dir or AUSGABE_DIR)
    einst = einst or lade_einstellungen()

    if plan["status"] != "bereit":
        raise SystemFehler(
            f"Plan hat den Status '{plan['status']}' und wird nicht automatisch gebaut. "
            + " ".join(plan["offene_punkte"])
        )
    zustaende = set(plan["zustaende"])
    entwurf = plan["entwurf"]

    # 1. Tore: Texte ohne Fehler, Clips geprüft.
    probleme: list[str] = []
    vorbereitet = []
    staende: dict[str, tuple[dict, dict]] = {}  # Baustein ID -> (Prüfung, Abnahmen), auch für gemeinsame Clips
    for e in plan["bausteine"]:
        b = mit_wiederholungen(bausteine[e["id"]], plan.get("wiederholungen_pro_satz"))
        lint_fehler = [x for x in pruefe_alles(b, stufen, einst, e["id"]) if x["stufe"] == FEHLER]
        for x in lint_fehler:
            probleme.append(f"{e['id']}: Textprüfung: {x['text']}")
        manifest = clip_manifest(b, einst)
        ids = benoetigte_clips(b, zustaende, manifest["text_zu_id"])
        besitzer = {e["id"], *(manifest["clips"][c].get("eigner") or e["id"] for c in ids)}
        fehlt_pruefung = False
        for o in sorted(besitzer):
            if o not in staende:
                pruef_p = clips_dir / o / "pruefung.json"
                if pruef_p.exists():
                    staende[o] = (lade_json(pruef_p), lade_abnahmen(clips_dir, o))
            if o not in staende:
                probleme.append(f"{e['id']}: Es gibt keine Clip Prüfung für {o}. Erst `clips {o}` ausführen.")
                fehlt_pruefung = True
        if fehlt_pruefung:
            continue
        for cid in ids:
            o = manifest["clips"][cid].get("eigner") or e["id"]
            ok, grund = clip_bereit(clips_dir, o, cid, manifest["clips"][cid]["text_sha"], *staende[o])
            if not ok:
                probleme.append(f"{cid}: {grund}")
        vorbereitet.append((e, b, manifest, ids))
    if probleme:
        raise SystemFehler("Der Plan kann noch nicht gebaut werden:\n  " + "\n  ".join(probleme))

    # 2. Bauen.
    ziel = ausgabe_dir / (plan["plan_id"] + ("_ENTWURF" if entwurf else ""))
    ziel.mkdir(parents=True, exist_ok=True)
    praefix = "ENTWURF_" if entwurf else ""
    ausgaben, spuren, clip_protokoll = [], [], []
    warnungen: list[str] = []
    rate = SAMPLE_RATE

    for nr, (e, b, manifest, ids) in enumerate(vorbereitet, start=1):
        clip_audio, rauschpegel = {}, []
        for cid in ids:
            o = manifest["clips"][cid].get("eigner") or e["id"]
            pruefung, abnahmen = staende[o]
            datei = finde_clip_datei(clips_dir, o, cid)
            verarbeitet, info = verarbeite_clip(lese_audio(datei), einst)
            clip_audio[cid] = verarbeitet
            rauschpegel.append(info["rauschen_nach_gain_dbfs"])
            ok, grund = clip_bereit(clips_dir, o, cid, manifest["clips"][cid]["text_sha"], pruefung, abnahmen)
            clip_protokoll.append({"baustein": e["id"], "herkunft": o, "clip": cid, "freigabe": grund, "gain_db": info["gain_db"],
                                   "audio_sha256": pruefung["clips"][cid]["audio_sha256"]})
        ergebnis = setze_baustein_zusammen(b, zustaende, clip_audio, manifest["text_zu_id"], einst)
        audio = ergebnis["audio"]
        if einst.get("raumton", True) and rauschpegel:
            pegel = float(np.clip(np.median(rauschpegel), einst["raumton_min_dbfs"], einst["raumton_max_dbfs"]))
            audio = audio + raumton(len(audio), pegel, _seed(plan["plan_id"], e["id"]))
        abw = abs(ergebnis["kern_dauer_s"] - e["soll_dauer_s"]) / e["soll_dauer_s"] * 100
        if abw > b["toleranz_prozent"]:
            warnungen.append(f"{e['id']}: Gesamtdauer {ergebnis['kern_dauer_s']:.1f} s weicht {abw:.0f} Prozent vom Soll {e['soll_dauer_s']:.1f} s ab.")

        basis = ziel / f"{praefix}{nr:02d}_{e['id']}"
        dateien = []
        if "wav" in einst["formate"]:
            schreibe_wav(basis.with_suffix(".wav"), audio)
            dateien.append(basis.with_suffix(".wav"))
            kontrolle = lese_audio(basis.with_suffix(".wav"))
            if abs(len(kontrolle) - len(audio)) > 1:
                raise SystemFehler(f"{e['id']}: Kontrolllesen der WAV Datei ergibt eine andere Länge als gebaut.")
        if "mp3" in einst["formate"]:
            if schreibe_mp3(basis.with_suffix(".mp3"), audio, einst["mp3_bitrate"]):
                dateien.append(basis.with_suffix(".mp3"))
            else:
                warnungen.append("MP3 konnte nicht geschrieben werden (ffmpeg fehlt oder hat einen Fehler). Es gibt nur WAV.")
        spuren.append((audio, e, ergebnis, dateien))
        ausgaben.append({
            "nr": nr, "baustein": e["id"], "titel": e["titel"],
            "dateien": [{"name": d.name, "sha256": datei_hash(d)} for d in dateien],
            "kern_dauer_s": ergebnis["kern_dauer_s"], "gesamt_dauer_s": ergebnis["gesamt_dauer_s"],
            "soll_dauer_s": e["soll_dauer_s"], "zeitplan": ergebnis["zeitplan"],
        })

    # 3. Playlist und Gesamtdatei.
    pause_s = float(einst["pause_zwischen_bausteinen_s"])
    teile, offset = [], 0.0
    for k, (audio, e, ergebnis, dateien) in enumerate(spuren):
        ausgaben[k]["start_in_komplett_s"] = round(offset, 3)
        teile.append(audio)
        offset += len(audio) / rate
        if k < len(spuren) - 1:
            teile.append(np.zeros(int(pause_s * rate), dtype=np.float32))
            offset += pause_s
    komplett = np.concatenate(teile)
    k_basis = ziel / f"{praefix}komplett"
    k_dateien = []
    if "wav" in einst["formate"]:
        schreibe_wav(k_basis.with_suffix(".wav"), komplett)
        k_dateien.append(k_basis.with_suffix(".wav"))
    if "mp3" in einst["formate"] and schreibe_mp3(k_basis.with_suffix(".mp3"), komplett, einst["mp3_bitrate"]):
        k_dateien.append(k_basis.with_suffix(".mp3"))

    bevorzugt = "mp3" if "mp3" in einst["formate"] else "wav"
    m3u = ["#EXTM3U"]
    for a in ausgaben:
        datei = next((d["name"] for d in a["dateien"] if d["name"].endswith(bevorzugt)), a["dateien"][0]["name"])
        m3u.append(f"#EXTINF:{int(round(a['gesamt_dauer_s']))},{a['baustein']} {a['titel']}")
        m3u.append(datei)
    (ziel / f"{praefix}playlist.m3u8").write_text("\n".join(m3u) + "\n", encoding="utf-8")

    ergebnis_plan = dict(plan)
    ergebnis_plan.update({
        "gebaut_am": datetime.now().isoformat(timespec="seconds"),
        "system_version": SYSTEM_VERSION,
        "einstellungen": {k: einst[k] for k in ("vorlauf_s", "nachlauf_s", "pause_zwischen_bausteinen_s", "ziel_rms_dbfs", "raumton")},
        "audios": ausgaben,
        "komplett": {"dateien": [{"name": d.name, "sha256": datei_hash(d)} for d in k_dateien],
                     "dauer_s": round(len(komplett) / rate, 3)},
        "clip_protokoll": clip_protokoll,
        "warnungen": warnungen,
    })
    schreibe_json(ziel / f"{praefix}plan.json", ergebnis_plan)
    (ziel / f"{praefix}intern_pruefbogen.md").write_text(erzeuge_pruefbogen(ergebnis_plan, stufen), encoding="utf-8")
    (ziel / f"{praefix}planblatt_entwurf.md").write_text(erzeuge_planblatt(ergebnis_plan, bausteine), encoding="utf-8")
    ergebnis_plan["ausgabe_ordner"] = str(ziel)
    return ergebnis_plan


def erzeuge_planblatt(plan: dict, bausteine: dict) -> str:
    """Kundenseitiger Entwurf: nur Übungen, Dauer und von Lando formulierte Kundentexte. Keine Zustände."""
    z = ["# Dein Bewegungsplan", ""]
    if plan["entwurf"]:
        z += ["ENTWURF, nicht für Kunden bestimmt.", ""]
    z += ["Höre die Audios in dieser Reihenfolge an und mache die Übungen mit.", ""]
    for a in plan["audios"]:
        b = bausteine[a["baustein"]]
        z.append(f"{a['nr']}. {b['titel']}, etwa {formatiere_zeit(a['kern_dauer_s'])} Minuten, empfohlen: {b.get('empfohlene_haeufigkeit', 'nach Plan')}")
        material = ", ".join(b.get("material", []))
        if material:
            z.append(f"   Du brauchst: {material}")
        eintrag = next(e for e in plan["bausteine"] if e["id"] == a["baustein"])
        for t in eintrag.get("treffer", []):
            kt = next((x.get("kundentext") for x in b["stufen_zuordnung"] if x["zustand"] == t["zustand"]), None)
            if kt:
                z.append(f"   Hinweis: {kt}")
    z += ["", "Wichtig: Bei Schmerz die Übung beenden. Dieses Programm ersetzt keine ärztliche Behandlung.", ""]
    return "\n".join(z)


def erzeuge_pruefbogen(plan: dict, stufen: dict) -> str:
    """Internes Dokument für Lando zur Freigabe. Enthält Gesundheitsangaben (als Codes), nur intern aufbewahren."""
    z = [
        f"# Prüfbogen zur Freigabe: {plan['plan_id']}",
        "",
        "Nur intern. Enthält Gesundheitsangaben in Form von Codes, keine Namen oder Adressen.",
        "",
        f"Profil: {plan['profil_id']}. Erstellt: {plan['erstellt']}. Gebaut: {plan.get('gebaut_am', 'noch nicht')}. Systemversion {plan['system_version']}.",
    ]
    if plan["entwurf"]:
        z += ["", "**ENTWURF: Dieser Plan wurde mit nicht freigegebenen Bausteinen gebaut und darf nicht an Kunden gehen.**"]
    z += ["", "## Angaben des Kunden (Zustände)", ""]
    if plan["zustaende"]:
        for s in plan["zustaende"]:
            name = stufen["zustaende"][s]["name"]
            z.append(f"- {s}: {name}")
    else:
        z.append("- keine Besonderheiten angegeben")
    z += ["", "## Entscheidung je Baustein", ""]
    for e in plan["bausteine"]:
        z.append(f"### {e['id']}: {e['titel']} (Textfassung {e['textfassung']}) → {e['entscheidung']}")
        for t in e["treffer"]:
            z.append(f"- Stufe {t['stufe']} wegen {t['zustand']} ({t['quelle']}): {t['hinweis']}")
        for c in e.get("uebersprungene_cues", []):
            z.append(f"- Cue bei {c['bei_s']} s im Teil {c['teil']} weggelassen: \"{c['text'][:60]}...\"")
        for v in e.get("varianten", []):
            z.append(f"- Variante für {v['zustand']} im Teil {v['teil']} verwendet")
        z.append(f"- Soll Dauer ohne Vor und Nachlauf: {e['soll_dauer_s']:.1f} s. Baustein Prüfsumme: {e['baustein_sha']}")
        z.append("")
    if plan["ausgeschlossen"]:
        z += ["## Nicht im Plan", ""]
        for e in plan["ausgeschlossen"]:
            z.append(f"- {e['id']}: {e['entscheidung']}" + "".join(f" ({t['zustand']})" for t in e["treffer"]))
        z.append("")
    if plan["intern_hinweise"]:
        z += ["## Interne Hinweise zum Plan", ""]
        for h in plan["intern_hinweise"]:
            z.append(f"- {h['zustand']}: {h['text']}")
        z.append("")
    if plan["offene_punkte"]:
        z += ["## Offene Punkte", ""]
        z += [f"- {p}" for p in plan["offene_punkte"]]
        z.append("")
    if plan.get("stufe1_freigabe"):
        f = plan["stufe1_freigabe"]
        z += ["## Persönliche Freigabe bei Stufe 1", "", f"Freigegeben von {f['von']} am {f['am']}.", ""]
    if "audios" in plan:
        z += ["## Gebaute Dateien", "", "| Datei | Dauer | Prüfsumme (SHA256, gekürzt) |", "|---|---|---|"]
        for a in plan["audios"]:
            for d in a["dateien"]:
                z.append(f"| {d['name']} | {formatiere_zeit(a['gesamt_dauer_s'])} | {d['sha256'][:16]} |")
        z += ["", "## Verwendete Clips und ihre Freigabe", ""]
        auffaellig = [c for c in plan["clip_protokoll"] if c["freigabe"] != "ok"]
        z.append(f"{len(plan['clip_protokoll'])} Clips, davon {len(auffaellig)} nach Anhören abgenommen.")
        for c in auffaellig:
            z.append(f"- {c['clip']}: {c['freigabe']}")
        if plan["warnungen"]:
            z += ["", "## Warnungen beim Bau", ""]
            z += [f"- {w}" for w in plan["warnungen"]]
    z += ["", "## Freigabe", "", "Ich habe diesen Plan geprüft und gebe ihn frei.", "",
          "Datum: ____________    Unterschrift: ______________________________", ""]
    return "\n".join(z)
