# Video-Analyse

Mit der Video-Analyse könnt ihr Spielvideos anschauen, wichtige Szenen markieren und einzelne Highlight-Clips erstellen. Ob YouTube-Videos oder eigene Aufnahmen — alles an einem Ort.

---

## Videos aufrufen

Videos sind **an ein Spiel gekoppelt**. Öffnet ein Spiel und scrollt zum Bereich **„Videos"**. Dort seht ihr alle zum Spiel gehörenden Aufnahmen. Alternativ findet ihr Videos auch direkt über die Video-Verwaltung.

Jedes Video hat folgende Informationen:

| Feld | Beschreibung |
|------|-------------|
| **Name** | Bezeichnung des Videos (z. B. „Erste Halbzeit", „Zusammenfassung") |
| **Videotyp** | z. B. „Spielvideo", „Highlights", „Taktik-Analyse" |
| **Kamera** | Welche Kamera wurde benutzt (z. B. „Hauptkamera", „Taktik-Kamera") |
| **Länge** | Dauer des Videos |
| **Sortierung** | Reihenfolge, wenn mehrere Videos zu einem Spiel gehören |
| **YouTube-ID** | Falls es ein YouTube-Video ist — die ID wird automatisch aus dem Link extrahiert |
| **Spielstart-Offset** | Ab welcher Sekunde im Video das Spiel tatsächlich beginnt (wichtig für die Zeitmarken!) |

---

## Der Video-Player

### YouTube-Videos
YouTube-Videos werden direkt **eingebettet** abgespielt — ihr braucht die App nicht verlassen. Der Player startet automatisch und zeigt keine störende YouTube-Werbung-Oberfläche.

### Eigene Video-Dateien
Hochgeladene Videos (über Dateipfad oder URL) werden mit dem Standard-HTML5-Player abgespielt.

---

## Die Zeitleiste (Timeline)

Unter dem Video befindet sich die **Zeitleiste** — das Herzstück der Video-Analyse. Sie zeigt alle **Spielereignisse** als farbige Markierungen:

### Ereignis-Markierungen

- Jedes Spielereignis (Tor, Karte, Auswechslung, usw.) wird als **farbiger Kreis** auf der Zeitleiste dargestellt
- Die **Farbe** entspricht dem Ereignistyp (z. B. Rot für Rote Karte, Gelb für Gelbe Karte)
- Die **Position** auf der Zeitleiste entspricht dem Zeitpunkt im Video
- **Tooltip**: Fahrt mit der Maus über eine Markierung → ihr seht den Ereignistyp und die Minute

### Mit der Zeitleiste arbeiten

| Aktion | Was passiert |
|--------|-------------|
| **Klick auf die Zeitleiste** | Video springt zu diesem Zeitpunkt |
| **Klick auf eine Markierung** | Video springt genau zu diesem Ereignis |
| **Markierung ziehen** | Verschiebt die Zeit des Ereignisses (z. B. wenn der Zeitstempel nicht ganz stimmt) |

> 💡 Die Zeitleiste nutzt den **Spielstart-Offset**: Wenn das Video erst in Sekunde 45 mit dem Anpfiff beginnt, werden die Ereignisse entsprechend verschoben, sodass „Minute 1" auch wirklich dem Anpfiff entspricht.

---

## Feinabstimmung (Fine-Tuning)

Wenn eine Markierung nicht ganz den richtigen Zeitpunkt trifft, könnt ihr **fein justieren**:

1. **Länger auf eine Markierung drücken** (ca. 500 Millisekunden)
2. Es öffnet sich der **Feinabstimmungs-Modus**:
   - Ein **kreisförmiger Schieberegler** erscheint um die Markierung
   - Ihr könnt den Zeitpunkt um **±10 Sekunden** verschieben
   - Das Video springt in Echtzeit mit, sodass ihr die perfekte Stelle findet
3. **Loslassen** → der neue Zeitpunkt wird übernommen

Das ist besonders nützlich, wenn ihr z. B. ein Tor markiert habt, aber die Markierung eine Sekunde zu früh oder zu spät sitzt.

> 💡 Auf dem Handy funktioniert die Feinabstimmung genauso — einfach den Finger länger auf der Markierung halten.

---

## Schnitt-Modus (Cut Mode)

Der Schnitt-Modus erlaubt euch, **Highlight-Clips** zu erstellen — bestimmte Szenen aus dem Video zu „schneiden":

### Schnitt-Modus aktivieren

1. Klickt auf das **Scheren-Symbol** (✂️) in der Toolbar
2. Die Toolbar zeigt jetzt: „Schnitt-Modus" — die Zeitleiste wechselt in den Bearbeitungsmodus

### Szene markieren

1. **Klickt auf die Zeitleiste** am **Startpunkt** der Szene
2. Ein **orangefarbener Balken** erscheint mit:
   - **Start-Griff** (links) — zum Anpassen des Beginns
   - **End-Griff** (rechts) — zum Anpassen des Endes
   - Der Balken zeigt den **markierten Bereich** visuell an
3. Verschiebt Start- und End-Griff, bis die gewünschte Szene genau eingefasst ist
4. Während ihr den Bereich anpasst, seht ihr ein **pulsierendes Scheren-Symbol**, das anzeigt, dass ein Schnitt bereitsteht
5. **Bestätigen** → die Szene wird als Video-Segment gespeichert

### Schnitt abbrechen

- Drückt die **Escape-Taste** (oder tippt auf den Abbrechen-Button) → der aktuelle Schnitt wird verworfen
- Der orangefarbene Balken verschwindet und ihr könnt von vorne beginnen

### Schnitt-Modus beenden

- Klickt erneut auf das **Scheren-Symbol** → ihr seid zurück im normalen Modus

---

## Video-Segmente

Video-Segmente sind die einzelnen **Highlight-Clips**, die ihr aus einem Video geschnitten habt. Jedes Segment hat:

| Feld | Beschreibung |
|------|-------------|
| **Titel** | Name des Segments (z. B. „Tor zum 2:1") |
| **Untertitel** | Ergänzende Info (z. B. „Kopfball nach Ecke") |
| **Spieler** | Welcher Spieler ist relevant für diese Szene |
| **Startminute** | Ab welcher Minute im Video das Segment beginnt (Dezimalwert möglich, z. B. 23.5 für 23:30) |
| **Länge** | Dauer des Segments in Sekunden |
| **Audio einschließen** | Soll der Ton des Videos mit drin sein? (An/Aus) |
| **Sortierung** | Reihenfolge der Segmente |

### Segment erstellen

Es gibt zwei Wege:

1. **Über den Schnitt-Modus**: Markiert eine Szene auf der Zeitleiste (siehe oben) und füllt im Dialog Titel, Untertitel und Spieler aus
2. **Manuell über den Button**: Klickt auf „Segment hinzufügen" → gebt Start-Minute und Länge direkt ein

### Segment bearbeiten

Klickt auf ein bestehendes Segment → im Dialog könnt ihr alle Felder anpassen. Ändert z. B. den Titel oder verschiebt den Startzeitpunkt.

### Segment löschen

Im Segment-Dialog gibt es einen „Löschen"-Button. Bestätigt die Löschung im Bestätigungs-Dialog.

---

## CSV-Export

Ihr könnt alle Segmente eines Videos als **CSV-Datei exportieren**. Das ist nützlich, wenn ihr die Szenen-Liste ausdrucken oder in einem Tabellenprogramm weiterverarbeiten wollt.

Klickt auf den **„CSV exportieren"**-Button → eine Datei wird heruntergeladen mit allen Segmenten und ihren Zeitangaben.

---

## Videotypen und Kameras

### Videotypen

In der Verwaltung könnt ihr verschiedene **Videotypen** anlegen, z. B.:
- Spielvideo (volle Aufnahme)
- Highlights
- Taktik-Analyse
- Training

### Kameras

Verschiedene **Kameras** können hinterlegt werden, z. B.:
- Hauptkamera (Tribüne)
- Taktik-Kamera (hoch oben, Vogelperspektive)
- Handykamera

So wisst ihr immer, **aus welcher Perspektive** ein Video aufgenommen wurde.

---

## Tipps zur Video-Analyse

### Für Trainer
- **Spielstart-Offset eintragen**: Messt, bei welcher Sekunde im Video der Anpfiff ist → so stimmen alle Zeitmarken automatisch
- **Segmente pro Spieler erstellen**: Schneidet Szenen mit dem Spielernamen → ideal für individuelle Nachbesprechungen
- **Audio aus für taktische Clips**: Schaltet den Ton ab, wenn ihr die Clips in der Besprechung mit eigenen Kommentaren zeigen wollt

### Für Spieler
- **Eigene Szenen finden**: Schaut in den Segmenten, ob euer Name bei einem Clip markiert ist
- **Vor dem nächsten Spiel**: Schaut euch die Highlights des letzten Spiels nochmal an — hilft bei der Vorbereitung

### Allgemein
- **YouTube-Links verwenden**: Ladet Videos auf YouTube hoch (privat/nicht gelistet) und tragt die YouTube-ID ein → beste Qualität und kein eigener Speicherplatz nötig
- **Mehrere Videos pro Spiel**: Ihr könnt pro Spiel mehrere Videos anlegen (z. B. erste + zweite Halbzeit, oder verschiedene Kameraperspektiven) — nutzt die Sortierung, um die Reihenfolge festzulegen

---

## Häufige Fragen

### Kann ich jedes YouTube-Video einbinden?
Ja, solange das Video nicht als „privat" markiert ist. „Nicht gelistete" Videos funktionieren problemlos — ihr braucht nur die YouTube-ID (den Teil nach `v=` in der URL).

### Was ist der Spielstart-Offset?
Viele Aufnahmen beginnen nicht exakt beim Anpfiff — vielleicht filmt jemand schon beim Warmmachen. Der Offset gibt an, bei **welcher Sekunde im Video** das Spiel tatsächlich beginnt. Dann stimmen alle Zeitmarken (z. B. „Tor in Minute 23") genau.

### Kann ich Schnitte rückgängig machen?
Segmente können jederzeit bearbeitet oder gelöscht werden. Das Original-Video wird nie verändert — Segmente sind nur Markierungen.

### Funktioniert die Zeitleiste auf dem Handy?
Ja — auf Touch-Geräten könnt ihr Markierungen antippen (springt zum Zeitpunkt) und länger drücken (Feinabstimmung). Der Schnitt-Modus funktioniert ebenfalls per Touch.

### Was passiert, wenn ich ein Spiel lösche?
Die Videos und Segmente, die mit dem Spiel verknüpft sind, werden ebenfalls gelöscht. YouTube-Videos selbst bleiben natürlich auf YouTube — nur die Verknüpfung in Kaderblick wird entfernt.
