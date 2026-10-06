// Automatisch erzeugt von pilot/werkzeuge/export.py aus audio_system. Nicht von Hand ändern.
window.PILOT_DATEN = {
 "fragebogen": {
  "version": 4,
  "status": "entwurf_fachlich_nicht_geprueft",
  "hinweis": "Fragebogen Entwurf 4 als Daten. Fragetexte und IDs aus Dokument 13, neu sind R0, E3h, E3k, E3f, E9, E10, E11 die Reihenfolge und, nach dem Hinweis des Gegenlesers vom 06.10.2026, der Block P (Schmerz genauer: P0, P1 bis P3 je Region). Aus diesen Daten wird das Dokument erzeugt (python -m audiosystem fragebogen-doc). Alles Medizinische ist Entwurf.",
  "gesundheitsbereiche": [
   "A",
   "B",
   "C",
   "D",
   "E",
   "F",
   "M",
   "R",
   "P"
  ],
  "schritte": [
   {
    "nr": 0,
    "titel": "Einwilligung und Kontakt"
   },
   {
    "nr": 1,
    "titel": "Sicherheit und Grundlagen, für alle"
   },
   {
    "nr": 2,
    "titel": "Körperkarte"
   },
   {
    "nr": 3,
    "titel": "Folgefragen je gewählter Region"
   },
   {
    "nr": 4,
    "titel": "Schmerz genauer, je gewählter Region"
   },
   {
    "nr": 5,
    "titel": "Alltag und Ziel"
   }
  ],
  "orange_codes": {
   "O1": "Keine Vollmacht oder Betreuung, jemand anderes füllt aus",
   "O2": "Gelenkersatz Hüfte, Operateur nannte Bewegungsgrenzen oder unbekannt",
   "O3": "Osteoporose, ärztliche Freigabe unbekannt",
   "O4": "Zustände aus drei oder mehr verschiedenen Gruppen",
   "O5": "Abgeklärter Sturz und große Angst zu stürzen (4 oder 5)",
   "O6": "Alter 90 oder älter und mindestens ein Gelb Zustand",
   "O7": "Widerspruch in den Angaben",
   "O10": "Neue, noch nicht ärztlich angeschaute Schmerzen",
   "O11": "Weiß nicht bei einer Frage, die zu Rot führen kann",
   "O12": "Atemnot im Liegen oder unbekannt",
   "O13": "Schmerz in einer Region wird in den letzten Wochen schlechter"
  },
  "ampel": {
   "o4_min_gruppen": 3,
   "o5_skala_min": 4,
   "o6_alter": 90,
   "o7_widersprueche": [
    {
     "wenn": {
      "C4": "nie",
      "C6": "rollator"
     },
     "text": "Nie unsicher beim Stehen, aber Rollator"
    }
   ],
   "noch_nicht_geprueft": [
    "O8 Ausstattung (braucht die Antworten aus Stufe 2)",
    "O9 Baubarkeit (Kernbausteine für Kraft und Gleichgewicht fehlen noch, Dokument 12 Abschnitt 6)",
    "Widersprüche, die Stufe 2 betreffen (Dokument 12 Abschnitt 4)"
   ],
   "zaehlgruppen": {
    "Gelenkersatz": [
     "hueftprothese_laenger_her",
     "knieprothese_laenger_her"
    ],
    "Gelenke": [
     "gelenkschmerz_bei_bewegung",
     "kniearthrose",
     "schulterprobleme",
     "region_unklar_hueft",
     "region_unklar_knie",
     "region_unklar_schulter",
     "region_unklar_fuss"
    ],
    "Sturz und Schwindel": [
     "sturz_unter_12_monate_abgeklaert",
     "standunsicher",
     "schwindel_beim_hinlegen"
    ],
    "Kreislauf, Blut, Stoffwechsel": [
     "blutverduenner",
     "herzschwaeche_reflux_atemnot_liegend",
     "diabetes_mit_unterzucker"
    ],
    "Knochen": [
     "osteoporose_mit_freigabe"
    ],
    "Rücken und Muskeln": [
     "ischias_beschwerden",
     "akuter_muskelfaserriss",
     "rueckenprobleme_hohlkreuz",
     "krampfneigung",
     "nackenprobleme",
     "region_unklar_ruecken",
     "region_unklar_nacken",
     "region_unklar_oberschenkel_wade"
    ]
   }
  },
  "notfallhinweis": "Bitte lass diese Beschwerden zeitnah ärztlich abklären. Bei plötzlicher Atemnot, Brustschmerz oder einer Lähmung ruf den Notruf 112.",
  "ziele": {
   "aufstehen_hinsetzen": {
    "text": "sicherer aufstehen und hinsetzen",
    "aus_z1": [
     "aufstehen_sofa_stuhl",
     "hinsetzen"
    ]
   },
   "treppen": {
    "text": "Treppen leichter steigen",
    "aus_z1": [
     "treppen"
    ]
   },
   "schuhe": {
    "text": "Schuhe wieder leichter selbst anziehen",
    "aus_z1": [
     "schuhe_anziehen"
    ]
   },
   "einkaufen": {
    "text": "wieder selbst einkaufen gehen",
    "aus_z1": [
     "einkaufen"
    ]
   },
   "spazieren": {
    "text": "wieder spazieren gehen",
    "aus_z1": [
     "spazierengehen"
    ]
   },
   "umdrehen": {
    "text": "leichter im Bett umdrehen",
    "aus_z1": [
     "umdrehen_bett"
    ]
   },
   "steif": {
    "text": "weniger steif sein",
    "wenn_z2_nicht_leer": true
   },
   "morgens": {
    "text": "morgens beweglicher sein",
    "wenn_z1_und_z2_leer": true
   }
  },
  "fragen": [
   {
    "id": "W1",
    "bereich": "W",
    "text": "Ich willige ausdrücklich ein, dass die Gesundheitsangaben zur Erstellung des Plans verarbeitet werden, einschließlich möglicher Rückfragen durch einen automatischen Assistenten.",
    "typ": "ja_nein",
    "pflicht": true,
    "quelle": "entwurf3",
    "wirkung": {
     "nein": {
      "stopp": "Ohne Einwilligung kein Fortfahren"
     }
    },
    "schritt": 0
   },
   {
    "id": "W2",
    "bereich": "W",
    "text": "Mir ist klar, dass dieses Programm keine ärztliche Behandlung ersetzt.",
    "typ": "ja_nein",
    "pflicht": true,
    "quelle": "entwurf3",
    "wirkung": {
     "nein": {
      "stopp": "Ohne Bestätigung kein Fortfahren"
     }
    },
    "schritt": 0
   },
   {
    "id": "W3",
    "bereich": "W",
    "text": "Wer füllt aus?",
    "typ": "auswahl",
    "pflicht": true,
    "quelle": "entwurf3",
    "optionen": [
     {
      "wert": "selbst",
      "text": "Die Person selbst"
     },
     {
      "wert": "jemand_anderes",
      "text": "Jemand anderes für die Person"
     }
    ],
    "schritt": 0
   },
   {
    "id": "W3a",
    "bereich": "W",
    "text": "Gibt es eine Vollmacht oder eine rechtliche Betreuung?",
    "typ": "ja_nein",
    "pflicht": true,
    "quelle": "entwurf3",
    "nur_wenn": {
     "frage": "W3",
     "wert": "jemand_anderes"
    },
    "wirkung": {
     "nein": {
      "orange": [
       "O1"
      ]
     }
    },
    "schritt": 0
   },
   {
    "id": "W3b",
    "bereich": "W",
    "text": "Dein Vorname",
    "typ": "text",
    "pflicht": true,
    "quelle": "entwurf3",
    "nur_wenn": {
     "frage": "W3",
     "wert": "jemand_anderes"
    },
    "schritt": 0
   },
   {
    "id": "K1",
    "bereich": "K",
    "text": "Vorname der Person, die trainieren soll",
    "typ": "text",
    "pflicht": true,
    "quelle": "entwurf3",
    "schritt": 0
   },
   {
    "id": "K2",
    "bereich": "K",
    "text": "Geburtsjahr der Person",
    "typ": "zahl",
    "pflicht": true,
    "quelle": "entwurf3",
    "min": 1900,
    "max": 2026,
    "schritt": 0
   },
   {
    "id": "K3",
    "bereich": "K",
    "text": "E-Mail für die Auswertung",
    "typ": "text",
    "pflicht": true,
    "quelle": "entwurf3",
    "schritt": 0
   },
   {
    "id": "K4",
    "bereich": "K",
    "text": "Telefonnummer für eine mögliche Rückfrage",
    "typ": "text",
    "pflicht": false,
    "quelle": "entwurf3",
    "schritt": 0
   },
   {
    "id": "K5",
    "bereich": "K",
    "text": "Möchtest du Neuigkeiten per E-Mail bekommen?",
    "typ": "ja_nein",
    "pflicht": false,
    "quelle": "entwurf3",
    "schritt": 0
   },
   {
    "id": "A1",
    "bereich": "A",
    "text": "Gab es in den letzten 3 Monaten eine Operation an Hüfte, Knie, Rücken oder Schulter?",
    "typ": "ja_nein_wn",
    "pflicht": true,
    "quelle": "entwurf3",
    "wirkung": {
     "ja": {
      "zustaende": [
       "hueft_oder_knie_op_unter_3_monate",
       "ruecken_schulter_op_unter_3_monate"
      ],
      "rot": "Operation in den letzten 3 Monaten"
     },
     "wn": {
      "orange": [
       "O11"
      ]
     }
    },
    "schritt": 1
   },
   {
    "id": "A2",
    "bereich": "A",
    "text": "Gibt es ein künstliches Hüftgelenk?",
    "typ": "ja_nein_wn",
    "pflicht": true,
    "quelle": "entwurf3",
    "region": [
     "hueft"
    ],
    "wirkung": {
     "ja": {
      "zustaende": [
       "hueftprothese_laenger_her"
      ]
     },
     "wn": {
      "vorsicht": [
       "hueftprothese_laenger_her"
      ]
     }
    },
    "schritt": 1
   },
   {
    "id": "A2a",
    "bereich": "A",
    "text": "Hat der Operateur Bewegungen genannt, die vermieden werden sollen?",
    "typ": "ja_nein_wn",
    "pflicht": true,
    "quelle": "entwurf3",
    "nur_wenn": {
     "frage": "A2",
     "wert": "ja"
    },
    "region": [
     "hueft"
    ],
    "wirkung": {
     "ja": {
      "orange": [
       "O2"
      ]
     },
     "wn": {
      "orange": [
       "O2"
      ]
     }
    },
    "schritt": 1
   },
   {
    "id": "A3",
    "bereich": "A",
    "text": "Gibt es ein künstliches Kniegelenk?",
    "typ": "ja_nein_wn",
    "pflicht": true,
    "quelle": "entwurf3",
    "region": [
     "knie"
    ],
    "wirkung": {
     "ja": {
      "zustaende": [
       "knieprothese_laenger_her"
      ]
     },
     "wn": {
      "vorsicht": [
       "knieprothese_laenger_her"
      ]
     }
    },
    "schritt": 1
   },
   {
    "id": "B1",
    "bereich": "B",
    "text": "Treten Brustschmerzen, Engegefühl oder Atemnot schon bei leichter Belastung auf, zum Beispiel auf der Treppe oder beim Anziehen?",
    "typ": "ja_nein_wn",
    "pflicht": true,
    "quelle": "entwurf3",
    "wirkung": {
     "ja": {
      "zustaende": [
       "brustschmerz_atemnot_belastung"
      ],
      "rot": "Brustschmerz oder Atemnot bei leichter Belastung",
      "notfall": true
     },
     "wn": {
      "orange": [
       "O11"
      ]
     }
    },
    "schritt": 1
   },
   {
    "id": "B2",
    "bereich": "B",
    "text": "Gab es in den letzten 6 Monaten einen Herzinfarkt, einen Schlaganfall oder eine Herzoperation?",
    "typ": "ja_nein_wn",
    "pflicht": true,
    "quelle": "entwurf3",
    "wirkung": {
     "ja": {
      "zustaende": [
       "herzinfarkt_schlaganfall_herz_op_unter_6_monate"
      ],
      "rot": "Herzinfarkt, Schlaganfall oder Herzoperation in den letzten 6 Monaten"
     },
     "wn": {
      "orange": [
       "O11"
      ]
     }
    },
    "schritt": 1
   },
   {
    "id": "B3",
    "bereich": "B",
    "text": "Gibt es eine Herzschwäche oder Sodbrennen im Liegen (Reflux)?",
    "typ": "ja_nein_wn",
    "pflicht": true,
    "quelle": "entwurf3",
    "wirkung": {
     "ja": {
      "zustaende": [
       "herzschwaeche_reflux_atemnot_liegend"
      ]
     },
     "wn": {
      "vorsicht": [
       "herzschwaeche_reflux_atemnot_liegend"
      ]
     }
    },
    "schritt": 1
   },
   {
    "id": "B4",
    "bereich": "B",
    "text": "Werden Blutverdünner genommen?",
    "typ": "ja_nein_wn",
    "pflicht": true,
    "quelle": "entwurf3",
    "wirkung": {
     "ja": {
      "zustaende": [
       "blutverduenner"
      ]
     },
     "wn": {
      "vorsicht": [
       "blutverduenner"
      ]
     }
    },
    "schritt": 1
   },
   {
    "id": "B5",
    "bereich": "B",
    "text": "Ist ein Bein in letzter Zeit neu angeschwollen, warm oder schmerzhaft, und zwar nur auf einer Seite? Oder wurde eine Thrombose vermutet, die noch nicht behandelt ist?",
    "typ": "ja_nein_wn",
    "pflicht": true,
    "quelle": "entwurf3",
    "wirkung": {
     "ja": {
      "zustaende": [
       "thrombose_verdacht"
      ],
      "rot": "Neue einseitige Beinschwellung oder Thromboseverdacht",
      "notfall": true
     },
     "wn": {
      "orange": [
       "O11"
      ]
     }
    },
    "schritt": 1
   },
   {
    "id": "B6",
    "bereich": "B",
    "text": "Kam es in letzter Zeit, etwa in den letzten 3 Monaten, zu Unterzuckerungen, zum Beispiel bei Diabetes?",
    "typ": "ja_nein_wn",
    "pflicht": true,
    "quelle": "entwurf3",
    "wirkung": {
     "ja": {
      "zustaende": [
       "diabetes_mit_unterzucker"
      ]
     },
     "wn": {
      "vorsicht": [
       "diabetes_mit_unterzucker"
      ]
     }
    },
    "schritt": 1
   },
   {
    "id": "B7",
    "bereich": "B",
    "text": "Wird die Person beim flachen Liegen kurzatmig?",
    "typ": "ja_nein_wn",
    "pflicht": true,
    "quelle": "entwurf3",
    "wirkung": {
     "ja": {
      "zustaende": [
       "herzschwaeche_reflux_atemnot_liegend"
      ],
      "orange": [
       "O12"
      ]
     },
     "wn": {
      "vorsicht": [
       "herzschwaeche_reflux_atemnot_liegend"
      ],
      "orange": [
       "O12"
      ]
     }
    },
    "schritt": 1
   },
   {
    "id": "C1",
    "bereich": "C",
    "text": "Ist ein Schwindel neu aufgetreten oder noch nicht ärztlich abgeklärt?",
    "typ": "ja_nein_wn",
    "pflicht": true,
    "quelle": "entwurf3",
    "wirkung": {
     "ja": {
      "zustaende": [
       "neuer_unklarer_schwindel"
      ],
      "rot": "Neuer oder ungeklärter Schwindel",
      "notfall": true
     },
     "wn": {
      "orange": [
       "O11"
      ]
     }
    },
    "schritt": 1
   },
   {
    "id": "C2",
    "bereich": "C",
    "text": "Gibt es Schwindel beim Hinlegen oder Aufstehen, der ärztlich bekannt ist?",
    "typ": "ja_nein_wn",
    "pflicht": true,
    "quelle": "entwurf3",
    "wirkung": {
     "ja": {
      "zustaende": [
       "schwindel_beim_hinlegen"
      ]
     },
     "wn": {
      "vorsicht": [
       "schwindel_beim_hinlegen"
      ]
     }
    },
    "schritt": 1
   },
   {
    "id": "C3",
    "bereich": "C",
    "text": "Gab es in den letzten 12 Monaten einen Sturz?",
    "typ": "ja_nein_wn",
    "pflicht": true,
    "quelle": "entwurf3",
    "wirkung": {
     "wn": {
      "orange": [
       "O11"
      ]
     }
    },
    "schritt": 1
   },
   {
    "id": "C3a",
    "bereich": "C",
    "text": "Hat danach ein Arzt nachgeschaut?",
    "typ": "ja_nein_wn",
    "pflicht": true,
    "quelle": "entwurf3",
    "nur_wenn": {
     "frage": "C3",
     "wert": "ja"
    },
    "wirkung": {
     "nein": {
      "zustaende": [
       "sturz_unter_12_monate_ungeklaert"
      ],
      "rot": "Sturz ohne ärztliche Abklärung",
      "strittig": true
     },
     "wn": {
      "orange": [
       "O11"
      ]
     },
     "ja": {
      "zustaende": [
       "sturz_unter_12_monate_abgeklaert"
      ]
     }
    },
    "schritt": 1
   },
   {
    "id": "C3b",
    "bereich": "C",
    "text": "Wann war der Sturz ungefähr?",
    "typ": "auswahl",
    "pflicht": true,
    "quelle": "entwurf3",
    "optionen": [
     {
      "wert": "letzte_3_monate",
      "text": "In den letzten 3 Monaten"
     },
     {
      "wert": "laenger_her",
      "text": "Länger her"
     }
    ],
    "nur_wenn": {
     "frage": "C3",
     "wert": "ja"
    },
    "hinweis": "Information für Lando und Fachperson, keine Regelwirkung",
    "schritt": 1
   },
   {
    "id": "C4",
    "bereich": "C",
    "text": "Fühlt sich die Person beim Stehen unsicher?",
    "typ": "auswahl",
    "pflicht": true,
    "quelle": "entwurf3",
    "optionen": [
     {
      "wert": "nie",
      "text": "Nie"
     },
     {
      "wert": "manchmal",
      "text": "Manchmal"
     },
     {
      "wert": "oft",
      "text": "Oft"
     },
     {
      "wert": "wn",
      "text": "Weiß nicht"
     }
    ],
    "hinweis": "Weiß nicht wird wie Manchmal behandelt (Folgefrage C4a), wirkt aber nicht auf das Niveau",
    "wirkung": {
     "oft": {
      "zustaende": [
       "standunsicher"
      ]
     }
    },
    "schritt": 1
   },
   {
    "id": "C4a",
    "bereich": "C",
    "text": "Wie groß ist die Angst zu stürzen? (1 = keine, 5 = sehr groß)",
    "typ": "skala",
    "pflicht": true,
    "quelle": "entwurf3",
    "nur_wenn": {
     "frage": "C4",
     "werte": [
      "manchmal",
      "oft",
      "wn"
     ]
    },
    "min": 1,
    "max": 5,
    "schritt": 1
   },
   {
    "id": "C5",
    "bereich": "C",
    "text": "Wie klappt das Aufstehen von einem Stuhl?",
    "typ": "auswahl",
    "pflicht": true,
    "quelle": "entwurf3",
    "optionen": [
     {
      "wert": "ohne_hilfe",
      "text": "Ohne Hilfe der Arme"
     },
     {
      "wert": "abstuetzen",
      "text": "Nur mit Abstützen"
     },
     {
      "wert": "fremde_hilfe",
      "text": "Nur mit fremder Hilfe"
     }
    ],
    "schritt": 1
   },
   {
    "id": "C6",
    "bereich": "C",
    "text": "Welches Hilfsmittel wird beim Gehen genutzt?",
    "typ": "auswahl",
    "pflicht": true,
    "quelle": "entwurf3",
    "optionen": [
     {
      "wert": "keins",
      "text": "Keins"
     },
     {
      "wert": "stock",
      "text": "Stock"
     },
     {
      "wert": "rollator",
      "text": "Rollator"
     },
     {
      "wert": "rollstuhl",
      "text": "Rollstuhl"
     }
    ],
    "schritt": 1
   },
   {
    "id": "D1",
    "bereich": "D",
    "text": "Gab es in den letzten 3 Monaten einen Wirbelbruch oder einen anderen Knochenbruch?",
    "typ": "ja_nein_wn",
    "pflicht": true,
    "quelle": "entwurf3",
    "wirkung": {
     "ja": {
      "zustaende": [
       "knochenbruch_unter_3_monate"
      ],
      "rot": "Knochenbruch in den letzten 3 Monaten"
     },
     "wn": {
      "orange": [
       "O11"
      ]
     }
    },
    "schritt": 1
   },
   {
    "id": "D2",
    "bereich": "D",
    "text": "Gibt es Osteoporose oder einen früheren Wirbelbruch?",
    "typ": "ja_nein_wn",
    "pflicht": true,
    "quelle": "entwurf3",
    "wirkung": {
     "wn": {
      "orange": [
       "O11"
      ],
      "vorsicht": [
       "osteoporose_mit_freigabe"
      ]
     }
    },
    "schritt": 1
   },
   {
    "id": "D2a",
    "bereich": "D",
    "text": "Hat ein Arzt Bewegung ausdrücklich erlaubt?",
    "typ": "ja_nein_wn",
    "pflicht": true,
    "quelle": "entwurf3",
    "nur_wenn": {
     "frage": "D2",
     "wert": "ja"
    },
    "wirkung": {
     "nein": {
      "zustaende": [
       "osteoporose_ohne_freigabe"
      ],
      "rot": "Osteoporose ohne ärztliche Freigabe",
      "strittig": true
     },
     "wn": {
      "orange": [
       "O3"
      ],
      "vorsicht": [
       "osteoporose_mit_freigabe"
      ]
     },
     "ja": {
      "zustaende": [
       "osteoporose_mit_freigabe"
      ]
     }
    },
    "schritt": 1
   },
   {
    "id": "E1",
    "bereich": "E",
    "text": "Gibt es starke Schmerzen, die auch in Ruhe da sind?",
    "typ": "ja_nein_wn",
    "pflicht": true,
    "quelle": "entwurf3",
    "wirkung": {
     "ja": {
      "zustaende": [
       "starke_neue_schmerzen_in_ruhe"
      ],
      "rot": "Starke Schmerzen auch in Ruhe"
     },
     "wn": {
      "orange": [
       "O11"
      ]
     }
    },
    "schritt": 1
   },
   {
    "id": "E2",
    "bereich": "E",
    "text": "Hat ein Arzt aktuell von Bewegung oder Training abgeraten?",
    "typ": "ja_nein_wn",
    "pflicht": true,
    "quelle": "entwurf3",
    "wirkung": {
     "ja": {
      "zustaende": [
       "arzt_riet_von_training_ab"
      ],
      "rot": "Arzt hat von Bewegung abgeraten"
     },
     "wn": {
      "orange": [
       "O11"
      ]
     }
    },
    "schritt": 1
   },
   {
    "id": "E5a",
    "bereich": "E",
    "text": "Gibt es eines davon: Taubheit im Gesäß oder im Schritt, neue Probleme beim Wasserlassen oder Stuhlgang, ein Bein, das immer schwächer wird?",
    "typ": "ja_nein_wn",
    "pflicht": true,
    "quelle": "entwurf4",
    "hinweis": "Neu für alle. In Entwurf 3 erschien die Frage nur nach Rückenschmerzen ins Bein",
    "wirkung": {
     "ja": {
      "zustaende": [
       "ischias_notfallzeichen"
      ],
      "rot": "Warnzeichen am Rücken oder Nerv (Taubheit im Schritt, Blase oder Darm, Schwäche im Bein)",
      "notfall": true
     },
     "wn": {
      "orange": [
       "O11"
      ]
     }
    },
    "schritt": 1
   },
   {
    "id": "E6",
    "bereich": "E",
    "text": "Gab es in den letzten 6 Wochen eine Muskelverletzung im Bein, zum Beispiel einen Faserriss oder eine Zerrung?",
    "typ": "ja_nein_wn",
    "pflicht": true,
    "quelle": "entwurf3",
    "region": [
     "oberschenkel_wade"
    ],
    "wirkung": {
     "ja": {
      "zustaende": [
       "akuter_muskelfaserriss"
      ]
     },
     "wn": {
      "vorsicht": [
       "akuter_muskelfaserriss"
      ]
     }
    },
    "schritt": 1
   },
   {
    "id": "E7",
    "bereich": "E",
    "text": "Sind in den letzten Wochen neue Schmerzen aufgetreten, die noch kein Arzt angeschaut hat?",
    "typ": "ja_nein_wn",
    "pflicht": true,
    "quelle": "entwurf3",
    "wirkung": {
     "ja": {
      "orange": [
       "O10"
      ]
     },
     "wn": {
      "orange": [
       "O10"
      ]
     }
    },
    "schritt": 1
   },
   {
    "id": "F1",
    "bereich": "F",
    "text": "Kann die Person sich im Bett selbstständig drehen und aufsetzen?",
    "typ": "ja_nein_wn",
    "pflicht": true,
    "quelle": "entwurf3",
    "wirkung": {
     "nein": {
      "zustaende": [
       "kann_sich_im_bett_nicht_selbst_drehen"
      ],
      "rot": "Kann sich im Bett nicht selbstständig drehen oder aufsetzen"
     },
     "wn": {
      "orange": [
       "O11"
      ]
     }
    },
    "schritt": 1
   },
   {
    "id": "M1",
    "bereich": "M",
    "text": "Gibt es eine Latexallergie?",
    "typ": "ja_nein_wn",
    "pflicht": true,
    "quelle": "entwurf3",
    "wirkung": {
     "ja": {
      "zustaende": [
       "latexallergie"
      ]
     },
     "wn": {
      "vorsicht": [
       "latexallergie"
      ]
     }
    },
    "schritt": 1
   },
   {
    "id": "R0",
    "bereich": "R",
    "text": "Wo gibt es Beschwerden, eine Operation, einen Gelenkersatz oder eine Verletzung? Mehrere Bereiche sind möglich.",
    "typ": "region_karte",
    "pflicht": true,
    "quelle": "entwurf4",
    "hinweis": "Pflichtfrage. Wer nichts davon hat, wählt ausdrücklich 'Nichts davon'. Kein stilles Überspringen.",
    "schritt": 2
   },
   {
    "id": "E3h",
    "bereich": "E",
    "text": "Gibt es Schmerzen in der Hüfte bei Bewegung?",
    "typ": "ja_nein_wn",
    "pflicht": true,
    "quelle": "entwurf4",
    "nur_wenn": {
     "frage": "R0",
     "enthaelt": "hueft"
    },
    "region": [
     "hueft"
    ],
    "hinweis": "Ersetzt E3 und E3a aus Entwurf 3 (Gelenkschmerz, an welchen Gelenken)",
    "wirkung": {
     "ja": {
      "zustaende": [
       "gelenkschmerz_bei_bewegung"
      ]
     },
     "wn": {
      "vorsicht": [
       "gelenkschmerz_bei_bewegung"
      ]
     }
    },
    "schritt": 3
   },
   {
    "id": "E3k",
    "bereich": "E",
    "text": "Gibt es Schmerzen im Knie bei Bewegung?",
    "typ": "ja_nein_wn",
    "pflicht": true,
    "quelle": "entwurf4",
    "nur_wenn": {
     "frage": "R0",
     "enthaelt": "knie"
    },
    "region": [
     "knie"
    ],
    "wirkung": {
     "ja": {
      "zustaende": [
       "gelenkschmerz_bei_bewegung"
      ]
     },
     "wn": {
      "vorsicht": [
       "gelenkschmerz_bei_bewegung"
      ]
     }
    },
    "schritt": 3
   },
   {
    "id": "E8",
    "bereich": "E",
    "text": "Wurde im Knie eine Arthrose festgestellt?",
    "typ": "ja_nein_wn",
    "pflicht": true,
    "quelle": "entwurf3",
    "nur_wenn": {
     "frage": "R0",
     "enthaelt": "knie"
    },
    "region": [
     "knie"
    ],
    "wirkung": {
     "ja": {
      "zustaende": [
       "kniearthrose"
      ]
     },
     "wn": {
      "vorsicht": [
       "kniearthrose"
      ]
     }
    },
    "schritt": 3
   },
   {
    "id": "E3f",
    "bereich": "E",
    "text": "Gibt es Schmerzen im Fuß oder Knöchel bei Bewegung?",
    "typ": "ja_nein_wn",
    "pflicht": true,
    "quelle": "vorschlag",
    "nur_wenn": {
     "frage": "R0",
     "enthaelt": "fuss"
    },
    "region": [
     "fuss"
    ],
    "wirkung": {
     "ja": {
      "zustaende": [
       "gelenkschmerz_bei_bewegung"
      ]
     },
     "wn": {
      "vorsicht": [
       "gelenkschmerz_bei_bewegung"
      ]
     }
    },
    "schritt": 3
   },
   {
    "id": "E4",
    "bereich": "E",
    "text": "Gibt es Schulterprobleme oder eine Schulteroperation, die länger als 3 Monate her ist?",
    "typ": "ja_nein_wn",
    "pflicht": true,
    "quelle": "entwurf3",
    "nur_wenn": {
     "frage": "R0",
     "enthaelt": "schulter"
    },
    "region": [
     "schulter"
    ],
    "wirkung": {
     "ja": {
      "zustaende": [
       "schulterprobleme"
      ]
     },
     "wn": {
      "vorsicht": [
       "schulterprobleme"
      ]
     }
    },
    "schritt": 3
   },
   {
    "id": "E5",
    "bereich": "E",
    "text": "Gibt es Rückenschmerzen, die ins Bein ausstrahlen?",
    "typ": "ja_nein_wn",
    "pflicht": true,
    "quelle": "entwurf3",
    "nur_wenn": {
     "frage": "R0",
     "enthaelt": "ruecken"
    },
    "region": [
     "ruecken"
    ],
    "wirkung": {
     "ja": {
      "zustaende": [
       "ischias_beschwerden"
      ]
     },
     "wn": {
      "vorsicht": [
       "ischias_beschwerden"
      ]
     }
    },
    "schritt": 3
   },
   {
    "id": "E9",
    "bereich": "E",
    "text": "Gibt es Beschwerden im unteren Rücken, die beim Liegen oder beim Zurückbeugen stärker werden?",
    "typ": "ja_nein_wn",
    "pflicht": true,
    "quelle": "vorschlag",
    "nur_wenn": {
     "frage": "R0",
     "enthaelt": "ruecken"
    },
    "region": [
     "ruecken"
    ],
    "hinweis": "Fragetext offen (OP-L12), Vorschlag",
    "wirkung": {
     "ja": {
      "zustaende": [
       "rueckenprobleme_hohlkreuz"
      ]
     },
     "wn": {
      "vorsicht": [
       "rueckenprobleme_hohlkreuz"
      ]
     }
    },
    "schritt": 3
   },
   {
    "id": "E10",
    "bereich": "E",
    "text": "Neigt die Person zu Muskelkrämpfen, zum Beispiel in den Waden?",
    "typ": "ja_nein_wn",
    "pflicht": true,
    "quelle": "vorschlag",
    "nur_wenn": {
     "frage": "R0",
     "enthaelt": "oberschenkel_wade"
    },
    "region": [
     "oberschenkel_wade"
    ],
    "wirkung": {
     "ja": {
      "zustaende": [
       "krampfneigung"
      ]
     },
     "wn": {
      "vorsicht": [
       "krampfneigung"
      ]
     }
    },
    "schritt": 3
   },
   {
    "id": "E11",
    "bereich": "E",
    "text": "Gibt es Schmerzen oder Probleme beim Drehen oder Heben des Kopfes?",
    "typ": "ja_nein_wn",
    "pflicht": true,
    "quelle": "vorschlag",
    "nur_wenn": {
     "frage": "R0",
     "enthaelt": "nacken"
    },
    "region": [
     "nacken"
    ],
    "wirkung": {
     "ja": {
      "zustaende": [
       "nackenprobleme"
      ]
     },
     "wn": {
      "vorsicht": [
       "nackenprobleme"
      ]
     }
    },
    "schritt": 3
   },
   {
    "id": "P0",
    "bereich": "P",
    "text": "Bei welchen dieser Bereiche gibt es Schmerzen? Höchstens drei auswählen, die am meisten stören. Gibt es keine Schmerzen, bitte \"Keine Schmerzen\" wählen.",
    "typ": "region_teilauswahl",
    "teilmenge_von": "R0",
    "max": 3,
    "pflicht": true,
    "quelle": "gegenleser",
    "nur_wenn": {
     "frage": "R0",
     "hat_region": true
    },
    "hinweis": "Wer mehr als drei Bereiche gewählt hat, wählt hier die drei, die am meisten stören. Die übrigen Bereiche laufen wie bisher über ihre Folgefragen.",
    "schritt": 4
   },
   {
    "id": "P1n",
    "bereich": "P",
    "text": "Wie fühlt sich der Schmerz im Nacken an?",
    "typ": "auswahl",
    "optionen": [
     {
      "wert": "stechend",
      "text": "Stechend oder einschießend"
     },
     {
      "wert": "dumpf",
      "text": "Dumpf oder drückend"
     },
     {
      "wert": "ziehend",
      "text": "Ziehend oder brennend"
     },
     {
      "wert": "weiss_nicht",
      "text": "Weiß nicht"
     }
    ],
    "pflicht": true,
    "quelle": "gegenleser",
    "nur_wenn": {
     "frage": "P0",
     "enthaelt": "nacken"
    },
    "hinweis": "Nur Hinweis für den Rückruf, keine Regelwirkung, keine Diagnose.",
    "schritt": 4
   },
   {
    "id": "P2n",
    "bereich": "P",
    "text": "Wie groß ist die schmerzende Stelle im Nacken?",
    "typ": "auswahl",
    "optionen": [
     {
      "wert": "punktuell",
      "text": "Punktuell, mit einem Finger zeigbar"
     },
     {
      "wert": "breitflaechig",
      "text": "Breitflächig"
     },
     {
      "wert": "weiss_nicht",
      "text": "Weiß nicht"
     }
    ],
    "pflicht": true,
    "quelle": "gegenleser",
    "nur_wenn": {
     "frage": "P0",
     "enthaelt": "nacken"
    },
    "hinweis": "Nur Hinweis für den Rückruf, keine Regelwirkung.",
    "schritt": 4
   },
   {
    "id": "P3n",
    "bereich": "P",
    "text": "Wie hat sich der Schmerz im Nacken in den letzten Wochen entwickelt?",
    "typ": "auswahl",
    "optionen": [
     {
      "wert": "besser",
      "text": "Besser geworden"
     },
     {
      "wert": "gleich",
      "text": "Gleich geblieben"
     },
     {
      "wert": "schlechter",
      "text": "Schlechter geworden"
     },
     {
      "wert": "weiss_nicht",
      "text": "Weiß nicht"
     }
    ],
    "pflicht": true,
    "quelle": "gegenleser",
    "nur_wenn": {
     "frage": "P0",
     "enthaelt": "nacken"
    },
    "hinweis": "Schlechter wird Orange (Rückruf). Weiß nicht hat keine Wirkung, die Antwort ist ein Hinweis für den Rückruf.",
    "wirkung": {
     "schlechter": {
      "orange": [
       "O13"
      ]
     }
    },
    "schritt": 4
   },
   {
    "id": "P1s",
    "bereich": "P",
    "text": "Wie fühlt sich der Schmerz in der Schulter an?",
    "typ": "auswahl",
    "optionen": [
     {
      "wert": "stechend",
      "text": "Stechend oder einschießend"
     },
     {
      "wert": "dumpf",
      "text": "Dumpf oder drückend"
     },
     {
      "wert": "ziehend",
      "text": "Ziehend oder brennend"
     },
     {
      "wert": "weiss_nicht",
      "text": "Weiß nicht"
     }
    ],
    "pflicht": true,
    "quelle": "gegenleser",
    "nur_wenn": {
     "frage": "P0",
     "enthaelt": "schulter"
    },
    "hinweis": "Nur Hinweis für den Rückruf, keine Regelwirkung, keine Diagnose.",
    "schritt": 4
   },
   {
    "id": "P2s",
    "bereich": "P",
    "text": "Wie groß ist die schmerzende Stelle in der Schulter?",
    "typ": "auswahl",
    "optionen": [
     {
      "wert": "punktuell",
      "text": "Punktuell, mit einem Finger zeigbar"
     },
     {
      "wert": "breitflaechig",
      "text": "Breitflächig"
     },
     {
      "wert": "weiss_nicht",
      "text": "Weiß nicht"
     }
    ],
    "pflicht": true,
    "quelle": "gegenleser",
    "nur_wenn": {
     "frage": "P0",
     "enthaelt": "schulter"
    },
    "hinweis": "Nur Hinweis für den Rückruf, keine Regelwirkung.",
    "schritt": 4
   },
   {
    "id": "P3s",
    "bereich": "P",
    "text": "Wie hat sich der Schmerz in der Schulter in den letzten Wochen entwickelt?",
    "typ": "auswahl",
    "optionen": [
     {
      "wert": "besser",
      "text": "Besser geworden"
     },
     {
      "wert": "gleich",
      "text": "Gleich geblieben"
     },
     {
      "wert": "schlechter",
      "text": "Schlechter geworden"
     },
     {
      "wert": "weiss_nicht",
      "text": "Weiß nicht"
     }
    ],
    "pflicht": true,
    "quelle": "gegenleser",
    "nur_wenn": {
     "frage": "P0",
     "enthaelt": "schulter"
    },
    "hinweis": "Schlechter wird Orange (Rückruf). Weiß nicht hat keine Wirkung, die Antwort ist ein Hinweis für den Rückruf.",
    "wirkung": {
     "schlechter": {
      "orange": [
       "O13"
      ]
     }
    },
    "schritt": 4
   },
   {
    "id": "P1r",
    "bereich": "P",
    "text": "Wie fühlt sich der Schmerz im Rücken an?",
    "typ": "auswahl",
    "optionen": [
     {
      "wert": "stechend",
      "text": "Stechend oder einschießend"
     },
     {
      "wert": "dumpf",
      "text": "Dumpf oder drückend"
     },
     {
      "wert": "ziehend",
      "text": "Ziehend oder brennend"
     },
     {
      "wert": "weiss_nicht",
      "text": "Weiß nicht"
     }
    ],
    "pflicht": true,
    "quelle": "gegenleser",
    "nur_wenn": {
     "frage": "P0",
     "enthaelt": "ruecken"
    },
    "hinweis": "Nur Hinweis für den Rückruf, keine Regelwirkung, keine Diagnose.",
    "schritt": 4
   },
   {
    "id": "P2r",
    "bereich": "P",
    "text": "Wie groß ist die schmerzende Stelle im Rücken?",
    "typ": "auswahl",
    "optionen": [
     {
      "wert": "punktuell",
      "text": "Punktuell, mit einem Finger zeigbar"
     },
     {
      "wert": "breitflaechig",
      "text": "Breitflächig"
     },
     {
      "wert": "weiss_nicht",
      "text": "Weiß nicht"
     }
    ],
    "pflicht": true,
    "quelle": "gegenleser",
    "nur_wenn": {
     "frage": "P0",
     "enthaelt": "ruecken"
    },
    "hinweis": "Nur Hinweis für den Rückruf, keine Regelwirkung.",
    "schritt": 4
   },
   {
    "id": "P3r",
    "bereich": "P",
    "text": "Wie hat sich der Schmerz im Rücken in den letzten Wochen entwickelt?",
    "typ": "auswahl",
    "optionen": [
     {
      "wert": "besser",
      "text": "Besser geworden"
     },
     {
      "wert": "gleich",
      "text": "Gleich geblieben"
     },
     {
      "wert": "schlechter",
      "text": "Schlechter geworden"
     },
     {
      "wert": "weiss_nicht",
      "text": "Weiß nicht"
     }
    ],
    "pflicht": true,
    "quelle": "gegenleser",
    "nur_wenn": {
     "frage": "P0",
     "enthaelt": "ruecken"
    },
    "hinweis": "Schlechter wird Orange (Rückruf). Weiß nicht hat keine Wirkung, die Antwort ist ein Hinweis für den Rückruf.",
    "wirkung": {
     "schlechter": {
      "orange": [
       "O13"
      ]
     }
    },
    "schritt": 4
   },
   {
    "id": "P1h",
    "bereich": "P",
    "text": "Wie fühlt sich der Schmerz in der Hüfte an?",
    "typ": "auswahl",
    "optionen": [
     {
      "wert": "stechend",
      "text": "Stechend oder einschießend"
     },
     {
      "wert": "dumpf",
      "text": "Dumpf oder drückend"
     },
     {
      "wert": "ziehend",
      "text": "Ziehend oder brennend"
     },
     {
      "wert": "weiss_nicht",
      "text": "Weiß nicht"
     }
    ],
    "pflicht": true,
    "quelle": "gegenleser",
    "nur_wenn": {
     "frage": "P0",
     "enthaelt": "hueft"
    },
    "hinweis": "Nur Hinweis für den Rückruf, keine Regelwirkung, keine Diagnose.",
    "schritt": 4
   },
   {
    "id": "P2h",
    "bereich": "P",
    "text": "Wie groß ist die schmerzende Stelle in der Hüfte?",
    "typ": "auswahl",
    "optionen": [
     {
      "wert": "punktuell",
      "text": "Punktuell, mit einem Finger zeigbar"
     },
     {
      "wert": "breitflaechig",
      "text": "Breitflächig"
     },
     {
      "wert": "weiss_nicht",
      "text": "Weiß nicht"
     }
    ],
    "pflicht": true,
    "quelle": "gegenleser",
    "nur_wenn": {
     "frage": "P0",
     "enthaelt": "hueft"
    },
    "hinweis": "Nur Hinweis für den Rückruf, keine Regelwirkung.",
    "schritt": 4
   },
   {
    "id": "P3h",
    "bereich": "P",
    "text": "Wie hat sich der Schmerz in der Hüfte in den letzten Wochen entwickelt?",
    "typ": "auswahl",
    "optionen": [
     {
      "wert": "besser",
      "text": "Besser geworden"
     },
     {
      "wert": "gleich",
      "text": "Gleich geblieben"
     },
     {
      "wert": "schlechter",
      "text": "Schlechter geworden"
     },
     {
      "wert": "weiss_nicht",
      "text": "Weiß nicht"
     }
    ],
    "pflicht": true,
    "quelle": "gegenleser",
    "nur_wenn": {
     "frage": "P0",
     "enthaelt": "hueft"
    },
    "hinweis": "Schlechter wird Orange (Rückruf). Weiß nicht hat keine Wirkung, die Antwort ist ein Hinweis für den Rückruf.",
    "wirkung": {
     "schlechter": {
      "orange": [
       "O13"
      ]
     }
    },
    "schritt": 4
   },
   {
    "id": "P1k",
    "bereich": "P",
    "text": "Wie fühlt sich der Schmerz im Knie an?",
    "typ": "auswahl",
    "optionen": [
     {
      "wert": "stechend",
      "text": "Stechend oder einschießend"
     },
     {
      "wert": "dumpf",
      "text": "Dumpf oder drückend"
     },
     {
      "wert": "ziehend",
      "text": "Ziehend oder brennend"
     },
     {
      "wert": "weiss_nicht",
      "text": "Weiß nicht"
     }
    ],
    "pflicht": true,
    "quelle": "gegenleser",
    "nur_wenn": {
     "frage": "P0",
     "enthaelt": "knie"
    },
    "hinweis": "Nur Hinweis für den Rückruf, keine Regelwirkung, keine Diagnose.",
    "schritt": 4
   },
   {
    "id": "P2k",
    "bereich": "P",
    "text": "Wie groß ist die schmerzende Stelle im Knie?",
    "typ": "auswahl",
    "optionen": [
     {
      "wert": "punktuell",
      "text": "Punktuell, mit einem Finger zeigbar"
     },
     {
      "wert": "breitflaechig",
      "text": "Breitflächig"
     },
     {
      "wert": "weiss_nicht",
      "text": "Weiß nicht"
     }
    ],
    "pflicht": true,
    "quelle": "gegenleser",
    "nur_wenn": {
     "frage": "P0",
     "enthaelt": "knie"
    },
    "hinweis": "Nur Hinweis für den Rückruf, keine Regelwirkung.",
    "schritt": 4
   },
   {
    "id": "P3k",
    "bereich": "P",
    "text": "Wie hat sich der Schmerz im Knie in den letzten Wochen entwickelt?",
    "typ": "auswahl",
    "optionen": [
     {
      "wert": "besser",
      "text": "Besser geworden"
     },
     {
      "wert": "gleich",
      "text": "Gleich geblieben"
     },
     {
      "wert": "schlechter",
      "text": "Schlechter geworden"
     },
     {
      "wert": "weiss_nicht",
      "text": "Weiß nicht"
     }
    ],
    "pflicht": true,
    "quelle": "gegenleser",
    "nur_wenn": {
     "frage": "P0",
     "enthaelt": "knie"
    },
    "hinweis": "Schlechter wird Orange (Rückruf). Weiß nicht hat keine Wirkung, die Antwort ist ein Hinweis für den Rückruf.",
    "wirkung": {
     "schlechter": {
      "orange": [
       "O13"
      ]
     }
    },
    "schritt": 4
   },
   {
    "id": "P1w",
    "bereich": "P",
    "text": "Wie fühlt sich der Schmerz im Oberschenkel oder in der Wade an?",
    "typ": "auswahl",
    "optionen": [
     {
      "wert": "stechend",
      "text": "Stechend oder einschießend"
     },
     {
      "wert": "dumpf",
      "text": "Dumpf oder drückend"
     },
     {
      "wert": "ziehend",
      "text": "Ziehend oder brennend"
     },
     {
      "wert": "weiss_nicht",
      "text": "Weiß nicht"
     }
    ],
    "pflicht": true,
    "quelle": "gegenleser",
    "nur_wenn": {
     "frage": "P0",
     "enthaelt": "oberschenkel_wade"
    },
    "hinweis": "Nur Hinweis für den Rückruf, keine Regelwirkung, keine Diagnose.",
    "schritt": 4
   },
   {
    "id": "P2w",
    "bereich": "P",
    "text": "Wie groß ist die schmerzende Stelle im Oberschenkel oder in der Wade?",
    "typ": "auswahl",
    "optionen": [
     {
      "wert": "punktuell",
      "text": "Punktuell, mit einem Finger zeigbar"
     },
     {
      "wert": "breitflaechig",
      "text": "Breitflächig"
     },
     {
      "wert": "weiss_nicht",
      "text": "Weiß nicht"
     }
    ],
    "pflicht": true,
    "quelle": "gegenleser",
    "nur_wenn": {
     "frage": "P0",
     "enthaelt": "oberschenkel_wade"
    },
    "hinweis": "Nur Hinweis für den Rückruf, keine Regelwirkung.",
    "schritt": 4
   },
   {
    "id": "P3w",
    "bereich": "P",
    "text": "Wie hat sich der Schmerz im Oberschenkel oder in der Wade in den letzten Wochen entwickelt?",
    "typ": "auswahl",
    "optionen": [
     {
      "wert": "besser",
      "text": "Besser geworden"
     },
     {
      "wert": "gleich",
      "text": "Gleich geblieben"
     },
     {
      "wert": "schlechter",
      "text": "Schlechter geworden"
     },
     {
      "wert": "weiss_nicht",
      "text": "Weiß nicht"
     }
    ],
    "pflicht": true,
    "quelle": "gegenleser",
    "nur_wenn": {
     "frage": "P0",
     "enthaelt": "oberschenkel_wade"
    },
    "hinweis": "Schlechter wird Orange (Rückruf). Weiß nicht hat keine Wirkung, die Antwort ist ein Hinweis für den Rückruf.",
    "wirkung": {
     "schlechter": {
      "orange": [
       "O13"
      ]
     }
    },
    "schritt": 4
   },
   {
    "id": "P1f",
    "bereich": "P",
    "text": "Wie fühlt sich der Schmerz im Fuß oder Knöchel an?",
    "typ": "auswahl",
    "optionen": [
     {
      "wert": "stechend",
      "text": "Stechend oder einschießend"
     },
     {
      "wert": "dumpf",
      "text": "Dumpf oder drückend"
     },
     {
      "wert": "ziehend",
      "text": "Ziehend oder brennend"
     },
     {
      "wert": "weiss_nicht",
      "text": "Weiß nicht"
     }
    ],
    "pflicht": true,
    "quelle": "gegenleser",
    "nur_wenn": {
     "frage": "P0",
     "enthaelt": "fuss"
    },
    "hinweis": "Nur Hinweis für den Rückruf, keine Regelwirkung, keine Diagnose.",
    "schritt": 4
   },
   {
    "id": "P2f",
    "bereich": "P",
    "text": "Wie groß ist die schmerzende Stelle im Fuß oder Knöchel?",
    "typ": "auswahl",
    "optionen": [
     {
      "wert": "punktuell",
      "text": "Punktuell, mit einem Finger zeigbar"
     },
     {
      "wert": "breitflaechig",
      "text": "Breitflächig"
     },
     {
      "wert": "weiss_nicht",
      "text": "Weiß nicht"
     }
    ],
    "pflicht": true,
    "quelle": "gegenleser",
    "nur_wenn": {
     "frage": "P0",
     "enthaelt": "fuss"
    },
    "hinweis": "Nur Hinweis für den Rückruf, keine Regelwirkung.",
    "schritt": 4
   },
   {
    "id": "P3f",
    "bereich": "P",
    "text": "Wie hat sich der Schmerz im Fuß oder Knöchel in den letzten Wochen entwickelt?",
    "typ": "auswahl",
    "optionen": [
     {
      "wert": "besser",
      "text": "Besser geworden"
     },
     {
      "wert": "gleich",
      "text": "Gleich geblieben"
     },
     {
      "wert": "schlechter",
      "text": "Schlechter geworden"
     },
     {
      "wert": "weiss_nicht",
      "text": "Weiß nicht"
     }
    ],
    "pflicht": true,
    "quelle": "gegenleser",
    "nur_wenn": {
     "frage": "P0",
     "enthaelt": "fuss"
    },
    "hinweis": "Schlechter wird Orange (Rückruf). Weiß nicht hat keine Wirkung, die Antwort ist ein Hinweis für den Rückruf.",
    "wirkung": {
     "schlechter": {
      "orange": [
       "O13"
      ]
     }
    },
    "schritt": 4
   },
   {
    "id": "Z1",
    "bereich": "Z",
    "text": "Was fällt im Alltag schwer?",
    "typ": "mehrfach",
    "pflicht": true,
    "quelle": "entwurf3",
    "optionen": [
     {
      "wert": "aufstehen_sofa_stuhl",
      "text": "Aufstehen vom Sofa oder Stuhl"
     },
     {
      "wert": "hinsetzen",
      "text": "Hinsetzen"
     },
     {
      "wert": "treppen",
      "text": "Treppen"
     },
     {
      "wert": "schuhe_anziehen",
      "text": "Schuhe anziehen"
     },
     {
      "wert": "einkaufen",
      "text": "Einkaufen"
     },
     {
      "wert": "spazierengehen",
      "text": "Spazierengehen"
     },
     {
      "wert": "umdrehen_bett",
      "text": "Umdrehen im Bett"
     }
    ],
    "schritt": 5
   },
   {
    "id": "Z2",
    "bereich": "Z",
    "text": "Wo fühlt sich der Körper besonders steif an?",
    "typ": "mehrfach",
    "pflicht": true,
    "quelle": "entwurf3",
    "optionen": [
     {
      "wert": "nacken",
      "text": "Nacken"
     },
     {
      "wert": "schultern",
      "text": "Schultern"
     },
     {
      "wert": "ruecken",
      "text": "Rücken"
     },
     {
      "wert": "hueft",
      "text": "Hüfte"
     },
     {
      "wert": "knie",
      "text": "Knie"
     },
     {
      "wert": "fuesse",
      "text": "Füße"
     }
    ],
    "schritt": 5
   },
   {
    "id": "Z3",
    "bereich": "Z",
    "text": "Was soll am ehesten besser werden? (bis zu zwei)",
    "typ": "ziele",
    "pflicht": true,
    "quelle": "entwurf3",
    "hinweis": "Wird nur gefragt, wenn aus Z1 und Z2 mehr als ein Ziel möglich ist",
    "schritt": 5
   },
   {
    "id": "Z4",
    "bereich": "Z",
    "text": "Was würde die Person gerne wieder können, was im Moment nicht geht? Bitte keine Diagnosen oder Medikamentennamen eintragen.",
    "typ": "text",
    "pflicht": false,
    "quelle": "entwurf3",
    "schritt": 5
   }
  ]
 },
 "stufen": {
  "version": 3,
  "status": "entwurf_fachlich_nicht_geprueft",
  "regel": "Pro Baustein gilt die strengste zutreffende Stufe (1 vor 2 vor 3 vor 4). Globale Stufen gelten für jeden Baustein und können im Baustein nur verschärft, nie abgeschwächt werden.",
  "stufen": [
   {
    "stufe": 1,
    "name": "Kein automatischer Plan",
    "entscheidung": "manuell",
    "wirkung": "Lando entscheidet persönlich, ob und mit welchem Hinweis"
   },
   {
    "stufe": 2,
    "name": "Baustein gesperrt",
    "entscheidung": "gesperrt",
    "wirkung": "Plan wird ohne diese Übung erstellt, wenn möglich mit Ersatz"
   },
   {
    "stufe": 3,
    "name": "Warnstufe",
    "entscheidung": "warnung",
    "wirkung": "Baustein bleibt, mit Variante oder zusätzlichem Hinweis auf dem Planblatt"
   },
   {
    "stufe": 4,
    "name": "Nur Info",
    "entscheidung": "info",
    "wirkung": "Hinweis im Heft, keine Änderung am Plan"
   }
  ],
  "globale_hinweise": {
   "arztabsprache": "Empfehlung, kein Verbot. Einmal zentral im Fragebogen und auf dem Blatt in der Box, Bestätigung per Häkchen beim Kauf.",
   "im_audio": "Nur kurze Sicherheitssätze, keine Wiederholung der Arztempfehlung"
  },
  "regionen": {
   "nacken": "Nacken",
   "schulter": "Schulter",
   "ruecken": "Rücken",
   "hueft": "Hüfte",
   "knie": "Knie",
   "oberschenkel_wade": "Oberschenkel oder Wade",
   "fuss": "Fuß oder Knöchel"
  },
  "region_unklar": {
   "stufe": 3,
   "regel": "Hat jemand eine Körperregion angegeben und keine Folgefrage erklärt das Problem genauer, entsteht der Zustand region_unklar_<region>. Jeder Baustein, der diese Region in belastet_regionen nennt, bekommt mindestens Stufe 3. Ein Baustein darf strenger sein, nie milder. Unbekannt gilt nicht als unproblematisch.",
   "intern_hinweis": "Beschwerden in dieser Region angegeben, Genaueres nicht bekannt. Beim Rückruf klären."
  },
  "zustaende": {
   "thrombose_verdacht": {
    "name": "Verdacht auf Thrombose",
    "stufe_global": 1,
    "quelle": "Chat 02.10.2026"
   },
   "hueft_oder_knie_op_unter_3_monate": {
    "name": "Hüft oder Knie OP vor weniger als 3 Monaten",
    "stufe_global": 1,
    "quelle": "Chat 02.10.2026, Fragebogen R1"
   },
   "ruecken_schulter_op_unter_3_monate": {
    "name": "Rücken oder Schulter OP vor weniger als 3 Monaten",
    "stufe_global": 1,
    "quelle": "Fragebogen R1"
   },
   "ischias_notfallzeichen": {
    "name": "Taubheit im Schritt, Blasen oder Darmprobleme, zunehmende Lähmung im Bein",
    "stufe_global": 1,
    "quelle": "Chat 02.10.2026"
   },
   "neuer_unklarer_schwindel": {
    "name": "Neuer oder ungeklärter Schwindel",
    "stufe_global": 1,
    "quelle": "Fragebogen R2"
   },
   "brustschmerz_atemnot_belastung": {
    "name": "Brustschmerz, Engegefühl oder Atemnot bei leichter Belastung",
    "stufe_global": 1,
    "quelle": "Fragebogen R3"
   },
   "herzinfarkt_schlaganfall_herz_op_unter_6_monate": {
    "name": "Herzinfarkt, Schlaganfall oder Herz OP in den letzten 6 Monaten",
    "stufe_global": 1,
    "quelle": "Fragebogen R4"
   },
   "sturz_unter_12_monate_ungeklaert": {
    "name": "Sturz in den letzten 12 Monaten, nicht ärztlich abgeklärt",
    "stufe_global": 1,
    "quelle": "Fragebogen R5"
   },
   "knochenbruch_unter_3_monate": {
    "name": "Wirbelbruch oder anderer Knochenbruch in den letzten 3 Monaten",
    "stufe_global": 1,
    "quelle": "Fragebogen R6"
   },
   "starke_neue_schmerzen_in_ruhe": {
    "name": "Aktuell starke oder neue Schmerzen, auch in Ruhe",
    "stufe_global": 1,
    "quelle": "Fragebogen R7"
   },
   "arzt_riet_von_training_ab": {
    "name": "Arzt hat aktuell von Bewegung oder Training abgeraten",
    "stufe_global": 1,
    "quelle": "Fragebogen R8"
   },
   "kann_sich_im_bett_nicht_selbst_drehen": {
    "name": "Kann sich im Bett nicht selbstständig drehen oder aufsetzen",
    "stufe_global": 1,
    "quelle": "Fragebogen R9"
   },
   "osteoporose_ohne_freigabe": {
    "name": "Osteoporose oder früherer Wirbelbruch ohne ärztliche Freigabe",
    "stufe_global": 1,
    "quelle": "Fragebogen G3"
   },
   "hueftprothese_laenger_her": {
    "name": "Künstliches Hüftgelenk, OP länger als 3 Monate her",
    "quelle": "Fragebogen G1",
    "intern_hinweis": "Keine tiefe Hüftbeugung, kein Überkreuzen der Beine, keine Drehbewegungen der Hüfte. Einschränkungen des Operateurs erfragen."
   },
   "knieprothese_laenger_her": {
    "name": "Künstliches Kniegelenk",
    "quelle": "Fragebogen G2",
    "intern_hinweis": "Kein tiefes Beugen. Entwurf, Fachperson prüfen."
   },
   "osteoporose_mit_freigabe": {
    "name": "Osteoporose oder früherer Wirbelbruch, ärztliche Freigabe liegt vor",
    "quelle": "Fragebogen G3",
    "intern_hinweis": "Keine starke Rumpfbeugung, keine Wirbelsäulendrehung. Details der Freigabe klären."
   },
   "schulterprobleme": {
    "name": "Schulterprobleme oder Schulteroperation",
    "quelle": "Fragebogen G4",
    "intern_hinweis": "Keine Überkopf und Zugübungen an der Schulter, passende Bausteine prüfen."
   },
   "blutverduenner": {
    "name": "Blutverdünner",
    "quelle": "Fragebogen G5",
    "intern_hinweis": "Hinweis auf Verletzungs und Sturzvorsicht, kein Banddruck auf der Haut."
   },
   "diabetes_mit_unterzucker": {
    "name": "Diabetes mit Unterzuckerungen",
    "quelle": "Fragebogen G6",
    "intern_hinweis": "Nicht auf nüchternen Magen üben, Traubenzucker bereithalten."
   },
   "starke_sehschwaeche": {
    "name": "Starke Sehschwäche",
    "quelle": "Fragebogen G7",
    "intern_hinweis": "Audio zuerst, sehr große Schrift, Begleitperson empfehlen."
   },
   "schwindel_beim_hinlegen": {
    "name": "Schwindel beim Hinlegen oder Aufstehen, bekannt und abgeklärt",
    "quelle": "Fragebogen G8",
    "intern_hinweis": "Übergänge sehr langsam, Kopfteil erhöhen."
   },
   "herzschwaeche_reflux_atemnot_liegend": {
    "name": "Herzschwäche, Reflux oder Atemnot im Liegen",
    "quelle": "Fragebogen G9",
    "intern_hinweis": "Rückenlage nur mit erhöhtem Kopfteil."
   },
   "sturz_unter_12_monate_abgeklaert": {
    "name": "Sturz in den letzten 12 Monaten, ärztlich abgeklärt",
    "quelle": "Fragebogen G10",
    "intern_hinweis": "Start mit Sitz und Bettprogramm, feste Stütze."
   },
   "gelenkschmerz_bei_bewegung": {
    "name": "Gelenkprobleme mit Schmerz bei Bewegung",
    "quelle": "Fragebogen G11",
    "intern_hinweis": "Kleinere Bewegungsradien, Schmerzgrenze betonen."
   },
   "latexallergie": {
    "name": "Latexallergie",
    "quelle": "Fragebogen G12",
    "intern_hinweis": "Latexfreies Band beilegen."
   },
   "akuter_muskelfaserriss": {
    "name": "Akuter Muskelfaserriss",
    "quelle": "Chat 02.10.2026"
   },
   "ischias_beschwerden": {
    "name": "Ischias Beschwerden",
    "quelle": "Chat 02.10.2026"
   },
   "kniearthrose": {
    "name": "Kniearthrose",
    "quelle": "Chat 02.10.2026"
   },
   "rueckenprobleme_hohlkreuz": {
    "name": "Rückenprobleme mit empfindlichem Hohlkreuz",
    "quelle": "Chat 02.10.2026"
   },
   "krampfneigung": {
    "name": "Neigung zu Muskelkrämpfen",
    "quelle": "Chat 02.10.2026"
   },
   "standunsicher": {
    "name": "Fühlt sich beim Stehen oft unsicher",
    "quelle": "Fragebogen C4 (Dokument 13)",
    "intern_hinweis": "Für Steh und Gehübungen wichtig. Bei Dehnungen im Liegen nur Info."
   },
   "nackenprobleme": {
    "name": "Schmerzen oder Probleme beim Kopfdrehen",
    "quelle": "Fragebogen E11 (Vorschlag, Entwurf 4)"
   },
   "region_unklar_nacken": {
    "name": "Beschwerden im Nacken, Genaueres unklar",
    "quelle": "Regel region_unklar"
   },
   "region_unklar_schulter": {
    "name": "Beschwerden in der Schulter, Genaueres unklar",
    "quelle": "Regel region_unklar"
   },
   "region_unklar_ruecken": {
    "name": "Beschwerden im Rücken, Genaueres unklar",
    "quelle": "Regel region_unklar"
   },
   "region_unklar_hueft": {
    "name": "Beschwerden in der Hüfte, Genaueres unklar",
    "quelle": "Regel region_unklar"
   },
   "region_unklar_knie": {
    "name": "Beschwerden im Knie, Genaueres unklar",
    "quelle": "Regel region_unklar"
   },
   "region_unklar_oberschenkel_wade": {
    "name": "Beschwerden an Oberschenkel oder Wade, Genaueres unklar",
    "quelle": "Regel region_unklar"
   },
   "region_unklar_fuss": {
    "name": "Beschwerden an Fuß oder Knöchel, Genaueres unklar",
    "quelle": "Regel region_unklar"
   }
  },
  "lint": {
   "pflicht_vor_halten": [
    "schmerz"
   ],
   "pflicht_in_einleitung_bei_position": {
    "rueckenlage": [
     "schwindel"
    ],
    "seitenlage": [
     "schwindel"
    ]
   },
   "verbotene_muster": [
    "schmerzfrei",
    "schmerzlos",
    "therap",
    "behandl",
    "\\bheil(t|en|ung)\\b",
    "\\brehab",
    "\\breha\\b",
    "diagnos",
    "verhinder",
    "sturzrisiko",
    "sturz\\w*\\s+vor",
    "nie wieder",
    "garantier",
    "mit sicherheit",
    "\\blindert",
    "\\bersetzt\\b",
    "gegen\\s+(arthrose|osteoporose|rückenschmerz)"
   ],
   "fachbegriffe": [
    "hamstring",
    "quadrizeps",
    "beinbeuger",
    "beinstrecker",
    "hüftbeuger",
    "rotation",
    "pressatmung",
    "flexion",
    "extension",
    "adduktion",
    "abduktion",
    "faszie"
   ],
   "max_woerter_pro_satz": 25
  }
 },
 "bausteine": {
  "HB01": {
   "id": "HB01",
   "version": 4,
   "status": "entwurf_nicht_freigegeben",
   "titel": "Beinbeuger dehnen mit Theraband (Rückenlage)",
   "kategorie": "dehnen_hinten",
   "material": [
    "Theraband",
    "rutschfeste Unterlage"
   ],
   "position": "rueckenlage",
   "sprechtempo_woerter_pro_sekunde": 2,
   "haltezeit_gesamt_s": 90,
   "empfohlene_haeufigkeit": "alle 2 Tage",
   "belastet_regionen": [
    "hueft",
    "knie",
    "ruecken",
    "oberschenkel_wade"
   ],
   "bild_vorgaben": [
    "Ausgangslage",
    "Bandposition am Fuß",
    "Endposition (rechter Winkel)"
   ],
   "stufen_zuordnung": [
    {
     "zustand": "thrombose_verdacht",
     "stufe": 1,
     "hinweis": "Kein automatischer Plan, persönliche Entscheidung"
    },
    {
     "zustand": "hueft_oder_knie_op_unter_3_monate",
     "stufe": 1,
     "hinweis": "Nur mit Freigabe des Operateurs"
    },
    {
     "zustand": "hueftprothese_laenger_her",
     "stufe": 2,
     "hinweis": "Bausteine mit starker Hüftbeugung sperren, Rechter Winkel nicht als Ziel"
    },
    {
     "zustand": "akuter_muskelfaserriss",
     "stufe": 2,
     "hinweis": "Baustein sperren"
    },
    {
     "zustand": "ischias_beschwerden",
     "stufe": 3,
     "hinweis": "Variante mit leicht gebeugtem Knie, Hinweis auf Planblatt"
    },
    {
     "zustand": "ischias_notfallzeichen",
     "stufe": 1,
     "hinweis": "Taubheit im Schritt, Blasen oder Darmprobleme, zunehmende Lähmung: medizinischer Notfall"
    },
    {
     "zustand": "schwindel_beim_hinlegen",
     "stufe": 4,
     "hinweis": "Satz im Audio vorhanden"
    },
    {
     "zustand": "blutverduenner",
     "stufe": 4,
     "hinweis": "Info im Heft"
    }
   ],
   "teile": [
    {
     "id": "einleitung",
     "segmente": [
      {
       "typ": "sprechen",
       "text": "Wir dehnen jetzt die Rückseite des Oberschenkels. Du brauchst dein Theraband und eine rutschfeste Unterlage. Lege dich auf den Rücken, beide Beine sind ganz durchgestreckt. Wird dir beim Hinlegen schwindelig, bleib einen Moment liegen. Hält es an, beende die Übung.",
       "soll_dauer_s": 20
      },
      {
       "typ": "pause",
       "soll_dauer_s": 5
      }
     ]
    },
    {
     "id": "block_rechts",
     "seite": "rechts",
     "segmente": [
      {
       "typ": "sprechen",
       "text": "Lege das Band unter die Fußsohle deines rechten Fußes, in die Mitte zwischen Ferse und Fußballen. Etwas näher am Fußballen sitzt es am besten. Halte beide Enden fest in den Händen.",
       "soll_dauer_s": 15.5
      },
      {
       "typ": "pause",
       "soll_dauer_s": 4
      },
      {
       "typ": "sprechen",
       "text": "Hebe das Bein mit dem Band nach oben. Das Knie bleibt dabei durchgestreckt. Ziehe das Bein, bis du ein Ziehen hinter dem Oberschenkel spürst. Ein rechter Winkel ist das Ziel.",
       "soll_dauer_s": 15
      },
      {
       "typ": "pause",
       "soll_dauer_s": 5
      },
      {
       "typ": "sprechen",
       "text": "Das Ziehen im Muskel ist unangenehm, und das ist richtig so. Auf einer Skala von null bis zehn sollte es höchstens eine Zwei sein. Schmerz in der Hüfte oder im Knie ist ein Warnsignal. Dann lass sofort locker.",
       "soll_dauer_s": 19
      },
      {
       "typ": "pause",
       "soll_dauer_s": 3
      },
      {
       "typ": "sprechen",
       "text": "Jetzt halten wir neunzig Sekunden. Atme ruhig und gleichmäßig weiter.",
       "soll_dauer_s": 4.5
      },
      {
       "typ": "halten",
       "soll_dauer_s": 90,
       "cues": [
        {
         "bei_s": 10,
         "text": "Prüfe dein Knie. Ist es durchgestreckt?"
        },
        {
         "bei_s": 22,
         "text": "Ziehe die Zehenspitzen zu dir heran. Das verstärkt die Dehnung."
        },
        {
         "bei_s": 30,
         "text": "Noch sechzig Sekunden."
        },
        {
         "bei_s": 40,
         "text": "Liegt dein anderes Bein gestreckt auf dem Boden?"
        },
        {
         "bei_s": 50,
         "text": "Knie noch durchgestreckt? Lässt die Dehnung nach? Dann ziehe das Bein ein kleines Stück näher."
        },
        {
         "bei_s": 60,
         "text": "Noch dreißig Sekunden. Atme ruhig weiter."
        },
        {
         "bei_s": 70,
         "text": "Knie noch durchgestreckt? Zehenspitzen noch bei dir?"
        },
        {
         "bei_s": 80,
         "text": "Noch zehn Sekunden."
        }
       ]
      },
      {
       "typ": "sprechen",
       "text": "Senke das Bein langsam und lege es entspannt ab.",
       "soll_dauer_s": 4.5
      },
      {
       "typ": "pause",
       "soll_dauer_s": 8
      }
     ]
    },
    {
     "id": "wechsel",
     "segmente": [
      {
       "typ": "sprechen",
       "text": "Jetzt das andere Bein.",
       "soll_dauer_s": 2
      },
      {
       "typ": "pause",
       "soll_dauer_s": 5
      }
     ]
    },
    {
     "id": "block_links",
     "seite": "links",
     "hinweis": "Gleicher Text wie block_rechts mit 'linken Fußes', zusätzlicher Cue bei 85 s",
     "segmente": [
      {
       "typ": "sprechen",
       "text": "Lege das Band unter die Fußsohle deines linken Fußes, in die Mitte zwischen Ferse und Fußballen. Etwas näher am Fußballen sitzt es am besten. Halte beide Enden fest in den Händen.",
       "soll_dauer_s": 15.5
      },
      {
       "typ": "pause",
       "soll_dauer_s": 4
      },
      {
       "typ": "sprechen",
       "text": "Hebe das Bein mit dem Band nach oben. Das Knie bleibt dabei durchgestreckt. Ziehe das Bein, bis du ein Ziehen hinter dem Oberschenkel spürst. Ein rechter Winkel ist das Ziel.",
       "soll_dauer_s": 15
      },
      {
       "typ": "pause",
       "soll_dauer_s": 5
      },
      {
       "typ": "sprechen",
       "text": "Das Ziehen im Muskel ist unangenehm, und das ist richtig so. Auf einer Skala von null bis zehn sollte es höchstens eine Zwei sein. Schmerz in der Hüfte oder im Knie ist ein Warnsignal. Dann lass sofort locker.",
       "soll_dauer_s": 19
      },
      {
       "typ": "pause",
       "soll_dauer_s": 3
      },
      {
       "typ": "sprechen",
       "text": "Jetzt halten wir neunzig Sekunden. Atme ruhig und gleichmäßig weiter.",
       "soll_dauer_s": 4.5
      },
      {
       "typ": "halten",
       "soll_dauer_s": 90,
       "cues": [
        {
         "bei_s": 10,
         "text": "Prüfe dein Knie. Ist es durchgestreckt?"
        },
        {
         "bei_s": 22,
         "text": "Ziehe die Zehenspitzen zu dir heran. Das verstärkt die Dehnung."
        },
        {
         "bei_s": 30,
         "text": "Noch sechzig Sekunden."
        },
        {
         "bei_s": 40,
         "text": "Liegt dein anderes Bein gestreckt auf dem Boden?"
        },
        {
         "bei_s": 50,
         "text": "Knie noch durchgestreckt? Lässt die Dehnung nach? Dann ziehe das Bein ein kleines Stück näher."
        },
        {
         "bei_s": 60,
         "text": "Noch dreißig Sekunden. Atme ruhig weiter."
        },
        {
         "bei_s": 70,
         "text": "Knie noch durchgestreckt? Zehenspitzen noch bei dir?"
        },
        {
         "bei_s": 80,
         "text": "Noch zehn Sekunden."
        },
        {
         "bei_s": 85,
         "text": "Du hast es gleich geschafft."
        }
       ]
      },
      {
       "typ": "sprechen",
       "text": "Senke das Bein langsam und lege es entspannt ab.",
       "soll_dauer_s": 4.5
      },
      {
       "typ": "pause",
       "soll_dauer_s": 8
      }
     ]
    },
    {
     "id": "schluss",
     "segmente": [
      {
       "typ": "sprechen",
       "text": "Geschafft. Bewege beide Beine locker und schüttle sie kurz aus. Setz dich dann langsam auf.",
       "soll_dauer_s": 7.5
      }
     ]
    }
   ],
   "soll_gesamtdauer_s": 376.5,
   "toleranz_prozent": 10
  },
  "HB02": {
   "id": "HB02",
   "version": 2,
   "status": "entwurf_nicht_freigegeben",
   "titel": "Beinstrecker dehnen mit Theraband (Seitenlage)",
   "kategorie": "dehnen_vorne",
   "material": [
    "Theraband (optional)",
    "rutschfeste Unterlage"
   ],
   "position": "seitenlage",
   "sprechtempo_woerter_pro_sekunde": 2,
   "haltezeit_gesamt_s": 90,
   "empfohlene_haeufigkeit": "alle 2 Tage",
   "belastet_regionen": [
    "hueft",
    "knie",
    "ruecken",
    "oberschenkel_wade"
   ],
   "bild_vorgaben": [
    "Seitenlage mit gerader Linie",
    "Band am Fußgelenk",
    "Endposition Ferse am Gesäß"
   ],
   "stufen_zuordnung": [
    {
     "zustand": "thrombose_verdacht",
     "stufe": 1,
     "hinweis": "Kein automatischer Plan, persönliche Entscheidung"
    },
    {
     "zustand": "hueft_oder_knie_op_unter_3_monate",
     "stufe": 1,
     "hinweis": "Nur mit Freigabe des Operateurs"
    },
    {
     "zustand": "akuter_muskelfaserriss",
     "stufe": 2,
     "hinweis": "Baustein sperren"
    },
    {
     "zustand": "hueftprothese_laenger_her",
     "stufe": 3,
     "hinweis": "Optionalen Hüft Cue weglassen, Ferse nur so weit wie angenehm, Kniebeugung nie erzwingen"
    },
    {
     "zustand": "knieprothese_laenger_her",
     "stufe": 3,
     "hinweis": "Optionalen Hüft Cue weglassen, Ferse nur so weit wie angenehm, Kniebeugung nie erzwingen"
    },
    {
     "zustand": "kniearthrose",
     "stufe": 3,
     "hinweis": "Optionalen Hüft Cue weglassen, Beugung nur so weit wie schmerzfrei"
    },
    {
     "zustand": "rueckenprobleme_hohlkreuz",
     "stufe": 3,
     "hinweis": "Hinweis auf leicht angespannten Bauch betonen"
    },
    {
     "zustand": "krampfneigung",
     "stufe": 4,
     "hinweis": "Info im Heft"
    },
    {
     "zustand": "blutverduenner",
     "stufe": 4,
     "hinweis": "Info im Heft"
    }
   ],
   "teile": [
    {
     "id": "einleitung",
     "segmente": [
      {
       "typ": "sprechen",
       "text": "Wir dehnen jetzt die Vorderseite des Oberschenkels. Du brauchst dein Theraband und eine rutschfeste Unterlage. Wird dir beim Hinlegen schwindelig, bleib einen Moment liegen. Hält es an, beende die Übung.",
       "soll_dauer_s": 15
      },
      {
       "typ": "pause",
       "soll_dauer_s": 4
      }
     ]
    },
    {
     "id": "block_rechts",
     "seite": "rechts",
     "segmente": [
      {
       "typ": "sprechen",
       "text": "Lege dich auf die linke Seite. Dein Körper bildet eine gerade Linie von Kopf bis zu den Füßen. Der Kopf ruht auf deinem Arm oder einem Kissen. Das untere Bein ist leicht angewinkelt, damit du stabil liegst.",
       "soll_dauer_s": 17.5
      },
      {
       "typ": "pause",
       "soll_dauer_s": 4
      },
      {
       "typ": "sprechen",
       "text": "Lege das Band um das Fußgelenk deines rechten Fußes, direkt über dem Knöchel. Halte beide Enden in der rechten Hand. Beuge das rechte Knie und ziehe die Ferse Richtung Gesäß. Kommst du mit der Hand schon ans Fußgelenk, brauchst du kein Band. Dann halte es einfach direkt.",
       "soll_dauer_s": 23
      },
      {
       "typ": "pause",
       "soll_dauer_s": 4
      },
      {
       "typ": "sprechen",
       "text": "Das Knie bleibt auf Höhe des anderen Knies. Der Bauch ist leicht angespannt, damit du kein Hohlkreuz machst. Du spürst ein Ziehen vorne am Oberschenkel.",
       "soll_dauer_s": 12.5
      },
      {
       "typ": "pause",
       "soll_dauer_s": 3
      },
      {
       "typ": "sprechen",
       "text": "Das Ziehen im Muskel ist unangenehm, und das ist richtig so. Auf einer Skala von null bis zehn sollte es höchstens eine Zwei sein. Schmerz in der Hüfte oder im Knie ist ein Warnsignal. Dann lass sofort locker.",
       "soll_dauer_s": 19.5
      },
      {
       "typ": "pause",
       "soll_dauer_s": 3
      },
      {
       "typ": "sprechen",
       "text": "Jetzt halten wir neunzig Sekunden. Atme ruhig und gleichmäßig weiter.",
       "soll_dauer_s": 4.5
      },
      {
       "typ": "halten",
       "soll_dauer_s": 90,
       "cues": [
        {
         "bei_s": 10,
         "text": "Prüfe deine Haltung. Liegst du gerade, und ist das Hohlkreuz weg?"
        },
        {
         "bei_s": 22,
         "text": "Ziehe die Ferse ein Stück näher, bis du das Ziehen vorne spürst."
        },
        {
         "bei_s": 30,
         "text": "Noch sechzig Sekunden."
        },
        {
         "bei_s": 40,
         "text": "Bleibt dein Knie auf Höhe des anderen Knies? Ist dein Körper noch eine gerade Linie?"
        },
        {
         "bei_s": 50,
         "text": "Bauch noch leicht angespannt? Lässt die Dehnung nach? Dann ziehe die Ferse ein Stück näher."
        },
        {
         "bei_s": 60,
         "text": "Noch dreißig Sekunden. Atme ruhig weiter."
        },
        {
         "bei_s": 65,
         "optional": true,
         "ausschluss_bei": [
          "hueftprothese_laenger_her",
          "knieprothese_laenger_her",
          "kniearthrose"
         ],
         "text": "Ferse am Gesäß? Dann schiebe die Hüfte ein Stück nach vorne, wenn es angenehm ist."
        },
        {
         "bei_s": 75,
         "text": "Kein Hohlkreuz? Knie auf Höhe des anderen?"
        },
        {
         "bei_s": 80,
         "text": "Noch zehn Sekunden."
        }
       ]
      },
      {
       "typ": "sprechen",
       "text": "Lasse das Band los und strecke das Bein langsam aus.",
       "soll_dauer_s": 4.5
      },
      {
       "typ": "pause",
       "soll_dauer_s": 8
      }
     ]
    },
    {
     "id": "wechsel",
     "segmente": [
      {
       "typ": "sprechen",
       "text": "Jetzt drehe dich vorsichtig auf die andere Seite.",
       "soll_dauer_s": 4
      },
      {
       "typ": "pause",
       "soll_dauer_s": 10
      }
     ]
    },
    {
     "id": "block_links",
     "seite": "links",
     "segmente": [
      {
       "typ": "sprechen",
       "text": "Lege dich auf die rechte Seite. Dein Körper bildet eine gerade Linie von Kopf bis zu den Füßen. Der Kopf ruht auf deinem Arm oder einem Kissen. Das untere Bein ist leicht angewinkelt, damit du stabil liegst.",
       "soll_dauer_s": 17.5
      },
      {
       "typ": "pause",
       "soll_dauer_s": 4
      },
      {
       "typ": "sprechen",
       "text": "Lege das Band um das Fußgelenk deines linken Fußes, direkt über dem Knöchel. Halte beide Enden in der linken Hand. Beuge das linke Knie und ziehe die Ferse Richtung Gesäß. Kommst du mit der Hand schon ans Fußgelenk, brauchst du kein Band. Dann halte es einfach direkt.",
       "soll_dauer_s": 23
      },
      {
       "typ": "pause",
       "soll_dauer_s": 4
      },
      {
       "typ": "sprechen",
       "text": "Das Knie bleibt auf Höhe des anderen Knies. Der Bauch ist leicht angespannt, damit du kein Hohlkreuz machst. Du spürst ein Ziehen vorne am Oberschenkel.",
       "soll_dauer_s": 12.5
      },
      {
       "typ": "pause",
       "soll_dauer_s": 3
      },
      {
       "typ": "sprechen",
       "text": "Das Ziehen im Muskel ist unangenehm, und das ist richtig so. Auf einer Skala von null bis zehn sollte es höchstens eine Zwei sein. Schmerz in der Hüfte oder im Knie ist ein Warnsignal. Dann lass sofort locker.",
       "soll_dauer_s": 19.5
      },
      {
       "typ": "pause",
       "soll_dauer_s": 3
      },
      {
       "typ": "sprechen",
       "text": "Jetzt halten wir neunzig Sekunden. Atme ruhig und gleichmäßig weiter.",
       "soll_dauer_s": 4.5
      },
      {
       "typ": "halten",
       "soll_dauer_s": 90,
       "cues": [
        {
         "bei_s": 10,
         "text": "Prüfe deine Haltung. Liegst du gerade, und ist das Hohlkreuz weg?"
        },
        {
         "bei_s": 22,
         "text": "Ziehe die Ferse ein Stück näher, bis du das Ziehen vorne spürst."
        },
        {
         "bei_s": 30,
         "text": "Noch sechzig Sekunden."
        },
        {
         "bei_s": 40,
         "text": "Bleibt dein Knie auf Höhe des anderen Knies? Ist dein Körper noch eine gerade Linie?"
        },
        {
         "bei_s": 50,
         "text": "Bauch noch leicht angespannt? Lässt die Dehnung nach? Dann ziehe die Ferse ein Stück näher."
        },
        {
         "bei_s": 60,
         "text": "Noch dreißig Sekunden. Atme ruhig weiter."
        },
        {
         "bei_s": 65,
         "optional": true,
         "ausschluss_bei": [
          "hueftprothese_laenger_her",
          "knieprothese_laenger_her",
          "kniearthrose"
         ],
         "text": "Ferse am Gesäß? Dann schiebe die Hüfte ein Stück nach vorne, wenn es angenehm ist."
        },
        {
         "bei_s": 75,
         "text": "Kein Hohlkreuz? Knie auf Höhe des anderen?"
        },
        {
         "bei_s": 80,
         "text": "Noch zehn Sekunden."
        },
        {
         "bei_s": 85,
         "text": "Du hast es gleich geschafft."
        }
       ]
      },
      {
       "typ": "sprechen",
       "text": "Lasse das Band los und strecke das Bein langsam aus.",
       "soll_dauer_s": 4.5
      },
      {
       "typ": "pause",
       "soll_dauer_s": 8
      }
     ]
    },
    {
     "id": "schluss",
     "segmente": [
      {
       "typ": "sprechen",
       "text": "Geschafft. Rolle dich auf den Rücken, bewege die Beine locker und setz dich dann langsam auf.",
       "soll_dauer_s": 8
      }
     ]
    }
   ],
   "toleranz_prozent": 10,
   "soll_gesamtdauer_s": 428.0
  },
  "KU01": {
   "id": "KU01",
   "version": 1,
   "status": "entwurf_nicht_freigegeben",
   "titel": "Aufstehen vom Stuhl (Kraft, 2 Sätze mit je 10 Wiederholungen)",
   "kategorie": "kraft_beine",
   "material": [
    "Stuhl mit Lehne"
   ],
   "position": "sitzen_stehen",
   "sprechtempo_woerter_pro_sekunde": 2,
   "haltezeit_gesamt_s": 0,
   "empfohlene_haeufigkeit": "offen (täglich oder alle 2 Tage, OP-B18)",
   "belastet_regionen": [
    "hueft",
    "knie",
    "oberschenkel_wade"
   ],
   "_hinweis": "Vorschlag des Systemchats. belastet_regionen und stufen_zuordnung sind NICHT fachlich geprüft, die Zuordnung ist bewusst nur das Nötigste. Textquelle: Dokument 18, KÜ-01. Der Satz zum Schmerzhinweis wurde ergänzt, im Skript fehlte er.",
   "bild_vorgaben": [
    "Ausgangslage sitzend",
    "Stehende Position"
   ],
   "stufen_zuordnung": [
    {
     "zustand": "akuter_muskelfaserriss",
     "stufe": 2,
     "hinweis": "Baustein sperren (Vorschlag, nicht fachlich geprüft)"
    },
    {
     "zustand": "standunsicher",
     "stufe": 3,
     "hinweis": "Festhalten betonen, Hinweis auf dem Planblatt (Vorschlag)"
    }
   ],
   "teile": [
    {
     "id": "satz_1",
     "segmente": [
      {
       "typ": "sprechen",
       "text": "Wir machen jetzt das Aufstehen vom Stuhl. Das kräftigt deine Beine. Setz dich aufrecht auf einen Stuhl mit Lehne. Die Füße stehen flach auf dem Boden, etwa hüftbreit auseinander. Bei Schmerz hör sofort auf.",
       "soll_dauer_s": 17.0
      },
      {
       "typ": "pause",
       "soll_dauer_s": 4
      },
      {
       "typ": "sprechen",
       "text": "Neige den Oberkörper leicht nach vorn und komm mit den Beinen hoch. Steh kurz aufrecht, dann setz dich langsam wieder hin. Mach nur, was du schaffst. Wenn die Lehne helfen soll, nutz sie. Los geht's.",
       "soll_dauer_s": 17.5
      },
      {
       "typ": "pause",
       "soll_dauer_s": 2
      },
      {
       "typ": "wiederholungen",
       "modus": "zaehlen",
       "anzahl": 10,
       "takt_s": 7,
       "soll_dauer_s": 70
      },
      {
       "typ": "sprechen",
       "text": "Super. Bleib sitzen und atme ruhig.",
       "soll_dauer_s": 3.0
      },
      {
       "typ": "satzpause",
       "soll_dauer_s": 60,
       "cues": [
        {
         "bei_s": 20,
         "text": "Atme ruhig. Du machst das gut."
        },
        {
         "bei_s": 50,
         "text": "Gleich noch ein Satz. Du schaffst das."
        }
       ]
      }
     ]
    },
    {
     "id": "satz_2",
     "segmente": [
      {
       "typ": "sprechen",
       "text": "Los geht's mit dem zweiten Satz. Bei Schmerz hör sofort auf.",
       "soll_dauer_s": 5.5
      },
      {
       "typ": "pause",
       "soll_dauer_s": 2
      },
      {
       "typ": "wiederholungen",
       "modus": "zaehlen",
       "anzahl": 10,
       "takt_s": 7,
       "soll_dauer_s": 70
      },
      {
       "typ": "sprechen",
       "text": "Super gemacht. Bleib sitzen und atme durch.",
       "soll_dauer_s": 3.5
      }
     ]
    }
   ],
   "soll_gesamtdauer_s": 254.5,
   "toleranz_prozent": 10
  },
  "KU02": {
   "id": "KU02",
   "version": 1,
   "status": "entwurf_nicht_freigegeben",
   "titel": "Knie heben im Stehen (Marsch, Kraft, 2 Sätze mit je 10 Wiederholungen)",
   "kategorie": "kraft_beine",
   "material": [
    "Stuhl oder feste Kante zum Festhalten"
   ],
   "position": "sitzen_stehen",
   "sprechtempo_woerter_pro_sekunde": 2,
   "haltezeit_gesamt_s": 0,
   "empfohlene_haeufigkeit": "offen (täglich oder alle 2 Tage, OP-B18)",
   "belastet_regionen": [
    "hueft",
    "knie",
    "oberschenkel_wade",
    "fuss"
   ],
   "_hinweis": "Vorschlag des Systemchats aus Dokument 18. belastet_regionen und stufen_zuordnung sind NICHT fachlich geprüft und bewusst knapp. Der Satz zum Schmerzhinweis ist ergänzt, im Skript fehlte er. Entwurf, noch nicht aufgenommen.",
   "bild_vorgaben": [
    "Ausgangslage",
    "Endposition"
   ],
   "stufen_zuordnung": [
    {
     "zustand": "akuter_muskelfaserriss",
     "stufe": 2,
     "hinweis": "Baustein sperren (Vorschlag)"
    },
    {
     "zustand": "standunsicher",
     "stufe": 3,
     "hinweis": "Festhalten betonen, Hinweis auf dem Planblatt (Vorschlag)"
    }
   ],
   "teile": [
    {
     "id": "satz_1",
     "segmente": [
      {
       "typ": "sprechen",
       "text": "Wir machen jetzt den Marsch im Stehen. Stell dich aufrecht hin und halte dich an der Lehne eines Stuhls oder an einer Kante fest. Schultern locker, Kopf gerade. Bei Schmerz hör sofort auf.",
       "soll_dauer_s": 16.5
      },
      {
       "typ": "pause",
       "soll_dauer_s": 4
      },
      {
       "typ": "sprechen",
       "text": "Heb abwechselnd die Knie, nur so hoch, wie es angenehm ist. Mach nur, was du schaffst. Halt dich gut fest. Los geht's.",
       "soll_dauer_s": 11.0
      },
      {
       "typ": "pause",
       "soll_dauer_s": 2
      },
      {
       "typ": "wiederholungen",
       "modus": "zaehlen",
       "anzahl": 10,
       "takt_s": 7,
       "soll_dauer_s": 70
      },
      {
       "typ": "sprechen",
       "text": "Sehr gut. Bleib stehen und atme ruhig.",
       "soll_dauer_s": 3.5
      },
      {
       "typ": "satzpause",
       "soll_dauer_s": 60,
       "cues": [
        {
         "bei_s": 20,
         "text": "Atme ruhig. Du machst das gut."
        },
        {
         "bei_s": 50,
         "text": "Gleich noch ein Satz. Du schaffst das."
        }
       ]
      }
     ]
    },
    {
     "id": "satz_2",
     "segmente": [
      {
       "typ": "sprechen",
       "text": "Los geht's mit dem zweiten Satz. Bei Schmerz hör sofort auf.",
       "soll_dauer_s": 5.5
      },
      {
       "typ": "pause",
       "soll_dauer_s": 2
      },
      {
       "typ": "wiederholungen",
       "modus": "zaehlen",
       "anzahl": 10,
       "takt_s": 7,
       "soll_dauer_s": 70
      },
      {
       "typ": "sprechen",
       "text": "Sehr gut. Setz dich hin und atme durch.",
       "soll_dauer_s": 4.0
      }
     ]
    }
   ],
   "toleranz_prozent": 10,
   "soll_gesamtdauer_s": 248.5
  },
  "KU03": {
   "id": "KU03",
   "version": 1,
   "status": "entwurf_nicht_freigegeben",
   "titel": "Kniebeugen (Kraft, 2 Sätze mit bis zu zehn Wiederholungen)",
   "kategorie": "kraft_beine",
   "material": [
    "Stuhl oder feste Stütze zum Festhalten (optional)"
   ],
   "position": "sitzen_stehen",
   "sprechtempo_woerter_pro_sekunde": 2,
   "haltezeit_gesamt_s": 0,
   "empfohlene_haeufigkeit": "offen (täglich oder alle 2 Tage, OP-B18)",
   "belastet_regionen": [
    "hueft",
    "knie",
    "ruecken",
    "oberschenkel_wade"
   ],
   "_hinweis": "Vorschlag des Systemchats aus Dokument 18. belastet_regionen und stufen_zuordnung sind NICHT fachlich geprüft und bewusst knapp. Der Satz zum Schmerzhinweis ist ergänzt, im Skript fehlte er. Entwurf, noch nicht aufgenommen.",
   "bild_vorgaben": [
    "Ausgangslage",
    "Endposition"
   ],
   "stufen_zuordnung": [
    {
     "zustand": "akuter_muskelfaserriss",
     "stufe": 2,
     "hinweis": "Baustein sperren (Vorschlag)"
    },
    {
     "zustand": "standunsicher",
     "stufe": 3,
     "hinweis": "Festhalten betonen, Hinweis auf dem Planblatt (Vorschlag)"
    }
   ],
   "teile": [
    {
     "id": "satz_1",
     "segmente": [
      {
       "typ": "sprechen",
       "text": "Wir machen jetzt Kniebeugen. Stell dich aufrecht hin, die Füße etwa schulterbreit auseinander. Wenn du magst, halte dich an einer Lehne fest. Bei Schmerz hör sofort auf.",
       "soll_dauer_s": 13.5
      },
      {
       "typ": "pause",
       "soll_dauer_s": 4
      },
      {
       "typ": "sprechen",
       "text": "Beuge die Knie und schieb das Gesäß nach hinten, als würdest du dich auf einen Stuhl setzen. Geh nur so tief, wie du dich angenehm wieder hochdrücken kannst. Mach nur, wie viele du schaffst. Los geht's.",
       "soll_dauer_s": 18.0
      },
      {
       "typ": "pause",
       "soll_dauer_s": 2
      },
      {
       "typ": "wiederholungen",
       "modus": "zaehlen",
       "anzahl": 10,
       "takt_s": 7,
       "soll_dauer_s": 70,
       "cues": [
        {
         "bei_s": 17,
         "text": "Atme dabei."
        },
        {
         "bei_s": 38,
         "text": "Gesäß nach hinten."
        }
       ]
      },
      {
       "typ": "sprechen",
       "text": "Sehr gut. Bleib stehen und atme ruhig.",
       "soll_dauer_s": 3.5
      },
      {
       "typ": "satzpause",
       "soll_dauer_s": 60,
       "cues": [
        {
         "bei_s": 20,
         "text": "Atme ruhig. Du machst das gut."
        },
        {
         "bei_s": 50,
         "text": "Gleich noch ein Satz. Du schaffst das."
        }
       ]
      }
     ]
    },
    {
     "id": "satz_2",
     "segmente": [
      {
       "typ": "sprechen",
       "text": "Los geht's mit dem zweiten Satz. Bei Schmerz hör sofort auf.",
       "soll_dauer_s": 5.5
      },
      {
       "typ": "pause",
       "soll_dauer_s": 2
      },
      {
       "typ": "wiederholungen",
       "modus": "zaehlen",
       "anzahl": 10,
       "takt_s": 7,
       "soll_dauer_s": 70,
       "cues": [
        {
         "bei_s": 17,
         "text": "Atme dabei."
        },
        {
         "bei_s": 38,
         "text": "Gesäß nach hinten."
        }
       ]
      },
      {
       "typ": "sprechen",
       "text": "Sehr gut. Setz dich hin und atme durch.",
       "soll_dauer_s": 4.0
      }
     ]
    }
   ],
   "toleranz_prozent": 10,
   "soll_gesamtdauer_s": 252.5
  },
  "KU04": {
   "id": "KU04",
   "version": 1,
   "status": "entwurf_nicht_freigegeben",
   "titel": "Wandliegestütze (Kraft, 2 Sätze mit bis zu zehn Wiederholungen)",
   "kategorie": "kraft_arme",
   "material": [
    "freie Wand"
   ],
   "position": "sitzen_stehen",
   "sprechtempo_woerter_pro_sekunde": 2,
   "haltezeit_gesamt_s": 0,
   "empfohlene_haeufigkeit": "offen (täglich oder alle 2 Tage, OP-B18)",
   "belastet_regionen": [
    "schulter",
    "ruecken"
   ],
   "_hinweis": "Vorschlag des Systemchats aus Dokument 18. belastet_regionen und stufen_zuordnung sind NICHT fachlich geprüft und bewusst knapp. Der Satz zum Schmerzhinweis ist ergänzt, im Skript fehlte er. Entwurf, noch nicht aufgenommen.",
   "bild_vorgaben": [
    "Ausgangslage",
    "Endposition"
   ],
   "stufen_zuordnung": [
    {
     "zustand": "akuter_muskelfaserriss",
     "stufe": 2,
     "hinweis": "Baustein sperren (Vorschlag)"
    },
    {
     "zustand": "standunsicher",
     "stufe": 3,
     "hinweis": "Festhalten betonen, Hinweis auf dem Planblatt (Vorschlag)"
    },
    {
     "zustand": "schulterprobleme",
     "stufe": 3,
     "hinweis": "Hinweis auf dem Planblatt (Vorschlag)"
    }
   ],
   "teile": [
    {
     "id": "satz_1",
     "segmente": [
      {
       "typ": "sprechen",
       "text": "Wir machen jetzt Liegestütze an der Wand. Stell dich aufrecht vor eine Wand und lege die Hände auf Schulterhöhe gegen die Wand. Steh so nah oder so weit weg, wie du dich sicher fühlst. Bei Schmerz hör sofort auf.",
       "soll_dauer_s": 19.5
      },
      {
       "typ": "pause",
       "soll_dauer_s": 4
      },
      {
       "typ": "sprechen",
       "text": "Dein Körper bleibt eine gerade Linie von Kopf bis Fersen, der Bauch ist leicht angespannt. Beuge die Arme, bis die Stirn zur Wand kommt, dann strecke sie wieder. Mach nur, wie viele du schaffst. Los geht's.",
       "soll_dauer_s": 18.0
      },
      {
       "typ": "pause",
       "soll_dauer_s": 2
      },
      {
       "typ": "wiederholungen",
       "modus": "zaehlen",
       "anzahl": 10,
       "takt_s": 7,
       "soll_dauer_s": 70,
       "cues": [
        {
         "bei_s": 17,
         "text": "Atme dabei."
        },
        {
         "bei_s": 38,
         "text": "Ellenbogen nah am Körper."
        }
       ]
      },
      {
       "typ": "sprechen",
       "text": "Sehr gut. Atme durch.",
       "soll_dauer_s": 2.0
      },
      {
       "typ": "satzpause",
       "soll_dauer_s": 60,
       "cues": [
        {
         "bei_s": 20,
         "text": "Atme ruhig. Du machst das gut."
        },
        {
         "bei_s": 50,
         "text": "Gleich noch ein Satz. Du schaffst das."
        }
       ]
      }
     ]
    },
    {
     "id": "satz_2",
     "segmente": [
      {
       "typ": "sprechen",
       "text": "Los geht's mit dem zweiten Satz. Bei Schmerz hör sofort auf.",
       "soll_dauer_s": 5.5
      },
      {
       "typ": "pause",
       "soll_dauer_s": 2
      },
      {
       "typ": "wiederholungen",
       "modus": "zaehlen",
       "anzahl": 10,
       "takt_s": 7,
       "soll_dauer_s": 70,
       "cues": [
        {
         "bei_s": 17,
         "text": "Atme dabei."
        },
        {
         "bei_s": 38,
         "text": "Ellenbogen nah am Körper."
        }
       ]
      },
      {
       "typ": "sprechen",
       "text": "Sehr gut. Atme durch. Super gemacht.",
       "soll_dauer_s": 3.0
      }
     ]
    }
   ],
   "toleranz_prozent": 10,
   "soll_gesamtdauer_s": 256.0
  },
  "KU05": {
   "id": "KU05",
   "version": 1,
   "status": "entwurf_nicht_freigegeben",
   "titel": "Schulterheben (Kraft, 2 Sätze mit je 10 Wiederholungen)",
   "kategorie": "kraft_arme",
   "material": [],
   "position": "sitzen_stehen",
   "sprechtempo_woerter_pro_sekunde": 2,
   "haltezeit_gesamt_s": 0,
   "empfohlene_haeufigkeit": "offen (täglich oder alle 2 Tage, OP-B18)",
   "belastet_regionen": [
    "schulter",
    "nacken"
   ],
   "_hinweis": "Vorschlag des Systemchats aus Dokument 18. belastet_regionen und stufen_zuordnung sind NICHT fachlich geprüft und bewusst knapp. Der Satz zum Schmerzhinweis ist ergänzt, im Skript fehlte er. Entwurf, noch nicht aufgenommen.",
   "bild_vorgaben": [
    "Ausgangslage",
    "Endposition"
   ],
   "stufen_zuordnung": [
    {
     "zustand": "akuter_muskelfaserriss",
     "stufe": 2,
     "hinweis": "Baustein sperren (Vorschlag)"
    },
    {
     "zustand": "schulterprobleme",
     "stufe": 3,
     "hinweis": "Hinweis auf dem Planblatt (Vorschlag)"
    }
   ],
   "teile": [
    {
     "id": "satz_1",
     "segmente": [
      {
       "typ": "sprechen",
       "text": "Wir machen jetzt Schulterheben, im Sitzen oder im Stehen. Sitz oder steh aufrecht, die Arme hängen locker an den Seiten. Bei Schmerz hör sofort auf.",
       "soll_dauer_s": 12.5
      },
      {
       "typ": "pause",
       "soll_dauer_s": 4
      },
      {
       "typ": "sprechen",
       "text": "Zieh die Schultern bis zu den Ohren, halte kurz und senke sie langsam. Ich zähle alle vier Sekunden. Mach nur, was du schaffst. Los geht's.",
       "soll_dauer_s": 12.5
      },
      {
       "typ": "pause",
       "soll_dauer_s": 2
      },
      {
       "typ": "wiederholungen",
       "modus": "zaehlen",
       "anzahl": 10,
       "takt_s": 4,
       "soll_dauer_s": 40
      },
      {
       "typ": "sprechen",
       "text": "Sehr gut. Atme ruhig.",
       "soll_dauer_s": 2.0
      },
      {
       "typ": "satzpause",
       "soll_dauer_s": 60,
       "cues": [
        {
         "bei_s": 20,
         "text": "Atme ruhig. Du machst das gut."
        },
        {
         "bei_s": 50,
         "text": "Gleich noch ein Satz. Du schaffst das."
        }
       ]
      }
     ]
    },
    {
     "id": "satz_2",
     "segmente": [
      {
       "typ": "sprechen",
       "text": "Los geht's mit dem zweiten Satz. Bei Schmerz hör sofort auf.",
       "soll_dauer_s": 5.5
      },
      {
       "typ": "pause",
       "soll_dauer_s": 2
      },
      {
       "typ": "wiederholungen",
       "modus": "zaehlen",
       "anzahl": 10,
       "takt_s": 4,
       "soll_dauer_s": 40
      },
      {
       "typ": "sprechen",
       "text": "Super gemacht. Schüttel deine Schultern locker aus.",
       "soll_dauer_s": 3.5
      }
     ]
    }
   ],
   "toleranz_prozent": 10,
   "soll_gesamtdauer_s": 184.0
  },
  "KU06": {
   "id": "KU06",
   "version": 1,
   "status": "entwurf_nicht_freigegeben",
   "titel": "Bizeps Curls mit Theraband (Kraft, beide Arme, 2 Sätze)",
   "kategorie": "kraft_arme",
   "material": [
    "Theraband"
   ],
   "position": "sitzen_stehen",
   "sprechtempo_woerter_pro_sekunde": 2,
   "haltezeit_gesamt_s": 0,
   "empfohlene_haeufigkeit": "offen (täglich oder alle 2 Tage, OP-B18)",
   "belastet_regionen": [
    "schulter"
   ],
   "_hinweis": "Vorschlag des Systemchats aus Dokument 18. belastet_regionen und stufen_zuordnung sind NICHT fachlich geprüft und bewusst knapp. Der Satz zum Schmerzhinweis ist ergänzt, im Skript fehlte er. Entwurf, noch nicht aufgenommen.",
   "bild_vorgaben": [
    "Ausgangslage",
    "Endposition"
   ],
   "stufen_zuordnung": [
    {
     "zustand": "akuter_muskelfaserriss",
     "stufe": 2,
     "hinweis": "Baustein sperren (Vorschlag)"
    },
    {
     "zustand": "schulterprobleme",
     "stufe": 3,
     "hinweis": "Hinweis auf dem Planblatt (Vorschlag)"
    }
   ],
   "teile": [
    {
     "id": "satz_1",
     "segmente": [
      {
       "typ": "sprechen",
       "text": "Wir machen jetzt Armbeugen mit dem Theraband, im Sitzen oder im Stehen. Das Band liegt unter einem Fuß, der Oberkörper bleibt aufrecht, der Oberarm bleibt an der Seite. Bei Schmerz hör sofort auf.",
       "soll_dauer_s": 16.5
      },
      {
       "typ": "pause",
       "soll_dauer_s": 4
      },
      {
       "typ": "sprechen",
       "text": "Ich sage dir an, wann es rauf und runter geht. Rauf dauert vier Sekunden, runter dauert vier Sekunden. Wir beginnen mit dem rechten Arm. Mach nur, was du schaffst. Los geht's.",
       "soll_dauer_s": 15.5
      },
      {
       "typ": "pause",
       "soll_dauer_s": 2
      },
      {
       "typ": "wiederholungen",
       "modus": "wortsignal",
       "woerter": [
        "Rauf",
        "Runter"
       ],
       "anzahl": 10,
       "takt_s": 4,
       "soll_dauer_s": 80
      },
      {
       "typ": "pause",
       "soll_dauer_s": 6
      },
      {
       "typ": "sprechen",
       "text": "Jetzt der linke Arm.",
       "soll_dauer_s": 2.0
      },
      {
       "typ": "wiederholungen",
       "modus": "wortsignal",
       "woerter": [
        "Rauf",
        "Runter"
       ],
       "anzahl": 10,
       "takt_s": 4,
       "soll_dauer_s": 80
      },
      {
       "typ": "sprechen",
       "text": "Sehr gut. Lass die Arme hängen.",
       "soll_dauer_s": 3.0
      },
      {
       "typ": "satzpause",
       "soll_dauer_s": 60,
       "cues": [
        {
         "bei_s": 20,
         "text": "Atme ruhig. Du machst das gut."
        },
        {
         "bei_s": 50,
         "text": "Gleich nächste Runde. Du schaffst das."
        }
       ]
      }
     ]
    },
    {
     "id": "satz_2",
     "segmente": [
      {
       "typ": "sprechen",
       "text": "Los geht's mit dem zweiten Satz, wieder zuerst rechts. Bei Schmerz hör sofort auf.",
       "soll_dauer_s": 7.0
      },
      {
       "typ": "pause",
       "soll_dauer_s": 2
      },
      {
       "typ": "wiederholungen",
       "modus": "wortsignal",
       "woerter": [
        "Rauf",
        "Runter"
       ],
       "anzahl": 10,
       "takt_s": 4,
       "soll_dauer_s": 80
      },
      {
       "typ": "pause",
       "soll_dauer_s": 6
      },
      {
       "typ": "sprechen",
       "text": "Jetzt der linke Arm.",
       "soll_dauer_s": 2.0
      },
      {
       "typ": "wiederholungen",
       "modus": "wortsignal",
       "woerter": [
        "Rauf",
        "Runter"
       ],
       "anzahl": 10,
       "takt_s": 4,
       "soll_dauer_s": 80
      },
      {
       "typ": "sprechen",
       "text": "Super gemacht. Lass die Arme hängen und atme durch.",
       "soll_dauer_s": 4.5
      }
     ]
    }
   ],
   "toleranz_prozent": 10,
   "soll_gesamtdauer_s": 450.5
  }
 },
 "einstellungen": {
  "vorlauf_s": 1.0,
  "nachlauf_s": 2.0,
  "pause_zwischen_bausteinen_s": 15.0,
  "ziel_rms_dbfs": -20.0,
  "fade_ms": 15,
  "raumton": true,
  "raumton_min_dbfs": -75.0,
  "raumton_max_dbfs": -58.0,
  "formate": [
   "wav",
   "mp3"
  ],
  "mp3_bitrate": "128k",
  "cue_sicherheitsabstand_s": 1.0,
  "max_sprechtempo_wps": 2.8,
  "min_sprechtempo_wps": 1.0,
  "min_snr_db": 20.0,
  "stille_pause_warnung_s": 2.5
 },
 "demo": [
  {
   "id": "A01",
   "name": "Keine Besonderheiten",
   "jahr": 2026,
   "antworten": {
    "W1": "ja",
    "W2": "ja",
    "W3": "selbst",
    "K1": "Test",
    "K2": 1950,
    "K3": "test@example.org",
    "K5": "nein",
    "A1": "nein",
    "A2": "nein",
    "A3": "nein",
    "B1": "nein",
    "B2": "nein",
    "B3": "nein",
    "B4": "nein",
    "B5": "nein",
    "B6": "nein",
    "B7": "nein",
    "C1": "nein",
    "C2": "nein",
    "C3": "nein",
    "C4": "nie",
    "C5": "ohne_hilfe",
    "C6": "keins",
    "D1": "nein",
    "D2": "nein",
    "E1": "nein",
    "E2": "nein",
    "E5a": "nein",
    "E6": "nein",
    "E7": "nein",
    "F1": "ja",
    "M1": "nein",
    "R0": [
     "nichts"
    ],
    "Z1": [],
    "Z2": []
   },
   "ampel": "gruen",
   "status": "ausgewertet",
   "hervorgehoben": "gruen"
  },
  {
   "id": "A02",
   "name": "Blutverdünner",
   "jahr": 2026,
   "antworten": {
    "W1": "ja",
    "W2": "ja",
    "W3": "selbst",
    "K1": "Test",
    "K2": 1950,
    "K3": "test@example.org",
    "K5": "nein",
    "A1": "nein",
    "A2": "nein",
    "A3": "nein",
    "B1": "nein",
    "B2": "nein",
    "B3": "nein",
    "B4": "ja",
    "B5": "nein",
    "B6": "nein",
    "B7": "nein",
    "C1": "nein",
    "C2": "nein",
    "C3": "nein",
    "C4": "nie",
    "C5": "ohne_hilfe",
    "C6": "keins",
    "D1": "nein",
    "D2": "nein",
    "E1": "nein",
    "E2": "nein",
    "E5a": "nein",
    "E6": "nein",
    "E7": "nein",
    "F1": "ja",
    "M1": "nein",
    "R0": [
     "nichts"
    ],
    "Z1": [],
    "Z2": []
   },
   "ampel": "gelb",
   "status": "ausgewertet",
   "hervorgehoben": null
  },
  {
   "id": "A03",
   "name": "Ischias Beschwerden",
   "jahr": 2026,
   "antworten": {
    "W1": "ja",
    "W2": "ja",
    "W3": "selbst",
    "K1": "Test",
    "K2": 1950,
    "K3": "test@example.org",
    "K5": "nein",
    "A1": "nein",
    "A2": "nein",
    "A3": "nein",
    "B1": "nein",
    "B2": "nein",
    "B3": "nein",
    "B4": "nein",
    "B5": "nein",
    "B6": "nein",
    "B7": "nein",
    "C1": "nein",
    "C2": "nein",
    "C3": "nein",
    "C4": "nie",
    "C5": "ohne_hilfe",
    "C6": "keins",
    "D1": "nein",
    "D2": "nein",
    "E1": "nein",
    "E2": "nein",
    "E5a": "nein",
    "E6": "nein",
    "E7": "nein",
    "F1": "ja",
    "M1": "nein",
    "R0": [
     "ruecken"
    ],
    "Z1": [],
    "Z2": [],
    "E5": "ja",
    "E9": "nein",
    "P0": [
     "nichts"
    ]
   },
   "ampel": "gelb",
   "status": "ausgewertet",
   "hervorgehoben": null
  },
  {
   "id": "A04",
   "name": "Hüftprothese länger her",
   "jahr": 2026,
   "antworten": {
    "W1": "ja",
    "W2": "ja",
    "W3": "selbst",
    "K1": "Test",
    "K2": 1950,
    "K3": "test@example.org",
    "K5": "nein",
    "A1": "nein",
    "A2": "ja",
    "A3": "nein",
    "B1": "nein",
    "B2": "nein",
    "B3": "nein",
    "B4": "nein",
    "B5": "nein",
    "B6": "nein",
    "B7": "nein",
    "C1": "nein",
    "C2": "nein",
    "C3": "nein",
    "C4": "nie",
    "C5": "ohne_hilfe",
    "C6": "keins",
    "D1": "nein",
    "D2": "nein",
    "E1": "nein",
    "E2": "nein",
    "E5a": "nein",
    "E6": "nein",
    "E7": "nein",
    "F1": "ja",
    "M1": "nein",
    "R0": [
     "hueft"
    ],
    "Z1": [],
    "Z2": [],
    "A2a": "nein",
    "E3h": "nein",
    "P0": [
     "nichts"
    ]
   },
   "ampel": "gelb",
   "status": "ausgewertet",
   "hervorgehoben": null
  },
  {
   "id": "A05",
   "name": "Knieprothese",
   "jahr": 2026,
   "antworten": {
    "W1": "ja",
    "W2": "ja",
    "W3": "selbst",
    "K1": "Test",
    "K2": 1950,
    "K3": "test@example.org",
    "K5": "nein",
    "A1": "nein",
    "A2": "nein",
    "A3": "ja",
    "B1": "nein",
    "B2": "nein",
    "B3": "nein",
    "B4": "nein",
    "B5": "nein",
    "B6": "nein",
    "B7": "nein",
    "C1": "nein",
    "C2": "nein",
    "C3": "nein",
    "C4": "nie",
    "C5": "ohne_hilfe",
    "C6": "keins",
    "D1": "nein",
    "D2": "nein",
    "E1": "nein",
    "E2": "nein",
    "E5a": "nein",
    "E6": "nein",
    "E7": "nein",
    "F1": "ja",
    "M1": "nein",
    "R0": [
     "knie"
    ],
    "Z1": [],
    "Z2": [],
    "E3k": "nein",
    "E8": "nein",
    "P0": [
     "nichts"
    ]
   },
   "ampel": "gelb",
   "status": "ausgewertet",
   "hervorgehoben": null
  },
  {
   "id": "A06",
   "name": "Kniearthrose",
   "jahr": 2026,
   "antworten": {
    "W1": "ja",
    "W2": "ja",
    "W3": "selbst",
    "K1": "Test",
    "K2": 1950,
    "K3": "test@example.org",
    "K5": "nein",
    "A1": "nein",
    "A2": "nein",
    "A3": "nein",
    "B1": "nein",
    "B2": "nein",
    "B3": "nein",
    "B4": "nein",
    "B5": "nein",
    "B6": "nein",
    "B7": "nein",
    "C1": "nein",
    "C2": "nein",
    "C3": "nein",
    "C4": "nie",
    "C5": "ohne_hilfe",
    "C6": "keins",
    "D1": "nein",
    "D2": "nein",
    "E1": "nein",
    "E2": "nein",
    "E5a": "nein",
    "E6": "nein",
    "E7": "nein",
    "F1": "ja",
    "M1": "nein",
    "R0": [
     "knie"
    ],
    "Z1": [],
    "Z2": [],
    "E3k": "nein",
    "E8": "ja",
    "P0": [
     "nichts"
    ]
   },
   "ampel": "gelb",
   "status": "ausgewertet",
   "hervorgehoben": "gelb"
  },
  {
   "id": "A07",
   "name": "Thromboseverdacht",
   "jahr": 2026,
   "antworten": {
    "W1": "ja",
    "W2": "ja",
    "W3": "selbst",
    "K1": "Test",
    "K2": 1950,
    "K3": "test@example.org",
    "K5": "nein",
    "A1": "nein",
    "A2": "nein",
    "A3": "nein",
    "B1": "nein",
    "B2": "nein",
    "B3": "nein",
    "B4": "nein",
    "B5": "ja",
    "B6": "nein",
    "B7": "nein",
    "C1": "nein",
    "C2": "nein",
    "C3": "nein",
    "C4": "nie",
    "C5": "ohne_hilfe",
    "C6": "keins",
    "D1": "nein",
    "D2": "nein",
    "E1": "nein",
    "E2": "nein",
    "E5a": "nein",
    "E6": "nein",
    "E7": "nein",
    "F1": "ja",
    "M1": "nein",
    "R0": [
     "nichts"
    ],
    "Z1": [],
    "Z2": []
   },
   "ampel": "rot",
   "status": "ausgewertet",
   "hervorgehoben": null
  },
  {
   "id": "A08",
   "name": "Hüft OP vor 2 Monaten",
   "jahr": 2026,
   "antworten": {
    "W1": "ja",
    "W2": "ja",
    "W3": "selbst",
    "K1": "Test",
    "K2": 1950,
    "K3": "test@example.org",
    "K5": "nein",
    "A1": "ja",
    "A2": "nein",
    "A3": "nein",
    "B1": "nein",
    "B2": "nein",
    "B3": "nein",
    "B4": "nein",
    "B5": "nein",
    "B6": "nein",
    "B7": "nein",
    "C1": "nein",
    "C2": "nein",
    "C3": "nein",
    "C4": "nie",
    "C5": "ohne_hilfe",
    "C6": "keins",
    "D1": "nein",
    "D2": "nein",
    "E1": "nein",
    "E2": "nein",
    "E5a": "nein",
    "E6": "nein",
    "E7": "nein",
    "F1": "ja",
    "M1": "nein",
    "R0": [
     "nichts"
    ],
    "Z1": [],
    "Z2": []
   },
   "ampel": "rot",
   "status": "ausgewertet",
   "hervorgehoben": null
  },
  {
   "id": "A09",
   "name": "Akuter Muskelfaserriss",
   "jahr": 2026,
   "antworten": {
    "W1": "ja",
    "W2": "ja",
    "W3": "selbst",
    "K1": "Test",
    "K2": 1950,
    "K3": "test@example.org",
    "K5": "nein",
    "A1": "nein",
    "A2": "nein",
    "A3": "nein",
    "B1": "nein",
    "B2": "nein",
    "B3": "nein",
    "B4": "nein",
    "B5": "nein",
    "B6": "nein",
    "B7": "nein",
    "C1": "nein",
    "C2": "nein",
    "C3": "nein",
    "C4": "nie",
    "C5": "ohne_hilfe",
    "C6": "keins",
    "D1": "nein",
    "D2": "nein",
    "E1": "nein",
    "E2": "nein",
    "E5a": "nein",
    "E6": "ja",
    "E7": "nein",
    "F1": "ja",
    "M1": "nein",
    "R0": [
     "oberschenkel_wade"
    ],
    "Z1": [],
    "Z2": [],
    "E10": "nein",
    "P0": [
     "nichts"
    ]
   },
   "ampel": "gelb",
   "status": "ausgewertet",
   "hervorgehoben": null
  },
  {
   "id": "A10",
   "name": "Schwindel beim Hinlegen, abgeklärt",
   "jahr": 2026,
   "antworten": {
    "W1": "ja",
    "W2": "ja",
    "W3": "selbst",
    "K1": "Test",
    "K2": 1950,
    "K3": "test@example.org",
    "K5": "nein",
    "A1": "nein",
    "A2": "nein",
    "A3": "nein",
    "B1": "nein",
    "B2": "nein",
    "B3": "nein",
    "B4": "nein",
    "B5": "nein",
    "B6": "nein",
    "B7": "nein",
    "C1": "nein",
    "C2": "ja",
    "C3": "nein",
    "C4": "nie",
    "C5": "ohne_hilfe",
    "C6": "keins",
    "D1": "nein",
    "D2": "nein",
    "E1": "nein",
    "E2": "nein",
    "E5a": "nein",
    "E6": "nein",
    "E7": "nein",
    "F1": "ja",
    "M1": "nein",
    "R0": [
     "nichts"
    ],
    "Z1": [],
    "Z2": []
   },
   "ampel": "gelb",
   "status": "ausgewertet",
   "hervorgehoben": null
  },
  {
   "id": "A11",
   "name": "Krampfneigung",
   "jahr": 2026,
   "antworten": {
    "W1": "ja",
    "W2": "ja",
    "W3": "selbst",
    "K1": "Test",
    "K2": 1950,
    "K3": "test@example.org",
    "K5": "nein",
    "A1": "nein",
    "A2": "nein",
    "A3": "nein",
    "B1": "nein",
    "B2": "nein",
    "B3": "nein",
    "B4": "nein",
    "B5": "nein",
    "B6": "nein",
    "B7": "nein",
    "C1": "nein",
    "C2": "nein",
    "C3": "nein",
    "C4": "nie",
    "C5": "ohne_hilfe",
    "C6": "keins",
    "D1": "nein",
    "D2": "nein",
    "E1": "nein",
    "E2": "nein",
    "E5a": "nein",
    "E6": "nein",
    "E7": "nein",
    "F1": "ja",
    "M1": "nein",
    "R0": [
     "oberschenkel_wade"
    ],
    "Z1": [],
    "Z2": [],
    "E10": "ja",
    "P0": [
     "nichts"
    ]
   },
   "ampel": "gelb",
   "status": "ausgewertet",
   "hervorgehoben": null
  },
  {
   "id": "A12",
   "name": "Ischias mit Notfallzeichen",
   "jahr": 2026,
   "antworten": {
    "W1": "ja",
    "W2": "ja",
    "W3": "selbst",
    "K1": "Test",
    "K2": 1950,
    "K3": "test@example.org",
    "K5": "nein",
    "A1": "nein",
    "A2": "nein",
    "A3": "nein",
    "B1": "nein",
    "B2": "nein",
    "B3": "nein",
    "B4": "nein",
    "B5": "nein",
    "B6": "nein",
    "B7": "nein",
    "C1": "nein",
    "C2": "nein",
    "C3": "nein",
    "C4": "nie",
    "C5": "ohne_hilfe",
    "C6": "keins",
    "D1": "nein",
    "D2": "nein",
    "E1": "nein",
    "E2": "nein",
    "E5a": "ja",
    "E6": "nein",
    "E7": "nein",
    "F1": "ja",
    "M1": "nein",
    "R0": [
     "nichts"
    ],
    "Z1": [],
    "Z2": []
   },
   "ampel": "rot",
   "status": "ausgewertet",
   "hervorgehoben": null
  },
  {
   "id": "A13",
   "name": "Neuer unklarer Schwindel",
   "jahr": 2026,
   "antworten": {
    "W1": "ja",
    "W2": "ja",
    "W3": "selbst",
    "K1": "Test",
    "K2": 1950,
    "K3": "test@example.org",
    "K5": "nein",
    "A1": "nein",
    "A2": "nein",
    "A3": "nein",
    "B1": "nein",
    "B2": "nein",
    "B3": "nein",
    "B4": "nein",
    "B5": "nein",
    "B6": "nein",
    "B7": "nein",
    "C1": "ja",
    "C2": "nein",
    "C3": "nein",
    "C4": "nie",
    "C5": "ohne_hilfe",
    "C6": "keins",
    "D1": "nein",
    "D2": "nein",
    "E1": "nein",
    "E2": "nein",
    "E5a": "nein",
    "E6": "nein",
    "E7": "nein",
    "F1": "ja",
    "M1": "nein",
    "R0": [
     "nichts"
    ],
    "Z1": [],
    "Z2": []
   },
   "ampel": "rot",
   "status": "ausgewertet",
   "hervorgehoben": null
  },
  {
   "id": "A14",
   "name": "Diabetes mit Unterzucker",
   "jahr": 2026,
   "antworten": {
    "W1": "ja",
    "W2": "ja",
    "W3": "selbst",
    "K1": "Test",
    "K2": 1950,
    "K3": "test@example.org",
    "K5": "nein",
    "A1": "nein",
    "A2": "nein",
    "A3": "nein",
    "B1": "nein",
    "B2": "nein",
    "B3": "nein",
    "B4": "nein",
    "B5": "nein",
    "B6": "ja",
    "B7": "nein",
    "C1": "nein",
    "C2": "nein",
    "C3": "nein",
    "C4": "nie",
    "C5": "ohne_hilfe",
    "C6": "keins",
    "D1": "nein",
    "D2": "nein",
    "E1": "nein",
    "E2": "nein",
    "E5a": "nein",
    "E6": "nein",
    "E7": "nein",
    "F1": "ja",
    "M1": "nein",
    "R0": [
     "nichts"
    ],
    "Z1": [],
    "Z2": []
   },
   "ampel": "gelb",
   "status": "ausgewertet",
   "hervorgehoben": null
  },
  {
   "id": "A15",
   "name": "Latexallergie",
   "jahr": 2026,
   "antworten": {
    "W1": "ja",
    "W2": "ja",
    "W3": "selbst",
    "K1": "Test",
    "K2": 1950,
    "K3": "test@example.org",
    "K5": "nein",
    "A1": "nein",
    "A2": "nein",
    "A3": "nein",
    "B1": "nein",
    "B2": "nein",
    "B3": "nein",
    "B4": "nein",
    "B5": "nein",
    "B6": "nein",
    "B7": "nein",
    "C1": "nein",
    "C2": "nein",
    "C3": "nein",
    "C4": "nie",
    "C5": "ohne_hilfe",
    "C6": "keins",
    "D1": "nein",
    "D2": "nein",
    "E1": "nein",
    "E2": "nein",
    "E5a": "nein",
    "E6": "nein",
    "E7": "nein",
    "F1": "ja",
    "M1": "ja",
    "R0": [
     "nichts"
    ],
    "Z1": [],
    "Z2": []
   },
   "ampel": "gruen",
   "status": "ausgewertet",
   "hervorgehoben": null
  },
  {
   "id": "A16",
   "name": "Hüftprothese und Kniearthrose",
   "jahr": 2026,
   "antworten": {
    "W1": "ja",
    "W2": "ja",
    "W3": "selbst",
    "K1": "Test",
    "K2": 1950,
    "K3": "test@example.org",
    "K5": "nein",
    "A1": "nein",
    "A2": "ja",
    "A3": "nein",
    "B1": "nein",
    "B2": "nein",
    "B3": "nein",
    "B4": "nein",
    "B5": "nein",
    "B6": "nein",
    "B7": "nein",
    "C1": "nein",
    "C2": "nein",
    "C3": "nein",
    "C4": "nie",
    "C5": "ohne_hilfe",
    "C6": "keins",
    "D1": "nein",
    "D2": "nein",
    "E1": "nein",
    "E2": "nein",
    "E5a": "nein",
    "E6": "nein",
    "E7": "nein",
    "F1": "ja",
    "M1": "nein",
    "R0": [
     "hueft",
     "knie"
    ],
    "Z1": [],
    "Z2": [],
    "A2a": "nein",
    "E3h": "nein",
    "E3k": "nein",
    "E8": "ja",
    "P0": [
     "nichts"
    ]
   },
   "ampel": "gelb",
   "status": "ausgewertet",
   "hervorgehoben": null
  },
  {
   "id": "A17",
   "name": "Ischias und Blutverdünner",
   "jahr": 2026,
   "antworten": {
    "W1": "ja",
    "W2": "ja",
    "W3": "selbst",
    "K1": "Test",
    "K2": 1950,
    "K3": "test@example.org",
    "K5": "nein",
    "A1": "nein",
    "A2": "nein",
    "A3": "nein",
    "B1": "nein",
    "B2": "nein",
    "B3": "nein",
    "B4": "ja",
    "B5": "nein",
    "B6": "nein",
    "B7": "nein",
    "C1": "nein",
    "C2": "nein",
    "C3": "nein",
    "C4": "nie",
    "C5": "ohne_hilfe",
    "C6": "keins",
    "D1": "nein",
    "D2": "nein",
    "E1": "nein",
    "E2": "nein",
    "E5a": "nein",
    "E6": "nein",
    "E7": "nein",
    "F1": "ja",
    "M1": "nein",
    "R0": [
     "ruecken"
    ],
    "Z1": [],
    "Z2": [],
    "E5": "ja",
    "E9": "nein",
    "P0": [
     "nichts"
    ]
   },
   "ampel": "gelb",
   "status": "ausgewertet",
   "hervorgehoben": null
  },
  {
   "id": "A18",
   "name": "Empfindliches Hohlkreuz",
   "jahr": 2026,
   "antworten": {
    "W1": "ja",
    "W2": "ja",
    "W3": "selbst",
    "K1": "Test",
    "K2": 1950,
    "K3": "test@example.org",
    "K5": "nein",
    "A1": "nein",
    "A2": "nein",
    "A3": "nein",
    "B1": "nein",
    "B2": "nein",
    "B3": "nein",
    "B4": "nein",
    "B5": "nein",
    "B6": "nein",
    "B7": "nein",
    "C1": "nein",
    "C2": "nein",
    "C3": "nein",
    "C4": "nie",
    "C5": "ohne_hilfe",
    "C6": "keins",
    "D1": "nein",
    "D2": "nein",
    "E1": "nein",
    "E2": "nein",
    "E5a": "nein",
    "E6": "nein",
    "E7": "nein",
    "F1": "ja",
    "M1": "nein",
    "R0": [
     "ruecken"
    ],
    "Z1": [],
    "Z2": [],
    "E5": "nein",
    "E9": "ja",
    "P0": [
     "nichts"
    ]
   },
   "ampel": "gelb",
   "status": "ausgewertet",
   "hervorgehoben": null
  },
  {
   "id": "A19",
   "name": "Hüftprothese und Thromboseverdacht",
   "jahr": 2026,
   "antworten": {
    "W1": "ja",
    "W2": "ja",
    "W3": "selbst",
    "K1": "Test",
    "K2": 1950,
    "K3": "test@example.org",
    "K5": "nein",
    "A1": "nein",
    "A2": "ja",
    "A3": "nein",
    "B1": "nein",
    "B2": "nein",
    "B3": "nein",
    "B4": "nein",
    "B5": "ja",
    "B6": "nein",
    "B7": "nein",
    "C1": "nein",
    "C2": "nein",
    "C3": "nein",
    "C4": "nie",
    "C5": "ohne_hilfe",
    "C6": "keins",
    "D1": "nein",
    "D2": "nein",
    "E1": "nein",
    "E2": "nein",
    "E5a": "nein",
    "E6": "nein",
    "E7": "nein",
    "F1": "ja",
    "M1": "nein",
    "R0": [
     "nichts"
    ],
    "Z1": [],
    "Z2": [],
    "A2a": "nein"
   },
   "ampel": "rot",
   "status": "ausgewertet",
   "hervorgehoben": null
  },
  {
   "id": "A20",
   "name": "Sehschwäche und Schwindel beim Hinlegen",
   "jahr": 2026,
   "antworten": {
    "W1": "ja",
    "W2": "ja",
    "W3": "selbst",
    "K1": "Test",
    "K2": 1950,
    "K3": "test@example.org",
    "K5": "nein",
    "A1": "nein",
    "A2": "nein",
    "A3": "nein",
    "B1": "nein",
    "B2": "nein",
    "B3": "nein",
    "B4": "nein",
    "B5": "nein",
    "B6": "nein",
    "B7": "nein",
    "C1": "nein",
    "C2": "ja",
    "C3": "nein",
    "C4": "nie",
    "C5": "ohne_hilfe",
    "C6": "keins",
    "D1": "nein",
    "D2": "nein",
    "E1": "nein",
    "E2": "nein",
    "E5a": "nein",
    "E6": "nein",
    "E7": "nein",
    "F1": "ja",
    "M1": "nein",
    "R0": [
     "nichts"
    ],
    "Z1": [],
    "Z2": []
   },
   "ampel": "gelb",
   "status": "ausgewertet",
   "hervorgehoben": null
  },
  {
   "id": "A21",
   "name": "Osteoporose ohne Freigabe",
   "jahr": 2026,
   "antworten": {
    "W1": "ja",
    "W2": "ja",
    "W3": "selbst",
    "K1": "Test",
    "K2": 1950,
    "K3": "test@example.org",
    "K5": "nein",
    "A1": "nein",
    "A2": "nein",
    "A3": "nein",
    "B1": "nein",
    "B2": "nein",
    "B3": "nein",
    "B4": "nein",
    "B5": "nein",
    "B6": "nein",
    "B7": "nein",
    "C1": "nein",
    "C2": "nein",
    "C3": "nein",
    "C4": "nie",
    "C5": "ohne_hilfe",
    "C6": "keins",
    "D1": "nein",
    "D2": "ja",
    "E1": "nein",
    "E2": "nein",
    "E5a": "nein",
    "E6": "nein",
    "E7": "nein",
    "F1": "ja",
    "M1": "nein",
    "R0": [
     "nichts"
    ],
    "Z1": [],
    "Z2": [],
    "D2a": "nein"
   },
   "ampel": "rot",
   "status": "ausgewertet",
   "hervorgehoben": null
  },
  {
   "id": "A22",
   "name": "Osteoporose mit Freigabe",
   "jahr": 2026,
   "antworten": {
    "W1": "ja",
    "W2": "ja",
    "W3": "selbst",
    "K1": "Test",
    "K2": 1950,
    "K3": "test@example.org",
    "K5": "nein",
    "A1": "nein",
    "A2": "nein",
    "A3": "nein",
    "B1": "nein",
    "B2": "nein",
    "B3": "nein",
    "B4": "nein",
    "B5": "nein",
    "B6": "nein",
    "B7": "nein",
    "C1": "nein",
    "C2": "nein",
    "C3": "nein",
    "C4": "nie",
    "C5": "ohne_hilfe",
    "C6": "keins",
    "D1": "nein",
    "D2": "ja",
    "E1": "nein",
    "E2": "nein",
    "E5a": "nein",
    "E6": "nein",
    "E7": "nein",
    "F1": "ja",
    "M1": "nein",
    "R0": [
     "nichts"
    ],
    "Z1": [],
    "Z2": [],
    "D2a": "ja"
   },
   "ampel": "gelb",
   "status": "ausgewertet",
   "hervorgehoben": null
  },
  {
   "id": "A23",
   "name": "Sturz abgeklärt",
   "jahr": 2026,
   "antworten": {
    "W1": "ja",
    "W2": "ja",
    "W3": "selbst",
    "K1": "Test",
    "K2": 1950,
    "K3": "test@example.org",
    "K5": "nein",
    "A1": "nein",
    "A2": "nein",
    "A3": "nein",
    "B1": "nein",
    "B2": "nein",
    "B3": "nein",
    "B4": "nein",
    "B5": "nein",
    "B6": "nein",
    "B7": "nein",
    "C1": "nein",
    "C2": "nein",
    "C3": "ja",
    "C4": "nie",
    "C5": "ohne_hilfe",
    "C6": "keins",
    "D1": "nein",
    "D2": "nein",
    "E1": "nein",
    "E2": "nein",
    "E5a": "nein",
    "E6": "nein",
    "E7": "nein",
    "F1": "ja",
    "M1": "nein",
    "R0": [
     "nichts"
    ],
    "Z1": [],
    "Z2": [],
    "C3a": "ja",
    "C3b": "laenger_her"
   },
   "ampel": "gelb",
   "status": "ausgewertet",
   "hervorgehoben": null
  },
  {
   "id": "A24",
   "name": "Sturz nicht abgeklärt",
   "jahr": 2026,
   "antworten": {
    "W1": "ja",
    "W2": "ja",
    "W3": "selbst",
    "K1": "Test",
    "K2": 1950,
    "K3": "test@example.org",
    "K5": "nein",
    "A1": "nein",
    "A2": "nein",
    "A3": "nein",
    "B1": "nein",
    "B2": "nein",
    "B3": "nein",
    "B4": "nein",
    "B5": "nein",
    "B6": "nein",
    "B7": "nein",
    "C1": "nein",
    "C2": "nein",
    "C3": "ja",
    "C4": "nie",
    "C5": "ohne_hilfe",
    "C6": "keins",
    "D1": "nein",
    "D2": "nein",
    "E1": "nein",
    "E2": "nein",
    "E5a": "nein",
    "E6": "nein",
    "E7": "nein",
    "F1": "ja",
    "M1": "nein",
    "R0": [
     "nichts"
    ],
    "Z1": [],
    "Z2": [],
    "C3a": "nein",
    "C3b": "laenger_her"
   },
   "ampel": "rot",
   "status": "ausgewertet",
   "hervorgehoben": null
  },
  {
   "id": "A25",
   "name": "Brustschmerz bei Belastung",
   "jahr": 2026,
   "antworten": {
    "W1": "ja",
    "W2": "ja",
    "W3": "selbst",
    "K1": "Test",
    "K2": 1950,
    "K3": "test@example.org",
    "K5": "nein",
    "A1": "nein",
    "A2": "nein",
    "A3": "nein",
    "B1": "ja",
    "B2": "nein",
    "B3": "nein",
    "B4": "nein",
    "B5": "nein",
    "B6": "nein",
    "B7": "nein",
    "C1": "nein",
    "C2": "nein",
    "C3": "nein",
    "C4": "nie",
    "C5": "ohne_hilfe",
    "C6": "keins",
    "D1": "nein",
    "D2": "nein",
    "E1": "nein",
    "E2": "nein",
    "E5a": "nein",
    "E6": "nein",
    "E7": "nein",
    "F1": "ja",
    "M1": "nein",
    "R0": [
     "nichts"
    ],
    "Z1": [],
    "Z2": []
   },
   "ampel": "rot",
   "status": "ausgewertet",
   "hervorgehoben": null
  },
  {
   "id": "A26",
   "name": "Schulter und Gelenkschmerz",
   "jahr": 2026,
   "antworten": {
    "W1": "ja",
    "W2": "ja",
    "W3": "selbst",
    "K1": "Test",
    "K2": 1950,
    "K3": "test@example.org",
    "K5": "nein",
    "A1": "nein",
    "A2": "nein",
    "A3": "nein",
    "B1": "nein",
    "B2": "nein",
    "B3": "nein",
    "B4": "nein",
    "B5": "nein",
    "B6": "nein",
    "B7": "nein",
    "C1": "nein",
    "C2": "nein",
    "C3": "nein",
    "C4": "nie",
    "C5": "ohne_hilfe",
    "C6": "keins",
    "D1": "nein",
    "D2": "nein",
    "E1": "nein",
    "E2": "nein",
    "E5a": "nein",
    "E6": "nein",
    "E7": "nein",
    "F1": "ja",
    "M1": "nein",
    "R0": [
     "schulter",
     "hueft"
    ],
    "Z1": [],
    "Z2": [],
    "E4": "ja",
    "E3h": "ja",
    "P0": [
     "nichts"
    ]
   },
   "ampel": "gelb",
   "status": "ausgewertet",
   "hervorgehoben": null
  },
  {
   "id": "A27",
   "name": "Knieprothese und Krampfneigung",
   "jahr": 2026,
   "antworten": {
    "W1": "ja",
    "W2": "ja",
    "W3": "selbst",
    "K1": "Test",
    "K2": 1950,
    "K3": "test@example.org",
    "K5": "nein",
    "A1": "nein",
    "A2": "nein",
    "A3": "ja",
    "B1": "nein",
    "B2": "nein",
    "B3": "nein",
    "B4": "nein",
    "B5": "nein",
    "B6": "nein",
    "B7": "nein",
    "C1": "nein",
    "C2": "nein",
    "C3": "nein",
    "C4": "nie",
    "C5": "ohne_hilfe",
    "C6": "keins",
    "D1": "nein",
    "D2": "nein",
    "E1": "nein",
    "E2": "nein",
    "E5a": "nein",
    "E6": "nein",
    "E7": "nein",
    "F1": "ja",
    "M1": "nein",
    "R0": [
     "knie",
     "oberschenkel_wade"
    ],
    "Z1": [],
    "Z2": [],
    "E3k": "nein",
    "E8": "nein",
    "E10": "ja",
    "P0": [
     "nichts"
    ]
   },
   "ampel": "gelb",
   "status": "ausgewertet",
   "hervorgehoben": null
  },
  {
   "id": "A28",
   "name": "Ischias und Hüftprothese",
   "jahr": 2026,
   "antworten": {
    "W1": "ja",
    "W2": "ja",
    "W3": "selbst",
    "K1": "Test",
    "K2": 1950,
    "K3": "test@example.org",
    "K5": "nein",
    "A1": "nein",
    "A2": "ja",
    "A3": "nein",
    "B1": "nein",
    "B2": "nein",
    "B3": "nein",
    "B4": "nein",
    "B5": "nein",
    "B6": "nein",
    "B7": "nein",
    "C1": "nein",
    "C2": "nein",
    "C3": "nein",
    "C4": "nie",
    "C5": "ohne_hilfe",
    "C6": "keins",
    "D1": "nein",
    "D2": "nein",
    "E1": "nein",
    "E2": "nein",
    "E5a": "nein",
    "E6": "nein",
    "E7": "nein",
    "F1": "ja",
    "M1": "nein",
    "R0": [
     "ruecken",
     "hueft"
    ],
    "Z1": [],
    "Z2": [],
    "E5": "ja",
    "E9": "nein",
    "A2a": "nein",
    "E3h": "nein",
    "P0": [
     "nichts"
    ]
   },
   "ampel": "gelb",
   "status": "ausgewertet",
   "hervorgehoben": null
  },
  {
   "id": "A29",
   "name": "Herzschwäche und Schwindel beim Hinlegen",
   "jahr": 2026,
   "antworten": {
    "W1": "ja",
    "W2": "ja",
    "W3": "selbst",
    "K1": "Test",
    "K2": 1950,
    "K3": "test@example.org",
    "K5": "nein",
    "A1": "nein",
    "A2": "nein",
    "A3": "nein",
    "B1": "nein",
    "B2": "nein",
    "B3": "ja",
    "B4": "nein",
    "B5": "nein",
    "B6": "nein",
    "B7": "nein",
    "C1": "nein",
    "C2": "ja",
    "C3": "nein",
    "C4": "nie",
    "C5": "ohne_hilfe",
    "C6": "keins",
    "D1": "nein",
    "D2": "nein",
    "E1": "nein",
    "E2": "nein",
    "E5a": "nein",
    "E6": "nein",
    "E7": "nein",
    "F1": "ja",
    "M1": "nein",
    "R0": [
     "nichts"
    ],
    "Z1": [],
    "Z2": []
   },
   "ampel": "gelb",
   "status": "ausgewertet",
   "hervorgehoben": null
  },
  {
   "id": "A30",
   "name": "Arzt riet vom Training ab",
   "jahr": 2026,
   "antworten": {
    "W1": "ja",
    "W2": "ja",
    "W3": "selbst",
    "K1": "Test",
    "K2": 1950,
    "K3": "test@example.org",
    "K5": "nein",
    "A1": "nein",
    "A2": "nein",
    "A3": "nein",
    "B1": "nein",
    "B2": "nein",
    "B3": "nein",
    "B4": "nein",
    "B5": "nein",
    "B6": "nein",
    "B7": "nein",
    "C1": "nein",
    "C2": "nein",
    "C3": "nein",
    "C4": "nie",
    "C5": "ohne_hilfe",
    "C6": "keins",
    "D1": "nein",
    "D2": "nein",
    "E1": "nein",
    "E2": "ja",
    "E5a": "nein",
    "E6": "nein",
    "E7": "nein",
    "F1": "ja",
    "M1": "nein",
    "R0": [
     "nichts"
    ],
    "Z1": [],
    "Z2": []
   },
   "ampel": "rot",
   "status": "ausgewertet",
   "hervorgehoben": null
  },
  {
   "id": "N01",
   "name": "Knie angegeben, alle Folgefragen Nein: Genaueres unklar",
   "jahr": 2026,
   "antworten": {
    "W1": "ja",
    "W2": "ja",
    "W3": "selbst",
    "K1": "Test",
    "K2": 1950,
    "K3": "test@example.org",
    "K5": "nein",
    "A1": "nein",
    "A2": "nein",
    "A3": "nein",
    "B1": "nein",
    "B2": "nein",
    "B3": "nein",
    "B4": "nein",
    "B5": "nein",
    "B6": "nein",
    "B7": "nein",
    "C1": "nein",
    "C2": "nein",
    "C3": "nein",
    "C4": "nie",
    "C5": "ohne_hilfe",
    "C6": "keins",
    "D1": "nein",
    "D2": "nein",
    "E1": "nein",
    "E2": "nein",
    "E5a": "nein",
    "E6": "nein",
    "E7": "nein",
    "F1": "ja",
    "M1": "nein",
    "R0": [
     "knie"
    ],
    "Z1": [],
    "Z2": [],
    "E3k": "nein",
    "E8": "nein",
    "P0": [
     "nichts"
    ]
   },
   "ampel": "gelb",
   "status": "ausgewertet",
   "hervorgehoben": null
  },
  {
   "id": "N02",
   "name": "Nacken angegeben, Folgefrage Nein: kein Baustein betroffen",
   "jahr": 2026,
   "antworten": {
    "W1": "ja",
    "W2": "ja",
    "W3": "selbst",
    "K1": "Test",
    "K2": 1950,
    "K3": "test@example.org",
    "K5": "nein",
    "A1": "nein",
    "A2": "nein",
    "A3": "nein",
    "B1": "nein",
    "B2": "nein",
    "B3": "nein",
    "B4": "nein",
    "B5": "nein",
    "B6": "nein",
    "B7": "nein",
    "C1": "nein",
    "C2": "nein",
    "C3": "nein",
    "C4": "nie",
    "C5": "ohne_hilfe",
    "C6": "keins",
    "D1": "nein",
    "D2": "nein",
    "E1": "nein",
    "E2": "nein",
    "E5a": "nein",
    "E6": "nein",
    "E7": "nein",
    "F1": "ja",
    "M1": "nein",
    "R0": [
     "nacken"
    ],
    "Z1": [],
    "Z2": [],
    "E11": "nein",
    "P0": [
     "nichts"
    ]
   },
   "ampel": "gelb",
   "status": "ausgewertet",
   "hervorgehoben": null
  },
  {
   "id": "N03",
   "name": "Knie, Arthrose Weiß nicht: vorsichtshalber gesetzt, Region erklärt",
   "jahr": 2026,
   "antworten": {
    "W1": "ja",
    "W2": "ja",
    "W3": "selbst",
    "K1": "Test",
    "K2": 1950,
    "K3": "test@example.org",
    "K5": "nein",
    "A1": "nein",
    "A2": "nein",
    "A3": "nein",
    "B1": "nein",
    "B2": "nein",
    "B3": "nein",
    "B4": "nein",
    "B5": "nein",
    "B6": "nein",
    "B7": "nein",
    "C1": "nein",
    "C2": "nein",
    "C3": "nein",
    "C4": "nie",
    "C5": "ohne_hilfe",
    "C6": "keins",
    "D1": "nein",
    "D2": "nein",
    "E1": "nein",
    "E2": "nein",
    "E5a": "nein",
    "E6": "nein",
    "E7": "nein",
    "F1": "ja",
    "M1": "nein",
    "R0": [
     "knie"
    ],
    "Z1": [],
    "Z2": [],
    "E3k": "nein",
    "E8": "wn",
    "P0": [
     "nichts"
    ]
   },
   "ampel": "gelb",
   "status": "ausgewertet",
   "hervorgehoben": null
  },
  {
   "id": "N04",
   "name": "Operation in den letzten 3 Monaten: Weiß nicht",
   "jahr": 2026,
   "antworten": {
    "W1": "ja",
    "W2": "ja",
    "W3": "selbst",
    "K1": "Test",
    "K2": 1950,
    "K3": "test@example.org",
    "K5": "nein",
    "A1": "wn",
    "A2": "nein",
    "A3": "nein",
    "B1": "nein",
    "B2": "nein",
    "B3": "nein",
    "B4": "nein",
    "B5": "nein",
    "B6": "nein",
    "B7": "nein",
    "C1": "nein",
    "C2": "nein",
    "C3": "nein",
    "C4": "nie",
    "C5": "ohne_hilfe",
    "C6": "keins",
    "D1": "nein",
    "D2": "nein",
    "E1": "nein",
    "E2": "nein",
    "E5a": "nein",
    "E6": "nein",
    "E7": "nein",
    "F1": "ja",
    "M1": "nein",
    "R0": [
     "nichts"
    ],
    "Z1": [],
    "Z2": []
   },
   "ampel": "orange",
   "status": "ausgewertet",
   "hervorgehoben": null
  },
  {
   "id": "N05",
   "name": "Atemnot im Liegen: Weiß nicht",
   "jahr": 2026,
   "antworten": {
    "W1": "ja",
    "W2": "ja",
    "W3": "selbst",
    "K1": "Test",
    "K2": 1950,
    "K3": "test@example.org",
    "K5": "nein",
    "A1": "nein",
    "A2": "nein",
    "A3": "nein",
    "B1": "nein",
    "B2": "nein",
    "B3": "nein",
    "B4": "nein",
    "B5": "nein",
    "B6": "nein",
    "B7": "wn",
    "C1": "nein",
    "C2": "nein",
    "C3": "nein",
    "C4": "nie",
    "C5": "ohne_hilfe",
    "C6": "keins",
    "D1": "nein",
    "D2": "nein",
    "E1": "nein",
    "E2": "nein",
    "E5a": "nein",
    "E6": "nein",
    "E7": "nein",
    "F1": "ja",
    "M1": "nein",
    "R0": [
     "nichts"
    ],
    "Z1": [],
    "Z2": []
   },
   "ampel": "orange",
   "status": "ausgewertet",
   "hervorgehoben": null
  },
  {
   "id": "N06",
   "name": "Pflichtfrage A1 fehlt: keine Ampel",
   "jahr": 2026,
   "antworten": {
    "W1": "ja",
    "W2": "ja",
    "W3": "selbst",
    "K1": "Test",
    "K2": 1950,
    "K3": "test@example.org",
    "K5": "nein",
    "A2": "nein",
    "A3": "nein",
    "B1": "nein",
    "B2": "nein",
    "B3": "nein",
    "B4": "nein",
    "B5": "nein",
    "B6": "nein",
    "B7": "nein",
    "C1": "nein",
    "C2": "nein",
    "C3": "nein",
    "C4": "nie",
    "C5": "ohne_hilfe",
    "C6": "keins",
    "D1": "nein",
    "D2": "nein",
    "E1": "nein",
    "E2": "nein",
    "E5a": "nein",
    "E6": "nein",
    "E7": "nein",
    "F1": "ja",
    "M1": "nein",
    "R0": [
     "nichts"
    ],
    "Z1": [],
    "Z2": []
   },
   "ampel": null,
   "status": "unvollstaendig",
   "hervorgehoben": null
  },
  {
   "id": "N09",
   "name": "Alter 96 und ein Gelb Zustand: O6",
   "jahr": 2026,
   "antworten": {
    "W1": "ja",
    "W2": "ja",
    "W3": "selbst",
    "K1": "Test",
    "K2": 1930,
    "K3": "test@example.org",
    "K5": "nein",
    "A1": "nein",
    "A2": "nein",
    "A3": "nein",
    "B1": "nein",
    "B2": "nein",
    "B3": "nein",
    "B4": "ja",
    "B5": "nein",
    "B6": "nein",
    "B7": "nein",
    "C1": "nein",
    "C2": "nein",
    "C3": "nein",
    "C4": "nie",
    "C5": "ohne_hilfe",
    "C6": "keins",
    "D1": "nein",
    "D2": "nein",
    "E1": "nein",
    "E2": "nein",
    "E5a": "nein",
    "E6": "nein",
    "E7": "nein",
    "F1": "ja",
    "M1": "nein",
    "R0": [
     "nichts"
    ],
    "Z1": [],
    "Z2": []
   },
   "ampel": "orange",
   "status": "ausgewertet",
   "hervorgehoben": null
  },
  {
   "id": "N10",
   "name": "Drei Gruppen: Gelenkersatz, Sturz, Kreislauf: O4",
   "jahr": 2026,
   "antworten": {
    "W1": "ja",
    "W2": "ja",
    "W3": "selbst",
    "K1": "Test",
    "K2": 1950,
    "K3": "test@example.org",
    "K5": "nein",
    "A1": "nein",
    "A2": "ja",
    "A3": "nein",
    "B1": "nein",
    "B2": "nein",
    "B3": "nein",
    "B4": "ja",
    "B5": "nein",
    "B6": "nein",
    "B7": "nein",
    "C1": "nein",
    "C2": "nein",
    "C3": "ja",
    "C4": "nie",
    "C5": "ohne_hilfe",
    "C6": "keins",
    "D1": "nein",
    "D2": "nein",
    "E1": "nein",
    "E2": "nein",
    "E5a": "nein",
    "E6": "nein",
    "E7": "nein",
    "F1": "ja",
    "M1": "nein",
    "R0": [
     "hueft"
    ],
    "Z1": [],
    "Z2": [],
    "C3a": "ja",
    "C3b": "laenger_her",
    "A2a": "nein",
    "E3h": "nein",
    "P0": [
     "nichts"
    ]
   },
   "ampel": "orange",
   "status": "ausgewertet",
   "hervorgehoben": null
  },
  {
   "id": "N11",
   "name": "Abgeklärter Sturz und große Angst: O5",
   "jahr": 2026,
   "antworten": {
    "W1": "ja",
    "W2": "ja",
    "W3": "selbst",
    "K1": "Test",
    "K2": 1950,
    "K3": "test@example.org",
    "K5": "nein",
    "A1": "nein",
    "A2": "nein",
    "A3": "nein",
    "B1": "nein",
    "B2": "nein",
    "B3": "nein",
    "B4": "nein",
    "B5": "nein",
    "B6": "nein",
    "B7": "nein",
    "C1": "nein",
    "C2": "nein",
    "C3": "ja",
    "C4": "manchmal",
    "C5": "ohne_hilfe",
    "C6": "keins",
    "D1": "nein",
    "D2": "nein",
    "E1": "nein",
    "E2": "nein",
    "E5a": "nein",
    "E6": "nein",
    "E7": "nein",
    "F1": "ja",
    "M1": "nein",
    "R0": [
     "nichts"
    ],
    "Z1": [],
    "Z2": [],
    "C3a": "ja",
    "C3b": "laenger_her",
    "C4a": 4
   },
   "ampel": "orange",
   "status": "ausgewertet",
   "hervorgehoben": null
  },
  {
   "id": "N12",
   "name": "Angehörige ohne Vollmacht: O1",
   "jahr": 2026,
   "antworten": {
    "W1": "ja",
    "W2": "ja",
    "W3": "jemand_anderes",
    "K1": "Test",
    "K2": 1950,
    "K3": "test@example.org",
    "K5": "nein",
    "A1": "nein",
    "A2": "nein",
    "A3": "nein",
    "B1": "nein",
    "B2": "nein",
    "B3": "nein",
    "B4": "nein",
    "B5": "nein",
    "B6": "nein",
    "B7": "nein",
    "C1": "nein",
    "C2": "nein",
    "C3": "nein",
    "C4": "nie",
    "C5": "ohne_hilfe",
    "C6": "keins",
    "D1": "nein",
    "D2": "nein",
    "E1": "nein",
    "E2": "nein",
    "E5a": "nein",
    "E6": "nein",
    "E7": "nein",
    "F1": "ja",
    "M1": "nein",
    "R0": [
     "nichts"
    ],
    "Z1": [],
    "Z2": [],
    "W3a": "nein",
    "W3b": "Sabine"
   },
   "ampel": "orange",
   "status": "ausgewertet",
   "hervorgehoben": null
  },
  {
   "id": "N13",
   "name": "Keine Einwilligung",
   "jahr": 2026,
   "antworten": {
    "W1": "nein",
    "W2": "ja",
    "W3": "selbst",
    "K1": "Test",
    "K2": 1950,
    "K3": "test@example.org",
    "K5": "nein",
    "A1": "nein",
    "A2": "nein",
    "A3": "nein",
    "B1": "nein",
    "B2": "nein",
    "B3": "nein",
    "B4": "nein",
    "B5": "nein",
    "B6": "nein",
    "B7": "nein",
    "C1": "nein",
    "C2": "nein",
    "C3": "nein",
    "C4": "nie",
    "C5": "ohne_hilfe",
    "C6": "keins",
    "D1": "nein",
    "D2": "nein",
    "E1": "nein",
    "E2": "nein",
    "E5a": "nein",
    "E6": "nein",
    "E7": "nein",
    "F1": "ja",
    "M1": "nein",
    "R0": [
     "nichts"
    ],
    "Z1": [],
    "Z2": []
   },
   "ampel": null,
   "status": "keine_einwilligung",
   "hervorgehoben": null
  },
  {
   "id": "N14",
   "name": "Nie unsicher, aber Rollator: Widerspruch O7, Niveau B",
   "jahr": 2026,
   "antworten": {
    "W1": "ja",
    "W2": "ja",
    "W3": "selbst",
    "K1": "Test",
    "K2": 1950,
    "K3": "test@example.org",
    "K5": "nein",
    "A1": "nein",
    "A2": "nein",
    "A3": "nein",
    "B1": "nein",
    "B2": "nein",
    "B3": "nein",
    "B4": "nein",
    "B5": "nein",
    "B6": "nein",
    "B7": "nein",
    "C1": "nein",
    "C2": "nein",
    "C3": "nein",
    "C4": "nie",
    "C5": "ohne_hilfe",
    "C6": "rollator",
    "D1": "nein",
    "D2": "nein",
    "E1": "nein",
    "E2": "nein",
    "E5a": "nein",
    "E6": "nein",
    "E7": "nein",
    "F1": "ja",
    "M1": "nein",
    "R0": [
     "nichts"
    ],
    "Z1": [],
    "Z2": []
   },
   "ampel": "orange",
   "status": "ausgewertet",
   "hervorgehoben": null
  },
  {
   "id": "N15",
   "name": "Musterfall Ilse aus Dokument 12",
   "jahr": 2026,
   "antworten": {
    "W1": "ja",
    "W2": "ja",
    "W3": "jemand_anderes",
    "K1": "Ilse",
    "K2": 1942,
    "K3": "test@example.org",
    "K5": "nein",
    "A1": "nein",
    "A2": "ja",
    "A3": "nein",
    "B1": "nein",
    "B2": "nein",
    "B3": "nein",
    "B4": "ja",
    "B5": "nein",
    "B6": "nein",
    "B7": "nein",
    "C1": "nein",
    "C2": "nein",
    "C3": "ja",
    "C4": "manchmal",
    "C5": "abstuetzen",
    "C6": "rollator",
    "D1": "nein",
    "D2": "nein",
    "E1": "nein",
    "E2": "nein",
    "E5a": "nein",
    "E6": "nein",
    "E7": "nein",
    "F1": "ja",
    "M1": "nein",
    "R0": [
     "hueft"
    ],
    "Z1": [
     "treppen",
     "spazierengehen"
    ],
    "Z2": [
     "ruecken"
    ],
    "W3a": "ja",
    "W3b": "Sabine",
    "A2a": "nein",
    "C3a": "ja",
    "C3b": "laenger_her",
    "C4a": 3,
    "E3h": "nein",
    "Z3": [
     "spazieren"
    ],
    "P0": [
     "nichts"
    ]
   },
   "ampel": "orange",
   "status": "ausgewertet",
   "hervorgehoben": "orange"
  },
  {
   "id": "N16",
   "name": "Rot schlägt Orange: Brustschmerz und neue Schmerzen",
   "jahr": 2026,
   "antworten": {
    "W1": "ja",
    "W2": "ja",
    "W3": "selbst",
    "K1": "Test",
    "K2": 1950,
    "K3": "test@example.org",
    "K5": "nein",
    "A1": "nein",
    "A2": "nein",
    "A3": "nein",
    "B1": "ja",
    "B2": "nein",
    "B3": "nein",
    "B4": "nein",
    "B5": "nein",
    "B6": "nein",
    "B7": "nein",
    "C1": "nein",
    "C2": "nein",
    "C3": "nein",
    "C4": "nie",
    "C5": "ohne_hilfe",
    "C6": "keins",
    "D1": "nein",
    "D2": "nein",
    "E1": "nein",
    "E2": "nein",
    "E5a": "nein",
    "E6": "nein",
    "E7": "ja",
    "F1": "ja",
    "M1": "nein",
    "R0": [
     "nichts"
    ],
    "Z1": [],
    "Z2": []
   },
   "ampel": "rot",
   "status": "ausgewertet",
   "hervorgehoben": "rot"
  },
  {
   "id": "N17",
   "name": "Sturz ohne Arzt: Rot, strittige Regel wird gemeldet",
   "jahr": 2026,
   "antworten": {
    "W1": "ja",
    "W2": "ja",
    "W3": "selbst",
    "K1": "Test",
    "K2": 1950,
    "K3": "test@example.org",
    "K5": "nein",
    "A1": "nein",
    "A2": "nein",
    "A3": "nein",
    "B1": "nein",
    "B2": "nein",
    "B3": "nein",
    "B4": "nein",
    "B5": "nein",
    "B6": "nein",
    "B7": "nein",
    "C1": "nein",
    "C2": "nein",
    "C3": "ja",
    "C4": "nie",
    "C5": "ohne_hilfe",
    "C6": "keins",
    "D1": "nein",
    "D2": "nein",
    "E1": "nein",
    "E2": "nein",
    "E5a": "nein",
    "E6": "nein",
    "E7": "nein",
    "F1": "ja",
    "M1": "nein",
    "R0": [
     "nichts"
    ],
    "Z1": [],
    "Z2": [],
    "C3a": "nein",
    "C3b": "letzte_3_monate"
   },
   "ampel": "rot",
   "status": "ausgewertet",
   "hervorgehoben": null
  },
  {
   "id": "N18",
   "name": "Sturz Weiß nicht: Orange O11, keine Folgefrage",
   "jahr": 2026,
   "antworten": {
    "W1": "ja",
    "W2": "ja",
    "W3": "selbst",
    "K1": "Test",
    "K2": 1950,
    "K3": "test@example.org",
    "K5": "nein",
    "A1": "nein",
    "A2": "nein",
    "A3": "nein",
    "B1": "nein",
    "B2": "nein",
    "B3": "nein",
    "B4": "nein",
    "B5": "nein",
    "B6": "nein",
    "B7": "nein",
    "C1": "nein",
    "C2": "nein",
    "C3": "wn",
    "C4": "nie",
    "C5": "ohne_hilfe",
    "C6": "keins",
    "D1": "nein",
    "D2": "nein",
    "E1": "nein",
    "E2": "nein",
    "E5a": "nein",
    "E6": "nein",
    "E7": "nein",
    "F1": "ja",
    "M1": "nein",
    "R0": [
     "nichts"
    ],
    "Z1": [],
    "Z2": []
   },
   "ampel": "orange",
   "status": "ausgewertet",
   "hervorgehoben": null
  },
  {
   "id": "N19",
   "name": "Osteoporose Weiß nicht: Orange und vorsichtshalber gesetzt",
   "jahr": 2026,
   "antworten": {
    "W1": "ja",
    "W2": "ja",
    "W3": "selbst",
    "K1": "Test",
    "K2": 1950,
    "K3": "test@example.org",
    "K5": "nein",
    "A1": "nein",
    "A2": "nein",
    "A3": "nein",
    "B1": "nein",
    "B2": "nein",
    "B3": "nein",
    "B4": "nein",
    "B5": "nein",
    "B6": "nein",
    "B7": "nein",
    "C1": "nein",
    "C2": "nein",
    "C3": "nein",
    "C4": "nie",
    "C5": "ohne_hilfe",
    "C6": "keins",
    "D1": "nein",
    "D2": "wn",
    "E1": "nein",
    "E2": "nein",
    "E5a": "nein",
    "E6": "nein",
    "E7": "nein",
    "F1": "ja",
    "M1": "nein",
    "R0": [
     "nichts"
    ],
    "Z1": [],
    "Z2": []
   },
   "ampel": "orange",
   "status": "ausgewertet",
   "hervorgehoben": null
  },
  {
   "id": "N20",
   "name": "Alle sieben Regionen angegeben, alles Nein",
   "jahr": 2026,
   "antworten": {
    "W1": "ja",
    "W2": "ja",
    "W3": "selbst",
    "K1": "Test",
    "K2": 1950,
    "K3": "test@example.org",
    "K5": "nein",
    "A1": "nein",
    "A2": "nein",
    "A3": "nein",
    "B1": "nein",
    "B2": "nein",
    "B3": "nein",
    "B4": "nein",
    "B5": "nein",
    "B6": "nein",
    "B7": "nein",
    "C1": "nein",
    "C2": "nein",
    "C3": "nein",
    "C4": "nie",
    "C5": "ohne_hilfe",
    "C6": "keins",
    "D1": "nein",
    "D2": "nein",
    "E1": "nein",
    "E2": "nein",
    "E5a": "nein",
    "E6": "nein",
    "E7": "nein",
    "F1": "ja",
    "M1": "nein",
    "R0": [
     "nacken",
     "schulter",
     "ruecken",
     "hueft",
     "knie",
     "oberschenkel_wade",
     "fuss"
    ],
    "Z1": [],
    "Z2": [],
    "E3h": "nein",
    "E3k": "nein",
    "E8": "nein",
    "E3f": "nein",
    "E4": "nein",
    "E5": "nein",
    "E9": "nein",
    "E10": "nein",
    "E11": "nein",
    "P0": [
     "nichts"
    ]
   },
   "ampel": "gelb",
   "status": "ausgewertet",
   "hervorgehoben": null
  },
  {
   "id": "N21",
   "name": "Warnzeichen am Nerv: Weiß nicht gilt als Orange",
   "jahr": 2026,
   "antworten": {
    "W1": "ja",
    "W2": "ja",
    "W3": "selbst",
    "K1": "Test",
    "K2": 1950,
    "K3": "test@example.org",
    "K5": "nein",
    "A1": "nein",
    "A2": "nein",
    "A3": "nein",
    "B1": "nein",
    "B2": "nein",
    "B3": "nein",
    "B4": "nein",
    "B5": "nein",
    "B6": "nein",
    "B7": "nein",
    "C1": "nein",
    "C2": "nein",
    "C3": "nein",
    "C4": "nie",
    "C5": "ohne_hilfe",
    "C6": "keins",
    "D1": "nein",
    "D2": "nein",
    "E1": "nein",
    "E2": "nein",
    "E5a": "wn",
    "E6": "nein",
    "E7": "nein",
    "F1": "ja",
    "M1": "nein",
    "R0": [
     "nichts"
    ],
    "Z1": [],
    "Z2": []
   },
   "ampel": "orange",
   "status": "ausgewertet",
   "hervorgehoben": null
  },
  {
   "id": "N22",
   "name": "Nur Steifheit im Knie: Ziel wird automatisch gesetzt",
   "jahr": 2026,
   "antworten": {
    "W1": "ja",
    "W2": "ja",
    "W3": "selbst",
    "K1": "Test",
    "K2": 1950,
    "K3": "test@example.org",
    "K5": "nein",
    "A1": "nein",
    "A2": "nein",
    "A3": "nein",
    "B1": "nein",
    "B2": "nein",
    "B3": "nein",
    "B4": "nein",
    "B5": "nein",
    "B6": "nein",
    "B7": "nein",
    "C1": "nein",
    "C2": "nein",
    "C3": "nein",
    "C4": "nie",
    "C5": "ohne_hilfe",
    "C6": "keins",
    "D1": "nein",
    "D2": "nein",
    "E1": "nein",
    "E2": "nein",
    "E5a": "nein",
    "E6": "nein",
    "E7": "nein",
    "F1": "ja",
    "M1": "nein",
    "R0": [
     "nichts"
    ],
    "Z1": [],
    "Z2": [
     "knie"
    ]
   },
   "ampel": "gruen",
   "status": "ausgewertet",
   "hervorgehoben": null
  },
  {
   "id": "N23",
   "name": "Zwei mögliche Ziele, Z3 fehlt: keine Ampel",
   "jahr": 2026,
   "antworten": {
    "W1": "ja",
    "W2": "ja",
    "W3": "selbst",
    "K1": "Test",
    "K2": 1950,
    "K3": "test@example.org",
    "K5": "nein",
    "A1": "nein",
    "A2": "nein",
    "A3": "nein",
    "B1": "nein",
    "B2": "nein",
    "B3": "nein",
    "B4": "nein",
    "B5": "nein",
    "B6": "nein",
    "B7": "nein",
    "C1": "nein",
    "C2": "nein",
    "C3": "nein",
    "C4": "nie",
    "C5": "ohne_hilfe",
    "C6": "keins",
    "D1": "nein",
    "D2": "nein",
    "E1": "nein",
    "E2": "nein",
    "E5a": "nein",
    "E6": "nein",
    "E7": "nein",
    "F1": "ja",
    "M1": "nein",
    "R0": [
     "nichts"
    ],
    "Z1": [
     "treppen",
     "einkaufen"
    ],
    "Z2": []
   },
   "ampel": null,
   "status": "unvollstaendig",
   "hervorgehoben": null
  },
  {
   "id": "N24",
   "name": "Rot bei Warnzeichen am Nerv, auch ohne Rückenregion",
   "jahr": 2026,
   "antworten": {
    "W1": "ja",
    "W2": "ja",
    "W3": "selbst",
    "K1": "Test",
    "K2": 1950,
    "K3": "test@example.org",
    "K5": "nein",
    "A1": "nein",
    "A2": "nein",
    "A3": "nein",
    "B1": "nein",
    "B2": "nein",
    "B3": "nein",
    "B4": "nein",
    "B5": "nein",
    "B6": "nein",
    "B7": "nein",
    "C1": "nein",
    "C2": "nein",
    "C3": "nein",
    "C4": "nie",
    "C5": "ohne_hilfe",
    "C6": "keins",
    "D1": "nein",
    "D2": "nein",
    "E1": "nein",
    "E2": "nein",
    "E5a": "ja",
    "E6": "nein",
    "E7": "nein",
    "F1": "ja",
    "M1": "nein",
    "R0": [
     "nichts"
    ],
    "Z1": [],
    "Z2": []
   },
   "ampel": "rot",
   "status": "ausgewertet",
   "hervorgehoben": null
  },
  {
   "id": "N25",
   "name": "Muskelverletzung Weiß nicht: vorsichtshalber gesperrt",
   "jahr": 2026,
   "antworten": {
    "W1": "ja",
    "W2": "ja",
    "W3": "selbst",
    "K1": "Test",
    "K2": 1950,
    "K3": "test@example.org",
    "K5": "nein",
    "A1": "nein",
    "A2": "nein",
    "A3": "nein",
    "B1": "nein",
    "B2": "nein",
    "B3": "nein",
    "B4": "nein",
    "B5": "nein",
    "B6": "nein",
    "B7": "nein",
    "C1": "nein",
    "C2": "nein",
    "C3": "nein",
    "C4": "nie",
    "C5": "ohne_hilfe",
    "C6": "keins",
    "D1": "nein",
    "D2": "nein",
    "E1": "nein",
    "E2": "nein",
    "E5a": "nein",
    "E6": "wn",
    "E7": "nein",
    "F1": "ja",
    "M1": "nein",
    "R0": [
     "oberschenkel_wade"
    ],
    "Z1": [],
    "Z2": [],
    "E10": "nein",
    "P0": [
     "nichts"
    ]
   },
   "ampel": "gelb",
   "status": "ausgewertet",
   "hervorgehoben": null
  }
 ]
};
