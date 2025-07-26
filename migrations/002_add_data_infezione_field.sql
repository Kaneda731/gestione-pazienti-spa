-- Migration: Add data_infezione field to pazienti table
-- Version: 002
-- Description: Add infection date field to track when a patient becomes infected

-- Add data_infezione column to pazienti table
ALTER TABLE pazienti ADD COLUMN IF NOT EXISTS data_infezione DATE;

-- Add index for performance optimization
CREATE INDEX IF NOT EXISTS idx_pazienti_data_infezione ON pazienti(data_infezione);

-- Add comment for documentation
COMMENT ON COLUMN pazienti.data_infezione IS 'Date when the patient became infected (if applicable)';