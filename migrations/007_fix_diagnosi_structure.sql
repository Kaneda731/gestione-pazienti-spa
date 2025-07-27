-- Migration: Fix diagnosi table structure and relationship
-- Version: 007
-- Description: Add missing columns to diagnosi table and ensure proper foreign key relationship

-- ========================================
-- ADD MISSING COLUMNS TO DIAGNOSI TABLE
-- ========================================

-- Add descrizione column if not exists
ALTER TABLE diagnosi 
ADD COLUMN IF NOT EXISTS descrizione TEXT;

-- Add codice column if not exists
ALTER TABLE diagnosi 
ADD COLUMN IF NOT EXISTS codice VARCHAR(50);

-- Add attiva column if not exists (for future use)
ALTER TABLE diagnosi 
ADD COLUMN IF NOT EXISTS attiva BOOLEAN DEFAULT true;

-- Add updated_at column if not exists
ALTER TABLE diagnosi 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- ========================================
-- ENSURE FOREIGN KEY RELATIONSHIP EXISTS
-- ========================================

-- Check if foreign key constraint exists, if not add it
DO $$
BEGIN
    -- Check if the foreign key constraint exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'pazienti' 
        AND kcu.column_name = 'diagnosi_id'
        AND tc.constraint_type = 'FOREIGN KEY'
    ) THEN
        -- Add the foreign key constraint
        ALTER TABLE pazienti 
        ADD CONSTRAINT fk_pazienti_diagnosi_id 
        FOREIGN KEY (diagnosi_id) REFERENCES diagnosi(id);
        
        RAISE NOTICE 'Added foreign key constraint for diagnosi_id';
    ELSE
        RAISE NOTICE 'Foreign key constraint already exists';
    END IF;
END $$;

-- ========================================
-- UPDATE EXISTING DATA
-- ========================================

-- Update existing diagnosi records with sample descriptions and codes
UPDATE diagnosi SET 
    descrizione = CASE 
        WHEN nome = 'Frattura_Spalla' THEN 'Frattura della spalla'
        WHEN nome = 'Lesione_Tendinea' THEN 'Lesione dei tendini'
        WHEN nome = 'Frattura_Polso' THEN 'Frattura del polso'
        WHEN nome = 'Protesi_Mammaria' THEN 'Intervento protesi mammaria'
        WHEN nome = 'Coccartrosi' THEN 'Coxartrosi - artrosi dell''anca'
        WHEN nome = 'Frattura_Mano' THEN 'Frattura della mano'
        WHEN nome = 'Frattura_Bacino' THEN 'Frattura del bacino'
        WHEN nome = 'Neoformazione_Cute' THEN 'Neoformazione cutanea'
        WHEN nome = 'Frattura_Femore' THEN 'Frattura del femore'
        WHEN nome = 'Ulcera' THEN 'Ulcera cutanea'
        WHEN nome = 'Frattura_Gamba' THEN 'Frattura della gamba'
        WHEN nome = 'Desacenza_Ferita' THEN 'Deiscenza della ferita'
        WHEN nome = 'FLC' THEN 'Fibro-lipo-calcificazione'
        WHEN nome = 'Politrauma' THEN 'Politrauma multiplo'
        WHEN nome = 'Gonartrosi' THEN 'Gonartrosi - artrosi del ginocchio'
        WHEN nome = 'Artosi Spallla' THEN 'Artrosi della spalla'
        WHEN nome = 'Lussazione Protesi' THEN 'Lussazione protesica'
        WHEN nome = 'Amputazione' THEN 'Amputazione di arto'
        WHEN nome = 'Infezione_Protesi_plastica' THEN 'Infezione da protesi plastica'
        ELSE 'Descrizione da definire'
    END,
    codice = CASE 
        WHEN nome LIKE '%Frattura%' THEN 'S72.9'
        WHEN nome LIKE '%Protesi%' THEN 'Z96.6'
        WHEN nome LIKE '%Lesione%' THEN 'M70.9'
        WHEN nome = 'Coccartrosi' THEN 'M16.9'
        WHEN nome = 'Gonartrosi' THEN 'M17.9'
        WHEN nome = 'Ulcera' THEN 'L97.9'
        WHEN nome = 'Politrauma' THEN 'T07'
        WHEN nome = 'Amputazione' THEN 'Z89.9'
        ELSE NULL
    END
WHERE descrizione IS NULL;

-- ========================================
-- CREATE PERFORMANCE INDEXES
-- ========================================

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_diagnosi_nome ON diagnosi(nome);
CREATE INDEX IF NOT EXISTS idx_diagnosi_codice ON diagnosi(codice) WHERE codice IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_diagnosi_attiva ON diagnosi(attiva) WHERE attiva = true;

-- Index on pazienti.diagnosi_id if not exists
CREATE INDEX IF NOT EXISTS idx_pazienti_diagnosi_id ON pazienti(diagnosi_id) WHERE diagnosi_id IS NOT NULL;

-- ========================================
-- VERIFICATION
-- ========================================

-- Show table structure
SELECT 
    'DIAGNOSI TABLE STRUCTURE' as section;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'diagnosi' 
ORDER BY ordinal_position;

-- Show foreign key relationships
SELECT 
    'FOREIGN KEY RELATIONSHIPS' as section;

SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'pazienti'
AND kcu.column_name = 'diagnosi_id';

-- Count data
SELECT 
    'DATA VERIFICATION' as section;

SELECT 
    'Total diagnosi' as tipo,
    COUNT(*) as conteggio
FROM diagnosi
UNION ALL
SELECT 
    'Diagnosi with descrizione' as tipo,
    COUNT(*) as conteggio
FROM diagnosi 
WHERE descrizione IS NOT NULL
UNION ALL
SELECT 
    'Pazienti with diagnosi_id' as tipo,
    COUNT(*) as conteggio
FROM pazienti 
WHERE diagnosi_id IS NOT NULL;

-- ========================================
-- FINAL SUMMARY
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'DIAGNOSI STRUCTURE FIX COMPLETED';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Added missing columns: descrizione, codice, attiva, updated_at';
    RAISE NOTICE '✅ Ensured foreign key constraint exists';
    RAISE NOTICE '✅ Updated existing data with descriptions and codes';
    RAISE NOTICE '✅ Created performance indexes';
    RAISE NOTICE '';
    RAISE NOTICE 'The relationship pazienti.diagnosi_id -> diagnosi.id should now work correctly';
    RAISE NOTICE '========================================';
END $$;