-- Migration: Setup RLS policies for diagnosi table
-- Version: 006
-- Description: RLS policies for diagnosi table using profiles.id (which matches auth.users.id)

-- ========================================
-- ENABLE RLS ON DIAGNOSI TABLE
-- ========================================

-- Enable RLS on diagnosi table
ALTER TABLE diagnosi ENABLE ROW LEVEL SECURITY;

-- ========================================
-- POLICIES FOR DIAGNOSI TABLE
-- ========================================

-- SELECT: All authenticated users can view diagnoses (viewer, editor, admin)
CREATE POLICY "All authenticated users can view diagnoses" ON diagnosi
    FOR SELECT 
    TO authenticated
    USING (user_has_role_or_higher('viewer'));

-- INSERT: Only editors and admins can create diagnoses
CREATE POLICY "Editors and admins can create diagnoses" ON diagnosi
    FOR INSERT 
    TO authenticated
    WITH CHECK (user_has_role_or_higher('editor'));

-- UPDATE: Only editors and admins can update diagnoses
CREATE POLICY "Editors and admins can update diagnoses" ON diagnosi
    FOR UPDATE 
    TO authenticated
    USING (user_has_role_or_higher('editor'))
    WITH CHECK (user_has_role_or_higher('editor'));

-- DELETE: Only admins can delete diagnoses
CREATE POLICY "Only admins can delete diagnoses" ON diagnosi
    FOR DELETE 
    TO authenticated
    USING (user_has_role_or_higher('admin'));

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- Add indexes for diagnosi queries (lookup table)
-- Note: Run migration 007_fix_diagnosi_structure.sql first to add missing columns
CREATE INDEX IF NOT EXISTS idx_diagnosi_nome ON diagnosi(nome);
CREATE INDEX IF NOT EXISTS idx_diagnosi_created_at ON diagnosi(created_at);

-- ========================================
-- COMMENTS FOR DOCUMENTATION
-- ========================================

COMMENT ON POLICY "All authenticated users can view diagnoses" ON diagnosi IS 
    'Allows all authenticated users (viewer, editor, admin) to view all diagnoses';

COMMENT ON POLICY "Editors and admins can create diagnoses" ON diagnosi IS 
    'Allows editors and admins to create new diagnoses';

COMMENT ON POLICY "Editors and admins can update diagnoses" ON diagnosi IS 
    'Allows editors and admins to update existing diagnoses';

COMMENT ON POLICY "Only admins can delete diagnoses" ON diagnosi IS 
    'Only admins can delete diagnoses';

-- ========================================
-- VERIFICATION
-- ========================================

-- Show RLS status for diagnosi table
SELECT 
    'DIAGNOSI TABLE RLS STATUS' as section;

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
AND tablename = 'diagnosi';

-- Show created policies for diagnosi
SELECT 
    'DIAGNOSI POLICIES' as section;

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
AND tablename = 'diagnosi'
ORDER BY cmd, policyname;

-- ========================================
-- FINAL SUMMARY
-- ========================================

DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    -- Count policies created for diagnosi
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE schemaname = 'public'
    AND tablename = 'diagnosi';
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'DIAGNOSI RLS SETUP COMPLETED';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Created % RLS policies for diagnosi table', policy_count;
    RAISE NOTICE '';
    RAISE NOTICE '✅ RLS enabled on diagnosi table';
    RAISE NOTICE '✅ Role-based access control configured';
    RAISE NOTICE '✅ Performance indexes created';
    RAISE NOTICE '';
    RAISE NOTICE 'Access levels:';
    RAISE NOTICE '- Viewers: Can read diagnoses';
    RAISE NOTICE '- Editors: Can read/write diagnoses';
    RAISE NOTICE '- Admins: Full access including delete';
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
END $$;