# Copilot Instructions for gestione-pazienti-spa
# Regola aggiuntiva:
Quando ti chiedo un commit, eseguilo sempre su tutti i file modificati (git add . && git commit ...).

## Architettura e Componenti Chiave
- **SPA (Single Page Application)** per la gestione pazienti, basata su Vite e Supabase.
- **src/app/**: entrypoint (`main.js`), router custom (`router.js`), configurazioni e suporto mobile.
- **src/core/services/**: servizi condivisi (es. `supabaseClient.js`, `stateService.js`, `notificationService.js`).
- **src/features/**: funzionalità verticali (es. `patients`, `charts`, `diagnoses`), ognuna con views, servizi e componenti propri.
- **src/shared/**: componenti UI riutilizzabili, servizi e utilità trasversali.
- **src/views/**: template HTML delle viste principali.
- **src/css/**: tutti gli stili sono gestiti tramite Sass/SCSS (desktop e mobile).

- **Avvio sviluppo**: `npm run dev` (Vite server, sempre su http://localhost:5173)
- **Build produzione**: `npm run build`
- **Preview build**: `npm run preview`
- **Test**: `npm run test` (Vitest, test in `tests/`)
- **Debug**: vedi `src/debug/README.md` per strumenti e comandi console (es. `await DebugConnection.runInBrowser()`, `patientService.debug()`).

## Pattern e Convenzioni Specifiche
- **Servizi centralizzati**: logica business e accesso dati in `src/core/services/` e `src/features/*/services/`.
- **Gestione stato**: tramite `stateService` (single source of truth, persistenza su localStorage).
- **Cache**: alcuni servizi (es. `patientService`) implementano caching interna e metodi come `invalidateCache()`.
- **Routing**: custom, con caricamento dinamico moduli view e controllo permessi utente.
- **Autenticazione**: via Supabase, configurata in `supabaseClient.js` e `authService.js`.
- **Configurazione ambiente**: variabili in `.env` (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, ecc.).
- **Mock/test data**: i "pazienti test" sono mock locali, non presenti su Supabase.

## Modularizzazione
- Quando possibile, preferire la creazione di nuovi moduli, componenti o servizi (in `src/features/`, `src/shared/`, `src/core/services/` ecc.) invece di aggiungere codice a file esistenti troppo generici o cresciuti eccessivamente. Questo facilita la manutenibilità e la scalabilità del progetto.

## Integrazioni e Dipendenze
- **Supabase**: backend principale (auth, storage, database), client JS configurato in `supabaseClient.js`.
- **Bootstrap, Flatpickr, Google Charts**: UI e visualizzazione dati.
- **Sass**: per la gestione degli stili.

## Esempi di Pattern Ricorrenti
- Per ottenere pazienti: `patientService.getPatients()`
- Per invalidare cache: `patientService.invalidateCache()`
- Per debug: `await DebugConnection.runInBrowser()` nella console browser
- Per routing: `navigateTo('list')` o `renderView('inserimento')`

## Altri Riferimenti Utili
- **Debug avanzato**: `src/debug/README.md`
- **Test**: cartella `tests/`
- **Migrazioni/SQL**: file `.sql` in root e `src/debug/`

---
Per domande su workflow o architettura, consultare i README o chiedere chiarimenti su pattern non documentati.
[byterover-mcp]

# important 
always use byterover-retrieve-knowledge tool to get the related context before any tasks 
always use byterover-store-knowledge to store all the critical informations after sucessful tasks