# Performance Tests Directory

Test di performance per identificare regressioni e ottimizzazioni.

## Test Types

- **Load Tests**: Performance con dataset grandi
- **Memory Tests**: Utilizzo memoria e memory leaks
- **Rendering Tests**: Performance rendering componenti
- **API Tests**: Tempi risposta servizi

## Thresholds

- Rendering componenti: < 16ms
- Operazioni CRUD: < 100ms  
- Caricamento grafici: < 500ms
- Memory usage: < 50MB per test suite