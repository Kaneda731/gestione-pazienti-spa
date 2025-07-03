# Piano di Sviluppo e Miglioramento: Gestione Pazienti SPA

**Versione:** 2.1
**Data:** 3 luglio 2025
**Autore:** Gemini

## 1. Visione Generale

Questo documento delinea le prossime fasi di sviluppo per l'applicazione "Gestione Pazienti". Ora che la migrazione a SPA è completa, l'obiettivo è trasformare il prototipo attuale in un'applicazione robusta, scalabile e più facile da manutenere, migliorando al contempo l'esperienza utente.

## 2. Aree di Miglioramento e Piano di Lavoro

Il lavoro è suddiviso in tre fasi principali, ordinate per priorità.

### Fase 1: Refactoring Strutturale e Ottimizzazione delle Performance (✓ Completata)

Questa fase, fondamentale per la scalabilità e la manutenibilità, è stata completata.

1.  **Spostamento della Logica di Filtro e Ricerca sul Server: (✓ Completato)**
    -   **Risultato:** Le query vengono eseguite direttamente dal database, migliorando drasticamente le performance.

2.  **Modularizzazione del Codice JavaScript: (✓ Completato)**
    -   **Risultato:** Il codice è ora più organizzato, leggibile e facile da manutenere.

### Fase 2: Miglioramento dell'Esperienza Utente (UX) (✓ Completata)

Ora che le fondamenta sono solide, ci concentreremo sull'aggiunta di funzionalità che migliorano l'interazione dell'utente con l'applicazione.

1.  **Implementazione della Paginazione: (✓ Completato)**
    -   **Risultato:** L'interfaccia è più reattiva e il carico iniziale di dati è ridotto.

2.  **Ordinamento Dinamico della Tabella: (✓ Completato)**
    -   **Risultato:** L'utente può ora ordinare i pazienti per cognome, nome e data di ricovero.

3.  **Persistenza dello Stato dei Filtri tramite URL: (✓ Completato)**
    -   **Obiettivo:** Permettere la condivisione di link con filtri, paginazione e ordinamento pre-impostati.
    -   **Azione:** Lo stato della vista elenco viene ora codificato nei parametri della URL (hash). Il router è stato aggiornato per gestire questi parametri e il flusso di autenticazione è stato migliorato per preservare l'URL di destinazione dopo il login.
    -   **Risultato:** È possibile condividere URL che riflettono esattamente la vista corrente della tabella dei pazienti.

### Fase 3: Sviluppi Futuri e Consolidamento

Questa fase si concentrerà sull'aggiunta di nuove funzionalità e sul miglioramento della qualità generale dell'applicazione.

1.  **Esportazione Dati:**
    -   **Obiettivo:** Permettere all'utente di esportare la lista dei pazienti filtrata in formato CSV.
    -   **Priorità:** Alta.

2.  **Miglioramento UI/UX del Form:**
    -   **Obiettivo:** Aggiungere validazione dei campi in tempo reale e feedback visivo più chiaro nel modulo di inserimento/modifica.
    -   **Priorità:** Media.

3.  **Test End-to-End:**
    -   **Obiettivo:** Introdurre un framework di test (es. Cypress) per automatizzare il testing delle funzionalità principali.
    -   **Priorità:** Bassa.

## 3. Prossimi Passi

La Fase 2 è ora completa. La prossima priorità è l'implementazione della funzionalità di **Esportazione Dati** in formato CSV.

