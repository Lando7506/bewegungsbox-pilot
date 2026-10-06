"""Tests für das ganze System. Ausführen: python -m unittest discover -s tests -v"""
from __future__ import annotations

import copy
import json
import shutil
import subprocess
import sys
import tempfile
import unittest
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from audiosystem import regeln, regeltest  # noqa: E402
from audiosystem.fragebogen import auswerten, lade_fragebogen, pruefe_fragebogen, sichtbare_fragen  # noqa: E402
from audiosystem.asr import vergleiche_text  # noqa: E402
from audiosystem.audio import lese_audio, messe, normalisiere, schreibe_wav, trimme, ffmpeg_vorhanden  # noqa: E402
from audiosystem.bauen import baue_plan, lade_profil  # noqa: E402
from audiosystem.clips import clip_manifest, finde_clip_datei, schreibe_aufnahmeliste  # noqa: E402
from audiosystem.common import SAMPLE_RATE, SystemFehler, lade_alle_bausteine, lade_baustein, lade_einstellungen, lade_stufen, sollsumme  # noqa: E402
from audiosystem.lint import FEHLER, pruefe_alles  # noqa: E402
from audiosystem.pruefen import bewerte_messwerte, clip_bereit, nimm_ab, pruefe_baustein_clips  # noqa: E402
from audiosystem.regeln import bewerte_baustein, erstelle_plan  # noqa: E402
from audiosystem.testsignal import erzeuge_testclips, sprachaehnlich  # noqa: E402

PROFILE = ROOT / "profile" / "testprofile.json"
# Die Erwartungen in testprofile.json gelten für diese beiden Bausteine. Weitere Bausteine kommen mit eigenen Tests dazu.
KERN_BAUSTEINE = ["HB01", "HB02"]


def codes(befunde):
    return {b["code"] for b in befunde}


def bereite_clips(b, clips, einst, test):
    """Testclips für einen Baustein und für die gemeinsamen Zahlen erzeugen und prüfen."""
    zahlen = lade_baustein("ZAHLEN")
    for x in (b, zahlen):
        erzeuge_testclips(x, clips)
        erg = pruefe_baustein_clips(x, clips, einst)
        test.assertEqual(erg["zaehlung"]["ok"], len(erg["clips"]), x["id"])


class Basis(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.bausteine = lade_alle_bausteine()
        cls.stufen = lade_stufen()
        cls.einst = lade_einstellungen()
        cls.einst["formate"] = ["wav"]


class TestRegelwerk(Basis):
    def test_profile_und_kombinationen(self):
        r = regeltest.alle_regeltests(PROFILE, max_groesse=2)
        self.assertEqual(r["fehler"], [])
        self.assertGreater(r["profile_checks"], 50)
        self.assertGreater(r["eigenschafts_checks"], 3000)

    def test_unbekannter_zustand_wird_abgelehnt(self):
        with self.assertRaises(SystemFehler):
            bewerte_baustein(self.bausteine["HB01"], {"tippfehler_zustand"}, self.stufen)

    def test_nicht_freigegebener_baustein_nur_im_entwurf(self):
        profil = lade_profil(PROFILE, "P01")
        with self.assertRaises(SystemFehler):
            erstelle_plan(profil, ["HB01"], self.bausteine, self.stufen, entwurf=False)
        plan = erstelle_plan(profil, ["HB01"], self.bausteine, self.stufen, entwurf=True)
        self.assertTrue(plan["entwurf"])

    def test_freigegebener_baustein_geht_ohne_entwurf(self):
        b = copy.deepcopy(self.bausteine)
        b["HB01"]["status"] = "freigegeben"
        plan = erstelle_plan(lade_profil(PROFILE, "P01"), ["HB01"], b, self.stufen, entwurf=False)
        self.assertEqual(plan["status"], "bereit")
        self.assertFalse(plan["entwurf"])

    def test_stufe1_nur_mit_namentlicher_freigabe(self):
        profil = lade_profil(PROFILE, "P07")  # Thromboseverdacht
        ohne = erstelle_plan(profil, ["HB01", "HB02"], self.bausteine, self.stufen, entwurf=True)
        self.assertEqual(ohne["status"], "manuell_pruefen")
        self.assertEqual(ohne["bausteine"], [])
        mit = erstelle_plan(profil, ["HB01", "HB02"], self.bausteine, self.stufen, entwurf=True, stufe1_freigabe="Lando")
        self.assertEqual(mit["status"], "bereit")
        self.assertEqual(mit["stufe1_freigabe"]["von"], "Lando")
        self.assertEqual({e["entscheidung"] for e in mit["bausteine"]}, {"manuell_freigegeben"})

    def test_hueftprothese_laesst_optionalen_cue_weg(self):
        plan = erstelle_plan(lade_profil(PROFILE, "P04"), ["HB02"], self.bausteine, self.stufen, entwurf=True)
        e = plan["bausteine"][0]
        self.assertEqual(sorted(c["teil"] for c in e["uebersprungene_cues"]), ["block_links", "block_rechts"])
        plan2 = erstelle_plan(lade_profil(PROFILE, "P01"), ["HB02"], self.bausteine, self.stufen, entwurf=True)
        self.assertEqual(plan2["bausteine"][0]["uebersprungene_cues"], [])

    def test_gesperrter_baustein_nutzt_ersatz(self):
        b = copy.deepcopy(self.bausteine)
        b["HB01"]["ersatz"] = ["HB02"]
        plan = erstelle_plan(lade_profil(PROFILE, "P04"), ["HB01"], b, self.stufen, entwurf=True)  # Hüftprothese sperrt HB01
        self.assertEqual([e["id"] for e in plan["bausteine"]], ["HB02"])
        self.assertEqual(plan["bausteine"][0]["ersetzt"], "HB01")

    def test_regeltest_schlaegt_an_wenn_regel_kaputt(self):
        """Absicherung der Absicherung: Ein absichtlich kaputtes Regelwerk muss auffallen."""
        kaputt = copy.deepcopy(self.stufen)
        kaputt["zustaende"]["thrombose_verdacht"].pop("stufe_global")
        b = copy.deepcopy(self.bausteine)
        for bb in b.values():
            bb["stufen_zuordnung"] = [e for e in bb["stufen_zuordnung"] if e["zustand"] != "thrombose_verdacht"]
        _, fehler = regeltest.teste_profile(regeltest.lade_profile(PROFILE), b, kaputt)
        self.assertTrue(any("P07" in f for f in fehler))

    def test_regeltest_findet_abgeschwaechte_globale_regel(self):
        b = copy.deepcopy(self.bausteine)
        for e in b["HB01"]["stufen_zuordnung"]:
            if e["zustand"] == "thrombose_verdacht":
                e["stufe"] = 4
        _, fehler = regeltest.teste_eigenschaften(b, self.stufen, max_groesse=1)
        self.assertTrue(any("schwächt" in f for f in fehler))

    def test_regeltest_findet_kaputte_entscheidungszuordnung(self):
        original = dict(regeln.STUFE_ZU_ENTSCHEIDUNG)
        try:
            regeln.STUFE_ZU_ENTSCHEIDUNG[1] = "warnung"
            r = regeltest.alle_regeltests(PROFILE, max_groesse=1)
            self.assertGreater(len(r["fehler"]), 0)
        finally:
            regeln.STUFE_ZU_ENTSCHEIDUNG.update(original)


class TestLint(Basis):
    def lint(self, b):
        return pruefe_alles(b, self.stufen, self.einst, b["id"])

    def test_vorhandene_bausteine_ohne_fehler(self):
        for bid, b in self.bausteine.items():
            self.assertEqual([x for x in self.lint(b) if x["stufe"] == FEHLER], [], bid)

    def test_falsche_gesamtdauer(self):
        b = copy.deepcopy(self.bausteine["HB01"])
        b["soll_gesamtdauer_s"] += 5
        self.assertIn("gesamtdauer", codes(self.lint(b)))

    def test_cue_ausserhalb_der_haltephase(self):
        b = copy.deepcopy(self.bausteine["HB01"])
        for t in b["teile"]:
            for s in t["segmente"]:
                if s["typ"] == "halten":
                    s["cues"].append({"bei_s": 95, "text": "Zu spät."})
        self.assertIn("cue_ausserhalb", codes(self.lint(b)))

    def test_verbotene_heilaussage(self):
        b = copy.deepcopy(self.bausteine["HB01"])
        b["teile"][0]["segmente"][0]["text"] += " Das ist schmerzfrei und verhindert Stürze."
        c = self.lint(b)
        self.assertIn("verbotenes_wort", codes(c))

    def test_fehlender_schmerzhinweis_vor_haltephase(self):
        b = copy.deepcopy(self.bausteine["HB01"])
        for t in b["teile"]:
            t["segmente"] = [s for s in t["segmente"] if not (s["typ"] == "sprechen" and "Schmerz" in s["text"])]
        b["soll_gesamtdauer_s"] = sum(s["soll_dauer_s"] for t in b["teile"] for s in t["segmente"])
        self.assertIn("pflichtsatz_fehlt", codes(self.lint(b)))

    def test_unbekannter_zustand_im_baustein(self):
        b = copy.deepcopy(self.bausteine["HB01"])
        b["stufen_zuordnung"].append({"zustand": "erfunden", "stufe": 3, "hinweis": "x"})
        self.assertIn("zustand_unbekannt", codes(self.lint(b)))

    def test_abschwaechung_globaler_regel(self):
        b = copy.deepcopy(self.bausteine["HB02"])
        for e in b["stufen_zuordnung"]:
            if e["zustand"] == "thrombose_verdacht":
                e["stufe"] = 3
        self.assertIn("globale_regel_abgeschwaecht", codes(self.lint(b)))

    def test_zu_langer_cue_wird_gewarnt(self):
        b = copy.deepcopy(self.bausteine["HB01"])
        for t in b["teile"]:
            for s in t["segmente"]:
                if s["typ"] == "halten":
                    s["cues"][0]["text"] = " ".join(["Wort"] * 30)
        self.assertIn("cue_zu_lang", codes(self.lint(b)))

    def test_lange_saetze_und_ziffern(self):
        b = copy.deepcopy(self.bausteine["HB01"])
        b["teile"][0]["segmente"][0]["text"] = " ".join(["Wort"] * 30) + " 90"
        c = codes(self.lint(b))
        self.assertIn("langer_satz", c)
        self.assertIn("ziffer", c)


class TestAudio(unittest.TestCase):
    def test_messen_und_trimmen(self):
        x = sprachaehnlich(10.0, seed=3)
        m = messe(x)
        self.assertAlmostEqual(m["sprechdauer_s"], 10.0, delta=0.1)
        self.assertAlmostEqual(m["rms_sprache_dbfs"], -24.0, delta=0.6)
        t = trimme(x)
        self.assertAlmostEqual(len(t) / SAMPLE_RATE, 10.0 + 0.12, delta=0.15)

    def test_normalisieren(self):
        for pegel in (-35.0, -24.0, -14.0):
            y, _ = normalisiere(trimme(sprachaehnlich(6.0, seed=2, rms_dbfs=pegel)), -20.0)
            self.assertAlmostEqual(messe(y)["rms_sprache_dbfs"], -20.0, delta=0.8)
            self.assertLess(float(np.max(np.abs(y))), 1.0)

    def test_wav_roundtrip_und_24bit(self):
        with tempfile.TemporaryDirectory() as tmp:
            x = sprachaehnlich(2.0, seed=1)
            p = Path(tmp) / "a.wav"
            schreibe_wav(p, x)
            self.assertLess(float(np.max(np.abs(lese_audio(p) - x))), 1e-3)
            # 24 Bit WAV von Hand schreiben, wie es manche Aufnahmegeräte tun
            ziel = Path(tmp) / "b.wav"
            ints = (np.clip(x, -1, 1) * 8388607).astype(np.int32)
            roh = b"".join(int(v).to_bytes(4, "little", signed=True)[:3] for v in ints)
            with wave.open(str(ziel), "wb") as w:
                w.setnchannels(1); w.setsampwidth(3); w.setframerate(SAMPLE_RATE); w.writeframes(roh)
            self.assertLess(float(np.max(np.abs(lese_audio(ziel) - x))), 1e-3)

    @unittest.skipUnless(ffmpeg_vorhanden(), "ffmpeg fehlt")
    def test_m4a_wird_gelesen(self):
        with tempfile.TemporaryDirectory() as tmp:
            wav = Path(tmp) / "a.wav"
            m4a = Path(tmp) / "a.m4a"
            schreibe_wav(wav, sprachaehnlich(3.0, seed=1))
            r = subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(wav), str(m4a)], capture_output=True)
            if r.returncode != 0:
                self.skipTest("ffmpeg kann kein m4a schreiben")
            self.assertAlmostEqual(len(lese_audio(m4a)) / SAMPLE_RATE, 3.9, delta=0.2)

    def test_fehlende_datei(self):
        with self.assertRaises(SystemFehler):
            lese_audio("/gibt/es/nicht.wav")


class TestClipsUndPruefung(Basis):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        self.clips, self.aus = self.tmp / "clips", self.tmp / "aus"

    def tearDown(self):
        shutil.rmtree(self.tmp, ignore_errors=True)

    def test_gleiche_texte_teilen_sich_einen_clip(self):
        m = clip_manifest(self.bausteine["HB01"], self.einst)
        self.assertEqual(len(m["clips"]), 18)
        gemeinsam = [c for c in m["clips"].values() if len({o["teil"] for o in c["orte"]}) > 1]
        self.assertGreaterEqual(len(gemeinsam), 6)
        self.assertEqual(sum(1 for c in m["clips"].values() if c["typ"] == "cue"), 9)

    def test_geaenderter_text_verschiebt_alte_aufnahme(self):
        b = copy.deepcopy(self.bausteine["HB01"])
        schreibe_aufnahmeliste(b, self.clips, self.aus, self.einst)
        erzeuge_testclips(b, self.clips)
        cid = "HB01_schluss_s00"
        self.assertIsNotNone(finde_clip_datei(self.clips, "HB01", cid))
        b["teile"][-1]["segmente"][0]["text"] = "Geschafft. Setz dich langsam auf."
        r = schreibe_aufnahmeliste(b, self.clips, self.aus, self.einst)
        self.assertEqual(r["veraltet_verschoben"], [cid])
        self.assertIsNone(finde_clip_datei(self.clips, "HB01", cid))
        self.assertTrue(list((self.clips / "HB01" / "_veraltet").glob("*.wav")))

    def test_jede_fehlerart_wird_gefunden(self):
        b = self.bausteine["HB01"]
        erwartet = {
            "HB01_block_rechts_s00": ("zu_kurz", "dauer", "fehler"),
            "HB01_block_rechts_c022": ("zu_leise", "zu_leise", "fehler"),
            "HB01_block_rechts_c040": ("rauschen", "rauschen", "fehler"),
            "HB01_einleitung_s00": ("lange_pause", "lange_pause", "pruefen"),
            "HB01_schluss_s00": ("uebersteuert", "uebersteuert", "fehler"),
            "HB01_block_rechts_c010": ("zu_lang", "dauer", "fehler"),
            "HB01_block_links_c085": ("fehlt", "fehlt", "fehlt"),
        }
        schreibe_aufnahmeliste(b, self.clips, self.aus, self.einst)
        erzeuge_testclips(b, self.clips, {k: v[0] for k, v in erwartet.items()})
        erg = pruefe_baustein_clips(b, self.clips, self.einst)
        for cid, (_, code, status) in erwartet.items():
            e = erg["clips"][cid]
            self.assertEqual(e["status"], status, cid)
            self.assertIn(code, codes(e["befunde"]), cid)
        gut = [c for c, e in erg["clips"].items() if c not in erwartet]
        for cid in gut:
            self.assertEqual(erg["clips"][cid]["status"], "ok", cid)

    def test_abnehmen_nur_bei_pruefen_und_nur_fuer_diese_datei(self):
        b = self.bausteine["HB02"]
        schreibe_aufnahmeliste(b, self.clips, self.aus, self.einst)
        cid = "HB02_block_rechts_s02"
        erzeuge_testclips(b, self.clips, {cid: "leicht_lang"})
        erg = pruefe_baustein_clips(b, self.clips, self.einst)
        self.assertEqual(erg["clips"][cid]["status"], "pruefen")
        with self.assertRaises(SystemFehler):
            nimm_ab(self.clips, "HB02", ["HB02_einleitung_s00"], "Lando")  # ist ok, nicht pruefen
        pruefung = json.loads((self.clips / "HB02" / "pruefung.json").read_text(encoding="utf-8"))
        manifest = clip_manifest(b, self.einst)["clips"]
        sha = manifest[cid]["text_sha"]
        self.assertFalse(clip_bereit(self.clips, "HB02", cid, sha, pruefung, {})[0])
        nimm_ab(self.clips, "HB02", [cid], "Lando")
        abn = json.loads((self.clips / "HB02" / "abnahmen.json").read_text(encoding="utf-8"))
        self.assertTrue(clip_bereit(self.clips, "HB02", cid, sha, pruefung, abn)[0])
        # Datei wird neu aufgenommen: Abnahme und Prüfung gelten nicht mehr.
        erzeuge_testclips(b, self.clips, {cid: "leicht_lang"}, seed=5)
        self.assertFalse(clip_bereit(self.clips, "HB02", cid, sha, pruefung, abn)[0])

    def test_bewertung_tempo_und_leise(self):
        info = {"soll_dauer_s": 10.0, "max_dauer_s": None, "woerter": 40}
        m = {"leer": False, "stumm": False, "sprechdauer_s": 10.0, "clipping_anteil": 0.0, "rms_sprache_dbfs": -40.0,
             "snr_db": 25.0, "laengste_pause_s": 0.0}
        c = codes(bewerte_messwerte(info, m, 10, self.einst))
        self.assertIn("zu_schnell", c)
        self.assertIn("recht_leise", c)

    def test_spracherkennung_vergleich(self):
        soll = "Lege das Band um das Fußgelenk deines rechten Fußes."
        self.assertEqual(vergleiche_text(soll, "Lege das Band um das Fußgelenk deines rechten Fußes.")["befunde"], [])
        vertauscht = vergleiche_text(soll, "Lege das Band um das Fußgelenk deines linken Fußes.")
        self.assertIn("seite_vertauscht", codes(vertauscht["befunde"]))
        luecke = vergleiche_text("Schmerz in der Hüfte ist ein Warnsignal. Dann lass sofort locker.", "Dann lass locker.")
        self.assertTrue(luecke["befunde"])

    def test_asr_funktion_wird_eingebunden(self):
        b = self.bausteine["HB02"]
        schreibe_aufnahmeliste(b, self.clips, self.aus, self.einst)
        erzeuge_testclips(b, self.clips)
        erg = pruefe_baustein_clips(b, self.clips, self.einst, asr_modell="fake",
                                    asr_funktion=lambda pfad, modell: "ganz anderer text")
        self.assertGreater(erg["zaehlung"]["pruefen"], 10)


class TestBauen(Basis):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.tmp = Path(tempfile.mkdtemp())
        cls.clips, cls.aus = cls.tmp / "clips", cls.tmp / "aus"
        for bid, b in cls.bausteine.items():
            schreibe_aufnahmeliste(b, cls.clips, cls.aus, cls.einst)
            erzeuge_testclips(b, cls.clips)
            erg = pruefe_baustein_clips(b, cls.clips, cls.einst)
            assert erg["zaehlung"]["ok"] == len(erg["clips"]), erg["zaehlung"]

    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(cls.tmp, ignore_errors=True)

    def bauen(self, pid, ausgabe=None, bausteine=None):
        plan = erstelle_plan(lade_profil(PROFILE, pid), KERN_BAUSTEINE, self.bausteine, self.stufen, entwurf=True, einst=self.einst)
        return baue_plan(plan, self.bausteine, self.stufen, self.clips, ausgabe or self.aus, self.einst)

    def fenster_pegel(self, audio, von_s, bis_s):
        x = audio[int(von_s * SAMPLE_RATE):int(bis_s * SAMPLE_RATE)]
        return 10 * np.log10(np.mean(x.astype(np.float64) ** 2) + 1e-12)

    def test_laenge_und_cue_positionen_stimmen(self):
        erg = self.bauen("P01")
        for a in erg["audios"]:
            wav = lese_audio(Path(erg["ausgabe_ordner"]) / next(d["name"] for d in a["dateien"] if d["name"].endswith(".wav")))
            self.assertAlmostEqual(len(wav) / SAMPLE_RATE, a["gesamt_dauer_s"], delta=0.002)
            self.assertAlmostEqual(a["kern_dauer_s"], a["soll_dauer_s"], delta=a["soll_dauer_s"] * 0.05)
            for seg in a["zeitplan"]:
                if seg["typ"] != "halten":
                    continue
                self.assertAlmostEqual(seg["ende_s"] - seg["start_s"], 90.0, delta=1e-6)
                for c in seg["cues"]:
                    self.assertAlmostEqual(c["start_s"], seg["start_s"] + c["bei_s"], delta=1e-6)
                    self.assertGreater(self.fenster_pegel(wav, c["start_s"] + 0.1, c["start_s"] + 0.6), -45)
                    self.assertLess(self.fenster_pegel(wav, c["start_s"] - 0.7, c["start_s"] - 0.15), -52)

    def test_optionaler_cue_fehlt_bei_hueftprothese(self):
        erg = self.bauen("P04")
        a = erg["audios"][0]
        self.assertEqual(a["baustein"], "HB02")
        wav = lese_audio(Path(erg["ausgabe_ordner"]) / next(d["name"] for d in a["dateien"] if d["name"].endswith(".wav")))
        for seg in a["zeitplan"]:
            if seg["typ"] == "halten":
                self.assertNotIn(65, [c["bei_s"] for c in seg["cues"]])
                self.assertLess(self.fenster_pegel(wav, seg["start_s"] + 65.2, seg["start_s"] + 68.0), -52)
        erg1 = self.bauen("P01")
        a1 = next(x for x in erg1["audios"] if x["baustein"] == "HB02")
        self.assertTrue(any(65 in [c["bei_s"] for c in s["cues"]] for s in a1["zeitplan"] if s["typ"] == "halten"))

    def test_gesperrter_baustein_wird_nicht_gebaut(self):
        erg = self.bauen("P04")
        self.assertEqual([a["baustein"] for a in erg["audios"]], ["HB02"])

    def test_stufe1_plan_wird_nicht_gebaut(self):
        plan = erstelle_plan(lade_profil(PROFILE, "P07"), KERN_BAUSTEINE, self.bausteine, self.stufen, entwurf=True, einst=self.einst)
        with self.assertRaises(SystemFehler):
            baue_plan(plan, self.bausteine, self.stufen, self.clips, self.aus, self.einst)

    def test_verbotener_text_stoppt_den_bau(self):
        b = copy.deepcopy(self.bausteine)
        b["HB01"]["teile"][0]["segmente"][0]["text"] += " Das ist eine Therapie."
        plan = erstelle_plan(lade_profil(PROFILE, "P01"), ["HB01"], b, self.stufen, entwurf=True, einst=self.einst)
        with self.assertRaises(SystemFehler) as ctx:
            baue_plan(plan, b, self.stufen, self.clips, self.aus, self.einst)
        self.assertIn("Textprüfung", str(ctx.exception))

    def test_veraenderte_aufnahme_stoppt_den_bau(self):
        tmp2 = Path(tempfile.mkdtemp())
        try:
            shutil.copytree(self.clips, tmp2 / "clips")
            datei = finde_clip_datei(tmp2 / "clips", "HB01", "HB01_schluss_s00")
            schreibe_wav(datei, sprachaehnlich(7.5, seed=99))  # andere Aufnahme, nicht neu geprüft
            plan = erstelle_plan(lade_profil(PROFILE, "P01"), ["HB01"], self.bausteine, self.stufen, entwurf=True, einst=self.einst)
            with self.assertRaises(SystemFehler) as ctx:
                baue_plan(plan, self.bausteine, self.stufen, tmp2 / "clips", tmp2 / "aus", self.einst)
            self.assertIn("HB01_schluss_s00", str(ctx.exception))
        finally:
            shutil.rmtree(tmp2, ignore_errors=True)

    def test_deterministisch(self):
        e1 = self.bauen("P03", self.tmp / "d1")
        e2 = self.bauen("P03", self.tmp / "d2")
        for a1, a2 in zip(e1["audios"], e2["audios"]):
            self.assertEqual([d["sha256"] for d in a1["dateien"]], [d["sha256"] for d in a2["dateien"]])

    def test_variante_wird_verwendet(self):
        b = copy.deepcopy(self.bausteine)
        seg = b["HB01"]["teile"][1]["segmente"][2]  # "Hebe das Bein..." im rechten Block
        self.assertEqual(seg["typ"], "sprechen")
        seg["varianten"] = [{"bei_zustand": "ischias_beschwerden", "soll_dauer_s": 15,
                             "text": "Hebe das Bein mit dem Band nach oben. Das Knie darf leicht gebeugt bleiben. Ziehe das Bein, bis du ein Ziehen hinter dem Oberschenkel spürst."}]
        tmp2 = Path(tempfile.mkdtemp())
        try:
            schreibe_aufnahmeliste(b["HB01"], tmp2 / "clips", tmp2 / "aus", self.einst)
            erzeuge_testclips(b["HB01"], tmp2 / "clips")
            pruefe_baustein_clips(b["HB01"], tmp2 / "clips", self.einst)
            plan = erstelle_plan(lade_profil(PROFILE, "P03"), ["HB01"], b, self.stufen, entwurf=True, einst=self.einst)
            self.assertEqual(plan["bausteine"][0]["varianten"][0]["zustand"], "ischias_beschwerden")
            erg = baue_plan(plan, b, self.stufen, tmp2 / "clips", tmp2 / "aus", self.einst)
            verwendet = [s.get("variante") for s in erg["audios"][0]["zeitplan"] if s["typ"] == "sprechen"]
            self.assertIn("ischias_beschwerden", verwendet)
            plan_ohne = erstelle_plan(lade_profil(PROFILE, "P01"), ["HB01"], b, self.stufen, entwurf=True, einst=self.einst)
            erg2 = baue_plan(plan_ohne, b, self.stufen, tmp2 / "clips", tmp2 / "aus2", self.einst)
            self.assertNotIn("ischias_beschwerden", [s.get("variante") for s in erg2["audios"][0]["zeitplan"] if s["typ"] == "sprechen"])
        finally:
            shutil.rmtree(tmp2, ignore_errors=True)

    @unittest.skipUnless(ffmpeg_vorhanden(), "ffmpeg fehlt")
    def test_mp3_und_playlist(self):
        einst = dict(self.einst)
        einst["formate"] = ["wav", "mp3"]
        b = {"HB02": self.bausteine["HB02"]}
        plan = erstelle_plan(lade_profil(PROFILE, "P01"), ["HB02"], b, self.stufen, entwurf=True, einst=einst)
        erg = baue_plan(plan, b, self.stufen, self.clips, self.tmp / "mp3", einst)
        ordner = Path(erg["ausgabe_ordner"])
        mp3 = ordner / "ENTWURF_01_HB02.mp3"
        self.assertTrue(mp3.exists())
        dauer = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(mp3)],
                                     capture_output=True, text=True).stdout.strip())
        self.assertAlmostEqual(dauer, erg["audios"][0]["gesamt_dauer_s"], delta=0.2)
        m3u = (ordner / "ENTWURF_playlist.m3u8").read_text(encoding="utf-8")
        self.assertIn("ENTWURF_01_HB02.mp3", m3u)

    def test_pruefbogen_und_planblatt(self):
        erg = self.bauen("P04", self.tmp / "pb")
        ordner = Path(erg["ausgabe_ordner"])
        bogen = (ordner / "ENTWURF_intern_pruefbogen.md").read_text(encoding="utf-8")
        self.assertIn("hueftprothese_laenger_her", bogen)
        self.assertIn("Unterschrift", bogen)
        self.assertIn("ENTWURF", bogen)
        blatt = (ordner / "ENTWURF_planblatt_entwurf.md").read_text(encoding="utf-8")
        self.assertNotIn("hueftprothese", blatt)  # Kundenblatt nennt keine Zustände


ANTWORTEN = ROOT / "profile" / "testantworten.json"


class TestFragebogen(Basis):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.fb = lade_fragebogen()
        cls.daten = json.loads(ANTWORTEN.read_text(encoding="utf-8"))

    def antw(self, aend=None, entferne=()):
        return regeltest.baue_antworten(self.daten["basis"], aend or {}, self.fb, self.stufen, entferne)

    def ausw(self, aend=None, entferne=(), fb=None, stufen=None):
        return auswerten(self.antw(aend, entferne), fb or self.fb, stufen or self.stufen, self.daten["jahr"])

    def test_fragebogen_ohne_lintfehler(self):
        self.assertEqual(pruefe_fragebogen(self.fb, self.stufen), [])

    def test_komplette_regeltests_inkl_fragebogen(self):
        r = regeltest.alle_regeltests(PROFILE, max_groesse=1, anzahl_zufall=60)
        self.assertEqual(r["fehler"], [])
        self.assertGreater(r["fragebogen_checks"], 300)

    def test_gesunde_basis_ist_gruen(self):
        r = self.ausw()
        self.assertEqual((r["status"], r["ampel"], r["zustaende"]), ("ausgewertet", "gruen", []))

    def test_region_unklar_gibt_warnung_nur_fuer_belastete_bausteine(self):
        r = self.ausw({"R0": ["knie"], "E3k": "nein", "E8": "nein"})
        self.assertEqual(r["zustaende"], ["region_unklar_knie"])
        self.assertEqual(bewerte_baustein(self.bausteine["HB01"], r["zustaende"], self.stufen)["entscheidung"], "warnung")
        b = copy.deepcopy(self.bausteine["HB01"])
        b["belastet_regionen"] = ["nacken"]
        self.assertEqual(bewerte_baustein(b, r["zustaende"], self.stufen)["entscheidung"], "frei")

    def test_erklaerte_region_loest_keine_standardwarnung_aus(self):
        r = self.ausw({"R0": ["knie"], "E3k": "nein", "E8": "ja"})
        self.assertNotIn("region_unklar_knie", r["zustaende"])

    def test_nichts_gewaehlt_ist_nicht_dasselbe_wie_vergessen(self):
        self.assertEqual(self.ausw(entferne=["R0"])["status"], "unvollstaendig")

    def test_weiss_nicht_bei_rot_frage_ist_nie_gruen(self):
        r = self.ausw({"A1": "wn"})
        self.assertIn(r["ampel"], ("orange", "rot"))

    def test_rot_bei_op_unter_drei_monaten(self):
        r = self.ausw({"A1": "ja"})
        self.assertEqual(r["ampel"], "rot")

    def test_einwilligung_fehlt_stoppt(self):
        r = self.ausw({"W1": "nein"})
        self.assertEqual((r["status"], r["ampel"]), ("keine_einwilligung", None))

    def test_notfallhinweis_bei_ischias_notfallzeichen(self):
        r = self.ausw({"E5a": "ja"})
        self.assertEqual(r["ampel"], "rot")
        self.assertTrue(r["notfallhinweis"])

    def test_deterministisch(self):
        a = self.antw({"R0": ["knie", "ruecken"], "E3k": "ja"})
        self.assertEqual(auswerten(a, self.fb, self.stufen, 2026), auswerten(a, self.fb, self.stufen, 2026))

    def test_unbekannter_zustand_im_fragebogen_wird_gefunden(self):
        fb = copy.deepcopy(self.fb)
        fb["fragen"][[f["id"] for f in fb["fragen"]].index("E8")]["wirkung"]["ja"]["zustaende"] = ["kniearthose"]
        self.assertTrue(pruefe_fragebogen(fb, self.stufen))

    def test_wirkungsloses_weiss_nicht_wird_gefunden(self):
        fb = copy.deepcopy(self.fb)
        f = fb["fragen"][[x["id"] for x in fb["fragen"]].index("A1")]
        f["wirkung"].pop("wn", None)
        self.assertTrue(pruefe_fragebogen(fb, self.stufen))

    def test_sabotage_region_standard_wird_von_tests_erkannt(self):
        s = copy.deepcopy(self.stufen)
        s["region_unklar"]["stufe"] = 4
        r = regeltest.alle_regeltests(PROFILE, stufen_datei=self._schreibe(s), max_groesse=1, anzahl_zufall=60)
        self.assertGreater(len(r["fehler"]), 0)

    def test_sabotage_rot_wird_nicht_mehr_rot(self):
        s = copy.deepcopy(self.stufen)
        s["zustaende"]["thrombose_verdacht"].pop("stufe_global", None)
        r = regeltest.alle_regeltests(PROFILE, stufen_datei=self._schreibe(s), max_groesse=1, anzahl_zufall=60)
        self.assertGreater(len(r["fehler"]), 0)

    def _schreibe(self, s):
        tmp = Path(tempfile.mkdtemp())
        self.addCleanup(shutil.rmtree, tmp, ignore_errors=True)
        pfad = tmp / "stufen.json"
        pfad.write_text(json.dumps(s, ensure_ascii=False), encoding="utf-8")
        return pfad

    def test_cli_auswerten(self):
        tmp = Path(tempfile.mkdtemp())
        self.addCleanup(shutil.rmtree, tmp, ignore_errors=True)
        (tmp / "a.json").write_text(json.dumps(self.antw({"R0": ["knie"], "E3k": "nein", "E8": "nein"})), encoding="utf-8")
        p = subprocess.run([sys.executable, "-m", "audiosystem", "auswerten", "--antworten", str(tmp / "a.json"),
                            "--jahr", "2026"], cwd=ROOT, capture_output=True, text=True)
        self.assertEqual(p.returncode, 0, p.stderr)
        self.assertIn("GELB", p.stdout)
        self.assertIn("region_unklar_knie", p.stdout)


class TestSchmerzBlock(Basis):
    """Block P: Schmerz genauer, je gewählter Region (Hinweis des Gegenlesers vom 06.10.2026)."""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.fb = lade_fragebogen()
        cls.daten = json.loads(ANTWORTEN.read_text(encoding="utf-8"))

    def antw(self, aend=None, entferne=()):
        return regeltest.baue_antworten(self.daten["basis"], aend or {}, self.fb, self.stufen, entferne)

    def ausw(self, aend=None, entferne=()):
        return auswerten(self.antw(aend, entferne), self.fb, self.stufen, self.daten["jahr"])

    def sichtbar_ids(self, aend):
        a = self.antw(aend)
        fb2 = dict(self.fb)
        fb2["_regionen"] = self.stufen["regionen"]
        return [f["id"] for f in sichtbare_fragen(fb2, a)]

    def test_gesunder_weg_bleibt_bei_37_fragen_ohne_schmerzblock(self):
        ids = self.sichtbar_ids({})
        self.assertEqual(len(ids), 37)
        self.assertFalse([i for i in ids if i.startswith("P")])

    def test_region_ohne_schmerz_fragt_nur_p0(self):
        ids = self.sichtbar_ids({"R0": ["knie"], "P0": ["nichts"]})
        self.assertEqual([i for i in ids if i.startswith("P")], ["P0"])

    def test_jede_region_mit_schmerz_bekommt_ihren_eigenen_block(self):
        ids = self.sichtbar_ids({"R0": ["knie", "schulter", "ruecken"], "P0": ["knie", "schulter"]})
        self.assertEqual([i for i in ids if i.startswith("P")], ["P0", "P1s", "P2s", "P3s", "P1k", "P2k", "P3k"])
        self.assertNotIn("P1r", ids)

    def test_alle_sieben_regionen_haben_je_drei_fragen(self):
        suffixe = {"nacken": "n", "schulter": "s", "ruecken": "r", "hueft": "h", "knie": "k", "oberschenkel_wade": "w", "fuss": "f"}
        self.assertEqual(set(suffixe), set(self.stufen["regionen"]))
        for region, suf in suffixe.items():
            ids = self.sichtbar_ids({"R0": [region], "P0": [region]})
            self.assertEqual([i for i in ids if i.startswith("P")], ["P0", f"P1{suf}", f"P2{suf}", f"P3{suf}"], region)

    def test_hoechstens_drei_regionen(self):
        with self.assertRaises(SystemFehler):
            self.ausw({"R0": ["knie", "schulter", "ruecken", "hueft"], "P0": ["knie", "schulter", "ruecken", "hueft"]})
        r = self.ausw({"R0": ["knie", "schulter", "ruecken", "hueft"], "P0": ["knie", "schulter", "ruecken"]})
        self.assertEqual(r["status"], "ausgewertet")

    def test_p0_nur_aus_den_gewaehlten_regionen(self):
        with self.assertRaises(SystemFehler):
            self.ausw({"R0": ["knie"], "P0": ["schulter"]})

    def test_keine_schmerzen_nicht_kombinierbar(self):
        with self.assertRaises(SystemFehler):
            self.ausw({"R0": ["knie"], "P0": ["knie", "nichts"]})

    def test_fehlende_antworten_im_block_geben_keine_ampel(self):
        a = self.antw({"R0": ["knie"], "P0": ["knie"], "P1k": "dumpf", "P2k": "punktuell"})
        a.pop("P3k")  # baue_antworten füllt fehlende Pflichtfragen auf, hier soll sie wirklich fehlen
        r = auswerten(a, self.fb, self.stufen, self.daten["jahr"])
        self.assertEqual(r["status"], "unvollstaendig")
        self.assertEqual(r["fehlende_fragen"], ["P3k"])
        self.assertIsNone(r["ampel"])
        b = self.antw({"R0": ["knie"], "P0": ["nichts"]})
        b.pop("P0")
        r2 = auswerten(b, self.fb, self.stufen, self.daten["jahr"])
        self.assertEqual(r2["status"], "unvollstaendig")
        self.assertIn("P0", r2["fehlende_fragen"])

    def test_antwort_ohne_gestellte_frage_wird_abgelehnt(self):
        with self.assertRaises(SystemFehler):
            self.ausw({"R0": ["knie"], "P0": ["nichts"], "P1k": "dumpf"})

    def test_verlauf_schlechter_gibt_orange_o13(self):
        r = self.ausw({"R0": ["knie"], "P0": ["knie"], "P3k": "schlechter"})
        self.assertEqual(r["ampel"], "orange")
        self.assertIn("O13", {o["code"] for o in r["orange"]})
        self.assertEqual([o["quelle"] for o in r["orange"] if o["code"] == "O13"], ["P3k"])

    def test_verlauf_besser_gleich_weiss_nicht_gibt_kein_o13(self):
        for v in ("besser", "gleich", "weiss_nicht"):
            r = self.ausw({"R0": ["knie"], "P0": ["knie"], "P3k": v})
            self.assertNotIn("O13", {o["code"] for o in r["orange"]}, v)
            self.assertNotEqual(r["ampel"], "orange", v)

    def test_schlechter_in_einer_von_zwei_regionen_reicht(self):
        r = self.ausw({"R0": ["knie", "schulter"], "P0": ["knie", "schulter"], "P3k": "besser", "P3s": "schlechter"})
        self.assertEqual([o["quelle"] for o in r["orange"] if o["code"] == "O13"], ["P3s"])

    def test_art_und_ausdehnung_aendern_die_ampel_nicht(self):
        basis = self.ausw({"R0": ["knie"], "P0": ["knie"]})
        for art in ("stechend", "dumpf", "ziehend", "weiss_nicht"):
            for ausd in ("punktuell", "breitflaechig", "weiss_nicht"):
                r = self.ausw({"R0": ["knie"], "P0": ["knie"], "P1k": art, "P2k": ausd})
                self.assertEqual((r["ampel"], r["zustaende"]), (basis["ampel"], basis["zustaende"]), (art, ausd))

    def test_schmerzblock_erklaert_keine_region(self):
        r = self.ausw({"R0": ["knie"], "E3k": "nein", "E8": "nein", "P0": ["knie"], "P3k": "besser"})
        self.assertIn("region_unklar_knie", r["zustaende"])

    def test_alle_schmerzoptionen_haben_weiss_nicht(self):
        for f in self.fb["fragen"]:
            if f["id"][:2] in ("P1", "P2", "P3"):
                self.assertIn("weiss_nicht", [o["wert"] for o in f["optionen"]], f["id"])

    def test_sabotage_fehlende_frage_im_block_wird_gefunden(self):
        fb = copy.deepcopy(self.fb)
        fb["fragen"] = [f for f in fb["fragen"] if f["id"] != "P2h"]
        self.assertTrue([x for x in pruefe_fragebogen(fb, self.stufen) if "P2" in x])

    def test_dokument_nennt_den_block_und_die_herkunft(self):
        from audiosystem.fragebogen import erzeuge_dokument
        d = erzeuge_dokument(self.fb, self.stufen)
        self.assertIn("Schritt 4: Schmerz genauer", d)
        self.assertIn("P3k", d)
        self.assertIn("Hinweis Gegenleser", d)
        self.assertIn("O13", d)


if __name__ == "__main__":
    unittest.main()


class TestWiederholungen(Basis):
    """Segmenttyp 'wiederholungen' (Zählen, Wortsignal) und 'satzpause' für Kraftübungen."""

    def lint(self, b):
        return pruefe_alles(b, self.stufen, self.einst, b["id"])

    def kraft(self):
        return copy.deepcopy(self.bausteine["KU01"])

    def block(self, b, typ="wiederholungen", n=0):
        return [s for t in b["teile"] for s in t["segmente"] if s["typ"] == typ][n]

    def test_kraftbaustein_ohne_fehler(self):
        self.assertEqual([x for x in self.lint(self.kraft()) if x["stufe"] == FEHLER], [])

    def test_zaehlen_erzeugt_zahlwoerter_im_takt(self):
        from audiosystem.common import block_cues
        cues = block_cues(self.block(self.kraft()))
        self.assertEqual([c["bei_s"] for c in cues], [0, 7, 14, 21, 28, 35, 42, 49, 56, 63])
        self.assertEqual([c["text"] for c in cues][:3], ["eins", "zwei", "drei"])
        self.assertEqual(cues[-1]["text"], "zehn")

    def test_wortsignal_wechselt_im_takt(self):
        from audiosystem.common import block_cues
        b = self.kraft()
        s = self.block(b)
        s.update({"modus": "wortsignal", "woerter": ["Rauf", "Runter"], "anzahl": 10, "takt_s": 4, "soll_dauer_s": 80})
        cues = block_cues(s)
        self.assertEqual(len(cues), 20)
        self.assertEqual([c["text"] for c in cues][:4], ["Rauf", "Runter", "Rauf", "Runter"])
        self.assertEqual(cues[-1]["bei_s"], 76)

    def test_zu_kurzer_block_ist_fehler(self):
        b = self.kraft()
        self.block(b)["soll_dauer_s"] = 60
        self.assertIn("wdh_zu_kurz", codes(self.lint(b)))

    def test_unbekannter_modus_ist_fehler(self):
        b = self.kraft()
        self.block(b)["modus"] = "zufall"
        self.assertIn("wdh_modus", codes(self.lint(b)))

    def test_takt_nicht_ganze_sekunden_ist_fehler(self):
        b = self.kraft()
        self.block(b)["takt_s"] = 6.5
        self.assertIn("wdh_ganze_sekunden", codes(self.lint(b)))

    def test_wortsignal_ohne_woerter_ist_fehler(self):
        b = self.kraft()
        s = self.block(b)
        s.update({"modus": "wortsignal", "takt_s": 4})
        self.assertIn("wdh_woerter", codes(self.lint(b)))

    def test_zaehlen_ueber_zwanzig_ist_fehler(self):
        b = self.kraft()
        s = self.block(b)
        s.update({"anzahl": 21, "soll_dauer_s": 200})
        self.assertIn("wdh_zaehlen_zu_viel", codes(self.lint(b)))

    def test_schmerzsatz_vor_wiederholungen_ist_pflicht(self):
        b = self.kraft()
        for t in b["teile"]:
            for s in t["segmente"]:
                if s["typ"] == "sprechen":
                    s["text"] = s["text"].replace("Bei Schmerz hör sofort auf.", "").strip()
        self.assertIn("pflichtsatz_fehlt", codes(self.lint(b)))

    def test_cue_in_satzpause_ausserhalb_ist_fehler(self):
        b = self.kraft()
        self.block(b, "satzpause")["cues"].append({"bei_s": 70, "text": "Zu spät."})
        self.assertIn("cue_ausserhalb", codes(self.lint(b)))

    def test_doppelter_zeitpunkt_ist_fehler(self):
        b = self.kraft()
        self.block(b)["cues"] = [{"bei_s": 7, "text": "Atme ruhig."}]
        self.assertIn("cue_doppelt", codes(self.lint(b)))

    def test_clips_sind_eindeutig_und_zahlen_werden_geteilt(self):
        m = clip_manifest(self.kraft(), self.einst)
        texte = [c["text"] for c in m["clips"].values()]
        self.assertEqual(len(texte), len(set(texte)))
        self.assertIn("eins", texte)
        self.assertEqual(sum(1 for t in texte if t == "eins"), 1)

    def test_bau_setzt_zahlen_im_takt(self):
        tmp = Path(tempfile.mkdtemp())
        try:
            b = self.kraft()
            clips, aus = tmp / "clips", tmp / "aus"
            bereite_clips(b, clips, self.einst, self)
            plan = erstelle_plan(lade_profil(PROFILE, "P01"), ["KU01"], {"KU01": b}, self.stufen, entwurf=True, einst=self.einst)
            res = baue_plan(plan, {"KU01": b}, self.stufen, clips, aus, self.einst)
            zp = res["audios"][0]["zeitplan"]
            wd = [s for s in zp if s["typ"] == "wiederholungen"]
            self.assertEqual(len(wd), 2)
            for s in wd:
                starts = [c["start_s"] for c in s["cues"]]
                self.assertEqual([round(b_ - a, 2) for a, b_ in zip(starts, starts[1:])], [7.0] * 9)
            pause = next(s for s in zp if s["typ"] == "satzpause")
            self.assertEqual([c["bei_s"] for c in pause["cues"]], [20, 50])
        finally:
            shutil.rmtree(tmp, ignore_errors=True)

    def test_krafbaustein_wird_bei_muskelfaserriss_gesperrt(self):
        e = bewerte_baustein(self.kraft(), {"akuter_muskelfaserriss"}, self.stufen)
        self.assertEqual(e["entscheidung"], "gesperrt")


class TestKraftbausteine(Basis):
    """Alle Kraftbausteine (KU...) lassen sich prüfen, mit Testclips bauen und halten ihre Takte."""

    def test_alle_kraftbausteine_bauen_und_takt_stimmt(self):
        ids = [bid for bid in self.bausteine if bid.startswith("KU")]
        self.assertGreaterEqual(len(ids), 6)
        tmp = Path(tempfile.mkdtemp())
        try:
            bs = {bid: self.bausteine[bid] for bid in ids}
            clips, aus = tmp / "clips", tmp / "aus"
            for b in bs.values():
                bereite_clips(b, clips, self.einst, self)
            plan = erstelle_plan(lade_profil(PROFILE, "P01"), sorted(ids), bs, self.stufen, entwurf=True, einst=self.einst)
            res = baue_plan(plan, bs, self.stufen, clips, aus, self.einst)
            self.assertEqual(sorted(a["baustein"] for a in res["audios"]), sorted(ids))
            for a in res["audios"]:
                for s in a["zeitplan"]:
                    if s["typ"] != "wiederholungen":
                        continue
                    starts = [c["start_s"] for c in s["cues"] if c["bei_s"] % 1 == 0 and c["text"] in
                              ("eins", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun", "zehn", "Rauf", "Runter")]
                    abstaende = {round(y - x, 2) for x, y in zip(starts, starts[1:])}
                    self.assertTrue(abstaende <= {4.0, 7.0}, (a["baustein"], abstaende))
        finally:
            shutil.rmtree(tmp, ignore_errors=True)

    def test_kraftbausteine_bei_muskelfaserriss_gesperrt(self):
        for bid, b in self.bausteine.items():
            if bid.startswith("KU"):
                e = bewerte_baustein(b, {"akuter_muskelfaserriss"}, self.stufen)
                self.assertEqual(e["entscheidung"], "gesperrt", bid)

    def test_schulterprobleme_geben_warnung_bei_armuebungen(self):
        for bid in ("KU04", "KU05", "KU06"):
            e = bewerte_baustein(self.bausteine[bid], {"schulterprobleme"}, self.stufen)
            self.assertEqual(e["entscheidung"], "warnung", bid)


class TestStartwertNachNiveau(Basis):
    """Niveau A startet mit 8, B und C mit 10. Ein Handwert hat immer Vorrang. Das Alter spielt keine Rolle."""

    def plan(self, profil_extra, ids=("KU01",), zustaende=None):
        profil = {"id": "TESTNIV", "zustaende": zustaende or [], **profil_extra}
        return erstelle_plan(profil, list(ids), self.bausteine, self.stufen, entwurf=True, einst=self.einst)

    def test_niveau_a_gibt_acht(self):
        p = self.plan({"niveau": "A"})
        self.assertEqual(p["wiederholungen_pro_satz"], 8)
        self.assertEqual(p["wiederholungen_quelle"], "niveau")
        self.assertEqual(p["bausteine"][0]["wiederholungen_pro_satz"], 8)

    def test_niveau_b_und_c_geben_zehn(self):
        for n in ("B", "C"):
            p = self.plan({"niveau": n})
            self.assertEqual(p["wiederholungen_pro_satz"], 10, n)
            self.assertEqual(p["wiederholungen_quelle"], "niveau", n)

    def test_handwert_schlaegt_niveau(self):
        for niveau, hand in (("A", 12), ("A", 5), ("C", 6), ("B", 8)):
            p = self.plan({"niveau": niveau, "wiederholungen_pro_satz": hand})
            self.assertEqual(p["wiederholungen_pro_satz"], hand, (niveau, hand))
            self.assertEqual(p["wiederholungen_quelle"], "hand")

    def test_ohne_niveau_und_ohne_handwert_gilt_der_baustein(self):
        p = self.plan({})
        self.assertIsNone(p["wiederholungen_pro_satz"])
        self.assertEqual(p["wiederholungen_quelle"], "baustein")
        self.assertEqual(p["bausteine"][0]["soll_dauer_s"], self.bausteine["KU01"]["soll_gesamtdauer_s"])

    def test_alter_aendert_nichts(self):
        a = self.plan({"niveau": "B", "geburtsjahr": 1930})
        b = self.plan({"niveau": "B", "geburtsjahr": 1960})
        self.assertEqual(a["wiederholungen_pro_satz"], b["wiederholungen_pro_satz"])

    def test_automatik_liegt_nie_ausserhalb_acht_bis_zehn(self):
        from audiosystem.common import WDH_START_NACH_NIVEAU
        self.assertTrue(all(8 <= v <= 10 for v in WDH_START_NACH_NIVEAU.values()))
        self.assertEqual(set(WDH_START_NACH_NIVEAU), {"A", "B", "C"})

    def test_ungueltiges_niveau_wird_abgelehnt(self):
        for n in ("D", "a", "", 1, True, ["A"]):
            with self.assertRaises(SystemFehler, msg=repr(n)):
                self.plan({"niveau": n})

    def test_niveau_a_kuerzt_die_dauer_im_takt(self):
        p = self.plan({"niveau": "A"})
        b = self.bausteine["KU01"]
        self.assertEqual(p["bausteine"][0]["soll_dauer_s"], b["soll_gesamtdauer_s"] - 2 * 2 * 7)

    def test_sperre_gilt_trotz_niveau_startwert(self):
        p = self.plan({"niveau": "C"}, zustaende=["akuter_muskelfaserriss"])
        self.assertEqual(p["status"], "kein_audio")

    def test_dehnungen_bleiben_unberuehrt(self):
        p = self.plan({"niveau": "A"}, ids=("HB01", "KU01"))
        hb = next(e for e in p["bausteine"] if e["id"] == "HB01")
        self.assertNotIn("wiederholungen_pro_satz", hb)


class TestWiederholungszahlProPerson(Basis):
    """Profil-Wert wiederholungen_pro_satz (5 bis 12). Nur Plan und Bau ändern sich, die Bausteine nicht."""

    def plan(self, ids, n, zustaende=None, bs=None):
        bs = bs or self.bausteine
        profil = {"id": "TESTWDH", "zustaende": zustaende or [], "wiederholungen_pro_satz": n}
        return erstelle_plan(profil, ids, bs, self.stufen, entwurf=True, einst=self.einst)

    def test_zahl_aendert_dauer_im_takt(self):
        from audiosystem.common import block_cues, mit_wiederholungen
        b = self.bausteine["KU01"]
        for n in (5, 8, 12):
            e = mit_wiederholungen(b, n)
            blk = [s for t in e["teile"] for s in t["segmente"] if s["typ"] == "wiederholungen"]
            self.assertEqual(len(block_cues(blk[0])), n)
            self.assertEqual(blk[0]["soll_dauer_s"], 70 + (n - 10) * 7)
            self.assertEqual([x["text"] for x in block_cues(blk[0])][-1], ["fünf", "acht", "zwölf"][(5, 8, 12).index(n)])
            self.assertEqual(e["soll_gesamtdauer_s"], b["soll_gesamtdauer_s"] + 2 * (n - 10) * 7)
        self.assertEqual(b["soll_gesamtdauer_s"], sollsumme(b))  # Original bleibt unverändert

    def test_wortsignal_zwei_signale_pro_wiederholung(self):
        from audiosystem.common import block_cues, mit_wiederholungen
        e = mit_wiederholungen(self.bausteine["KU06"], 12)
        blk = [s for t in e["teile"] for s in t["segmente"] if s["typ"] == "wiederholungen"][0]
        self.assertEqual(len(block_cues(blk)), 24)
        self.assertEqual(blk["soll_dauer_s"], 80 + 2 * 2 * 4)
        self.assertEqual(max(c["bei_s"] for c in block_cues(blk)), 92)

    def test_ausserhalb_des_bereichs_wird_abgelehnt(self):
        for n in (4, 13, 0, -1, 10.5, "8", True):
            with self.assertRaises(SystemFehler, msg=repr(n)):
                self.plan(["KU01"], n)

    def test_keine_angabe_bleibt_standard(self):
        p = self.plan(["KU01"], None)
        self.assertIsNone(p["wiederholungen_pro_satz"])
        self.assertEqual(p["bausteine"][0]["soll_dauer_s"], self.bausteine["KU01"]["soll_gesamtdauer_s"])

    def test_dehnungen_bleiben_unberuehrt(self):
        p = self.plan(["HB01", "KU01"], 12)
        hb = next(e for e in p["bausteine"] if e["id"] == "HB01")
        ku = next(e for e in p["bausteine"] if e["id"] == "KU01")
        self.assertNotIn("wiederholungen_pro_satz", hb)
        self.assertEqual(ku["wiederholungen_pro_satz"], 12)

    def test_sperre_gilt_trotz_hoher_zahl(self):
        p = self.plan(["KU01"], 12, ["akuter_muskelfaserriss"])
        self.assertEqual(p["status"], "kein_audio")

    def test_clipliste_enthaelt_elf_und_zwoelf_ohne_neue_nummern(self):
        m = clip_manifest(self.bausteine["KU01"], self.einst)
        texte = {c["text"]: cid for cid, c in m["clips"].items()}
        self.assertIn("zwölf", texte)
        self.assertEqual(texte["eins"], "ZAHLEN_zahlen_s00")
        self.assertEqual(m["clips"]["ZAHLEN_zahlen_s11"]["eigner"], "ZAHLEN")

    def test_bau_mit_12_und_6(self):
        tmp = Path(tempfile.mkdtemp())
        try:
            b = self.bausteine["KU01"]
            clips = tmp / "clips"
            bereite_clips(b, clips, self.einst, self)
            for n, erwartet in ((12, 12), (6, 6)):
                plan = self.plan(["KU01"], n, bs={"KU01": b})
                res = baue_plan(plan, {"KU01": b}, self.stufen, clips, tmp / f"aus{n}", self.einst)
                zp = res["audios"][0]["zeitplan"]
                for s in [x for x in zp if x["typ"] == "wiederholungen"]:
                    self.assertEqual(len(s["cues"]), erwartet)
                    starts = [c["start_s"] for c in s["cues"]]
                    self.assertEqual({round(y - x, 2) for x, y in zip(starts, starts[1:])}, {7.0})
                self.assertAlmostEqual(res["audios"][0]["soll_dauer_s"], b["soll_gesamtdauer_s"] + 2 * (n - 10) * 7, places=1)
        finally:
            shutil.rmtree(tmp, ignore_errors=True)


class TestGemeinsameZahlen(Basis):
    """Die Zahlen eins bis zwölf werden einmal aufgenommen und von allen zählenden Bausteinen genutzt."""

    def test_zaehlbausteine_nutzen_gemeinsame_clips(self):
        for bid in ("KU01", "KU02", "KU03", "KU04", "KU05"):
            m = clip_manifest(self.bausteine[bid], self.einst)
            geteilt = [c for c in m["clips"].values() if c.get("eigner")]
            self.assertEqual(len(geteilt), 12, bid)
            self.assertEqual({c["id"] for c in geteilt}, {f"ZAHLEN_zahlen_s{i:02d}" for i in range(12)}, bid)

    def test_wortsignal_bleibt_im_eigenen_baustein(self):
        m = clip_manifest(self.bausteine["KU06"], self.einst)
        self.assertEqual([c for c in m["clips"].values() if c.get("eigner")], [])

    def test_aufnahmeliste_ohne_zahlen_und_mit_hinweis(self):
        tmp = Path(tempfile.mkdtemp())
        try:
            r = schreibe_aufnahmeliste(self.bausteine["KU01"], tmp / "c", tmp / "a", self.einst)
            text = Path(r["markdown"]).read_text(encoding="utf-8")
            self.assertNotIn("**ZAHLEN_", text)
            self.assertIn("ZAHLEN", text)
            r2 = schreibe_aufnahmeliste(lade_baustein("ZAHLEN"), tmp / "c", tmp / "a", self.einst)
            self.assertEqual(r2["anzahl_clips"], 12)
        finally:
            shutil.rmtree(tmp, ignore_errors=True)

    def test_bau_ohne_zahlenaufnahme_scheitert_mit_klarer_meldung(self):
        tmp = Path(tempfile.mkdtemp())
        try:
            b = self.bausteine["KU01"]
            erzeuge_testclips(b, tmp / "c")
            pruefe_baustein_clips(b, tmp / "c", self.einst)
            plan = erstelle_plan({"id": "T", "zustaende": []}, ["KU01"], {"KU01": b}, self.stufen, entwurf=True, einst=self.einst)
            with self.assertRaises(SystemFehler) as cm:
                baue_plan(plan, {"KU01": b}, self.stufen, tmp / "c", tmp / "a", self.einst)
            self.assertIn("ZAHLEN", str(cm.exception))
        finally:
            shutil.rmtree(tmp, ignore_errors=True)

    def test_eine_zahlenaufnahme_reicht_fuer_mehrere_bausteine(self):
        tmp = Path(tempfile.mkdtemp())
        try:
            bs = {bid: self.bausteine[bid] for bid in ("KU01", "KU05")}
            for b in bs.values():
                erzeuge_testclips(b, tmp / "c")
                pruefe_baustein_clips(b, tmp / "c", self.einst)
            z = lade_baustein("ZAHLEN")
            erzeuge_testclips(z, tmp / "c")
            pruefe_baustein_clips(z, tmp / "c", self.einst)
            plan = erstelle_plan({"id": "T", "zustaende": []}, ["KU01", "KU05"], bs, self.stufen, entwurf=True, einst=self.einst)
            res = baue_plan(plan, bs, self.stufen, tmp / "c", tmp / "a", self.einst)
            self.assertEqual(len(res["audios"]), 2)
            her = {p["herkunft"] for p in res["clip_protokoll"]}
            self.assertEqual(her, {"KU01", "KU05", "ZAHLEN"})
        finally:
            shutil.rmtree(tmp, ignore_errors=True)

    def test_veraendertes_zahlenaudio_wird_erkannt(self):
        tmp = Path(tempfile.mkdtemp())
        try:
            b = self.bausteine["KU01"]
            bereite_clips(b, tmp / "c", self.einst, self)
            datei = tmp / "c" / "ZAHLEN" / "ZAHLEN_zahlen_s00.wav"
            schreibe_wav(datei, np.zeros(SAMPLE_RATE, dtype=np.float32) + 0.0001)
            plan = erstelle_plan({"id": "T", "zustaende": []}, ["KU01"], {"KU01": b}, self.stufen, entwurf=True, einst=self.einst)
            with self.assertRaises(SystemFehler) as cm:
                baue_plan(plan, {"KU01": b}, self.stufen, tmp / "c", tmp / "a", self.einst)
            self.assertIn("ZAHLEN_zahlen_s00", str(cm.exception))
        finally:
            shutil.rmtree(tmp, ignore_errors=True)

    def test_zaehlen_ueber_zwoelf_ist_fehler(self):
        b = copy.deepcopy(self.bausteine["KU01"])
        s = [x for t in b["teile"] for x in t["segmente"] if x["typ"] == "wiederholungen"][0]
        s.update({"anzahl": 13, "soll_dauer_s": 100})
        self.assertIn("wdh_zaehlen_zu_viel", codes(pruefe_alles(b, self.stufen, self.einst, "KU01")))
