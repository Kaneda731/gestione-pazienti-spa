-- ============================================
-- VERIFICA RECUPERO DATI REALI CANCELLATI
-- ============================================
-- Script per verificare se esistono backup o log dei pazienti cancellati

-- 1. VERIFICA SE ESISTE UNA TABELLA DI LOG/AUDIT
-- ============================================
-- Controlla se esiste una tabella di log per le cancellazioni
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename LIKE '%log%' OR tablename LIKE '%audit%' OR tablename LIKE '%history%';

-- 2. VERIFICA SE ESISTE UNA COLONNA DELETED_AT
-- ============================================
-- Controlla se la tabella pazienti ha soft delete
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'pazienti' 
    AND column_name IN ('deleted_at', 'is_deleted', 'deleted', 'active');

-- 3. VERIFICA EVENTUALI TRIGGER DI LOG
-- ============================================
-- Controlla se esistono trigger per loggare le cancellazioni
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'pazienti';

-- 4. VERIFICA SE ESISTE UNA TABELLA DI BACKUP
-- ============================================
-- Controlla se esiste una tabella di backup
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename LIKE '%pazienti%' AND (tablename LIKE '%backup%' OR tablename LIKE '%old%' OR tablename LIKE '%bak%');

-- 5. VERIFICA I LOG DI SUPABASE
-- ============================================
-- Controlla i log di Supabase (se disponibili)
-- NOTA: Questa query richiede privilegi di amministratore
-- SELECT * FROM pg_stat_activity WHERE query LIKE '%DELETE%' AND query LIKE '%pazienti%';

-- 6. VERIFICA LA DIMENSIONE DELLA TABELLA
-- ============================================
-- Controlla quanti record sono stati effettivamente cancellati
SELECT 
    schemaname,
    tablename,
    n_tup_ins as inseriti,
    n_tup_upd as aggiornati,
    n_tup_del as cancellati,
    n_live_tup as attivi,
    n_dead_tup as morti
FROM pg_stat_user_tables 
WHERE tablename = 'pazienti';

-- 7. VERIFICA LE ULTIME OPERAZIONI
-- ============================================
-- Controlla le ultime operazioni sulla tabella (se disponibili)
SELECT 
    query_start,
    query
FROM pg_stat_activity 
WHERE query LIKE '%pazienti%' 
    AND query LIKE '%DELETE%'
ORDER BY query_start DESC
LIMIT 10;

-- 8. VERIFICA SE ESISTE UNA TABELLA DI VERSIONING
-- ============================================
-- Controlla se esiste una tabella di versioning temporale
SELECT 
    schemaname,
    tablename
FROM pg_tables 
WHERE tablename LIKE '%pazienti%' AND tablename LIKE '%temporal%';

-- 9. VERIFICA I WAL (Write-Ahead Log) - richiede privilegi elevati
-- ============================================
-- SELECT * FROM pg_walfile_name_offset(pg_current_wal_lsn());

-- 10. VERIFICA SE ESISTE UNA TABELLA DI RECOVERY
-- ============================================
-- Controlla se esiste una tabella di recovery
SELECT 
    schemaname,
    tablename
FROM pg_tables 
WHERE tablename = 'pazienti_recovery' OR tablename = 'pazienti_deleted';

-- 11. VERIFICA LE DIPENDENZE
-- ============================================
-- Controlla se ci sono tabelle correlate che potrebbero avere i dati
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
    AND ccu.table_name = 'pazienti';

-- 12. VERIFICA SE ESISTE UNA TABELLA DI STORICO
-- ============================================
-- Controlla se esiste una tabella di storico
SELECT 
    schemaname,
    tablename
FROM pg_tables 
WHERE tablename LIKE '%pazienti%' AND tablename LIKE '%history%';

-- 13. VERIFICA LE STATISTICHE
-- ============================================
-- Controlla le statistiche per capire quanti record sono stati cancellati
SELECT 
    relname as tabella,
    n_tup_del as record_cancellati,
    n_tup_ins as record_inseriti,
    n_live_tup as record_attivi
FROM pg_stat_user_tables 
WHERE relname = 'pazienti';

-- 14. VERIFICA SE ESISTE UNA TABELLA DI AUDIT
-- ============================================
-- Controlla se esiste una tabella di audit
SELECT 
    schemaname,
    tablename
FROM pg_tables 
WHERE tablename = 'pazienti_audit' OR tablename = 'audit_pazienti';

-- 15. VERIFICA LE ULTIME MODIFICHE
-- ============================================
-- Controlla le ultime modifiche (se disponibili)
SELECT 
    table_name,
    column_name,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name LIKE '%pazienti%' 
    AND column_name IN ('created_at', 'updated_at', 'deleted_at', 'modified_at');

-- 16. VERIFICA SE ESISTE UNA TABELLA DI RECOVERY AUTOMATICO
-- ============================================
-- Controlla se esiste una tabella di recovery automatico
SELECT 
    schemaname,
    tablename
FROM pg_tables 
WHERE tablename LIKE '%recovery%' OR tablename LIKE '%restore%';

-- 17. VERIFICA I PRIVILEGI
-- ============================================
-- Controlla i privilegi dell'utente corrente
SELECT 
    usename,
    usecreatedb,
    usesuper,
    usecatupd
FROM pg_user 
WHERE usename = current_user;

-- 18. VERIFICA SE ESISTE UNA TABELLA DI BACKUP AUTOMATICO
-- ============================================
-- Controlla se esiste una tabella di backup automatico
SELECT 
    schemaname,
    tablename
FROM pg_tables 
WHERE tablename LIKE '%backup%' AND tablename LIKE '%pazienti%';

-- 19. VERIFICA LE ULTIME CANCELLAZIONI
-- ============================================
-- Controlla le ultime cancellazioni (se disponibili)
-- NOTA: Richiede pg_stat_statements abilitato
-- SELECT query, calls, total_time, mean_time
-- FROM pg_stat_statements 
-- WHERE query LIKE '%DELETE%' AND query LIKE '%pazienti%'
-- ORDER BY mean_time DESC
-- LIMIT 10;

-- 20. VERIFICA SE ESISTE UNA TABELLA DI VERSIONING
-- ============================================
-- Controlla se esiste una tabella di versioning
SELECT 
    schemaname,
    tablename
FROM pg_tables 
WHERE tablename LIKE '%version%' AND tablename LIKE '%pazienti%';

-- 21. VERIFICA LE TABELLE DI SISTEMA
-- ============================================
-- Controlla le tabelle di sistema per informazioni
SELECT 
    schemaname,
    tablename
FROM pg_tables 
WHERE schemaname = 'information_schema' 
    AND tablename LIKE '%pazienti%';

-- 22. VERIFICA SE ESISTE UNA TABELLA DI LOG DEGLI ACCESSI
-- ============================================
-- Controlla se esiste una tabella di log degli accessi
SELECT 
    schemaname,
    tablename
FROM pg_tables 
WHERE tablename LIKE '%access%' AND tablename LIKE '%log%';

-- 23. VERIFICA LE TABELLE DI MONITORING
-- ============================================
-- Controlla le tabelle di monitoring
SELECT 
    schemaname,
    tablename
FROM pg_tables 
WHERE tablename LIKE '%monitor%' OR tablename LIKE '%metric%';

-- 24. VERIFICA SE ESISTE UNA TABELLA DI RECOVERY MANUALE
-- ============================================
-- Controlla se esiste una tabella di recovery manuale
SELECT 
    schemaname,
    tablename
FROM pg_tables 
WHERE tablename = 'pazienti_recovery_manual' OR tablename = 'pazienti_restore';

-- 25. VERIFICA LE ULTIME OPERAZIONI SUL DATABASE
-- ============================================
-- Controlla le ultime operazioni sul database
SELECT 
    query_start,
    query,
    state
FROM pg_stat_activity 
WHERE query LIKE '%pazienti%'
ORDER BY query_start DESC
LIMIT 5;