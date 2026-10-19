# Stand Pilot (06.10.2026)

- **Adresse:** https://lando7506.github.io/bewegungsbox-pilot/ (gilt, sobald Pages eingerichtet und `pilot` nach `main` übernommen ist)
- **Repo:** Lando7506/bewegungsbox-pilot, Branch `pilot`, Pull Request gegen `main`
- **Lokal:** `pilot/index.html` per Doppelklick öffnen, ohne Server, ohne Internet

## Stand

- Fragebogen Entwurf 4 (alle Fragetypen, Körperkarte, Schmerzblock P), Ampel, Plan und Player sind gebaut.
- Die JS Logik entscheidet in allen 13.076 Vergleichsprüfungen genau wie das Python System. Dazu gehören 55 Testprofile, 400 Zufallsverläufe aus `regeltest.py`, 400 milde Zufallsverläufe und alle Zustände einzeln und paarweise.
- Der Sabotagetest (B1 ohne Rot) wird erkannt, mit 46 Abweichungen.
- Der Browsertest bestand 82 von 82 Prüfungen: grüner und roter Fall per Klick, alle Ampelfarben über Beispiele, Player, Tastatur, Handybreite 390 px, Schrift ab 20 px, keine Anfragen nach außen.
- Die Python Tests laufen unverändert grün (116). Am Python System wurde nichts geändert.

## Bekannte Lücken

- Keine echten Aufnahmen. Der Player nutzt die Sprachausgabe des Browsers. Wie sie klingt, hängt vom Gerät ab, und manche Geräte haben keine deutsche Stimme.
- Die Auswahl der Übungen nach Alltag und Niveau fehlt. Der Plan zeigt alle acht Bausteine. Die Ziele aus Z3 werden ausgewertet, wirken aber noch nicht.
- Stufe 2, Orange O8 und O9 sowie Gleichgewichtsübungen fehlen.
- Der Ton wurde nur in Chromium ohne Lautsprecher geprüft, nicht auf einem echten Handy oder Tablet. Auch mit einem Screenreader wurde nicht getestet.
- Fachliche Auffälligkeiten stehen in `ABSCHLUSSBLATT.md`.

## Nachtrag 06.10.2026: Bedienung nach simulierten Kundentests

- Vier simulierte Kunden haben getestet (Tablet mit Sehschwäche, Angehörige in Eile, Zittern, UX-Expertin). Berichte und Zusammenfassung stehen in `ux-tests/`.
- Die Fragen sind nach Thema gruppiert. Ein typischer Fall braucht etwa 20 statt 37 bis 49 Bildschirme. Ein automatisches Weiter gibt es nicht mehr, dafür eine feste Leiste mit Weiter, Rückfragen vor dem Löschen und eine Übersicht vor der Auswertung.
- Browsertest: 567 Prüfungen in drei Bildschirmgrößen, alle bestanden. Darstellungstest: 386 Prüfungen, Fragetexte unverändert. Vergleich mit Python weiter 0 Abweichungen.

