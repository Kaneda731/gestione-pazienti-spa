#!/bin/bash

# Script per archiviare test approvati
# Uso: ./archive-test.sh nome-file-test.html

if [ $# -eq 0 ]; then
    echo "❌ Errore: Specificare il nome del file di test da archiviare"
    echo "💡 Uso: ./archive-test.sh test-nome-file.html"
    exit 1
fi

TEST_FILE="$1"
SOURCE_PATH="tests/$TEST_FILE"
DEST_PATH="tests/approvati/$TEST_FILE"

# Verifica che il file esista
if [ ! -f "$SOURCE_PATH" ]; then
    echo "❌ Errore: File $SOURCE_PATH non trovato"
    exit 1
fi

# Verifica che la directory di destinazione esista
if [ ! -d "tests/approvati" ]; then
    echo "📁 Creazione directory tests/approvati/"
    mkdir -p tests/approvati
fi

# Sposta il file
echo "📦 Archiviazione test: $TEST_FILE"
mv "$SOURCE_PATH" "$DEST_PATH"

if [ $? -eq 0 ]; then
    echo "✅ Test $TEST_FILE archiviato con successo in tests/approvati/"
    echo "📝 Il file è ora ignorato da Git come configurato in .gitignore"
    
    # Aggiorna il README dei test approvati
    echo "📋 Aggiornamento README test approvati..."
    TIMESTAMP=$(date "+%Y-%m-%d %H:%M")
    echo "- \`$TEST_FILE\` - Approvato il $TIMESTAMP" >> tests/approvati/README.md
    
    echo "🎉 Archiviazione completata!"
else
    echo "❌ Errore durante l'archiviazione"
    exit 1
fi
