-- ============================================
-- MIGRAZIONE SUPABASE: AGGIUNTA CAMPI MANCANTI
-- ============================================
-- Versione finale ottimizzata - solo aggiunta campi

-- 1. VERIFICA SCHEMA ATTUALE
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'pazienti'
ORDER BY ordinal_position;

-- 2. AGGIUNTA CAMPI MANCANTI
-- ============================================

-- Aggiungi data_nascita come DATE (non TIMESTAMP)
ALTER TABLE pazienti 
ADD COLUMN IF NOT EXISTS data_nascita DATE;

-- Aggiungi infetto come BOOLEAN con default
ALTER TABLE pazienti 
ADD COLUMN IF NOT EXISTS infetto BOOLEAN DEFAULT false;

-- Aggiungi codice_rad come VARCHAR(11) per 11 caratteri numerici
ALTER TABLE pazienti 
ADD COLUMN IF NOT EXISTS codice_rad VARCHAR(11);

-- 3. AGGIUNTA INDICE (opzionale)
CREATE INDEX IF NOT EXISTS idx_pazienti_codice_rad ON pazienti(codice_rad);

-- 4. VERIFICA POST-MIGRAZIONE
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'pazienti'
ORDER BY ordinal_position;

-- 5. INFORMAZIONI UTILI (commentate)
-- Per vedere i vincoli:
-- \d pazienti

-- Per trovare user_id valido:
-- SELECT id FROM users LIMIT 1;

-- Per verificare i campi aggiunti:
-- SELECT data_nascita, infetto, codice_rad FROM pazienti LIMIT 1;