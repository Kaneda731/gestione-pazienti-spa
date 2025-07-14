# Debug Guide - Pazienti SPA

## 🎯 Obiettivo
Questa guida ti aiuta a identificare e risolvere il problema dei pazienti che sembrano ricrearsi automaticamente dopo la cancellazione.

## 🔍 Problema Identificato
I pazienti "test" non sono realmente cancellati perché **non sono memorizzati nel database Supabase**, ma sono dati **mock/locali**.

## 🛠️ Strumenti di Debug Disponibili

### 1. Debug Browser (Pulsante Arancione)
Un pulsante di debug apparirà automaticamente in alto a destra quando l'app è in esecuzione su `localhost`.

**Funzionalità:**
- Verifica connessione Supabase
- Conta pazienti reali nel database
- Mostra struttura tabella
- Identifica eventuali errori

### 2. Console Debug Commands
Apri la console del browser (F12) ed esegui:

```javascript
// Test completo connessione
await DebugConnection.runInBrowser();

// Debug specifico del PatientService
await patientService.debug();

// Debug specifico della vista lista
await window.debugDatabaseConnection();
```

### 3. Verifica Database Diretta
Puoi verificare direttamente il database con:

```javascript
// Conta pazienti reali
const { count } = await supabase.from('pazienti').select('*', { count: 'exact' });
console.log('Pazienti reali:', count);

// Vedi tutti i pazienti reali
const { data } = await supabase.from('pazienti').select('*');
console.table(data);
```

## 📋 Passaggi per Risolvere

### 1. Verifica Fonte Dati
Esegui prima il debug per capire da dove vengono i dati:

```javascript
// Nel browser console
await DebugConnection.runInBrowser();
```

### 2. Se i dati sono mock/locali:
- **Pulisci localStorage**: `localStorage.clear()`
- **Pulisci sessionStorage**: `sessionStorage.clear()`
- **Pulisci cache**: `patientService.invalidateCache()`

### 3. Se il database è vuoto:
- I pazienti "test" sono solo dati di esempio
- Puoi crearne di nuovi reali tramite il form di inserimento
- I pazienti reali creati saranno persistenti

### 4. Verifica Schema Database
Assicurati che la tabella `pazienti` abbia queste colonne:
- `id` (uuid, primary key)
- `nome` (text)
- `cognome` (text)
- `data_nascita` (date)
- `data_ricovero` (date)
- `data_dimissione` (date, nullable)
- `diagnosi` (text)
- `reparto_appartenenza` (text)
- `reparto_provenienza` (text)
- `livello_assistenza` (text)
- `codice_rad` (text, max 11 chars)
- `infetto` (boolean)
- `user_id` (uuid, foreign key)

## 🚨 Errori Comuni

### "No rows found"
- Il database è vuoto, crea pazienti reali
- I pazienti "test" sono solo mock

### "Permission denied"
- Verifica l'autenticazione Supabase
- Controlla le RLS (Row Level Security) policies

### "Table not found"
- Verifica che la tabella `pazienti` esista
- Controlla il nome del progetto Supabase

## 🔄 Flusso di Debug Consigliato

1. **Esegui debug completo**: `await DebugConnection.runInBrowser()`
2. **Controlla risultati**: Leggi output in console
3. **Pulisci storage**: Se necessario, pulisci cache e storage
4. **Crea paziente reale**: Usa il form per creare un paziente vero
5. **Verifica persistenza**: Ricarica la pagina e verifica che il paziente reale sia ancora presente
6. **Test cancellazione**: Cancella un paziente reale e verifica che non ricompaia

## 📞 Supporto
Se il problema persiste dopo questi passaggi, controlla:
- Console per errori specifici
- Network tab per chiamate API fallite
- Supabase dashboard per verificare i dati reali