# Test Structure per Moduli Refactorizzati

Questa directory contiene la struttura di test per i nuovi moduli creati durante il refactoring del codebase.

## Struttura Directory

```
tests/
├── features/                          # Test per moduli feature-based
│   ├── charts/                        # Test per funzionalità grafici
│   │   ├── components/
│   │   │   └── responsive-adapter/    # Test per componenti responsive
│   │   └── services/
│   │       ├── chart-loader/          # Test per caricamento Chart.js
│   │       └── chart-config/          # Test per configurazione grafici
│   └── patients/                      # Test per funzionalità pazienti
│       └── services/
│           ├── patient-crud/          # Test per operazioni CRUD
│           ├── patient-validation/    # Test per validazione dati
│           └── patient-cache/         # Test per sistema di cache
├── utils/                             # Utilities per test
│   └── test-helpers.js               # Helper functions e mock
├── templates/                         # Template per nuovi test
│   └── module-test-template.js       # Template standardizzato
└── run-module-tests.js               # Script per eseguire tutti i test
```

## Configurazione Test

### Vitest Configuration
Il file `vitest.config.js` è configurato per:
- Ambiente jsdom per simulare il browser
- Inclusione di tutti i file `*.test.js` e `*.spec.js`
- Esclusione delle directory template
- Setup automatico degli helper di test
- Configurazione coverage per i nuovi moduli

### Test Helpers
Il file `tests/utils/test-helpers.js` fornisce:
- Mock per Supabase client con dati realistici
- Mock per device detector (responsive charts)
- Mock per theme manager
- Mock per sistema di cache
- Mock per validator
- Utilities per mock di DOM e window
- Dati di esempio per pazienti, reparti e diagnosi
- Helper per test di performance

## Integrazione con Supabase

I test sono configurati per riflettere l'architettura reale del progetto:

### Tabelle Database
- `pazienti` - Dati pazienti principali
- `reparti` - Lista reparti ospedalieri (da database)
- `diagnosi` - Lista diagnosi mediche (da database)
- `reparto_diagnosi_compatibilita` - Regole di compatibilità

### Mock Dati Realistici
```javascript
// Reparti dal database Supabase
const reparti = [
  { id: 1, nome: 'Medicina', descrizione: 'Reparto di Medicina Generale', attivo: true },
  { id: 2, nome: 'Chirurgia', descrizione: 'Reparto di Chirurgia Generale', attivo: true },
  // ...
];

// Diagnosi dal database Supabase
const diagnosi = [
  { id: 1, nome: 'Ipertensione', categoria: 'Cardiovascolare', codice_icd: 'I10', attivo: true },
  { id: 2, nome: 'Diabete Mellito', categoria: 'Endocrinologica', codice_icd: 'E11', attivo: true },
  // ...
];
```

## Esecuzione Test

### Comandi Disponibili
```bash
# Esegui tutti i test
npm test

# Esegui test dei moduli refactorizzati
npm run test:modules

# Esegui test in modalità watch
npm run test:watch

# Genera report coverage
npm run test:coverage
```

### Test Runner Personalizzato
Lo script `tests/run-module-tests.js` fornisce:
- Esecuzione sequenziale di tutti i test dei moduli
- Report dettagliato dei risultati
- Controllo esistenza file di test
- Generazione automatica coverage se tutti i test passano
- Codici di uscita appropriati per CI/CD

## Categorie di Test

### 1. Chart Components
- **DeviceDetector**: Rilevamento dispositivo e orientamento
- **OptionsAdapter**: Adattamento opzioni per dispositivi
- **EventHandler**: Gestione eventi responsive

### 2. Chart Services
- **ChartLoader**: Caricamento dinamico Chart.js
- **ChartConfigManager**: Gestione configurazioni grafici

### 3. Patient Services
- **PatientCRUD**: Operazioni database con Supabase
- **PatientValidator**: Validazione con lookup database
- **PatientCache**: Sistema di cache con TTL

## Template per Nuovi Test

Il file `tests/templates/module-test-template.js` fornisce una struttura standardizzata per:
- Inizializzazione e configurazione
- Test funzionalità core
- Interazione con dipendenze
- Gestione errori
- Casi edge
- Performance
- Integrazione
- Cleanup risorse

### Utilizzo Template
1. Copia il template nella directory appropriata
2. Sostituisci `MODULE_NAME` e `MODULE_PATH`
3. Personalizza i test per il modulo specifico
4. Rimuovi sezioni non applicabili

## Best Practices

### Struttura Test
- Un file di test per modulo
- Raggruppamento logico con `describe`
- Test atomici e indipendenti
- Setup e cleanup appropriati

### Mock e Stub
- Usa helper centralizzati per mock comuni
- Mock realistici che riflettono l'API Supabase
- Isolamento delle dipendenze esterne
- Verifica delle interazioni con mock

### Dati di Test
- Usa dati realistici dal database
- Testa con dati validi e invalidi
- Considera casi edge e limiti
- Testa performance con dataset grandi

### Integrazione Database
- Mock chiamate Supabase con dati realistici
- Testa validazione contro tabelle lookup
- Simula errori di rete e timeout
- Verifica caching e invalidazione

## Stato Attuale

⚠️ **Nota**: I test sono stati creati come struttura per i moduli che verranno implementati durante il refactoring. Attualmente i test falliranno perché i moduli non esistono ancora.

### Prossimi Passi
1. Implementare i moduli secondo il design
2. Aggiornare i test per riflettere l'implementazione reale
3. Eseguire i test e correggere eventuali problemi
4. Aggiungere test aggiuntivi per casi specifici

### Coverage Target
- Minimo 80% coverage per tutti i nuovi moduli
- 100% coverage per funzioni critiche (validazione, CRUD)
- Test di integrazione per flussi completi
- Test di performance per operazioni intensive