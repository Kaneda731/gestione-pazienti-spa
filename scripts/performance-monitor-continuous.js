#!/usr/bin/env node

/**
 * Continuous Performance Monitoring Script
 * 
 * Script per il monitoraggio continuo delle performance del bundle che:
 * - Confronta dimensioni bundle nel tempo
 * - Crea metriche di baseline per monitoraggio continuo
 * - Genera alert per aumenti significativi delle dimensioni
 * 
 * Implementa i requisiti 7.4 e 7.5 del task 7.2
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { extractBundleMetrics, formatBytes } from './bundle-monitor.js';
import { compareWithBaseline, loadBaseline, createBaseline } from './baseline-manager.js';
import { analyzeTrends, calculateTrend } from './performance-trend.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurazione per il monitoraggio continuo
const CONFIG = {
    METRICS_FILE: path.join(__dirname, '../.bundle-metrics.json'),
    CONTINUOUS_REPORT_FILE: path.join(__dirname, '../.performance-continuous-report.json'),
    
    // Soglie di alert per il monitoraggio continuo
    ALERT_THRESHOLDS: {
        MINOR: 3,       // 3% aumento = alert minore
        WARNING: 8,     // 8% aumento = warning
        CRITICAL: 20,   // 20% aumento = critico
        SEVERE: 40      // 40% aumento = severo
    },
    
    // Configurazione per il confronto temporale
    TIME_WINDOWS: {
        IMMEDIATE: 1,   // Confronto con build precedente
        SHORT_TERM: 5,  // Confronto con media ultime 5 build
        MEDIUM_TERM: 10, // Confronto con media ultime 10 build
        LONG_TERM: 20   // Confronto con media ultime 20 build
    },
    
    // Configurazione baseline
    BASELINE_AUTO_UPDATE: {
        ENABLED: true,
        STABILITY_DAYS: 7,      // Giorni di stabilità richiesti
        MAX_VARIATION: 2,       // Variazione massima % per considerare stabile
        MIN_BUILDS: 10          // Minimo build richieste per auto-update
    },
    
    // Configurazione retention
    MAX_HISTORY_ENTRIES: 100,
    RETENTION_DAYS: 60
};

/**
 * Carica le metriche storiche con cleanup automatico
 */
function loadHistoricalMetrics() {
    try {
        if (fs.existsSync(CONFIG.METRICS_FILE)) {
            const data = JSON.parse(fs.readFileSync(CONFIG.METRICS_FILE, 'utf8'));
            
            // Cleanup automatico delle entry vecchie
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - CONFIG.RETENTION_DAYS);
            
            data.history = data.history.filter(entry => 
                new Date(entry.timestamp) > cutoffDate
            );
            
            // Limita il numero massimo di entry
            if (data.history.length > CONFIG.MAX_HISTORY_ENTRIES) {
                data.history = data.history.slice(-CONFIG.MAX_HISTORY_ENTRIES);
            }
            
            return data;
        }
        return { history: [] };
    } catch (error) {
        console.error('Errore nel caricamento delle metriche storiche:', error.message);
        return { history: [] };
    }
}

/**
 * Salva le metriche storiche
 */
function saveHistoricalMetrics(data) {
    try {
        fs.writeFileSync(CONFIG.METRICS_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Errore nel salvataggio delle metriche:', error.message);
    }
}

/**
 * Calcola la media mobile per una finestra temporale
 */
function calculateMovingAverage(history, windowSize) {
    if (history.length < windowSize) return null;
    
    const recentBuilds = history.slice(-windowSize);
    const totalSize = recentBuilds.reduce((sum, build) => sum + build.totalGzipSize, 0);
    
    return {
        averageSize: Math.round(totalSize / windowSize),
        windowSize: windowSize,
        builds: recentBuilds.length
    };
}

/**
 * Confronta le metriche attuali con diverse finestre temporali
 */
function performTemporalComparisons(currentMetrics, history) {
    const comparisons = {
        immediate: null,
        shortTerm: null,
        mediumTerm: null,
        longTerm: null
    };
    
    // Confronto immediato (build precedente)
    if (history.length >= CONFIG.TIME_WINDOWS.IMMEDIATE) {
        const previousBuild = history[history.length - 1];
        comparisons.immediate = {
            change: calculatePercentageChange(previousBuild.totalGzipSize, currentMetrics.totalGzipSize),
            previousSize: previousBuild.totalGzipSize,
            currentSize: currentMetrics.totalGzipSize,
            timeframe: 'build precedente'
        };
    }
    
    // Confronto a breve termine (media ultime 5 build)
    const shortTermAvg = calculateMovingAverage(history, CONFIG.TIME_WINDOWS.SHORT_TERM);
    if (shortTermAvg) {
        comparisons.shortTerm = {
            change: calculatePercentageChange(shortTermAvg.averageSize, currentMetrics.totalGzipSize),
            previousSize: shortTermAvg.averageSize,
            currentSize: currentMetrics.totalGzipSize,
            timeframe: `media ultime ${shortTermAvg.windowSize} build`
        };
    }
    
    // Confronto a medio termine (media ultime 10 build)
    const mediumTermAvg = calculateMovingAverage(history, CONFIG.TIME_WINDOWS.MEDIUM_TERM);
    if (mediumTermAvg) {
        comparisons.mediumTerm = {
            change: calculatePercentageChange(mediumTermAvg.averageSize, currentMetrics.totalGzipSize),
            previousSize: mediumTermAvg.averageSize,
            currentSize: currentMetrics.totalGzipSize,
            timeframe: `media ultime ${mediumTermAvg.windowSize} build`
        };
    }
    
    // Confronto a lungo termine (media ultime 20 build)
    const longTermAvg = calculateMovingAverage(history, CONFIG.TIME_WINDOWS.LONG_TERM);
    if (longTermAvg) {
        comparisons.longTerm = {
            change: calculatePercentageChange(longTermAvg.averageSize, currentMetrics.totalGzipSize),
            previousSize: longTermAvg.averageSize,
            currentSize: currentMetrics.totalGzipSize,
            timeframe: `media ultime ${longTermAvg.windowSize} build`
        };
    }
    
    return comparisons;
}

/**
 * Calcola la variazione percentuale
 */
function calculatePercentageChange(oldValue, newValue) {
    if (oldValue === 0) return newValue > 0 ? 100 : 0;
    return ((newValue - oldValue) / oldValue) * 100;
}

/**
 * Genera alert basati sui confronti temporali
 */
function generateTemporalAlerts(comparisons, baselineComparison) {
    const alerts = {
        severe: [],
        critical: [],
        warning: [],
        minor: [],
        info: [],
        summary: {
            totalAlerts: 0,
            severeCount: 0,
            criticalCount: 0,
            warningCount: 0,
            minorCount: 0,
            status: 'ok'
        }
    };
    
    // Funzione helper per aggiungere alert
    function addAlert(level, type, message, data) {
        const alert = { type, message, ...data };
        alerts[level].push(alert);
    }
    
    // Analizza ogni confronto temporale
    Object.entries(comparisons).forEach(([timeframe, comparison]) => {
        if (!comparison) return;
        
        const change = comparison.change;
        const timeframeLabel = comparison.timeframe;
        
        if (change > CONFIG.ALERT_THRESHOLDS.SEVERE) {
            addAlert('severe', 'severe_size_increase', 
                `Bundle aumentato del ${change.toFixed(1)}% rispetto a ${timeframeLabel}`, 
                { change, timeframe, threshold: CONFIG.ALERT_THRESHOLDS.SEVERE });
        } else if (change > CONFIG.ALERT_THRESHOLDS.CRITICAL) {
            addAlert('critical', 'critical_size_increase', 
                `Bundle aumentato del ${change.toFixed(1)}% rispetto a ${timeframeLabel}`, 
                { change, timeframe, threshold: CONFIG.ALERT_THRESHOLDS.CRITICAL });
        } else if (change > CONFIG.ALERT_THRESHOLDS.WARNING) {
            addAlert('warning', 'warning_size_increase', 
                `Bundle aumentato del ${change.toFixed(1)}% rispetto a ${timeframeLabel}`, 
                { change, timeframe, threshold: CONFIG.ALERT_THRESHOLDS.WARNING });
        } else if (change > CONFIG.ALERT_THRESHOLDS.MINOR) {
            addAlert('minor', 'minor_size_increase', 
                `Bundle aumentato del ${change.toFixed(1)}% rispetto a ${timeframeLabel}`, 
                { change, timeframe, threshold: CONFIG.ALERT_THRESHOLDS.MINOR });
        }
    });
    
    // Alert per deviazione dalla baseline
    if (baselineComparison && baselineComparison.totalSizeChange > CONFIG.ALERT_THRESHOLDS.WARNING) {
        const baselineAge = Math.floor((new Date() - new Date(baselineComparison.baselineInfo.createdAt)) / (1000 * 60 * 60 * 24));
        
        addAlert('warning', 'baseline_deviation', 
            `Bundle ${baselineComparison.totalSizeChange.toFixed(1)}% più grande della baseline (${baselineAge} giorni fa)`, 
            { change: baselineComparison.totalSizeChange, baselineAge });
    }
    
    // Calcola summary
    alerts.summary.severeCount = alerts.severe.length;
    alerts.summary.criticalCount = alerts.critical.length;
    alerts.summary.warningCount = alerts.warning.length;
    alerts.summary.minorCount = alerts.minor.length;
    alerts.summary.totalAlerts = alerts.summary.severeCount + alerts.summary.criticalCount + 
                                alerts.summary.warningCount + alerts.summary.minorCount;
    
    // Determina status generale
    if (alerts.summary.severeCount > 0) {
        alerts.summary.status = 'severe';
    } else if (alerts.summary.criticalCount > 0) {
        alerts.summary.status = 'critical';
    } else if (alerts.summary.warningCount > 0) {
        alerts.summary.status = 'warning';
    } else if (alerts.summary.minorCount > 0) {
        alerts.summary.status = 'minor';
    } else {
        alerts.summary.status = 'ok';
    }
    
    return alerts;
}

/**
 * Verifica se è necessario aggiornare la baseline automaticamente
 */
function shouldAutoUpdateBaseline(history) {
    if (!CONFIG.BASELINE_AUTO_UPDATE.ENABLED) return false;
    if (history.length < CONFIG.BASELINE_AUTO_UPDATE.MIN_BUILDS) return false;
    
    const baseline = loadBaseline();
    if (!baseline) return true; // Crea baseline se non esiste
    
    // Verifica età della baseline
    const baselineAge = Math.floor((new Date() - new Date(baseline.createdAt)) / (1000 * 60 * 60 * 24));
    if (baselineAge < CONFIG.BASELINE_AUTO_UPDATE.STABILITY_DAYS) return false;
    
    // Verifica stabilità delle build recenti
    const recentBuilds = history.slice(-CONFIG.BASELINE_AUTO_UPDATE.MIN_BUILDS);
    const sizes = recentBuilds.map(build => build.totalGzipSize);
    const maxSize = Math.max(...sizes);
    const minSize = Math.min(...sizes);
    const avgSize = sizes.reduce((a, b) => a + b, 0) / sizes.length;
    const variation = ((maxSize - minSize) / avgSize) * 100;
    
    return variation <= CONFIG.BASELINE_AUTO_UPDATE.MAX_VARIATION;
}

/**
 * Genera raccomandazioni basate sui risultati del monitoraggio
 */
function generateRecommendations(alerts, currentMetrics, trendAnalysis, baselineComparison) {
    const recommendations = [];
    
    // Raccomandazioni per alert severi/critici
    if (alerts.summary.severeCount > 0 || alerts.summary.criticalCount > 0) {
        recommendations.push({
            priority: 'urgent',
            category: 'immediate_action',
            title: 'Azione immediata richiesta',
            description: 'Rilevati aumenti significativi nelle dimensioni del bundle',
            actions: [
                'Analizza le modifiche recenti al codice',
                'Verifica se sono state aggiunte nuove dipendenze pesanti',
                'Esegui analisi dettagliata con "npm run analyze"',
                'Considera il rollback se l\'aumento non è giustificato'
            ]
        });
    }
    
    // Raccomandazioni per chunk grandi
    const largestChunks = currentMetrics.largestChunks.slice(0, 3);
    largestChunks.forEach(chunk => {
        if (chunk.gzipSize > 100 * 1024) { // > 100KB
            recommendations.push({
                priority: 'medium',
                category: 'optimization',
                title: `Ottimizzazione chunk "${chunk.name}"`,
                description: `Il chunk è molto grande (${formatBytes(chunk.gzipSize)})`,
                actions: [
                    'Verifica se può essere suddiviso in chunk più piccoli',
                    'Controlla se contiene dipendenze non necessarie',
                    'Considera il lazy loading per questo chunk',
                    'Analizza il contenuto con il bundle analyzer'
                ]
            });
        }
    });
    
    // Raccomandazioni per trend negativi
    if (trendAnalysis && trendAnalysis.summary && trendAnalysis.summary.concerning.length > 0) {
        recommendations.push({
            priority: 'medium',
            category: 'monitoring',
            title: 'Monitoraggio trend negativi',
            description: `Rilevati ${trendAnalysis.summary.concerning.length} chunk con trend crescenti`,
            actions: [
                'Monitora attentamente le prossime build',
                'Pianifica ottimizzazioni per i chunk in crescita',
                'Considera l\'implementazione di code splitting',
                'Verifica l\'utilizzo di tree shaking'
            ]
        });
    }
    
    // Raccomandazioni per baseline
    if (baselineComparison) {
        const baselineAge = Math.floor((new Date() - new Date(baselineComparison.baselineInfo.createdAt)) / (1000 * 60 * 60 * 24));
        if (baselineAge > 30) {
            recommendations.push({
                priority: 'low',
                category: 'maintenance',
                title: 'Aggiornamento baseline',
                description: `Baseline obsoleta (${baselineAge} giorni)`,
                actions: [
                    'Valuta l\'aggiornamento della baseline',
                    'Verifica la stabilità delle build recenti',
                    'Esegui "npm run baseline:create" se appropriato'
                ]
            });
        }
    } else {
        recommendations.push({
            priority: 'medium',
            category: 'setup',
            title: 'Configurazione baseline',
            description: 'Nessuna baseline configurata per il monitoraggio',
            actions: [
                'Crea una baseline con "npm run baseline:create"',
                'Configura il monitoraggio continuo',
                'Imposta soglie di alert appropriate'
            ]
        });
    }
    
    return recommendations;
}

/**
 * Salva il report completo del monitoraggio continuo
 */
function saveContinuousReport(data) {
    try {
        fs.writeFileSync(CONFIG.CONTINUOUS_REPORT_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Errore nel salvataggio del report continuo:', error.message);
        return false;
    }
}

/**
 * Genera output formattato per il monitoraggio continuo
 */
function generateMonitoringOutput(currentMetrics, alerts, comparisons, recommendations, trendAnalysis) {
    const statusEmojis = {
        'ok': '✅',
        'minor': '🟡',
        'warning': '⚠️',
        'critical': '🚨',
        'severe': '🔴'
    };
    
    console.log(`\n${statusEmojis[alerts.summary.status]} MONITORAGGIO CONTINUO PERFORMANCE`);
    console.log('=' .repeat(70));
    
    // Status generale
    console.log(`\n📊 STATUS: ${alerts.summary.status.toUpperCase()}`);
    console.log(`📦 Bundle Size: ${formatBytes(currentMetrics.totalGzipSize)} (gzip)`);
    console.log(`🕒 Timestamp: ${new Date(currentMetrics.timestamp).toLocaleString()}`);
    console.log(`🚨 Alert: ${alerts.summary.totalAlerts} (${alerts.summary.severeCount} severe, ${alerts.summary.criticalCount} critical, ${alerts.summary.warningCount} warning)`);
    
    // Confronti temporali
    console.log('\n📈 CONFRONTI TEMPORALI:');
    Object.entries(comparisons).forEach(([timeframe, comparison]) => {
        if (comparison) {
            const changeIcon = comparison.change > 0 ? '📈' : comparison.change < 0 ? '📉' : '➡️';
            const changeColor = comparison.change > CONFIG.ALERT_THRESHOLDS.CRITICAL ? '🔴' :
                               comparison.change > CONFIG.ALERT_THRESHOLDS.WARNING ? '🟡' : '🟢';
            console.log(`   ${changeColor} ${timeframe}: ${changeIcon} ${comparison.change > 0 ? '+' : ''}${comparison.change.toFixed(1)}% (${comparison.timeframe})`);
        }
    });
    
    // Alert principali
    if (alerts.summary.totalAlerts > 0) {
        console.log('\n🚨 ALERT PRINCIPALI:');
        
        [...alerts.severe, ...alerts.critical, ...alerts.warning].slice(0, 5).forEach(alert => {
            const levelEmoji = alert.type.includes('severe') ? '🔴' :
                              alert.type.includes('critical') ? '🚨' : '⚠️';
            console.log(`   ${levelEmoji} ${alert.message}`);
        });
        
        if (alerts.summary.totalAlerts > 5) {
            console.log(`   ... e altri ${alerts.summary.totalAlerts - 5} alert`);
        }
    }
    
    // Top chunk
    console.log('\n📦 TOP 3 CHUNK (gzip):');
    currentMetrics.largestChunks.slice(0, 3).forEach((chunk, index) => {
        console.log(`   ${index + 1}. ${chunk.name}: ${formatBytes(chunk.gzipSize)}`);
    });
    
    // Trend analysis summary
    if (trendAnalysis && trendAnalysis.summary) {
        console.log('\n📊 TREND SUMMARY:');
        console.log(`   📊 Stabili: ${trendAnalysis.summary.stable || 0}`);
        console.log(`   📈 In crescita: ${trendAnalysis.summary.increasing || 0}`);
        console.log(`   📉 In diminuzione: ${trendAnalysis.summary.decreasing || 0}`);
        if (trendAnalysis.summary.concerning && trendAnalysis.summary.concerning.length > 0) {
            console.log(`   🚨 Preoccupanti: ${trendAnalysis.summary.concerning.length}`);
        }
    }
    
    // Raccomandazioni principali
    if (recommendations.length > 0) {
        console.log('\n💡 RACCOMANDAZIONI PRINCIPALI:');
        recommendations.slice(0, 3).forEach((rec, index) => {
            const priorityEmoji = rec.priority === 'urgent' ? '🔴' :
                                 rec.priority === 'high' ? '🟠' :
                                 rec.priority === 'medium' ? '🟡' : '🟢';
            console.log(`   ${index + 1}. ${priorityEmoji} ${rec.title}`);
            console.log(`      ${rec.description}`);
        });
    }
    
    console.log('\n' + '='.repeat(70));
    
    // Determina exit code
    if (alerts.summary.severeCount > 0) return 3;
    if (alerts.summary.criticalCount > 0) return 2;
    if (alerts.summary.warningCount > 0) return 1;
    return 0;
}

/**
 * Funzione principale per il monitoraggio continuo
 */
function main() {
    const args = process.argv.slice(2);
    const options = {
        verbose: args.includes('--verbose') || args.includes('-v'),
        quiet: args.includes('--quiet') || args.includes('-q'),
        jsonOutput: args.includes('--json'),
        noBaseline: args.includes('--no-baseline'),
        forceBaseline: args.includes('--force-baseline')
    };
    
    try {
        if (!options.quiet) {
            console.log('🔍 Avvio monitoraggio continuo performance bundle...');
        }
        
        // Estrai metriche correnti
        const currentMetrics = extractBundleMetrics();
        
        // Carica e aggiorna dati storici
        const historicalData = loadHistoricalMetrics();
        historicalData.history.push(currentMetrics);
        saveHistoricalMetrics(historicalData);
        
        // Esegui confronti temporali
        const comparisons = performTemporalComparisons(currentMetrics, historicalData.history.slice(0, -1));
        
        // Confronto con baseline
        const baselineComparison = compareWithBaseline(currentMetrics);
        
        // Analisi trend
        const trendAnalysis = historicalData.history.length >= 5 ? 
            analyzeTrends(historicalData.history) : null;
        
        // Genera alert
        const alerts = generateTemporalAlerts(comparisons, baselineComparison);
        
        // Genera raccomandazioni
        const recommendations = generateRecommendations(alerts, currentMetrics, trendAnalysis, baselineComparison);
        
        // Auto-update baseline se necessario
        if (!options.noBaseline) {
            if (options.forceBaseline || shouldAutoUpdateBaseline(historicalData.history)) {
                if (!options.quiet) {
                    console.log('🔄 Aggiornamento automatico baseline...');
                }
                createBaseline('continuous-auto');
            }
        }
        
        // Prepara dati del report
        const reportData = {
            timestamp: new Date().toISOString(),
            status: alerts.summary.status,
            metrics: {
                totalSize: currentMetrics.totalSize,
                totalGzipSize: currentMetrics.totalGzipSize,
                totalBrotliSize: currentMetrics.totalBrotliSize,
                chunkCount: Object.keys(currentMetrics.chunks).length,
                largestChunks: currentMetrics.largestChunks.slice(0, 5)
            },
            comparisons: comparisons,
            alerts: alerts,
            recommendations: recommendations,
            trends: trendAnalysis ? {
                totalBundleTrend: trendAnalysis.totalBundle?.trend || 'unknown',
                concerningChunks: trendAnalysis.summary?.concerning?.length || 0,
                stableChunks: trendAnalysis.summary?.stable || 0
            } : null,
            baseline: baselineComparison ? {
                totalSizeChange: baselineComparison.totalSizeChange,
                baselineAge: Math.floor((new Date() - new Date(baselineComparison.baselineInfo.createdAt)) / (1000 * 60 * 60 * 24))
            } : null
        };
        
        // Salva report
        saveContinuousReport(reportData);
        
        // Output appropriato
        let exitCode = 0;
        
        if (options.jsonOutput) {
            console.log(JSON.stringify(reportData, null, 2));
            exitCode = alerts.summary.severeCount > 0 ? 3 :
                      alerts.summary.criticalCount > 0 ? 2 :
                      alerts.summary.warningCount > 0 ? 1 : 0;
        } else if (options.quiet) {
            // Solo exit code, nessun output
            exitCode = alerts.summary.severeCount > 0 ? 3 :
                      alerts.summary.criticalCount > 0 ? 2 :
                      alerts.summary.warningCount > 0 ? 1 : 0;
        } else {
            exitCode = generateMonitoringOutput(currentMetrics, alerts, comparisons, recommendations, trendAnalysis);
        }
        
        // Exit con codice appropriato
        process.exit(exitCode);
        
    } catch (error) {
        console.error('❌ Errore durante il monitoraggio continuo:', error.message);
        if (options.verbose) {
            console.error(error.stack);
        }
        process.exit(4);
    }
}

// Esegui solo se chiamato direttamente
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { 
    performTemporalComparisons,
    generateTemporalAlerts,
    shouldAutoUpdateBaseline,
    generateRecommendations
};