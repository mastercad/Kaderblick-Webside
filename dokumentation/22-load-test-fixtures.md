# Load-Test-Fixtures (`load_test`)

> **Zielgruppe:** Entwickler · Themenbereich: Testdaten / Performance

Diese Dokumentation beschreibt die **Load-Test-Fixtures** — einen speziellen Datensatz, mit dem sich die Plattform unter realistischen Massendaten-Bedingungen testen lässt.

---

## Wozu dienen die Load-Test-Fixtures?

Kaderblick soll auch bei sehr großen Datenmengen performant bleiben. Die Load-Test-Fixtures erzeugen dafür **reale, in sich konsistente Testdaten** über drei Spielzeiten (2023–2026) hinweg:

- **Last auf der Plattform** bei vielen Vereinen, Teams, Spielen und Kalenderereignissen testen
- **Bericht-Last speziell** prüfen: Wie verhält sich der Bericht-Builder mit 25 Vereinen, 100+ Teams und tausenden Spielen?
- **Datentiefe** sichtbar machen: Spielerwechsel zwischen Teams, Altersklassen-Wechsel, Leihgaben, Doppelspielberechtigung

---

## Umfang der erzeugten Daten

| Datenkategorie | Menge |
|---|---|
| Vereine | 25 (8 groß · 8 mittel · 9 klein) |
| Teams | 101 (inkl. 3 Spielgemeinschaften) |
| Spieler | ~1 818 (18 pro Team) |
| Trainer | ~202 (2 pro Team) |
| Benutzer | 601 (1 Admin + 600 reguläre) |
| Spiele | ~4 545 (3 Saisons × 15 Spiele pro Team) |
| Spielereignisse | ~28 000–35 000 (Tore, Karten, Auswechslungen, …) |
| Trainings-Termine | ~33 700 (Di + Do jede Woche, 3 Jahre) |
| Videos | ~2 500 (für ~40 % der abgeschlossenen Spiele) |
| Berichte | 20 (Templates + vereinsspezifische Auswertungen) |
| Benutzer-Relationen | ~800 (self_player, self_coach, Eltern, Erziehungsberechtigte) |

---

## Datenmodell im Überblick

### Vereine & Teams

Die 25 Vereine sind an echten deutschen Fußballklubs orientiert (Bayern, BVB, Leverkusen usw.) und in drei Größenklassen eingeteilt:

| Typ | Clubs | Teams pro Verein | Beispiel-Teams |
|---|---|---|---|
| Groß (0–7) | 8 | 6 | Senioren I, Senioren II, A-Jug, B-Jug, C-Jug, Frauen |
| Mittel (8–15) | 8 | 4 | Senioren I, Senioren II, A-Jug, B-Jug |
| Klein (16–24) | 9 | 2 | Senioren I, A-Jug |

Zusätzlich gibt es **3 Spielgemeinschaften** (SG), bei denen jeweils zwei Vereine gemeinsam ein Team betreiben:

- SG Fürth/Sandhausen — A-Junioren
- SG Unterhaching/Uerdingen — B-Junioren
- SG Aue/1860 München — D-Junioren

### Spieler

- **18 Spieler** pro Team mit realistischen Positionen (Trikotnummern 1–18)
- **Startdatum** rotiert je nach Team-Index über die drei Saisons (2023, 2024, 2025)
- **25 %** der Spieler haben eine abgeschlossene Vergangenheits-Zuweisung (Vereinswechsel sichtbar)
- **5 %** der Spieler sind auf **Leihbasis** in einem anderen Team (teils mit, teils ohne Enddatum)
- A-Junioren: einzelne Spieler haben eine **Doppelspielberechtigung** im Nachbar-Team
- Die ersten **400 Spieler** sind per Fixture-Referenz erreichbar (`lt_player_0` bis `lt_player_399`)

### Trainer

- **2 Trainer** pro Team (Cheftrainer + Co-Trainer)
- **30 %** haben eine abgeschlossene Zuweisung zu einem früheren Team
- **10 %** der Cheftrainer haben zusätzlich eine Torwarttrainer-Zuweisung
- **5 %** der Co-Trainer betreuen ein zweites Team als Gasttrainer (ab 2025-01-01)

### Benutzer & Verknüpfungen

| Rolle | Anzahl | E-Mail-Muster |
|---|---|---|
| Admin (lt) | 1 | `lt.admin@kaderblick-loadtest.de` |
| Spieler-User | 400 | `lt.user.0–399@loadtest-example.de` |
| Trainer-User | 100 | `lt.user.400–499@loadtest-example.de` |
| Vereins-Admin | 50 | `lt.user.500–549@loadtest-example.de` |
| Platform-Admin | 50 | `lt.user.550–599@loadtest-example.de` |

**Passwort für alle Load-Test-Benutzer:** `loadtest123`

Benutzer-Verknüpfungen (`user_relations`):

- Spieler 0–399 → User 0–399: **self_player**
- Spieler 0–99 → User 200–299: **parent** (Elternteil-Verknüpfung)
- Spieler 0–99 → User 300–399: **guardian** (Erziehungsberechtigte)
- Trainer 0–199 → User 400–599: **self_coach**
- User 400–409: gleichzeitig **self_player** für Spieler 0–9 (Spieler-Trainer-Doppelrolle)

### Spiele (3 Saisons)

Pro Saison und Team werden erzeugt:

| Typ | Anzahl | Tag | Spieltyp |
|---|---|---|---|
| Ligaspiele | 13 | Samstag | Ligaspiel |
| Pokalspiel | 1 | Dienstag | Pokalspiel |
| Freundschaftsspiel | 1 | Mittwoch | Freundschaftsspiel |

Saison-Starts: **5. Aug. 2023**, **3. Aug. 2024**, **2. Aug. 2025**.

Alle Spiele vor dem 15. März 2026 werden als **abgeschlossen** markiert (mit zufälligem Ergebnis, Halbzeit-Nachspielzeiten). Zukünftige Spiele bleiben offen.

### Trainings-Termine

- **Dienstag + Donnerstag** jede Woche, von **3. Jan. 2023** bis **12. März 2026**
- 167 Wochen × 2 Tage × 101 Teams = **~33 700 Kalender-Ereignisse**
- Trainingszeiten variieren je Team (17:00–19:30 Uhr, 6 Slots)
- Jeder Termin bekommt eine `CalendarEventPermission` mit `permissionType=TEAM`

### Spielereignisse

Für jedes abgeschlossene Spiel werden 8–20 Ereignisse erzeugt:

| Ereignistyp | Menge pro Spiel |
|---|---|
| Tore (inkl. Kopf-, Freistoß-, Elfmetertor) | gemäß Endergebnis |
| Torvorlagen (Assists) | bei ~67 % der Tore |
| Gelbe Karten | 0–3 |
| Rote Karte | bei jedem 10. Spiel |
| Auswechslungen (ein + aus) | 2–4 Paare |
| Eckbälle | 1–5 |
| Schüsse aufs Tor | 1–4 |

### Videos

- ~**40 % der abgeschlossenen Spiele** haben Videos
- Pro ausgewähltem Spiel: **1. Halbzeit** (Sort 1) + **2. Halbzeit** (Sort 2)
- Gelegentlich zusätzlich ein **Vorbereitungs-Video** (Sort 3)
- Virtuelle Dateipfade: `videos/lt/game_{id}_half_1.mp4` / `_half_2.mp4`
- Erstellt von: `lt.admin@kaderblick-loadtest.de`

### Berichte

20 Berichtsdefinitionen — alle mit realistischen Filterkonfigurationen (Saison, Metriken, Verein, Altersgruppe):

| Typ | Anzahl | Eigentümer |
|---|---|---|
| Templates (`isTemplate = true`) | 5 | lt_admin_user |
| Reguläre Berichte | 15 | lt_user_500–514 (Vereins-Admins) |

Beispiel-Berichte: Saisonanalyse, Torschützenranking, Trainerauswertung, Spielgemeinschaft-Auswertung, 3-Jahres-Vergleich, Halbzeit-Effizienz, Altersklassen-Leistungsvergleich u. a.

---

## Fixture-Dateien

Alle Dateien liegen unter `api/src/DataFixtures/LoadTest/`:

| Datei | Beschreibung | Abhängigkeiten |
|---|---|---|
| `LocationFixtures.php` | 30 deutsche Sportanlagen | — |
| `ClubFixtures.php` | 25 Vereine in 3 Größenklassen | Location |
| `TeamFixtures.php` | 101 Teams inkl. 3 Spielgemeinschaften | Club, AgeGroup, League |
| `UserFixtures.php` | 601 Benutzer mit Rollen-Verteilung | — |
| `PlayerFixtures.php` | ~1 818 Spieler mit 3-Jahres-Historie | Team, Club, Position, StrongFoot, PlayerTeamAssignmentType |
| `CoachFixtures.php` | ~202 Trainer mit Transfers & Gasttrainer | Team, Club, CoachTeamAssignmentType |
| `UserRelationFixtures.php` | ~800 Benutzer-Relationen | Player, Coach, User, RelationType |
| `GameFixtures.php` | ~4 545 Spiele + CalendarEvents | Team, Location, CalendarEventType, GameType |
| `TrainingCalendarFixtures.php` | ~33 700 Trainings-Termine + Permissions | Team, Location, CalendarEventType |
| `GameEventFixtures.php` | ~28 000–35 000 Spielereignisse | Game, Player, GameEventType |
| `VideoFixtures.php` | ~2 500 Videos | Game, User, VideoType |
| `ReportFixtures.php` | 20 Berichtsdefinitionen | User |

---

## Ausführen der Fixtures

### Voraussetzungen

- Datenbankverbindung läuft (Docker: `docker-compose up -d db`)
- **Master-Fixtures** müssen **zuerst** geladen werden (Stammdaten wie Altersgruppen, Ligen, Spielereignistypen usw.)

### Befehle

```bash
cd /path/to/webapp/api

# 1. Stammdaten laden (nur einmalig nötig, löscht vorhandene Daten)
php bin/console doctrine:fixtures:load --group=master --no-interaction

# 2. Load-Test-Daten anhängen (--append lässt Stammdaten erhalten)
php bin/console doctrine:fixtures:load --group=load_test --no-interaction --append
```

> **Hinweis:** `--append` verhindert, dass die Datenbank vor dem Laden geleert wird. Ohne dieses Flag werden alle bestehenden Daten gelöscht.

### Erwartete Laufzeit

Die Load-Test-Fixtures erzeugen >70 000 Datenbankzeilen. Die Ausführung dauert je nach Datenbankserver und Hardware typischerweise **5–15 Minuten**.

```
LocationFixtures     ~1 s      (30 Datensätze)
ClubFixtures         ~1 s      (25 Datensätze)
TeamFixtures         ~2 s      (101 Datensätze)
UserFixtures         ~20 s     (601 Datensätze, Passwort-Hashing)
PlayerFixtures       ~60 s     (~1 800 Spieler + Zuweisungen)
CoachFixtures        ~30 s     (~200 Trainer + Zuweisungen)
UserRelationFixtures ~10 s     (~800 Relationen)
GameFixtures         ~120 s    (~4 500 Spiele + CalendarEvents)
TrainingCalendar     ~180 s    (~33 700 Termine)
GameEventFixtures    ~120 s    (~30 000 Ereignisse)
VideoFixtures        ~30 s     (~2 500 Videos)
ReportFixtures       <1 s      (20 Berichte)
```

### Daten entfernen

Da der Fixture-Loader mit `--append` arbeitet, gibt es keine automatische Entfernung. Um nur die Load-Test-Daten zu entfernen, reicht es, die Datenbank neu zu erstellen und nur die Master-Fixtures zu laden:

```bash
php bin/console doctrine:database:drop --force
php bin/console doctrine:database:create
php bin/console doctrine:migrations:migrate --no-interaction
php bin/console doctrine:fixtures:load --group=master --no-interaction
```

---

## Technische Hinweise (für Entwickler)

### Fixture-Gruppe

Alle Klassen implementieren `FixtureGroupInterface` und liefern `['load_test']`. Die Fixtures werden nur ausgeführt, wenn explizit `--group=load_test` übergeben wird.

### Speicherverwaltung

Fixtures mit sehr vielen Datensätzen (Training, GameEvents) nutzen ein **Flush-and-Clear-Pattern**:

```php
$manager->flush();
$manager->clear();
// Danach: Proxy-Objekte via getReference() neu holen
$proxy = $manager->getReference(EntityClass::class, $id);
```

Dies verhindert, dass der PHP-Speicher bei >10 000 Entitäten überläuft.

### GameEventType & VideoType

Diese Stammdaten-Entitäten haben **keine zuverlässigen Fixture-Referenzen** (werden nur beim ersten Laden mit `addReference()` registriert). Alle Load-Test-Fixtures laden sie daher über den Repository:

```php
$manager->getRepository(GameEventType::class)->findOneBy(['code' => 'goal']);
$manager->getRepository(VideoType::class)->findOneBy(['name' => '1.Halbzeit']);
```

### Referenz-Schlüssel (für Fixture-Abhängigkeiten)

| Prefix | Bereich | Beispiel |
|---|---|---|
| `lt_location_{n}` | Standorte 0–29 | `lt_location_5` |
| `lt_club_{n}` | Vereine 0–24 | `lt_club_0` |
| `lt_team_{n}` | Teams 0–100 | `lt_team_42` |
| `lt_user_{n}` | Benutzer 0–599 | `lt_user_400` |
| `lt_admin_user` | Admin-Benutzer | — |
| `lt_player_{n}` | Spieler 0–399 | `lt_player_12` |
| `lt_coach_{n}` | Trainer 0–201 | `lt_coach_7` |

---

## Bekannte Einschränkungen

- Die **Spielpaarungen** sind algorithmisch berechnet (kein echter Spielplan) — Heim-/Auswärtsverhältnisse sind gleichmäßig, aber nicht wie im echten Liga-Betrieb.
- **Trainingszeiten** sind nach Team-Index vergeben, nicht nach echtem Belegungsplan.
- **Videos** haben keine echten Dateien — nur virtuelle Pfade für Datenbankeinträge und Lasttests der API.
- **Berichte** haben statische Konfigurationen und sind nicht mit Team-IDs der Load-Test-Daten verknüpft.
- Das **Passwort** `loadtest123` ist für alle 601 Benutzer identisch — niemals in Produktionsumgebungen verwenden.
