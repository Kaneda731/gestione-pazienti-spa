## 🔧 CONFIGURAZIONE SUPABASE PER SERVER INTERNI

### Passi per risolvere il problema OAuth Google su server V Gold:

#### 1. **Accedi al Dashboard Supabase**
- Vai su: https://supabase.com/dashboard
- Seleziona il tuo progetto: `aiguzywadjzyrwandgba`

#### 2. **Configura i Redirect URLs**
- Vai in: **Authentication** → **URL Configuration**
- Aggiungi questi URL nella sezione **Redirect URLs**:

```
http://localhost:8080/*
http://127.0.0.1:8080/*
http://[DOMINIO-VGOLD]/*
http://[IP-SERVER-INTERNO]/*
https://[DOMINIO-VGOLD]/*
https://[IP-SERVER-INTERNO]/*
```

#### 3. **Configura Site URL**
Imposta come **Site URL** il dominio principale del server V Gold:
```
http://[DOMINIO-VGOLD]
```

#### 4. **Verifica Provider Google**
- Vai in: **Authentication** → **Providers**
- Assicurati che **Google** sia abilitato
- Controlla che **Client ID** e **Client Secret** siano configurati

### 🚀 **ALTERNATIVA RAPIDA: Usa il nuovo sistema Email/Password**

Il codice è già stato aggiornato per supportare:
- ✅ **Login Email/Password** (funziona sempre)
- ✅ **Bypass Sviluppo** (per test su server interni)
- ✅ **Registrazione utenti** (per creare account interni)

### 🎯 **Come usare ora:**

1. **Su server interno**: Vedrai automaticamente il "Bypass Sviluppo"
2. **Per produzione**: Usa "Login Email/Password"
3. **Per Google OAuth**: Configura i redirect URI come sopra
