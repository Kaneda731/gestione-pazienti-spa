#!/bin/bash
# Script per pulizia file temporanei di test
# AGGIORNATO per la nuova struttura organizzata

echo "🧹 Pulizia file temporanei di test (nuova struttura)..."

# Pulisci file temporanei dalla root
if [ -f "*.tmp" ]; then
    rm *.tmp
    echo "✅ Rimossi file .tmp"
fi

if [ -f "*.temp" ]; then
    rm *.temp  
    echo "✅ Rimossi file .temp"
fi

# Pulisci file di backup sparsi che potrebbero rimanere
if [ -f "src/js/*-backup*.js" ]; then
    mv src/js/*-backup*.js archive/js-backup/ 2>/dev/null
    echo "✅ Spostati backup rimasti in archive"
fi

# Pulisci file .DS_Store
find . -name ".DS_Store" -delete 2>/dev/null
echo "✅ Rimossi file .DS_Store"

# Verifica che la struttura sia corretta
echo "📁 Verifica struttura:"
echo "   - Archive: $(ls -la archive/ 2>/dev/null | wc -l) elementi"
echo "   - Tests: $(ls -la tests/ 2>/dev/null | wc -l) elementi" 
echo "   - JS source: $(ls -la src/js/*.js 2>/dev/null | wc -l) file principali"
    mv "src/js/auth-refactored-with-clock-skew.js" "backup-auth-versions/"
    echo "✅ Spostato auth-refactored-with-clock-skew.js in backup"
fi

echo "🎉 Pulizia completata!"
echo "📁 File di backup spostati in: backup-auth-versions/"
echo "🧪 File di test mantenuti nella root per reference"
