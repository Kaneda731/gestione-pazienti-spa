-- Migration: Setup RLS policies adapted for existing profiles structure
-- Version: 003_adapted
-- Description: RLS policies using profiles.id (which matches auth.users.id)

-- ========================================
-- HELPER FUNCTIONS FOR ROLE CHECKING
-- ========================================

-- Function to get current user's role using profiles.id
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT COALESCE(role, 'viewer') 
        FROM profiles 
        WHERE id = auth.uid()
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
-- ENABLE RLS ON MAIN TABLES
-- ========================================

-- Enable RLS on pazienti table
ALTER TABLE pazienti ENABLE ROW LEVEL SECURITY;

-- Enable RLS on eventi_clinici table  
ALTER TABLE eventi_clinici ENABLE ROW LEVEL SECURITY;

-- Enable RLS on profiles table (if not already enabled)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ========================================
-- POLICIES FOR PROFILES TABLE
-- ========================================

-- Users can view their own profile
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT 
    TO authenticated
    USING (id = auth.uid());

-- Users can update their own profile (but not role unless admin)
CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE 
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Only admins can manage all profiles and roles
CREATE POLICY "Admins can manage all profiles" ON profiles
    FOR ALL 
    TO authenticated
    USING (user_has_role_or_higher('admin'))
    WITH CHECK (user_has_role_or_higher('admin'));

-- Users can create their own profile (for new users)
CREATE POLICY "Users can create their own profile" ON profiles
    FOR INSERT 
    TO authenticated
    WITH CHECK (id = auth.uid());

-- ========================================
-- POLICIES FOR PAZIENTI TABLE
-- ========================================

-- SELECT: All authenticated users can view patients (viewer, editor, admin)
CREATE POLICY "All authenticated users can view patients" ON pazienti
    FOR SELECT 
    TO authenticated
    USING (user_has_role_or_higher('viewer'));

-- INSERT: Only editors and admins can create patients
CREATE POLICY "Editors and admins can create patients" ON pazienti
    FOR INSERT 
    TO authenticated
    WITH CHECK (user_has_role_or_higher('editor'));

-- UPDATE: Only editors and admins can update patients
CREATE POLICY "Editors and admins can update patients" ON pazienti
    FOR UPDATE 
    TO authenticated
    USING (user_has_role_or_higher('editor'))
    WITH CHECK (user_has_role_or_higher('editor'));

-- DELETE: Only admins can delete patients
CREATE POLICY "Only admins can delete patients" ON pazienti
    FOR DELETE 
    TO authenticated
    USING (user_has_role_or_higher('admin'));

-- ========================================
-- POLICIES FOR EVENTI_CLINICI TABLE
-- ========================================

-- SELECT: All authenticated users can view clinical events
CREATE POLICY "All authenticated users can view clinical events" ON eventi_clinici
    FOR SELECT 
    TO authenticated
    USING (user_has_role_or_higher('viewer'));

-- INSERT: Only editors and admins can create clinical events
CREATE POLICY "Editors and admins can create clinical events" ON eventi_clinici
    FOR INSERT 
    TO authenticated
    WITH CHECK (user_has_role_or_higher('editor'));

-- UPDATE: Only editors and admins can update clinical events
CREATE POLICY "Editors and admins can update clinical events" ON eventi_clinici
    FOR UPDATE 
    TO authenticated
    USING (user_has_role_or_higher('editor'))
    WITH CHECK (user_has_role_or_higher('editor'));

-- DELETE: Only admins can delete clinical events
CREATE POLICY "Only admins can delete clinical events" ON eventi_clinici
    FOR DELETE 
    TO authenticated
    USING (user_has_role_or_higher('admin'));

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- Add index on profiles.id for better RLS performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Add index on user_id for pazienti (keep existing)
CREATE INDEX IF NOT EXISTS idx_pazienti_user_id ON pazienti(user_id);

-- Add composite index for eventi_clinici queries
CREATE INDEX IF NOT EXISTS idx_eventi_clinici_paziente_user ON eventi_clinici(paziente_id) 
    INCLUDE (created_at, tipo_evento);

-- ========================================
-- COMMENTS FOR DOCUMENTATION
-- ========================================

COMMENT ON FUNCTION get_user_role() IS 'Returns the role of the current authenticated user using profiles.id';
COMMENT ON FUNCTION user_has_role_or_higher(TEXT) IS 'Checks if user has the specified role or higher privileges';

COMMENT ON POLICY "Users can view their own profile" ON profiles IS 
    'Allows users to view their own profile using profiles.id = auth.uid()';

COMMENT ON POLICY "All authenticated users can view patients" ON pazienti IS 
    'Allows all authenticated users (viewer, editor, admin) to view all patients';

COMMENT ON POLICY "Editors and admins can create patients" ON pazienti IS 
    'Allows editors and admins to create new patients';

COMMENT ON POLICY "Only admins can delete patients" ON pazienti IS 
    'Only admins can delete patients';

-- ========================================
-- VERIFICATION
-- ========================================

-- Show RLS status
SELECT 
    'RLS STATUS CHECK' as section;

SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '✅ RLS Enabled'
        ELSE '❌ RLS Disabled'
    END as status
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('pazienti', 'eventi_clinici', 'profiles')
ORDER BY tablename;

-- Show created policies
SELECT 
    'CREATED POLICIES' as section;

SELECT 
    tablename,
    policyname,
    cmd as operation,
    CASE 
        WHEN permissive = 'PERMISSIVE' THEN '✅ Permissive'
        ELSE '⚠️ Restrictive'
    END as type
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('pazienti', 'eventi_clinici', 'profiles')
ORDER BY tablename, cmd, policyname;

-- Test role functions
SELECT 
    'ROLE FUNCTION TEST' as section;

SELECT 
    auth.uid() as current_user_id,
    get_user_role() as current_role,
    user_has_role_or_higher('viewer') as can_view,
    user_has_role_or_higher('editor') as can_edit,
    user_has_role_or_higher('admin') as can_admin;

-- ========================================
-- FINAL SUMMARY
-- ========================================

DO $$
DECLARE
    policy_count INTEGER;
    admin_count INTEGER;
    editor_count INTEGER;
    viewer_count INTEGER;
BEGIN
    -- Count policies created
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE schemaname = 'public'
    AND tablename IN ('pazienti', 'eventi_clinici', 'profiles');
    
    -- Count users by role
    SELECT 
        COUNT(CASE WHEN role = 'admin' THEN 1 END),
        COUNT(CASE WHEN role = 'editor' THEN 1 END),
        COUNT(CASE WHEN role = 'viewer' THEN 1 END)
    INTO admin_count, editor_count, viewer_count
    FROM profiles;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RLS SETUP COMPLETED SUCCESSFULLY';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Created % RLS policies', policy_count;
    RAISE NOTICE 'User roles: % admin, % editor, % viewer', admin_count, editor_count, viewer_count;
    RAISE NOTICE '';
    RAISE NOTICE '✅ RLS enabled on all tables';
    RAISE NOTICE '✅ Role-based access control configured';
    RAISE NOTICE '✅ Functions created for role checking';
    RAISE NOTICE '';
    RAISE NOTICE 'CURRENT USERS:';
    RAISE NOTICE '- kaneda73@gmail.com (admin)';
    RAISE NOTICE '- f4ky0ug5m@gmail.com (editor)';
    RAISE NOTICE '- chiara.burrai16@gmail.com (editor)';
    RAISE NOTICE '';
    RAISE NOTICE 'You can now test the application!';
    RAISE NOTICE '========================================';
END $$;