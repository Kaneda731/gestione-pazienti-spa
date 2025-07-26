-- Rollback Migration: Remove RLS policies
-- Version: 003_rollback
-- Description: Remove RLS policies and disable RLS if needed

-- ========================================
-- DROP POLICIES FOR EVENTI_CLINICI TABLE
-- ========================================

DROP POLICY IF EXISTS "Only admins can delete clinical events" ON eventi_clinici;
DROP POLICY IF EXISTS "Editors and admins can update clinical events" ON eventi_clinici;
DROP POLICY IF EXISTS "Editors and admins can create clinical events" ON eventi_clinici;
DROP POLICY IF EXISTS "All authenticated users can view clinical events" ON eventi_clinici;

-- ========================================
-- DROP POLICIES FOR PAZIENTI TABLE
-- ========================================

DROP POLICY IF EXISTS "Only admins can delete patients" ON pazienti;
DROP POLICY IF EXISTS "Editors and admins can update patients" ON pazienti;
DROP POLICY IF EXISTS "Editors and admins can create patients" ON pazienti;
DROP POLICY IF EXISTS "All authenticated users can view patients" ON pazienti;

-- ========================================
-- DROP POLICIES FOR PROFILES TABLE
-- ========================================

DROP POLICY IF EXISTS "Users can create their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;

-- ========================================
-- DROP HELPER FUNCTIONS
-- ========================================

DROP FUNCTION IF EXISTS user_has_role_or_higher(TEXT);
DROP FUNCTION IF EXISTS get_user_role();

-- ========================================
-- REMOVE ROLE COLUMN FROM PROFILES (OPTIONAL)
-- ========================================

-- WARNING: This will remove the role column and all role data!
-- Only uncomment if you want to completely remove the role system

-- ALTER TABLE profiles DROP COLUMN IF EXISTS role;
-- ALTER TABLE profiles DROP COLUMN IF EXISTS updated_at;

-- ========================================
-- DISABLE RLS (OPTIONAL - UNCOMMENT IF NEEDED)
-- ========================================

-- WARNING: Disabling RLS removes all security restrictions!
-- Only uncomment these if you want to completely disable RLS

-- ALTER TABLE eventi_clinici DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE pazienti DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- ========================================
-- DROP PERFORMANCE INDEXES (OPTIONAL)
-- ========================================

-- DROP INDEX IF EXISTS idx_pazienti_user_id;
-- DROP INDEX IF EXISTS idx_eventi_clinici_paziente_user;
-- DROP INDEX IF EXISTS idx_profiles_user_id;
-- DROP INDEX IF EXISTS idx_profiles_role;