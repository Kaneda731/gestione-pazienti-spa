# gestione-pazienti-spa
Applicazione SPA per la gestione dei pazienti con Supabase

## Sommario
- Introduzione
- Stack Tecnologico
- Struttura del Progetto
- Setup & Avvio
- Variabili d'Ambiente
- Script NPM
- Convenzioni (Import, Naming, Struttura servizi)
- Testing
- Build & Deploy (Netlify)
- Best Practices (SPA)
- Troubleshooting
- Contributi e Stile di Codice
- Licenza

## Introduzione
SPA per la gestione dei pazienti, con autenticazione e persistenza dati su Supabase. Il progetto utilizza Vite per sviluppo/build, Vitest per i test, e Netlify per il deploy.

## Stack Tecnologico
- Vite (build tool, dev server)
- Vanilla JS/ESM
- Sass/SCSS per gli stili
- Supabase (Auth, Database, RLS)
- Vitest (testing)
- Netlify (hosting / CI build)

## Struttura del Progetto

```
src/
  app/                        # bootstrap app, main entry, router
  core/
    services/                 # servizi core, raggruppati per dominio
      auth/
        roleService.js
      bootstrap/
        bootstrapService.js
      emergency/
        emergencyCommands.js
      error/
        errorService.js
      logger/
        loggerService.js
      navigation/
        navigationService.js
      notifications/
        notification*.js
      state/
        stateService.js
        uiStateService.js
      supabase/
        supabaseClient.js
        viteSupabaseMiddleware.js
      theme/
        themeService.js
  features/                   # funzionalità di dominio (patients, diagnosi, ecc.)
  shared/                     # componenti/utilità condivisi
  views/                      # viste/entry lato UI
  assets/
    favicon.svg
  styles/                     # ex css/
    desktop.scss
    mobile.scss
    modules/
index.html                    # entry HTML
vite.config.js                # alias '@/'=> 'src/' e ottimizzazioni
vitest.config.js              # configurazione test
```

Note reorg:
- `src/css/` → `src/styles/`
- `src/favicon.svg` → `src/assets/favicon.svg`
- Servizi in `src/core/services/` raggruppati in sottocartelle per dominio.

## Setup & Avvio
1) Prerequisiti: Node.js 18+, npm 9+
2) Installazione dipendenze:
```bash
npm install
```
3) Avvio sviluppo:
```bash
npm run dev
```
Apri `http://localhost:5173` (o porta indicata da Vite).

## Variabili d'Ambiente
Configura le chiavi Supabase (non committare segreti):
- Crea un file `.env.local` (o usa variabili d’ambiente del sistema)
- Esempio:
```bash
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=ey...
```
Le variabili con prefisso `VITE_` sono esposte lato client (Vite).

## Script NPM
- `npm run dev`: sviluppo con HMR
- `npm run build`: build produzione
- `npm run preview`: anteprima build locale
- `npm run test`: esecuzione test (Vitest)

## Convenzioni
### Import con alias
- Alias `@` → `src/` (configurato in `vite.config.js`)
- Preferire `@/` per evitare path relativi profondi.
- Esempi:
```js
import { logger } from '@/core/services/logger/loggerService.js'
import { supabase } from '@/core/services/supabase/supabaseClient.js'
import { stateService } from '@/core/services/state/stateService.js'
import '@/core/services/bootstrap/bootstrapService.js'
```

### Struttura Servizi
Organizzati per dominio in `src/core/services/`:
- `auth/`, `bootstrap/`, `emergency/`, `error/`, `logger/`, `navigation/`, `notifications/`, `state/`, `supabase/`, `theme/`.

### Naming & Stili
- File JS: camelCase per export, kebab-case/flat dove coerente con feature.
- SCSS: modulare in `styles/modules/` e importato da `desktop.scss`/`mobile.scss`.

## Testing
Esegui test:
```bash
npm run test
```
Note: alcuni test legacy potrebbero richiedere adattamenti post-reorg.

## Build & Deploy (Netlify)
Build locale:
```bash
npm run build
```
Anteprima build:
```bash
npm run preview
```
Deploy: Netlify build su push (file `_redirects` generato in build). Verifica log Netlify per warning (Sass, dynamic import mixed static/dynamic).

## Best Practices (SPA)
Consulta la knowledge base completa in `docs/spa-best-practices.md`.

Checklist rapida per le PR:
- Performance
  - [ ] Code splitting e lazy load su route/feature
  - [ ] Nessuna regressione CWV; Lighthouse ok
  - [ ] SW caching sicuro (se usato)
- Security
  - [ ] Niente `innerHTML` non sanitizzato; usare DOMPurify quando serve
  - [ ] CSP strict valutata/applicata; evitare inline script/style
  - [ ] CORS minimizzato (no wildcard con credenziali)
- Accessibilità
  - [ ] Focus gestito al cambio pagina; navigazione tastiera ok
  - [ ] Ruoli/nome accessibile/label corretti; axe scan principale
- Testing
  - [ ] Test unit/component/e2e aggiornati; selettori stabili `data-*`

## Troubleshooting
- Import rotti dopo spostamenti: verificare mapping alias `@` e usare i nuovi percorsi dei servizi.
- Sass deprecation warnings: consultare i file in `styles/modules/components/charts/` per refactor futuro.
- Dynamic import anche statico: Vite non farà code-splitting per quei moduli; considerare di unificare la modalità di import.

## SCSS: Media Query Wrapper Mixins (Charts)
Per eliminare i warning Sass sulle nested rules dentro `@media`, i charts usano wrapper mixin con `@content`:

- File: `src/styles/modules/components/charts/_media-utils.scss`
- Esportati dal barrel: `src/styles/modules/components/charts/_index.scss` via `@forward 'media-utils';`
- Uso: importare il barrel nei partials charts con `@use './index' as *;`

Esempi d’uso:

```scss
// Dark mode
@include prefers-dark {
  background: var(--dark-color);
}

// Reduced motion
@include reduced-motion {
  animation: none;
}

// Breakpoint generico
@include mq('(min-width: 992px)') {
  justify-content: flex-end;
}
```

Linee guida di migrazione:
- Non annidare selettori con `& { ... }` dentro `@media`.
- Usa sempre i wrapper: `prefers-dark`, `reduced-motion`, `mq($query)`.
- File aggiornati: `charts/_chart-mixins.scss`, `charts/_responsive.scss`.

## Contributi e Stile di Codice
- Preferire import con `@/`
- Raggruppare nuovi servizi nelle sottocartelle di dominio adeguate
- PR piccole e atomiche; includere note di migrazione se si spostano file

## Licenza
Proprietaria (o specificare licenza adottata).

## Requisiti
- Node.js 18+
- npm 9+

## Script principali (`package.json`)
- `npm run dev`: avvio in sviluppo (Vite)
- `npm run build`: build di produzione
- `npm run preview`: anteprima build
- `npm run test`: test (Vitest)

## Struttura sorgenti (`src/`)
Struttura aggiornata dopo la riorganizzazione:

```
src/
  app/
  core/
    services/
      auth/
        roleService.js
      bootstrap/
        bootstrapService.js
      emergency/
        emergencyCommands.js
      error/
        errorService.js
      logger/
        loggerService.js
      navigation/
        navigationService.js
      notifications/
        notificationAnimationManager.js
        notificationBatchRenderer.js
        notificationConfig.js
        notificationDomUtils.js
        notificationErrorHandler.js
        notificationEventManager.js
        notificationLazyLoader.js
        notificationPersistence.js
        notificationProgressBar.js
        notificationRenderer.js
        notificationService.js
        notificationSettingsUtils.js
        notificationSoundManager.js
        notificationStorage.js
        notificationTimerUtils.js
        notificationUtils.js
        notificationVirtualScroller.js
      state/
        stateService.js
        uiStateService.js
      supabase/
        supabaseClient.js
        viteSupabaseMiddleware.js
      theme/
        themeService.js
  features/
  shared/
  views/
  assets/
    favicon.svg
  styles/
    desktop.scss
    mobile.scss
    modules/
```

Note principali:
- `src/css/` è stato rinominato in `src/styles/`.
- `src/favicon.svg` è stato spostato in `src/assets/favicon.svg`.
- I servizi in `src/core/services/` sono ora raggruppati in sottocartelle di dominio.

## Convenzioni di import
- Alias Vite: `@` punta a `src/` (vedi `vite.config.js`).
- Preferire import con alias per riferimenti cross-feature:
  - Esempi:
    - `import { logger } from '@/core/services/logger/loggerService.js'`
    - `import { supabase } from '@/core/services/supabase/supabaseClient.js'`
    - `import { stateService } from '@/core/services/state/stateService.js'`
    - `import '@/core/services/bootstrap/bootstrapService.js'`
- Evitare path relativi profondi (es. `../../../core/...`) quando possibile, usare `@/`.

## Note di migrazione (post-reorg)
Percorsi precedenti → nuovi percorsi:
- `@/core/services/loggerService.js` → `@/core/services/logger/loggerService.js`
- `@/core/services/supabaseClient.js` → `@/core/services/supabase/supabaseClient.js`
- `@/core/services/stateService.js` → `@/core/services/state/stateService.js`
- `@/core/services/uiStateService.js` → `@/core/services/state/uiStateService.js`
- `@/core/services/bootstrapService.js` → `@/core/services/bootstrap/bootstrapService.js`
- `@/core/services/navigationService.js` → `@/core/services/navigation/navigationService.js`
- `@/core/services/errorService.js` → `@/core/services/error/errorService.js`
- `@/core/services/themeService.js` → `@/core/services/theme/themeService.js`
- `@/core/services/emergencyCommands.js` → `@/core/services/emergency/emergencyCommands.js`
- `@/core/services/notification*.js` → `@/core/services/notifications/notification*.js`
- `src/css/...` → `src/styles/...`
- `src/favicon.svg` → `src/assets/favicon.svg`

Verifica rapida:
```bash
npm run build
```

## Sviluppo
```bash
npm install
npm run dev
```
Apri `http://localhost:5173` (o porta indicata da Vite).

## Test
```bash
npm run test
```

  ## Build e Deploy
  - Build locale: `npm run build`
  - Anteprima: `npm run preview`
  - Netlify: la pipeline genera automaticamente la build su push; il file `_redirects` è generato in build.
  
  ## Suggerimenti
  - Mantieni gli import consistenti con `@/` per ridurre rotture durante futuri spostamenti.
  - Quando aggiungi nuovi servizi, posizionali nella sottocartella di dominio in `src/core/services/`.
  
  ## Centralizzazione servizi: TODO
  
  Obiettivo: centralizzare la ricerca pazienti e le relative UI per eliminare duplicazioni tra `Eventi Clinici` e `Dimissione`.
  
  - **shared/services/patientSearchService.js**
    - [ ] Definire API pubblica:
      - [ ] `search(term, { activeOnly=false, limit=20, signal })`
      - [ ] `searchRealtime(term, { activeOnly=false, debounceMs=250, onUpdate, onError })`
    - [ ] Integrare con `patientService.searchPatients` e uniformare i criteri:
      - [ ] Campi: `nome`, `cognome`, `codice_rad`
      - [ ] `activeOnly`: filtro dimissione/stato
      - [ ] `limit`/ordinamento coerenti
    - [ ] Caching in-memory con TTL (30–60s) su chiave `{term, activeOnly}`
    - [ ] Debounce configurabile per realtime
    - [ ] Normalizzare shape risultati (id, nomeCompleto, codice_rad, stato)
    - [ ] Gestione errori/log centralizzata (logger + notificationService)
    - [ ] Test rapido: nessun risultato, molti risultati, errore
  
  - **shared/components/ui/PatientAutocomplete.js**
    - [ ] API componente:
      - [ ] `attach({ input, resultsContainer, onSelect, activeOnly=false, minChars=2, debounceMs=250 })`
      - [ ] `destroy()`
    - [ ] Stati UI: Loading, No results (`EmptyState.js`), Error
    - [ ] Navigazione tastiera (↑/↓/Enter/Escape), focus management, chiusura on blur
    - [ ] Rendering risultati (nome, cognome, codice_rad), evidenziazione opzionale
    - [ ] Selezione: set `input.value` e `input.dataset.patientId`, `onSelect(patient)`
    - [ ] A11y: ruoli ARIA (combobox, listbox, option), `aria-expanded`, `aria-activedescendant`, `aria-controls`, annunci `aria-live`
  
  - **shared/utils/searchUtils.js**
    - [ ] `debounce(fn, ms)`
    - [ ] `highlight(text, term)` sicuro (no XSS; DOMPurify se necessario)
    - [ ] `toSearchKey(term, activeOnly)` per cache keys
    - [ ] Helpers AbortController per cancellare richieste realtime
  
  - **shared/services/cacheService.js** (opzionale)
    - [ ] `get(key)`, `set(key, value, ttlMs)`, `has(key)`, `purgeExpired()`
  
  - **Allineamento servizi esistenti (patients)**
    - [ ] Verificare `features/patients/services/patientApi.js`:
      - [ ] `searchPatients` copre `nome`, `cognome`, `codice_rad`
      - [ ] Parametro `activeOnly` rispettato
      - [ ] `limit`/order coerenti
    - [ ] `patientService.js` rimane thin layer (no duplicazioni di logica)
  
  - **Migrazione Eventi Clinici**
    - [ ] `features/eventi-clinici/views/eventi-clinici-api.js`: rimuovere ricerca custom (debounce/cache) e usare il service
    - [ ] `EventiCliniciFilterManager.js` e `EventiCliniciModalManager.js`: usare `PatientAutocomplete.attach(...)`
    - [ ] `eventi-clinici-ui.js`: usare `dataset.patientId` impostato dal componente e rimuovere reset duplicati
    - [ ] Verifiche: lista + modal mostrano risultati coerenti; selezione popola correttamente
  
  - **Migrazione Dimissione**
    - [ ] `features/patients/views/dimissione-api.js`: sostituire `searchActivePatients` con `patientSearchService.search(term, { activeOnly:true })`
    - [ ] `dimissione-ui.js`: integrare `PatientAutocomplete.attach(...)` e rimuovere debounce/render manuali
    - [ ] Verifiche: solo pazienti attivi, selezione e form ok
  
  - **Pulizia**
    - [ ] Eliminare utilità duplicate (debounce, cache, rendering risultati)
    - [ ] Consolidare messaggi di empty state
    - [ ] Aggiornare import e rimuovere codice morto
  
  - **Test e QA**
    - [ ] Regressione Eventi Clinici (lista, modal)
    - [ ] Regressione Dimissione
    - [ ] Lista pazienti: filtro `search` coerente
    - [ ] Performance: niente doppie chiamate, cache TTL ok
    - [ ] A11y: tastiera e annunci corretti
