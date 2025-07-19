# Test Fixtures Directory

Questa directory contiene dati di test riutilizzabili e realistici.

## Files

- `patients.js` - Dati pazienti di esempio con struttura Supabase
- `charts.js` - Dati per grafici (pie, bar, line) con diversi formati
- `forms.js` - Dati per form e validazione
- `departments.js` - Dati reparti ospedalieri
- `diagnoses.js` - Dati diagnosi mediche

## Usage

```javascript
import { samplePatients, createPatient } from '../__fixtures__/patients.js';
import { chartData } from '../__fixtures__/charts.js';

// Usa dati predefiniti
const patient = samplePatients.basic;

// Crea dati personalizzati
const customPatient = createPatient({ nome: 'Mario', reparto: 'Cardiologia' });
```

## Principles

- Dati realistici che riflettono la struttura database
- Varianti per diversi scenari di test
- Facili da personalizzare e estendere
- Consistenti con l'API Supabase