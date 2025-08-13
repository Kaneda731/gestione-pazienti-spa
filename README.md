# gestione-pazienti-spa
Applicazione SPA per la gestione dei pazienti con Supabase

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
