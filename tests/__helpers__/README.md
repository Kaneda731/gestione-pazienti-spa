# Test Helpers Directory

Questa directory contiene utility functions e helper per semplificare la scrittura dei test.

## Files

- `test-utils.js` - Utilities generali per test (wait, retry, etc.)
- `dom-helpers.js` - Helper per manipolazione DOM nei test
- `async-helpers.js` - Helper per test asincroni e Promise
- `performance-helpers.js` - Utilities per monitoring performance test
- `TestSuiteGenerator.js` - Generatore automatico suite test
- `TestPerformanceMonitor.js` - Monitor performance test

## Usage

```javascript
import { wait, expectToThrow } from '../__helpers__/test-utils.js';
import { createMockElement, simulateClick } from '../__helpers__/dom-helpers.js';
import { waitForAsync, mockPromise } from '../__helpers__/async-helpers.js';

// Aspetta 100ms
await wait(100);

// Simula click su elemento
const button = createMockElement('button');
simulateClick(button);

// Test asincrono
await waitForAsync(() => someAsyncOperation());
```

## Principles

- Funzioni riutilizzabili per pattern comuni
- API semplici e intuitive
- Performance ottimizzate
- Documentazione inline completa