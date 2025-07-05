# Gestione Clock Skew Supabase - Guida Implementazione

## Panoramica

Questo documento descrive l'implementazione della gestione robusta degli errori di clock skew di Supabase nell'applicazione di gestione pazienti SPA.

## Problema

L'errore Supabase `"Session as retrieved from URL was issued in the future? Check the device clock for skew"` si verifica quando c'è una differenza di tempo significativa tra il client e il server. Questo può causare:

- Fallimenti di autenticazione
- Sessioni non valide
- Problemi con token OAuth
- Interruzioni dell'esperienza utente

## Soluzione Implementata

### 1. Clock Skew Handler (`clock-skew-handler.js`)

**Funzionalità principali:**
- **Rilevamento automatico**: Identifica errori di clock skew tramite pattern nel messaggio di errore
- **Estrazione timestamp**: Analizza i timestamp dall'errore per calcolare la differenza
- **Retry automatico**: Gestisce automaticamente piccole differenze (<5 secondi)
- **Notifiche utente**: Avvisa l'utente per differenze significative
- **Logging dettagliato**: Registra informazioni di debug per troubleshooting

**Configurazione:**
```javascript
const handler = new ClockSkewHandler();
handler.maxRetries = 3;                    // Numero massimo di retry
handler.retryDelay = 1000;                 // Delay tra retry (ms)
handler.maxAcceptableSkew = 5000;          // Differenza accettabile (ms)
```

### 2. Sistema di Notifiche (`notification-system.js`)

**Caratteristiche:**
- Design responsive e accessibile
- Integrazione con il tema dell'app
- Azioni interattive (Riprova, Ricarica, Ignora)
- Notifiche persistenti per problemi critici
- Dismissal automatico configurabile

**Utilizzo:**
```javascript
// Notifica di clock skew
notificationSystem.showClockSkewNotification(skewInfo);

// Notifica generica
notificationSystem.show({
    title: 'Titolo',
    message: 'Messaggio',
    type: 'warning',    // success, warning, error, info
    duration: 5000,     // ms, 0 per persistente
    actions: [
        { text: 'Azione', value: 'action_value', primary: true }
    ]
});
```

### 3. Integrazione Autenticazione (`auth-refactored-with-clock-skew.js`)

**Funzioni protette:**
- `signInWithEmail()` - Login email/password
- `signUpWithEmail()` - Registrazione
- `signInWithGoogle()` - Login OAuth Google
- `signOut()` - Logout
- `checkSession()` - Verifica sessione

**Comportamento:**
1. **Tentativo normale** dell'operazione
2. **Rilevamento errore** clock skew
3. **Retry automatico** per differenze piccole
4. **Notifica utente** per differenze significative
5. **Feedback visivo** con suggerimenti di risoluzione

## Implementazione Step-by-Step

### Passo 1: Importare i Moduli

```javascript
import { 
    handleClockSkewError, 
    isClockSkewError 
} from './auth/clock-skew-handler.js';
import notificationSystem from './utils/notification-system.js';
```

### Passo 2: Wrapper delle Funzioni di Autenticazione

```javascript
export async function signInWithEmail(email, password) {
    const attemptLogin = async () => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email, password
        });
        if (error) throw error;
        return { success: true, data };
    };

    try {
        return await attemptLogin();
    } catch (error) {
        if (isClockSkewError(error)) {
            try {
                return await handleClockSkewError(error, attemptLogin, {
                    showUserNotification: true,
                    logError: true,
                    autoRetry: true
                });
            } catch (clockError) {
                return { 
                    success: false, 
                    error: clockError.message, 
                    clockSkewDetected: true 
                };
            }
        }
        return { success: false, error: error.message };
    }
}
```

### Passo 3: Gestione UI con Feedback

```javascript
export async function handleLoginSubmit(event) {
    // ... validazione form ...
    
    const result = await signInWithEmail(email, password);
    
    if (result.success) {
        showModalSuccess('Accesso effettuato!');
    } else {
        if (result.clockSkewDetected) {
            notificationSystem.showAuthError(result.error, true);
        } else {
            showModalError(result.error);
        }
    }
}
```

## Configurazione Avanzata

### Monitoring Continuo

```javascript
// Avvia monitoring clock skew (opzionale)
const monitorId = startClockSkewMonitoring((skewInfo) => {
    if (skewInfo.skew > 10000) { // > 10 secondi
        notificationSystem.show({
            title: 'Attenzione Orario',
            message: `Differenza di ${Math.round(skewInfo.skew/1000)}s rilevata`,
            type: 'warning'
        });
    }
});

// Ferma monitoring
clearInterval(monitorId);
```

### Customizzazione Notifiche

```javascript
// Override del comportamento di notifica
window.showNotification = async (options) => {
    return await customNotificationHandler(options);
};
```

### Logging Personalizzato

```javascript
// Override del sistema di logging
window.logError = (type, data) => {
    // Invia a servizio di logging esterno
    analyticsService.trackError(type, data);
};
```

## Pattern di Errori Rilevati

Il sistema rileva errori contenenti questi pattern:
- `"issued in the future"`
- `"clock skew"`
- `"time difference"`
- `"timestamp"`
- `"invalid time"`

## Azioni Utente Disponibili

1. **Riprova**: Esegue nuovamente l'operazione
2. **Ricarica Pagina**: Refresh completo dell'applicazione  
3. **Ignora**: Annulla l'operazione (non raccomandato)

## Logging e Debug

Tutte le istanze di clock skew vengono loggiate con:
- Messaggio di errore originale
- Timestamp estratti e differenza calcolata
- User agent e timezone del dispositivo
- URL corrente e ora locale
- Tentativi di retry effettuati

## Best Practices

1. **Non disabilitare** il retry automatico per piccole differenze
2. **Monitorare** i log di clock skew per identificare pattern
3. **Educare gli utenti** sull'importanza della sincronizzazione orario
4. **Testare** su dispositivi con orari volutamente scorretti
5. **Implementare** fallback per operazioni critiche

## Testing

### Test Manuale Clock Skew

```bash
# Modifica l'orario di sistema per testare
sudo date -s "2025-01-04 12:00:00"  # Linux/Mac
# Oppure modifica tramite impostazioni sistema su Windows

# Testa le funzioni di autenticazione
# Ripristina l'orario corretto dopo il test
```

### Test Automatico

```javascript
// Mock dell'errore di clock skew per test
const mockClockSkewError = new Error(
    "Session as retrieved from URL was issued in the future? Check the device clock for skew. 1751726233 > 1751726231"
);

// Test del handler
const result = await handleClockSkewError(
    mockClockSkewError, 
    mockRetryFunction,
    { autoRetry: true }
);
```

## Troubleshooting

### Problemi Comuni

1. **Notifiche non visualizzate**
   - Verificare che `notification-system.js` sia importato
   - Controllare la console per errori CSS

2. **Retry infiniti**
   - Verificare `maxRetries` e `maxAcceptableSkew`
   - Controllare se l'errore persiste dopo correzione orario

3. **Sessioni sempre invalide**
   - Verificare la sincronizzazione NTP del server
   - Controllare i log Supabase per errori server-side

### Debug Steps

1. Aprire DevTools e verificare console
2. Controllare tab Network per timing delle richieste
3. Verificare localStorage/sessionStorage per token corrotti
4. Testare con `new Date()` in console per orario locale

## Migrazione dall'Auth Esistente

1. **Backup** del file `auth.js` originale
2. **Sostituire** import con `auth-refactored-with-clock-skew.js`
3. **Testare** tutte le funzioni di autenticazione
4. **Monitorare** i log per errori di clock skew
5. **Rimuovere** il file originale dopo conferma stabilità

## Considerazioni di Performance

- **Overhead minimo**: Il rilevamento clock skew aggiunge <1ms per chiamata
- **Retry limitati**: Massimo 3 tentativi per evitare loop infiniti
- **Cleanup automatico**: Le notifiche si auto-dismissano
- **Memory management**: Il monitoring si ferma automaticamente al logout
