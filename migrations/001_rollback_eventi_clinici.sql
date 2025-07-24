-- Rollback Migration: Remove eventi_clinici table and enhanced pazienti columns
-- Version: 001_rollback
-- Description: Rollback clinical events tracking and enhanced discharge functionality

-- Drop trigger and function
DROP TRIGGER IF EXISTS update_eventi_clinici_updated_at ON eventi_clinici;
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop indexes
DROP INDEX IF EXISTS idx_eventi_clinici_paziente_id;
DROP INDEX IF EXISTS idx_eventi_clinici_data_evento;
DROP INDEX IF EXISTS idx_eventi_clinici_tipo_evento;
DROP INDEX IF EXISTS idx_pazienti_tipo_dimissione;
DROP INDEX IF EXISTS idx_pazienti_data_dimissione;

-- Remove new columns from pazienti table
ALTER TABLE pazienti DROP COLUMN IF EXISTS tipo_dimissione;
ALTER TABLE pazienti DROP COLUMN IF EXISTS reparto_destinazione;
ALTER TABLE pazienti DROP COLUMN IF EXISTS clinica_destinazione;
ALTER TABLE pazienti DROP COLUMN IF EXISTS codice_clinica;
ALTER TABLE pazienti DROP COLUMN IF EXISTS codice_dimissione;

-- Drop eventi_clinici table
DROP TABLE IF EXISTS eventi_clinici;