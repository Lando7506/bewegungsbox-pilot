"""Kommandozeile. Aufruf: python -m audiosystem HILFE

Typischer Ablauf pro Baustein:
  1. check               Texte und Zeiten prüfen
  2. aufnahmeliste HB01  Liste zum Einsprechen erzeugen
  3. (aufnehmen, Dateien in clips/HB01/ ablegen)
  4. clips HB01          Aufnahmen messen, nur Auffälliges anhören
  5. abnehmen ...        Angehörte, gute Clips bestätigen
  6. regeltest           Regelwerk gegen viele Testprofile prüfen
  7. bauen               Audios und Playlist für einen Kunden erzeugen

Fragebogen:
  auswerten              Antworten (JSON) zu Zuständen, Ampel und Niveau auswerten
  fragebogen-doc         Lesbares Dokument aus den Fragebogen Daten erzeugen
"""
from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path

from .bauen import baue_plan, lade_profil
from .clips import schreibe_aufnahmeliste
from .common import (
    BAUSTEINE_DIR,
    CLIPS_DIR,
    AUSGABE_DIR,
    ROOT,
    SystemFehler,
    alle_baustein_ids,
    lade_alle_bausteine,
    lade_baustein,
    lade_einstellungen,
    lade_stufen,
    formatiere_zeit,
)
from .common import lade_json, schreibe_json
from .fragebogen import auswerten, erzeuge_dokument, lade_fragebogen, pruefe_fragebogen
from .lint import FEHLER, bericht, pruefe_alles
from .pruefen import lade_abnahmen, nimm_ab, pruefe_baustein_clips, schreibe_pruefbericht
from .regeln import erstelle_plan
from .regeltest import alle_regeltests
from .testsignal import FEHLERARTEN, erzeuge_testclips


def _gemeinsame_optionen(p: argparse.ArgumentParser) -> None:
    p.add_argument("--clips-dir", default=str(CLIPS_DIR), help="Ordner mit den Aufnahmen")
    p.add_argument("--ausgabe-dir", default=str(AUSGABE_DIR), help="Ordner für Ergebnisse")
    p.add_argument("--bausteine-dir", default=str(BAUSTEINE_DIR), help="Ordner mit den Baustein Dateien")
    p.add_argument("--einstellungen", default=None, help="Eigene einstellungen.json")


def baue_parser() -> argparse.ArgumentParser:
    ap = argparse.ArgumentParser(prog="audiosystem", description="Audio Baukasten für Bewegungspläne")
    sub = ap.add_subparsers(dest="befehl", required=True)

    p = sub.add_parser("check", help="Texte, Zeiten und Wortwahl der Bausteine prüfen")
    p.add_argument("bausteine", nargs="*", help="Baustein IDs, ohne Angabe alle")
    _gemeinsame_optionen(p)

    p = sub.add_parser("aufnahmeliste", help="Aufnahmeliste für einen Baustein erzeugen")
    p.add_argument("baustein")
    _gemeinsame_optionen(p)

    p = sub.add_parser("testclips", help="Künstliche Testclips erzeugen (nur zum Ausprobieren)")
    p.add_argument("baustein")
    p.add_argument("--fehler", default="", help=f"CLIP_ID=ART, mehrere mit Komma. Arten: {', '.join(FEHLERARTEN)}")
    _gemeinsame_optionen(p)

    p = sub.add_parser("clips", help="Aufnahmen eines Bausteins messen und bewerten")
    p.add_argument("baustein")
    p.add_argument("--asr", default=None, help="Optional: Spracherkennung als Gegenprobe, z. B. small (braucht faster-whisper)")
    _gemeinsame_optionen(p)

    p = sub.add_parser("abnehmen", help="Auffällige, aber gut klingende Clips bestätigen")
    p.add_argument("baustein")
    p.add_argument("clip_ids", nargs="+")
    p.add_argument("--von", required=True, help="Dein Name oder Kürzel")
    _gemeinsame_optionen(p)

    for name, hilfe in (("plan", "Plan für ein Profil erstellen, ohne Audio zu bauen"), ("bauen", "Plan erstellen und Audios bauen")):
        p = sub.add_parser(name, help=hilfe)
        p.add_argument("--profil-datei", required=True)
        p.add_argument("--profil", default=None, help="Profil ID, wenn die Datei mehrere Profile enthält")
        p.add_argument("--bausteine", default=None, help="Baustein IDs mit Komma, ohne Angabe alle")
        p.add_argument("--entwurf", action="store_true", help="Auch nicht freigegebene Bausteine verwenden (nur für Tests)")
        p.add_argument("--stufe1-freigabe", default=None, metavar="NAME",
                       help="Stufe 1 Fälle persönlich freigeben. Der Name wird im Plan festgehalten.")
        _gemeinsame_optionen(p)

    p = sub.add_parser("regeltest", help="Regelwerk gegen Testprofile und alle Kombinationen prüfen")
    p.add_argument("--profile", default=str(ROOT / "profile" / "testprofile.json"))
    p.add_argument("--antworten", default=str(ROOT / "profile" / "testantworten.json"), help="Testantworten für den Fragebogen")
    p.add_argument("--max-groesse", type=int, default=3)
    p.add_argument("--zufall", type=int, default=400, help="Anzahl zufälliger Antwortverläufe")
    _gemeinsame_optionen(p)

    p = sub.add_parser("auswerten", help="Fragebogen Antworten auswerten: Zustände, Ampel, Niveau")
    p.add_argument("--antworten", required=True, help="JSON Datei mit den Antworten (ID zu Antwort)")
    p.add_argument("--jahr", type=int, default=None, help="Laufendes Jahr für die Altersregel (Standard: heutiges Jahr)")
    p.add_argument("--profil-id", default="FB")
    p.add_argument("--plan", action="store_true", help="Zusätzlich einen Entwurfsplan für alle Bausteine zeigen")
    p.add_argument("--ausgabe-datei", default=None, help="Ergebnis als JSON speichern")
    _gemeinsame_optionen(p)

    p = sub.add_parser("fragebogen-doc", help="Lesbares Dokument aus regeln/fragebogen.json erzeugen")
    _gemeinsame_optionen(p)

    p = sub.add_parser("demo", help="Alles einmal mit künstlichen Testclips durchspielen")
    p.add_argument("--ordner", default=str(ROOT / "demo_workspace"))
    _gemeinsame_optionen(p)
    return ap


def _lade(args):
    bausteine = lade_alle_bausteine(args.bausteine_dir)
    stufen = lade_stufen()
    einst = lade_einstellungen(args.einstellungen)
    return bausteine, stufen, einst


def befehl_check(args) -> int:
    bausteine, stufen, einst = _lade(args)
    if not args.bausteine:
        fb_fehler = pruefe_fragebogen(lade_fragebogen(), stufen)
        print(f"Fragebogen (regeln/fragebogen.json): {'FEHLER' if fb_fehler else 'in Ordnung'}")
        for f in fb_fehler:
            print("  FEHLER: " + f)
    ids = args.bausteine or sorted(bausteine)
    if not args.bausteine:
        bausteine = {**bausteine, "ZAHLEN": lade_baustein("ZAHLEN", args.bausteine_dir)}
        ids = ids + ["ZAHLEN"]
    fehler_gesamt = 0
    for bid in ids:
        if bid not in bausteine:
            raise SystemFehler(f"Baustein {bid} nicht gefunden")
        befunde = pruefe_alles(bausteine[bid], stufen, einst, bid)
        n_f = sum(1 for x in befunde if x["stufe"] == FEHLER)
        fehler_gesamt += n_f
        status = "FEHLER" if n_f else ("mit Warnungen" if any(x["stufe"] == "WARNUNG" for x in befunde) else "in Ordnung")
        print(f"{bid} ({bausteine[bid]['titel']}): {status}")
        if befunde:
            print("  " + bericht(befunde).replace("\n", "\n  "))
    return 1 if fehler_gesamt else 0


def befehl_aufnahmeliste(args) -> int:
    b = lade_baustein(args.baustein, args.bausteine_dir)
    r = schreibe_aufnahmeliste(b, args.clips_dir, args.ausgabe_dir, lade_einstellungen(args.einstellungen))
    print(f"{r['anzahl_clips']} Clips. Liste: {r['markdown']}")
    print(f"Aufnahmen ablegen in: {Path(args.clips_dir) / b['id']}")
    if r["veraltet_verschoben"]:
        print("Achtung, Text geändert, alte Aufnahmen in _veraltet verschoben (neu aufnehmen): " + ", ".join(r["veraltet_verschoben"]))
    return 0


def befehl_testclips(args) -> int:
    b = lade_baustein(args.baustein, args.bausteine_dir)
    fehler = dict(x.split("=") for x in args.fehler.split(",") if x)
    r = erzeuge_testclips(b, args.clips_dir, fehler)
    print(f"{r['anzahl']} künstliche Testclips erzeugt in {Path(args.clips_dir) / b['id']}")
    return 0


def befehl_clips(args) -> int:
    b = lade_baustein(args.baustein, args.bausteine_dir)
    erg = pruefe_baustein_clips(b, args.clips_dir, lade_einstellungen(args.einstellungen), asr_modell=args.asr)
    pfad = schreibe_pruefbericht(b, erg, args.ausgabe_dir, lade_abnahmen(args.clips_dir, b["id"]))
    z = erg["zaehlung"]
    print(f"{b['id']}: {z['ok']} in Ordnung, {z['pruefen']} zum Anhören, {z['fehler']} neu aufnehmen, {z['fehlt']} fehlen.")
    print(f"Bericht: {pfad}")
    return 0 if z["fehler"] == 0 and z["fehlt"] == 0 else 1


def befehl_abnehmen(args) -> int:
    erledigt = nimm_ab(args.clips_dir, args.baustein, args.clip_ids, args.von)
    print("Abgenommen: " + ", ".join(erledigt))
    return 0


def _plan_aus_args(args):
    bausteine, stufen, einst = _lade(args)
    profil = lade_profil(args.profil_datei, args.profil)
    ids = args.bausteine.split(",") if args.bausteine else sorted(bausteine)
    plan = erstelle_plan(profil, ids, bausteine, stufen, entwurf=args.entwurf, stufe1_freigabe=args.stufe1_freigabe, einst=einst)
    return plan, bausteine, stufen, einst


def _zeige_plan(plan: dict) -> None:
    print(f"Plan {plan['plan_id']}: Status {plan['status']}" + (" (ENTWURF)" if plan["entwurf"] else ""))
    for e in plan["bausteine"]:
        print(f"  im Plan: {e['id']} ({e['entscheidung']}), Soll {formatiere_zeit(e['soll_dauer_s'])}")
    for e in plan["ausgeschlossen"]:
        print(f"  nicht im Plan: {e['id']} ({e['entscheidung']})")
    for p in plan["offene_punkte"]:
        print(f"  offen: {p}")


def befehl_plan(args) -> int:
    plan, *_ = _plan_aus_args(args)
    _zeige_plan(plan)
    return 0


def befehl_bauen(args) -> int:
    plan, bausteine, stufen, einst = _plan_aus_args(args)
    _zeige_plan(plan)
    erg = baue_plan(plan, bausteine, stufen, args.clips_dir, args.ausgabe_dir, einst)
    print(f"Gebaut in: {erg['ausgabe_ordner']}")
    for a in erg["audios"]:
        print(f"  {a['baustein']}: {formatiere_zeit(a['gesamt_dauer_s'])} Minuten, " + ", ".join(d["name"] for d in a["dateien"]))
    for w in erg["warnungen"]:
        print(f"  Warnung: {w}")
    print("Nächster Schritt: intern_pruefbogen.md lesen und unterschreiben.")
    return 0


def befehl_regeltest(args) -> int:
    r = alle_regeltests(args.profile, args.bausteine_dir, None, args.max_groesse, args.antworten, None, args.zufall)
    print(f"Profil Tests: {r['profile_checks']}, Eigenschaftstests über alle Kombinationen: {r['eigenschafts_checks']}, "
          f"Fragebogen Tests: {r['fragebogen_checks']}")
    if r["fehler"]:
        print(f"{len(r['fehler'])} FEHLER:")
        for f in r["fehler"][:50]:
            print("  " + f)
        return 1
    print("Alles in Ordnung.")
    return 0


AMPEL_NAME = {"rot": "ROT", "orange": "ORANGE", "gelb": "GELB", "gruen": "GRÜN"}


def befehl_auswerten(args) -> int:
    bausteine, stufen, einst = _lade(args)
    daten = lade_json(args.antworten)
    antworten = daten.get("antworten", daten)
    fb = lade_fragebogen()
    r = auswerten(antworten, fb, stufen, args.jahr, args.profil_id)
    if r["status"] != "ausgewertet":
        print(f"Status: {r['status']}. Keine Ampel.")
        if r.get("fehlende_fragen"):
            print("  Fehlende Antworten: " + ", ".join(r["fehlende_fragen"]))
        if r.get("grund"):
            print("  " + r["grund"])
    else:
        print(f"Ampel: {AMPEL_NAME[r['ampel']]} (vorläufig, Regelprüfung P1)")
        for x in r["rot"]:
            print(f"  Rot: {x['frage']} = {x['antwort']}: {x['grund']}")
        for x in r["orange"]:
            print(f"  Orange {x['code']}: {x['grund']} ({x['quelle']})")
        if r["strittige_regeln_beteiligt"]:
            print("  Hinweis: strittige Regel beteiligt: " + ", ".join(r["strittige_regeln_beteiligt"]))
        if r["notfallhinweis"]:
            print("  Notfallhinweis wird angezeigt: " + r["notfallhinweis"])
        print("  Zustände: " + (", ".join(r["zustaende"]) or "keine"))
        if r["zustaende_nur_wegen_weiss_nicht"]:
            print("  davon nur wegen Weiß nicht: " + ", ".join(r["zustaende_nur_wegen_weiss_nicht"]))
        if r["regionen_unklar"]:
            print("  Region angegeben, Genaueres unklar: " + ", ".join(r["regionen_unklar"]))
        print(f"  Niveau vorläufig: {r['niveau_vorlaeufig']} ({', '.join(r['niveau_gruende']) or 'keine Einschränkung'})")
        print("  Ziele: " + ", ".join(fb["ziele"][z]["text"] for z in r["ziele"]))
        print("  Noch nicht geprüft: " + "; ".join(r["noch_nicht_geprueft"]))
        if args.plan:
            plan = erstelle_plan(r["profil"], sorted(bausteine), bausteine, stufen, entwurf=True, einst=einst)
            _zeige_plan(plan)
    if args.ausgabe_datei:
        schreibe_json(args.ausgabe_datei, r)
        print(f"Ergebnis gespeichert: {args.ausgabe_datei}")
    return 0 if r["status"] == "ausgewertet" else 1


def befehl_fragebogen_doc(args) -> int:
    stufen = lade_stufen()
    fb = lade_fragebogen()
    fehler = pruefe_fragebogen(fb, stufen)
    if fehler:
        raise SystemFehler("Fragebogen hat Fehler, Dokument wird nicht erzeugt: " + "; ".join(fehler))
    ziel = Path(args.ausgabe_dir) / "fragebogen_entwurf_4.md"
    ziel.parent.mkdir(parents=True, exist_ok=True)
    ziel.write_text(erzeuge_dokument(fb, stufen), encoding="utf-8")
    print(f"Dokument erzeugt: {ziel}")
    return 0


def befehl_demo(args) -> int:
    ordner = Path(args.ordner)
    if ordner.exists():
        shutil.rmtree(ordner)
    clips, aus = ordner / "clips", ordner / "ausgabe"
    clips.mkdir(parents=True)
    aus.mkdir(parents=True)
    bausteine, stufen, einst = _lade(args)
    print("== 1. Texte prüfen")
    for bid in sorted(bausteine):
        n = [x for x in pruefe_alles(bausteine[bid], stufen, einst, bid) if x["stufe"] == FEHLER]
        print(f"  {bid}: {'FEHLER' if n else 'keine Fehler'}")
    print("== 2. Aufnahmelisten erzeugen")
    for bid in sorted(bausteine):
        r = schreibe_aufnahmeliste(bausteine[bid], clips, aus, einst)
        print(f"  {bid}: {r['anzahl_clips']} Clips")
    print("== 3. Testclips mit absichtlichen Fehlern")
    absichtlich = {
        "HB01": {"HB01_block_rechts_s00": "zu_kurz", "HB01_block_rechts_c022": "zu_leise", "HB01_block_rechts_c040": "rauschen",
                 "HB01_einleitung_s00": "lange_pause", "HB01_schluss_s00": "uebersteuert", "HB01_block_links_c085": "fehlt",
                 "HB01_block_rechts_s02": "leicht_lang", "HB01_block_rechts_c010": "zu_lang"},
        "HB02": {"HB02_block_rechts_s02": "leicht_lang"},
    }
    for bid in sorted(bausteine):
        erzeuge_testclips(bausteine[bid], clips, absichtlich.get(bid, {}))
    print("== 4. Clip Prüfung (erster Durchlauf)")
    for bid in sorted(bausteine):
        erg = pruefe_baustein_clips(bausteine[bid], clips, einst)
        schreibe_pruefbericht(bausteine[bid], erg, aus)
        z = erg["zaehlung"]
        print(f"  {bid}: {z['ok']} ok, {z['pruefen']} anhören, {z['fehler']} neu aufnehmen, {z['fehlt']} fehlen")
        for cid, e in erg["clips"].items():
            if e["status"] != "ok":
                print(f"     {e['status']:8} {cid}: " + "; ".join(x["text"] for x in e["befunde"]))
    print("== 5. Plan ohne Korrektur wird abgelehnt")
    profile = ROOT / "profile" / "testprofile.json"
    plan = erstelle_plan(lade_profil(profile, "P01"), sorted(bausteine), bausteine, stufen, entwurf=True, einst=einst)
    try:
        baue_plan(plan, bausteine, stufen, clips, aus, einst)
    except SystemFehler as e:
        print("  " + str(e).replace("\n", "\n  "))
    print("== 6. Fehlerhafte Clips neu aufnehmen (hier: neu erzeugen), auffälligen Clip anhören und abnehmen")
    ersatz = {k: "" for k in absichtlich["HB01"]}
    ersatz_fehler = {}
    erzeuge_testclips(bausteine["HB01"], clips, ersatz_fehler, seed=7)
    erzeuge_testclips(bausteine["HB02"], clips, ersatz_fehler, seed=7)
    for bid in sorted(bausteine):
        erg = pruefe_baustein_clips(bausteine[bid], clips, einst)
        z = erg["zaehlung"]
        print(f"  {bid}: {z['ok']} ok, {z['pruefen']} anhören, {z['fehler']} neu aufnehmen, {z['fehlt']} fehlen")
        auffaellig = [cid for cid, e in erg["clips"].items() if e["status"] == "pruefen"]
        if auffaellig:
            nimm_ab(clips, bid, auffaellig, "Demo")
            print("     abgenommen: " + ", ".join(auffaellig))
        schreibe_pruefbericht(bausteine[bid], erg, aus, lade_abnahmen(clips, bid))
    print("== 7. Bauen für drei Profile")
    for pid in ("P01", "P03", "P04", "P07"):
        profil = lade_profil(profile, pid)
        plan = erstelle_plan(profil, sorted(bausteine), bausteine, stufen, entwurf=True, einst=einst)
        print(f"  Profil {pid} ({profil['name']}): Status {plan['status']}")
        for e in plan["bausteine"]:
            print(f"     im Plan {e['id']} ({e['entscheidung']}), Cues weggelassen: {len(e.get('uebersprungene_cues', []))}")
        for e in plan["ausgeschlossen"]:
            print(f"     nicht im Plan {e['id']} ({e['entscheidung']})")
        if plan["status"] != "bereit":
            print("     wird nicht automatisch gebaut")
            continue
        erg = baue_plan(plan, bausteine, stufen, clips, aus, einst)
        for a in erg["audios"]:
            print(f"     {a['baustein']}: {a['gesamt_dauer_s']:.1f} s (Soll Kern {a['soll_dauer_s']:.1f} s, Ist Kern {a['kern_dauer_s']:.1f} s)")
    print(f"Fertig. Ergebnisse in {ordner}")
    return 0


def main(argv: list[str] | None = None) -> int:
    args = baue_parser().parse_args(argv)
    try:
        return {
            "check": befehl_check, "aufnahmeliste": befehl_aufnahmeliste, "testclips": befehl_testclips,
            "clips": befehl_clips, "abnehmen": befehl_abnehmen, "plan": befehl_plan, "bauen": befehl_bauen,
            "regeltest": befehl_regeltest, "demo": befehl_demo,
            "auswerten": befehl_auswerten, "fragebogen-doc": befehl_fragebogen_doc,
        }[args.befehl](args)
    except SystemFehler as e:
        print(f"Abbruch: {e}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())
