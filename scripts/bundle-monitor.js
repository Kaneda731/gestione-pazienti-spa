#!/usr/bin/env node

/**
 * Bundle Performance Monitor
 * 
 * Questo script monitora le dimensioni del bundle nel tempo e fornisce
 * alert per aumenti significativi delle dimensioni.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurazione
const CONFIG = {
    // Soglia di alert per aumento dimensioni (percentuale)
    ALERT_THRESHOLD: 10, // 10% di aumento
    // Soglia critica per alert (percentuale)
    CRITICAL_THRESHOLD: 25, // 25% di aumento
    // File per memorizzare le metriche storiche
    METRICS_FILE: path.join(__dirname, '../.bundle-metrics.json'),
    // File di analisi bundle
    BUNDLE_ANALYSIS_FILE: path.join(__dirname, '../dist/bundle-analysis.json'),
    // File per baseline delle performance
    BASELINE_FILE: path.join(__dirname, '../.bundle-baseline.json'),
    // Numero massimo di record storici da mantenere
    MAX_HISTORY_RECORDS: 100,
    // Numero di build per calcolare la media mobile
    MOVING_AVERAGE_WINDOW: 5
};

/**
 * Estrae le metriche dal file di analisi bundle
 */
function extractBundleMetrics() {
    try {
        if (!fs.existsSync(CONFIG.BUNDLE_ANALYSIS_FILE)) {
            throw new Error('File di analisi bundle non trovato. Esegui prima "npm run analyze"');
        }

        const analysisData = JSON.parse(fs.readFileSync(CONFIG.BUNDLE_ANALYSIS_FILE, 'utf8'));
        
        const metrics = {
            timestamp: new Date().toISOString(),
            totalSize: 0,
            totalGzipSize: 0,
            totalBrotliSize: 0,
            chunks: {},
            largestChunks: []
        };

        // Calcola le dimensioni totali dai nodeParts
        if (analysisData.nodeParts) {
            Object.values(analysisData.nodeParts).forEach(node => {
                if (node.renderedLength) {
                    metrics.totalSize += node.renderedLength;
                }
                if (node.gzipLength) {
                    metrics.totalGzipSize += node.gzipLength;
                }
                if (node.brotliLength) {
                    metrics.totalBrotliSize += node.brotliLength;
                }
            });
        }

        // Identifica i chunk principali dalle informazioni del tree
        if (analysisData.tree && analysisData.tree.children) {
            analysisData.tree.children.forEach(chunk => {
                if (chunk.name && chunk.name.includes('.js')) {
                    const chunkName = chunk.name.replace(/^assets\//, '').replace(/-[a-zA-Z0-9]+\.js$/, '');
                    
                    // Calcola le dimensioni del chunk sommando i suoi nodi
                    let chunkSize = 0;
                    let chunkGzipSize = 0;
                    let chunkBrotliSize = 0;
                    
                    function calculateChunkSizes(node) {
                        if (node.uid && analysisData.nodeParts[node.uid]) {
                            const nodePart = analysisData.nodeParts[node.uid];
                            chunkSize += nodePart.renderedLength || 0;
                            chunkGzipSize += nodePart.gzipLength || 0;
                            chunkBrotliSize += nodePart.brotliLength || 0;
                        }
                        if (node.children) {
                            node.children.forEach(calculateChunkSizes);
                        }
                    }
                    
                    calculateChunkSizes(chunk);
                    
                    metrics.chunks[chunkName] = {
                        size: chunkSize,
                        gzipSize: chunkGzipSize,
                        brotliSize: chunkBrotliSize
                    };
                    
                    metrics.largestChunks.push({
                        name: chunkName,
                        size: chunkSize,
                        gzipSize: chunkGzipSize
                    });
                }
            });
        }

        // Ordina i chunk per dimensione (gzip)
        metrics.largestChunks.sort((a, b) => b.gzipSize - a.gzipSize);
        metrics.largestChunks = metrics.largestChunks.slice(0, 10); // Top 10

        return metrics;
    } catch (error) {
        console.error('Errore nell\'estrazione delle metriche:', error.message);
        process.exit(1);
    }
}

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
        console.warn('Errore nel caricamento delle metriche storiche:', error.message);
        return { history: [] };
    }
}

/**
 * Salva le metriche storiche
 */
function saveHistoricalMetrics(data) {
    try {
        // Mantieni solo gli ultimi N record
        if (data.history.length > CONFIG.MAX_HISTORY_RECORDS) {
            data.history = data.history.slice(-CONFIG.MAX_HISTORY_RECORDS);
        }
        
        fs.writeFileSync(CONFIG.METRICS_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Errore nel salvataggio delle metriche:', error.message);
    }
}

/**
 * Confronta le metriche attuali con quelle precedenti
 */
function compareMetrics(current, previous) {
    if (!previous) return null;

    const comparison = {
        totalSizeChange: calculatePercentageChange(previous.totalGzipSize, current.totalGzipSize),
        chunkChanges: {},
        alerts: []
    };

    // Confronta i chunk principali
    Object.keys(current.chunks).forEach(chunkName => {
        if (previous.chunks[chunkName]) {
            const change = calculatePercentageChange(
                previous.chunks[chunkName].gzipSize,
                current.chunks[chunkName].gzipSize
            );
            comparison.chunkChanges[chunkName] = change;

            // Genera alert se l'aumento supera la soglia
            if (change > CONFIG.ALERT_THRESHOLD) {
                comparison.alerts.push({
                    type: 'chunk_size_increase',
                    chunk: chunkName,
                    change: change,
                    previousSize: formatBytes(previous.chunks[chunkName].gzipSize),
                    currentSize: formatBytes(current.chunks[chunkName].gzipSize)
                });
            }
        }
    });

    // Alert per aumento totale del bundle
    if (comparison.totalSizeChange > CONFIG.ALERT_THRESHOLD) {
        comparison.alerts.push({
            type: 'total_size_increase',
            change: comparison.totalSizeChange,
            previousSize: formatBytes(previous.totalGzipSize),
            currentSize: formatBytes(current.totalGzipSize)
        });
    }

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
 * Genera il report delle performance
 */
function generateReport(metrics, comparison, historicalData) {
    console.log('\n🔍 BUNDLE PERFORMANCE REPORT');
    console.log('=' .repeat(50));
    
    console.log(`\n📊 Dimensioni Attuali (${new Date(metrics.timestamp).toLocaleString()}):`);
    console.log(`   Bundle Totale: ${formatBytes(metrics.totalSize)} (raw) | ${formatBytes(metrics.totalGzipSize)} (gzip)`);
    
    console.log('\n📦 Top Chunk per Dimensione (gzip):');
    metrics.largestChunks.slice(0, 5).forEach((chunk, index) => {
        console.log(`   ${index + 1}. ${chunk.name}: ${formatBytes(chunk.gzipSize)}`);
    });

    if (comparison) {
        console.log('\n📈 Variazioni rispetto alla build precedente:');
        console.log(`   Bundle Totale: ${comparison.totalSizeChange > 0 ? '+' : ''}${comparison.totalSizeChange.toFixed(1)}%`);
        
        const significantChanges = Object.entries(comparison.chunkChanges)
            .filter(([_, change]) => Math.abs(change) > 5)
            .sort(([_, a], [__, b]) => Math.abs(b) - Math.abs(a));
            
        if (significantChanges.length > 0) {
            console.log('\n   Variazioni Significative nei Chunk:');
            significantChanges.slice(0, 5).forEach(([chunk, change]) => {
                const sign = change > 0 ? '+' : '';
                const emoji = change > 0 ? '📈' : '📉';
                console.log(`   ${emoji} ${chunk}: ${sign}${change.toFixed(1)}%`);
            });
        }
    }

    // Alert
    if (comparison && comparison.alerts.length > 0) {
        console.log('\n⚠️  ALERT:');
        comparison.alerts.forEach(alert => {
            if (alert.type === 'total_size_increase') {
                console.log(`   🚨 Bundle totale aumentato del ${alert.change.toFixed(1)}% (${alert.previousSize} → ${alert.currentSize})`);
            } else if (alert.type === 'chunk_size_increase') {
                console.log(`   🚨 Chunk "${alert.chunk}" aumentato del ${alert.change.toFixed(1)}% (${alert.previousSize} → ${alert.currentSize})`);
            }
        });
    }

    // Trend storico
    if (historicalData.history.length > 1) {
        const last5 = historicalData.history.slice(-5);
        console.log('\n📊 Trend Ultimi 5 Build:');
        last5.forEach((record, index) => {
            const date = new Date(record.timestamp).toLocaleDateString();
            const size = formatBytes(record.totalGzipSize);
            console.log(`   ${index + 1}. ${date}: ${size}`);
        });
    }

    console.log('\n' + '='.repeat(50));
}

/**
 * Funzione principale
 */
function main() {
    console.log('🔍 Avvio monitoraggio performance bundle...\n');

    // Estrai metriche attuali
    const currentMetrics = extractBundleMetrics();
    
    // Carica dati storici
    const historicalData = loadHistoricalMetrics();
    
    // Confronta con la build precedente
    const previousMetrics = historicalData.history.length > 0 
        ? historicalData.history[historicalData.history.length - 1] 
        : null;
    const comparison = compareMetrics(currentMetrics, previousMetrics);
    
    // Aggiungi le metriche attuali alla cronologia
    historicalData.history.push(currentMetrics);
    
    // Salva i dati aggiornati
    saveHistoricalMetrics(historicalData);
    
    // Genera il report
    generateReport(currentMetrics, comparison, historicalData);
    
    // Exit code basato sugli alert
    if (comparison && comparison.alerts.length > 0) {
        console.log('\n⚠️  Rilevati aumenti significativi nelle dimensioni del bundle!');
        process.exit(1);
    } else {
        console.log('\n✅ Bundle performance OK');
        process.exit(0);
    }
}

// Esegui solo se chiamato direttamente
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { extractBundleMetrics, compareMetrics, formatBytes };