-- Test script for RLS policies
-- Version: 003_test
-- Description: Test RLS policies to ensure they work correctly

-- ========================================
-- VERIFY RLS IS ENABLED
-- ========================================

-- Check if RLS is enabled on tables
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('pazienti', 'eventi_clinici')
AND schemaname = 'public';

-- ========================================
-- LIST ALL POLICIES
-- ========================================

-- Show all policies for our tables
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('pazienti', 'eventi_clinici')
ORDER BY tablename, policyname;

-- ========================================
-- TEST POLICY FUNCTIONALITY
-- ========================================

-- Note: These tests should be run by an authenticated user
-- The following queries will help verify the policies work

-- Test 1: Check if current user can see their own patients
-- This should return patients owned by the current user
SELECT 
    'Test 1: User patients' as test_name,
    COUNT(*) as patient_count
FROM pazienti;

-- Test 2: Try to insert a patient (should work if user is authenticated)
-- Uncomment to test (replace with actual user data):
-- INSERT INTO pazienti (
--     nome, cognome, data_nascita, data_ricovero, 
--     diagnosi, reparto_appartenenza, user_id
-- ) VALUES (
--     'Test', 'RLS', '1990-01-01', CURRENT_DATE,
--     'Test Diagnosis', 'Test Department', auth.uid()
-- );

-- Test 3: Check if user can see clinical events for their patients
SELECT 
    'Test 3: Clinical events' as test_name,
    COUNT(*) as event_count
FROM eventi_clinici;

-- Test 4: Try to insert a clinical event (should work for user's patients)
-- Uncomment to test (replace with actual patient ID):
-- INSERT INTO eventi_clinici (
--     paziente_id, tipo_evento, data_evento, descrizione
-- ) VALUES (
--     (SELECT id FROM pazienti LIMIT 1),
--     'intervento',
--     CURRENT_DATE,
--     'Test RLS Event'
-- );

-- ========================================
-- PERFORMANCE CHECK
-- ========================================

-- Check if indexes exist for RLS performance
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('pazienti', 'eventi_clinici')
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- ========================================
-- SECURITY VERIFICATION
-- ========================================

-- Verify that policies are restrictive enough
-- This query shows the policy expressions
SELECT 
    tablename,
    policyname,
    cmd as operation,
    CASE 
        WHEN qual IS NOT NULL THEN 'USING: ' || qual
        ELSE 'No USING clause'
    END as using_clause,
    CASE 
        WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || with_check
        ELSE 'No WITH CHECK clause'
    END as with_check_clause
FROM pg_policies 
WHERE tablename IN ('pazienti', 'eventi_clinici')
ORDER BY tablename, cmd, policyname;

-- ========================================
-- TROUBLESHOOTING QUERIES
-- ========================================

-- If you're having issues, these queries can help debug:

-- Check current user
SELECT 
    'Current user' as info,
    auth.uid() as user_id,
    auth.email() as email;

-- Check if there are any patients without user_id (these would be inaccessible)
SELECT 
    'Patients without user_id' as issue,
    COUNT(*) as count
FROM pazienti 
WHERE user_id IS NULL;

-- Check if there are orphaned clinical events
SELECT 
    'Orphaned clinical events' as issue,
    COUNT(*) as count
FROM eventi_clinici ec
LEFT JOIN pazienti p ON ec.paziente_id = p.id
WHERE p.id IS NULL;

-- Check user roles in profiles table
SELECT 
    'User roles distribution' as info,
    role,
    COUNT(*) as count
FROM profiles 
WHERE role IS NOT NULL
GROUP BY role
ORDER BY role;

-- Check users without roles (will default to viewer)
SELECT 
    'Users without role' as issue,
    COUNT(*) as count
FROM profiles 
WHERE role IS NULL;