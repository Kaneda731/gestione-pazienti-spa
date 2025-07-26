-- Migration: Setup RLS policies (Adaptive version)
-- Version: 003_adaptive
-- Description: Adaptive setup that handles different profiles table structures

-- ========================================
-- ANALYZE AND ADAPT TO PROFILES TABLE
-- ========================================

DO $$
DECLARE
    user_id_exists BOOLEAN;
    id_exists BOOLEAN;
    table_exists BOOLEAN;
    profiles_structure TEXT;
BEGIN
    -- Check if profiles table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'profiles'
    ) INTO table_exists;
    
    IF NOT table_exists THEN
        RAISE EXCEPTION 'Profiles table does not exist. Create it first.';
    END IF;
    
    -- Check column structure
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'user_id'
    ) INTO user_id_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'id'
    ) INTO id_exists;
    
    -- Determine structure
    IF user_id_exists THEN
        profiles_structure := 'has_user_id';
        RAISE NOTICE 'Using existing user_id column in profiles table';
    ELSIF id_exists THEN
        profiles_structure := 'has_id_only';
        RAISE NOTICE 'Profiles table has id column, will add user_id column';
    ELSE
        RAISE EXCEPTION 'Profiles table structure not recognized. Manual intervention required.';
    END IF;
    
    -- Store the structure for later use
    -- We'll use this information in the rest of the script
END $$;

-- ========================================
-- ADD MISSING COLUMNS TO PROFILES
-- ========================================

-- Add user_id column if it doesn't exist
DO $$
BEGIN
    -- Check if user_id column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'user_id'
    ) THEN
        -- Add user_id column
        ALTER TABLE profiles ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        
        -- If there's an existing id column that might be the user reference, copy it
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'id'
        ) THEN
            -- Try to update user_id from id (assuming id is the user reference)
            -- This is a guess - you might need to adjust this
            UPDATE profiles SET user_id = id WHERE user_id IS NULL;
        END IF;
        
        RAISE NOTICE 'Added user_id column to profiles table';
    ELSE
        RAISE NOTICE 'user_id column already exists in profiles table';
    END IF;
END $$;

-- Add role column if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT CHECK (role IN ('viewer', 'editor', 'admin')) DEFAULT 'viewer';

-- Add updated_at column if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- ========================================
-- ENABLE RLS ON TABLES
-- ========================================

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on pazienti table
ALTER TABLE pazienti ENABLE ROW LEVEL SECURITY;

-- Enable RLS on eventi_clinici table (should already be enabled)
ALTER TABLE eventi_clinici ENABLE ROW LEVEL SECURITY;

-- ========================================
-- CREATE INDEXES FOR PERFORMANCE
-- ========================================

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_pazienti_user_id ON pazienti(user_id);

-- ========================================
-- CREATE HELPER FUNCTIONS
-- ========================================

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT COALESCE(role, 'viewer') 
        FROM profiles 
        WHERE user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has specific role or higher
CREATE OR REPLACE FUNCTION user_has_role_or_higher(required_role TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
BEGIN
    user_role := get_user_role();
    
    -- Admin can do everything
    IF user_role = 'admin' THEN
        RETURN TRUE;
    END IF;
    
    -- Editor can do editor and viewer actions
    IF user_role = 'editor' AND required_role IN ('editor', 'viewer') THEN
        RETURN TRUE;
    END IF;
    
    -- Viewer can only do viewer actions
    IF user_role = 'viewer' AND required_role = 'viewer' THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- CREATE RLS POLICIES FOR PROFILES
-- ========================================

-- Users can view their own profile
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT 
    TO authenticated
    USING (user_id = auth.uid());

-- Users can update their own profile (but not role unless admin)
CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE 
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (
        user_id = auth.uid() AND 
        (OLD.role = NEW.role OR user_has_role_or_higher('admin'))
    );

-- Only admins can manage all profiles and roles
CREATE POLICY "Admins can manage all profiles" ON profiles
    FOR ALL 
    TO authenticated
    USING (user_has_role_or_higher('admin'))
    WITH CHECK (user_has_role_or_higher('admin'));

-- Users can create their own profile
CREATE POLICY "Users can create their own profile" ON profiles
    FOR INSERT 
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- ========================================
-- CREATE RLS POLICIES FOR PAZIENTI
-- ========================================

-- All authenticated users can view patients
CREATE POLICY "All authenticated users can view patients" ON pazienti
    FOR SELECT 
    TO authenticated
    USING (user_has_role_or_higher('viewer'));

-- Only editors and admins can create patients
CREATE POLICY "Editors and admins can create patients" ON pazienti
    FOR INSERT 
    TO authenticated
    WITH CHECK (user_has_role_or_higher('editor'));

-- Only editors and admins can update patients
CREATE POLICY "Editors and admins can update patients" ON pazienti
    FOR UPDATE 
    TO authenticated
    USING (user_has_role_or_higher('editor'))
    WITH CHECK (user_has_role_or_higher('editor'));

-- Only admins can delete patients
CREATE POLICY "Only admins can delete patients" ON pazienti
    FOR DELETE 
    TO authenticated
    USING (user_has_role_or_higher('admin'));

-- ========================================
-- CREATE RLS POLICIES FOR EVENTI_CLINICI
-- ========================================

-- All authenticated users can view clinical events
CREATE POLICY "All authenticated users can view clinical events" ON eventi_clinici
    FOR SELECT 
    TO authenticated
    USING (user_has_role_or_higher('viewer'));

-- Only editors and admins can create clinical events
CREATE POLICY "Editors and admins can create clinical events" ON eventi_clinici
    FOR INSERT 
    TO authenticated
    WITH CHECK (user_has_role_or_higher('editor'));

-- Only editors and admins can update clinical events
CREATE POLICY "Editors and admins can update clinical events" ON eventi_clinici
    FOR UPDATE 
    TO authenticated
    USING (user_has_role_or_higher('editor'))
    WITH CHECK (user_has_role_or_higher('editor'));

-- Only admins can delete clinical events
CREATE POLICY "Only admins can delete clinical events" ON eventi_clinici
    FOR DELETE 
    TO authenticated
    USING (user_has_role_or_higher('admin'));

-- ========================================
-- VERIFICATION AND SUMMARY
-- ========================================

DO $$
DECLARE
    policy_count INTEGER;
    function_count INTEGER;
BEGIN
    -- Count created policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE schemaname = 'public'
    AND tablename IN ('pazienti', 'eventi_clinici', 'profiles');
    
    -- Count helper functions
    SELECT COUNT(*) INTO function_count
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name IN ('get_user_role', 'user_has_role_or_higher');
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RLS SETUP COMPLETED SUCCESSFULLY';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Created % RLS policies', policy_count;
    RAISE NOTICE 'Created % helper functions', function_count;
    RAISE NOTICE 'RLS enabled on all main tables';
    RAISE NOTICE '';
    RAISE NOTICE 'NEXT STEPS:';
    RAISE NOTICE '1. Assign roles to users: UPDATE profiles SET role = ''admin'' WHERE user_id = ''your-uuid''';
    RAISE NOTICE '2. Test the application';
    RAISE NOTICE '3. Verify that permissions work correctly';
    RAISE NOTICE '========================================';
END $$;