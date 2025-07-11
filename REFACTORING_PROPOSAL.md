# Proposta di Refactoring della Struttura del Progetto

Questo documento descrive una proposta di refactoring per migliorare l'organizzazione, la manutenibilità e la scalabilità del progetto, basandosi sul principio della co-locazione dei file.

## Analisi della Struttura Attuale

### Punti di Forza

*   **Separazione per Funzionalità (`features`):** Ottima pratica che rende il codice modulare.
*   **Cartella `core`:** Scelta solida per i servizi trasversali (auth, state, ecc.).
*   **Cartella `shared`:** Eccellente per componenti e utility riutilizzabili.

### Aree di Miglioramento

1.  **Disconnessione Logica/Template:** I file JavaScript di una vista (es. `list.js`) sono separati dal loro HTML (es. `list.html`), aumentando il carico cognitivo.
2.  **Complessità Struttura CSS/SCSS:** La divisione degli stili in cartelle `mobile`, `desktop` e `components` crea frammentazione e rende le modifiche complesse e soggette a errori.
3.  **Distinzione `app` vs `core` non netta:** La cartella `src/app` contiene sia logica di avvio che componenti specifici che potrebbero stare altrove.

## Proposta di Nuova Struttura

L'obiettivo è raggruppare tutti i file relativi a una singola funzionalità o componente nella stessa cartella.

```
/src/
├── app/
│   ├── main.js
│   └── router.js
├── core/
│   └── (servizi trasversali come auth, state, supabase...)
├── features/
│   ├── patients/
│   │   ├── components/
│   │   │   └── patient-card/
│   │   │       ├── PatientCard.js
│   │   │       └── PatientCard.scss  // Stili co-locati
│   │   ├── list/                     // Vista "list" come modulo
│   │   │   ├── list.html             // HTML co-locato
│   │   │   ├── list.js
│   │   │   └── list.scss             // Stili co-locati
│   │   ├── form/                     // Vista "form" come modulo
│   │   │   ├── form.html
│   │   │   ├── form.js
│   │   │   └── form.scss
│   │   └── services/
│   │       └── patientService.js
│   └── (altre features come diagnoses, charts...)
├── shared/
│   ├── components/
│   │   ├── forms/
│   │   │   └── CustomSelect/
│   │   │       ├── CustomSelect.js
│   │   │       └── CustomSelect.scss // Stili co-locati
│   │   └── ui/
│   │       ├── ActionButtons.js
│   │       └── ...
│   └── utils/
│       ├��─ dom.js
│       └── ...
└── styles/                         // Nuova cartella per stili globali
    ├───_variables.scss
    ├───_dark-mode.scss
    ├───main.scss                   // Unico entry point per gli stili
```

## Vantaggi Principali

### 1. Co-locazione e Manutenibilità
*   Tutto ciò che riguarda una funzionalità (es. la lista pazienti) si trova in un'unica cartella. Modificare o eliminare la funzionalità richiede di lavorare in un solo posto.
*   I componenti diventano autonomi e veramente riutilizzabili.

### 2. SCSS Semplificato
*   Si elimina la complessa e fragile struttura in `src/css`.
*   Una nuova cartella `src/styles` contiene solo gli stili veramente globali.
*   Ogni componente ha il suo file `.scss`, che include anche le regole responsive, eliminando la necessità di file separati per mobile/desktop.

### 3. Chiarezza e Intuitività
*   La struttura del progetto riflette l'architettura dell'interfaccia utente, rendendo più rapido trovare i file.
*   Le distinzioni tra `features`, `shared` e `core` vengono rafforzate.
