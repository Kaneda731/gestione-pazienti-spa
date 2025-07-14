# 🚨 GUIDA DEBUG - Pazienti che ricompaiono

## Problema
I pazienti eliminati ricompaiono immediatamente perché probabilmente stai usando dati MOCK/locali invece del database Supabase reale.

## Soluzione Rapida (2 minuti)

### 1. Verifica immediata
Apri la console del browser (F12) e incolla questo codice:

```javascript
// Verifica se stai usando dati reali o mock
(async () => {
    console.log('=== VERIFICA DATI ===');
    
    // Controlla localStorage
    const mockData = localStorage.getItem('mockPatients');
    console.log('🎭 Dati mock:', mockData ? 'PRESENTI' : 'Assenti');
    
    // Controlla database reale
    const { supabase } = await import('./src/core/services/supabaseClient.js');
    const { data, count } = await supabase.from('pazienti').select('*', { count: 'exact' });
    console.log('🗄️ Pazienti reali:', count);
    
    if (mockData) {
        console.log('⚠️ Stai usando dati MOCK! Puliscili con: localStorage.clear()');
    }
})();
```

### 2. Pulisci dati mock
Se il passaggio 1 mostra dati mock, esegui:

```javascript
// Pulisci tutto
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### 3. Verifica connessione database
Dopo il refresh, clicca sul pulsante arancione "Debug DB" che apparirà in alto a destra.

### 4. Crea un paziente reale
Se non hai pazienti reali, usa il modulo di inserimento per crearne uno.

## Debug Avanzato

### Comandi console disponibili:
- `debugDB()` - Verifica connessione database
- `clearAllData()` - Pulisce tutti i dati locali
- `createTestPatient()` - Crea paziente test reale
- `listAllPatients()` - Mostra differenza tra dati locali e reali

### Pulsanti visibili su localhost:
- 🔍 **Debug DB** (in alto a destra, arancione)
- 🐛 **Debug DB** (nella barra azioni sotto la tabella)

## Risultato atteso
Dopo aver pulito i dati mock e creato pazienti reali:
- I pazienti eliminati NON ricompariranno
- I dati saranno persistenti nel database Supabase
- Il contatore mostrerà pazienti reali (non 0)

## Se il problema persiste
1. Verifica che Supabase sia configurato correttamente in `.env`
2. Controlla che l'utente sia autenticato
3. Usa il comando `debugDB()` per dettagli tecnici