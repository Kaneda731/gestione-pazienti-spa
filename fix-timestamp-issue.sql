-- ============================================
-- CORREZIONE ERRORE TIMESTAMP - SOLUZIONI
-- ============================================
-- Questo script fornisce soluzioni per l'errore:
-- "invalid input syntax for type timestamp with time zone"

-- 1. VERIFICA FORMATI DATA ESISTENTI
-- ============================================
-- Controlla il formato delle date esistenti nella tabella
SELECT data_ricovero, data_dimissione 
FROM pazienti 
WHERE data_ricovero IS NOT NULL 
LIMIT 5;

-- 2. SOLUZIONE 1: Usa DATE invece di TIMESTAMP
-- ============================================
-- Se il problema è con TIMESTAMP, usa DATE per le date
ALTER TABLE pazienti 
ADD COLUMN IF NOT EXISTS data_nascita DATE NULL;

-- 3. SOLUZIONE 2: Gestione formato stringa
-- ============================================
-- Se hai problemi con inserimento, usa TO_DATE per conversione
-- INSERT INTO pazienti (data_nascita) VALUES (TO_DATE('1990-01-15', 'YYYY-MM-DD'));

-- 4. SOLUZIONE 3: Verifica e correzione dati esistenti
-- ============================================
-- Controlla eventuali valori non validi
SELECT * FROM pazienti 
WHERE data_ricovero IS NOT NULL 
  AND data_ricovero::text !~ '^\d{4}-\d{2}-\d{2}$';

-- 5. QUERY DI TEST SICURA
-- ============================================
-- Test con formato data standard
SELECT 
    '2024-01-15'::date as data_test,
    '20250001968'::varchar(11) as codice_rad_test,
    false::boolean as infetto_test;

-- 6. MIGRAZIONE COMPLETA CON GESTIONE ERRORI
-- ============================================
-- Esegui questa versione più sicura:
DO $$
BEGIN
    -- Aggiungi campi con gestione errori
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pazienti' AND column_name = 'data_nascita'
    ) THEN
        ALTER TABLE pazienti ADD COLUMN data_nascita DATE NULL;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pazienti' AND column_name = 'infetto'
    ) THEN
        ALTER TABLE pazienti ADD COLUMN infetto BOOLEAN NULL DEFAULT false;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pazienti' AND column_name = 'codice_rad'
    ) THEN
        ALTER TABLE pazienti ADD COLUMN codice_rad VARCHAR(11) NULL;
    END IF;
END $$;

-- 7. VERIFICA FINALE
-- ============================================
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'pazienti'
ORDER BY ordinal_position;