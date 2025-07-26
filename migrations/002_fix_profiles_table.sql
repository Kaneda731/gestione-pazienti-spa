-- Migration: Fix profiles table for RLS
-- Version: 002_fix
-- Description: Add missing user_id column and set up proper relationship with auth.users

-- ========================================
-- ADD MISSING USER_ID COLUMN
-- ========================================

-- Add user_id column if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- ========================================
-- UPDATE ROLE COLUMN CONSTRAINTS
-- ========================================

-- Update role column to have proper constraints if not already set
DO $$
BEGIN
    -- Drop existing constraint if it exists
    ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
    
    -- Add new constraint
    ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
        CHECK (role IN ('viewer', 'editor', 'admin'));
    
    RAISE NOTICE 'Role constraint updated';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Role constraint already exists or could not be updated: %', SQLERRM;
END $$;

-- Set default role for existing records without role
UPDATE profiles SET role = 'viewer' WHERE role IS NULL;

-- Set default for new records
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'viewer';

-- ========================================
-- POPULATE USER_ID FOR EXISTING PROFILES
-- ========================================

-- This is tricky because we need to match existing profiles to auth users
-- We'll try to match by email/username if possible

DO $$
DECLARE
    profile_record RECORD;
    matched_user_id UUID;
    updated_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Attempting to populate user_id for existing profiles...';
    
    -- Try to match profiles to auth users
    FOR profile_record IN 
        SELECT id, username, full_name 
        FROM profiles 
        WHERE user_id IS NULL
    LOOP
        matched_user_id := NULL;
        
        -- Try to match by email (if username is an email)
        IF profile_record.username LIKE '%@%' THEN
            SELECT u.id INTO matched_user_id
            FROM auth.users u
            WHERE u.email = profile_record.username
            LIMIT 1;
        END IF;
        
        -- If no match by email, try by raw_user_meta_data
        IF matched_user_id IS NULL THEN
            SELECT u.id INTO matched_user_id
            FROM auth.users u
            WHERE u.raw_user_meta_data->>'full_name' = profile_record.full_name
            OR u.raw_user_meta_data->>'name' = profile_record.full_name
            LIMIT 1;
        END IF;
        
        -- Update if we found a match
        IF matched_user_id IS NOT NULL THEN
            UPDATE profiles 
            SET user_id = matched_user_id 
            WHERE id = profile_record.id;
            
            updated_count := updated_count + 1;
            RAISE NOTICE 'Matched profile % to user %', profile_record.username, matched_user_id;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Updated % profiles with user_id', updated_count;
END $$;

-- ========================================
-- CREATE PROFILES FOR AUTH USERS WITHOUT PROFILES
-- ========================================

-- Create profiles for auth users who don't have one yet
INSERT INTO profiles (user_id, username, full_name, role)
SELECT 
    u.id,
    COALESCE(u.email, 'user_' || u.id::text) as username,
    COALESCE(
        u.raw_user_meta_data->>'full_name',
        u.raw_user_meta_data->>'name', 
        u.email,
        'User ' || u.id::text
    ) as full_name,
    'viewer' as role
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.user_id
WHERE p.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- ========================================
-- ADD UNIQUE CONSTRAINT ON USER_ID
-- ========================================

-- Add unique constraint on user_id if it doesn't exist
DO $$
BEGIN
    ALTER TABLE profiles ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);
    RAISE NOTICE 'Added unique constraint on user_id';
EXCEPTION
    WHEN duplicate_table THEN
        RAISE NOTICE 'Unique constraint on user_id already exists';
END $$;

-- ========================================
-- CREATE INDEXES FOR PERFORMANCE
-- ========================================

-- Create indexes for better RLS performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- ========================================
-- ADD CREATED_AT IF MISSING
-- ========================================

-- Add created_at column if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- ========================================
-- VERIFICATION
-- ========================================

-- Show updated table structure
SELECT 
    'UPDATED PROFILES TABLE STRUCTURE' as status;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Show profile statistics
SELECT 
    'PROFILE STATISTICS' as status;

SELECT 
    COUNT(*) as total_profiles,
    COUNT(user_id) as profiles_with_user_id,
    COUNT(CASE WHEN role = 'viewer' THEN 1 END) as viewers,
    COUNT(CASE WHEN role = 'editor' THEN 1 END) as editors,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins,
    COUNT(*) - COUNT(user_id) as orphaned_profiles
FROM profiles;

-- Show auth users vs profiles
SELECT 
    'USER VS PROFILE COUNT' as status;

SELECT 
    (SELECT COUNT(*) FROM auth.users) as auth_users,
    (SELECT COUNT(*) FROM profiles WHERE user_id IS NOT NULL) as profiles_with_user_id,
    (SELECT COUNT(*) FROM profiles WHERE user_id IS NULL) as orphaned_profiles;

-- ========================================
-- FINAL SUMMARY
-- ========================================

DO $$
DECLARE
    total_profiles INTEGER;
    profiles_with_user_id INTEGER;
    auth_users INTEGER;
    orphaned_profiles INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_profiles FROM profiles;
    SELECT COUNT(*) INTO profiles_with_user_id FROM profiles WHERE user_id IS NOT NULL;
    SELECT COUNT(*) INTO auth_users FROM auth.users;
    SELECT COUNT(*) INTO orphaned_profiles FROM profiles WHERE user_id IS NULL;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'PROFILES TABLE FIX COMPLETED';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total profiles: %', total_profiles;
    RAISE NOTICE 'Profiles with user_id: %', profiles_with_user_id;
    RAISE NOTICE 'Auth users: %', auth_users;
    RAISE NOTICE 'Orphaned profiles: %', orphaned_profiles;
    RAISE NOTICE '';
    
    IF orphaned_profiles > 0 THEN
        RAISE NOTICE '⚠️ WARNING: % profiles without user_id', orphaned_profiles;
        RAISE NOTICE 'These profiles will not be accessible with RLS enabled';
        RAISE NOTICE 'You may need to manually assign user_id or delete them';
    ELSE
        RAISE NOTICE '✅ All profiles have valid user_id references';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE 'NEXT STEPS:';
    RAISE NOTICE '1. Apply migrations/003_setup_rls_policies.sql';
    RAISE NOTICE '2. Assign admin role: UPDATE profiles SET role = ''admin'' WHERE user_id = ''your-user-id'';';
    RAISE NOTICE '3. Test the application';
    RAISE NOTICE '========================================';
END $$;