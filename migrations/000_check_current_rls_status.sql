-- Script: Check current RLS status
-- Description: Analyze current RLS policies and table security status
-- Use this to understand what needs to be cleaned up

-- ========================================
-- CURRENT RLS STATUS ANALYSIS
-- ========================================

SELECT 
    '🔍 CURRENT RLS ANALYSIS' as analysis_type,
    now() as timestamp;

-- ========================================
-- 1. TABLE RLS STATUS
-- ========================================

SELECT 
    '📋 TABLE RLS STATUS' as section;

SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '🔒 RLS Enabled'
        ELSE '🔓 RLS Disabled'
    END as status,
    CASE 
        WHEN rowsecurity THEN 'Policies control access'
        ELSE 'Full access (no security)'
    END as description
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('pazienti', 'eventi_clinici', 'profiles', 'user_roles')
ORDER BY tablename;

-- ========================================
-- 2. EXISTING POLICIES
-- ========================================

SELECT 
    '📜 EXISTING POLICIES' as section;

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as operation,
    CASE 
        WHEN qual IS NOT NULL THEN LEFT(qual, 50) || '...'
        ELSE 'No USING clause'
    END as using_clause_preview,
    CASE 
        WHEN with_check IS NOT NULL THEN LEFT(with_check, 50) || '...'
        ELSE 'No WITH CHECK clause'
    END as with_check_preview
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Count policies per table
SELECT 
    '📊 POLICY COUNT BY TABLE' as section;

SELECT 
    tablename,
    COUNT(*) as policy_count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ No policies'
        WHEN COUNT(*) < 5 THEN '⚠️ Few policies'
        ELSE '🔥 Many policies'
    END as status
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY policy_count DESC;

-- ========================================
-- 3. HELPER FUNCTIONS
-- ========================================

SELECT 
    '🔧 HELPER FUNCTIONS' as section;

SELECT 
    routine_name,
    routine_type,
    security_type,
    CASE 
        WHEN routine_name LIKE '%role%' THEN '🎭 Role-related function'
        WHEN routine_name LIKE '%rls%' THEN '🔒 RLS-related function'
        ELSE '🔧 Other function'
    END as function_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND (
    routine_name LIKE '%role%' OR 
    routine_name LIKE '%rls%' OR
    routine_name IN ('get_user_role', 'user_has_role_or_higher', 'check_rls_status', 'get_table_policies')
)
ORDER BY routine_name;

-- ========================================
-- 4. POTENTIAL ISSUES
-- ========================================

SELECT 
    '⚠️ POTENTIAL ISSUES' as section;

-- Tables with RLS enabled but no policies
SELECT 
    'Tables with RLS but no policies' as issue_type,
    t.tablename,
    '❌ RLS enabled but no policies = NO ACCESS' as problem
FROM pg_tables t
LEFT JOIN (
    SELECT tablename, COUNT(*) as policy_count
    FROM pg_policies 
    WHERE schemaname = 'public'
    GROUP BY tablename
) p ON t.tablename = p.tablename
WHERE t.schemaname = 'public'
AND t.rowsecurity = true
AND (p.policy_count IS NULL OR p.policy_count = 0)
AND t.tablename IN ('pazienti', 'eventi_clinici', 'profiles');

-- Conflicting policies (same table, same operation)
SELECT 
    'Potentially conflicting policies' as issue_type,
    tablename,
    cmd as operation,
    COUNT(*) as policy_count,
    '⚠️ Multiple policies for same operation' as problem
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename, cmd
HAVING COUNT(*) > 2
ORDER BY tablename, cmd;

-- ========================================
-- 5. RECOMMENDATIONS
-- ========================================

DO $$
DECLARE
    policy_count INTEGER;
    rls_enabled_count INTEGER;
    function_count INTEGER;
BEGIN
    -- Count existing policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE schemaname = 'public';
    
    -- Count tables with RLS enabled
    SELECT COUNT(*) INTO rls_enabled_count
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND rowsecurity = true
    AND tablename IN ('pazienti', 'eventi_clinici', 'profiles');
    
    -- Count helper functions
    SELECT COUNT(*) INTO function_count
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name LIKE '%role%';
    
    RAISE NOTICE '';
    RAISE NOTICE '💡 RECOMMENDATIONS:';
    RAISE NOTICE '';
    
    IF policy_count = 0 THEN
        RAISE NOTICE '✅ No existing policies - safe to apply new ones';
    ELSIF policy_count < 10 THEN
        RAISE NOTICE '⚠️ Few policies exist (%) - consider cleanup', policy_count;
        RAISE NOTICE '   Recommended: Run 000_cleanup_all_rls_policies.sql';
    ELSE
        RAISE NOTICE '🔥 Many policies exist (%) - cleanup strongly recommended', policy_count;
        RAISE NOTICE '   Recommended: Run 000_nuclear_rls_cleanup.sql';
    END IF;
    
    IF rls_enabled_count > 0 THEN
        RAISE NOTICE '🔒 RLS is enabled on % main tables', rls_enabled_count;
    ELSE
        RAISE NOTICE '🔓 RLS is disabled on main tables';
    END IF;
    
    IF function_count > 0 THEN
        RAISE NOTICE '🔧 % helper functions exist - may need cleanup', function_count;
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '📋 CLEANUP OPTIONS:';
    RAISE NOTICE '1. 000_cleanup_all_rls_policies.sql - Remove policies only';
    RAISE NOTICE '2. 000_nuclear_rls_cleanup.sql - Complete cleanup (policies + disable RLS)';
    RAISE NOTICE '3. Skip cleanup if no conflicts detected';
END $$;