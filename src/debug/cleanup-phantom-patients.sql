-- src/debug/cleanup-phantom-patients.sql
-- Script per rimuovere definitivamente i pazienti fantasma

-- STEP 1: Identifica prima di rimuovere
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
WHERE 
    -- Questi sono i criteri tipici per record fittizi
    (nome IS NULL OR nome = '' OR nome LIKE '%test%' OR nome LIKE '%demo%')
    OR
    (cognome IS NULL OR cognome = '' OR cognome LIKE '%test%' OR cognome LIKE '%demo%')
    OR
    (diagnosi IS NULL OR diagnosi = '' OR diagnosi LIKE '%test%' OR diagnosi LIKE '%demo%')
    OR
    (reparto_appartenenza IS NULL OR reparto_appartenenza = '')
    OR
    (data_ricovero IS NULL AND data_dimissione IS NULL)
ORDER BY id;

-- STEP 2: Conta quanti record verrebbero rimossi
SELECT COUNT(*) as record_da_rimuovere
FROM pazienti
WHERE 
    (nome IS NULL OR nome = '' OR nome LIKE '%test%' OR nome LIKE '%demo%')
    OR
    (cognome IS NULL OR cognome = '' OR cognome LIKE '%test%' OR cognome LIKE '%demo%')
    OR
    (diagnosi IS NULL OR diagnosi = '' OR diagnosi LIKE '%test%' OR diagnosi LIKE '%demo%')
    OR
    (reparto_appartenenza IS NULL OR reparto_appartenenza = '')
    OR
    (data_ricovero IS NULL AND data_dimissione IS NULL);

-- STEP 3: Rimuovi i record fittizi (decommenta solo dopo aver verificato)
-- DELETE FROM pazienti
-- WHERE 
--     (nome IS NULL OR nome = '' OR nome LIKE '%test%' OR nome LIKE '%demo%')
--     OR
--     (cognome IS NULL OR cognome = '' OR cognome LIKE '%test%' OR cognome LIKE '%demo%')
--     OR
--     (diagnosi IS NULL OR diagnosi = '' OR diagnosi LIKE '%test%' OR diagnosi LIKE '%demo%')
--     OR
--     (reparto_appartenenza IS NULL OR reparto_appartenenza = '')
--     OR
--     (data_ricovero IS NULL AND data_dimissione IS NULL);

-- STEP 4: Verifica finale
-- SELECT COUNT(*) as record_rimasti FROM pazienti;
-- SELECT * FROM pazienti ORDER BY id;

-- STEP 5: Se hai gli ID specifici dei 4 pazienti, usa questa query più precisa
-- Sostituisci gli ID con quelli reali che troverai con le query sopra
-- DELETE FROM pazienti WHERE id IN (1,2,3,4); -- Modifica con gli ID reali