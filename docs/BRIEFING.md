# Briefing für den Piloten (Stand 06.10.2026)

Dieses Blatt ersetzt den Zugriff auf Landos Projektdokumente. Es fasst zusammen, was du für den Piloten wissen musst. Maßgeblich ist immer der Code in `audio_system/` (Daten in `regeln/` und `bausteine/`). Wo dieses Blatt und der Code verschieden sind, gilt der Code.

## Worum es geht
Lando (20, Personal Trainer) baut ein Angebot für Senioren zu Hause: persönlicher Plan, Audioanleitungen, Box mit Heft und Band. Ein Fragebogen prüft vorab, wer überhaupt einen Plan bekommen darf. Jeder Fall wird von Lando persönlich gesichtet. Nichts davon ist fachlich geprüft, ein ehemaliger Ausbilder liest gerade gegen. Der Pilot soll nur veranschaulichen, wie der Ablauf aussieht.

## Ablauf im echten Angebot (der Pilot zeigt nur den fett markierten Teil)
Link zum Fragebogen, **Fragebogen (Stufe 1), automatische Regelprüfung P1 mit Ampel, Plan aus den Bausteinen, Audio**, danach Sichtung durch Lando, Rückruf bei Orange, Angebot, Zahlung, Vertiefung (Stufe 2, im Pilot nicht gebaut).

## Ampel (Regelprüfung, kein KI Urteil)
- **Rot:** kein Plan, Absage nach Landos Freigabe. Auslöser sind harte Antworten (zum Beispiel Operation unter 3 Monaten, Brustschmerz bei leichter Belastung, neuer Schwindel, Thromboseverdacht, Osteoporose ohne ärztliche Erlaubnis, Sturz ohne Arztbesuch). Notfallhinweis bei Brustschmerz, Atemnot, Schwindel, Taubheit im Schritt, schwächer werdendem Bein: "Bitte lass diese Beschwerden zeitnah ärztlich abklären. Bei plötzlicher Atemnot, Brustschmerz oder einer Lähmung ruf den Notruf 112."
- **Orange:** Rückruf nötig, bevor ein Plan gebaut wird (Codes O1 bis O13, zum Beispiel "Weiß nicht" bei einer Rot Frage, Zustände aus drei Gruppen, Alter ab 90 mit Einschränkung, Schmerz wird schlechter).
- **Gelb:** Plan mit Auflagen. **Grün:** Plan ohne Auflagen.
- "Weiß nicht" zählt nie als gesund. Eine nicht angetippte Körperkarte heißt nicht "nein".
- Die Ampel setzt nur die Regelprüfung. Eine KI ändert sie nie. Eine Rückfrage an den Nutzer ersetzt keine Prüfung.

## Stufen für Bausteine (Übungen)
1 kein automatischer Plan, Lando entscheidet. 2 gesperrt (wenn möglich Ersatzbaustein). 3 Warnung (Variante oder Hinweis auf dem Planblatt). 4 nur Information. Gilt mehr als eine Regel, gilt die strengste. Details in `regeln/stufen.json` und `audiosystem/regeln.py`.

## Niveau und Wiederholungen
Niveau A (Liegen, Sitzen), B (dazu Stehen mit Halt), C (dazu Gehen). Startwert Wiederholungen: A 8, B und C 10, das Alter spielt keine Rolle. Ein Handwert von 5 bis 12 hat Vorrang (gibt es im Pilot nicht).

## Schmerzblock P
Nach der Körperkarte R0 wählt P0 höchstens drei Bereiche mit Schmerz, je Bereich drei Klickfragen (Art, Größe, Verlauf). Nur "Schlechter geworden" wirkt (Orange O13). Das System leitet nie eine Ursache (Muskel oder Gelenk) ab, das wäre eine Diagnose.

## Sprache und Ton
- Deutsch, Anrede in allen Texten für Nutzer: "du". Gesundheitsfragen sind neutral formuliert, weil auch Angehörige ausfüllen. Die Fragetexte stehen so in `fragebogen.json`.
- Keine Heil- oder Erfolgsversprechen, keine Krankheitsnamen in Werbung und Audio, keine Gedankenstriche, nichts, was nach KI klingt. Kurze ruhige Sätze.
- Annahmen und Schätzungen immer als solche kennzeichnen.

## Was bewusst noch fehlt (nicht erfinden)
Echte Aufnahmen (Bausteine sind Entwürfe, nicht freigegeben), Stufe 2 (Vertiefung), Orange O8 und O9, Gleichgewichtsbausteine, Bezahlung, Rückruf, Mails, Preis, Rechtstexte. Alle Gesundheitsfragen und Regeln sind Vorschläge ohne fachliche Prüfung. Das muss im Piloten sichtbar sein.

## Zusammenarbeit
Entscheidungen trifft Lando. Neue Gesundheitsregeln, geänderte Ampel oder Fragen erfindest du nicht, du meldest Auffälligkeiten als Liste.
