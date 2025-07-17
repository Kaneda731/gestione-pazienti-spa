#!/usr/bin/env node

/**
 * Bundle Baseline Manager
 * 
 * Gestisce le metriche di baseline per il monitoraggio continuo delle performance
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurazione
const CONFIG = {
    BASELINE_FILE: path.join(__dirname, '../.bundle-baseline.json'),
    METRICS_FILE: path.join(__dirname, '../.bundle-metrics.json'),
    // Soglie per definire una baseline "stabile"
    STABILITY_THRESHOLD: 5, // 5% di variazione massima
    MIN_BUILDS_FOR_BASELINE: 5, // Minimo 5 build per calcolare baseline
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
        console.warn('Errore nel caricamento della baseline:', error.message);
        return null;
    }
}

/**
 * Salva la baseline
 */
function saveBaseline(baseline) {
    try {
        fs.writeFileSync(CONFIG.BASELINE_FILE, JSON.stringify(baseline, null, 2));
        console.log('✅ Baseline salvata con successo');
    } catch (error) {
        console.error('Errore nel salvataggio della baseline:', error.message);
    }
}

/**
 * Calcola la media mobile delle ultime N build
 */
function calculateMovingAverage(history, windowSize = 5) {
    if (history.length < windowSize) {
        return null;
    }

    const recentBuilds = history.slice(-windowSize);
    
    const average = {
        totalSize: 0,
        totalGzipSize: 0,
        totalBrotliSize: 0,
        chunks: {}
    };

    // Calcola medie per dimensioni totali
    recentBuilds.forEach(build => {
        average.totalSize += build.totalSize;
        average.totalGzipSize += build.totalGzipSize;
        average.totalBrotliSize += build.totalBrotliSize;
    });

    average.totalSize = Math.round(average.totalSize / windowSize);
    average.totalGzipSize = Math.round(average.totalGzipSize / windowSize);
    average.totalBrotliSize = Math.round(average.totalBrotliSize / windowSize);

    // Calcola medie per chunk (solo quelli presenti in tutte le build)
    const allChunks = new Set();
    recentBuilds.forEach(build => {
        Object.keys(build.chunks).forEach(chunk => allChunks.add(chunk));
    });

    allChunks.forEach(chunkName => {
        const chunkSizes = recentBuilds
            .filter(build => build.chunks[chunkName])
            .map(build => build.chunks[chunkName]);

        if (chunkSizes.length === windowSize) {
            average.chunks[chunkName] = {
                size: Math.round(chunkSizes.reduce((sum, chunk) => sum + chunk.size, 0) / windowSize),
                gzipSize: Math.round(chunkSizes.reduce((sum, chunk) => sum + chunk.gzipSize, 0) / windowSize),
                brotliSize: Math.round(chunkSizes.reduce((sum, chunk) => sum + chunk.brotliSize, 0) / windowSize)
            };
        }
    });

    return average;
}

/**
 * Verifica se le build recenti sono stabili
 */
function isStable(history, windowSize = 5) {
    if (history.length < windowSize) {
        return false;
    }

    const recentBuilds = history.slice(-windowSize);
    const first = recentBuilds[0];
    const last = recentBuilds[recentBuilds.length - 1];

    // Calcola la variazione percentuale
    const totalSizeVariation = Math.abs(
        ((last.totalGzipSize - first.totalGzipSize) / first.totalGzipSize) * 100
    );

    return totalSizeVariation <= CONFIG.STABILITY_THRESHOLD;
}

/**
 * Crea una nuova baseline dalle build recenti
 */
function createBaseline(command = 'auto') {
    const historicalData = loadHistoricalMetrics();
    
    if (historicalData.history.length < CONFIG.MIN_BUILDS_FOR_BASELINE) {
        console.log(`❌ Insufficienti build storiche per creare baseline (${historicalData.history.length}/${CONFIG.MIN_BUILDS_FOR_BASELINE})`);
        return false;
    }

    const movingAverage = calculateMovingAverage(historicalData.history);
    if (!movingAverage) {
        console.log('❌ Impossibile calcolare la media mobile');
        return false;
    }

    const isCurrentlyStable = isStable(historicalData.history);
    
    if (command === 'auto' && !isCurrentlyStable) {
        console.log('⚠️  Le build recenti non sono stabili. Baseline non aggiornata automaticamente.');
        console.log('   Usa "npm run baseline:force" per forzare l\'aggiornamento.');
        return false;
    }

    const baseline = {
        createdAt: new Date().toISOString(),
        version: '1.0.0',
        buildCount: historicalData.history.length,
        isStable: isCurrentlyStable,
        metrics: movingAverage,
        metadata: {
            windowSize: 5,
            stabilityThreshold: CONFIG.STABILITY_THRESHOLD,
            command: command
        }
    };

    saveBaseline(baseline);
    return true;
}

/**
 * Confronta le metriche attuali con la baseline
 */
function compareWithBaseline(currentMetrics) {
    const baseline = loadBaseline();
    if (!baseline) {
        console.log('⚠️  Nessuna baseline trovata. Crea una baseline con "npm run baseline:create"');
        return null;
    }

    const comparison = {
        totalSizeChange: calculatePercentageChange(
            baseline.metrics.totalGzipSize, 
            currentMetrics.totalGzipSize
        ),
        chunkChanges: {},
        alerts: [],
        baselineInfo: {
            createdAt: baseline.createdAt,
            buildCount: baseline.buildCount,
            isStable: baseline.isStable
        }
    };

    // Confronta chunk principali
    Object.keys(currentMetrics.chunks).forEach(chunkName => {
        if (baseline.metrics.chunks[chunkName]) {
            const change = calculatePercentageChange(
                baseline.metrics.chunks[chunkName].gzipSize,
                currentMetrics.chunks[chunkName].gzipSize
            );
            comparison.chunkChanges[chunkName] = change;
        }
    });

    return comparison;
}

/**
 * Calcola la variazione percentuale
 */
function calculatePercentageChange(oldValue, newValue) {
    if (oldValue === 0) return newValue > 0 ? 100 : 0;
    return ((newValue - oldValue) / oldValue) * 100;
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
 * Mostra informazioni sulla baseline corrente
 */
function showBaselineInfo() {
    const baseline = loadBaseline();
    if (!baseline) {
        console.log('❌ Nessuna baseline trovata');
        return;
    }

    console.log('\n📊 INFORMAZIONI BASELINE');
    console.log('=' .repeat(40));
    console.log(`Creata: ${new Date(baseline.createdAt).toLocaleString()}`);
    console.log(`Build analizzate: ${baseline.buildCount}`);
    console.log(`Stabile: ${baseline.isStable ? '✅' : '❌'}`);
    console.log(`Bundle totale: ${formatBytes(baseline.metrics.totalGzipSize)} (gzip)`);
    
    console.log('\n📦 Top 5 Chunk:');
    const sortedChunks = Object.entries(baseline.metrics.chunks)
        .sort(([,a], [,b]) => b.gzipSize - a.gzipSize)
        .slice(0, 5);
    
    sortedChunks.forEach(([name, metrics], index) => {
        console.log(`   ${index + 1}. ${name}: ${formatBytes(metrics.gzipSize)}`);
    });
}

/**
 * Funzione principale
 */
function main() {
    const command = process.argv[2] || 'info';

    switch (command) {
        case 'create':
        case 'auto':
            console.log('🔄 Creazione baseline...');
            if (createBaseline(command)) {
                console.log('✅ Baseline creata con successo');
            }
            break;
            
        case 'force':
            console.log('🔄 Creazione forzata baseline...');
            if (createBaseline('force')) {
                console.log('✅ Baseline forzata creata con successo');
            }
            break;
            
        case 'info':
        default:
            showBaselineInfo();
            break;
    }
}

// Esegui solo se chiamato direttamente
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { createBaseline, compareWithBaseline, loadBaseline, calculateMovingAverage };