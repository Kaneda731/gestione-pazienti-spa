-- Migration: Setup Row Level Security (RLS) policies with role-based access
-- Version: 003
-- Description: Configure RLS policies for pazienti and eventi_clinici tables with viewer/editor/admin roles

-- ========================================
-- MODIFY EXISTING PROFILES TABLE
-- ========================================

-- Add role column to existing profiles table if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT CHECK (role IN ('viewer', 'editor', 'admin')) DEFAULT 'viewer';

-- Add updated_at column if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Create updated_at trigger for profiles if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- HELPER FUNCTION FOR ROLE CHECKING
-- ========================================

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
-- ENABLE RLS ON MAIN TABLES
-- ========================================

-- Enable RLS on pazienti table
ALTER TABLE pazienti ENABLE ROW LEVEL SECURITY;

-- Enable RLS on eventi_clinici table  
ALTER TABLE eventi_clinici ENABLE ROW LEVEL SECURITY;

-- ========================================
-- POLICIES FOR PROFILES TABLE
-- ========================================

-- Users can view their own profile
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT 
    TO authenticated
    USING (user_id = auth.uid());

-- Users can update their own profile (but not role)
CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE 
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Only admins can manage roles and other users' profiles
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

-- Add index on user_id for better RLS performance (keep existing)
CREATE INDEX IF NOT EXISTS idx_pazienti_user_id ON pazienti(user_id);

-- Add composite index for eventi_clinici queries
CREATE INDEX IF NOT EXISTS idx_eventi_clinici_paziente_user ON eventi_clinici(paziente_id) 
    INCLUDE (created_at, tipo_evento);

-- ========================================
-- INSERT DEFAULT ADMIN USER (OPTIONAL)
-- ========================================

-- Uncomment and modify this section to create an initial admin user
-- Replace 'your-admin-user-id' with the actual UUID of your admin user from auth.users

-- INSERT INTO profiles (user_id, role) 
-- VALUES ('your-admin-user-id', 'admin')
-- ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- Or update an existing profile to admin:
-- UPDATE profiles SET role = 'admin' WHERE user_id = 'your-admin-user-id';

-- ========================================
-- COMMENTS FOR DOCUMENTATION
-- ========================================

COMMENT ON COLUMN profiles.role IS 'User role: viewer (read-only), editor (read/write), admin (full access)';

COMMENT ON FUNCTION get_user_role() IS 'Returns the role of the current authenticated user';
COMMENT ON FUNCTION user_has_role_or_higher(TEXT) IS 'Checks if user has the specified role or higher privileges';

COMMENT ON POLICY "All authenticated users can view patients" ON pazienti IS 
    'Allows all authenticated users (viewer, editor, admin) to view all patients';

COMMENT ON POLICY "Editors and admins can create patients" ON pazienti IS 
    'Allows editors and admins to create new patients';

COMMENT ON POLICY "Editors and admins can update patients" ON pazienti IS 
    'Allows editors and admins to update any patient';

COMMENT ON POLICY "Only admins can delete patients" ON pazienti IS 
    'Only admins can delete patients';

COMMENT ON POLICY "All authenticated users can view clinical events" ON eventi_clinici IS 
    'Allows all authenticated users to view all clinical events';

COMMENT ON POLICY "Editors and admins can create clinical events" ON eventi_clinici IS 
    'Allows editors and admins to create clinical events for any patient';

COMMENT ON POLICY "Editors and admins can update clinical events" ON eventi_clinici IS 
    'Allows editors and admins to update any clinical event';

COMMENT ON POLICY "Only admins can delete clinical events" ON eventi_clinici IS 
    'Only admins can delete clinical events';