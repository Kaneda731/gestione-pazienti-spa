# Migrazione Supabase - Aggiunta Campi Pazienti

## 📋 Panoramica
Questa guida descrive come aggiungere i campi mancanti alla tabella `pazienti` su Supabase, gestendo correttamente i vincoli di foreign key.

## 🔍 Analisi Effettuata
- **Campi identificati come mancanti**: `data_nascita`, `infetto`, `codice_rad`
- **Campi nel form ma non nella tabella**: 3 campi
- **Vincolo FK**: user_id referenzia la tabella users
- **Formato codice_rad**: Esattamente 11 caratteri numerici

## 🚀 Procedura di Migrazione

### 1. Accesso a Supabase
1. Vai su [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Seleziona il progetto: `aiguzywadjzyrwan...`
3. Naviga su **SQL Editor**

### 2. Esecuzione Script
1. Copia il contenuto di `supabase-migration.sql`
2. Incolla nel SQL Editor
3. Esegui le query una alla volta o tutte insieme

### 3. Query Principale (Sicura)
```sql
-- Migrazione sicura con gestione errori
DO $$
BEGIN
    ALTER TABLE pazienti ADD COLUMN data_nascita DATE NULL;
    ALTER TABLE pazienti ADD COLUMN infetto BOOLEAN NULL DEFAULT false;
    ALTER TABLE pazienti ADD COLUMN codice_rad VARCHAR(11) NULL;
    RAISE NOTICE '✅ Migrazione completata';
END $$;
```

### 4. Test Senza Vincoli FK
```sql
-- Test 1: Inserimento con campi obbligatori
INSERT INTO pazienti (
    nome, cognome, data_ricovero, diagnosi, reparto_appartenenza
) VALUES (
    'Test', 'Utente', '2024-01-10', 'Test diagnosi', 'Cardiologia'
);

-- Test 2: Inserimento con tutti i nuovi campi
INSERT INTO pazienti (
    nome, cognome, data_nascita, data_ricovero, diagnosi, 
    reparto_appartenenza, codice_rad, infetto
) VALUES (
    'Mario', 'Rossi', '1980-05-15', '2024-01-10', 'Influenza',
    'Cardiologia', '20250001968', false
);
```

### 5. Gestione Vincolo user_id
#### Opzione A: Trova user_id valido
```sql
-- Trova un user_id valido per test
SELECT id FROM users LIMIT 1;

-- Usa l'ID trovato nei tuoi inserimenti
INSERT INTO pazienti (
    nome, cognome, data_ricovero, diagnosi, 
    reparto_appartenenza, user_id, codice_rad
) VALUES (
    'Test', 'Utente', '2024-01-10', 'Test diagnosi', 
    'Cardiologia', 'user-id-valido-da-query', '20250001968'
);
```

#### Opzione B: Rendi user_id opzionale (se necessario)
```sql
-- Verifica se user_id può essere NULL
SELECT is_nullable FROM information_schema.columns 
WHERE table_name = 'pazienti' AND column_name = 'user_id';
```

### 6. Verifica Post-Migrazione
```sql
-- Verifica tutti i campi
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'pazienti'
ORDER BY ordinal_position;

-- Verifica dati inseriti
SELECT id, nome, cognome, data_nascita, codice_rad, infetto
FROM pazienti 
WHERE nome IN ('Test', 'Mario')
ORDER BY id DESC;
```

### 7. Pulizia Test
```sql
-- Rimuovi record di test
DELETE FROM pazienti 
WHERE nome IN ('Test', 'Mario') 
  AND data_ricovero = '2024-01-10';
```

## 📏 Specifiche Campi
| Campo | Tipo | Vincoli | Descrizione |
|-------|------|---------|-------------|
| `data_nascita` | DATE | NULL consentito | Formato YYYY-MM-DD |
| `infetto` | BOOLEAN | NULL, default false | true/false |
| `codice_rad` | VARCHAR(11) | NULL consentito | 11 caratteri numerici |

## ⚠️ Gestione Errori Comuni

### Errore: Foreign Key Constraint
**Soluzione**: Non specificare user_id nei test o usare un ID valido dalla tabella users.

### Errore: Timestamp Format
**Soluzione**: Usare formato DATE 'YYYY-MM-DD' per le date.

### Errore: Lunghezza codice_rad
**Soluzione**: VARCHAR(11) è ottimizzato per esattamente 11 caratteri.

## 🔄 Rollback Sicuro
```sql
-- Rimuovi campi se necessario
ALTER TABLE pazienti DROP COLUMN IF EXISTS data_nascita;
ALTER TABLE pazienti DROP COLUMN IF EXISTS infetto;
ALTER TABLE pazienti DROP COLUMN IF EXISTS codice_rad;
```

## 📞 Supporto
In caso di problemi:
1. Verifica i vincoli con: `\d pazienti`
2. Controlla gli ID validi in: `SELECT id FROM users LIMIT 5;`
3. Usa la versione con DO block per gestione errori automatica