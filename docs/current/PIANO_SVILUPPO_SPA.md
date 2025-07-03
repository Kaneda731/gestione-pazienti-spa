# Piano di Sviluppo e Miglioramento: Gestione Pazienti SPA

**Versione:** 2.0
**Data:** 3 luglio 2025
**Autore:** Gemini

## 1. Visione Generale

Questo documento delinea le prossime fasi di sviluppo per l'applicazione "Gestione Pazienti". Ora che la migrazione a SPA è completa, l'obiettivo è trasformare il prototipo attuale in un'applicazione robusta, scalabile e più facile da manutenere, migliorando al contempo l'esperienza utente.

## 2. Aree di Miglioramento e Piano di Lavoro

Il lavoro è suddiviso in tre fasi principali, ordinate per priorità.

### Fase 1: Refactoring Strutturale e Ottimizzazione delle Performance (Priorità Alta)

Questa fase è fondamentale per garantire la scalabilità e la manutenibilità futura dell'applicazione.

1.  **Spostamento della Logica di Filtro e Ricerca sul Server:**
    -   **Obiettivo:** Evitare di caricare l'intero database dei pazienti nel browser.
    -   **Azione:** Modificare la vista "Elenco Pazienti" per costruire query dinamiche a Supabase. I filtri (per reparto, diagnosi, stato) e la ricerca testuale verranno eseguiti direttamente dal database.
    -   **Risultato Atteso:** Performance drasticamente migliorate, specialmente con un grande numero di pazienti.

2.  **Modularizzazione del Codice JavaScript:**
    -   **Obiettivo:** Suddividere il file monolitico `src/app.js` in moduli specializzati.
    -   **Azione:** Creare una nuova struttura di cartelle (`src/js/`) e separare la logica in file distinti:
        -   `config.js`: Per le credenziali Supabase.
        -   `router.js`: Per la gestione della navigazione.
        -   `auth.js`: Per l'autenticazione.
        -   `ui.js`: Per funzioni di UI riutilizzabili (es. `mostraMessaggio`).
        -   `views/`: Una cartella contenente la logica per ogni vista specifica (es. `list.js`, `form.js`).
    -   **Risultato Atteso:** Codice più organizzato, leggibile e facile da manutenere.

### Fase 2: Miglioramento dell'Esperienza Utente (UX)

Una volta completata la Fase 1, ci concentreremo sull'aggiunta di funzionalità che migliorano l'interazione dell'utente con l'applicazione.

1.  **Implementazione della Paginazione:**
    -   **Obiettivo:** Evitare di mostrare centinaia di righe in una sola tabella.
    -   **Azione:** Aggiungere controlli di paginazione ("Precedente", "Successivo") alla tabella dei pazienti, utilizzando la funzione `.range()` di Supabase.

2.  **Ordinamento Dinamico della Tabella:**
    -   **Obiettivo:** Permettere all'utente di ordinare i dati con un clic.
    -   **Azione:** Rendere cliccabili le intestazioni della tabella per ordinare i risultati in base alla colonna selezionata.

3.  **Persistenza dello Stato dei Filtri:**
    -   **Obiettivo:** Mantenere i filtri attivi anche dopo un ricaricamento della pagina.
    -   **Azione:** Salvare i filtri applicati come parametri nell'URL (es. `...#list?stato=attivo`).

### Fase 3: Sviluppi Futuri e Consolidamento

Queste attività sono a lungo termine e mirano a rendere l'applicazione ancora più professionale.

1.  **Introduzione di Test Automatizzati:**
    -   **Obiettivo:** Garantire la stabilità del codice e prevenire regressioni future.
    -   **Azione:** Implementare un framework di test (es. Jest, Vitest) per scrivere test unitari e di integrazione per le funzionalità chiave.

2.  **Aggiunta di Nuove Funzionalità:**
    -   **Obiettivo:** Espandere le capacità dell'applicazione.
    -   **Azione:** Sviluppare nuove feature basate sui requisiti, come l'esportazione dei dati in formato CSV o la generazione di report PDF.

## 3. Prossimi Passi

Se sei d'accordo con questo piano, il primo passo è iniziare con la **Fase 1**. Procederò con lo spostamento della logica di filtro sul server.
