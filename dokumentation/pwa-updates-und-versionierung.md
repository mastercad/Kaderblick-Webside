# PWA-Updates & Versionierung

Dieses Dokument beschreibt die technische Architektur des PWA-Update-Mechanismus sowie das automatisierte Versionierungssystem des Frontends.

---

## Inhaltsverzeichnis

- [Überblick & Ziele](#überblick--ziele)
- [Beteiligte Dateien](#beteiligte-dateien)
- [Service Worker Lifecycle](#service-worker-lifecycle)
- [Update-Flow im Detail](#update-flow-im-detail)
- [PWAUpdateBanner – Komponentenarchitektur](#pwaupdatebanner--komponentenarchitektur)
- [Versionierungssystem](#versionierungssystem)
- [CI/CD-Integration](#cicd-integration)
- [Manuelle Versionsbumps](#manuelle-versionsbumps)
- [Lokale Entwicklung & Debugging](#lokale-entwicklung--debugging)
- [Bekannte Fallstricke](#bekannte-fallstricke)

---

## Überblick & Ziele

Ohne aktives Update-Management bekommen PWA-Nutzer neue Versionen erst mit, wenn sie die App manuell schließen und neu öffnen oder den Browser-Cache leeren. Das führt in der Praxis dazu, dass Nutzer wochenlang auf veralteten Versionen bleiben.

**Gelöst wird das durch zwei Mechanismen:**

1. **Update-Erkennung & Benachrichtigung** – Ein neuer Service Worker geht in den `waiting`-Status, statt sich sofort zu aktivieren. Die App erkennt das und zeigt einen Banner an.
2. **Automatische Versionsnummern** – Bei jedem Merge auf `main` wird die Patch-Version in `frontend/package.json` hochgezählt und in den Bundle eingebettet, sodass der Banner die konkrete Versionsnummer anzeigen kann.

---

## Beteiligte Dateien

| Datei | Rolle |
|---|---|
| `frontend/src/sw.ts` | Custom Service Worker – steuert Caching, Push, Update-Aktivierung |
| `frontend/vite.config.js` | Konfiguriert VitePWA, injiziert `__APP_VERSION__` und `__BUILD_COMMIT__` |
| `frontend/src/components/PWAUpdateBanner.tsx` | React-Komponente – zeigt Update-Benachrichtigung an |
| `frontend/src/vite-env.d.ts` | TypeScript-Deklarationen für `virtual:pwa-register` und globale Build-Variablen |
| `frontend/package.json` | Source of truth für die App-Version (`version`-Feld) |
| `.github/workflows/build.yml` | CI-Job – führt Patch-Bump durch und committed das Ergebnis |
| `.github/workflows/ci.yml` | Orchestrator – gibt `contents: write` an `build.yml` weiter |

---

## Service Worker Lifecycle

VitePWA verwendet `strategies: 'injectManifest'` mit einem Custom Service Worker in `src/sw.ts`. Das bedeutet: Workbox-Precaching wird genutzt, aber der gesamte übrige SW-Code (Push, Routing, Update-Handling) ist manuell kontrolliert.

### Registrierung

VitePWA injiziert automatisch ein `<script src="/registerSW.js">` in `index.html`. Dieses Skript registriert den SW und stellt den `useRegisterSW`-Hook bereit.

`registerType: 'prompt'` (in `vite.config.js`) ist der entscheidende Schalter:

| `registerType` | Verhalten |
|---|---|
| `autoUpdate` | Neuer SW verdrängt alten sofort via `skipWaiting()` – kein Banner möglich |
| `prompt` | Neuer SW geht in `waiting` – App erhält Callback, kann Banner zeigen |

### `skipWaiting` auf Anfrage

Der SW wartet auf eine `postMessage` vom Client:

```typescript
// frontend/src/sw.ts
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
```

`updateServiceWorker(true)` aus dem `useRegisterSW`-Hook sendet genau diese Message und löst anschließend `window.location.reload()` aus.

### Cache-Invalidierung

Workbox erzeugt beim Build ein **Precache-Manifest** – eine Liste aller gecachten Assets mit content-basierten Hashes:

```js
// Beispiel (generiert, nicht manuell bearbeiten)
[
  { url: '/assets/index-Bx3kF9aQ.js', revision: null },
  { url: '/index.html',               revision: '3f2a1b9c' },
]
```

Ändert sich auch nur eine Datei, ändert sich ihr Hash → der neue `sw.js` unterscheidet sich vom alten → Browser erkennt eine neue SW-Version → `waiting`-Status wird ausgelöst.

**Eine manuelle Versionsnummer ist für die Update-Erkennung selbst nicht notwendig** – sie dient ausschließlich der Anzeige im Banner.

---

## Update-Flow im Detail

```
Deploy eines neuen Builds
        │
        ▼
Browser lädt /sw.js im Hintergrund (Event: SW update check)
  ↳ alle 30 min per r.update() aus PWAUpdateBanner
  ↳ beim Öffnen der App falls SW veraltet
        │
        ▼
Neuer SW installiert sich → Status: "installed/waiting"
        │
        ▼
useRegisterSW() erkennt "waiting" → needRefresh[0] = true
        │
        ▼
PWAUpdateBanner rendert Snackbar mit Versionsnummer
        │
      ┌─┴──────────────────┐
      │                    │
  "Jetzt aktualisieren"  "Später"
      │                    │
      ▼                    ▼
postMessage(SKIP_WAITING)  setVisible(false)
SW aktiviert sich          Banner ausgeblendet
window.location.reload()   Update erfolgt beim
                           nächsten Seitenaufruf
```

**Wichtig:** „Später" verwirft das Update nicht. Der neue SW bleibt im `waiting`-Status. Beim nächsten Schließen aller App-Tabs (oder manuellem Reload) übernimmt er automatisch.

---

## PWAUpdateBanner – Komponentenarchitektur

**Pfad:** `frontend/src/components/PWAUpdateBanner.tsx`  
**Eingebunden in:** `frontend/src/App.tsx` (direkt nach `<QRCodeShareModal>`)

```tsx
const {
  needRefresh: [needRefresh],
  updateServiceWorker,
} = useRegisterSW({
  onRegisteredSW(_swUrl, r) {
    // Polling: alle 30 Minuten auf neuen SW prüfen
    if (r) {
      setInterval(async () => {
        if (!r.installing && navigator.onLine) {
          await r.update();
        }
      }, 30 * 60 * 1000);
    }
  },
});
```

### Zustandsmodell

| State | Typ | Bedeutung |
|---|---|---|
| `visible` | `boolean` | Steuert Snackbar-Sichtbarkeit |
| `updating` | `boolean` | Buttons werden disabled, Text wechselt zu „Wird aktualisiert…" |
| `reloadTimeout` | `ref` | Hält setTimeout-Handle für Cleanup bei Unmount |

### Versionsnummer im Banner

`__APP_VERSION__` ist eine globale Compile-Time-Konstante, die Vite über `define` in den Bundle einbettet:

```js
// vite.config.js
const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

define: {
  __APP_VERSION__: JSON.stringify(pkg.version),  // z. B. "1.0.7"
  __BUILD_COMMIT__: JSON.stringify(commitHash),   // z. B. "a3f9c12"
}
```

Im Bundle wird `__APP_VERSION__` zur Build-Zeit durch den String-Literal ersetzt (Tree-Shaking-sicher, kein Runtime-Overhead).

TypeScript-Deklaration in `src/vite-env.d.ts`:

```typescript
/// <reference types="vite-plugin-pwa/client" />  // für virtual:pwa-register/react
declare const __BUILD_COMMIT__: string;
declare const __APP_VERSION__: string;
```

---

## Versionierungssystem

Die App folgt **Semantic Versioning** ([semver.org](https://semver.org)):

```
MAJOR.MINOR.PATCH
  │      │     └── Bugfixes, kleinere Änderungen → automatisch per CI
  │      └──────── Neue Features → manuell
  └─────────────── Breaking Changes / kompletter Umbau → manuell
```

### Patch-Bump (automatisch)

Wird bei jedem Merge auf `main` durch den CI ausgeführt:

```bash
npm version patch --no-git-tag-version
# --no-git-tag-version: kein Git-Tag, kein automatischer Commit von npm selbst
# CI übernimmt den Commit manuell (s. u.)
```

### MINOR / MAJOR (manuell, lokal)

```bash
cd frontend

npm version minor   # 1.4.3 → 1.5.0
# oder
npm version major   # 1.5.0 → 2.0.0
```

Danach `frontend/package.json` committen und pushen. Der nächste CI-Lauf zählt ab dieser neuen Basis wieder automatisch den Patch hoch.

> **Achtung:** Kein `git push --follow-tags` nötig – `--no-git-tag-version` verhindert, dass npm selbst einen Tag erstellt.

---

## CI/CD-Integration

Die gesamte Versionierungslogik sitzt in `.github/workflows/build.yml`.

### Ablauf (nur auf `main`)

```yaml
- name: Bump frontend patch version
  if: github.ref == 'refs/heads/main'
  run: |
    cd frontend
    npm version patch --no-git-tag-version
    NEW_VERSION=$(node -p "require('./package.json').version")
    echo "NEW_VERSION=$NEW_VERSION" >> $GITHUB_ENV

- name: Commit & push version bump
  if: github.ref == 'refs/heads/main'
  run: |
    git config user.name  "github-actions[bot]"
    git config user.email "github-actions[bot]@users.noreply.github.com"
    git add frontend/package.json
    git commit -m "chore: bump frontend version to $NEW_VERSION [skip ci]"
    git push
```

### Verhalten bei reinen Backend-Änderungen

Der Patch-Bump in `build.yml` läuft bei **jedem** Merge auf `main` – unabhängig davon, ob Frontend- oder Backend-Code geändert wurde. Die Versionsnummer in `package.json` steigt also auch bei reinen Bugfixes im PHP-Backend.

**Der Update-Banner erscheint in diesem Fall trotzdem nicht.** Der Grund liegt im Workbox-Precaching: Bei jedem Frontend-Build erzeugt Workbox ein Precache-Manifest mit content-basierten SHA-Hashes aller Assets. Hat sich kein Frontend-Asset geändert, sind alle Hashes identisch → `sw.js` ist byte-identisch mit der vorherigen Version → der Browser erkennt keinen neuen Service Worker → kein `waiting`-Status → kein Banner.

| Merge-Inhalt | Version bumpt | SW-Hash ändert sich | Banner erscheint |
|---|---|---|---|
| Nur Backend (PHP, Migrations) | ✅ Ja | ❌ Nein | ❌ Nein |
| Nur Frontend (TS, CSS, Assets) | ✅ Ja | ✅ Ja | ✅ Ja |
| Backend + Frontend | ✅ Ja | ✅ Ja | ✅ Ja |

Die Versionsnummer in `package.json` ist damit eher ein monoton steigender **Build-Zähler** als ein exaktes Abbild von Nutzer-sichtbaren Änderungen. Nutzer werden ausschließlich dann benachrichtigt, wenn sich für sie tatsächlich etwas im Frontend geändert hat.

### Warum `[skip ci]` – und verhindert es nicht die Auslieferung?

**Nein.** `[skip ci]` verhindert nicht, dass der Code deployed wird. Es verhindert ausschließlich, dass GitHub für den Bump-Commit einen **neuen** CI-Lauf startet.

Der entscheidende Punkt: Der Bump-Commit wird innerhalb der **bereits laufenden** Pipeline erstellt und gepusht. Diese Pipeline läuft davon unberührt weiter:

```
Merge PR → CI-Run #1 startet
  └─ build.yml: npm version patch (package.json wird lokal geändert)
  └─ build.yml: git commit + git push  ←── [skip ci] verhindert CI-Run #2
  └─ build.yml: Docker build           ←── läuft weiter in CI-Run #1
                (liest lokales package.json → enthält bereits die neue Version)
  └─ qa.yml:    Tests
  └─ deploy.yml: Deploy auf den Server ←── Code wird normal ausgeliefert ✅
```

**Ohne `[skip ci]`** würde der Push des Bump-Commits einen zweiten CI-Lauf starten, der wieder einen Bump-Commit erstellt, der wieder einen dritten Lauf startet – eine Endlosschleife. GitHub Actions erkennt `[skip ci]` (sowie `[ci skip]`) im Commit-Message-Text als Signal, keinen neuen Workflow-Trigger für dieses Push-Event auszulösen.

### Benötigte Permissions

```yaml
# ci.yml
permissions:
  contents: write   # damit build.yml auf main pushen darf
  packages: write

# build.yml
permissions:
  contents: write
  packages: write
```

Der Checkout-Step in `build.yml` verwendet explizit `token: ${{ secrets.GITHUB_TOKEN }}`, damit der Push auf ggf. protected branches funktioniert.

### PR-Builds

Der `if: github.ref == 'refs/heads/main'`-Guard stellt sicher, dass **PR-Builds keinen Bump-Commit erzeugen**. Pull Requests bauen und testen gegen die aktuelle Version ohne sie zu verändern.

---

## Manuelle Versionsbumps

### Wann sinnvoll?

| Szenario | Empfohlener Bump |
|---|---|
| Neues größeres Feature (z. B. Turniermodul) | `minor` |
| Komplettes UI-Redesign | `minor` oder `major` |
| Breaking API-Änderung | `major` |
| Normaler Sprint / Bugfixes | nichts – CI macht `patch` automatisch |

### Vorgehen

```bash
cd frontend

# Version hochsetzen
npm version minor --no-git-tag-version

# Prüfen
cat package.json | grep '"version"'

# Committen
git add package.json
git commit -m "chore: bump frontend version to 1.5.0"
git push
```

Der nächste CI-Lauf liest die neue Version und baut den Docker-Image-Bundle damit.

---

## Lokale Entwicklung & Debugging

### Service Worker im Dev-Modus

In `vite.config.js` ist `devOptions.enabled: true` gesetzt, damit der SW auch lokal aktiv ist:

```js
devOptions: {
  enabled: true,
  type: 'module',
},
```

> **Hinweis:** Im Dev-Modus (Vite Dev Server) wird das Precache-Manifest nicht mit echten Hashes befüllt. Der Update-Banner kann deshalb lokal nicht durch ein echtes Re-Deploy getestet werden.

### Update-Banner lokal testen

```bash
# 1. Produktions-Build erstellen
npm run build

# 2. Build lokal vorschauen
npm run preview

# 3. Im Browser: App öffnen, SW registriert sich

# 4. Kleinen Code-Change machen, erneut bauen
npm run build

# 5. Preview neustarten – Browser erkennt neuen SW → Banner erscheint
```

Alternativ direkt in den Chrome DevTools:
- `Application → Service Workers → skipWaiting` erzwingt sofortige Aktivierung (umgeht den Banner)
- `Application → Service Workers → Update` simuliert einen SW-Update-Check

### Aktuelle Version im laufenden Bundle prüfen

In der Browser-Konsole:
```js
// Funktioniert nur wenn __APP_VERSION__ nicht als String-Literal wegoptimiert wurde;
// ansonsten in den Build-Assets nach dem Literal suchen
console.log(document.title); // nicht die Version, aber ein Check-Point
```

Oder direkt im `network`-Tab: `sw.js` → Inhalt enthält das Precache-Manifest mit den Build-Hashes.

---

## Bekannte Fallstricke

### 1. Bump-Commit landet nicht auf `main` bei protected branches

Wenn `main` als protected branch konfiguriert ist und direkte Pushes verboten sind, schlägt der Push durch `github-actions[bot]` fehl. Lösung: Den Bot-User explizit als Bypass-Actor in den Branch-Protection-Rules eintragen (`Settings → Branches → Allow specified actors to bypass required pull requests`).

### 2. Doppelter Bump bei manuell getriggertem Workflow

`workflow_dispatch` auf einen non-`main`-Branch setzt den Patch-Bump ebenfalls aus, da der Guard `github.ref == 'refs/heads/main'` greift. Wird `workflow_dispatch` auf `main` ausgeführt, erfolgt ein Bump – das ist erwünscht.

### 3. `needRefresh` bleibt false bei gecachtem `sw.js`

Wenn der Webserver `sw.js` mit einem langen `Cache-Control`-Header ausliefert, erkennt der Browser keinen neuen SW. Der Service Worker darf **niemals gecacht** werden. Nginx-Config prüfen:

```nginx
location = /sw.js {
    add_header Cache-Control "no-cache, no-store, must-revalidate";
}
```

### 4. `updateServiceWorker(true)` löst keinen Reload aus

Das passiert, wenn der SW zwar `skipWaiting()` ausgeführt hat, aber `clients.claim()` im `activate`-Handler fehlt oder fehlschlägt. Sicherstellen, dass in `sw.ts` im `activate`-Handler `self.clients.claim()` aufgerufen wird (aktuell vorhanden).

### 5. Version im Banner stimmt nicht mit deployed Version überein

Ursache: Race Condition – der Bump-Commit wurde nach dem Docker-Build gepusht, aber der Build hat noch die alte `package.json` eingelesen.  
Lösung: Der Bump-Schritt in `build.yml` liegt bewusst **vor** allen Docker-Build-Steps, sodass der Build immer die neue Version einliest.
