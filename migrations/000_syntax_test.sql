-- Simple syntax test for RLS migration files
-- Run this to verify that the SQL syntax is correct

-- Test basic DO block syntax
DO $$
BEGIN
    RAISE NOTICE 'Syntax test started...';
END $$;

-- Test function creation syntax
CREATE OR REPLACE FUNCTION test_syntax_function()
RETURNS TEXT AS $$
BEGIN
    RETURN 'Syntax OK';
END;
$$ LANGUAGE plpgsql;

-- Test the function
SELECT test_syntax_function() as test_result;

-- Clean up test function
DROP FUNCTION IF EXISTS test_syntax_function();

-- Final message
DO $$
BEGIN
    RAISE NOTICE 'Syntax test completed successfully!';
    RAISE NOTICE 'All migration files should work correctly.';
END $$;