-- src/debug/fix-phantom-patients.sql
-- Script SQL per identificare e rimuovere i pazienti fantasma

-- 1. Prima identifichiamo tutti i record nella tabella pazienti
SELECT 
    id,
    nome,
    cognome,
    diagnosi,
    reparto_appartenenza,
    stato,
    data_ricovero,
    data_dimissione,
    created_at,
    updated_at
FROM pazienti
ORDER BY id;

-- 2. Conta il totale dei record
SELECT COUNT(*) as totale_record FROM pazienti;

-- 3. Identifica record con dati incompleti o fittizi
SELECT 
    id,
    nome,
    cognome,
    diagnosi,
    'record_incompleto' as tipo_problema
FROM pazienti
WHERE 
    nome IS NULL OR 
    nome = '' OR 
    cognome IS NULL OR 
    cognome = '' OR
    diagnosi IS NULL OR
    diagnosi = '' OR
    data_ricovero IS NULL;

-- 4. Se necessario, rimuovi i record fittizi
-- ATTENZIONE: Prima esegui le query SELECT per verificare
-- poi decommenta e modifica la WHERE clause secondo necessità

-- DELETE FROM pazienti 
-- WHERE 
--     (nome IS NULL OR nome = '') AND 
--     (cognome IS NULL OR cognome = '') AND
--     (diagnosi IS NULL OR diagnosi = '');

-- 5. Alternativamente, se i record hanno ID specifici
-- DELETE FROM pazienti WHERE id IN (lista_degli_id_da_rimuovere);

-- 6. Verifica dopo la pulizia
-- SELECT COUNT(*) as record_rimasti FROM pazienti;