# Integration Tests Directory

Test di integrazione per verificare interazione tra componenti.

## Structure

```
integration/
├── api/            # Test integrazione API e servizi esterni
├── database/       # Test integrazione database (con mock Supabase)
└── workflows/      # Test flussi completi utente
```

## Test Focus

- Interazione tra moduli
- Flussi dati end-to-end
- Mock solo dipendenze esterne
- Scenari realistici utente