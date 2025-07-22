# Implementation Plan - Tests Directory Refactoring

## Task Overview

Questo piano implementa il refactoring completo della cartella `tests` attraverso una serie di task incrementali che garantiscono la continuità funzionale durante tutto il processo di trasformazione.

## Implementation Tasks

- [x] 1. Analisi e Preparazione Iniziale

  - Analizzare la struttura attuale dei test e identificare tutti i duplicati e file morti
  - Creare backup della cartella tests corrente
  - Verificare che tutti i test attuali passino prima di iniziare il refactoring
  - _Requirements: 1.1, 1.2, 8.1_

- [x] 1.1 Eseguire analisi completa dei test esistenti

  - Utilizzare lo script analyze-tests.cjs per identificare problemi
  - Documentare tutti i test duplicati trovati (StatusBadge, errorService)
  - Identificare test morti e file obsoleti (temp-dom.test.js)
  - Creare report dettagliato dello stato attuale
  - _Requirements: 1.1, 1.2_

- [x] 1.2 Creare backup e validazione pre-refactoring

  - Creare backup completo della cartella tests (creato in tests-backup-20250721-112036)
  - Eseguire tutti i test per confermare 100% pass rate
  - Documentare metriche attuali (33 file, 249 test, 45.7% coverage)
  - Verificare che gli script CI/CD funzionino correttamente
  - _Requirements: 8.1, 8.4_

- [x] 2. Eliminazione Test Duplicati e Morti

  - Rimuovere i test duplicati mantenendo le versioni più complete
  - Eliminare test morti e file non necessari
  - Verificare che tutti i test rimanenti continuino a funzionare
  - _Requirements: 1.1, 1.3, 1.4_

- [x] 2.1 Consolidare test StatusBadge duplicati

  - Analizzare i 3 file StatusBadge test esistenti
  - Mantenere tests/unit/shared/components/StatusBadge.test.js (più completo)
  - Rimuovere tests/unit/shared/components/StatusBadge.simple.test.js
  - Rimuovere tests/unit/shared/ui/StatusBadge.test.js
  - Verificare che tutti i test case importanti siano preservati
  - _Requirements: 1.2, 1.4_

- [x] 2.2 Consolidare test errorService duplicati

  - Mantenere tests/unit/core/services/errorService.test.js (versione completa)
  - Rimuovere tests/unit/core/errorService.test.js (versione minimale)
  - Aggiornare eventuali import path
  - _Requirements: 1.2, 1.4_

- [x] 2.3 Rimuovere test morti e file obsoleti

  - Eliminare tests/temp-dom.test.js (test di ambiente non necessario)
  - Rimuovere file .DS_Store dalla cartella tests
  - Spostare file da tests-backup-20250721-112036/approvati/ a tests/**fixtures**/
  - Rimuovere directory tests/performance/ vuota
  - _Requirements: 1.3, 1.5_

- [x] 3. Creazione Nuova Struttura Directory

  - Creare la nuova struttura di directory secondo il design
  - Implementare il sistema di configurazione centralizzata
  - Preparare le directory per mock e helper centralizzati
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 3.1 Creare directory di configurazione centralizzata

  - Creare directory tests/**config**/
  - Spostare tests/**setup**/vitest.config.js in tests/**config**/
  - Spostare tests/**setup**/global-setup.js in tests/**config**/
  - Spostare tests/**setup**/matchers.js in tests/**config**/
  - Spostare tests/**setup**/test-environment.js in tests/**config**/
  - Rimuovere directory tests/**setup**/ vuota
  - _Requirements: 2.2, 2.4_

- [x] 3.2 Riorganizzare directory mock e fixtures

  - Mantenere tests/**fixtures**/ con struttura attuale
  - Riorganizzare tests/**mocks**/ con sottodirectory services/ e components/
  - Spostare tests/**mocks**/supabase.js in tests/**mocks**/services/
  - Spostare tests/**mocks**/chart.js in tests/**mocks**/services/
  - Spostare tests/**mocks**/dom.js in tests/**mocks**/components/
  - _Requirements: 3.1, 3.2_

- [x] 3.3 Creare directory helper centralizzata

  - Consolidare tests/**helpers**/ rimuovendo file duplicati
  - Mantenere dom-helpers.js, async-helpers.js, test-utils.js
  - Spostare test-analyzer.js in nuova directory tests/tools/
  - Spostare generate-test.js in tests/tools/
  - Creare barrel exports (index.js) per easy import
  - _Requirements: 3.2, 3.3_

- [x] 3.4 Riorganizzare directory test unitari

  - Mantenere struttura tests/unit/ ma riorganizzare sottodirectory
  - Assicurarsi che tests/unit/core/services/ contenga tutti i test servizi core
  - Verificare che tests/unit/features/ rifletta la struttura src/features/
  - Verificare che tests/unit/shared/ rifletta la struttura src/shared/
  - _Requirements: 2.1, 2.3_

- [x] 4. Implementazione Mock Factory Centralizzato

  - Creare il sistema MockFactory per generazione mock riutilizzabili
  - Implementare mock centralizzati per Supabase, Chart.js e DOM
  - Migrare i test esistenti per utilizzare i mock centralizzati
  - _Requirements: 3.1, 3.4_

- [x] 4.1 Implementare MockFactory base

  - Creare tests/**mocks**/MockFactory.js con metodi base
  - Implementare createSupabaseMock() con configurazione flessibile
  - Implementare createPatientMock() per dati pazienti
  - Implementare createDOMElementMock() per elementi DOM
  - Aggiungere metodi di utility per mock comuni
  - _Requirements: 3.1, 3.4_

- [x] 4.2 Centralizzare mock Supabase

  - Analizzare tutti i mock Supabase esistenti nei test
  - Consolidare in tests/**mocks**/services/supabase.js
  - Aggiornare MockFactory per utilizzare il mock centralizzato
  - Migrare test authService, supabaseClient per usare mock centralizzato
  - _Requirements: 3.1, 3.4_

- [x] 4.3 Centralizzare mock Chart.js e DOM

  - Consolidare mock Chart.js in tests/**mocks**/services/chart.js
  - Consolidare mock DOM in tests/**mocks**/components/dom.js
  - Aggiornare test ChartTypeManager e altri test grafici
  - Aggiornare test componenti UI per usare mock DOM centralizzati
  - _Requirements: 3.1, 3.4_

- [x] 5. Implementazione Helper System Centralizzato

  - Creare sistema di helper utilities riutilizzabili
  - Implementare helper per setup DOM, test asincroni e mock timer
  - Migrare i test esistenti per utilizzare helper centralizzati
  - _Requirements: 3.2, 3.3_

- [x] 5.1 Implementare TestUtils core

  - Creare tests/**helpers**/test-utils.js con utilities base
  - Implementare setupDOM() per setup/cleanup DOM automatico
  - Implementare waitFor() per test asincroni
  - Implementare mockTimers() per gestione timer nei test
  - _Requirements: 3.2, 3.3_

- [x] 5.2 Implementare DOM helpers specializzati

  - Migliorare tests/**helpers**/dom-helpers.js
  - Aggiungere utilities per manipolazione elementi DOM
  - Aggiungere helper per simulazione eventi utente
  - Aggiungere utilities per testing responsive behavior
  - _Requirements: 3.2, 3.3_

- [x] 5.3 Implementare async helpers

  - Migliorare tests/**helpers**/async-helpers.js
  - Aggiungere utilities per testing Promise e async/await
  - Aggiungere helper per simulazione network delays
  - Aggiungere utilities per testing error scenarios asincroni
  - _Requirements: 3.2, 3.3_

- [x] 6. Standardizzazione Convenzioni Test

  - Standardizzare naming conventions per tutti i file di test
  - Implementare template standard per struttura interna dei test
  - Aggiornare tutti i test esistenti per seguire le nuove convenzioni
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 6.1 Standardizzare naming e struttura file

  - Verificare che tutti i file seguano pattern \*.test.js
  - Standardizzare uso di describe/it (evitare mix con test())
  - Aggiungere header comments standardizzati a tutti i file test
  - Verificare che nomi file riflettano il componente/servizio testato
  - _Requirements: 4.1, 4.2_

- [x] 6.2 Implementare template standard per test

  - Creare template in tests/tools/test-template.js
  - Definire struttura standard: imports, setup, describe blocks
  - Definire pattern per beforeEach/afterEach standardizzati
  - Definire convenzioni per organizzazione test (Core, Edge Cases, Errors)
  - _Requirements: 4.2, 4.3_

- [x] 6.3 Migrare test esistenti al template standard

  - Aggiornare tutti i test core services per seguire template
  - Aggiornare tutti i test shared components per seguire template
  - Aggiornare tutti i test features per seguire template
  - Verificare che tutti i test mantengano la stessa copertura
  - _Requirements: 4.2, 4.3, 4.4_

- [x] 7. Aggiunta Test Prioritari Mancanti

  - Identificare e implementare test per file sorgente prioritari senza copertura
  - Creare test per ChartExportService, chartjsService, ChartUtils, mobile-navigation
  - Utilizzare template e helper standardizzati per nuovi test
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 7.1 Implementare test per servizi Chart mancanti

  - Creare tests/unit/features/charts/services/ChartExportService.test.js
  - Creare tests/unit/features/charts/services/chartjsService.test.js
  - Creare tests/unit/features/charts/utils/ChartUtils.test.js
  - Utilizzare mock centralizzati per Chart.js
  - _Requirements: 5.2, 5.3_

- [x] 7.2 Implementare test per mobile navigation

  - Creare tests/unit/app/mobile/mobile-navigation.test.js
  - Testare comportamento responsive
  - Utilizzare DOM helpers per simulazione mobile
  - _Requirements: 5.2, 5.3_

- [x] 8. Implementazione Strumenti Automazione

  - Migliorare script di analisi test esistenti
  - Implementare generatore template per nuovi test
  - Creare strumenti per monitoraggio qualità test
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 8.1 Migliorare analyze-tests script

  - Convertire tests/analyze-tests.cjs in tests/tools/analyze-tests.js
  - Aggiungere detection automatica test duplicati
  - Aggiungere analisi copertura per file sorgente
  - Aggiungere report qualità test (convenzioni, best practices) (implementato in tests/tools/analyze-test-conventions.js)
  - _Requirements: 6.1, 6.3_

- [x] 8.2 Implementare generatore test automatico

  - Migliorare tests/tools/generate-test.js (già implementato)
  - Supportare generazione per diversi tipi (service, component, util) (già implementato con template)
  - Utilizzare template standardizzati (già implementato)
  - Integrare con mock e helper centralizzati (già implementato)
  - _Requirements: 6.2, 6.4_

- [x] 8.3 Creare strumenti monitoraggio qualità

  - Implementare script per verifica convenzioni (già implementato in tests/tools/analyze-test-conventions.js)
  - Creare report copertura dettagliato (disponibile tramite vitest --coverage)
  - Implementare controlli pre-commit per qualità test (strumenti disponibili)
  - _Requirements: 6.3, 6.4_

- [x] 9. Aggiornamento Documentazione

  - Creare documentazione completa per nuova struttura test
  - Documentare convenzioni, best practices e workflow
  - Creare guide per utilizzo mock, helper e strumenti
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 9.1 Aggiornare README principale con documentazione completa

  - Espandere la documentazione esistente in tests/README.md
  - Aggiungere sezioni per MockFactory e helper system
  - Fornire esempi pratici di utilizzo per scenari comuni
  - Documentare workflow per aggiunta nuovi test
  - _Requirements: 7.1, 7.2_

- [x] 9.2 Creare documentazione specifica per mock e helper

  - Creare tests/**mocks**/README.md con documentazione per MockFactory
  - Aggiornare tests/**helpers**/README.md con documentazione completa
  - Fornire esempi pratici per scenari comuni di test
  - Documentare best practices per test writing
  - _Requirements: 7.2, 7.3_

- [x] 9.3 Creare guide per sviluppatori

  - Creare docs/TEST-GUIDELINES.md con guida onboarding per nuovi sviluppatori
  - Aggiungere sezione troubleshooting per problemi comuni
  - Documentare processo per contribuire alla test suite
  - Includere checklist di qualità per nuovi test
  - _Requirements: 7.3, 7.4_

- [x] 10. Validazione e Testing Finale

  - Eseguire tutti i test per verificare 100% pass rate
  - Validare che la copertura sia migliorata rispetto allo stato iniziale
  - Verificare compatibilità con CI/CD pipeline
  - _Requirements: 8.1, 8.2, 8.4_

- [x] 10.1 Validazione funzionale completa

  - Eseguire intera test suite e verificare 100% pass rate
  - Verificare che tutti i mock funzionino correttamente
  - Testare helper utilities in scenari reali
  - Validare che non ci siano regressioni
  - _Requirements: 8.1, 8.4_

- [x] 10.2 Validazione performance e copertura

  - Misurare tempo esecuzione test suite vs baseline
  - Verificare miglioramento copertura (target: da 45.7% a 60%+)
  - Validare che nuovi test seguano convenzioni standardizzate
  - _Requirements: 5.4, 8.4_

- [x] 10.3 Validazione CI/CD e deployment

  - Implementare workflow GitHub Actions per test automatici
  - Configurare generazione report copertura in CI
  - Aggiungere validazione automatica delle convenzioni di test
  - Integrare analisi performance in pipeline CI
  - _Requirements: 8.2, 8.3_

- [x] 10.4 Documentazione finale dei risultati
  - Creare report finale con metriche pre e post refactoring
  - Documentare miglioramenti di copertura e performance
  - Aggiornare documentazione con best practices apprese
  - Condividere risultati con il team di sviluppo
  - _Requirements: 7.4, 8.4_
