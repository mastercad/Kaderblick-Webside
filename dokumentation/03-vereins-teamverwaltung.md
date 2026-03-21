# Vereine & Teams

In Kaderblick bildet ihr die Struktur eures Vereins ab: Welche Mannschaften gibt es, wer spielt wo, in welcher Liga und Altersklasse? Dieses Kapitel erklärt, wie Verein und Teams zusammenhängen und wie ihr sie verwaltet.

---

## So ist Kaderblick aufgebaut

```
Verein (z. B. „FC Musterstadt")
├── 1. Mannschaft (Senioren, Kreisliga A)
├── 2. Mannschaft (Senioren, Kreisliga B)
├── U19 (A-Junioren, Bezirksliga)
├── U17 (B-Junioren, Kreisliga)
├── U15 A (C-Junioren)
├── U15 B (C-Junioren)
├── U13 (D-Junioren)
└── Alte Herren (Ü32)
```

**Verein** = Das Dach, unter dem alles zusammenkommt. Ein Verein hat einen Namen, ein Kürzel, ein Logo und optionale Infos wie Vereinsfarben, Gründungsjahr und Kontaktdaten.

**Team** = Eine Mannschaft innerhalb des Vereins. Jedes Team hat einen Namen, eine Altersklasse und optional eine Liga.

Auf Kaderblick können auch **mehrere Vereine** gleichzeitig verwaltet werden — z. B. bei Spielgemeinschaften oder wenn ein Admin mehrere Vereine betreut.

---

## Wer sieht was?

- **Spieler und Eltern** sehen nur die Teams, denen sie zugeordnet sind
- **Trainer** sehen die Teams, die sie betreuen
- **Administratoren** sehen und verwalten alle Vereine und Teams

---

## Vereinsdaten einsehen

Im Menü unter **„Vereine"** (Admin-Bereich) findet ihr die Vereinsübersicht. Dort stehen die wichtigsten Infos:

### Vereine suchen

Ihr könnt nach Vereinen suchen — es wird gleichzeitig nach Vereinsname, Kurzname und Stadionname gesucht. So findet ihr einen Verein auch über seinen Stadionnamen. Bei vielen Vereinen könnt ihr bequem durch die Seiten blättern.

> 💡 **Beispiel:** Gebt „Waldstadion" ein, um den Verein zu finden, der dort seine Heimspiele austrägt.

| Feld | Beispiel |
|------|---------|
| **Name** | FC Musterstadt 1920 e.V. |
| **Kurzname** | FC Musterstadt |
| **Kürzel** | FCM |
| **Vereinsfarben** | Blau-Weiß |
| **Logo** | Vereinswappen als Bild |
| **Gründungsjahr** | 1920 |
| **Stadion / Sportanlage** | Waldstadion |
| **Webseite** | www.fc-musterstadt.de |
| **E-Mail / Telefon** | info@fc-musterstadt.de |
| **Kontaktperson** | Max Müller (1. Vorsitzender) |

> 💡 Diese Daten werden z. B. in der Spielübersicht und bei der fussball.de-Verknüpfung angezeigt.

---

## Teams verwalten

### Teams suchen

Gebt einfach einen Teamnamen in die Suche ein, um das gewünschte Team schnell zu finden. Bei vielen Teams könnt ihr durch die Seiten blättern.

### Ein neues Team anlegen

Nur Administratoren können Teams anlegen:

1. Im Admin-Menü auf **„Teams"** klicken
2. Auf **„Neues Team"** klicken
3. Ausfüllen:
   - **Name** — z. B. „U15 A" oder „1. Herrenmannschaft"
   - **Altersklasse** — z. B. C-Junioren, Senioren (Pflichtfeld)
   - **Liga** — z. B. Kreisliga A (optional, falls das Team in einer Liga spielt)
4. Speichern

Das Team ist sofort angelegt und kann jetzt Spielern, Trainern und Vereinen zugeordnet werden.

### Team bearbeiten

In der Teamliste auf das **Bearbeiten-Symbol** (Stift) klicken — Name, Altersklasse und Liga können jederzeit geändert werden.

### Team einem Verein zuordnen

Ein Team wird einem oder mehreren Vereinen zugeordnet. Bei Spielgemeinschaften kann ein Team z. B. zu zwei Vereinen gehören.

---

## Altersklassen

Altersklassen helfen, Teams richtig einzuordnen. Kaderblick orientiert sich am deutschen Jugendfußball (Stichtag: 1. Januar):

| Altersklasse | Alter | Typische Bezeichnung |
|---|---|---|
| **Bambini / G-Junioren** | 4–5 Jahre | Minis |
| **F-Junioren** | 6–7 Jahre | Minikicker |
| **E-Junioren** | 8–9 Jahre | |
| **D-Junioren** | 10–11 Jahre | |
| **C-Junioren** | 12–13 Jahre | |
| **B-Junioren** | 14–15 Jahre | |
| **A-Junioren** | 16–17 Jahre | |
| **U19** | 18–19 Jahre | |
| **U21 / U23** | 20–23 Jahre | |
| **Senioren** | 18+ Jahre | Aktive |
| **Ü32 / Ü40 / Ü50** | Ab 32 / 40 / 50 Jahre | Alte Herren |

Altersklassen werden im Admin-Bereich unter **„Stammdaten → Altersgruppen"** verwaltet und können dort angepasst oder erweitert werden.

---

## Ligen

Spielt euer Team in einer offiziellen Liga, könnt ihr diese zuordnen. Ligen werden im Admin-Bereich unter **„Stammdaten → Ligen"** angelegt:

- Kreisliga A, Kreisliga B, Kreisliga C
- Bezirksliga
- Landesliga
- Verbandsliga
- usw.

Die Liga-Zuordnung hilft bei der Übersicht und fließt in Berichte und Statistiken ein.

---

## Verknüpfung mit fussball.de

Das ist eine besonders praktische Funktion: Kaderblick kann eure **Spielergebnisse automatisch von fussball.de** übernehmen!

### Wie funktioniert das?

1. Euer Administrator trägt die **fussball.de-ID** des Teams ein (das ist die Kennzeichnung auf der fussball.de-Webseite)
2. Kaderblick gleicht die Daten regelmäßig ab
3. Nach dem Spieltag werden **Ergebnisse automatisch aktualisiert** — ohne dass jemand sie manuell eintippen muss

### Was wird synchronisiert?

- Spielergebnisse (Tore Heim / Tore Auswärts)
- Spielpaarungen
- Die fussball.de-URL zum direkten Aufrufen des Spielberichts

> 💡 Die fussball.de-Verknüpfung spart enorm viel Tipparbeit — gerade bei Vereinen mit vielen Mannschaften.

---

## Spielstätten (Spielorte)

Spielstätten werden einmal angelegt und können dann bei jedem Termin und jedem Spiel ausgewählt werden. Eine Spielstätte kann folgende Infos enthalten:

| Feld | Beispiel |
|------|---------|
| **Name** | Waldstadion, Platz 2 |
| **Adresse** | Sportstraße 5, 12345 Musterstadt |
| **Stadt** | Musterstadt |
| **Belag** | Rasen, Kunstrasen, Asche... |
| **Kapazität** | 500 Zuschauer |
| **Flutlicht** | Ja / Nein |
| **Ausstattung** | Kabinen, Duschen, Parkplätze... |
| **GPS-Koordinaten** | Für die Navigation zum Platz |

Die Spielstätte wird im Kalender und bei Spielen angezeigt — so weiß jeder, wo es hingeht.

---

## Häufige Fragen

### Ich sehe mein Team nicht in der Liste — warum?
Ihr seht nur Teams, denen ihr zugeordnet seid. Falls euer Team fehlt, sprecht den Trainer an — der kann die Zuordnung prüfen oder den Admin bitten, sie einzurichten.

### Kann ein Spieler in mehreren Teams gleichzeitig sein?
Ja! Ein Spieler kann z. B. in der U17 und gleichzeitig in der 2. Mannschaft eingetragen sein. Mehr dazu im Kapitel [Spieler](04-spieler.md).

### Wer kann Teams anlegen und ändern?
Nur Administratoren. Trainer sehen die Teams ihrer Mannschaften, können aber keine neuen anlegen.

### Was passiert, wenn ein Team gelöscht wird?
Beim Löschen erscheint eine Sicherheitsfrage. Achtung: Mit dem Team gehen auch alle Zuordnungen verloren. Überlegt lieber, ob ihr das Team nur umbenennen oder die Altersklasse ändern wollt.

### Was bringt die fussball.de-Verknüpfung konkret?
Nach dem Spieltag aktualisiert Kaderblick automatisch die Ergebnisse. Ihr spart euch das manuelle Eintragen und habt immer die offiziellen Ergebnisse in der App.
