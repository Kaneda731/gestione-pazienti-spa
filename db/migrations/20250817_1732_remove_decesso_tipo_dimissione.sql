-- Rollback: rimuovi 'decesso' da pazienti.tipo_dimissione
-- Safe: ricrea il check constraint escludendo il valore

BEGIN;

ALTER TABLE public.pazienti DROP CONSTRAINT IF EXISTS pazienti_tipo_dimissione_check;

ALTER TABLE public.pazienti
  ADD CONSTRAINT pazienti_tipo_dimissione_check
  CHECK (
    tipo_dimissione IS NULL OR
    tipo_dimissione IN ('dimissione','trasferimento_interno','trasferimento_esterno')
  );

COMMIT;
