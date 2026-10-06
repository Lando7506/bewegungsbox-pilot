# Übergabe: Audio System und Bausteine

Stand: 02.10.2026. Diese Datei fasst zusammen, was in diesem Chat entschieden und gebaut wurde, damit du in einem neuen Chat nahtlos weiterarbeiten kannst. Das ist keine Rechtsberatung und keine medizinische Freigabe.

## Ziel

Du sprichst Übungen einmal ein. Aus freigegebenen Bausteinen entsteht pro Kunde nach festen Regeln eine Playlist. Du hörst keine Kundenplaylist durch, weil Bausteine, Regelwerk und Aufnahmen vorher automatisch geprüft werden. Dein Name steht nur auf Material, hinter dem du voll stehst. Später soll dasselbe als App Zusatzangebot (ca. 10 Euro) verkauft werden können, deshalb ist alles in JSON gespeichert.

## Entscheidungen zu den Übungen

**Für alle Dehnungen**
- Eine einzige Haltephase von 90 Sekunden pro Bein, keine Wiederholungen. Empfohlen: alle 2 Tage.
- Dehnung ist unangenehm, das ist richtig so. Auf einer Skala von 0 bis 10 höchstens eine 2. Schmerz in Hüfte oder Knie ist ein Warnsignal, dann sofort lockerlassen.
- Kribbeln wird bewusst nicht als Warnsignal genannt, weil es zur Dehnung gehören kann.
- Während der Haltephase kommen alle 10 Sekunden kurze Kontrollhinweise (Knie durchgestreckt, Zehenspitzen heranziehen, anderes Bein gestreckt, Dehnung nachlassen und nachziehen).
- Bei 0:50 darf ein Zweizeiler stehen. Bei 1:25 kommt "Du hast es gleich geschafft", nur beim zweiten Bein.
- Jedes Bein hat einen vollständigen eigenen Audioblock. Zum Schluss locker ausschütteln und langsam aufsetzen.
- Sicherheitshinweise zur Arztabsprache stehen einmal zentral im Fragebogen und auf einem Blatt in der Box (Häkchen beim Kauf), nicht in jedem Audio. Im Audio bleibt nur der Schwindelsatz beim Hinlegen. Die Arztabsprache ist eine Empfehlung, kein Verbot.

**HB01: Beinbeuger dehnen (Rückenlage)**
- Beide Beine durchgestreckt. Band unter der Fußsohle, in der Mitte zwischen Ferse und Fußballen, etwas näher am Fußballen. Ziel ist ein rechter Winkel. Der Satz "wenn du Erfahrung hast, ziehe weiter" ist vorerst gestrichen.

**HB02: Beinstrecker dehnen (Seitenlage)**
- Körper bildet eine gerade Linie ("nicht hängen wie ein Sack Kartoffeln"). Band am Fußgelenk (nicht "Knöchel", das verstehen Laien besser). Kommt die Hand schon ans Fußgelenk, geht es ohne Band.
- In den letzten 30 Sekunden gibt es einen optionalen Cue, die Hüfte nach vorne zu schieben. Er entfällt bei Hüftprothese, Knieprothese und Kniearthrose.

**Änderungen gegenüber den zuletzt gezeigten Texten (bitte bestätigen)**
- HB02, Cue bei 0:22 gekürzt: "Ziehe die Ferse ein Stück näher, bis du das Ziehen vorne spürst." (vorher mit "am Oberschenkel").
- HB02, optionaler Cue bei 1:05 gekürzt: "Ferse am Gesäß? Dann schiebe die Hüfte ein Stück nach vorne, wenn es angenehm ist." (vorher 19 Wörter, hätte nicht in sein Zeitfenster gepasst).
- HB01, Gesamtdauer korrigiert auf 376,5 Sekunden (6:16,5). Die Zahl 374,5 in der zuerst gelieferten Datei war falsch.
- HB02, Akuter Muskelfaserriss sperrt jetzt auch HB02. Hüft und Knieprothese sind getrennte Zustände.

## Stufensystem (Entwurf, braucht Fachperson)

Die Stufe gehört zur Kombination aus Zustand und Baustein, es gilt die strengste.
1. Kein automatischer Plan, Lando entscheidet persönlich.
2. Baustein gesperrt, wenn möglich Ersatz.
3. Warnstufe, Variante oder Hinweis auf dem Planblatt.
4. Nur Info im Heft.

Globale Stufe 1 (gilt für jeden Baustein): Thromboseverdacht, Hüft oder Knie OP unter 3 Monaten, Rücken oder Schulter OP unter 3 Monaten, Ischias Notfallzeichen (Taubheit im Schritt, Blasen oder Darmprobleme, zunehmende Lähmung), neuer unklarer Schwindel, Brustschmerz oder Atemnot bei Belastung, Herzinfarkt, Schlaganfall oder Herz OP unter 6 Monaten, nicht abgeklärter Sturz, Knochenbruch unter 3 Monaten, starke neue Schmerzen in Ruhe, Arzt riet vom Training ab, kann sich im Bett nicht selbst drehen, Osteoporose ohne Freigabe. Diese Liste habe ich aus dem Fragebogen Entwurf übernommen, sie ist nicht fachlich geprüft.

Ischias ist Stufe 3 (Warnstufe, bei HB01 mit Variante, Knie leicht gebeugt), keine automatische Sperre.

## Was gebaut ist

Der Ordner `audio_system` (siehe `README.md` dort):
- Baustein Dateien HB01 und HB02, Stufendatei, 30 Testprofile.
- Textprüfung (Struktur, Zeiten, Heilaussagen, Pflichtsätze), Aufnahmeliste, Clip Prüfung mit Abnahme, optionale Spracherkennung, Zusammenbau mit Playlist, Prüfbogen und Planblatt Entwurf.
- Fragebogen Entwurf 4 nach Körperregionen als Daten, Auswertung (Rot, Orange, Gelb, Grün, Niveau, Ziele), Regelregel "Region unklar" (mindestens Stufe 3). 57 automatische Tests, alle bestanden, dazu eine Demo mit künstlichen Testclips.

## Was noch offen ist

1. Mikrofon anschaffen, dann drei Probeclips aufnehmen und die Grenzwerte der Clip Prüfung gegen echte Stimme prüfen.
2. Fachperson (ehemaliger Ausbilder, Physiotherapie oder Sportmedizin) für Stufen und Texte. Rolle und Haftung vorher schriftlich klären.
3. Variantentexte für Ischias (HB01) und Hohlkreuz (HB02), Kundenhinweise für das Planblatt.
4. Fotos für Übungskarten, drei pro Übung: Ausgangslage, Bandposition, Endposition.
5. Nächste Bausteine: erst weitere Dehnungen, danach Kraftübungen (Aufstehen vom Stuhl zählt zu Kraft). Faszienübungen nicht jetzt.
6. Fragebogen: Entwurf 4 von dir und der Fachperson prüfen lassen (neue Fragen, Zählgruppen, Rot bei C3a und D2a, Abweichungen von Dokument 12 und 13). Orange O8 und O9 und die Auswahl der Bausteine nach Alltagsproblem und Niveau fehlen noch. `belastet_regionen` in HB01 und HB02 bestätigen.
7. Spracherkennung einmal auf deinem Rechner ausprobieren (nicht getestet).
8. Alles aus dem Projektstand bleibt bestehen: Haftpflicht, Rechtstexte, Gewerbe, Pilot mit 5 bis 10 Kunden.

## Stand 03.10.2026, Abend: Kraftübungen

- Neue Segmenttypen `wiederholungen` (Zählen oder Wortsignal im festen Takt) und `satzpause`, siehe README. 71 Tests laufen durch (14 neue in `TestWiederholungen`, davon drei mit Sabotageprobe gegengeprüft).
- Erster Kraftbaustein: `bausteine/KU01.json` (Aufstehen vom Stuhl), 17 Clips, Länge etwa 4:14, Status Entwurf. Text aus Dokument 18. Ergänzt wurde der Schmerzsatz (fehlte im Skript, ist Pflicht). Vorschläge ohne Fachprüfung: `belastet_regionen` hueft, knie, oberschenkel_wade und die Sperre bei akutem Muskelfaserriss.
- Alte Clip IDs von Dehnbausteinen bleiben unverändert. Die Hinweise in Kraftblöcken heißen `<Baustein>_<Teil>_s<Index>_c<Sekunde>`.
- Bekannte Lücke: Ohne `stufen_zuordnung` ist ein Baustein für jede Person "frei", außer bei globalen Regeln und unklarer Region. Jeder neue Kraftbaustein braucht deshalb vor dem Einsatz eine geprüfte Zuordnung.
- Später am Abend: KU02 (Marsch), KU03 (Kniebeugen), KU04 (Wandliegestütze), KU05 (Schulterheben), KU06 (Bizeps Curls, Wortsignal Rauf und Runter, beide Arme) als Entwürfe angelegt, aus Dokument 18. 74 Tests grün. Alle mit demselben Vorschlag: gesperrt bei akutem Muskelfaserriss, Warnung bei standunsicher (Beine und Wand) und schulterprobleme (Arme und Schulter). Regionen und Stufen ungeprüft (OP-F23). Der Schmerzsatz steht überall, den die Skripte nicht hatten. Die Bausteine halten die Zählzeiten aus dem Skript (7 s, 4 s, 4 s je Wort), kein Baustein ist aufgenommen.
- Bei KU03 und KU04 zählt das Audio bis zehn, auch wenn "so viele du schaffst" gilt. Wer früher aufhört, hört trotzdem weiter die Zahlen. Das ist eine Entscheidung für Lando (siehe 14, OP-B21).
- Wiederholungen pro Person (siehe README): `wiederholungen_pro_satz` im Profil, 5 bis 12, auf Landos Entscheidung (bis 12 für alle, solange ein Plan erlaubt ist). 82 Tests grün, 8 davon neu mit Sabotageprobe.
- Hinweis: Jeder Baustein hat bisher seine eigenen Zahlenclips (eins bis zwölf). Bei fünf Zähl-Bausteinen sind das 60 Aufnahmen für dieselben Wörter. Ein gemeinsamer Zahlenordner wäre sinnvoll, ist aber noch nicht gebaut (OP-B22).
- Gemeinsamer Zahlenbaustein ZAHLEN (siehe README): zwölf Aufnahmen für alle Zählbausteine. Aufnahmen je Baustein: KU01 7, KU02 7, KU03 9, KU04 9, KU05 7, KU06 10 (Rauf und Runter), dazu ZAHLEN 12. Vorher wären es für diese sechs Bausteine 17 + 17 + 19 + 19 + 17 + 10 gewesen. 89 Tests grün.
- 06.10.2026: Startwert aus dem Niveau (A 8, B und C 10) und Schmerzblock P pro Region (höchstens drei, Orange O13 bei "schlechter"), siehe README. 116 Tests grün. Gegenleser Rückmeldung eingearbeitet, Texte ungeprüft (OP-F25).
