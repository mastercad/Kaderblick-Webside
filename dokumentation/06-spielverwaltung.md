# Spielverwaltung

In der Spielverwaltung dreht sich alles um eure Fußball-Spiele — von der Planung über das Live-Ergebnis bis zur detaillierten Nachbereitung mit Spielereignissen und Videos.

---

## Spiel-Übersicht

Auf der **Spiele-Seite** werden alle Spiele in **drei Bereichen** angezeigt:

### 🔴 Aktuell laufend

Spiele, die gerade stattfinden. Diese werden ganz oben angezeigt mit einem **„Live"-Badge** in Rot. Hier könnt ihr in Echtzeit Ereignisse nachtragen.

### 📅 Anstehend

Zukünftige Spiele, sortiert nach Datum. Für jedes Spiel seht ihr:
- **Heim- und Gastteam**
- **Datum und Uhrzeit**
- **Spielort** (Location)
- **Spieltyp** (z. B. Ligaspiel, Freundschaftsspiel, Pokal)
- **Liga** (z. B. Kreisliga, Bezirksliga)

### ✅ Absolviert

Abgeschlossene Spiele mit **Endergebnis**. Sortiert nach Datum (neuestes zuerst).

---

## Spiel-Detail

Klickt auf ein Spiel, um die **Detail-Seite** zu öffnen. Diese ist in mehrere Bereiche aufgeteilt:

### Kopfbereich

| Element | Beschreibung |
|---------|-------------|
| **Heim-Team** | Links — mit Teamname und optional Vereinslogo |
| **Ergebnis** | In der Mitte — z. B. „3 : 1" (bei abgeschlossenen Spielen) |
| **Gast-Team** | Rechts — mit Teamname und optional Vereinslogo |
| **Live-Badge** | Rot leuchtend, wenn das Spiel gerade läuft |
| **Spieltyp** | Badge mit dem Spieltyp (Ligaspiel, Freundschaftsspiel, ...) |
| **Liga** | Name der Liga (falls zugeordnet) |
| **Datum & Uhrzeit** | Wann und wo das Spiel stattfindet |
| **Spielort** | Name und ggf. Adresse des Spielorts |

### Wetter

Wenn ein **Spielort** hinterlegt ist und Wetterdaten verfügbar sind, erscheint eine **Wetteranzeige**:

- **Aktuelles Wetter** als Symbol (Sonne, Wolken, Regen, ...)
- **Temperatur**
- Klickt auf die Wetteranzeige → es öffnet sich ein **Wetter-Dialog** mit:
  - **Stündliche Vorhersage** für den Spieltag
  - **Tagesübersicht** (Höchst-/Tiefsttemperatur, Niederschlagswahrscheinlichkeit)

> 💡 Das Wetter wird automatisch abgerufen, wenn der Spielort Koordinaten (Breitengrad/Längengrad) hinterlegt hat.

### fussball.de-Verknüpfung

Falls das Spiel mit fussball.de verknüpft ist:

- **fussball.de-ID** und **fussball.de-URL** sind hinterlegt
- Ein **Link-Symbol** führt direkt zur Spielseite auf fussball.de
- Ergebnisse können so abgeglichen werden

---

## Spielereignisse

Das Herzstück der Spiel-Dokumentation — hier werden **alle wichtigen Szenen** erfasst:

### Ereignistypen

Jedes Ereignis hat einen **Typ** mit eigenem Symbol, Farbe und Code:

| Ereignis | Beispiel-Code | Typisches Symbol | Beschreibung |
|----------|--------------|-----------------|-------------|
| **Tor** | goal | ⚽ | Tor erzielt |
| **Eigentor** | own_goal | 🔴⚽ | Eigentor |
| **Gelbe Karte** | yellow_card | 🟨 | Verwarnung |
| **Gelb-Rote Karte** | yellow_red_card | 🟨🟥 | Zweite Gelbe → Platzverweis |
| **Rote Karte** | red_card | 🟥 | Direkter Platzverweis |
| **Auswechslung** | substitution | 🔄 | Spieler wird ein-/ausgewechselt |
| **Elfmeter** | penalty | ⚽🎯 | Strafstoß |
| **Elfmeter verschossen** | penalty_missed | ❌🎯 | Strafstoß nicht verwandelt |
| **Anpfiff** | kick_off | 🏁 | Spielbeginn |
| **Halbzeit** | half_time | ⏸️ | Halbzeitpause |
| **Abpfiff** | full_time | 🔚 | Spielende |
| **Verlängerung** | extra_time | ⏱️ | Verlängerung |
| **Elfmeterschießen** | penalty_shootout | 🎯 | Elfmeterschießen |

> 💡 Darüber hinaus gibt es **System-Ereignisse** (z. B. Anpfiff, Halbzeit, Abpfiff) und **benutzerdefinierte Ereignistypen**, die in der Verwaltung angelegt werden können.

### Ereignis erfassen

Für jedes Spielereignis wird erfasst:

| Feld | Beschreibung |
|------|-------------|
| **Ereignistyp** | Was ist passiert? (Tor, Karte, Auswechslung, ...) |
| **Spieler** | Wer war beteiligt? |
| **Team** | Welches Team? (Heim oder Gast) |
| **Zeitstempel** | Minute und Sekunde (MM:SS) — die genaue Spielminute |
| **Beschreibung** | Optionaler Freitext (z. B. „Kopfball nach Ecke") |
| **Beteiligter Spieler** | Bei Toren: Wer hat die Vorlage gegeben? Bei Auswechslungen: Wer wurde eingewechselt? |
| **Auswechslungsgrund** | Bei Auswechslungen: Warum wurde gewechselt? |

### Auswechslungsgründe

Bei einer Auswechslung könnt ihr den **Grund** angeben:

| Code | Bedeutung |
|------|-----------|
| **tactical** | Taktische Umstellung |
| **injury** | Verletzung |
| **performance** | Leistungsbedingt |
| **resting** | Schonung / Erholung |
| **card_risk** | Kartenrisiko (z. B. bereits Gelb) |
| **debut** | Debüt — erster Einsatz eines Spielers |
| **comeback** | Comeback nach Verletzung/Pause |
| **time_wasting** | Zeitspiel |
| **farewell** | Abschied — letztes Spiel eines Spielers |

### Zeitanzeige

Die **Spielminute** wird als **Chip** dargestellt: z. B. `23:45` (Minute 23, Sekunde 45). Auf der Zeitleiste im Video-Bereich (siehe [10-video-analyse.md](10-video-analyse.md)) entspricht diese Minute der Position auf der Zeitleiste.

### Ereignisse in der Übersicht

Alle Ereignisse werden chronologisch aufgelistet:

- **Heim-Ereignisse** links, **Gast-Ereignisse** rechts (wie eine Spielberichts-Darstellung)
- Jedes Ereignis zeigt: **Zeitstempel** + **Symbol** + **Spielername** + **Beschreibung**
- Bei Auswechslungen: „Spieler A ↔ Spieler B" mit dem Grund
- Bei Toren: Aktualisierung des Spielstands

---

## Videos

Im Bereich **„Videos"** eines Spiels findet ihr alle verknüpften Aufnahmen:

- **YouTube-Thumbnails** für YouTube-Videos
- **Video-Name**, **Typ** und **Kamera**
- Klickt auf ein Video → ihr gelangt zur **Video-Analyse** (siehe [10-video-analyse.md](10-video-analyse.md))

Hier können Trainer und berechtigte Nutzer neue Videos hinzufügen und bestehende bearbeiten.

---

## Spiel anlegen

> ℹ️ Das Anlegen von Spielen ist in der Regel Trainern und Administratoren vorbehalten.

1. Klickt auf **„Spiel hinzufügen"**
2. Füllt die Grunddaten aus:
   - **Heim-Team** und **Gast-Team** auswählen
   - **Spieltyp** wählen (Ligaspiel, Freundschaftsspiel, Pokal, ...)
   - **Datum und Uhrzeit**
   - **Spielort** (Location) — aus der Standort-Verwaltung auswählen
   - **Liga** (optional)
3. Speichern

### Spiel mit Kalender verknüpfen

Wenn ein Spiel mit einem **Kalender-Termin** verknüpft wird (das passiert oft automatisch):

- Der Termin erscheint im **Kalender** aller berechtigten Nutzer
- Die **Teilnahme** (Zu-/Absage) kann über den Kalender erfolgen
- **Wetterdaten** werden automatisch abgerufen (falls Standort vorhanden)

---

## Ergebnis eintragen

1. Spiel öffnen
2. **Heim-Ergebnis** und **Gast-Ergebnis** eintragen (z. B. 3 : 1)
3. „**Spiel beendet**" markieren (Checkbox „Beendet")
4. Speichern

Das Spiel wandert dann in den Bereich „Absolviert" und zeigt das Ergebnis an.

---

## Spieltypen und Ligen

### Spieltypen

In der Verwaltung können verschiedene Spieltypen angelegt werden:

- Ligaspiel
- Freundschaftsspiel
- Pokalspiel
- Hallenturnier
- Sonstige

Jeder Spieltyp hat einen **Namen** und eine **Beschreibung**.

### Ligen

Ligen können ebenfalls in der Verwaltung gepflegt werden und einem Spiel zugeordnet werden (z. B. „Kreisliga A", „Bezirksliga Gruppe 3").

---

## Tipps zur Spielverwaltung

### Live-Dokumentation
- **Während des Spiels**: Tragt Ereignisse direkt nach dem Geschehen ein — Tor, Karte, Auswechslung
- **Zeitstempel notieren**: Merkt euch die Minute, um sie später korrekt einzutragen
- **Beschreibung nutzen**: „Freistoß aus 20m" oder „Kopfball nach Ecke" — das hilft bei der späteren Analyse

### Nach dem Spiel
- **Ergebnis eintragen** und „Beendet" markieren
- **Fehlende Ereignisse nachtragen**: Geht die Ereignisliste durch und ergänzt, was ihr vergessen habt
- **Video hochladen**: Ladet das Spielvideo hoch und verknüpft es mit dem Spiel

### Für Trainer
- **Auswechslungsgründe immer eintragen**: Hilft bei der späteren Analyse und bei Berichten
- **Beteiligten Spieler angeben**: Bei Toren die Vorlage, bei Auswechslungen den eingewechselten Spieler

---

## Häufige Fragen

### Was ist der Unterschied zwischen „Laufend" und „Anstehend"?
Ein laufendes Spiel hat begonnen (Anpfiff-Ereignis oder Startzeit erreicht), ist aber noch nicht als „Beendet" markiert. Anstehende Spiele liegen in der Zukunft.

### Kann ich Spielereignisse nachträglich ändern?
Ja — klickt auf ein Ereignis und bearbeitet Typ, Zeitstempel, Spieler oder Beschreibung. Das Ergebnis wird automatisch aktualisiert.

### Was passiert mit den Statistiken, wenn ich ein Spiel lösche?
Spielereignisse werden mit dem Spiel gelöscht. Tore, Karten und andere Statistiken des Spiels werden dann nicht mehr gezählt. Berichte, die dieses Spiel einschließen, zeigen es nicht mehr.

### Kann ich ein Spiel ohne Teams anlegen?
Nein — jedes Spiel benötigt mindestens ein Heim- und ein Gast-Team. Legt die Teams vorher in der Team-Verwaltung an.

### Woher kommen die Wetterdaten?
Die Wetterdaten werden automatisch abgerufen, wenn der Spielort **GPS-Koordinaten** (Breitengrad/Längengrad) hinterlegt hat. Die Daten umfassen stündliche Vorhersagen und eine Tagesübersicht.

### Kann ich ein Spiel mit fussball.de synchronisieren?
Ihr könnt die **fussball.de-ID** und **fussball.de-URL** beim Spiel eintragen. Das ermöglicht den direkten Link zur offiziellen Spielberichtsseite. Eine automatische Ergebnis-Synchronisation gibt es aktuell nicht — Ergebnisse werden manuell eingetragen.
