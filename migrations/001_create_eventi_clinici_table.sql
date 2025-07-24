-- Migration: Create eventi_clinici table and enhance pazienti table
-- Version: 001
-- Description: Add clinical events tracking and enhanced discharge functionality
-- Requirements: 5.1, 5.2, 5.3

-- Create eventi_clinici table for tracking interventions and infections
CREATE TABLE IF NOT EXISTS eventi_clinici (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paziente_id UUID NOT NULL REFERENCES pazienti(id) ON DELETE CASCADE,
    tipo_evento TEXT NOT NULL CHECK (tipo_evento IN ('intervento', 'infezione')),
    data_evento DATE NOT NULL,
    descrizione TEXT,
    agente_patogeno TEXT,        -- For infections
    tipo_intervento TEXT,        -- For interventions
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add new columns to existing pazienti table for discharge/transfer data
ALTER TABLE pazienti ADD COLUMN IF NOT EXISTS tipo_dimissione TEXT CHECK (tipo_dimissione IN ('dimissione', 'trasferimento_interno', 'trasferimento_esterno'));
ALTER TABLE pazienti ADD COLUMN IF NOT EXISTS reparto_destinazione TEXT;
ALTER TABLE pazienti ADD COLUMN IF NOT EXISTS clinica_destinazione TEXT;
ALTER TABLE pazienti ADD COLUMN IF NOT EXISTS codice_clinica TEXT CHECK (codice_clinica IN ('56', '60'));
ALTER TABLE pazienti ADD COLUMN IF NOT EXISTS codice_dimissione TEXT CHECK (codice_dimissione IN ('3', '6'));

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_eventi_clinici_paziente_id ON eventi_clinici(paziente_id);
CREATE INDEX IF NOT EXISTS idx_eventi_clinici_data_evento ON eventi_clinici(data_evento);
CREATE INDEX IF NOT EXISTS idx_eventi_clinici_tipo_evento ON eventi_clinici(tipo_evento);
CREATE INDEX IF NOT EXISTS idx_pazienti_tipo_dimissione ON pazienti(tipo_dimissione);
CREATE INDEX IF NOT EXISTS idx_pazienti_data_dimissione ON pazienti(data_dimissione);

-- Create updated_at trigger for eventi_clinici
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_eventi_clinici_updated_at 
    BEFORE UPDATE ON eventi_clinici 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE eventi_clinici IS 'Clinical events tracking for patients (interventions and infections)';
COMMENT ON COLUMN eventi_clinici.tipo_evento IS 'Type of clinical event: intervento (intervention) or infezione (infection)';
COMMENT ON COLUMN eventi_clinici.agente_patogeno IS 'Pathogen agent for infections';
COMMENT ON COLUMN eventi_clinici.tipo_intervento IS 'Type of surgical intervention';
COMMENT ON COLUMN pazienti.tipo_dimissione IS 'Type of discharge: dimissione, trasferimento_interno, trasferimento_esterno';
COMMENT ON COLUMN pazienti.reparto_destinazione IS 'Destination department for internal transfers';
COMMENT ON COLUMN pazienti.clinica_destinazione IS 'Destination clinic for external transfers';
COMMENT ON COLUMN pazienti.codice_clinica IS 'Clinic code for rehabilitation clinics (56 or 60)';
COMMENT ON COLUMN pazienti.codice_dimissione IS 'Discharge code (3 or 6)';