-- Migrazione per creare la tabella diagnosi se non esiste
-- e aggiornare la struttura per usare diagnosi_id invece di diagnosi come testo

-- 1. Crea la tabella diagnosi se non esiste
CREATE TABLE IF NOT EXISTS diagnosi (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL UNIQUE,
    descrizione TEXT,
    codice VARCHAR(50),
    attiva BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Inserisci alcune diagnosi di esempio se la tabella è vuota
INSERT INTO diagnosi (nome, descrizione, codice) 
SELECT * FROM (VALUES 
    ('Infarto miocardico acuto', 'Infarto del miocardio', 'I21'),
    ('Angina pectoris', 'Dolore toracico da ischemia cardiaca', 'I20'),
    ('Insufficienza cardiaca', 'Scompenso cardiaco', 'I50'),
    ('Fibrillazione atriale', 'Aritmia cardiaca', 'I48'),
    ('Ipertensione arteriosa', 'Pressione arteriosa elevata', 'I10'),
    ('Diabete mellito tipo 2', 'Diabete non insulino-dipendente', 'E11'),
    ('BPCO', 'Broncopneumopatia cronica ostruttiva', 'J44'),
    ('Polmonite', 'Infezione polmonare', 'J18'),
    ('Ictus ischemico', 'Stroke ischemico', 'I63'),
    ('Embolia polmonare', 'Embolia arteria polmonare', 'I26')
) AS v(nome, descrizione, codice)
WHERE NOT EXISTS (SELECT 1 FROM diagnosi LIMIT 1);

-- 3. Aggiungi la colonna diagnosi_id alla tabella pazienti se non esiste
ALTER TABLE pazienti 
ADD COLUMN IF NOT EXISTS diagnosi_id INTEGER REFERENCES diagnosi(id);

-- 4. Crea un indice per migliorare le performance delle query con JOIN
CREATE INDEX IF NOT EXISTS idx_pazienti_diagnosi_id ON pazienti(diagnosi_id);

-- 5. Migra i dati esistenti dalla colonna diagnosi (testo) alla nuova struttura
-- Solo se ci sono pazienti con diagnosi testuale e la colonna diagnosi_id è vuota
UPDATE pazienti 
SET diagnosi_id = (
    SELECT d.id 
    FROM diagnosi d 
    WHERE d.nome = pazienti.diagnosi 
    LIMIT 1
)
WHERE pazienti.diagnosi IS NOT NULL 
  AND pazienti.diagnosi != '' 
  AND pazienti.diagnosi_id IS NULL;

-- 6. Per le diagnosi che non hanno corrispondenza, creale automaticamente
INSERT INTO diagnosi (nome, descrizione)
SELECT DISTINCT p.diagnosi, 'Diagnosi migrata automaticamente'
FROM pazienti p
WHERE p.diagnosi IS NOT NULL 
  AND p.diagnosi != ''
  AND p.diagnosi_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM diagnosi d WHERE d.nome = p.diagnosi
  );

-- 7. Aggiorna nuovamente i pazienti per le diagnosi appena create
UPDATE pazienti 
SET diagnosi_id = (
    SELECT d.id 
    FROM diagnosi d 
    WHERE d.nome = pazienti.diagnosi 
    LIMIT 1
)
WHERE pazienti.diagnosi IS NOT NULL 
  AND pazienti.diagnosi != '' 
  AND pazienti.diagnosi_id IS NULL;

-- 8. Mostra il risultato della migrazione
SELECT 
    'Diagnosi totali' as tipo,
    COUNT(*) as conteggio
FROM diagnosi
UNION ALL
SELECT 
    'Pazienti con diagnosi_id' as tipo,
    COUNT(*) as conteggio
FROM pazienti 
WHERE diagnosi_id IS NOT NULL
UNION ALL
SELECT 
    'Pazienti senza diagnosi_id' as tipo,
    COUNT(*) as conteggio
FROM pazienti 
WHERE diagnosi_id IS NULL;