# Piano di Implementazione

- [ ] 1. Rimozione del codice morto e file inutilizzati

  - Rimuovere file vuoti e non referenziati dal codebase
  - Pulire la configurazione dell'ambiente da variabili non utilizzate
  - Eliminare feature flag non implementati
  - _Requisiti: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 1.1 Rimuovere file debug-theme.js vuoto

  - Eliminare il file `src/app/debug-theme.js` che è completamente vuoto
  - Verificare che non ci siano riferimenti a questo file nel codebase
  - _Requisiti: 1.1, 1.2_

- [ ] 1.2 Pulire file di test HTML non utilizzati

  - Rimuovere i file di test HTML dalla directory `/tests/`
  - Spostare o eliminare `test-custom-select-debug.html`, `test-mobile-select-fix.html`, `test-navbar.html`, `test-vibration-fix.html`
  - Verificare che non siano referenziati nel codice di produzione
  - _Requisiti: 1.5_

- [x] 1.3 Ottimizzare configurazione environment

  - Rimuovere variabili non utilizzate: `API_TIMEOUT`, `TABLET_BREAKPOINT`
  - Rimuovere feature flag non implementati: `EXPORT_FUNCTIONALITY`, `ADVANCED_CHARTS`, `MOBILE_OPTIMIZATIONS`
  - Mantenere solo `ROLE_BASED_ACCESS` che è effettivamente utilizzato
  - _Requisiti: 1.4_

- [x] 2. Ottimizzazione del bundle CSS

  - Eliminare la duplicazione dell'import di Bootstrap CSS
  - Ottimizzare la struttura SCSS per ridurre la dimensione del bundle
  - Testare che i layout responsive funzionino correttamente
  - _Requisiti: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 2.1 Rimuovere import duplicato di Bootstrap CSS

  - Eliminare `import 'bootstrap/dist/css/bootstrap.min.css';` da `src/app/main.js`
  - Mantenere solo gli import selettivi SCSS nei file desktop.scss e mobile.scss
  - Verificare che tutti i componenti Bootstrap necessari siano ancora importati via SCSS
  - _Requisiti: 2.1, 2.2_

- [x] 2.2 Ottimizzare struttura SCSS condivisa

  - Creare un file SCSS base condiviso per componenti Bootstrap comuni
  - Separare gli import specifici per desktop e mobile
  - Eliminare duplicazioni tra desktop.scss e mobile.scss
  - _Requisiti: 2.4, 2.5_

- [x] 2.3 Testare layout responsive dopo ottimizzazione CSS

  - Verificare che tutti i layout desktop funzionino correttamente
  - Testare tutti i layout mobile e tablet
  - Controllare che i temi dark/light funzionino su tutti i dispositivi
  - _Requisiti: 2.4_

- [-] 3. Implementazione servizio di logging intelligente

  - Creare un servizio di logging che rimuove automaticamente i log in produzione
  - Sostituire tutti i console.log/warn con il nuovo servizio
  - Configurare il build per rimuovere automaticamente i log di sviluppo
  - _Requisiti: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 3.1 Creare servizio logger centralizzato

  - Implementare `src/core/services/loggerService.js` con logging condizionale
  - Creare metodi per log, warn, error, info basati sull'ambiente
  - Mantenere sempre attivi gli error log anche in produzione
  - _Requisiti: 3.2, 3.4_

- [x] 3.2 Sostituire console statements nel codebase

  - Sostituire tutti i `console.log` e `console.warn` con il nuovo logger
  - Mantenere `console.error` per errori critici
  - Aggiornare tutti i file che utilizzano logging diretto
  - _Requisiti: 3.1, 3.2, 3.3_

- [x] 3.3 Configurare rimozione automatica log in build

  - Aggiornare vite.config.js per rimuovere console statements in produzione
  - Configurare terser per drop_console e drop_debugger
  - Testare che il build di produzione non contenga log di sviluppo
  - _Requisiti: 3.5_

- [x] 4. Ottimizzazione configurazione build Vite

  - Migliorare la configurazione di Vite per build più efficienti
  - Implementare chunk splitting ottimale
  - Aggiungere analisi del bundle
  - _Requisiti: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 4.1 Configurare manual chunks ottimali

  - Implementare chunking strategico per vendor, supabase, charts, utils
  - Ottimizzare la separazione delle dipendenze per caching efficiente
  - Testare che i chunk si carichino correttamente
  - _Requisiti: 4.1_

- [x] 4.2 Abilitare tree shaking e minificazione

  - Configurare terser per minificazione ottimale
  - Abilitare tree shaking per eliminare codice non utilizzato
  - Rimuovere `force: true` da optimizeDeps per evitare rebuild inutili
  - _Requisiti: 4.2, 4.5_

- [x] 4.3 Implementare analisi bundle con visualizer

  - Aggiungere rollup-plugin-visualizer alla configurazione
  - Configurare generazione automatica del report di analisi
  - Includere metriche gzipped per analisi realistica delle performance
  - _Requisiti: 4.4_

- [ ] 5. Ottimizzazione configurazione Netlify

  - Configurare header di caching ottimali per asset statici
  - Abilitare compressione e minificazione automatica
  - Implementare cache immutable per asset con hash
  - _Requisiti: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 5.1 Configurare header di caching per asset

  - Aggiungere header Cache-Control per asset statici con cache a lungo termine
  - Configurare cache immutable per JS e CSS con hash
  - Impostare header appropriati per diversi tipi di file
  - _Requisiti: 5.1, 5.3_

- [ ] 5.2 Abilitare processing automatico Netlify

  - Configurare minificazione automatica CSS e JS
  - Abilitare bundling automatico quando possibile
  - Testare che il processing non rompa la funzionalità
  - _Requisiti: 5.2, 5.4_

- [ ] 6. Ottimizzazione import statements

  - Rendere gli import più specifici per ridurre la dimensione del bundle
  - Ottimizzare import di Bootstrap per tree shaking
  - Aggiungere error handling per lazy loading
  - _Requisiti: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 6.1 Ottimizzare import Bootstrap specifici

  - Sostituire import generici con import specifici di componenti Bootstrap
  - Utilizzare import diretti per Modal, Tooltip, Dropdown quando possibile
  - Verificare che il tree shaking funzioni correttamente
  - _Requisiti: 6.1, 6.2, 6.5_

- [ ] 6.2 Aggiungere error handling per lazy loading

  - Implementare gestione errori per import dinamici nel router
  - Aggiungere fallback per moduli che falliscono il caricamento
  - Testare comportamento con connessioni lente o instabili
  - _Requisiti: 6.4_

- [ ] 7. Implementazione strumenti analisi bundle

  - Configurare strumenti per monitorare le dimensioni del bundle nel tempo
  - Creare report automatici delle performance
  - Implementare metriche di monitoraggio continuo
  - _Requisiti: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 7.1 Configurare bundle analyzer con metriche dettagliate

  - Implementare generazione automatica report con dimensioni gzipped
  - Configurare apertura automatica del report dopo il build
  - Includere analisi delle dipendenze più pesanti
  - _Requisiti: 7.1, 7.2, 7.3_

- [ ] 7.2 Creare script di monitoraggio performance

  - Implementare script per confrontare dimensioni bundle nel tempo
  - Creare metriche di baseline per monitoraggio continuo
  - Aggiungere alert per aumenti significativi delle dimensioni
  - _Requisiti: 7.4, 7.5_

- [ ] 8. Testing e validazione ottimizzazioni

  - Eseguire test completi per verificare che tutte le funzionalità rimangano intatte
  - Misurare miglioramenti delle performance
  - Validare comportamento su diversi dispositivi e browser
  - _Requisiti: Tutti i requisiti_

- [ ] 8.1 Test funzionalità dopo ottimizzazioni

  - Eseguire suite completa di test per verificare regressioni
  - Testare autenticazione OAuth e gestione sessioni
  - Verificare operazioni CRUD sui pazienti
  - Testare grafici e visualizzazioni dati
  - _Requisiti: Tutti i requisiti_

- [ ] 8.2 Misurazione performance e metriche
  - Misurare dimensioni bundle prima e dopo le ottimizzazioni
  - Testare tempi di caricamento su connessioni diverse
  - Verificare comportamento cache su Netlify
  - Documentare miglioramenti ottenuti
  - _Requisiti: Tutti i requisiti_
