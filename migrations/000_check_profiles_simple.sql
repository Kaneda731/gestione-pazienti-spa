-- Simple script to check profiles table structure
-- Run this to understand the current profiles table

-- ========================================
-- CHECK IF PROFILES TABLE EXISTS
-- ========================================

SELECT 
    'Checking if profiles table exists...' as status;

SELECT 
    table_name,
    'Table exists' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'profiles';

-- ========================================
-- SHOW PROFILES TABLE STRUCTURE
-- ========================================

SELECT 
    'Profiles table columns:' as info;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- ========================================
-- CHECK FOR USER_ID COLUMN SPECIFICALLY
-- ========================================

SELECT 
    'Checking for user_id column...' as check_type;

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'profiles' 
            AND column_name = 'user_id'
        ) THEN '✅ user_id column EXISTS'
        ELSE '❌ user_id column MISSING'
    END as user_id_status;

-- ========================================
-- CHECK FOR ID COLUMN
-- ========================================

SELECT 
    'Checking for id column...' as check_type;

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'profiles' 
            AND column_name = 'id'
        ) THEN '✅ id column EXISTS'
        ELSE '❌ id column MISSING'
    END as id_status;

-- ========================================
-- SHOW SAMPLE DATA (OPTIONAL)
-- ========================================

-- Uncomment the next lines to see sample data:
-- SELECT 'Sample profiles data:' as info;
-- SELECT * FROM profiles LIMIT 3;

-- ========================================
-- RECOMMENDATIONS
-- ========================================

SELECT 
    'RECOMMENDATIONS:' as info,
    'Check the results above to understand your profiles table structure' as next_steps;