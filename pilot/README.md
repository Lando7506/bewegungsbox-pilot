# Pilot Senioren-Bewegungsbox

Ein klickbarer Pilot zur Veranschaulichung, für Lando und die Fachperson. Er ist kein Shop und kein Medizinprodukt. Inhalte sind nicht fachlich geprüft und ersetzen keine ärztliche Beratung.

Adresse (nach dem Einrichten von GitHub Pages): https://lando7506.github.io/bewegungsbox-pilot/

## Was der Pilot kann

1. **Fragebogen:** Alle Fragen aus `audio_system/regeln/fragebogen.json` (Entwurf 4), eine Frage pro Bildschirm, mit Fortschritt und Zurück. Bedingungen, Körperkarte (R0), Schmerzblock (P0 bis P3) und Ziele (Z3) wirken wie in den Daten. Antworten bleiben beim Zurückgehen erhalten.
2. **Ampel:** Rot, Orange, Gelb oder Grün nach festen Regeln, ohne KI. Die Logik in `logik.js` ist ein Nachbau von `auswerten` aus `fragebogen.py`. Bei Rot gibt es keinen Plan, bei Orange heißt es „Rückruf nötig“, bei Gelb und Grün gibt es einen Plan. Unter „Für Lando und die Fachperson“ steht, wie die Ampel zustande kam.
3. **Plan:** Nachbau von `erstelle_plan` aus `regeln.py`. Pro Übung siehst du Titel, Entscheidung (frei, Hinweis, Warnung, ersetzt, gesperrt), Wiederholungen samt Herkunft (Niveau A 8, B und C 10) und Dauer.
4. **Abspielen:** Ein einfacher Player liest die Übungen mit der Sprachausgabe des Browsers vor. Er ist sichtbar als „Platzhalterstimme, keine echte Aufnahme“ gekennzeichnet. Es gibt große Knöpfe für Abspielen, Pause, Übung wiederholen und Nächste Übung. Der Text läuft mit, so geht es auch ohne Ton.
5. **Beispiele:** Oben im Menü lassen sich alle Testprofile aus `profile/testantworten.json` laden, je Ampelfarbe gibt es eins vorne.

## Was bewusst fehlt

- Echte Aufnahmen. Die Bausteine sind Entwürfe und nicht freigegeben.
- Die Auswahl der Übungen nach Alltag und Niveau. Der Plan zeigt alle vorhandenen Bausteine.
- Stufe 2 (Vertiefung), Orange O8 und O9, Gleichgewichtsübungen.
- Rückruf, Mails, Konten, Preis, Bezahlung und Rechtstexte.
- Speichern. Alles liegt nur im Arbeitsspeicher des Browserfensters. Es gibt keinen Server, keine Tracker und keine externen Schriften oder Skripte. Die Seite verbietet Verbindungen nach außen auch technisch (Content Security Policy).

## Lokal starten

Doppelklick auf `pilot/index.html` reicht. Die Seite läuft ohne Server und ohne Internet.

## Dateien

| Datei | Inhalt |
| --- | --- |
| `index.html`, `app.css`, `app.js` | Oberfläche |
| `logik.js` | Ampel und Plan, Nachbau des Python Systems |
| `daten.js` | Fragebogen, Stufen, Bausteine und Beispiele. Wird erzeugt, nicht von Hand ändern |
| `werkzeuge/export.py` | Erzeugt `daten.js` und `tests/erwartung.json.gz` aus `audio_system` |
| `tests/vergleich.test.js` | Vergleicht die JS Logik mit dem Python System |
| `tests/sabotage.test.js` | Zeigt, dass der Vergleich eine falsche Rot Regel bemerkt |
| `tests/browser.test.js` | Klickt die App in Chromium durch und macht Screenshots |
| `screenshots/` | Ergebnis des Browsertests, breit und in Handybreite 390 px |

## Wenn sich Fragebogen, Regeln oder Bausteine ändern

```
python pilot/werkzeuge/export.py        # daten.js und Erwartungswerte neu erzeugen
node pilot/tests/vergleich.test.js      # muss "0 Abweichungen" melden
node pilot/tests/sabotage.test.js
node pilot/tests/browser.test.js        # braucht Playwright
```

Ändert sich die Python Logik (`fragebogen.py`, `regeln.py`, `common.py`), muss `logik.js` nachgezogen werden. Der Vergleichstest zeigt jede Stelle, an der beide verschieden entscheiden. Dann gilt immer: Python hat recht.

Der Workflow `.github/workflows/pages.yml` führt die Python Tests, die Prüfung auf aktuelle Daten, den Vergleich und den Sabotagetest bei jedem Push aus und veröffentlicht nur, wenn alles grün ist.
