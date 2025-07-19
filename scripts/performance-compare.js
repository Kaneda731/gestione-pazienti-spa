#!/usr/bin/env node

/**
 * Performance Comparison Tool
 * 
 * Confronta le performance del bundle tra diverse build
 * permettendo analisi dettagliate delle variazioni
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurazione
const CONFIG = {
    METRICS_FILE: path.join(__dirname, '../.bundle-metrics.json'),
    BASELINE_FILE: path.join(__dirname, '../.bundle-baseline.json')
};

/**
 * Carica le metriche storiche
 */
function loadHistoricalMetrics() {
    try {
        if (fs.existsSync(CONFIG.METRICS_FILE)) {
            return JSON.parse(fs.readFileSync(CONFIG.METRICS_FILE, 'utf8'));
        }
        return { history: [] };
    } catch (error) {
        console.error('Errore nel caricamento delle metriche storiche:', error.message);
        return { history: [] };
    }
}

/**
 * Carica la baseline corrente
 */
function loadBaseline() {
    try {
        if (fs.existsSync(CONFIG.BASELINE_FILE)) {
            return JSON.parse(fs.readFileSync(CONFIG.BASELINE_FILE, 'utf8'));
        }
        return null;
    } catch (error) {
        return null;
    }
}

/**
 * Trova una build per indice o data
 */
function findBuild(history, identifier) {
    if (typeof identifier === 'number') {
        // Indice dalla fine (0 = ultima, 1 = penultima, etc.)
        const index = history.length - 1 - identifier;
        return index >= 0 && index < history.length ? history[index] : null;
    }
    
    if (typeof identifier === 'string') {
        // Cerca per data (formato YYYY-MM-DD)
        return history.find(build => {
            const buildDate = new Date(build.timestamp).toISOString().split('T')[0];
            return buildDate === identifier;
        });
    }
    
    return null;
}

/**
 * Confronta due build
 */
function compareBuilds(buildA, buildB, labelA = 'Build A', labelB = 'Build B') {
    const comparison = {
        builds: {
            [labelA]: {
                timestamp: buildA.timestamp,
                totalSize: buildA.totalSize,
                totalGzipSize: buildA.totalGzipSize,
                totalBrotliSize: buildA.totalBrotliSize
            },
            [labelB]: {
                timestamp: buildB.timestamp,
                totalSize: buildB.totalSize,
                totalGzipSize: buildB.totalGzipSize,
                totalBrotliSize: buildB.totalBrotliSize
            }
        },
        changes: {
            totalSize: calculateChange(buildA.totalSize, buildB.totalSize),
            totalGzipSize: calculateChange(buildA.totalGzipSize, buildB.totalGzipSize),
            totalBrotliSize: calculateChange(buildA.totalBrotliSize, buildB.totalBrotliSize)
        },
        chunkChanges: {},
        newChunks: [],
        removedChunks: [],
        significantChanges: []
    };

    // Trova chunk nuovi e rimossi
    const chunksA = new Set(Object.keys(buildA.chunks));
    const chunksB = new Set(Object.keys(buildB.chunks));
    
    comparison.newChunks = [...chunksB].filter(chunk => !chunksA.has(chunk));
    comparison.removedChunks = [...chunksA].filter(chunk => !chunksB.has(chunk));

    // Confronta chunk comuni
    const commonChunks = [...chunksA].filter(chunk => chunksB.has(chunk));
    
    commonChunks.forEach(chunkName => {
        const chunkA = buildA.chunks[chunkName];
        const chunkB = buildB.chunks[chunkName];
        
        const chunkComparison = {
            size: calculateChange(chunkA.size, chunkB.size),
            gzipSize: calculateChange(chunkA.gzipSize, chunkB.gzipSize),
            brotliSize: calculateChange(chunkA.brotliSize, chunkB.brotliSize)
        };
        
        comparison.chunkChanges[chunkName] = chunkComparison;
        
        // Identifica cambiamenti significativi (>10%)
        if (Math.abs(chunkComparison.gzipSize.percentage) > 10) {
            comparison.significantChanges.push({
                chunk: chunkName,
                change: chunkComparison.gzipSize.percentage,
                oldSize: chunkA.gzipSize,
                newSize: chunkB.gzipSize
            });
        }
    });

    // Ordina i cambiamenti significativi per impatto
    comparison.significantChanges.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

    return comparison;
}

/**
 * Calcola il cambiamento tra due valori
 */
function calculateChange(oldValue, newValue) {
    const absolute = newValue - oldValue;
    const percentage = oldValue !== 0 ? (absolute / oldValue) * 100 : (newValue > 0 ? 100 : 0);
    
    return {
        absolute,
        percentage,
        oldValue,
        newValue
    };
}

/**
 * Formatta i byte in formato leggibile
 */
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Formatta un cambiamento per la visualizzazione
 */
function formatChange(change) {
    const sign = change.absolute >= 0 ? '+' : '';
    const emoji = change.absolute > 0 ? '📈' : change.absolute < 0 ? '📉' : '➡️';
    
    return `${emoji} ${sign}${formatBytes(change.absolute)} (${sign}${change.percentage.toFixed(1)}%)`;
}

/**
 * Genera il report di confronto
 */
function generateComparisonReport(comparison, labelA, labelB) {
    console.log(`\n🔍 CONFRONTO PERFORMANCE: ${labelA} vs ${labelB}`);
    console.log('=' .repeat(70));

    // Informazioni sulle build
    console.log('\n📅 INFORMAZIONI BUILD:');
    Object.entries(comparison.builds).forEach(([label, build]) => {
        const date = new Date(build.timestamp).toLocaleString();
        console.log(`   ${label}: ${date}`);
        console.log(`     Bundle: ${formatBytes(build.totalGzipSize)} (gzip)`);
    });

    // Cambiamenti totali
    console.log('\n📊 CAMBIAMENTI TOTALI:');
    console.log(`   Raw: ${formatChange(comparison.changes.totalSize)}`);
    console.log(`   Gzip: ${formatChange(comparison.changes.totalGzipSize)}`);
    console.log(`   Brotli: ${formatChange(comparison.changes.totalBrotliSize)}`);

    // Chunk nuovi e rimossi
    if (comparison.newChunks.length > 0) {
        console.log('\n✨ NUOVI CHUNK:');
        comparison.newChunks.forEach(chunk => {
            console.log(`   + ${chunk}`);
        });
    }

    if (comparison.removedChunks.length > 0) {
        console.log('\n🗑️  CHUNK RIMOSSI:');
        comparison.removedChunks.forEach(chunk => {
            console.log(`   - ${chunk}`);
        });
    }

    // Cambiamenti significativi
    if (comparison.significantChanges.length > 0) {
        console.log('\n🚨 CAMBIAMENTI SIGNIFICATIVI (>10%):');
        comparison.significantChanges.slice(0, 10).forEach((change, index) => {
            const sign = change.change >= 0 ? '+' : '';
            const emoji = change.change > 0 ? '📈' : '📉';
            console.log(`   ${index + 1}. ${emoji} ${change.chunk}: ${sign}${change.change.toFixed(1)}%`);
            console.log(`      ${formatBytes(change.oldSize)} → ${formatBytes(change.newSize)}`);
        });
    }

    // Top 10 cambiamenti per dimensione assoluta
    console.log('\n📦 TOP CAMBIAMENTI PER IMPATTO:');
    const sortedChanges = Object.entries(comparison.chunkChanges)
        .sort(([,a], [,b]) => Math.abs(b.gzipSize.absolute) - Math.abs(a.gzipSize.absolute))
        .slice(0, 10);

    sortedChanges.forEach(([chunkName, change], index) => {
        if (Math.abs(change.gzipSize.absolute) > 100) { // Solo se > 100 bytes
            console.log(`   ${index + 1}. ${chunkName}: ${formatChange(change.gzipSize)}`);
        }
    });

    console.log('\n' + '='.repeat(70));
}

/**
 * Mostra la lista delle build disponibili
 */
function showAvailableBuilds(history) {
    console.log('\n📋 BUILD DISPONIBILI:');
    console.log('=' .repeat(50));
    
    if (history.length === 0) {
        console.log('❌ Nessuna build trovata');
        return;
    }

    history.slice(-20).forEach((build, index) => {
        const actualIndex = history.length - 20 + index;
        const date = new Date(build.timestamp).toLocaleString();
        const size = formatBytes(build.totalGzipSize);
        const isLatest = actualIndex === history.length - 1 ? ' (LATEST)' : '';
        
        console.log(`   ${actualIndex}: ${date} - ${size}${isLatest}`);
    });
    
    console.log('\nUso:');
    console.log('  npm run performance:compare [buildA] [buildB]');
    console.log('  npm run performance:compare 0 1    # Confronta ultima con penultima');
    console.log('  npm run performance:compare 0 baseline  # Confronta ultima con baseline');
    console.log('  npm run performance:compare 2025-01-15 0  # Confronta data specifica con ultima');
}

/**
 * Funzione principale
 */
function main() {
    const args = process.argv.slice(2);
    const historicalData = loadHistoricalMetrics();
    const baseline = loadBaseline();

    if (historicalData.history.length === 0) {
        console.log('❌ Nessun dato storico trovato. Esegui prima "npm run monitor" per raccogliere dati.');
        process.exit(1);
    }

    // Se non ci sono argomenti, mostra le build disponibili
    if (args.length === 0) {
        showAvailableBuilds(historicalData.history);
        return;
    }

    // Parse degli argomenti
    let buildA, buildB, labelA, labelB;

    if (args.length === 1) {
        // Confronta con l'ultima build
        buildB = historicalData.history[historicalData.history.length - 1];
        labelB = 'Ultima Build';
        
        if (args[0] === 'baseline') {
            if (!baseline) {
                console.log('❌ Nessuna baseline trovata. Crea una baseline con "npm run baseline:create"');
                process.exit(1);
            }
            buildA = { ...baseline.metrics, timestamp: baseline.createdAt };
            labelA = 'Baseline';
        } else {
            const identifier = isNaN(args[0]) ? args[0] : parseInt(args[0]);
            buildA = findBuild(historicalData.history, identifier);
            labelA = `Build ${args[0]}`;
        }
    } else if (args.length >= 2) {
        // Confronta due build specifiche
        const identifierA = args[0] === 'baseline' ? 'baseline' : (isNaN(args[0]) ? args[0] : parseInt(args[0]));
        const identifierB = args[1] === 'baseline' ? 'baseline' : (isNaN(args[1]) ? args[1] : parseInt(args[1]));
        
        if (identifierA === 'baseline') {
            if (!baseline) {
                console.log('❌ Nessuna baseline trovata. Crea una baseline con "npm run baseline:create"');
                process.exit(1);
            }
            buildA = { ...baseline.metrics, timestamp: baseline.createdAt };
            labelA = 'Baseline';
        } else {
            buildA = findBuild(historicalData.history, identifierA);
            labelA = `Build ${args[0]}`;
        }
        
        if (identifierB === 'baseline') {
            if (!baseline) {
                console.log('❌ Nessuna baseline trovata. Crea una baseline con "npm run baseline:create"');
                process.exit(1);
            }
            buildB = { ...baseline.metrics, timestamp: baseline.createdAt };
            labelB = 'Baseline';
        } else {
            buildB = findBuild(historicalData.history, identifierB);
            labelB = `Build ${args[1]}`;
        }
    }

    if (!buildA || !buildB) {
        console.log('❌ Una o entrambe le build specificate non sono state trovate.');
        showAvailableBuilds(historicalData.history);
        process.exit(1);
    }

    const comparison = compareBuilds(buildA, buildB, labelA, labelB);
    generateComparisonReport(comparison, labelA, labelB);

    // Exit code basato sui cambiamenti significativi
    if (comparison.significantChanges.length > 0) {
        const increasingChanges = comparison.significantChanges.filter(c => c.change > 0);
        if (increasingChanges.length > 0) {
            console.log('\n⚠️  Rilevati aumenti significativi nelle dimensioni!');
            process.exit(1);
        }
    }

    console.log('\n✅ Confronto completato');
    process.exit(0);
}

// Esegui solo se chiamato direttamente
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { compareBuilds, findBuild, calculateChange };