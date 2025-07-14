-- ============================================
-- RIMOZIONE PAZIENTI DI TEST CREATI DALLA MIGRAZIONE
-- ============================================
-- Questo script rimuove SOLO i pazienti creati dai test della migrazione

-- 1. IDENTIFICA I PAZIENTI DI TEST
-- ============================================
SELECT 
    id,
    nome,
    cognome,
    diagnosi,
    reparto_appartenenza,
    data_ricovero,
    codice_rad,
    infetto,
    created_at
FROM pazienti 
WHERE 
    -- Paziente dal Test 1
    (nome = 'Test' AND cognome = 'Utente' AND data_ricovero = '2024-01-10' AND diagnosi = 'Test diagnosi')
    OR
    -- Paziente dal Test 2
    (nome = 'Mario' AND cognome = 'Rossi' AND data_nascita = '1980-05-15' AND codice_rad = '20250001968')
ORDER BY id;

-- 2. CONTA QUANTI RECORD VERRANNO RIMOSI
-- ============================================
SELECT COUNT(*) as record_test_da_rimuovere
FROM pazienti 
WHERE 
    (nome = 'Test' AND cognome = 'Utente' AND data_ricovero = '2024-01-10' AND diagnosi = 'Test diagnosi')
    OR
    (nome = 'Mario' AND cognome = 'Rossi' AND data_nascita = '1980-05-15' AND codice_rad = '20250001968');

-- 3. RIMOZIONE SICURA DEI PAZIENTI DI TEST
-- ============================================
DELETE FROM pazienti 
WHERE 
    (nome = 'Test' AND cognome = 'Utente' AND data_ricovero = '2024-01-10' AND diagnosi = 'Test diagnosi')
    OR
    (nome = 'Mario' AND cognome = 'Rossi' AND data_nascita = '1980-05-15' AND codice_rad = '20250001968');

-- 4. VERIFICA RIMOZIONE
-- ============================================
SELECT COUNT(*) as pazienti_rimasti FROM pazienti;
SELECT * FROM pazienti ORDER BY id DESC LIMIT 10;

-- 5. SE CI SONO ANCORA RECORD DI TEST AGGIUNTIVI
-- ============================================
-- Controlla eventuali altri record con "Test" nel nome
SELECT * FROM pazienti 
WHERE nome LIKE '%Test%' OR cognome LIKE '%Test%' OR diagnosi LIKE '%Test%';

-- 6. PULIZIA COMPLETA (se necessario)
-- ============================================
-- DELETE FROM pazienti WHERE nome LIKE '%Test%' OR cognome LIKE '%Test%' OR diagnosi LIKE '%Test%';