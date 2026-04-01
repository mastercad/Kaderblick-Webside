# SEO-Zielarchitektur

Diese Notiz beschreibt die technische Zielarchitektur fuer oeffentliche SEO-Seiten und die interne Kaderblick-App.

---

## Zielbild

Kaderblick besteht fachlich aus zwei unterschiedlichen Ebenen:

1. **Oeffentliche SEO-Schicht**
   - indexierbare Produkt-, FAQ-, Kontakt- und Themen-Seiten
   - klare Suchintentionen pro URL
   - strukturierte Daten, Canonicals, Sitemap, Robots
   - Inhalte fuer Suchmaschinen und Erstbesucher
   - bewusst komprimierte Einstiegs- und Entscheidungsseiten, keine zweite Funktionsdokumentation

2. **Dokumentations-Schicht unter docs.kaderblick.de**
   - fachlich tiefere, funktionsnahe und aktuellere Beschreibung der Plattform
   - Kapitel pro Bereich, Rolle und Arbeitsablauf
   - kann selbst indexierbar sein und soll gezielt intern verlinkt werden
   - ist die richtige Ebene fuer Bedienung, Workflows und Detailverhalten

3. **Interne App-Schicht**
   - geschuetzte Arbeitsoberflaeche fuer Mitglieder, Trainer und Admins
   - persoenliche, teambezogene oder administrative Daten
   - nicht fuer Indexierung gedacht
   - funktional optimiert statt suchmaschinenorientiert

---

## Aktuelle Umsetzung im Repository

Die erste Stufe dieser Zielarchitektur ist bereits im Frontend verankert:

- oeffentliche Seiten unter `/`, `/funktionen`, `/funktionen/:slug`, `/faq`, `/kontakt`, `/imprint`, `/privacy`
- zentrales SEO-Head-Management ueber React Helmet
- noindex fuer interne App-Routen
- statische `robots.txt` und `sitemap.xml`
- semantisch staerkere Startseite mit echter Ueberschriftenstruktur

Damit ist eine belastbare Trennung auf Routing- und Head-Ebene vorhanden, auch wenn beide Bereiche aktuell noch aus derselben SPA ausgeliefert werden.

Neuere Korrektur dieser Architektur:

- die oeffentlichen Produktseiten muessen bewusst knapper bleiben als die Dokumentation
- fachliche Detailinhalte werden nicht mehr auf kaderblick.de nacherzaehlt, sondern gezielt nach docs.kaderblick.de verlinkt
- dadurch konkurrieren Website und Dokumentation weniger miteinander und widersprechen sich seltener

---

## Empfohlene technische Zielarchitektur

### Phase 1: Public SEO innerhalb des bestehenden Frontends

Status: umgesetzt

- oeffentliche Marketing- und Infoseiten im bestehenden Vite-Frontend
- interne Routen per Meta-Robots auf `noindex`
- Sitemap listet nur oeffentliche URLs
- Suchmaschinen erhalten eine klarere Informationsarchitektur als bisher

Zusatzstand:

- die wichtigsten oeffentlichen Frontend-Routen werden beim Build statisch vorgerendert
- oeffentliche Plattform-News werden serverseitig ueber Symfony/Twig ausgeliefert
- Suchintentionen fuer Trainer, Eltern, Jugendleitung und Spielanalyse haben eigene Landingpages
- oeffentliche Produkt- und Intent-Seiten verlinken gezielt in die bestehende Dokumentation statt deren Inhalte zu duplizieren

### Phase 2: Rendering fuer oeffentliche Seiten entkoppeln

Status: erste Umsetzungsstufe aktiv

Aktuell umgesetzt:

- statisches Prerendering der wichtigsten oeffentlichen Frontend-Routen waehrend des Build-Prozesses
- serverseitige Auslieferung der Plattform-News im Backend

Weiterhin sinnvoll als naechste Ausbaustufe:

- oeffentliche Seiten serverseitig oder statisch vorgerendert ausliefern
- interne App weiterhin als clientseitige SPA betreiben

Technisch gibt es dafuer zwei robuste Optionen:

1. **Getrennte Public-Site und App**
   - Public-Site mit SSR oder SSG
   - App unter eigener Route oder Subdomain, z. B. `/app` oder `app.kaderblick.de`
   - beste Trennung fuer SEO, Performance und Deployment

2. **Hybrid in einem Frontend-Stack**
   - oeffentliche Seiten via SSR/SSG
   - App-Bereich clientseitig nachgeladen
   - geringere Produkttrennung, aber bessere Wiederverwendung

### Phase 3: Oeffentlichen Content ausbauen

Die SEO-Schicht sollte nicht bei statischen Produktseiten stehen bleiben. Sinnvoll sind zusaetzlich:

- oeffentliche News oder Blog-Rubrik
- Ratgeberseiten fuer Trainer, Eltern, Jugendleitung, Vereinsvorstand, aber nur dort, wo sie nicht bereits die Dokumentation duplizieren
- Fallbeispiele und How-to-Inhalte
- thematische Landingpages fuer konkrete Suchanfragen

---

## Routing-Empfehlung fuer das Zielbild

### Oeffentlich, indexierbar

- `/`
- `/funktionen`
- `/funktionen/:slug`
- `/faq`
- `/kontakt`
- `/imprint`
- `/privacy`
- spaeter z. B. `/ratgeber/:slug`, `/blog/:slug`, `/fuer-trainer`, `/fuer-eltern`

### Intern, nicht indexierbar

- `/dashboard`
- `/calendar`
- `/games`
- `/reports`
- `/my-team`
- `/admin/*`
- weitere nutzerspezifische und teambezogene Routen

---

## Architekturregeln

1. Nur oeffentliche Routen kommen in Sitemap und interne Link-Hubs.
2. Interne App-Routen erhalten konsequent `noindex`.
3. Jede oeffentliche Route braucht einen eigenen Title, eine eigene Description und eine Canonical-URL.
4. Strukturierte Daten werden nur auf oeffentlichen Seiten eingesetzt.
5. Suchintentionen werden ueber dedizierte Landingpages abgebildet, nicht nur ueber Scroll-Sektionen auf der Startseite.
6. Geschuetzte Inhalte wie News, Spieler, Teams oder vereinsinterne Kommunikation werden erst dann oeffentlich gemacht, wenn Backend-Sichtbarkeit und Berechtigungskonzept explizit angepasst wurden.
7. Die Website dupliziert keine bestehende Dokumentation. Wenn ein Thema bereits auf docs.kaderblick.de fachlich gepflegt wird, dient kaderblick.de als Einstieg, Einordnung und Link-Hub.

---

## Warum diese Trennung wichtig ist

Eine Vereins-App und eine suchmaschinenoptimierte Website verfolgen unterschiedliche technische Ziele:

- die App braucht Interaktivitaet, Rollenlogik und Authentifizierung
- die Website braucht klare, stabile, indexierbare Inhalte

Wenn beides nicht getrennt gedacht wird, leidet entweder die Auffindbarkeit oder die Produktklarheit. Die Zielarchitektur stellt sicher, dass Kaderblick beides leisten kann.