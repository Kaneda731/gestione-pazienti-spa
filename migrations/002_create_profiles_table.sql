-- Migration: Create profiles table if it doesn't exist
-- Version: 002
-- Description: Create the profiles table needed for RLS role-based access

-- ========================================
-- CHECK IF PROFILES TABLE EXISTS
-- ========================================

DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    -- Check if profiles table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE '✅ Profiles table already exists';
    ELSE
        RAISE NOTICE '❌ Profiles table does not exist - will create it';
    END IF;
END $$;

-- ========================================
-- CREATE PROFILES TABLE
-- ========================================

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT CHECK (role IN ('viewer', 'editor', 'admin')) DEFAULT 'viewer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Ensure one profile per user
    UNIQUE(user_id)
);

-- ========================================
-- CREATE INDEXES
-- ========================================

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- ========================================
-- CREATE UPDATED_AT TRIGGER
-- ========================================

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for profiles table
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- ENABLE RLS ON PROFILES TABLE
-- ========================================

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ========================================
-- CREATE INITIAL PROFILES FOR EXISTING USERS
-- ========================================

-- Create profiles for existing auth users who don't have one
INSERT INTO profiles (user_id, username, full_name, role)
SELECT 
    u.id,
    COALESCE(u.email, 'user_' || u.id::text) as username,
    COALESCE(u.raw_user_meta_data->>'full_name', u.email) as full_name,
    'viewer' as role  -- Default role for existing users
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.user_id
WHERE p.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- ========================================
-- VERIFICATION
-- ========================================

-- Show created table structure
SELECT 
    'PROFILES TABLE CREATED' as status;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Show created profiles
SELECT 
    'CREATED PROFILES' as status;

SELECT 
    COUNT(*) as profile_count,
    COUNT(CASE WHEN role = 'viewer' THEN 1 END) as viewers,
    COUNT(CASE WHEN role = 'editor' THEN 1 END) as editors,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins
FROM profiles;

-- ========================================
-- SUMMARY
-- ========================================

DO $$
DECLARE
    profile_count INTEGER;
    user_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO profile_count FROM profiles;
    SELECT COUNT(*) INTO user_count FROM auth.users;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'PROFILES TABLE SETUP COMPLETED';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Profiles table created with role-based access';
    RAISE NOTICE 'Auth users: %, Profiles created: %', user_count, profile_count;
    RAISE NOTICE 'All existing users have been given "viewer" role by default';
    RAISE NOTICE '';
    RAISE NOTICE 'NEXT STEPS:';
    RAISE NOTICE '1. Apply migrations/003_setup_rls_policies.sql';
    RAISE NOTICE '2. Assign admin/editor roles to specific users';
    RAISE NOTICE '3. Test the role-based access system';
    RAISE NOTICE '========================================';
END $$;