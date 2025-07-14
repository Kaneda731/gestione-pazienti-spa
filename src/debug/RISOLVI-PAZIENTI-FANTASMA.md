# 🚨 GUIDA RAPIDA: Rimuovere i 4 Pazienti Fantasma

## Problema
I 4 pazienti fantasma sono stati creati da uno script SQL eseguito su Supabase. Questi record non dovrebbero essere presenti nel database.

## Soluzione Immediata

### 🔍 STEP 1: Identifica i record problematici
Vai su [Supabase Dashboard](https://supabase.com/dashboard) e esegui questa query:

```sql
SELECT 
    id,
    nome,
    cognome,
    diagnosi,
    reparto_appartenenza,
    stato,
    data_ricovero,
    created_at
FROM pazienti
ORDER BY id DESC
LIMIT 10;
```

### 🗑️ STEP 2: Rimuovi i record fittizi

**Opzione A - Se conosci gli ID:**
```sql
DELETE FROM pazienti WHERE id IN (/*inserisci gli ID dei 4 pazienti*/);
```

**Opzione B - Rimuovi record incompleti:**
```sql
DELETE FROM pazienti 
WHERE 
    (nome IS NULL OR nome = '' OR nome LIKE '%test%')
    OR
    (cognome IS NULL OR cognome = '' OR cognome LIKE '%test%')
    OR
    (diagnosi IS NULL OR diagnosi = '' OR diagnosi LIKE '%test%');
```

**Opzione C - Rimuovi ultimi 4 record (se sono quelli fittizi):**
```sql
DELETE FROM pazienti 
WHERE id IN (
    SELECT id FROM pazienti 
    ORDER BY created_at DESC 
    LIMIT 4
);
```

### ✅ STEP 3: Verifica
```sql
SELECT COUNT(*) as totale_pazienti FROM pazienti;
SELECT * FROM pazienti ORDER BY id;
```

## Alternativa: Usa il Browser

1. Vai sulla pagina dell'applicazione
2. Apri la console (F12)
3. Esegui:

```javascript
// Identifica i pazienti
await window.supabaseClient
    .from('pazienti')
    .select('id,nome,cognome,diagnosi')
    .then(({data}) => console.table(data));
```

## Prevenzione Futura
- Non eseguire script SQL di test su database di produzione
- Usa sempre `SELECT` prima di `DELETE` per verificare
- Crea backup prima di modifiche significative

## Supporto
Se hai bisogno di aiuto, esegui le query di identificazione e inviami gli ID dei record da rimuovere.