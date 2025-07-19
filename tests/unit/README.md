# Unit Tests Directory

Test unitari per componenti, servizi e utilities individuali.

## Structure

```
unit/
├── core/           # Test per servizi core (auth, error, logger)
├── shared/         # Test per componenti condivisi (UI, utilities)
└── features/       # Test per feature specifiche (charts, patients)
```

## Naming Convention

- `ComponentName.test.js` per componenti
- `serviceName.test.js` per servizi  
- `utilityName.test.js` per utilities

## Test Focus

- Comportamento singola unità
- Mock di tutte le dipendenze
- Test rapidi (< 100ms ciascuno)
- Coverage completa funzioni pubbliche