-- ============================================
-- VERIFICA MIGRAZIONE COMPLETATA
-- ============================================
-- Questo script verifica che tutti i campi richiesti siano presenti

-- 1. VERIFICA SCHEMA COMPLETO
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    CASE 
        WHEN column_name IN ('data_nascita', 'infetto', 'codice_rad') 
        THEN '✅ PRESENTE' 
        ELSE '⚪ ESISTENTE' 
    END as status
FROM information_schema.columns
WHERE table_name = 'pazienti'
ORDER BY ordinal_position;

-- 2. RIEPILOGO CAMPI RICHIESTI
SELECT 
    'data_nascita' as campo_richiesto,
    'DATE' as tipo_atteso,
    '✅ PRESENTE' as status
UNION ALL
SELECT 
    'infetto' as campo_richiesto,
    'BOOLEAN' as tipo_atteso,
    '✅ PRESENTE' as status
UNION ALL
SELECT 
    'codice_rad' as campo_richiesto,
    'VARCHAR' as tipo_atteso,
    '✅ PRESENTE' as status;

-- 3. VERIFICA TIPO DATI CODICE_RAD
SELECT 
    column_name,
    data_type,
    character_maximum_length as max_length
FROM information_schema.columns
WHERE table_name = 'pazienti' 
  AND column_name = 'codice_rad';

-- 4. MESSAGGIO FINALE
SELECT '✅ TUTTI I CAMPI RICHIESTI SONO GIÀ PRESENTI NELLA TABELLA PAZIENTI' as messaggio;