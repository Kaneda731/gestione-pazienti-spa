-- Check profiles table structure
-- This script analyzes the current structure of the profiles table

-- ========================================
-- PROFILES TABLE STRUCTURE ANALYSIS
-- ========================================

SELECT '📋 PROFILES TABLE STRUCTURE' as analysis_section;

-- Check all columns in profiles table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Check constraints
SELECT 
    '🔒 CONSTRAINTS' as section;

SELECT 
    constraint_name,
    constraint_type,
    column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
AND tc.table_name = 'profiles'
ORDER BY constraint_type, constraint_name;

-- Check indexes
SELECT 
    '📊 INDEXES' as section;

SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
AND tablename = 'profiles'
ORDER BY indexname;

-- Check foreign keys specifically
SELECT 
    '🔗 FOREIGN KEYS' as section;

SELECT 
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_schema = 'public'
AND tc.table_name = 'profiles';

-- Sample data (first 3 rows)
SELECT 
    '📄 SAMPLE DATA' as section;

SELECT * FROM profiles LIMIT 3;

-- Check if user_id column exists and its relationship to auth.users
SELECT 
    '🔍 USER_ID ANALYSIS' as section;

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'profiles' 
            AND column_name = 'user_id'
        ) THEN '✅ user_id column exists'
        ELSE '❌ user_id column MISSING'
    END as user_id_status;

-- Check relationship to auth.users if user_id exists
DO $$
DECLARE
    has_user_id BOOLEAN;
    user_count INTEGER;
    profile_count INTEGER;
BEGIN
    -- Check if user_id column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'user_id'
    ) INTO has_user_id;
    
    IF has_user_id THEN
        RAISE NOTICE '✅ user_id column found in profiles table';
        
        -- Count users and profiles
        SELECT COUNT(*) INTO user_count FROM auth.users;
        EXECUTE 'SELECT COUNT(*) FROM profiles WHERE user_id IS NOT NULL' INTO profile_count;
        
        RAISE NOTICE 'Auth users: %, Profiles with user_id: %', user_count, profile_count;
        
        -- Check for orphaned profiles
        EXECUTE 'SELECT COUNT(*) FROM profiles p LEFT JOIN auth.users u ON p.user_id = u.id WHERE p.user_id IS NOT NULL AND u.id IS NULL' INTO profile_count;
        
        IF profile_count > 0 THEN
            RAISE NOTICE '⚠️ Found % orphaned profiles (user_id not in auth.users)', profile_count;
        ELSE
            RAISE NOTICE '✅ All profiles have valid user_id references';
        END IF;
    ELSE
        RAISE NOTICE '❌ user_id column NOT FOUND in profiles table';
        RAISE NOTICE '💡 You will need to add user_id column or modify the RLS script';
    END IF;
END $$;

-- ========================================
-- RECOMMENDATIONS
-- ========================================

DO $$
DECLARE
    has_user_id BOOLEAN;
    has_role BOOLEAN;
BEGIN
    -- Check for required columns
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'user_id'
    ) INTO has_user_id;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'role'
    ) INTO has_role;
    
    RAISE NOTICE '';
    RAISE NOTICE '💡 RECOMMENDATIONS:';
    RAISE NOTICE '';
    
    IF NOT has_user_id THEN
        RAISE NOTICE '❌ CRITICAL: user_id column missing';
        RAISE NOTICE '   → Need to add: ALTER TABLE profiles ADD COLUMN user_id UUID REFERENCES auth.users(id);';
        RAISE NOTICE '   → Or modify RLS script to use existing ID structure';
    ELSE
        RAISE NOTICE '✅ user_id column exists';
    END IF;
    
    IF NOT has_role THEN
        RAISE NOTICE '⚠️ role column missing (will be added by RLS script)';
    ELSE
        RAISE NOTICE '✅ role column already exists';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '📋 NEXT STEPS:';
    IF NOT has_user_id THEN
        RAISE NOTICE '1. Add user_id column to profiles table';
        RAISE NOTICE '2. Populate user_id for existing profiles';
        RAISE NOTICE '3. Apply RLS policies';
    ELSE
        RAISE NOTICE '1. Apply migrations/003_setup_rls_policies.sql';
        RAISE NOTICE '2. Assign roles to users';
        RAISE NOTICE '3. Test the application';
    END IF;
END $$;