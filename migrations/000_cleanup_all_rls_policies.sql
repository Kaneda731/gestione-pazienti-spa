-- Migration: Cleanup all existing RLS policies (FIXED VERSION)
-- Version: 000_cleanup_fixed
-- Description: Remove all existing RLS policies to start fresh
-- IMPORTANT: Run this BEFORE applying the new RLS policies

-- ========================================
-- CLEANUP ALL EXISTING POLICIES
-- ========================================

DO $$
DECLARE
    policy_record RECORD;
    drop_statement TEXT;
BEGIN
    RAISE NOTICE 'Starting RLS policy cleanup...';
    
    -- Loop through all existing policies in the public schema
    FOR policy_record IN 
        SELECT 
            schemaname,
            tablename,
            policyname
        FROM pg_policies 
        WHERE schemaname = 'public'
        ORDER BY tablename, policyname
    LOOP
        -- Build the DROP POLICY statement
        drop_statement := format('DROP POLICY IF EXISTS %I ON %I.%I', 
            policy_record.policyname, 
            policy_record.schemaname, 
            policy_record.tablename
        );
        
        -- Execute the drop statement
        EXECUTE drop_statement;
        
        -- Log what we're dropping
        RAISE NOTICE 'Dropped policy: % on table %', policy_record.policyname, policy_record.tablename;
    END LOOP;
    
    RAISE NOTICE 'Policy cleanup completed. All RLS policies have been removed.';
END $$;

-- ========================================
-- CLEANUP HELPER FUNCTIONS
-- ========================================

DO $$
BEGIN
    RAISE NOTICE 'Cleaning up helper functions...';
    
    -- Remove any existing helper functions that might conflict
    DROP FUNCTION IF EXISTS get_user_role();
    DROP FUNCTION IF EXISTS user_has_role_or_higher(TEXT);
    DROP FUNCTION IF EXISTS check_rls_status();
    DROP FUNCTION IF EXISTS get_table_policies();
    
    RAISE NOTICE 'Helper functions cleanup completed';
END $$;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Show remaining policies (should be empty)
SELECT 
    'Remaining policies after cleanup' as status,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public';

-- List any remaining policies (for verification)
SELECT 
    schemaname,
    tablename,
    policyname,
    'WARNING: Policy still exists' as warning
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Show RLS status on main tables
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN 'RLS enabled (no policies - access will be denied)'
        ELSE 'RLS disabled'
    END as status
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('pazienti', 'eventi_clinici', 'profiles')
ORDER BY tablename;

-- ========================================
-- OPTIONAL: TEMPORARY RLS DISABLE
-- ========================================

-- Uncomment these lines if you want to temporarily disable RLS
-- while you apply the new policies (recommended for testing)

/*
ALTER TABLE pazienti DISABLE ROW LEVEL SECURITY;
ALTER TABLE eventi_clinici DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

SELECT 'RLS temporarily disabled on main tables' as notice;
*/

-- ========================================
-- FINAL SUMMARY
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RLS CLEANUP COMPLETED SUCCESSFULLY';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'All existing RLS policies have been removed';
    RAISE NOTICE 'RLS remains ENABLED on tables (but no policies = no access)';
    RAISE NOTICE 'Helper functions have been cleaned up';
    RAISE NOTICE '';
    RAISE NOTICE 'NEXT STEPS:';
    RAISE NOTICE '1. Apply migrations/003_setup_rls_policies.sql';
    RAISE NOTICE '2. Test the new role-based policies';
    RAISE NOTICE '3. Assign roles to users in the profiles table';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
END $$;