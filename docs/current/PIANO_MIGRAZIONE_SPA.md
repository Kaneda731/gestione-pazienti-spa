# Piano di Migrazione: Da Google Apps Script a Single Page Application (SPA)

**Versione:** 1.0
**Data:** 2 luglio 2025
**Autore:** Gemini

## 1. Visione e Obiettivi

Questo documento descrive il piano per far evolvere l'attuale Web App basata su Google Apps Script (GAS) in una moderna **Single Page Application (SPA)**.

### 1.1. Problemi Attuali

L'architettura attuale, che usa GAS per servire l'interfaccia utente (frontend), presenta diverse limitazioni che abbiamo riscontrato:
- **Restrizioni di Sicurezza:** Il "sandboxing" di GAS impedisce reindirizzamenti fluidi, causando errori e blocchi dell'interfaccia.
- **Esperienza Utente (UX) Lenta:** Ogni pagina richiede un caricamento completo dal server, rendendo la navigazione macchinosa.
- **Complessità Inutile:** Mantenere la logica di autenticazione e navigazione all'interno delle limitazioni di GAS è diventato complesso e fragile.
- **Dipendenza da un Ecosistema Chiuso:** Lo sviluppo e il deployment sono legati all'ecosistema di Google Apps Script, limitando l'uso di strumenti moderni.

### 1.2. Obiettivi della Nuova Architettura

La migrazione a una SPA mira a raggiungere i seguenti obiettivi:
- **Performance e Fluidità:** Creare un'applicazione veloce e reattiva, dove la navigazione tra le sezioni è istantanea.
- **Esperienza Utente Moderna:** Implementare un flusso di autenticazione standard e sicuro tramite **Login con Google**, eliminando la necessità di password.
- **Semplificazione e Manutenibilità:** Centralizzare la logica in un unico punto, rendendo il codice più pulito, facile da capire e da manutenere.
- **Deployment Moderno e Gratuito:** Sganciarsi da GAS per il frontend e utilizzare servizi di hosting standard, gratuiti e automatizzati come Netlify o Vercel.

### 1.3. Architettura Finale
L'architettura finale sarà così composta:
- **Frontend:** Un'applicazione a pagina singola (SPA) scritta in HTML, CSS e JavaScript puro.
- **Backend & Database:** **Supabase**, per la gestione dei dati e l'autenticazione.
- **Hosting:** **Netlify** (o Vercel/GitHub Pages), collegato direttamente al nostro repository GitHub per un deployment automatico e continuo.

---

## 2. Piano di Implementazione Dettagliato

Il piano è suddiviso in fasi sequenziali.

### Fase 1: Configurazione dell'Autenticazione Google

Questo è l'unico passaggio che richiede un'azione manuale da parte tua, ma è fondamentale per procedere.

**Azione (Utente): Configurare il Provider OAuth di Google**

1.  **Vai alla Google Cloud Console:** Apri [console.cloud.google.com](https://console.cloud.google.com/) e seleziona il progetto Cloud associato a questo Apps Script.
2.  **Crea Credenziali OAuth:**
    -   Dal menu, vai su `API e servizi` > `Credenziali`.
    -   Clicca `+ CREA CREDENZIALI` e scegli `ID client OAuth 2.0`.
    -   Se richiesto, configura la "Schermata di consenso OAuth". Per "Tipo di utente", scegli "Esterno". Inserisci un nome per l'app (es. "Gestione Pazienti"), la tua email e salva.
3.  **Configura l'ID Client:**
    -   **Tipo di applicazione:** Seleziona `Applicazione web`.
    -   **URI di reindirizzamento autorizzati:** Questo è il passaggio cruciale.
        1.  Apri il tuo progetto Supabase in un'altra scheda.
        2.  Vai su `Authentication` > `Providers` e clicca su `Google`.
        3.  Copia l'**URL di reindirizzamento (Redirect URI)** che Supabase ti fornisce. Sarà simile a `https://<id-progetto>.supabase.co/auth/v1/callback`.
        4.  Torna nella Google Cloud Console e incolla questo URL nella sezione `URI di reindirizzamento autorizzati`.
4.  **Salva e Ottieni le Credenziali:**
    -   Clicca su `Crea`. Google ti fornirà un **ID client** e un **Client secret**.
    -   Torna su Supabase e incolla l'ID client e il Client secret nei campi corrispondenti.
    -   Abilita e salva il provider Google in Supabase.

> **Checkpoint:** Una volta completata questa fase, comunicamelo. Da qui in poi, potrò procedere con tutte le modifiche al codice.

### Fase 2: Sviluppo della Single Page Application (SPA)

**Azione (Gemini): Trasformazione del Frontend**

1.  **Struttura a Pagina Singola:**
    -   Modificherò `index.html` per renderlo il contenitore principale dell'intera applicazione.
    -   Le attuali pagine (`grafico.html`, `dimissionePaziente.html`, `inserimentoPazienteSupabase.html`) verranno trasformate in "viste" (frammenti di HTML).
2.  **Logica Centralizzata:**
    -   Creerò un nuovo file JavaScript, `src/app.js`, che conterrà tutta la logica principale:
        -   **Router Semplice:** Un piccolo router gestirà quale vista mostrare in base all'URL (es. `.../index.html#grafico`).
        -   **Gestione dello Stato:** Controllerà se l'utente è loggato o meno.
        -   **Rendering Dinamico:** Inserirà dinamicamente il codice HTML delle viste nel contenitore principale di `index.html`.
3.  **Implementazione del Flusso di Autenticazione:**
    -   Rimuoverò il vecchio form di login.
    -   Aggiungerò un componente (banner/header) visibile in tutte le viste.
    -   Questo componente mostrerà:
        -   Un pulsante **"Accedi con Google"** se l'utente non è autenticato.
        -   L'email dell'utente e un pulsante **"Logout"** se l'utente è autenticato.
    -   Collegherò il pulsante di login alla funzione `supabase.auth.signInWithOAuth({ provider: 'google' })`.
4.  **Protezione delle Viste:**
    -   La vista del **grafico** sarà pubblica e visibile a tutti.
    -   Le viste di **inserimento** e **dimissione** saranno protette: se l'utente non è loggato, visualizzerà un messaggio che lo invita ad accedere, invece del form.

### Fase 3: Pulizia e Finalizzazione

**Azione (Gemini): Refactoring del Progetto**

1.  **Rimozione Dipendenze da GAS:**
    -   Eliminerò tutte le chiamate a `google.script.run`.
    -   Le credenziali di Supabase (URL e Anon Key), che sono sicure da esporre, verranno inserite direttamente in `app.js`.
2.  **Eliminazione File Obsoleti:**
    -   Una volta che la SPA sarà funzionante, eliminerò i seguenti file per mantenere il progetto pulito:
        -   `login.html`
        -   `grafico.html`
        -   `dimissionePaziente.html`
        -   `inserimentoPazienteSupabase.html`
        -   Qualsiasi file `.gs` (come `WebApp.js`) usato solo per servire le pagine HTML.

### Fase 4: Deployment su Hosting Statico

**Azione (Utente, con la mia guida): Messa in Produzione**

1.  **Crea un Account Gratuito:** Ti guiderò nella creazione di un account su [Netlify](https://www.netlify.com/).
2.  **Collega il Repository:** Dal pannello di Netlify, collegheremo questo repository GitHub.
3.  **Configura il Build:** Imposteremo la directory principale del progetto. Non sono necessari comandi di build complessi per un sito statico.
4.  **Go-Live:** Netlify distribuirà automaticamente il sito e ci fornirà un URL pubblico. Da quel momento, ogni modifica al codice su GitHub verrà pubblicata automaticamente.

---

## 3. Prossimi Passi

Se sei d'accordo con questo piano, il primo passo è la **Fase 1**. Procedi con la configurazione del provider Google e fammi sapere quando hai terminato.
