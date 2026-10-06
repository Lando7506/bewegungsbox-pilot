# Simulierte Kundentests: Zusammenfassung (06.10.2026)

Vier KI-Agenten haben den Piloten per Klick im Browser durchgespielt und Kritik gesammelt. Ihre Berichte liegen hier im Ordner. Es sind Simulationen, kein Ersatz für einen Test mit echten Senioren.

| Bericht | Rolle |
| --- | --- |
| `erika.md` | 81 Jahre, Tablet, starke Sehschwäche, Kniearthrose, wenig Technikerfahrung |
| `sabine.md` | 52 Jahre, füllt in Eile auf dem Handy für ihren Vater aus (88, Rollator, Blutverdünner, Sturz) |
| `horst.md` | 74 Jahre, kleines Handy, zitternde Hände, Rücken- und Schulterbeschwerden, misstrauisch bei Daten |
| `expertin.md` | UX- und Barrierefreiheits-Prüfung mit Gruppierungsvorschlag |

## Was alle vier gefunden haben

- Auf dem Handy verdeckte der feste Hinweisbalken unten Antworten und den Weiter-Knopf. Den Weiter-Knopf musste man fast immer erst suchen.
- Jede Frage stand auf einem eigenen Bildschirm, das waren 37 bis 49 Bildschirme. Das ermüdet, und nach vielen „Nein“ steigen die Fehltipps.
- Die Fortschrittsanzeige wuchs („von 37“ auf „von 48“), der Balken sprang zurück.
- „Alles löschen“ und „Nein“ bei der Einwilligung wirkten sofort und ohne Rückfrage.
- Ergebnis und Plan mischten Kundensprache mit internen Begriffen für Lando.

## Umgesetzt

| Änderung | Wirkung |
| --- | --- |
| Seite springt nach dem Antippen nicht mehr nach oben | Lando hatte das selbst gemeldet |
| Fragen nach Thema gruppiert (`darstellung.js`) | Ein typischer Fall braucht statt 37 bis 49 Bildschirmen jetzt etwa 20. Folgefragen erscheinen direkt unter der Frage, zu der sie gehören |
| Kein automatisches Weiter mehr | Bei zitternden Händen hatte ein Doppeltipp schon die nächste Frage beantwortet. Jetzt gibt es pro Bildschirm einmal „Weiter“ für mehrere Fragen |
| Feste Leiste unten mit Zurück und Weiter, dazu eine Tipp-Sperre von 0,6 Sekunden nach jedem Seitenwechsel | Weiter ist immer sichtbar, und ein Doppeltipp überspringt keinen Bildschirm |
| Pflichthinweis oben statt fest über dem Inhalt, Pilot-Werkzeuge im eingeklappten „Pilot-Menü“ | Mehr Platz, das Tablet scrollt nicht mehr seitlich |
| Lange Fragen als Liste (E5a, B1, B5, R0, P0), Zeitangaben fett | Der Wortlaut bleibt Zeichen für Zeichen gleich, ein Test prüft das |
| Ja, Nein und Weiß nicht in einer Reihe, die Wahl deutlich gefüllt mit Haken | Besser erkennbar, auch bei Sehschwäche |
| F1 mit Hinweis „hier ist andersherum gefragt“ | Weniger Rot aus Gewohnheit |
| Echte Optionsfelder und Kästchen statt Umschaltern | Pfeiltasten und Screenreader funktionieren richtig |
| Rückfrage bei „Alles löschen“ und bei „Nein“ zur Einwilligung | Kein Datenverlust durch einen Fehltipp |
| Übersicht „Bitte kurz prüfen“ vor der Auswertung, mit „Ändern“ je Bildschirm | Fehler werden gefunden, bevor die Ampel kommt. „Antworten ändern“ beginnt nicht mehr bei Frage 1 |
| Fortschritt nach Teilen, der Balken läuft nur vorwärts | Keine wachsende Fragenzahl mehr |
| Ampel: Notfallhinweis zuerst, eigene Zeichen statt Buchstaben (G für Grün und Gelb), „Darauf wird Rücksicht genommen“ | Verständlicher |
| Orange: „So geht es weiter“ mit dem Hinweis, wer angerufen wird. Fehlt die Telefonnummer, gibt es einen Knopf zum Eintragen | Sabines wichtigster Punkt |
| Plan: Gesamtdauer und Abspielen oben, je Übung „Wegen: …“ | Kein langes Scrollen bis zum Abspielen |
| Player: feste Leiste mit Pause, Vorige, Nochmal, Nächste | Pause liegt nicht mehr unter dem Bildrand |
| E-Mail- und Telefonfeld mit passender Tastatur, eine falsche Eingabe wird nicht mehr gelöscht | Schneller zu tippen |
| Warnung vor dem Schließen des Fensters, wenn schon Antworten da sind | Kein versehentlicher Verlust |

## Bewusst nicht umgesetzt

- **Anrede „Sie“:** Erika und die Expertin empfehlen sie. Lando hat sich für „du“ entschieden.
- **Antworten speichern, um später weiterzumachen:** Im Piloten bleibt bewusst nichts gespeichert (Datenschutz).
- **Kontaktdaten ans Ende stellen, R0 vor A2 und A3:** Das ist eine Änderung der Reihenfolge im Fragebogen, also Landos Entscheidung.
- **„Was heißt das?“-Erklärungen zu Fachwörtern:** Die Erklärtexte wären neue Gesundheitstexte und müssten fachlich geprüft werden.

## Vorschläge an Lando (Fragetext und Regeln)

Diese Punkte betreffen den Fragebogen selbst. Im Piloten ist daran nichts geändert.

1. **F1 umdrehen**, damit „Ja“ wie bei allen anderen Fragen das Problem meint. Zum Beispiel: „Braucht die Person Hilfe, um sich im Bett zu drehen oder aufzusetzen?“
2. **Anrede je nach Ausfüllendem:** Wer „Die Person selbst“ wählt, liest trotzdem „die Person“. Eine zweite Fassung der Fragen wäre gut.
3. **Doppelfragen teilen:** B3 (Herzschwäche oder Reflux), B5 (geschwollenes Bein oder Thromboseverdacht), C2 (Schwindel und ärztlich bekannt).
4. **W1** ist Rechtssprache. „Automatischer Assistent“ versteht niemand, das sollte rechtlich geprüft und einfacher formuliert werden.
5. **K4 Telefonnummer** ist freiwillig, wird aber bei Orange gebraucht. Zum Beispiel Pflicht für Angehörige oder spätestens bei Orange.
6. **W3a (Vollmacht)** hat kein „Weiß nicht“.
7. **Zeiträume vereinheitlichen**, wo fachlich möglich: 6 Wochen, 3, 6 und 12 Monate, „in letzter Zeit“.
8. **E1 „starke Schmerzen“** schärfer fassen, zum Beispiel „so stark, dass man nachts aufwacht“.
9. **E9 „Zurückbeugen“** mit einem Alltagsbeispiel erklären.
10. **Bedienhinweise im Fragetext** (C4a „1 = keine, 5 = sehr groß“, Z3 „bis zu zwei“) könnten in die Oberfläche wandern.
11. **K5 fragt nach Neuigkeiten per E-Mail.** Laut Auftrag gibt es keinen Newsletter, also prüfen, ob die Frage bleiben soll.
12. **Regeln, nicht Fragetext:** Bodenübungen (HB01, HB02) bei Stock, Rollator oder „Aufstehen nur mit Abstützen“. Kniebeugen bei Kniearthrose bleiben frei. Beides steht schon im Abschlussblatt.
