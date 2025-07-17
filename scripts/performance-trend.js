#!/usr/bin/env node

/**
 * Performance Trend Analyzer
 * 
 * Analizza le tendenze delle performance del bundle nel tempo
 * e fornisce insights sui cambiamenti delle dimensioni
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurazione
const CONFIG = {
    METRICS_FILE: path.join(__dirname, '../.bundle-metrics.json'),
    BASELINE_FILE: path.join(__dirname, '../.bundle-baseline.json'),
    // Numero di build da analizzare per i trend
    TREND_WINDOW: 10,
    // Soglie per classificare i trend
    TREND_THRESHOLDS: {
        STABLE: 2,      // ±2% considerato stabile
        MODERATE: 10,   // ±10% considerato moderato
        SIGNIFICANT: 25 // ±25% considerato significativo
    }
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
        console.warn('Nessuna baseline trovata');
        return null;
    }
}

/**
 * Calcola il trend per una serie di valori
 */
function calculateTrend(values) {
    if (values.length < 2) return { trend: 'insufficient_data', slope: 0, correlation: 0 };

    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = values;

    // Calcola la regressione lineare
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    
    // Calcola il coefficiente di correlazione
    const meanX = sumX / n;
    const meanY = sumY / n;
    
    const numerator = x.reduce((sum, xi, i) => sum + (xi - meanX) * (y[i] - meanY), 0);
    const denomX = Math.sqrt(x.reduce((sum, xi) => sum + Math.pow(xi - meanX, 2), 0));
    const denomY = Math.sqrt(y.reduce((sum, yi) => sum + Math.pow(yi - meanY, 2), 0));
    
    const correlation = denomX * denomY !== 0 ? numerator / (denomX * denomY) : 0;

    // Classifica il trend
    const percentageChange = ((values[values.length - 1] - values[0]) / values[0]) * 100;
    let trendType;
    
    if (Math.abs(percentageChange) <= CONFIG.TREND_THRESHOLDS.STABLE) {
        trendType = 'stable';
    } else if (Math.abs(percentageChange) <= CONFIG.TREND_THRESHOLDS.MODERATE) {
        trendType = percentageChange > 0 ? 'increasing_moderate' : 'decreasing_moderate';
    } else {
        trendType = percentageChange > 0 ? 'increasing_significant' : 'decreasing_significant';
    }

    return {
        trend: trendType,
        slope: slope,
        correlation: Math.abs(correlation),
        percentageChange: percentageChange,
        confidence: Math.abs(correlation) > 0.7 ? 'high' : Math.abs(correlation) > 0.4 ? 'medium' : 'low'
    };
}

/**
 * Analizza i trend per tutte le metriche
 */
function analyzeTrends(history) {
    const recentHistory = history.slice(-CONFIG.TREND_WINDOW);
    
    if (recentHistory.length < 3) {
        return {
            error: 'Dati insufficienti per l\'analisi dei trend',
            requiredBuilds: 3,
            availableBuilds: recentHistory.length
        };
    }

    const analysis = {
        period: {
            from: new Date(recentHistory[0].timestamp).toLocaleDateString(),
            to: new Date(recentHistory[recentHistory.length - 1].timestamp).toLocaleDateString(),
            builds: recentHistory.length
        },
        totalBundle: {},
        chunks: {},
        summary: {
            stable: 0,
            increasing: 0,
            decreasing: 0,
            concerning: []
        }
    };

    // Analizza il bundle totale
    const totalSizes = recentHistory.map(build => build.totalGzipSize);
    analysis.totalBundle = calculateTrend(totalSizes);

    // Analizza i singoli chunk
    const allChunks = new Set();
    recentHistory.forEach(build => {
        Object.keys(build.chunks).forEach(chunk => allChunks.add(chunk));
    });

    allChunks.forEach(chunkName => {
        const chunkSizes = recentHistory
            .filter(build => build.chunks[chunkName])
            .map(build => build.chunks[chunkName].gzipSize);

        if (chunkSizes.length >= 3) {
            analysis.chunks[chunkName] = calculateTrend(chunkSizes);
            
            // Classifica per il summary
            const trend = analysis.chunks[chunkName].trend;
            if (trend === 'stable') {
                analysis.summary.stable++;
            } else if (trend.includes('increasing')) {
                analysis.summary.increasing++;
                if (trend === 'increasing_significant') {
                    analysis.summary.concerning.push({
                        chunk: chunkName,
                        change: analysis.chunks[chunkName].percentageChange,
                        confidence: analysis.chunks[chunkName].confidence
                    });
                }
            } else if (trend.includes('decreasing')) {
                analysis.summary.decreasing++;
            }
        }
    });

    return analysis;
}

/**
 * Confronta con la baseline se disponibile
 */
function compareWithBaseline(currentMetrics, baseline) {
    if (!baseline || !currentMetrics) return null;

    const comparison = {
        totalSizeChange: ((currentMetrics.totalGzipSize - baseline.metrics.totalGzipSize) / baseline.metrics.totalGzipSize) * 100,
        chunkChanges: {},
        baselineAge: Math.floor((new Date() - new Date(baseline.createdAt)) / (1000 * 60 * 60 * 24)) // giorni
    };

    // Confronta chunk principali
    Object.keys(currentMetrics.chunks).forEach(chunkName => {
        if (baseline.metrics.chunks[chunkName]) {
            const change = ((currentMetrics.chunks[chunkName].gzipSize - baseline.metrics.chunks[chunkName].gzipSize) / baseline.metrics.chunks[chunkName].gzipSize) * 100;
            comparison.chunkChanges[chunkName] = change;
        }
    });

    return comparison;
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
 * Formatta il trend per la visualizzazione
 */
function formatTrend(trendData) {
    const icons = {
        stable: '📊',
        increasing_moderate: '📈',
        increasing_significant: '🚨',
        decreasing_moderate: '📉',
        decreasing_significant: '✅'
    };

    const descriptions = {
        stable: 'Stabile',
        increasing_moderate: 'In aumento (moderato)',
        increasing_significant: 'In aumento (significativo)',
        decreasing_moderate: 'In diminuzione (moderato)',
        decreasing_significant: 'In diminuzione (significativo)'
    };

    const icon = icons[trendData.trend] || '❓';
    const description = descriptions[trendData.trend] || 'Sconosciuto';
    const change = trendData.percentageChange > 0 ? '+' : '';
    const confidence = trendData.confidence === 'high' ? '🔴' : trendData.confidence === 'medium' ? '🟡' : '🟢';

    return `${icon} ${description} (${change}${trendData.percentageChange.toFixed(1)}%) ${confidence}`;
}

/**
 * Genera il report dei trend
 */
function generateTrendReport(analysis, baselineComparison, currentMetrics) {
    console.log('\n📈 ANALISI TREND PERFORMANCE');
    console.log('=' .repeat(60));

    if (analysis.error) {
        console.log(`❌ ${analysis.error}`);
        console.log(`   Build richieste: ${analysis.requiredBuilds}, disponibili: ${analysis.availableBuilds}`);
        return;
    }

    console.log(`\n📅 Periodo analizzato: ${analysis.period.from} → ${analysis.period.to}`);
    console.log(`📊 Build analizzate: ${analysis.period.builds}`);

    // Trend bundle totale
    console.log('\n🎯 BUNDLE TOTALE:');
    console.log(`   ${formatTrend(analysis.totalBundle)}`);
    if (currentMetrics) {
        console.log(`   Dimensione attuale: ${formatBytes(currentMetrics.totalGzipSize)} (gzip)`);
    }

    // Summary dei chunk
    console.log('\n📦 SUMMARY CHUNK:');
    console.log(`   📊 Stabili: ${analysis.summary.stable}`);
    console.log(`   📈 In aumento: ${analysis.summary.increasing}`);
    console.log(`   📉 In diminuzione: ${analysis.summary.decreasing}`);

    // Chunk preoccupanti
    if (analysis.summary.concerning.length > 0) {
        console.log('\n🚨 CHUNK PREOCCUPANTI:');
        analysis.summary.concerning.forEach(concern => {
            console.log(`   • ${concern.chunk}: +${concern.change.toFixed(1)}% (confidenza: ${concern.confidence})`);
        });
    }

    // Top 5 chunk per trend
    console.log('\n📊 TOP CHUNK PER TREND:');
    const sortedChunks = Object.entries(analysis.chunks)
        .sort(([,a], [,b]) => Math.abs(b.percentageChange) - Math.abs(a.percentageChange))
        .slice(0, 5);

    sortedChunks.forEach(([chunkName, trendData], index) => {
        console.log(`   ${index + 1}. ${chunkName}: ${formatTrend(trendData)}`);
    });

    // Confronto con baseline
    if (baselineComparison) {
        console.log('\n📏 CONFRONTO CON BASELINE:');
        console.log(`   Età baseline: ${baselineComparison.baselineAge} giorni`);
        console.log(`   Variazione totale: ${baselineComparison.totalSizeChange > 0 ? '+' : ''}${baselineComparison.totalSizeChange.toFixed(1)}%`);
        
        const significantBaselineChanges = Object.entries(baselineComparison.chunkChanges)
            .filter(([_, change]) => Math.abs(change) > 10)
            .sort(([,a], [,b]) => Math.abs(b) - Math.abs(a))
            .slice(0, 3);

        if (significantBaselineChanges.length > 0) {
            console.log('   Variazioni significative:');
            significantBaselineChanges.forEach(([chunk, change]) => {
                const sign = change > 0 ? '+' : '';
                console.log(`     • ${chunk}: ${sign}${change.toFixed(1)}%`);
            });
        }
    }

    console.log('\n' + '='.repeat(60));
}

/**
 * Funzione principale
 */
function main() {
    console.log('📈 Avvio analisi trend performance...\n');

    const historicalData = loadHistoricalMetrics();
    const baseline = loadBaseline();
    
    if (historicalData.history.length === 0) {
        console.log('❌ Nessun dato storico trovato. Esegui prima "npm run monitor" per raccogliere dati.');
        process.exit(1);
    }

    const analysis = analyzeTrends(historicalData.history);
    const currentMetrics = historicalData.history[historicalData.history.length - 1];
    const baselineComparison = compareWithBaseline(currentMetrics, baseline);

    generateTrendReport(analysis, baselineComparison, currentMetrics);

    // Exit code basato sui trend preoccupanti
    if (analysis.summary && analysis.summary.concerning.length > 0) {
        console.log('\n⚠️  Rilevati trend preoccupanti nelle dimensioni del bundle!');
        process.exit(1);
    } else {
        console.log('\n✅ Trend delle performance OK');
        process.exit(0);
    }
}

// Esegui solo se chiamato direttamente
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { analyzeTrends, calculateTrend, compareWithBaseline };