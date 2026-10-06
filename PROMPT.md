# Prompt für Claude Code: Pilot "Senioren-Bewegungsbox"

Du baust einen klickbaren Piloten (Demo) für Lando, damit er und seine Fachperson sich das Ganze veranschaulichen können. Der Pilot ist kein Shop und kein Medizinprodukt. Er zeigt den Ablauf: Fragebogen, Ampel, Plan, Abspielen.

## Zuerst lesen (nicht raten)
1. `docs/BRIEFING.md` (Hintergrund, Ampel, Stufen, Ton). Du hast keinen Zugriff auf Landos Projektdokumente, alles Nötige steht im Repo.
2. `audio_system/README.md` und `audio_system/UEBERGABE.md`. Dort liegen `regeln/fragebogen.json` (76 Fragen, Entwurf 4), `regeln/stufen.json`, `bausteine/`, `profile/testantworten.json` und die Python Logik (`audiosystem/fragebogen.py`, `regeln.py`). Das Python System ist die Referenz. Ändere es nicht, außer du findest einen Fehler, dann melde ihn Lando.

## Was gebaut wird
Eine statische Web App, die ohne Server läuft und über GitHub Pages abrufbar ist. Ordner `pilot/` im Repo.

1. **Fragebogen:** liest `fragebogen.json` und zeigt die Fragen so, wie die Daten es vorgeben (Schritte, Bedingungen, alle Fragetypen inklusive `region_karte`, `region_teilauswahl`, `ziele`, `hat_region`). Eine Frage pro Bildschirm oder eine kleine Gruppe, Fortschrittsanzeige, Zurück Knopf, Antworten bleiben beim Zurückgehen erhalten. Unbekannt oder "Weiß nicht" zählt nie als gesund.
2. **Ampel:** Auswertung als JavaScript Nachbau von `auswerten` (Rot, Orange, Gelb, Grün, Zustände, vorläufiges Niveau, Orange Codes O1 bis O13). Zeige das Ergebnis in einfacher Sprache. Bei Rot kein Plan, bei Orange "Rückruf nötig", bei Gelb und Grün ein Plan.
3. **Plan:** aus den Zuständen mit der Logik aus `regeln.py` (Stufen 1 bis 4, Ersatzbausteine, Wiederholungen aus Niveau: A = 8, B und C = 10). Zeige pro Baustein Titel, Entscheidung (frei, Hinweis, Warnung, ersetzt, gesperrt) und die Wiederholungszahl samt Herkunft.
4. **Abspielen:** Ein einfacher Player für die Reihenfolge der Bausteine. Es gibt noch keine echten Aufnahmen. Nimm die Demo Testclips aus dem System, falls vorhanden, sonst die Sprachausgabe des Browsers (speechSynthesis) mit den Texten aus den Bausteinen. Markiere das sichtbar als "Platzhalterstimme, keine echte Aufnahme". Große Tasten, Pause, Weiter, Wiederholen.
5. **Demo Profile:** Ein Auswahlmenü oben lädt Beispielantworten aus `profile/testantworten.json` (grün, gelb, orange, rot), damit man alle Ampelfarben in einer Minute sieht.

## Pflichtregeln
- **Kennzeichnung:** Auf jeder Seite ein fester Hinweis: "Pilot zur Veranschaulichung. Inhalte sind nicht fachlich geprüft und ersetzen keine ärztliche Beratung." Nichts als Therapie oder Behandlung bezeichnen. Keine Ursache (Muskel oder Gelenk) ableiten (OP-R1).
- **Datenschutz:** Alles bleibt im Browser. Keine Server, keine Tracker, keine externen Schriften oder Skripte (kein CDN), nichts wird gespeichert oder gesendet. Antworten höchstens im Arbeitsspeicher, optional Knopf "Alles löschen".
- **Verkaufen:** Kein Preis, kein Kaufknopf, keine Zahlung, keine Heilversprechen. Nichts, was Lando nicht vertritt.
- **Sicherheit vor Komfort:** Wenn die JS Logik und die Python Logik verschieden entscheiden, ist die Python Logik richtig und die JS Logik ein Fehler.
- **Nutzer sind Senioren:** Große Schrift (mindestens 20 px), hoher Kontrast, große Tippflächen, einfache Wörter, keine Fachbegriffe, funktioniert auf Handy und Tablet, bedienbar mit der Tastatur.
- **Sprache:** Deutsch. Anrede "du" in allen Texten für Nutzer. Keine Gedankenstriche, keine Formulierungen, die nach KI klingen. Kurze, ruhige Sätze.
- **Texte:** Fragetexte kommen aus `fragebogen.json`. Erfinde keine eigenen Gesundheitsfragen oder Regeln. Eigene Texte nur für Bedienung (Knöpfe, Fortschritt, Hinweise).

## Prüfung (ohne Ausnahme)
- Schreibe einen Test (Node), der alle Profile aus `profile/testantworten.json` durch die JS Auswertung schickt und mit dem Ergebnis des Python Systems vergleicht (Ampel, Zustände, Niveau, Orange Codes). Dazu die 400 zufälligen Antwortverläufe aus `regeltest.py`, wenn sich das exportieren lässt. Alle müssen übereinstimmen. Erzeuge die Python Erwartungswerte per Skript als JSON Datei, nicht von Hand.
- Führe einen Sabotagetest durch: Ändere eine Rot Regel in der JS Logik und zeige, dass der Test fehlschlägt, dann zurück.
- Öffne die App in Chromium (Playwright ist vorinstalliert), gehe einen grünen und einen roten Fall durch und mache Screenshots in `pilot/screenshots/`. Prüfe Handybreite 390 px.
- Das Python Testpaket (`python -m unittest discover -s tests`, 116 Tests) muss weiter grün sein.

## Lieferung
- Branch `pilot`, Pull Request gegen `main`. GitHub Pages aus `pilot/` einrichten (oder Workflow `pages.yml`) und die Adresse nennen.
- `pilot/README.md` auf Deutsch: was der Pilot kann, was bewusst fehlt, wie man ihn lokal startet.
- Schreibe am Ende in dein Abschlussblatt: was gebaut ist, was die Tests zeigen, was nicht geprüft werden konnte, und eine Liste der Stellen, an denen die Fachperson schauen sollte.
- Schreibe `pilot/STAND.md` (Adresse, Stand, bekannte Lücken). Lando trägt es danach selbst in sein Projekt ein.

## Nicht tun
- Keine Zahlungsanbieter, kein Newsletter, kein Formularversand, keine Konten.
- Keine echten Gesundheitsdaten verarbeiten, nur die Testprofile.
- Nichts am Fragebogen fachlich ändern. Auffälligkeiten als Liste an Lando.
