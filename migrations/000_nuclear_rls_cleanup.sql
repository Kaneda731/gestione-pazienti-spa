-- Migration: Nuclear RLS cleanup (use with caution)
-- Version: 000_nuclear
-- Description: Complete RLS cleanup including disabling RLS temporarily
-- WARNING: This will temporarily remove ALL security from your tables!

-- ========================================
-- NUCLEAR OPTION: COMPLETE RLS CLEANUP
-- ========================================

-- This script does a complete cleanup of RLS:
-- 1. Removes all policies
-- 2. Temporarily disables RLS
-- 3. Cleans up functions
-- 4. Provides a clean slate

DO $$
DECLARE
    policy_record RECORD;
    table_record RECORD;
    drop_statement TEXT;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'STARTING NUCLEAR RLS CLEANUP';
    RAISE NOTICE 'WARNING: This will temporarily disable ALL security!';
    RAISE NOTICE '========================================';
    
    -- Step 1: Remove all existing policies
    RAISE NOTICE 'Step 1: Removing all existing policies...';
    
    FOR policy_record IN 
        SELECT 
            schemaname,
            tablename,
            policyname
        FROM pg_policies 
        WHERE schemaname = 'public'
        ORDER BY tablename, policyname
    LOOP
        drop_statement := format('DROP POLICY IF EXISTS %I ON %I.%I', 
            policy_record.policyname, 
            policy_record.schemaname, 
            policy_record.tablename
        );
        
        EXECUTE drop_statement;
        RAISE NOTICE '  Dropped policy: % on table %', policy_record.policyname, policy_record.tablename;
    END LOOP;
    
    -- Step 2: Disable RLS on all tables in public schema
    RAISE NOTICE 'Step 2: Disabling RLS on all tables...';
    
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND rowsecurity = true
    LOOP
        EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', table_record.tablename);
        RAISE NOTICE '  Disabled RLS on table: %', table_record.tablename;
    END LOOP;
    
    -- Step 3: Clean up helper functions
    RAISE NOTICE 'Step 3: Cleaning up helper functions...';
    
    DROP FUNCTION IF EXISTS get_user_role();
    DROP FUNCTION IF EXISTS user_has_role_or_higher(TEXT);
    DROP FUNCTION IF EXISTS check_rls_status();
    DROP FUNCTION IF EXISTS get_table_policies();
    DROP FUNCTION IF EXISTS update_updated_at_column();
    
    RAISE NOTICE '  Helper functions cleaned up';
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'NUCLEAR CLEANUP COMPLETED';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'ALL RLS policies removed';
    RAISE NOTICE 'ALL RLS disabled on tables';
    RAISE NOTICE 'ALL helper functions removed';
    RAISE NOTICE '';
    RAISE NOTICE 'SECURITY WARNING:';
    RAISE NOTICE 'Your database now has NO access control!';
    RAISE NOTICE 'Apply new RLS policies IMMEDIATELY!';
    RAISE NOTICE '========================================';
END $$;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Verify no policies exist
SELECT 
    'Policies remaining' as check_type,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ All policies removed'
        ELSE '❌ Some policies still exist'
    END as status
FROM pg_policies 
WHERE schemaname = 'public';

-- Verify RLS status
SELECT 
    'RLS Status' as check_type,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '❌ RLS still enabled'
        ELSE '✅ RLS disabled'
    END as status
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('pazienti', 'eventi_clinici', 'profiles')
ORDER BY tablename;

-- Check for remaining functions
SELECT 
    'Functions remaining' as check_type,
    routine_name,
    '❌ Function still exists' as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_user_role', 'user_has_role_or_higher', 'check_rls_status', 'get_table_policies');

-- ========================================
-- NEXT STEPS REMINDER
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🚨 IMPORTANT: NEXT STEPS 🚨';
    RAISE NOTICE '';
    RAISE NOTICE '1. Your database is now COMPLETELY UNSECURED';
    RAISE NOTICE '2. Run migrations/003_setup_rls_policies.sql IMMEDIATELY';
    RAISE NOTICE '3. Test that the new policies work correctly';
    RAISE NOTICE '4. Assign appropriate roles to users';
    RAISE NOTICE '';
    RAISE NOTICE 'DO NOT leave your database in this state!';
END $$;