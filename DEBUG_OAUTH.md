# Debug OAuth con Vite - Istruzioni per il Test

## Come testare le modifiche applicate

### 1. Avvia il server Vite
```bash
npm run dev
```

### 2. Apri il browser su http://localhost:5174

### 3. Apri la console del browser (F12)

### 4. Esegui i test diagnostici
Nella console, digita:
```javascript
await window.testOAuth()
```

Questo test verificherà:
- ✅ Se Vite è pronto
- ✅ Se Supabase è pronto
- ✅ Se l'OAuth manager è inizializzato correttamente
- ✅ Se la configurazione dell'ambiente è corretta
- ✅ Se la connessione di rete a Supabase funziona

### 5. Test del flusso OAuth
Nella console, digita:
```javascript
await window.testOAuthFlow()
```

Questo dovrebbe avviare il flusso OAuth senza errori 401.

### 6. Cosa cercare nei log

**Log di successo:**
```
Middleware Vite-Supabase pronto
Vite è pronto
Supabase è pronto
OAuth Manager State: Stato: idle, Inizializzato: true
Iniziando login OAuth con redirect: http://localhost:5174
Login OAuth iniziato con successo
```

**Log di errore (problema non risolto):**
```
Errore nella chiamata OAuth: {status: 401, message: "Unauthorized"}
```

## Modifiche apportate

### 1. Configurazione Vite (vite.config.js)
- Rimossa configurazione CORS conflittuale
- Corretta la porta a 5174
- Semplificata la configurazione del server

### 2. Client Supabase (supabaseClient.js)
- Aggiunta rilevazione dinamica della porta
- Migliorata la configurazione del client
- Aggiunta configurazione specifica per Vite

### 3. Nuovo Middleware (viteSupabaseMiddleware.js)
- Gestisce i problemi di timing tra Vite e Supabase
- Fornisce un'inizializzazione sincronizzata
- Gestisce la pulizia dello stato corrotto

### 4. OAuth Service (oauthService.js)
- Integrato con il middleware
- Redirect URL dinamico
- Migliore gestione degli errori

### 5. App principale (app.js)
- Integrato il middleware nell'inizializzazione
- Avvio sincronizzato dei servizi

## In caso di problemi persistenti

Se l'errore 401 persiste, controlla:

1. **Dashboard Supabase**: Assicurati che http://localhost:5174 sia nella lista dei redirect URL
2. **Variabili d'ambiente**: Verifica che le chiavi in .env.development siano corrette
3. **Stato del browser**: Prova in modalità incognito o pulisci localStorage
4. **Rete**: Controlla che non ci siano proxy o firewall che bloccano le richieste

## Problemi risolti

### ✅ Mantenimento di localhost dopo login
- **Problema**: Dopo il login OAuth, l'applicazione non manteneva localhost:5174
- **Soluzione**: 
  - Migliorato il cleanup dell'URL per mantenere localhost
  - Aggiunto controllo nel callback OAuth per verificare che siamo su localhost
  - Redirect automatico se non siamo su localhost:5174
  - Controllo nel router per garantire la coerenza dell'URL

### ✅ Gestione callback OAuth
- **Problema**: Il callback OAuth non veniva gestito correttamente
- **Soluzione**:
  - Migliorata la gestione del callback OAuth
  - Aggiunto redirect automatico alla home o pagina salvata
  - Controllo esplicito dell'URL di redirect

## Comandi di debug utili

```javascript
// Verifica lo stato corrente del middleware
console.log(viteSupabaseMiddleware.isReady())

// Verifica la configurazione
console.log(import.meta.env)

// Pulisci lo stato corrotto manualmente
viteSupabaseMiddleware.clearCorruptedState()

// Verifica lo stato OAuth
console.log(oauthManager.getAuthState())
```
