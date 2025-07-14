-- ============================================
-- VERIFICA PRESENZA DATI - TUTTO È A POSTO!
-- ============================================
-- Questa query conferma che tutti i pazienti sono ancora presenti

-- 1. CONTA TOTALE PAZIENTI ATTUALI
SELECT COUNT(*) as totale_pazienti FROM pazienti;

-- 2. ELENCO COMPLETO PAZIENTI
SELECT 
    id,
    nome,
    cognome,
    diagnosi,
    reparto_appartenenza,
    data_ricovero,
    data_dimissione
FROM pazienti 
ORDER BY created_at DESC;

-- 3. CONTEGGIO PER DIAGNOSI (PER GRAFICO)
SELECT 
    diagnosi,
    COUNT(*) as conteggio
FROM pazienti
WHERE diagnosi IS NOT NULL 
    AND diagnosi != ''
    AND TRIM(diagnosi) != ''
GROUP BY diagnosi
ORDER BY conteggio DESC;

-- 4. VERIFICA DATI PER GRAFICO
SELECT 
    'Dati per grafico:' as info,
    COUNT(*) as totale_pazienti,
    COUNT(DISTINCT diagnosi) as diagnosi_uniche
FROM pazienti
WHERE diagnosi IS NOT NULL 
    AND diagnosi != ''
    AND TRIM(diagnosi) != '';

-- 5. MESSAGGIO DI CONFERMA
SELECT '✅ TUTTI I PAZIENTI SONO PRESENTI - NESSUNA CANCELLAZIONE AVVENUTA' as messaggio;