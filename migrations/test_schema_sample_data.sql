-- Test script for eventi_clinici schema with sample data
-- This script tests the database schema by inserting sample data and validating constraints

-- Test 1: Insert sample clinical events (interventions)
INSERT INTO eventi_clinici (
    paziente_id, 
    tipo_evento, 
    data_evento, 
    descrizione, 
    tipo_intervento
) VALUES 
-- Note: Replace with actual patient IDs from your pazienti table
-- (gen_random_uuid(), 'intervento', '2024-01-15', 'Appendicectomia laparoscopica', 'Chirurgia generale'),
-- (gen_random_uuid(), 'intervento', '2024-01-20', 'Riparazione ernia inguinale', 'Chirurgia generale');

-- Test 2: Insert sample clinical events (infections)
-- INSERT INTO eventi_clinici (
--     paziente_id, 
--     tipo_evento, 
--     data_evento, 
--     descrizione, 
--     agente_patogeno
-- ) VALUES 
-- (gen_random_uuid(), 'infezione', '2024-01-18', 'Infezione del sito chirurgico', 'Staphylococcus aureus'),
-- (gen_random_uuid(), 'infezione', '2024-01-22', 'Infezione delle vie urinarie', 'Escherichia coli');

-- Test 3: Update pazienti with discharge/transfer data
-- UPDATE pazienti SET 
--     tipo_dimissione = 'trasferimento_interno',
--     reparto_destinazione = 'Cardiologia',
--     codice_dimissione = '3'
-- WHERE id = (SELECT id FROM pazienti LIMIT 1);

-- Test 4: Update pazienti with external transfer data
-- UPDATE pazienti SET 
--     tipo_dimissione = 'trasferimento_esterno',
--     clinica_destinazione = 'Clinica di Riabilitazione San Marco',
--     codice_clinica = '56',
--     codice_dimissione = '6'
-- WHERE id = (SELECT id FROM pazienti OFFSET 1 LIMIT 1);

-- Validation queries to test the schema

-- Query 1: Test eventi_clinici table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'eventi_clinici' 
ORDER BY ordinal_position;

-- Query 2: Test pazienti table new columns
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'pazienti' 
AND column_name IN (
    'tipo_dimissione', 
    'reparto_destinazione', 
    'clinica_destinazione', 
    'codice_clinica', 
    'codice_dimissione'
)
ORDER BY column_name;

-- Query 3: Test indexes exist
SELECT 
    indexname, 
    tablename, 
    indexdef
FROM pg_indexes 
WHERE tablename IN ('eventi_clinici', 'pazienti')
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Query 4: Test constraints
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    tc.constraint_type
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name IN ('eventi_clinici', 'pazienti')
AND tc.constraint_type IN ('CHECK', 'FOREIGN KEY')
ORDER BY tc.table_name, tc.constraint_name;

-- Query 5: Test trigger exists
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table, 
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'eventi_clinici';

-- Query 6: Count records (should be 0 for new installation)
SELECT 
    'eventi_clinici' as table_name, 
    COUNT(*) as record_count 
FROM eventi_clinici
UNION ALL
SELECT 
    'pazienti_with_discharge_data' as table_name, 
    COUNT(*) as record_count 
FROM pazienti 
WHERE tipo_dimissione IS NOT NULL;

-- Test constraint violations (these should fail)
-- Uncomment to test constraint validation

-- Test invalid tipo_evento
-- INSERT INTO eventi_clinici (paziente_id, tipo_evento, data_evento) 
-- VALUES (gen_random_uuid(), 'invalid_type', CURRENT_DATE);

-- Test invalid tipo_dimissione
-- UPDATE pazienti SET tipo_dimissione = 'invalid_discharge' WHERE id = (SELECT id FROM pazienti LIMIT 1);

-- Test invalid codice_clinica
-- UPDATE pazienti SET codice_clinica = '99' WHERE id = (SELECT id FROM pazienti LIMIT 1);

-- Test invalid codice_dimissione
-- UPDATE pazienti SET codice_dimissione = '9' WHERE id = (SELECT id FROM pazienti LIMIT 1);