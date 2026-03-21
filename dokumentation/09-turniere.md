# Turniere

Kaderblick bietet eine vollständige **Turnierverwaltung** — von der Planung über die Gruppeneinteilung bis zum Endspiel. Turniere können verschiedene Formate haben und werden visuell übersichtlich dargestellt.

---

## Turnier-Übersicht

Auf der **Turniere-Seite** seht ihr alle angelegten Turniere. Pro Turnier wird angezeigt:

- **Name** des Turniers
- **Typ** (z. B. Hallenturnier, Vereinsturnier)
- **Zeitraum** (Startdatum und Enddatum)
- **Anzahl der Teams**

Klickt auf ein Turnier, um die **Detail-Seite** zu öffnen.

---

## Turnier-Details

Die Detail-Seite eines Turniers ist in mehrere Bereiche aufgeteilt:

### Kopfbereich

- **Turniername** als Überschrift
- **Typ**, **Zeitraum** und **Austragungsort**
- **Turnier-Einstellungen** (falls vorhanden):
  - **Rundendauer** — Dauer pro Spiel (z. B. 15 Minuten)
  - **Spielmodus** — z. B. „Round Robin" (Jeder gegen Jeden), „K.O.-System"
  - Weitere turnierspezifische Einstellungen

---

### Teilnehmende Teams

Alle am Turnier teilnehmenden Teams werden aufgelistet. Jedes Team hat:

| Feld | Beschreibung |
|------|-------------|
| **Teamname** | Name des Teams |
| **Setzplatz** (Seed) | Falls gesetzt — als Badge neben dem Namen (z. B. „#1") |
| **Gruppenkennung** | Falls in Gruppen eingeteilt — Badge mit Gruppenbuchstabe (z. B. „Gruppe A") |

> 💡 **Eigene Teams hervorgehoben**: Teams, die zu eurem Verein gehören, werden visuell hervorgehoben — so findet ihr eure Mannschaft sofort.

---

### Spiel-Übersicht (Matches)

Die Turnierspiele werden **nach Runde/Phase gruppiert** angezeigt. Typische Phasen:

- **Gruppenphase** — Alle Gruppenspiele
- **Viertelfinale**
- **Halbfinale**
- **Finale** / **Spiel um Platz 3**

Jedes Spiel wird als Karte dargestellt:

| Element | Beschreibung |
|---------|-------------|
| **Heim-Team** | Links — mit Teamname |
| **Gast-Team** | Rechts — mit Teamname |
| **Ergebnis** | In der Mitte, sobald das Spiel abgeschlossen ist |
| **Status** | Badge: „Geplant", „Laufend" oder „Beendet" |
| **Geplante Zeit** | Wann das Spiel stattfinden soll |
| **Spielort** | Falls abweichend vom Turnierort |

#### Match-Filter

Oben gibt es einen **Filter-Toggle**:

- **Alle Spiele** — zeigt sämtliche Turnierspiele
- **Meine Teams** — zeigt nur Spiele, an denen ein Team eures Vereins beteiligt ist

Das ist besonders bei großen Turnieren mit vielen Gruppen praktisch — ihr seht sofort, welche Spiele euch betreffen.

---

### Turnierbaum / Bracket

Bei K.O.-Turnieren ergibt sich ein **Turnierbaum**: 

- Spiele der nächsten Runde sind mit denen der aktuellen Runde verknüpft
- Der **Sieger** rückt automatisch in die nächste Runde vor (sobald das Spiel als beendet markiert wird)
- So könnt ihr den kompletten Turnierverlauf nachverfolgen — vom ersten Spiel bis zum Finale

#### Was passiert nach einem beendeten Spiel?

Wenn ihr ein K.O.-Spiel als **beendet** markiert (siehe [Spiel beenden](#spiel-beenden)), kümmert sich Kaderblick automatisch um den Turnierbaum:

1. Kaderblick schaut sich das Ergebnis an — also die eingetragenen **Tore** und **Eigentore**
2. Das **Gewinnerteam** wird automatisch in die **nächste Runde** eingetragen
3. Sobald für eine nächste Runde **beide Gegner** feststehen, wird das nächste Spiel für euch **automatisch angelegt**
4. Ihr bekommt eine **Erfolgsmeldung**, die zeigt, welches Team weiterkommt

> ⚠️ **Unentschieden?** Bei einem Gleichstand kann Kaderblick den Gewinner nicht automatisch bestimmen. In diesem Fall müsst ihr die Entscheidung selbst eintragen — z. B. nach einem Elfmeterschießen das entscheidende Tor nachtragen und das Spiel dann beenden.

> 💡 So müsst ihr euch am Turniertag nicht um die Verwaltung des Turnierbaums kümmern — einfach Tore eintragen, Spiel beenden, und der Rest passiert von allein!

---

### Turnierplan drucken (PDF-Export)

Auf der Turnier-Detailseite findet ihr einen **PDF-Button**. Damit könnt ihr den kompletten Turnierplan als **druckfertiges PDF** erstellen. Das PDF enthält übersichtlich:

- **Turniername**, Datum, Ort und aktueller Status
- Die **Turnier-Einstellungen** (z. B. Spieldauer, Spielmodus)
- Alle **teilnehmenden Teams** mit Setzplatz und Gruppenkennung
- Sämtliche **Spiele** — sortiert nach Runde — mit Ergebnis (soweit bereits gespielt)
- Eure **eigenen Vereinsteams** werden hervorgehoben, damit ihr sie sofort findet

Das PDF öffnet sich in einem **neuen Browser-Tab**. Von dort könnt ihr es **ausdrucken** oder als Datei speichern.

> 💡 **Tipp**: Druckt den Turnierplan aus und hängt ihn am Spielfeldrand oder im Vereinsheim auf — so haben auch Eltern und Zuschauer ohne App-Zugang den Überblick. Auch praktisch zur Weitergabe an Gastmannschaften!

---

## Turnier anlegen

> ℹ️ Das Anlegen und Bearbeiten von Turnieren ist in der Regel Trainern und Administratoren vorbehalten.

### Grunddaten

1. **Name** — z. B. „Nikolaus-Hallenturnier 2025"
2. **Typ** — Turnierart auswählen
3. **Startdatum** und **Enddatum**
4. **Einstellungen** (optional):
   - Rundendauer (Minuten pro Spiel)
   - Spielmodus (z. B. round_robin)
   - Weitere turnierspezifische Optionen

### Teams hinzufügen

1. Klickt auf **„Team hinzufügen"**
2. Wählt ein Team aus der Liste (alle bereits in Kaderblick angelegten Teams)
3. Optional: **Setzplatz** vergeben (1, 2, 3, ...)
4. Optional: **Gruppe** zuweisen (A, B, C, ...)
5. Wiederholt für alle teilnehmenden Teams

> 💡 Ihr könnt auch Teams von **anderen Vereinen** eintragen (wenn diese in Kaderblick angelegt sind) — perfekt für Turniere mit Gastmannschaften.

### Spiele generieren

Turnierspiele können **manuell** angelegt werden:

1. Klickt auf **„Spiel hinzufügen"**
2. Wählt **Heim-Team** und **Gast-Team**
3. Legt die **Runde** und **Phase** (Stage) fest (z. B. Gruppenphase, Halbfinale)
4. Optional: **Geplante Zeit** und **Spielort**
5. Optional: **Nächstes Spiel** verknüpfen (für den Turnierbaum)

Die Spiele werden dann in der Detail-Ansicht nach Phase sortiert angezeigt.

---

## Turnier mit Kalender verknüpfen

Ein Turnier kann mit einem **Kalender-Termin** verknüpft werden:

- Im Turnier wird ein Kalender-Termin erstellt, der den gesamten Turnierzeitraum abdeckt
- Dieser Termin erscheint im **Kalender** aller berechtigten Nutzer
- Die **Teilnahme** am Turnier kann über die Kalender-Teilnahme bestätigt werden (Zu-/Absage)

---

## Spiel-Details innerhalb des Turniers

Klickt auf ein Turnierspiel, um die **Spiel-Detail-Seite** zu öffnen. Dort findet ihr:

- Vollständige **Spiel-Informationen** (wie bei einem regulären Spiel)
- **Spielereignisse** (Tore, Karten, Auswechslungen)
- **Ergebnis** eintragen
- Verknüpfte **Videos**
- Die Möglichkeit, das Spiel als **beendet zu markieren** (siehe unten)

> Das Turnierspiel verhält sich wie ein normales Spiel in Kaderblick — mit allen Funktionen (Ereignisse, Videos, Wetter usw.). Mehr dazu in [06-spielverwaltung.md](06-spielverwaltung.md).

### Spiel beenden

Wenn alle Tore, Karten und Auswechslungen eingetragen sind, könnt ihr das Spiel offiziell als beendet markieren:

1. Scrollt unterhalb des Ergebnisses zum grünen Button **„Spiel beenden"**
2. Es erscheint eine **Sicherheitsabfrage** — damit ihr nicht versehentlich ein Spiel zu früh beendet
3. Bestätigt — das Spiel wird als **beendet** angezeigt (ihr seht ein grünes Häkchen mit dem Text „Spiel beendet")
4. Bei **Turnierspielen** passiert noch mehr: Der Gewinner wird automatisch in die nächste Runde übertragen (siehe [Turnierbaum](#turnierbaum--bracket))

> 💡 Den „Spiel beenden"-Button gibt es bei **allen Spielen** — nicht nur bei Turnierspielen. Bei normalen Liga- oder Freundschaftsspielen markiert er einfach, dass das Spiel abgeschlossen ist.

### Zurück zum Turnier

Wenn ihr von der Turnier-Detailseite aus ein Spiel öffnet, zeigt der **Zurück-Button** oben links den Text **„Zurück zum Turnier"** und bringt euch direkt zurück zur Turnierseite. So müsst ihr euch nicht erst durch die allgemeine Spielübersicht navigieren.

---

## Tipps für Turniere

### Vorbereitung
- **Alle Teams vorher anlegen**: Legt Gastmannschaften rechtzeitig an — so könnt ihr sie beim Turnier einfach auswählen
- **Gruppen planen**: Überlegt euch die Gruppeneinteilung vorher und tragt Setzplätze und Gruppenkennung direkt beim Hinzufügen ein
- **Kalender-Termin erstellen**: Verknüpft das Turnier mit einem Kalender-Termin, damit alle den Termin sehen und zu-/absagen können

### Während des Turniers
- **Ergebnisse sofort eintragen**: Tragt Tore direkt nach jedem Spiel ein — so ist die Übersicht immer aktuell
- **Spiele beenden**: Markiert Spiele nach Abpfiff als beendet — bei K.O.-Turnieren wird der Gewinner dann automatisch in die nächste Runde übertragen
- **Filter nutzen**: Bei großen Turnieren den „Meine Teams"-Filter verwenden, um den Überblick zu behalten
- **Spielereignisse dokumentieren**: Tragt Tore, Karten und Auswechslungen ein — die Statistik wird automatisch aktualisiert
- **Turnierplan ausdrucken**: Druckt den aktuellen Spielplan als PDF aus und hängt ihn z. B. am Spielfeldrand oder im Vereinsheim auf

### Nach dem Turnier
- **Komplette Übersicht**: Alle Ergebnisse bleiben erhalten und können jederzeit nachgeschaut werden
- **Videos verknüpfen**: Ladet Turniervideos hoch und verknüpft sie mit den einzelnen Spielen
- **Turnierplan archivieren**: Erstellt ein PDF mit dem finalen Spielplan und allen Ergebnissen — perfekt als Erinnerung oder für die Vereinschronik

---

## Häufige Fragen

### Was ist ein Setzplatz?
Der Setzplatz bestimmt die **Startposition** eines Teams im Turnierbaum. Team #1 (höchster Setzplatz) spielt in der Regel gegen das am niedrigsten gesetzte Team. Das verhindert, dass starke Teams in der ersten Runde aufeinandertreffen.

### Können Turnierspiele wie normale Spiele bearbeitet werden?
Ja! Ein Turnierspiel hat alle Funktionen eines normalen Spiels — Spielereignisse, Videos, Wetter. Es ist zusätzlich mit dem Turnier verknüpft.

### Was passiert bei einem Unentschieden im K.O.-Spiel?
Bei einem Gleichstand kann Kaderblick den Gewinner nicht automatisch bestimmen — es findet keine Weiterleitung statt. Tragt die Entscheidung nach (z. B. das entscheidende Tor aus dem Elfmeterschießen) und beendet das Spiel dann erneut.

### Kann ich den Turnierplan ausdrucken?
Ja — klickt auf den **PDF-Button** oben auf der Turnier-Detailseite. Der komplette Spielplan öffnet sich in einem neuen Tab und kann von dort gedruckt oder als Datei gespeichert werden.

### Was passiert, wenn ich ein Turnier lösche?
Das Turnier wird mit allen Turnier-Teams und Turnier-Spielzuordnungen gelöscht. Die zugehörigen Spiele selbst bleiben je nach Einstellung bestehen.

### Kann ich ein Turnier nachträglich bearbeiten?
Ja — ihr könnt jederzeit Teams hinzufügen/entfernen, Spiele anlegen und Einstellungen anpassen, solange das Turnier nicht abgeschlossen ist.

### Wie erkenne ich auf einen Blick, ob mein Team spielt?
Nutzt den **„Meine Teams"**-Filter oben in der Spielübersicht. Außerdem werden eure Vereinsteams in der Teamliste visuell hervorgehoben.
