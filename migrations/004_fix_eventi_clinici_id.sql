-- Fix eventi_clinici table ID default
-- Add default UUID generation for id column

-- Check current structure
SELECT 
    'Current eventi_clinici structure:' as info;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'eventi_clinici'
AND column_name = 'id';

-- Add default UUID generation if missing
ALTER TABLE eventi_clinici 
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Verify the fix
SELECT 
    'Fixed eventi_clinici structure:' as info;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'eventi_clinici'
AND column_name = 'id';

SELECT 'eventi_clinici ID default fixed successfully' as result;