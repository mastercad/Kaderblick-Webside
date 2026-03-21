# Administration

Der Admin-Bereich ist für Administratoren und berechtigte Trainer gedacht. Hier werden Nutzer verwaltet, Verknüpfungen bestätigt, Stammdaten gepflegt und Feedback bearbeitet.

---

## So funktioniert der Admin-Bereich

Alle Verwaltungsseiten (Spieler, Trainer, Teams, Vereine und Stammdaten) sind **gleich aufgebaut** — wer sich auf einer Seite zurechtfindet, findet sich sofort auf allen anderen zurecht.

### Auf jeder Verwaltungsseite könnt ihr:

- **Suchen**: Gebt einen Namen oder Begriff ein, um die Liste sofort zu filtern. Bei Spielern und Trainern könnt ihr zusätzlich nach einem bestimmten **Team** filtern.
- **Blättern**: Bei vielen Einträgen blättert ihr bequem durch die Seiten und stellt ein, wie viele Einträge auf einmal angezeigt werden sollen.
- **Neue Einträge anlegen**: Über den Erstellen-Button (z. B. „Spieler hinzufügen") legt ihr neue Einträge an.
- **Einträge bearbeiten oder löschen**: Jeder Eintrag kann bearbeitet oder gelöscht werden.
- **Gesamtzahl sehen**: Ihr seht jederzeit, wie viele Einträge insgesamt vorhanden sind — auch wenn ihr gerade nach etwas sucht.

> 💡 Diese einheitliche Bedienung macht es einfach, sich im Admin-Bereich zurechtzufinden — wer einmal eine Seite kennt, kommt sofort überall klar.

---

## Nutzer-Verknüpfungen verwalten

Unter **Admin → Nutzer-Verknüpfungen** könnt ihr sehen und verwalten, welche Nutzer-Accounts mit welchen Spielern/Trainern verknüpft sind.

### Übersicht

Die Tabelle zeigt alle Verknüpfungen:

| Spalte | Beschreibung |
|--------|-------------|
| **Nutzer** | Name und E-Mail des Nutzer-Accounts |
| **Verknüpft mit** | Spieler- oder Trainer-Name |
| **Beziehungstyp** | z. B. „Elternteil", „Selbst" |
| **Status** | Aktiv oder Inaktiv |
| **Berechtigungen** | Welche Rechte hat die Verknüpfung? |

### Verknüpfung bestätigen

Wenn ein Nutzer eine neue Verknüpfung anfragt (z. B. „Ich bin Elternteil von Max Mustermann"), erscheint sie hier als **„Inaktiv"**:

1. Prüft, ob die Verknüpfung korrekt ist
2. Klickt auf **„Aktivieren"** → die Verknüpfung wird aktiv
3. Der Nutzer erhält Zugriff auf die Daten des verknüpften Spielers/Trainers

### Verknüpfung deaktivieren

Falls eine Verknüpfung nicht mehr gültig ist:

1. Klickt auf **„Deaktivieren"**
2. Der Nutzer verliert den Zugriff auf die verknüpften Daten

### Rollen anpassen

In der Verknüpfungs-Verwaltung könnt ihr auch die **Rollen** eines Nutzers anpassen:

- **Neue Rolle hinzufügen** — z. B. „Trainer" oder „Admin"
- **Rolle entfernen** — z. B. wenn jemand nicht mehr Trainer ist
- Die verfügbaren Rollen: **ROLE_USER** (Standard), **ROLE_TRAINER**, **ROLE_ADMIN**

### Verifizierungs-Mail erneut senden

Falls ein Nutzer seine Bestätigungs-Mail nicht erhalten hat:

1. Findet den Nutzer in der Liste
2. Klickt auf **„Verifizierungs-Mail erneut senden"**
3. Der Nutzer erhält eine neue Mail mit Bestätigungslink

---

## Titel- & XP-Übersicht

Unter **Admin → Titel & XP** findet ihr eine Gesamtübersicht des XP- und Titel-Systems.

### Titel-Tabelle

Alle im System vergebenen Titel, sortiert nach Geltungsbereich → Name → Rang:

| Spalte | Beschreibung |
|--------|-------------|
| **Kategorie** | z. B. „Torschützenkönig", „Bester Spieler" |
| **Rang** | z. B. Gold, Silber, Bronze |
| **Geltungsbereich (Scope)** | Team, Liga oder Übergreifend |
| **Spieler** | Wem gehört der Titel? |
| **Team** | In welchem Team (falls teamspezifisch) |
| **Liga** | In welcher Liga (falls ligaspezifisch) |
| **Wert** | Numerischer Wert (z. B. 15 Tore) |
| **Vergeben am** | Datum der Vergabe |
| **Saison** | In welcher Saison |
| **Aktiv** | Ob der Titel aktuell gültig ist |

### Nutzer-Level-Tabelle

Zeigt alle Nutzer mit ihren **XP-Levels**:

| Spalte | Beschreibung |
|--------|-------------|
| **Nutzer** | Name des Nutzers |
| **Level** | Aktuelles Level |
| **XP gesamt** | Gesamte Erfahrungspunkte |
| **Zuletzt aktualisiert** | Wann die XP zuletzt berechnet wurden |

### XP-Regeln

Die XP-Regeln definieren, **wie viele Punkte** für welche Aktion vergeben werden:

| Feld | Beschreibung |
|------|-------------|
| **Aktionstyp** | z. B. „participation_confirmed", „task_completed", „survey_answered" |
| **Bezeichnung** | Menschenlesbare Beschreibung (z. B. „Teilnahme bestätigt") |
| **XP-Wert** | Wie viele XP werden vergeben (z. B. 10) |
| **Tägliches Limit** | Maximal-Anzahl pro Tag (verhindert Missbrauch) |

**Typische XP-Aktionen:**

| Aktion | Typische XP |
|--------|------------|
| Teilnahme an Training/Spiel bestätigt | 10 XP |
| Aufgabe erledigt | 25 XP |
| An Umfrage teilgenommen | 15 XP |
| Feedback gesendet | 20 XP |
| Nachricht geschrieben | 5 XP |

> 💡 Die genauen Werte und Aktionen können von Administratoren konfiguriert werden.

---

## Feedback verwalten

Unter **Admin → Feedback** seht ihr alles, was Nutzer über den Feedback-Button gemeldet haben.

### Drei Tabs

Das Feedback ist in **drei Bereiche** aufgeteilt:

| Tab | Beschreibung |
|-----|-------------|
| **Neues** | Frisch eingegangenes Feedback, noch nicht bearbeitet |
| **In Bearbeitung** | Feedback, das gerade bearbeitet wird |
| **Erledigt** | Abgeschlossenes Feedback |

### Feedback-Detail

Jedes Feedback enthält:

| Feld | Beschreibung |
|------|-------------|
| **Nutzer** | Wer hat das Feedback gesendet? |
| **Typ** | 🐛 Fehler (Bug), 💡 Verbesserung (Feature), ❓ Frage, 📝 Sonstiges |
| **Nachricht** | Der eigentliche Feedback-Text |
| **URL** | Auf welcher Seite war der Nutzer, als er das Feedback geschickt hat? |
| **Browser** | Welcher Browser und welches Gerät (User-Agent) |
| **Screenshot** | Falls vorhanden — ein automatisch erstelltes Bildschirmfoto der Seite |
| **Datum** | Wann wurde das Feedback gesendet? |

### Feedback bearbeiten

1. Klickt auf ein Feedback
2. **Status ändern**: Neues → In Bearbeitung → Erledigt
3. **Admin-Notiz** schreiben: Interne Notiz für andere Admins (z. B. „Wurde in Version 2.3 behoben")
4. **Screenshot ansehen**: Falls vorhanden, klickt auf den Screenshot, um ihn in voller Größe zu sehen

### Screenshot-Funktion

Der Screenshot wird **automatisch** erstellt, wenn der Nutzer das Feedback-Formular abschickt:

- Es wird ein Bildschirmfoto der **aktuellen Seite** erstellt (ohne das Feedback-Formular selbst)
- Der Screenshot hilft euch, den Kontext zu verstehen — ihr seht genau, was der Nutzer gesehen hat
- Bei Fehlern besonders wertvoll: Ihr seht den Fehlerzustand direkt im Bild

---

## Stammdaten-Verwaltung

Im Admin-Bereich könnt ihr die **Stammdaten** pflegen, die überall in Kaderblick verwendet werden:

### Standorte (Locations)

Spielorte und Trainingsplätze:

| Feld | Beschreibung |
|------|-------------|
| **Name** | z. B. „Sportplatz Am Waldrand" |
| **Adresse** | Straße und Hausnummer |
| **Stadt** | Ort |
| **Kapazität** | Wie viele Zuschauer passen rein? |
| **Bodenbelag** | Rasen, Kunstrasen, Asche, Halle, ... |
| **Flutlicht** | Ja/Nein |
| **Ausstattung** | Weitere Infos (z. B. „Umkleidekabinen, Duschen") |
| **Breitengrad / Längengrad** | GPS-Koordinaten (für Wetter-Abfrage und Kartenansicht) |

> 💡 Tragt die **GPS-Koordinaten** ein — dann werden automatisch Wetterdaten für Spiele an diesem Ort abgerufen!

### Bodenbeläge (Surface Types)

Verschiedene Belagarten für Spielfelder:

- Rasen
- Kunstrasen
- Asche
- Hallenboden
- Tartan
- Sonstige

### Positionen

Spieler-Positionen, die bei der Spieler- und Formationsverwaltung verwendet werden:

- Torwart
- Innenverteidiger
- Außenverteidiger (links/rechts)
- Defensives Mittelfeld
- Zentrales Mittelfeld
- Offensives Mittelfeld
- Außen (links/rechts)
- Sturm
- ...

### Starke Füße

- Links
- Rechts
- Beidfüßig

### Altersgruppen

| Feld | Beschreibung |
|------|-------------|
| **Code** | z. B. „U13", „U15" |
| **Name** | z. B. „D-Junioren" |
| **Englischer Name** | z. B. „Under 13" |
| **Min/Max-Alter** | Altersbereich |
| **Stichtag** | Referenzdatum für die Altersberechnung |
| **Beschreibung** | Weitere Details |

### Ligen

Ligen, die Spielen und Teams zugeordnet werden können (z. B. „Kreisliga A", „Bezirksliga Gruppe 3").

### Nationalitäten

Liste aller Nationalitäten für Spieler- und Trainer-Profile.

### Spielereignistypen

Alle Ereignis-Typen, die bei Spielen verwendet werden (Tor, Karte, Auswechslung, usw.). Jeder Typ hat:

- **Name** und **Code**
- **Farbe** und **Symbol (Icon)**
- **System-Ereignis?** (z. B. Anpfiff, Halbzeit — werden automatisch erstellt)

### Videotypen

Verschiedene Arten von Videos (Spielvideo, Highlights, Taktik-Analyse, ...).

### Kameras

Verschiedene Kamera-Typen für die Video-Zuordnung.

### Spieltypen

Typen von Spielen (Ligaspiel, Freundschaftsspiel, Pokal, ...).

### Trainer-Lizenzen

Lizenztypen, die Trainern zugewiesen werden können (DFB C-Lizenz, UEFA B-Lizenz, ...).

### Teilnahme-Status

Die verfügbaren Status für die Termin-Teilnahme, jeweils mit Name, Code, Farbe, Symbol und Sortierreihenfolge.

---

## Größen-Guide

Der **Größen-Guide** (erreichbar über das Menü oder die Team-Verwaltung) zeigt eine Übersicht aller Spieler-Größen eines Teams:

### Team-Übersicht

Pro Team eine Tabelle mit allen Spielern und ihren eingetragenen Größen:

| Spieler | Trikotgröße | Hosengröße | Schuhgröße |
|---------|------------|------------|-------------|
| Max M. | M | M | 38 |
| Lisa S. | S | S | 36 |
| Tom K. | L | M | 42 |

### Zusammenfassung

Unter der Tabelle eine **aggregierte Übersicht** als Karten:

- **Trikotgrößen**: „3× S, 5× M, 2× L, 1× XL"
- **Hosengrößen**: „2× S, 6× M, 3× L"
- **Schuhgrößen**: „1× 36, 2× 38, 4× 40, 3× 42"

> 💡 Perfekt für **Sammelbestellungen**: Der Trainer sieht auf einen Blick, wie viele Trikots in welcher Größe bestellt werden müssen.

---

## Tipps für Administratoren

### Einrichtung des Vereins
1. **Verein anlegen** → Name, Logo, Farben, Kontaktdaten
2. **Teams anlegen** → Altersgruppen zuweisen
3. **Standorte anlegen** → GPS-Koordinaten nicht vergessen (für Wetter!)
4. **Stammdaten pflegen** → Positionen, Ligen, Spieltypen, etc.
5. **Trainer anlegen** und Nutzer-Accounts verknüpfen
6. **Spieler anlegen** und den Teams zuweisen

### Laufende Pflege
- **Verknüpfungen regelmäßig prüfen** → Neue Anfragen bestätigen oder ablehnen
- **Feedback bearbeiten** → Regelmäßig den Feedback-Bereich checken
- **Lizenzen im Blick behalten** → Abgelaufene Trainer-Lizenzen aktualisieren
- **Größen vor Bestellungen aktualisieren** → Spieler erinnern, ihre Maße zu prüfen
- **XP-Regeln anpassen** → Falls neue Aktionen belohnt werden sollen

### Neue Saison vorbereiten
1. Team-Zuweisungen aktualisieren (Spieler wechseln Teams bei Altersgruppen-Wechsel)
2. Trainer-Zuweisungen prüfen
3. Neue Ligen und Spielpläne anlegen
4. Spieler-Größen aktualisieren lassen

---

## Häufige Fragen

### Wer kann auf den Admin-Bereich zugreifen?
Nur Nutzer mit der Rolle **ROLE_ADMIN**. Diese Rolle wird von einem bestehenden Admin vergeben.

### Kann ich Admin-Rechte an mehrere Personen vergeben?
Ja — es können beliebig viele Admins existieren. Alle haben den gleichen Zugriff.

### Was passiert, wenn ich eine Verknüpfung ablehne?
Die Verknüpfung bleibt als „inaktiv" im System. Der Nutzer erhält keinen Zugriff. Ihr könnt sie jederzeit nachträglich aktivieren.

### Kann ich Stammdaten löschen, die bereits verwendet werden?
Vorsicht — wenn z. B. ein Standort bei Spielen verwendet wird, kann das Löschen zu Problemen führen. Deaktiviert Stammdaten lieber, statt sie zu löschen.

### Wie erstelle ich einen neuen Admin-Account?
1. Der Nutzer registriert sich normal
2. Ein bestehender Admin geht zu **Nutzer-Verknüpfungen**
3. Findet den Nutzer und fügt die Rolle **ROLE_ADMIN** hinzu

### Wo sehe ich, welche Nutzer aktiv sind?
In der Nutzer-Verknüpfungen-Übersicht seht ihr alle Nutzer mit ihrem Verifizierungs-Status und ihren Rollen. Nutzer, die ihre E-Mail nicht bestätigt haben, können sich nicht einloggen.
