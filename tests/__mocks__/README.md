# Test Mocks Directory

Questa directory contiene mock centralizzati e riutilizzabili per l'intera suite di test.

## Files

- `MockFactory.js` - Factory principale per creazione mock
- `supabase.js` - Mock completo per Supabase client con dati realistici
- `dom.js` - Mock per elementi DOM e API browser
- `chart.js` - Mock per Chart.js e librerie grafici
- `services.js` - Mock per servizi comuni dell'applicazione

## Usage

```javascript
import { MockFactory } from '../__mocks__/MockFactory.js';

const mockSupabase = MockFactory.createSupabaseMock();
const mockDOM = MockFactory.createDOMMock('div', { id: 'test' });
```

## Principles

- Mock realistici che riflettono l'API reale
- Configurabili per diversi scenari di test
- Reset automatico tra test
- Performance ottimizzate