-- Check if diagnosi table exists and its structure
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'diagnosi' 
ORDER BY ordinal_position;

-- If table exists, show sample data
SELECT * FROM diagnosi LIMIT 5;