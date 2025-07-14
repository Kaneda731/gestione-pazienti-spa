-- ============================================
-- IDENTIFICA PAZIENTI MANCANTI
-- ============================================
-- Script per capire esattamente quali pazienti sono stati cancellati

-- 1. VERIFICA TOTALE ATTUALE
SELECT COUNT(*) as pazienti_attuali FROM pazienti;

-- 2. CERCA PAZIENTI CREATI DALLO SCRIPT DI MIGRAZIONE
-- Questi sono i pazienti che potrebbero essere stati cancellati
SELECT 
    id,
    nome,
    cognome,
    diagnosi,
    data_ricovero,
    created_at
FROM pazienti 
WHERE data_ricovero = '2024-01-10'
   OR nome IN ('Test', 'Mario')
   OR nome LIKE '%Test%'
   OR cognome LIKE '%Test%'
ORDER BY created_at;

-- 3. CERCA PAZIENTI CON DATA RECENTE
-- I pazienti creati dallo script hanno created_at recente
SELECT 
    id,
    nome,
    cognome,
    diagnosi,
    created_at,
    data_ricovero
FROM pazienti 
WHERE created_at > '2024-01-01'
ORDER BY created_at DESC;

-- 4. CONTA PER PERIODO
SELECT 
    DATE(created_at) as data_creazione,
    COUNT(*) as conteggio
FROM pazienti
GROUP BY DATE(created_at)
ORDER BY data_creazione DESC;

-- 5. CERCA EVENTUALI PAZIENTI CON DATI INCOMPLETI
SELECT * FROM pazienti 
WHERE nome IS NULL 
   OR nome = ''
   OR cognome IS NULL 
   OR cognome = ''
   OR diagnosi IS NULL 
   OR diagnosi = '';

-- 6. MESSAGGIO DI ANALISI
SELECT 
    'Analisi completa: confronta con backup o log per identificare esattamente i 7 pazienti mancanti' as messaggio,
    'Controlla anche eventuali filtri applicati che potrebbero nascondere alcuni record' as suggerimento;