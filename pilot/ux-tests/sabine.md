# UX-Test Pilot Bewegungsbox: Sabine (52) füllt für ihren Vater aus

Methode: Playwright, Chromium, 390 x 844, Touch, echte Taps auf die Oberfläche (`lauf.js`, Log `lauf.log`, Screenshots in `shots/`).
Persona-Antworten: Vater Heinz, Jahrgang 1938, Rollator, Blutverdünner, Sturz vor 8 Monaten mit Arztbesuch, Hüfte schmerzt. Keine Vollmacht. "Weiß nicht" bei A2, B3, B6, C2, D2, M1, P1h, P2h. Telefonnummer übersprungen (optional).
Ergebnis: **Orange** (O1 keine Vollmacht, O11 Weiß nicht bei D2, O4 drei Zustandsgruppen, O5 Sturz plus Angst 4).

## Kurzfazit

**Sabine:** "48 Fragen, eine pro Bildschirm, und bei jeder dritten musste ich scrollen, weil unten ein schwarzer Balken über den Antworten klebt. Am Ende steht 'Lando ruft dich an', aber meine Telefonnummer hatte ich übersprungen, weil sie freiwillig war, und warum es Orange ist und ob er mich oder meinen Vater anruft, steht nirgends. Ich habe das Gefühl, ich habe mich durch einen Arztfragebogen geklickt und dann ins Leere."

**Nüchtern:** Die Bedienung pro Frage ist solide (große Knöpfe, Auto-Weiter nach 400 ms, Zurück funktioniert), aber die Masse an Einzelbildschirmen und der Platzverlust durch Kopf (218 px) und festen Fußhinweis (103 px) kosten auf dem Handy 38 % der Höhe und erzwingen auf 13 von 48 Fragebildschirmen Scrollen. Der Ergebnisbildschirm für Orange ist die größte Schwachstelle: kein Grund in Kundensprache, kein Zeitpunkt, kein Hinweis, wer angerufen wird, und Rückruf ohne Telefonnummer ist möglich.

## Zahlen

| Messgröße | Wert |
| --- | --- |
| Bildschirme bis zur Ampel | **50** (Start, 48 Fragen, Ampel) |
| Taps bis zur Ampel | **61** (davon 1 Start, 45 Antwort-Taps, 11 Weiter/Überspringen, 4 Taps ins Eingabefeld) |
| Getippte Zeichen | 33 (Vorname Sabine, Vorname Heinz, 1938, E-Mail) |
| Fortschrittsanzeige | springt: "von 37" → 39 → 41 → 42 → 44 → 47 → 48 |
| Sichtbare Fläche | 844 px Viewport minus Kopf 218 px minus fester Fußhinweis ab y=741 (103 px) = **ca. 520 px nutzbar** |
| Fragebildschirme, auf denen mindestens eine Antwortoption unter dem Fußbalken liegt | **20 von 48** |
| Fragebildschirme, auf denen der Weiter-Knopf ohne Scrollen nicht sichtbar ist | **47 von 48** (nur K2 nicht) |
| "Weiß nicht" ohne Scrollen nicht sichtbar | **13 von 28** Bildschirmen mit "Weiß nicht" (A1, B1, B2, B5, B6, C4, D1, E5a, E6, E7, P1h, P2h, P3h) |
| Stellen, an denen Sabine scrollen **musste** | **13**: W3b, K1, K3 (Weiter verdeckt, nur per Enter umgehbar), K4 ("Überspringen" verdeckt), B6, P1h, P2h ("Weiß nicht" verdeckt), R0 ("Hüfte" und Weiter verdeckt), P0, Z1, Z2, Z3, Z4 (Weiter bzw. Antworten verdeckt). Mit eingeblendeter Handytastatur zusätzlich K2. |
| Skriptdauer (Maschine) | 33 s |
| Geschätzte Dauer für Sabine | **7 bis 9 Minuten** (28 Ja/Nein/WN-Fragen à ca. 7 s, 4 Textfelder à 15 s, 5 Mehrfachauswahlen à 15 s, Rest à 6 s, 13 Scrollstellen à 3 s, plus Nachdenken bei den Weiß-nicht-Fragen). Für eine Mittagspause machbar, aber es fühlt sich doppelt so lang an, weil die Zahl "von 48" sichtbar wächst. |

## Probleme

| Stelle | Was passiert | Schwere | Konkreter Verbesserungsvorschlag | Art |
| --- | --- | --- | --- | --- |
| Alle Fragen | Fester Fußhinweis ("Pilot zur Veranschaulichung …", 103 px) überdeckt ab y=741 Antworten. Auf W1 ist "Nein" verdeckt, auf 13 Fragen "Weiß nicht", auf R0 sechs von acht Bereichen. | hoch | Hinweis nicht fixiert, sondern einmal am Seitenende oder als einzeilige Zeile im Kopf. Wenn fixiert, dann `padding-bottom` am `main` in Höhe des Balkens. | Darstellung |
| Alle Fragen | Kopf mit "Beispiel laden", Auswahlfeld und "Alles löschen" belegt 218 px (26 % der Höhe) auf jeder Frage. | hoch | Im Fragebogen Kopf auf eine Zeile (Marke + Menü-Symbol) reduzieren, Beispiel-Auswahl nur auf der Startseite. | Darstellung |
| Alle Fragen | Weiter-Knopf steht auf 47 von 48 Bildschirmen unter dem sichtbaren Bereich. Zurück steht auf dem Handy **über** Weiter, beide volle Breite. | hoch | Feste Aktionsleiste unten (sticky) mit Zurück (klein, links) und Weiter (groß, rechts) nebeneinander, statt des Pilot-Hinweises. | Bedienung |
| Kopf "Alles löschen" | Ein Tap löscht alle bisherigen Antworten ohne Rückfrage; der Knopf steht direkt über der Frage, wo der Daumen beim Hochscrollen hinkommt. | hoch | Bestätigungsdialog oder Knopf ins Menü verlegen, nur auf Start und Ergebnis. | Bedienung |
| Ampel Orange | Text: "Lando ruft dich an und klärt ein paar Fragen." Sabine hat K4 (Telefon, optional) übersprungen. Es gibt keine Nummer, und die Seite merkt das nicht. | hoch | Bei Orange/Rot ohne K4: direkt auf der Ampelseite ein Telefonfeld "Unter welcher Nummer erreicht Lando dich?" mit Zeitfenster-Auswahl. Bei K4 schon im Hilfstext ergänzen: "Brauchen wir, falls wir zurückrufen müssen." | Bedienung (Hilfstext), Vorschlag an Lando (Fragetext): K4 bei Angehörigen zur Pflicht machen oder Pflicht bei Orange |
| Ampel Orange | Kein Grund in Kundensprache. Die Gründe (O1, O11, O4, O5) stehen nur im aufklappbaren Bereich "Für Lando und die Fachperson" mit internen Codes und Variablennamen (`osteoporose_mit_freigabe`, "nur wegen Weiß nicht"). | hoch | 2 bis 3 Stichpunkte für Kunden, z. B. "Du füllst für Heinz aus, ohne Vollmacht", "Einige Angaben sind noch offen (Osteoporose)", "Mehrere Themen kommen zusammen (Herz/Kreislauf, Blutverdünner, Sturz)". Den Lando-Bereich in der echten Version ausblenden. | Darstellung |
| Ampel Orange | Unklar, **wen** Lando anruft (Sabine oder Heinz), **wann**, und was Sabine vorbereiten soll. "Im Piloten endet der Ablauf hier" ist der einzige nächste Schritt. | hoch | Ampelseite mit "So geht es weiter": 1. Lando ruft **dich (Sabine)** innerhalb von X Werktagen an. 2. Halte bereit: Medikamentenliste, Info zur Osteoporose, ggf. Vollmacht. 3. Du bekommst eine Bestätigung an sabine@…. Namen aus W3b und K1 einsetzen. | Darstellung |
| Ampel | "Antworten ansehen oder ändern" springt auf Frage 1. Um eine Weiß-nicht-Antwort nachzutragen, muss Sabine 48 Bildschirme durchtippen. | mittel | Zusammenfassung als Liste aller Antworten mit "Ändern"-Link je Zeile; Weiß-nicht-Antworten oben hervorheben ("Diese 8 Angaben kannst du noch nachtragen"). | Bedienung |
| A1 bis M1 (24 Fragen, Teil 2) | 24 Ja/Nein/Weiß-nicht-Fragen nacheinander, jede auf eigenem Bildschirm mit Fortschrittskopf. Das ist der Hauptzeitfresser. | hoch | Thematische Listen mit Segment-Knöpfen pro Zeile `Ja | Nein | Weiß nicht`, 4 bis 7 Zeilen je Bildschirm: Operationen und Gelenke (A1 bis A3), Herz und Kreislauf (B1 bis B7), Schwindel und Sturz (C1 bis C3, Folgefragen C3a/C3b klappen direkt darunter auf), Knochen und Schmerzen (D1, D2, E1, E2, E5a, E6, E7), Sonstiges (F1, M1). Fragetext bleibt wörtlich. Rote Notfallantworten (B1, B5, C1, E5a) können sofort unter der Zeile den Hinweis zeigen. **Kein** "Alles Nein"-Knopf, da Weiß nicht nie als gesund zählen soll. | Darstellung |
| W1, W2 | Zwei Bestätigungsbildschirme. W1 ist ein 6-zeiliger fetter Satz als Überschrift; "Nein" liegt unter dem Fußbalken. | mittel | Beide auf einen Bildschirm als zwei Zeilen mit Ja/Nein, normaler Fließtext statt h1. | Darstellung |
| W1, W2 aus Angehörigensicht | "Ich willige ausdrücklich ein …" und "Mir ist klar …" sind Ich-Sätze. Sabine willigt für die Gesundheitsdaten ihres Vaters ein, ohne Vollmacht. Rechtlich und gefühlt unklar. | mittel | – | Vorschlag an Lando (Fragetext): eigene Fassung bei W3 = jemand anderes ("Die Person ist einverstanden, dass …"), Reihenfolge W3 vor W1 |
| W1 "automatischer Assistent" | Sabine stutzt: Ruft ein Bot meinen 88-jährigen Vater an? Zusammen mit "Lando ruft an" auf der Ampel widersprüchlich. | mittel | Kurzer Erklärtext unter W1 (Bedienungstext): wer anruft, wann ein Assistent fragt. | Darstellung; Vorschlag an Lando (Fragetext) |
| W3a | Nur Ja/Nein. Sabine weiß nicht, ob die Vorsorgevollmacht vom Notar "zählt". "Nein" führt still zu Orange (O1), ohne dass sie es erfährt. | mittel | Hilfetext "Was zählt als Vollmacht?" zum Aufklappen. | Darstellung; Vorschlag an Lando (Fragetext): Option "Weiß nicht" |
| W3b, K1 bis K5 | Sechs Bildschirme für Kontaktdaten, jeder mit eigenem Weiter, das verdeckt ist. | hoch | Ein Formular "Kontakt" mit allen Feldern untereinander, ein Weiter. Spart 5 Bildschirme und 5 Scrollstellen. | Darstellung |
| K3, K4 | E-Mail-Feld ist `type="text"` (kein @ auf der Tastatur, kein Autofill), Telefon ebenso (kein Ziffernblock). | mittel | `type="email" autocomplete="email"`, `type="tel" autocomplete="tel"`, Vorname `autocomplete="given-name"`. | Bedienung |
| Fortschritt | "Frage 1 von 37" wird bis "48 von 48". Bei jeder Ja-Antwort wächst der Berg. Frustrierend für jemanden in Eile. | mittel | Nur Teile anzeigen ("Teil 2 von 6") plus geschätzte Restzeit, oder Gesamtzahl erst ab Teil 5 nennen. | Darstellung |
| Teil-Titel | "Folgefragen je gewählter Region", "Schmerz genauer, je gewählter Region": interne Sprache. | niedrig | "Fragen zur Hüfte", "Schmerz in der Hüfte" mit dem gewählten Bereich. | Darstellung |
| E5a | Drei Warnzeichen als Aufzählung in einer fetten 5-zeiligen Überschrift. Sabine muss genau lesen, um "eines davon" zu verstehen. | mittel | Gleicher Wortlaut, aber Darstellung: Einleitung "Gibt es eines davon:" als Überschrift, die drei Punkte als Liste darunter. | Darstellung |
| B3 | Herzschwäche und Sodbrennen im Liegen in einer Frage. Sabine weiß von keinem sicher, antwortet Weiß nicht, Zustand wird gesetzt. | niedrig | – | Vorschlag an Lando (Fragetext): trennen |
| B5 | Zwei Fragen in einer ("… nur auf einer Seite? Oder wurde eine Thrombose vermutet …"). | niedrig | Darstellung als Liste wie E5a. | Darstellung; Vorschlag an Lando (Fragetext) |
| R0 | Acht Bereiche, nur "Nacken" sichtbar; "Hüfte" und "Nichts davon" erst nach Scrollen. | hoch | Zweispaltiges Raster (Bereichsnamen sind kurz) oder kleine Körpergrafik; mit Kopf/Fuß-Korrektur passt alles. | Darstellung |
| E3h → P0 | Sabine sagt bei E3h "Ja, Schmerzen in der Hüfte", dann fragt P0 mit nur einem Bereich (Hüfte) "Höchstens drei auswählen". Mehrfachauswahl mit einer Option braucht 2 Taps plus Scrollen. | mittel | Wenn R0 nur einen Bereich hat: P0 als Einfachauswahl "Hüfte" / "Keine Schmerzen" mit Auto-Weiter. Hinweis "Höchstens 3 Bereiche" dann weglassen. | Bedienung |
| P1h, P2h, P3h | Drei Bildschirme zur selben Hüfte; "Weiß nicht" jeweils verdeckt. | mittel | Ein Bildschirm "Schmerz in der Hüfte" mit drei Zeilen, Optionen als Chips. | Darstellung |
| C4a, Z3, P0 | Doppelte Hinweise: Fragetext enthält schon "(1 = keine, 5 = sehr groß)" bzw. "(bis zu zwei)" bzw. "Höchstens drei", die Oberfläche wiederholt es. | niedrig | UI-Zusatz weglassen, wenn der Fragetext es schon sagt. | Darstellung |
| C6 | "Rollstuhl" unter dem Fußbalken. Für Sabine egal, für Rollstuhlnutzer heikel. | niedrig | Durch Kopf/Fuß-Korrektur gelöst. | Darstellung |
| Z1, Z2 | Weiter steht nach 7 bzw. 6 Optionen ganz unten; Z2 fragt Hüfte erneut (schon in R0 gewählt). | niedrig | Sticky Weiter; Optionen zweispaltig. | Darstellung |
| Z3 | Ziele kleingeschrieben ("sicherer aufstehen und hinsetzen", "wieder spazieren gehen"). Nach der Wahl von zwei sind andere ausgegraut, ohne Erklärung. | niedrig | Großschreibung in der Anzeige; Hinweis "Zwei gewählt. Zum Tauschen eins abwählen." | Darstellung |
| Datenschutz und Vertrauen | Positiv: "Nichts wird gespeichert oder verschickt" auf der Startseite. Aber: kein Speichern heißt auch, dass Sabine bei Ende der Mittagspause alles verliert. Kein Name/Kontakt von Lando, kein Impressum. | mittel | Für die echte Version: "Später weitermachen" (Link per Mail), Kopf mit "Wer ist Lando?" und Datenschutzlink. Im Piloten zumindest auf der Startseite die Dauer nennen ("etwa 8 Minuten, 40 bis 50 Fragen"). | Darstellung |
| Perspektive Bedienungstexte | Fragen sprechen meist neutral ("Gibt es …", "die Person"), die Ampel aber "Lando ruft **dich** an", "deine Angaben". Bei W3 = jemand anderes unklar, wer gemeint ist. | mittel | Bei W3 = jemand anderes Namen einsetzen: "Lando möchte kurz mit dir, Sabine, über Heinz sprechen." | Darstellung |

## Die 5 wichtigsten Verbesserungen mit dem größten Zeitgewinn

1. **Platz zurückgewinnen und Weiter festmachen.** Kopf auf eine Zeile (−170 px), Pilot-Hinweis nicht fixiert oder in den Kopf, feste Aktionsleiste mit Zurück/Weiter nebeneinander. Damit fallen alle 13 Scrollstellen weg, "Weiß nicht" ist überall ohne Scrollen sichtbar. Geschätzt −40 s und deutlich weniger Frust. Reine Darstellung.
2. **Ja/Nein/Weiß-nicht-Fragen als thematische Listen.** Teil 2 von 24 Bildschirmen auf 5 Bildschirme. Gesamt von 48 auf rund 25 Fragebildschirme. Die Zahl der Antwort-Taps bleibt gleich (plus 1 Weiter je Liste), aber Seitenwechsel, Neuorientierung und Fortschrittskopf entfallen 19 Mal. Geschätzt −1,5 bis −2 Minuten. Fragetexte bleiben wörtlich.
3. **Kontaktdaten als ein Formular** (W3b, K1 bis K5) mit richtigen Feldtypen und Autofill. Von 6 auf 1 Bildschirm, E-Mail und Name per Autofill in Sekunden. Geschätzt −45 s.
4. **Ampel Orange zu einer echten "So geht es weiter"-Seite machen:** wer anruft, wen, wann, Gründe in Kundensprache, was bereitlegen, Telefonfeld wenn K4 fehlt, Liste der Weiß-nicht-Antworten zum direkten Nachtragen. Spart Sabine den Rückruf-Ping-Pong und das erneute Durchklicken von 48 Fragen (bisher der einzige Weg zum Ändern).
5. **Folgefragen zum selben Bereich bündeln:** P0 bei nur einem Bereich als Einfachauswahl mit Auto-Weiter, P1 bis P3 auf einem Bildschirm, C3a/C3b direkt unter C3, C4a direkt unter C4. Je gewähltem Bereich −2 Bildschirme und −2 Taps, bei Sturz −3 Bildschirme. Geschätzt −30 s.

Zusammen realistisch: von 50 auf etwa 18 bis 20 Bildschirme, 0 Scrollstellen, Dauer von 7 bis 9 auf etwa 4 bis 5 Minuten. Die Zahl der Taps sinkt nur leicht (von 61 auf etwa 55), der Gewinn liegt in weniger Seitenwechseln und keinem Suchen.

### Vorschläge an Lando (Fragetext), gesammelt

- W1/W2: eigene Fassung, wenn jemand anderes ausfüllt; W3 vor W1 stellen.
- W1: "automatischer Assistent" erklären oder streichen (siehe auch Abschlussblatt Punkt 8).
- W3a: Option "Weiß nicht" und kurze Erklärung, was als Vollmacht zählt.
- K4: bei Angehörigen Pflicht oder spätestens bei Orange/Rot Pflicht, sonst ist "Rückruf nötig" nicht umsetzbar.
- B3: Herzschwäche und Reflux trennen. B5: zwei Fragen in einer.
