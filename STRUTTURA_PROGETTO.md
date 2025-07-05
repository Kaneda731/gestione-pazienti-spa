# Struttura del Progetto Gestione Pazienti SPA

## Panoramica
Questa è una Single Page Application (SPA) per la gestione pazienti, costruita con vanilla JavaScript, Bootstrap 5, e Supabase come backend.

## Struttura delle Cartelle

### `/src/` - Codice sorgente principale
```
src/
├── index.html              # File HTML principale
├── favicon.svg             # Icona del sito
├── css/                    # Fogli di stile
│   ├── style.css          # CSS principale con import modulari
│   └── modules/           # Moduli CSS organizzati
│       ├── variables.css  # Variabili CSS custom
│       ├── base.css       # Stili di base
│       ├── components/    # Componenti UI
│       ├── layout/        # Layout e responsive
│       ├── themes/        # Temi (dark mode)
│       └── mobile/        # Ottimizzazioni mobile
└── js/                    # Script JavaScript
    ├── app.js            # Punto di ingresso principale
    ├── auth.js           # Sistema di autenticazione (versione minimal)
    ├── router.js         # Sistema di routing SPA
    ├── supabase.js       # Configurazione Supabase
    ├── ui.js             # Utilità per interfaccia utente
    ├── utils.js          # Utilità generali
    ├── mobile-cards-examples.js  # Esempi per mobile cards
    ├── mobile-navigation.js      # Sistema navigazione mobile innovativo (v2.3.0)
    ├── components/       # Componenti JavaScript riutilizzabili
    │   └── CustomSelect.js
    └── views/            # Viste dell'applicazione
        ├── form.js       # Vista inserimento pazienti
        ├── list.js       # Vista lista pazienti
        ├── grafico.js    # Vista grafici/statistiche
        ├── dimissione.js # Vista dimissioni
        └── diagnosi.js   # Vista diagnosi
```

### `/tests/` - File di test e sviluppo
```
tests/
├── test-auth-complete.html     # Test completo autenticazione
├── test-auth-minimal.html      # Test autenticazione minimale
├── test-google-login.html      # Test specifico Google OAuth
├── test-login.html            # Test login base
├── test-mobile-login.html     # Test login mobile
└── test-mobile-navigation.html # Demo navigazione mobile innovativa
```

### `/archive/` - Backup e versioni precedenti
```
archive/
├── js-backup/          # Backup file JavaScript
├── css-backup/         # Backup file CSS
└── test-reports/       # Report di test precedenti
```
```
docs/
├── MOBILE_CARDS_GUIDE.md    # Guida per mobile cards
└── current/                 # Documentazione corrente
    ├── PIANO_SVILUPPO_SPA.md
    ├── STATO_PROGETTO_*.md
    ├── CONFIGURAZIONE_AUTH_SERVER_INTERNO.md
    └── [altri documenti tecnici]
```

### `/tests/` - File di test
```
tests/
├── test-auth-minimal.html    # Test autenticazione minimal
├── test-auth-complete.html   # Test autenticazione completo
├── test-login.html          # Test sistema di login
└── test-mobile-login.html   # Test login mobile
```

### `/archive/` - File archiviati
```
archive/
├── js-backup/              # Backup file JavaScript
│   ├── auth-backup-*.js    # Versioni precedenti auth.js
│   ├── auth-refactored*.js # Versioni refactoring
│   ├── auth/              # Moduli auth non più utilizzati
│   └── utils/             # Moduli utils non più utilizzati
├── css-backup/            # Backup file CSS
│   ├── style-backup.css
│   └── style-new.css
├── TESTING_RESULTS_FINAL.md
└── TEST_REPORT.md
```

## File JavaScript Principali

### `app.js`
- Punto di ingresso dell'applicazione
- Inizializza l'autenticazione e il routing
- Gestisce il tema dark/light mode

### `auth.js` (Versione Minimal)
- Sistema di autenticazione completo (393 righe, ridotto da 1245)
- Login email/password e Google OAuth
- Gestione clock skew Supabase
- Bypass sviluppo per localhost
- UI autenticazione responsive mobile

### `router.js`
- Sistema di routing client-side
- Gestione navigazione tra viste
- Controllo accesso autenticato
- Integrazione con navigazione mobile

### `mobile-navigation.js` (v2.3.0)
- Sistema navigazione mobile innovativo
- FAB (Floating Action Button) con menu espandibile
- Breadcrumb mobile compatto con glassmorphism
- Integrazione automatica con router
- Nasconde pulsanti tradizionali su mobile

### Viste (`views/`)
- Ogni file gestisce una specifica funzionalità dell'app
- Moduli autonomi importati dinamicamente

## Caratteristiche Tecniche

### Responsive Design
- Bootstrap 5 per la griglia e componenti base
- CSS custom modulare per personalizzazioni
- Ottimizzazioni specifiche per mobile

### Autenticazione
- Integrazione Supabase Auth
- Supporto OAuth (Google)
- Gestione robusta del clock skew
- Bypass sviluppo per testing locale

### Performance
- Caricamento modulare delle viste
- CSS organizzato in moduli
- Minimizzazione delle dipendenze

## Deploy
- Configurato per Netlify (vedi `netlify.toml`)
- Build automatico da repository Git
- Hosting statico con redirect SPA

## Manutenzione

### Aggiunta Nuove Funzionalità
1. Creare nuova vista in `src/js/views/`
2. Aggiungere route in `router.js`
3. Aggiornare menu se necessario

### Gestione CSS
- Aggiungere nuovi stili in moduli specifici
- Importare in `style.css`
- Mantenere separazione desktop/mobile

### Backup e Versioning
- File obsoleti vanno in `/archive/`
- Usare git tags per versioni stabili
- Documentare cambiamenti significativi
