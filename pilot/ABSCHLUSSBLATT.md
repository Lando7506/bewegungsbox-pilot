# Abschlussblatt Pilot (06.10.2026)

## Was gebaut ist

Eine statische Web App in `pilot/`. Sie umfasst den Fragebogen, die Ampel, den Plan und einen Player mit Platzhalterstimme, dazu Beispielprofile im Menü. Sie läuft ohne Server, speichert nichts und sendet nichts. Der Workflow `.github/workflows/pages.yml` prüft bei jedem Push und veröffentlicht `main` auf GitHub Pages. Details stehen in `README.md`.

## Was die Tests zeigen

| Test | Ergebnis |
| --- | --- |
| `node pilot/tests/vergleich.test.js` | 13.076 Prüfungen, 0 Abweichungen. Geprüft wurden 55 Testprofile (A01 bis A30, N01 bis N25, darunter 2 absichtlich ungültige, die in beiden Systemen abgelehnt werden), die 400 Zufallsverläufe aus `regeltest.py` (gleicher Startwert), 400 zusätzliche milde Verläufe und 781 Zustandskombinationen (keiner, einzeln, paarweise). Verglichen werden die vollständige Auswertung und der Plan. |
| `node pilot/tests/sabotage.test.js` | B1 löst kein Rot mehr aus. Ergebnis: 46 Abweichungen, der Test schlägt fehl. Das Original besteht. |
| `node pilot/tests/browser.test.js` | 82 Prüfungen, 0 Fehler. A01 (grün) und N16 (rot) wurden Frage für Frage über die Oberfläche beantwortet, alle vier Ampelfarben über das Menü geladen und der Player bedient. Außerdem geprüft: Tastatur, 390 px ohne seitliches Scrollen, Schrift ab 20 px, fester Hinweis auf jeder Ansicht, keine Anfragen nach außen, keine Fehler in der Konsole. |
| `python -m unittest discover -s tests` | 116 Tests, alle grün. Am Python System ist nichts geändert. |

Die Erwartungswerte erzeugt `pilot/werkzeuge/export.py` aus dem Python System, nicht von Hand.

## Was nicht geprüft werden konnte

- **Ton auf echten Geräten.** In Chromium ohne Lautsprecher lief nur der Ablauf. Ob die Stimme gut klingt und ob es eine deutsche Stimme gibt, hängt vom Gerät ab. Bitte einmal auf Handy und Tablet ausprobieren.
- **Screenreader.** Die Bedienung mit Tastatur ist geprüft, ein Test mit VoiceOver oder TalkBack fehlt.
- **Echte Senioren.** Niemand aus der Zielgruppe hat den Piloten bedient.
- **GitHub Pages.** Pages muss einmal in den Einstellungen eingeschaltet werden (Source: GitHub Actions). Erst danach gilt die Adresse.

## Wo die Fachperson schauen sollte

Die Punkte stammen aus dem Python System (Referenz) und gelten im Piloten genauso. Geändert habe ich daran nichts.

1. **Rollstuhl oder Aufstehen nur mit fremder Hilfe ergibt Grün.** Dann sind alle Übungen frei, auch Knie heben im Stehen (KU02) und Kniebeugen (KU03). Das Niveau A wirkt nur auf die Wiederholungen (8), nicht auf die Auswahl. Geprüft mit Basis plus `C6 = rollstuhl` und mit Basis plus `C5 = fremde_hilfe`.
2. **C4 „Weiß nicht“ hat keine Wirkung.** Wer bei „Fühlt sich die Person beim Stehen unsicher?“ Weiß nicht wählt, kann Grün bekommen. Das widerspricht dem Grundsatz „Weiß nicht zählt nie als gesund“. Die Prüfung in `pruefe_fragebogen` deckt nur Ja/Nein/WN Fragen ab, C4 ist eine Auswahlfrage.
3. **Kniearthrose, Knieprothese und Hüftprothese sperren die Kniebeugen nicht.** KU01, KU02 und KU03 bleiben frei, nur HB01 und HB02 reagieren. Das passt nicht zu den eigenen internen Hinweisen „kein tiefes Beugen“ (Knieprothese) und „keine tiefe Hüftbeugung“ (Hüftprothese). Das ist die bekannte Lücke „ohne stufen_zuordnung ist ein Baustein frei“ (OP-F23). Sie wird im Plan sichtbar, sobald man Gelb mit Kniearthrose lädt (Beispiel A06).
4. **Osteoporose mit Freigabe** lässt alle acht Übungen frei, obwohl der interne Hinweis „keine starke Rumpfbeugung“ sagt.
5. **Titel der Bausteine** enthalten Fachbegriffe aus der eigenen Liste (Beinbeuger, Beinstrecker), dazu Bizeps Curls und den Markennamen Theraband. Der Pilot zeigt die Titel unverändert, weil sie aus den Daten kommen.
6. **Interne Hinweise in den Bausteinen** enthalten Wörter, die für Kunden gesperrt sind. Zum Beispiel steht bei HB02 und Kniearthrose „Beugung nur so weit wie schmerzfrei“. Der Pilot zeigt diese Texte nur unter „Für Lando“. Für ein Planblatt müssten sie neu formuliert werden.
7. **KU01 Einleitung:** „Das kräftigt deine Beine.“ Prüfen, ob das schon eine Wirkaussage ist.
8. **Einwilligung W1** nennt „Rückfragen durch einen automatischen Assistenten“. Das sollte rechtlich geprüft werden, bevor echte Daten fließen.
9. **Alter für O6** wird als laufendes Jahr minus Geburtsjahr gerechnet und kann um ein Jahr zu hoch liegen. Das ist so gewollt, steht im Code, sollte aber bestätigt werden.
10. **K2 hat `max: 2026`.** Ab 2027 begrenzt das nicht mehr auf das laufende Jahr. Das ist harmlos, weil der Code zusätzlich das laufende Jahr nimmt, sollte aber beim nächsten Entwurf angepasst werden.
11. **KU03 und KU04 zählen bis zehn**, auch wenn „so viele du schaffst“ gilt (bekannt, OP-B21). Im Player hört man das deutlich.

## Hinweise zum Piloten selbst

- Für Nutzer stehen nur eigene Bedienungstexte in du-Form und die Fragetexte aus den Daten. Die Felder `hinweis` aus `fragebogen.json` sind Notizen für Lando und werden nicht angezeigt.
- Wer beim Zurückgehen eine Antwort ändert, die Folgefragen ausblendet, behält die alten Antworten im Speicher. Sie zählen erst wieder, wenn die Folgefrage wieder gestellt wird. Ausgewertet wird immer nur, was im aktuellen Verlauf sichtbar ist.
- Bei Text- und E-Mail-Feldern steht der Hinweis, nichts Echtes einzutragen.

## Nachtrag 06.10.2026: simulierte Kundentests

Die Bedienung wurde nach vier simulierten Kundentests überarbeitet. Was umgesetzt ist, was bewusst nicht, und zwölf weitere Vorschläge zum Fragetext stehen in `ux-tests/ZUSAMMENFASSUNG.md`. Die wichtigsten neuen Punkte für die Fachperson:

- F1 ist andersherum gefragt. Nach vielen „Nein“ führt ein „Nein“ aus Gewohnheit zu Rot. Im Piloten gibt es jetzt einen Hinweis, besser wäre es, die Frage umzudrehen.
- Die Anrede „die Person“ passt nicht, wenn jemand selbst ausfüllt.
- Doppelfragen in B3, B5 und C2.
- Bei Orange wird angerufen, die Telefonnummer ist aber freiwillig.

