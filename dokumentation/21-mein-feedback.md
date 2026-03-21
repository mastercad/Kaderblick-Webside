# Mein Feedback

Über die Feedback-Funktion können alle Nutzer direkt aus der App Rückmeldungen an das Entwicklungsteam senden — ob ein Fehler aufgefallen ist, eine Verbesserungsidee vorhanden ist oder eine Frage gestellt werden soll. Unter **Mehr → Mein Feedback** findet jede Person die eigenen eingereichten Meldungen mit dem aktuellen Bearbeitungsstand.

---

## Feedback-Übersicht

Die Seite **Mein Feedback** zeigt auf einen Blick alle Rückmeldungen, die vom eigenen Konto eingereicht wurden.

### Statistik-Leiste

Oben auf der Seite erscheint eine Übersicht mit vier Kennzahlen:

| Kennzahl | Bedeutung |
|----------|-----------|
| **Gesamt** | Alle bisher eingereichten Meldungen |
| **Ausstehend** | Meldungen, die noch nicht bearbeitet wurden |
| **Erledigt** | Meldungen, die das Team abgeschlossen hat |
| **Ungelesene Antworten** | Antworten vom Team, die noch nicht geöffnet wurden |

### Meldungs-Karten

Jede Rückmeldung wird als Karte dargestellt. Die Karte zeigt:

| Information | Beschreibung |
|-------------|-------------|
| **Typ** | Art der Meldung (z. B. Fehler, Verbesserung, Frage, Sonstiges) |
| **Status** | Aktueller Bearbeitungsstand |
| **Datum** | Wann die Meldung eingereicht wurde |
| **Nachrichten** | Anzahl der Kommentare im Gespräch |
| **Screenshot** | Falls ein Bildschirmfoto beigefügt wurde |
| **Issue-Nummer** | Falls ein GitHub-Ticket dazu erstellt wurde (als Link) |

---

## Feedback-Typen

| Typ | Bedeutung |
|-----|-----------|
| **Fehler** | Etwas funktioniert nicht wie erwartet |
| **Verbesserung** | Eine Idee, wie etwas besser werden könnte |
| **Frage** | Etwas ist unklar oder unverständlich |
| **Sonstiges** | Alles, was in keine andere Kategorie passt |

---

## Status einer Meldung

| Status | Bedeutung |
|--------|-----------|
| **Ausstehend** | Die Meldung ist eingegangen und wartet auf Bearbeitung |
| **In Bearbeitung** | Jemand aus dem Team kümmert sich darum |
| **Erledigt** | Die Meldung wurde abgeschlossen |

---

## Neue Antworten erkennen

Wenn das Entwicklungsteam auf eine Meldung geantwortet hat und diese Antwort noch nicht gelesen wurde, wird die Karte **farblich hervorgehoben**. Ein Hinweis zeigt an, dass eine neue Antwort vorliegt.

Ein Klick auf die Karte öffnet die Detailansicht, in der das vollständige Gespräch mit dem Team zu sehen ist.

---

## Detailansicht einer Meldung

Die Detailansicht zeigt die vollständige Meldung mit allen Informationen:

- Den ursprünglichen Text der Meldung
- Das beigefügte Bildschirmfoto (falls vorhanden)
- Alle Antworten des Entwicklungsteams in chronologischer Reihenfolge
- Den Link zum GitHub-Ticket (falls vorhanden)

In der Detailansicht ist auch erkennbar, wann eine Antwort als gelesen markiert wurde.

---

## Neues Feedback einreichen

Über den **schwebenden Button** (unten rechts auf jeder Seite) lässt sich jederzeit eine neue Rückmeldung einreichen.

### Ablauf

1. Den Feedback-Button (unten rechts) antippen
2. Den **Typ** der Meldung auswählen (Fehler, Verbesserung, Frage, Sonstiges)
3. Eine **Beschreibung** eingeben (was ist passiert, was wird gewünscht?)
4. Optional: Ein **Bildschirmfoto** der aktuellen Seite anhängen
5. Auf **Senden** tippen — die Meldung wird sofort übermittelt

> **Tipp:** Je genauer die Beschreibung, desto schneller kann das Team helfen. Bei Fehlern hilft es, die genaue Seite und die Schritte zu beschreiben, die zum Problem geführt haben.

---

## Berechtigungen

| Funktion | Spieler | Eltern | Trainer | Administrator |
|----------|:-------:|:------:|:-------:|:-------------:|
| Eigene Meldungen einreichen | ✅ | ✅ | ✅ | ✅ |
| Eigene Meldungen einsehen | ✅ | ✅ | ✅ | ✅ |
| Antworten des Teams lesen | ✅ | ✅ | ✅ | ✅ |
| Alle Meldungen verwalten | — | — | — | ✅ |
| Status ändern / antworten | — | — | — | ✅ |

Die Verwaltung aller eingegangenen Meldungen erfolgt durch Administratoren im Bereich **Administration**. Mehr dazu in [20-admin.md](20-admin.md).

---

## Häufige Fragen

### Wie lange dauert es, bis auf eine Meldung reagiert wird?
Das hängt vom Typ und der Priorität ab. Fehler werden in der Regel schneller bearbeitet als Verbesserungsideen. Es gibt keinen festen Zeitrahmen.

### Kann ich eine Meldung nach dem Absenden ändern?
Nein — eingereichte Meldungen können nicht nachträglich bearbeitet werden. Falls eine Ergänzung nötig ist, kann eine neue Meldung eingereicht oder auf die bestehende in der Detailansicht als Nachricht reagiert werden (sofern das Team die Funktion freigeschaltet hat).

### Was bedeutet die GitHub-Issue-Nummer?
Falls das Entwicklungsteam für eine Meldung ein internes Ticket erstellt hat, erscheint dessen Nummer als Link. Dieser Link führt zur offiziellen Ticket-Seite auf GitHub, wo der Bearbeitungsstand öffentlich einsehbar ist.

### Wer sieht meine Meldungen?
Nur das Entwicklungsteam (Administratoren) kann alle Meldungen sehen. Andere Nutzer haben keinen Zugriff auf fremde Rückmeldungen.

### Welche Informationen sollte eine gute Fehlermeldung enthalten?
- Auf welcher Seite ist der Fehler aufgetreten?
- Was wurde getan, bevor der Fehler erschien?
- Was wurde erwartet und was ist stattdessen passiert?
- Ein Bildschirmfoto ist häufig sehr hilfreich.
