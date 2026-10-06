# Audio Baukasten für Bewegungspläne

Stand: 02.10.2026, Systemversion 1.0. Alles hier ist Entwurf und fachlich noch nicht von einer Fachperson geprüft.

## Was das System tut

Du sprichst jeden Satz einer Übung einmal ein. Das System prüft die Texte vorher, sagt dir nach der Aufnahme, welche Clips du dir anhören musst (und nur diese), und baut daraus pro Kunde die fertigen Audios. Ein Kunde hört dabei nur Bausteine, die nach festen Regeln zu seinen Angaben passen. Du hörst nie ein ganzes Kundenaudio durch.

## Einrichten (einmalig)

1. Python 3.10 oder neuer.
2. `pip install numpy`
3. ffmpeg installieren. Ohne ffmpeg geht nur WAV (Aufnahmen und Ausgabe). Mit ffmpeg lesen wir auch m4a vom iPhone und schreiben MP3.
4. Optional für die Spracherkennung als Gegenprobe: `pip install faster-whisper`

Alle Befehle werden im Ordner `audio_system` so aufgerufen: `python -m audiosystem BEFEHL`

## Der Ablauf pro Baustein

| Schritt | Befehl | Was passiert |
|---|---|---|
| 1 | `check` | Prüft Texte, Zeiten, Sicherheitssätze und Wortwahl aller Bausteine |
| 2 | `aufnahmeliste HB01` | Erzeugt `ausgabe/aufnahmeliste_HB01.md` und `.csv` mit allen Sätzen, Zielzeiten und Dateinamen |
| 3 | (aufnehmen) | Jeder Satz eine Datei, Name wie in der Liste, ablegen in `clips/HB01/` |
| 4 | `clips HB01` | Misst jede Aufnahme und schreibt `ausgabe/pruefbericht_HB01.md`: neu aufnehmen, anhören oder in Ordnung |
| 5 | `abnehmen HB01 CLIP_ID --von DEINNAME` | Bestätigt einen auffälligen Clip, den du angehört hast und der gut ist |
| 6 | `regeltest` | Prüft das Regelwerk (30 Testprofile, alle Zustandskombinationen bis drei) und den Fragebogen (55 Antwortprofile, 400 zufällige Antwortverläufe mit Eigenschaftsprüfung) |
| 7 | `bauen --profil-datei F --profil P01` | Erzeugt Audios, Playlist, Prüfbogen und Planblatt Entwurf |

Zum Ausprobieren ohne echte Aufnahmen: `python -m audiosystem demo` spielt alles mit künstlichen Testclips durch, einschließlich absichtlich eingebauter Fehler. Die Ergebnisse landen im Ordner `demo_workspace`.

Tests: `python -m unittest discover -s tests`

Fragebogen: `python -m audiosystem auswerten --antworten datei.json` liefert Ampel, Zustände, vorläufiges Niveau und Ziele. `python -m audiosystem fragebogen-doc` erzeugt `ausgabe/fragebogen_entwurf_4.md` aus den Daten.

## Die Sicherheitsnetze

- **Wortwahl:** Heil und Wirkaussagen (schmerzfrei, Therapie, verhindert Stürze und ähnliche) im gesprochenen Text sind ein Fehler und stoppen den Bau.
- **Pflichtsätze:** Vor jeder Haltephase muss ein Satz mit dem Schmerzhinweis stehen. Bei Liegepositionen muss die Einleitung den Schwindel ansprechen.
- **Zeiten:** Gesamtdauer, Haltezeit und Platz zwischen den Cues werden nachgerechnet. Ein Cue, der nicht in sein Zeitfenster passt, wird vor der Aufnahme gemeldet.
- **Aufnahmen:** Dauer, Lautstärke, Übersteuerung, Rauschen, Pausen mitten im Satz und Sprechtempo werden gemessen. Fehlende Dateien fallen auf.
- **Spracherkennung (optional):** Vergleicht den gesprochenen Text mit dem Skript und schlägt bei vertauschtem rechts und links an.
- **Textänderung:** Ändert sich ein Text nach der Aufnahmeliste, wird die alte Aufnahme in `_veraltet` verschoben. Eine Aufnahme mit altem Text kann nicht in ein Audio rutschen.
- **Veränderte Datei:** Wird eine Aufnahme nach der Prüfung ausgetauscht, gilt die Prüfung und eine Abnahme nicht mehr.
- **Freigabe:** Kundenaudios gibt es nur aus Bausteinen mit Status `freigegeben`. Mit `--entwurf` geht es für Tests, die Dateien heißen dann `ENTWURF_...`.
- **Stufe 1:** Pläne mit Stufe 1 werden nicht automatisch gebaut. Nur mit `--stufe1-freigabe DEINNAME`, und der Name steht im Plan.
- **Unbekannte Zustände:** Ein Tippfehler im Profil bricht ab, statt als gesund zu gelten.
- **Prüfbogen:** Jeder Plan bekommt einen `intern_pruefbogen.md` mit allen Entscheidungen, weggelassenen Cues, Prüfsummen und einer Zeile für deine Unterschrift. Er enthält Gesundheitsangaben als Codes und ist nur intern.

## Wie die Stufen wirken

`regeln/stufen.json` enthält alle Zustände mit Namen. Stufe 1 gilt für jeden Baustein (zum Beispiel Thromboseverdacht, Brustschmerz bei Belastung). Jeder Baustein kann zusätzlich eigene Zuordnungen haben und globale Stufen nur verschärfen, nie abschwächen. Es gilt immer die strengste Stufe.

| Stufe | Entscheidung | Wirkung |
|---|---|---|
| 1 | manuell | Kein automatischer Plan, du entscheidest |
| 2 | gesperrt | Baustein fehlt im Plan, optional Ersatzbaustein |
| 3 | warnung | Baustein bleibt, mit Variantentext oder weggelassenem Cue und Hinweis auf dem Planblatt |
| 4 | info | Hinweis im Heft, keine Änderung |

## Neuen Baustein anlegen

HB01.json kopieren, in `bausteine/` ablegen und anpassen, dann `check`. Nützliche optionale Felder:

- Cue mit `"optional": true` und `"ausschluss_bei": ["zustand"]` fällt bei diesem Zustand weg. `"nur_bei"` macht es umgekehrt.
- `"varianten": [{"bei_zustand": "...", "text": "...", "soll_dauer_s": 15}]` an einem Sprechsegment oder Cue tauscht den Text. Die Variante muss einmal aufgenommen werden.
- `"ersatz": ["HB05"]` am Baustein nennt einen Ersatz, wenn er gesperrt ist.
- `"kundentext": "..."` an einer Stufenzuordnung ist ein von dir formulierter Hinweis für das Planblatt.

Neue Zustände zuerst in `regeln/stufen.json` eintragen, sonst lehnt `check` sie ab.

## Ordner

- `bausteine/` Baustein Dateien (HB01, HB02)
- `regeln/stufen.json` Zustände und Stufen
- `profile/testprofile.json` 30 erfundene Testprofile mit erwarteten Ergebnissen
- `regeln/fragebogen.json` der Fragebogen als Daten (Entwurf 4, 76 Fragen, Körperkarte R0, Schmerzblock P)
- `profile/testantworten.json` 30 Altprofile als Antworten (A01 bis A30) und 25 Zusatzfälle (N01 bis N25)
- `clips/` deine Aufnahmen, ein Unterordner pro Baustein
- `ausgabe/` Aufnahmelisten, Prüfberichte und gebaute Pläne
- `einstellungen.json` Lautstärke, Vor und Nachlauf, Pause zwischen Bausteinen und weitere Werte
- `audiosystem/` der Programmcode

## Was bewusst noch fehlt oder offen ist

- Alles wurde mit künstlichen Testsignalen getestet, nicht mit echter Stimme und echtem Mikrofon. Die Grenzwerte der Clip Prüfung (Rauschabstand, Tempo, Pausen) musst du mit den ersten echten Aufnahmen kurz gegenprüfen und in `einstellungen.json` oder `pruefen.py` anpassen.
- Die Spracherkennung ist als Code vorhanden, aber nicht ausprobiert, weil sie ein Modell aus dem Internet lädt.
- Lautstärke wird über den Sprach RMS angeglichen, nicht nach LUFS. Das reicht für gleichmäßige Sprache, ist aber kein Mastering.
- Stufen und Sperren sind Entwurf und brauchen die fachliche Gegenlesung.
- Für Ischias (HB01) und Hohlkreuz (HB02) gibt es noch keinen Variantentext und keinen Kundenhinweis. Das meldet `check` als Hinweis.
- Das Planblatt ist nur ein Entwurf. Kundentexte müssen von dir kommen und rechtlich geprüft werden.
- Fragebogen und Ampel (Entwurf 4) sind gebaut und getestet, aber nicht fachlich geprüft. Neue Fragen (E3f, E9, E10, E11, R0), die Zählgruppen der Regionen und die strittigen Rot Regeln (C3a, D2a) sind Vorschläge.
- Orange O8 und O9 sind nicht umgesetzt, weil die Kernbausteine fehlen. `auswerten` nennt das unter "noch nicht geprüft".
- Region angegeben, Genaueres unklar: Bausteine mit `belastet_regionen` bekommen mindestens Stufe 3. Welche Regionen ein Baustein belastet, entscheidest du (HB01, HB02: Vorschlag).
- Die Auswahl der Bausteine nach Alltagsproblem und Niveau ist noch nicht gebaut. Bisher gibst du die Bausteine mit `--bausteine` an.

## Kraftübungen: Segmenttypen `wiederholungen` und `satzpause` (neu, 03.10.2026)

Neben `sprechen`, `pause` und `halten` gibt es zwei Zeitblöcke mit Hinweisen zu festen Zeitpunkten:

- `wiederholungen`: ein Satz Wiederholungen mit fester Dauer. Die Hinweise erzeugt das System selbst.
  - `"modus": "zaehlen"`, `anzahl` (höchstens 20), `takt_s`: spricht eins, zwei, drei bis zur Anzahl, alle `takt_s` Sekunden.
  - `"modus": "wortsignal"`, `woerter` (zum Beispiel Rauf, Runter), `anzahl`, `takt_s`: spricht die Wörter reihum im Takt, ohne zu zählen. Bei Rauf und Runter sind zehn Wiederholungen also 20 Signale.
  - Optional `start_s` (Versatz des ersten Hinweises) und eigene `cues` zusätzlich. `takt_s` und `start_s` müssen ganze Sekunden sein.
- `satzpause`: Pause mit fester Dauer und ausdrücklichen `cues` (zum Beispiel bei 20 und 50 Sekunden), sonst wie `halten`.

Die Prüfung (`check`) meldet als FEHLER: unbekannter Modus, fehlende Angaben, letzter Hinweis außerhalb der Dauer, doppelte Zeitpunkte, Zählen über zwanzig. Der Schmerzsatz ist auch vor `wiederholungen` Pflicht (im gleichen Teil, davor). Beispiel: `bausteine/KU01.json` (Aufstehen vom Stuhl, Entwurf, Regionen und Stufen nicht fachlich geprüft).

Die Tests mit Erwartungen aus `testprofile.json` laufen nur über HB01 und HB02 (`KERN_BAUSTEINE` in `tests/test_system.py`). Neue Bausteine bekommen eigene Tests.

## Wiederholungen pro Person (neu, 03.10.2026)

Im Profil (zum Beispiel nach dem Rückruf) lässt sich `"wiederholungen_pro_satz": 8` setzen, erlaubt sind ganze Zahlen von 5 bis 12. Ohne Angabe gilt der Standard des Bausteins (10). Das System passt Zählhinweise und Blockdauer im Takt an, bei Wortsignal (Rauf und Runter) zwei Hinweise pro Wiederholung. Die Pause nach dem letzten Hinweis bleibt gleich lang. Der Wert steht im Plan (`wiederholungen_pro_satz`) und je Baustein. Dehnungen bleiben unberührt, Sperren und Stufen gelten unverändert. Eine Zahl außerhalb des Bereichs bricht den Plan mit einer Fehlermeldung ab.

Startwert aus dem Niveau (06.10.2026, Landos Vorgabe nach dem Beispiel Horst): Steht im Profil `"niveau": "A"`, `"B"` oder `"C"`, setzt das System ohne Handwert automatisch 8 Wiederholungen bei Niveau A und 10 bei B und C. Das Alter spielt keine Rolle. Ein Handwert (`wiederholungen_pro_satz`, 5 bis 12) hat immer Vorrang, 5 bis 7 und 11 bis 12 gibt es nur so. Im Plan steht die Herkunft des Werts (`wiederholungen_quelle`: hand, niveau oder baustein). Das Niveau liefert `auswerten` als `niveau_vorlaeufig`, es gehört vor dem Planbau ins Profil. Ein ungültiges Niveau bricht den Plan ab. Fachlich nicht geprüft (OP-F24).

Die Aufnahmeliste und die Clip Prüfung gehen immer von zwölf Wiederholungen aus. Die Zahlen eins bis zwölf werden nur einmal aufgenommen, siehe nächster Abschnitt.

## Gemeinsame Zahlen (Baustein ZAHLEN)

Alle Bausteine im Zählmodus nutzen dieselben zwölf Aufnahmen für eins bis zwölf. Sie stehen in `bausteine/_gemeinsam/ZAHLEN.json` und liegen in `clips/ZAHLEN/`. Der Ablauf ist wie bei jedem Baustein: `aufnahmeliste ZAHLEN`, aufnehmen, `clips ZAHLEN`, bei Auffälligkeiten `abnehmen`. ZAHLEN ist kein Übungsbaustein und kommt in keinen Plan.

- Die Aufnahmeliste eines Zählbausteins enthält die Zahlen nicht mehr und weist auf ZAHLEN hin.
- Ein Plan lässt sich erst bauen, wenn auch ZAHLEN geprüft ist. Ändert sich eine Zahlendatei nach der Prüfung, bricht der Bau ab und nennt die Clip Nummer.
- Das Protokoll im Plan (`clip_protokoll`) nennt bei jedem Clip die Herkunft (Baustein oder ZAHLEN).
- Zählen geht höchstens bis zwölf. Rauf und Runter (Wortsignal) bleiben im eigenen Baustein.
- Bei einem neuen Zahlenclip dauert das Soll nur 0,5 Sekunden, erlaubt sind bis zu eine Sekunde mehr oder weniger.

Schmerzblock P (06.10.2026): P0 wählt aus der Körperkarte höchstens drei Bereiche mit Schmerzen (Fragetyp `region_teilauswahl`, "nichts" heißt keine Schmerzen). Pro gewähltem Bereich kommen P1 (Art), P2 (Größe der Stelle) und P3 (Verlauf). Nur P3 "schlechter" wirkt (Orange O13), Art und Größe sind Information für den Rückruf. Eine Ursache (Muskel oder Gelenk) leitet das System nicht ab (OP-R1). Sichtbare Fragen: gesund 37, eine Region 40, drei Regionen 43, drei Regionen mit Schmerz bis 52. Texte nicht fachlich geprüft (OP-F25). 116 Tests laufen durch.
