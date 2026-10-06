# UX- und Barrierefreiheitsprüfung: Pilot Senioren-Bewegungsbox

Geprüft am 06.10.2026: `pilot/index.html`, `app.js`, `app.css` und `daten.js` (Fragebogen Entwurf 4, 76 Fragen). Die App lief in Chromium (Playwright) mit 390×844 (Handy), 360×640 (kleines Handy), 820×1180 (Tablet), 1280×800 (Desktop) und 640×400 (entspricht 1280×800 bei Zoom 200 %). Die Screenshots liegen in `scratchpad/ux/expertin/bilder/`. Am Projekt wurde nichts geändert.

## Kurzfazit

Die Grundlagen sind solide: große Schrift (22 px), 64 px hohe Antwortflächen über die ganze Breite, guter Textkontrast, Fokus wandert nach jedem Seitenwechsel auf die Frage, kein seitliches Scrollen bei 390 px. Bei Ablauf und Bedienung gibt es aber Probleme, die ältere Menschen wirklich behindern:

1. **Zu viele Bildschirme.** Ein typischer Fall braucht heute **47 Fragebildschirme** (Minimum 37, mit allen Regionen bis 52 und mehr). Das sind rund 35 Ja/Nein/Weiß-nicht-Fragen hintereinander, jede auf einer eigenen Seite. Mit thematischer Gruppierung kommt man auf **22 Bildschirme**, ohne einen Fragetext zu ändern.
2. **Auto-Weiter erzeugt nachweislich Fehleingaben.** Ein zweiter Tipp 520 ms nach dem ersten an derselben Stelle hat im Test die *nächste* Frage beantwortet (A1 „Nein“ → A2 ungewollt „Nein“). Außerdem ist es ein Kontextwechsel bei Eingabe (WCAG 3.2.2, Stufe A).
3. **Auf dem Handy liegen die Antworten großteils unter dem Falz.** Pilot-Menü (219 px) und fester Hinweisbalken (103 px) nehmen auf 390×844 zusammen 38 % der Höhe ein. Bei B5 ist „Weiß nicht“ verdeckt, auf 360×640 sogar *alle* Antworten. Bei Zoom 200 % ist im ersten Bild gar keine Frage zu sehen, und es gibt seitliches Scrollen.
4. **Der Hinweisbalken verdeckt den Tastaturfokus** (WCAG 2.4.11, AA): bis zu 103 px eines fokussierten Knopfs liegen darunter.
5. **Fehlerbehandlung verliert Eingaben.** Bei „48“ im Geburtsjahr wird das Feld nach der Meldung **geleert**. Durch das Verrutschen liegt danach „Zurück“ genau dort, wo vorher „Weiter“ war.
6. **Datenverlust durch die Zurück-Geste des Browsers.** Es gibt kein `history.pushState`, also führt die Wisch- oder Zurück-Geste (bei Senioren sehr häufig) aus der App, und alle Antworten sind weg. „Alles löschen“ steht auf jeder Seite oben und fragt nicht nach.
7. **Ergebnis und Plan mischen Kunden- und Lando-Sicht** (Codes wie `O10`, „Niveau C“, „frei/Warnung/gesperrt“, „Dokument 12 Abschnitt 6“). Bei Rot steht der Notfallhinweis (112) erst an zweiter Stelle.

## Messwerte

| Kennzahl | Heute | Mit Vorschlag |
|---|---|---|
| Fragebildschirme, typischer Fall* | **47** (+ Start + Ergebnis) | **22** |
| Fragebildschirme, Minimalfall (A01, keine Region) | 37 | 19 |
| Fragebildschirme, alle 7 Regionen (N20) | 47 (ohne Schmerz) bis über 60 | 23 bis 26 |
| Tipps, typischer Fall | 60 (+ 38 Zeichen Tippen) | etwa 72 (+ 38 Zeichen) |
| Wechsel von Seite und Kontext (Neuorientierung) | 47 | 22 |
| Anteil Pilotkopf und Hinweisbalken an der Höhe, 390×844 | 38 % | unter 15 % (Kopf eingeklappt, Balken nicht fest) |
| Antworten über dem Falz bei B5, 390×844 | 2 von 3 | 3 von 3 |
| Antworten über dem Falz bei B5, 360×640 | 0 von 3 | 3 von 3 |
| Fortschrittsanzeige im Verlauf | springt 37 → 38 → 43 → 47 (bei 3 Regionen bis 52) | stabile 6 Teile |

*Typischer Fall: füllt selbst aus, Telefonnummer angegeben, Blutverdünner ja, „manchmal unsicher“ (also mit C4a), Regionen Knie und Rücken, Schmerz im Knie, je zwei Alltags-Schwierigkeiten und zwei Ziele.

Die Zahl der Tipps steigt leicht, weil in Gruppen ein bewusstes „Weiter“ nötig ist statt Auto-Weiter. Das ist gewollt: Die Belastung liegt bei Senioren nicht beim Tippen, sondern beim Neuorientieren auf jeder Seite (wo bin ich, was wurde gefragt, wo sind die Knöpfe) und beim Gefühl, „kein Ende in Sicht“ zu haben. Eine Abkürzung wie „Alles Nein“ empfehle ich ausdrücklich **nicht**, weil sie bei Sicherheitsfragen zum Durchklicken verleitet.

## Gruppierungsvorschlag

Regeln für die Gruppen:

- **Höchstens 4 Fragen pro Bildschirm.** Bei langen Fragetexten oder Notfall-Fragen mit Rot-Wirkung bleibt es bei einer Frage pro Seite.
- **Darstellung „Liste“:** Jede Frage ist ein eigenes `fieldset`, die Frage als `legend` (Nummer + Text). Darunter stehen die drei Antworten als große Optionsfelder nebeneinander, auf dem Handy bis 480 px untereinander oder als drei gleich breite Segmente von mindestens 64 px Höhe. Zwischen den Fragen eine kräftige Trennlinie und eine leichte Hintergrundfarbe für jede zweite Frage. Beantwortete Fragen bekommen links ein Häkchen. **Keine echte Tabelle mit Spaltenköpfen „Ja | Nein | Weiß nicht“**: Bei 390 px und 22 px Schrift wird die Fragespalte zu schmal, und Screenreader lesen Tabellen schlechter als Fieldsets. Ab etwa 900 px Breite (Tablet quer, Desktop) dürfen die Antworten rechts neben der Frage stehen.
- **Folgefragen** (`nur_wenn` innerhalb derselben Gruppe) erscheinen **eingerückt direkt unter der auslösenden Frage**, sobald die passende Antwort gewählt ist. Sie werden mit `aria-live="polite"` angekündigt („Eine Zusatzfrage ist erschienen“). Der Fokus springt **nicht** dorthin.
- **Gruppen dürfen nur Fragen enthalten, deren Bedingungen innerhalb der Gruppe oder davor liegen.** Das ist erfüllt, weil alle `nur_wenn` auf W3, A2, C3, C4, D2, R0 oder P0 zeigen.
- **Pflichtprüfung beim Tippen auf „Weiter“:** Alle unbeantworteten Fragen werden markiert, oben steht eine Fehlerzusammenfassung mit Sprunglinks, und der Fokus geht auf die erste offene Frage.
- **Fragen mit umgekehrter Richtung** (F1: hier ist „Ja“ der unauffällige Fall) nicht in eine Liste stellen, in der sonst „Nein“ unauffällig ist. Sonst klickt man im Nein-Rhythmus falsch.
- Die Auswertung bleibt unverändert, weil nur die Darstellung zusammengefasst wird. Die Antworten landen weiter unter denselben IDs in `zustand.antworten`.

| Bildschirm | Frage-IDs | Darstellung | Begründung |
|---|---|---|---|
| 1 Einwilligung | W1, W2 | Liste mit zwei Fragen, nur Ja/Nein, **ohne Auto-Weiter**. Bei „Nein“ erst ein Hinweis auf der Seite („Ohne Zustimmung können wir nicht weitermachen. Ändern?“), kein sofortiger Abbruch | Rechtlich zusammengehörig. Ein Fehltipp auf „Nein“ führt heute nach 400 ms direkt auf die Stopp-Seite |
| 2 Wer füllt aus | W3 (+ W3a, W3b eingeblendet bei „jemand anderes“) | Auswahl, darunter die Folgefragen | Bedingung liegt in derselben Gruppe |
| 3 Zur Person | K1, K2 | Formular mit zwei Feldern und sichtbaren Labels | Kurze Eingaben, kein Grund für zwei Seiten |
| 4 Kontakt | K3, K4, K5 | Formular: E-Mail (`type=email`), Telefon (`type=tel`, freiwillig gekennzeichnet), Ja/Nein | Zusammengehörige Kontaktangaben |
| 5 Operationen und Gelenkersatz | A1, A2 (+ A2a eingerückt bei A2 = ja), A3 | Liste | Ein Thema, kurze Texte, Bedingung liegt in der Gruppe |
| 6 Herz und Atmung | B1, B2, B7 | Liste. B1 mit Aufzählung (siehe unten) | Gleiches Thema. B1 und B2 haben Rot-Wirkung, deshalb höchstens drei Fragen |
| 7 Thrombose | B5 | Einzeln, zweiteilig dargestellt | Zwei Fragen in einem Text, Notfall-Frage, lang |
| 8 Erkrankungen und Medikamente | B3, B4, B6, M1 | Liste | Kurze Texte, alle nur mit Vorsicht-Wirkung, gleiche Richtung (Nein = unauffällig) |
| 9 Schwindel und Sturz | C1, C2, C3 (+ C3a, C3b eingerückt bei C3 = ja) | Liste | Ein Thema, Folgefragen in der Gruppe |
| 10 Sicherheit beim Stehen | C4 (+ C4a-Skala eingeblendet bei manchmal/oft/weiß nicht) | Auswahl mit vier Antworten, darunter die Skala | Bedingung in der Gruppe. C4a braucht den Bezug zu C4 |
| 11 Beweglichkeit im Alltag | C5, C6, F1 | Drei Fieldsets mit jeweils eigenen Antworten. F1 steht am Ende und ist optisch abgesetzt | Thema Mobilität. F1 bewusst nicht in einer Ja/Nein-Liste mit „Nein = gut“ |
| 12 Knochen | D1, D2 (+ D2a eingerückt bei D2 = ja) | Liste | Ein Thema, Folgefrage in der Gruppe |
| 13 Schmerzen und ärztlicher Rat | E1, E2, E6, E7 | Liste | Kurze bis mittlere Texte, gleiche Richtung |
| 14 Warnzeichen | E5a | Einzeln, mit Aufzählung | Notfall-Frage, drei Symptome. Muss einzeln und gut lesbar sein |
| 15 Körperkarte | R0 | Mehrfachauswahl (später eine echte Körperskizze) | Bedingung für alles Folgende, also eigener Schritt |
| 16 Fragen zu Ihren Bereichen | E3h, E3k, E8, E3f, E4, E5, E9, E10, E11 (nur die sichtbaren) | Liste mit **Zwischenüberschrift je Region** (z. B. „Knie: E3k, E8“, „Rücken: E5, E9“). Mehr als 4 sichtbare Fragen werden auf zwei Bildschirme verteilt | Bedingung R0 liegt davor. Gruppieren nach Region hält den Bezug klar |
| 17 Schmerzbereiche | P0 | Mehrfachauswahl | Bedingung für P1 bis P3, deshalb eigener Schritt |
| 18 … Schmerz je Region | P1x, P2x, P3x je gewählter Region (ein Bildschirm pro Region) | Drei Auswahl-Fieldsets untereinander, Überschrift „Schmerz im Knie“ | Gleicher Bezug, drei kurze Auswahlfragen. Heute 3 Seiten pro Region |
| 19 Alltag | Z1 | Mehrfachauswahl | Lange Liste, eigener Schritt |
| 20 Steifheit | Z2 | Mehrfachauswahl | Z3 hängt von Z1 und Z2 ab |
| 21 Ziele | Z3 | Mehrfachauswahl, höchstens 2 | Hängt von Z1 und Z2 ab. Entfällt, wenn nur ein Ziel möglich ist |
| 22 Wunsch | Z4 | Textfeld, freiwillig | Abschluss |
| (neu) Überprüfen | alle | Zusammenfassung je Teil mit „Ändern“-Link, danach „Absenden“ | Ersetzt „Antworten ansehen oder ändern“, das heute bei Frage 1 neu beginnt |

## Aufzählungen im Fließtext (ohne inhaltliche Änderung)

Grundsatz: **Der Wortlaut bleibt Zeichen für Zeichen gleich.** Nur Zeilenumbrüche, Listenpunkte und Fettdruck kommen dazu. Das lässt sich als Darstellungs-Zuordnung in `app.js` umsetzen (z. B. `DARSTELLUNG = { E5a: { einleitung: "Gibt es eines davon:", liste: [...] } }`). Ein Test sollte sicherstellen, dass `einleitung + liste.join(", ")` (mit den Originalbindewörtern) genau den Fragetext aus `daten.js` ergibt. Screenreader lesen dieselben Wörter, eine `<ul>` sagt zusätzlich „Liste, 3 Einträge“.

| Frage | Darstellung |
|---|---|
| **E5a** | Überschrift „Gibt es eines davon:“, darunter eine Liste mit drei Punkten: „Taubheit im Gesäß oder im Schritt“, „neue Probleme beim Wasserlassen oder Stuhlgang“, „ein Bein, das immer schwächer wird?“ Fragezeichen bleibt am Ende. Nur das Fragezeichen bleibt hinter dem letzten Eintrag. |
| **B1** | „Treten“ + Liste: „Brustschmerzen“, „Engegefühl oder“, „Atemnot“ + „**schon bei leichter Belastung** auf,“ und das Beispiel „zum Beispiel auf der Treppe oder beim Anziehen?“ als eigene, etwas leisere Zeile |
| **B5** | Zwei Absätze: (1) „Ist ein Bein in letzter Zeit neu angeschwollen, warm oder schmerzhaft, und zwar **nur auf einer Seite**?“ (2) „**Oder** wurde eine Thrombose vermutet, die noch nicht behandelt ist?“, mit einer dünnen Linie dazwischen |
| **R0** | Frage „Wo gibt es“ + Liste „Beschwerden“, „eine Operation“, „einen Gelenkersatz oder“, „eine Verletzung?“. Den Satz „Mehrere Bereiche sind möglich.“ als Hinweiszeile unter der Frage. Der eigene Bedienhinweis wird dann um diesen Satz gekürzt (heute doppelt) |
| **P0** | Frage „Bei welchen dieser Bereiche gibt es Schmerzen?“ groß, darunter zwei Hinweiszeilen: „Höchstens drei auswählen, die am meisten stören.“ und „Gibt es keine Schmerzen, bitte "Keine Schmerzen" wählen.“ Den doppelten Bedienhinweis „Höchstens 3 Bereiche.“ entfernen und durch einen Zähler „1 von 3 gewählt“ ersetzen |
| **A1, B2, B6, C3, D1, E6, E7** | Zeitangaben **fett** („in den letzten 3 Monaten“, „6 Monaten“, „12 Monaten“, „6 Wochen“). Die Zeiträume wechseln von Frage zu Frage und werden sonst überlesen |
| **C4a, Z3** | Die Klammern „(1 = keine, 5 = sehr groß)“ und „(bis zu zwei)“ stehen schon im Text. Die eigenen doppelten Bedienhinweise („1 = keine“ unter der Skala, „Höchstens zwei.“) können als Beschriftung an den Skalenenden bleiben, aber nicht als zusätzlicher Absatz |
| **E4, C1, C2** | „oder“ fett, damit sichtbar wird, dass zwei Fälle gemeint sind |

## Auto-Weiter nach 400 ms

**Befund**

- Gemessen: Ein zweiter Tipp 520 ms später an derselben Stelle beantwortet die nächste Frage. Bei Tremor, verzögertem Loslassen oder „zur Sicherheit noch mal tippen“ entstehen so unbemerkte Antworten, im Test A2 „künstliches Hüftgelenk: Nein“.
- 400 ms reichen nicht, um die eigene Wahl zu sehen. Die Rückmeldung ist nur ein ausgefüllter Kreis und fett gesetzter Text, der Hintergrund unterscheidet sich kaum (Kontrast 1,16:1 zu Weiß).
- Die Hover-Hervorhebung bleibt auf Touch-Geräten kleben: Auf der nächsten Seite hat der Knopf an derselben Stelle einen dunklen Rahmen und wirkt **vorausgewählt** (zu sehen in den Screenshots zu E5a, Z3 und auf dem Desktop bei B5).
- Screenreader: Nach dem Tippen wird die Seite neu gebaut, der Fokus geht auf den neuen Knopf („Nein, Umschalter, gedrückt“). 400 ms später springt er auf die nächste Überschrift. Die Ansage wird abgeschnitten, und Nutzer wissen nicht, ob die Antwort zählt.
- Tastatur: Enter oder Leertaste auf einer Antwort löst sofort den Seitenwechsel aus. Wer auf echte Optionsfelder umstellt, bei denen man mit den Pfeiltasten wählt, würde mit Auto-Weiter schon beim Durchblättern weitergeschickt.
- WCAG 3.2.2 (Bei Eingabe, Stufe A): Eine Auswahl löst ohne vorherigen Hinweis einen Kontextwechsel aus.
- W1 und W2: Ein Fehltipp auf „Nein“ beendet nach 400 ms den Fragebogen.

**Empfehlung**

1. **In Gruppen-Bildschirmen kein Auto-Weiter.** Es gibt einen bewussten Knopf „Weiter“. Das ist die Hauptlösung.
2. Für die verbleibenden Einzelfragen: **standardmäßig aus.** Wenn Lando es behalten will:
   - nur bei Zeiger- oder Touch-Eingabe, nie bei Tastatur und nie bei W1, W2 oder Notfall-Fragen (B1, B5, C1, E5a);
   - Dauer **1200 bis 1500 ms**, mit sichtbarer Bestätigung im gewählten Knopf: Häkchen und „Gespeichert, weiter …“ mit ablaufendem Balken, bei `prefers-reduced-motion` ohne Animation;
   - **Tipp-Sperre**: Antworten auf der neuen Seite werden erst 600 ms nach dem Anzeigen angenommen (`pointer-events: none` und dann frei geben);
   - auf der Folgeseite oben ein Hinweis „Ihre Antwort auf die vorige Frage: Nein · Ändern“ als Rückgängig-Möglichkeit;
   - einmalig auf der Startseite erklären und abschaltbar machen („Nach dem Antippen automatisch weiter“).
3. Die Hover-Regeln in `@media (hover: hover)` einschließen.

## Barrierefreiheit (Befunde)

- **Semantik:** Einzelauswahl ist heute `button[aria-pressed]` in `role=group`. Richtig wäre `fieldset/legend` mit `input type=radio` (Einzelauswahl, Ja/Nein/Weiß nicht) bzw. `type=checkbox` (Mehrfachauswahl, R0, P0, Z1 bis Z3). Die Eingabefelder können unsichtbar sein, das Label bleibt die große Fläche. Das bringt die Ansage „Optionsfeld, 2 von 3, ausgewählt“, Pfeiltasten-Bedienung, `required` und eine passende Gruppensemantik. Der Kreis bzw. das Kästchen in der Oberfläche verspricht diese Bedeutung ohnehin schon.
- **Fokus:** Der Fokusring `#ffbf00` hat auf Weiß nur **1,65:1**, im Kopfbereich nur 1,46:1. Besser zweifarbig: `outline: 3px solid #111; box-shadow: 0 0 0 6px #ffbf00`. Der Hinweisbalken verdeckt fokussierte Elemente (gemessen bei R0: Schulter 45 px, Rücken 103 px, Zurück 102 px), das verstößt gegen WCAG 2.4.11 (AA). Abhilfe: `scroll-padding-bottom` mindestens so hoch wie der Balken, oder den Balken nicht fest positionieren.
- **Fehlermeldungen:** Die Eingabe im Zahlfeld wird bei einem Fehler gelöscht (`zeigeFrage()` baut das Feld aus `antworten` neu, in dem die ungültige Eingabe fehlt). Der Fokus geht auf die Überschrift statt auf das Feld. Es fehlen `aria-invalid` und die Verknüpfung der Meldung über `aria-describedby`. Die Meldung schiebt die Knöpfe nach unten (Verrutschen des Layouts). Lösung: Rohwert behalten, Meldung direkt unter dem Feld, Fokus aufs Feld, Platz für die Meldung von Anfang an reservieren.
- **Formularfelder:** K3 ist `type=text` und hat keine Prüfung. Besser `type=email`, `autocomplete=email`, `inputmode=email`. K4 sollte `type=tel` und `autocomplete=tel` haben, K1 `autocomplete=given-name`. Freiwillige Felder mit „(freiwillig)“ kennzeichnen, statt den Knopf auf „Überspringen“ umzubenennen.
- **Fortschritt:** Die Zahl der Fragen springt (37 → 43 → 52). Wer bei „40 von 43“ eine Region wählt, landet bei „40 von 52“, und das wirkt wie ein Rückschritt. Besser „Teil 2 von 6: Sicherheit“ mit Teilschritten anzeigen, plus `aria-valuetext`. Auch der Seitentitel sollte mitlaufen („Teil 2 von 6 – Bewegungsbox“, WCAG 2.4.2).
- **Kontraste:** Text, Rahmen (5,3:1) und Ampelfarben sind ausreichend. Schwach sind: der gewählte Zustand nur über die Fläche (1,16:1). Er braucht zusätzlich Häkchen, dickeren Rahmen und eine kräftigere Fläche. Auch das gelbe Ampellicht auf gelber Fläche ist mit 1,57:1 schwach, wird aber durch Rahmen und Text getragen.
- **Zielgrößen:** sehr gut (Antworten 64 px, Knöpfe 60 px, Skalenfelder etwa 56×64 px, Auswahlliste 48 px).
- **Zoom 200 % (640×400):** Seitliches Scrollen, weil die Beispiel-Auswahlliste so breit wird wie die längste Option (auf dem Desktop 875 px), das verletzt WCAG 1.4.10. Im ersten Bild ist keine Frage sichtbar, Kopf und Balken belegen den Bildschirm.
- **Schriftgröße:** `html { font-size: 22px }` übergeht die Schriftgrößen-Einstellung des Browsers. Besser `137.5%`.
- **Handy (390 px):** Pilotkopf 219 px + Fortschritt ≈ 160 px, die Frage beginnt erst bei 380 px. „Weiter“ steht auf allen Seiten mit Liste unter dem Falz. Auf dem Handy steht „Zurück“ über „Weiter“ und ist gleich groß (Gefahr von Fehltipps).
- **Tablet (820×1180):** gut. Alle Antworten und „Weiter“ sind sichtbar, aber die Breite ist auf 760 px begrenzt, und Kopf und Inhalt wirken verloren. Ab 900 px Breite lohnt sich die zweispaltige Liste.
- **Player:** `aria-live="polite"` auf dem Untertitel liest bei aktiver Sprachausgabe parallel zur Stimme vor (doppelter Ton für Screenreader-Nutzer). Lange Untertitel laufen unter den Hinweisbalken.
- **Datenverlust:** Kein `pushState`, kein `beforeunload`. Die Zurück-Geste oder Neuladen löscht alle Antworten. „Alles löschen“ ohne Rückfrage.

## Ergebnis, Plan und Player

- **Ergebnis:** Eine klare Ampelkarte, aber für Kunden stehen Fachbegriffe sichtbar auf derselben Seite („Für Lando und die Fachperson“ mit Codes `O10`, `brustschmerz_atemnot_belastung`, „Niveau C“, „Dokument 12 Abschnitt 6“). Vorschlag: zwei klar getrennte Ansichten (Umschalter „Kundensicht | Lando-Sicht“). In der Kundensicht gibt es keine Codes und keine Rot/Orange-Wörter, stattdessen klare Handlungssätze („Bitte lassen Sie das zuerst ärztlich abklären“), Farbe und Symbol.
- **Rot mit Notfall:** Der 112-Hinweis gehört **an die erste Stelle**, als `role=alert` mit Telefonsymbol und Link `tel:112`. Pilot-Sätze („Im echten Ablauf …“) sollten ein eigenes, einheitliches Aussehen bekommen (z. B. gestrichelt mit der Marke „Pilot“), damit sie nicht wie Kundentext wirken.
- **Plan:** Für Kunden zu technisch. „frei / Hinweis / Warnung / ersetzt / gesperrt“, „Startwert aus dem Niveau C“ und „2 Hinweise fallen weg“ sind Lando-Sprache. Die Titel wiederholen die Wiederholungen („Kraft, 2 Sätze mit je 10 Wiederholungen“), die darunter noch einmal stehen. „Abspielen“ steht erst nach acht Karten (bei 390 px nach etwa 4000 px Scrollen). Vorschlag für die Kundensicht: oben „Ihr Programm: 8 Übungen, etwa 40 Minuten“ und groß „Jetzt starten“, darunter kompakte Karten (Titel, Dauer, ggf. ein Satz „Darauf achten: …“). Badges und Herkunft nur in der Lando-Sicht. Ein Badge „Warnung“ verunsichert Kunden, Formulierung wie „mit Anpassung“.
- **Player:** Große Knöpfe und mitlaufender Text sind gut. Es fehlen: eine gut sichtbare Anzeige „Satz 1 von 2 · Wiederholung 4 von 10“ bzw. ein Halte-Countdown, „Vorige Übung“, und eine Bestätigung, bevor „Zurück zum Plan“ die laufende Übung abbricht. Der lange Untertitel ist mit 1,35 rem bei 390 px über sechs Zeilen zu hoch. Besser nur den aktuellen Satz groß zeigen und den Rest einklappen. Die Kennzeichnung „Platzhalterstimme“ ist gut.
- **„Antworten ansehen oder ändern“** beginnt wieder bei Frage 1. Eine Übersichtsseite mit „Ändern“-Links fehlt.

## Probleme

| Stelle | Problem | Schwere | Vorschlag | Art |
|---|---|---|---|---|
| Ganzer Fragebogen | 37 bis 52+ Einzelseiten, rund 35 Ja/Nein/WN-Seiten hintereinander | hoch | Gruppierung wie oben (22 Seiten) | Darstellung |
| Auto-Weiter (`AUTO_WEITER_MS`) | Doppeltipp beantwortet die nächste Frage (gemessen). Kontextwechsel bei Eingabe | hoch | In Gruppen kein Auto-Weiter. Sonst aus oder 1200 ms + Tipp-Sperre + Rückgängig | Bedienung / Barrierefreiheit |
| `.wahl-knopf:hover` auf Touch | Klebender Hover wirkt wie eine Vorauswahl auf der nächsten Seite | mittel | `@media (hover:hover)` | Darstellung |
| W1/W2 | Fehltipp „Nein“ → sofort Stopp-Seite | hoch | Kein Auto-Weiter, Hinweis auf derselben Seite | Bedienung |
| Pilotkopf | 219 px auf jeder Seite, „Alles löschen“ ohne Rückfrage | hoch | Pilot-Werkzeuge in ein einklappbares Menü („Pilot-Menü ▾“), Löschen mit Bestätigung | Bedienung |
| Fester Hinweisbalken | 12 bis 20 % der Höhe, verdeckt Antworten und Fokus (2.4.11) | hoch | Auf schmalen Bildschirmen im Seitenfluss unter den Knöpfen jeder Ansicht, oder einzeilig + `scroll-padding-bottom` | Barrierefreiheit |
| Beispiel-Auswahlliste | Breite wie längste Option → seitliches Scrollen bei Zoom 200 % | mittel | `width:100%; max-width:100%` bzw. kürzere Optionstexte | Barrierefreiheit |
| K2 Fehler | Eingabe wird gelöscht, Fokus auf h1, kein `aria-invalid` | hoch | Rohwert behalten, Fokus aufs Feld, Meldung verknüpfen | Barrierefreiheit |
| Fehlermeldung allgemein | Layout verrutscht, „Zurück“ liegt danach unter dem Finger | mittel | Platz reservieren, Meldung oben, primärer Knopf zuerst | Bedienung |
| Knopfreihe auf dem Handy | „Zurück“ gleich groß über „Weiter“ | mittel | „Weiter“ als primärer Knopf unten groß, „‹ Zurück“ als Textlink oben neben dem Fortschritt | Darstellung |
| Wahlknöpfe | `aria-pressed` statt Optionsfeld oder Kontrollkästchen | mittel | `fieldset`/`legend` + `radio`/`checkbox` | Barrierefreiheit |
| Gewählter Zustand | Fläche 1,16:1, nur Punkt und Fettdruck | mittel | Häkchen, Rahmen 4 px, kräftigere Fläche | Barrierefreiheit |
| Fokusring | 1,65:1 auf Weiß | mittel | Zweifarbiger Ring | Barrierefreiheit |
| Fortschritt | Springt 37 → 52, kein `aria-valuetext` | mittel | Fortschritt nach Teilen, Seitentitel mitführen | Darstellung |
| Browser-Zurück / Neuladen | Alle Antworten weg | hoch | `pushState` je Bildschirm, `beforeunload`-Warnung | Bedienung |
| K3, K4, K1 | Falsche Eingabetypen, kein `autocomplete` | niedrig | `email`, `tel`, `given-name` | Barrierefreiheit |
| Doppelte Hinweise (C4a, Z3, P0, R0) | Bedienhinweis wiederholt den Fragetext | niedrig | Doppelte Bedienhinweise streichen bzw. als Zähler | Darstellung |
| E5a, B1, B5, R0, P0 | Aufzählungen als Fließtext | mittel | Liste oder Absätze wie oben, Wortlaut gleich | Darstellung |
| Ziele Z3 | Optionen klein geschrieben („wieder spazieren gehen“) | niedrig | Ersten Buchstaben in der Anzeige groß | Darstellung |
| Ergebnis Rot | 112-Hinweis erst an zweiter Stelle | hoch | Notfall zuerst, `tel:112` | Darstellung |
| Ergebnis/Plan | Kunden- und Lando-Inhalte vermischt | mittel | Ansicht-Umschalter, Codes nur für Lando | Darstellung |
| Plan | „Abspielen“ am Ende, keine Gesamtdauer, Fachvokabular in Badges | mittel | Kopf mit Gesamtdauer + Start, Badges in der Lando-Sicht | Darstellung |
| Player | `aria-live` doppelt zur Sprachausgabe, kein Satz- oder Wiederholungszähler | mittel | `aria-live` aus, solange TTS läuft. Zähler groß anzeigen | Barrierefreiheit / Bedienung |
| „Antworten ansehen oder ändern“ | Beginnt wieder bei Frage 1 | mittel | Übersichtsseite mit „Ändern“-Links | Bedienung |
| `html{font-size:22px}` | Ignoriert die Schriftgröße des Browsers | niedrig | `137.5%` | Barrierefreiheit |
| Anrede (K1 „Person“, W3b „Dein“, B7 „die Person“) | Wechsel zwischen du, „die Person“ und unpersönlich. Wer selbst ausfüllt, liest „Wird die Person … kurzatmig?“ | mittel | Zwei Fassungen je nach W3 (selbst: „Sie/du“, jemand anderes: „die Person“) | Vorschlag an Lando (Fragetext) |
| Bedienungstexte in du-Form | Zielgruppe 70+ erwartet oft „Sie“ | mittel | Mit Lando entscheiden. Bedienungstexte dürfen geändert werden, Fragetexte nur gemeinsam | Bedienung / Vorschlag an Lando (Fragetext) |
| B3 | Doppelfrage (Herzschwäche **oder** Reflux) | mittel | In zwei Fragen teilen | Vorschlag an Lando (Fragetext) |
| B5 | Zwei Fragen in einer | mittel | Teilen (B5a Bein, B5b Thromboseverdacht), gleiche Wirkung | Vorschlag an Lando (Fragetext) |
| C2 | Doppelte Bedingung (Schwindel **und** ärztlich bekannt): „Nein“ ist mehrdeutig | mittel | Teilen oder umformulieren | Vorschlag an Lando (Fragetext) |
| E4 | „…die länger als 3 Monate her ist“ bezieht sich unklar nur auf die OP | niedrig | Umformulieren | Vorschlag an Lando (Fragetext) |
| F1 | Umgekehrte Richtung (Ja = unauffällig) zwischen lauter Nein = unauffällig | mittel | Positiv-negativ angleichen („Braucht die Person Hilfe beim Drehen …?“) oder bewusst absetzen | Vorschlag an Lando (Fragetext) |
| Zeiträume A1/B2/B6/C3/D1/E6/E7 | 6 Wochen, 3, 6, 12 Monate, „in letzter Zeit“ gemischt | niedrig | Wo fachlich möglich vereinheitlichen | Vorschlag an Lando (Fragetext) |
| E9 | „Zurückbeugen“ ist für Laien unklar (OP-L12 offen) | niedrig | Alltagsbeispiel ergänzen | Vorschlag an Lando (Fragetext) |
| C4a, Z3 | Bedienungshinweis steht im Fragetext („(1 = keine …)“, „(bis zu zwei)“) | niedrig | Aus dem Fragetext in die Oberfläche verlegen | Vorschlag an Lando (Fragetext) |
| W1 | Rechtssprache, „automatischen Assistenten“ | mittel | Einfache Sprache + Link „Mehr erfahren“ (rechtlich prüfen) | Vorschlag an Lando (Fragetext) |

## Die 8 wichtigsten Änderungen (priorisiert)

| # | Änderung | Aufwand |
|---|---|---|
| 1 | **Auto-Weiter entschärfen:** in Gruppen aus, bei Einzelfragen standardmäßig aus (oder 1200 ms + 600 ms Tipp-Sperre + „Ihre Antwort: … Ändern“), nie bei W1/W2/Tastatur. Hover nur bei `hover:hover` | klein (0,5 Tage) |
| 2 | **Gruppierung in 22 Bildschirme** (Datenstruktur `GRUPPEN` in `app.js` mit Frage-IDs, Folgefragen eingeblendet, Pflichtprüfung je Gruppe mit Fehlerzusammenfassung). Daten und Logik bleiben unverändert | mittel bis groß (2 bis 3 Tage inkl. Anpassung von `browser.test.js`) |
| 3 | **Platz auf dem Handy:** Pilot-Werkzeuge in ein einklappbares Menü, „Alles löschen“ mit Bestätigung, Hinweisbalken nicht fest (oder einzeilig + `scroll-padding-bottom`), Auswahlliste auf `width:100%`. Damit sind 2.4.11 und das seitliche Scrollen bei 200 % behoben | klein (0,5 Tage) |
| 4 | **Fehlerbehandlung:** Eingabe nicht löschen, Fokus aufs Feld, `aria-invalid` + `aria-describedby`, Platz für die Meldung reservieren, primärer Knopf zuerst, richtige Eingabetypen (`email`, `tel`) | klein (0,5 Tage) |
| 5 | **Semantik und Fokus:** `fieldset`/`legend` + Optionsfelder bzw. Kontrollkästchen statt `aria-pressed`, zweifarbiger Fokusring, deutlicher gewählter Zustand mit Häkchen, Fortschritt nach Teilen mit `aria-valuetext` und Seitentitel | mittel (1 Tag) |
| 6 | **Kein Datenverlust:** `history.pushState` je Bildschirm (Browser-Zurück = eine Frage zurück), `beforeunload`-Warnung, Übersichtsseite „Antworten prüfen“ mit Ändern-Links vor der Auswertung | mittel (1 Tag) |
| 7 | **Aufzählungen und Hervorhebungen** (E5a, B1, B5, R0, P0, Zeiträume fett) über eine Darstellungs-Zuordnung mit Test „Wortlaut identisch“. Doppelte Bedienhinweise streichen | klein (0,5 Tage) |
| 8 | **Ergebnis und Plan trennen:** Notfall 112 zuerst, Umschalter Kunden-/Lando-Sicht, Plan mit Gesamtdauer und Start oben, Badges und Codes nur für Lando. Im Player `aria-live` während der Sprachausgabe aus und einen Satz- und Wiederholungszähler anzeigen | mittel (1 bis 1,5 Tage) |

Danach: einen kurzen Test mit 3 bis 5 Personen aus der Zielgruppe (Handy und Tablet) sowie einen Durchlauf mit VoiceOver und TalkBack. Beides fehlt laut `ABSCHLUSSBLATT.md` noch. Die „Vorschläge an Lando (Fragetext)“ gesammelt mit der Fachperson besprechen.
