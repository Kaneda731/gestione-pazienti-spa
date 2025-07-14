-- ============================================
-- RECUPERO PAZIENTI CANCELLATI
-- ============================================
-- Script per ricreare i 10 pazienti reali cancellati
-- Basato sui dati forniti dall'utente

-- 1. RICREAZIONE DEI 10 PAZIENTI REALI
-- ============================================
INSERT INTO pazienti (
    id,
    medico_id,
    nome,
    cognome,
    codice_fiscale,
    data_dimissione,
    reparto,
    diagnosi,
    stato,
    livello_assistenza,
    medico_curante,
    note,
    reparto_appartenenza,
    reparto_provenienza,
    data_ricovero,
    user_id,
    data_nascita,
    infetto,
    codice_rad
) VALUES 
-- Paziente 1
('fe23139a-87ba-486d-adf0-579bba3879aa', null, 'Melissa', 'Benvenuti', null, '2025-07-08 00:00:00+00', null, 'Frattura_Polso', null, 'Media', null, null, 'Ortopedia', 'PS', '2025-06-25', 'f9de63c7-d6a6-4758-b4dd-e228e8a0e49e', null, false, null),

-- Paziente 2
('fac412df-2e4e-411d-9c8e-a503d296cb8b', null, 'Ahmet Furkan', 'Bahceci', null, '2025-06-09 00:00:00+00', null, 'Politrauma', null, 'Media', null, null, 'Ortopedia', 'CR', '2025-05-24', 'f9de63c7-d6a6-4758-b4dd-e228e8a0e49e', null, false, null),

-- Paziente 3
('f5ef945a-78a0-44a4-812e-b5517e1f5f1d', null, 'Salvatore', 'Metrangolo', null, '2025-06-25 00:00:00+00', null, 'Frattura_Femore', null, 'Media', null, null, 'Ortopedia', 'PS', '2025-05-30', 'f9de63c7-d6a6-4758-b4dd-e228e8a0e49e', null, false, null),

-- Paziente 4
('f5ed9181-aff1-4596-9f4c-647952a38750', null, 'Marisa', 'Di Giammarino', null, '2025-06-25 00:00:00+00', null, 'Frattura_Femore', null, 'Media', null, null, 'Ortopedia', 'PS', '2025-06-21', 'f9de63c7-d6a6-4758-b4dd-e228e8a0e49e', null, false, null),

-- Paziente 5
('eade146a-7273-4d50-926e-eb7c5bb6ad20', null, 'Susy', 'Pisetti', null, '2025-07-03 00:00:00+00', null, 'Gonartrosi', null, 'Media', null, null, 'Ortopedia', 'PO', '2025-06-26', 'f9de63c7-d6a6-4758-b4dd-e228e8a0e49e', null, false, null),

-- Paziente 6
('e567cbae-336f-4f15-aee4-a24111d2d541', null, 'Domenico', 'Zonno', null, '2025-06-06 00:00:00+00', null, 'Coczartrosi', null, 'Media', null, null, 'Ortopedia', 'PO', '2025-05-26', 'f9de63c7-d6a6-4758-b4dd-e228e8a0e49e', null, false, null),

-- Paziente 7
('e538c861-a9ab-4647-8dba-67bc690e93f3', null, 'Ubaldo', 'Papalia', null, '2025-06-27 00:00:00+00', null, 'Frattura_Femore', null, 'Media', null, null, 'Ortopedia', 'PS', '2025-06-26', 'f9de63c7-d6a6-4758-b4dd-e228e8a0e49e', null, false, null),

-- Paziente 8
('e4c33635-839a-4489-9b96-f26b50c67a81', 'f9de63c7-d6a6-4758-b4dd-e228e8a0e49e', 'Stefano', 'D''angelosante', null, null, null, 'Lesione_Tendinea', null, 'Bassa', null, null, 'Chirurgia Arti', 'PO', '2025-07-10', 'f9de63c7-d6a6-4758-b4dd-e228e8a0e49e', null, false, null),

-- Paziente 9
('de8d4d45-bd70-4159-9d8b-2854f86ab222', 'f9de63c7-d6a6-4758-b4dd-e228e8a0e49e', 'Fiorella', 'Principessa', null, '2025-07-11 00:00:00+00', null, 'Artosi Spallla', null, 'Media', null, null, 'Ortopedia', 'PO', '2025-07-07', 'f9de63c7-d6a6-4758-b4dd-e228e8a0e49e', null, false, null),

-- Paziente 10
('d862d42d-6f9c-4795-b65f-3631254c7b56', 'f9de63c7-d6a6-4758-b4dd-e228e8a0e49e', 'Elvira', 'De Rosa', null, null, null, 'Frattura_Femore', null, 'Media', null, null, 'Ortopedia', 'PS', '2025-07-01', 'f9de63c7-d6a6-4758-b4dd-e228e8a0e49e', null, false, null);

-- 2. VERIFICA INSERIMENTO
-- ============================================
SELECT COUNT(*) as pazienti_recuperati FROM pazienti;
SELECT * FROM pazienti ORDER BY created_at DESC;

-- 3. VERIFICA DATI PER GRAFICO
-- ============================================
SELECT diagnosi, COUNT(*) as conteggio
FROM pazienti
GROUP BY diagnosi
ORDER BY conteggio DESC;