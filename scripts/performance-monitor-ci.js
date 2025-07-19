#!/usr/bin/env node

/**
 * Continuous Performance Monitoring Script
 * 
 * Script per il monitoraggio continuo delle performance del bundle:
 * - Confronta dimensioni bundle nel tempo
 * - Crea metriche di baseline per monitoraggio continuo  
 * - Genera alert per aumenti significativi delle dimensioni
 * - Integrazione CI/CD con exit codes appropriati
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
    CI_REPORT_FILE: path.join(__dirname, '../.performance-ci-report.json'),
    
    // Soglie di alert per il monitoraggio continuo
    ALERT_THRESHOLDS: {
        WARNING: 5,     // 5% aumento = warning
        CRITICAL: 15,   // 15% aumento = critico
        SEVERE: 30      // 30% aumento = severo
    },
    
    // Configurazione trend analysis
    TREND_WINDOW: 5,
    BASELINE_AUTO_UPDATE_DAYS: 7,
    
    // Configurazione per CI/CD
    MAX_HISTORY_ENTRIES: 50,
    RETENTION_DAYS: 30
};

/**
 * Carica le metriche storiche
 */
function loadHistoricalMetrics() {
    try {
        if (fs.existsSync(CONFIG.METRICS_FILE)) {
            const data = JSON.parse(fs.readFileSync(CONFIG.METRICS_FILE, 'utf8'));
            return data;
        }
        return { history: [] };
    } catch (error) {
        console.error('Errore nel caricamento delle metriche storiche:', error.message);
        return { history: [] };
    }
}

/**
 * Salva le metriche storiche con cleanup automatico
 */
function saveHistoricalMetrics(data) {
    try {
        // Cleanup delle entry vecchie
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - CONFIG.RETENTION_DAYS);
        
        data.history = data.history.filter(entry => 
            new Date(entry.timestamp) > cutoffDate
        );
        
        // Limita il numero massimo di entry
        if (data.history.length > CONFIG.MAX_HISTORY_ENTRIES) {
            data.history = data.history.slice(-CONFIG.MAX_HISTORY_ENTRIES);
        }
        
        fs.writeFileSync(CONFIG.METRICS_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Errore nel salvataggio delle metriche:', error.message);
    }
}

/**
 * Confronta con la build precedente
 */
function compareWithPrevious(currentMetrics, previousMetrics) {
    if (!previousMetrics) return null;
    
    const comparison = {
        totalSizeChange: calculatePercentageChange(
            previousMetrics.totalGzipSize, 
            currentMetrics.totalGzipSize
        ),
        chunkChanges: {},
        significantChanges: []
    };
    
    // Confronta chunk comuni
    Object.keys(currentMetrics.chunks).forEach(chunkName => {
        if (previousMetrics.chunks[chunkName]) {
            const change = calculatePercentageChange(
                previousMetrics.chunks[chunkName].gzipSize,
                currentMetrics.chunks[chunkName].gzipSize
            );
            comparison.chunkChanges[chunkName] = change;
            
            // Identifica cambiamenti significativi
            if (Math.abs(change) > CONFIG.ALERT_THRESHOLDS.WARNING) {
                comparison.significantChanges.push({
                    chunk: chunkName,
                    change: change,
                    oldSize: previousMetrics.chunks[chunkName].gzipSize,
                    newSize: currentMetrics.chunks[chunkName].gzipSize
                });
            }
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
 * Genera alert basati sui confronti
 */
function generateContinuousAlerts(currentMetrics, previousComparison, baselineComparison, trendAnalysis) {
    const alerts = {
        critical: [],
        warning: [],
        info: [],
        summary: {
            totalAlerts: 0,
            criticalCount: 0,
            warningCount: 0,
            infoCount: 0,
            status: 'ok'
        }
    };
    
    // Alert per confronto con build precedente
    if (previousComparison) {
        const change = previousComparison.totalSizeChange;
        
        if (change > CONFIG.ALERT_THRESHOLDS.SEVERE) {
            alerts.critical.push({
                type: 'severe_size_increase',
                message: `Bundle aumentato del ${change.toFixed(1)}% rispetto alla build precedente`,
                change: change,
                threshold: CONFIG.ALERT_THRESHOLDS.SEVERE,
                impact: 'high'
            });
        } else if (change > CONFIG.ALERT_THRESHOLDS.CRITICAL) {
            alerts.critical.push({
                type: 'critical_size_increase',
                message: `Bundle aumentato del ${change.toFixed(1)}% rispetto alla build precedente`,
                change: change,
                threshold: CONFIG.ALERT_THRESHOLDS.CRITICAL,
                impact: 'medium'
            });
        } else if (change > CONFIG.ALERT_THRESHOLDS.WARNING) {
            alerts.warning.push({
                type: 'warning_size_increase',
                message: `Bundle aumentato del ${change.toFixed(1)}% rispetto alla build precedente`,
                change: change,
                threshold: CONFIG.ALERT_THRESHOLDS.WARNING,
                impact: 'low'
            });
        }
        
        // Alert per chunk individuali
        previousComparison.significantChanges.forEach(chunkChange => {
            if (chunkChange.change > CONFIG.ALERT_THRESHOLDS.CRITICAL) {
                alerts.critical.push({
                    type: 'chunk_critical_increase',
                    message: `Chunk "${chunkChange.chunk}" aumentato del ${chunkChange.change.toFixed(1)}%`,
                    chunk: chunkChange.chunk,
                    change: chunkChange.change,
                    impact: 'medium'
                });
            } else if (chunkChange.change > CONFIG.ALERT_THRESHOLDS.WARNING) {
                alerts.warning.push({
                    type: 'chunk_warning_increase',
                    message: `Chunk "${chunkChange.chunk}" aumentato del ${chunkChange.change.toFixed(1)}%`,
                    chunk: chunkChange.chunk,
                    change: chunkChange.change,
                    impact: 'low'
                });
            }
        });
    }
    
    // Alert per deviazione dalla baseline
    if (baselineComparison && baselineComparison.totalSizeChange > CONFIG.ALERT_THRESHOLDS.WARNING) {
        const baselineAge = Math.floor((new Date() - new Date(baselineComparison.baselineInfo.createdAt)) / (1000 * 60 * 60 * 24));
        
        alerts.warning.push({
            type: 'baseline_deviation',
            message: `Bundle ${baselineComparison.totalSizeChange.toFixed(1)}% più grande della baseline (${baselineAge} giorni fa)`,
            change: baselineComparison.totalSizeChange,
            baselineAge: baselineAge,
            impact: 'medium'
        });
    }
    
    // Alert per trend negativi
    if (trendAnalysis && trendAnalysis.totalBundle) {
        const trend = trendAnalysis.totalBundle;
        if (trend.trend === 'increasing_significant' && trend.confidence === 'high') {
            alerts.warning.push({
                type: 'negative_trend',
                message: `Trend crescente significativo: +${trend.percentageChange.toFixed(1)}% negli ultimi ${CONFIG.TREND_WINDOW} build`,
                trendChange: trend.percentageChange,
                confidence: trend.confidence,
                impact: 'medium'
            });
        }
    }
    
    // Calcola summary
    alerts.summary.criticalCount = alerts.critical.length;
    alerts.summary.warningCount = alerts.warning.length;
    alerts.summary.infoCount = alerts.info.length;
    alerts.summary.totalAlerts = alerts.summary.criticalCount + alerts.summary.warningCount + alerts.summary.infoCount;
    
    // Determina status generale
    if (alerts.summary.criticalCount > 0) {
        alerts.summary.status = 'critical';
    } else if (alerts.summary.warningCount > 0) {
        alerts.summary.status = 'warning';
    } else {
        alerts.summary.status = 'ok';
    }
    
    return alerts;
}

/**
 * Genera raccomandazioni per il CI/CD
 */
function generateCIRecommendations(alerts, currentMetrics, trendAnalysis) {
    const recommendations = [];
    
    // Raccomandazioni basate sugli alert critici
    if (alerts.summary.criticalCount > 0) {
        recommendations.push({
            type: 'immediate_action',
            priority: 'critical',
            message: 'Aumenti critici rilevati nel bundle',
            actions: [
                'Analizza le modifiche recenti al codice',
                'Verifica se sono state aggiunte nuove dipendenze',
                'Considera il rollback se l\'aumento non è giustificato',
                'Esegui analisi dettagliata con "npm run bundle:analyze"'
            ]
        });
    }
    
    // Raccomandazioni per chunk grandi
    const largestChunks = currentMetrics.largestChunks.slice(0, 3);
    largestChunks.forEach(chunk => {
        if (chunk.gzipSize > 80 * 1024) { // > 80KB
            recommendations.push({
                type: 'chunk_optimization',
                priority: 'medium',
                message: `Chunk "${chunk.name}" è molto grande (${formatBytes(chunk.gzipSize)})`,
                actions: [
                    'Verifica se può essere suddiviso in chunk più piccoli',
                    'Controlla se contiene dipendenze non necessarie',
                    'Considera il lazy loading per questo chunk'
                ]
            });
        }
    });
    
    // Raccomandazioni per trend negativi
    if (trendAnalysis && trendAnalysis.summary && trendAnalysis.summary.concerning.length > 0) {
        recommendations.push({
            type: 'trend_monitoring',
            priority: 'medium',
            message: 'Rilevati trend crescenti in alcuni chunk',
            actions: [
                'Monitora attentamente le prossime build',
                'Pianifica ottimizzazioni per i chunk in crescita',
                'Considera l\'aggiornamento della baseline se appropriato'
            ]
        });
    }
    
    // Raccomandazione per baseline obsoleta
    const baseline = loadBaseline();
    if (baseline) {
        const baselineAge = Math.floor((new Date() - new Date(baseline.createdAt)) / (1000 * 60 * 60 * 24));
        if (baselineAge > CONFIG.BASELINE_AUTO_UPDATE_DAYS) {
            recommendations.push({
                type: 'baseline_update',
                priority: 'low',
                message: `Baseline obsoleta (${baselineAge} giorni)`,
                actions: [
                    'Valuta l\'aggiornamento della baseline',
                    'Verifica la stabilità delle build recenti',
                    'Esegui "npm run baseline:create" se appropriato'
                ]
            });
        }
    }
    
    return recommendations;
}

/**
 * Salva il report CI con tutte le informazioni necessarie
 */
function saveCIReport(currentMetrics, alerts, recommendations, comparisons, trendAnalysis) {
    const report = {
        timestamp: new Date().toISOString(),
        status: alerts.summary.status,
        
        // Metriche principali
        metrics: {
            totalSize: currentMetrics.totalSize,
            totalGzipSize: currentMetrics.totalGzipSize,
            totalBrotliSize: currentMetrics.totalBrotliSize,
            chunkCount: Object.keys(currentMetrics.chunks).length,
            largestChunk: currentMetrics.largestChunks[0]
        },
        
        // Alert e raccomandazioni
        alerts: alerts,
        recommendations: recommendations,
        
        // Confronti
        comparisons: {
            previous: comparisons.previous ? {
                totalSizeChange: comparisons.previous.totalSizeChange,
                significantChanges: comparisons.previous.significantChanges.length
            } : null,
            baseline: comparisons.baseline ? {
                totalSizeChange: comparisons.baseline.totalSizeChange,
                baselineAge: Math.floor((new Date() - new Date(comparisons.baseline.baselineInfo.createdAt)) / (1000 * 60 * 60 * 24))
            } : null
        },
        
        // Trend analysis summary
        trends: trendAnalysis ? {
            totalBundleTrend: trendAnalysis.totalBundle?.trend || 'unknown',
            concerningChunks: trendAnalysis.summary?.concerning?.length || 0,
            stableChunks: trendAnalysis.summary?.stable || 0
        } : null,
        
        // Exit code per CI/CD
        exitCode: alerts.summary.criticalCount > 0 ? 2 : 
                 alerts.summary.warningCount > 0 ? 1 : 0
    };
    
    try {
        fs.writeFileSync(CONFIG.CI_REPORT_FILE, JSON.stringify(report, null, 2));
        console.log(`📄 Report CI salvato: ${CONFIG.CI_REPORT_FILE}`);
    } catch (error) {
        console.warn('Errore nel salvataggio del report CI:', error.message);
    }
    
    return report;
}

/**
 * Aggiorna automaticamente la baseline se le condizioni sono soddisfatte
 */
function autoUpdateBaseline(historicalData) {
    const baseline = loadBaseline();
    if (!baseline) return false;
    
    const baselineAge = Math.floor((new Date() - new Date(baseline.createdAt)) / (1000 * 60 * 60 * 24));
    
    // Auto-update solo se la baseline è vecchia e le build sono stabili
    if (baselineAge >= CONFIG.BASELINE_AUTO_UPDATE_DAYS && historicalData.history.length >= 5) {
        const recentBuilds = historicalData.history.slice(-5);
        const sizes = recentBuilds.map(build => build.totalGzipSize);
        const maxVariation = Math.max(...sizes) - Math.min(...sizes);
        const avgSize = sizes.reduce((a, b) => a + b, 0) / sizes.length;
        const variationPercentage = (maxVariation / avgSize) * 100;
        
        if (variationPercentage <= 3) { // Variazione < 3%
            console.log('🔄 Auto-aggiornamento baseline (build stabili rilevate)...');
            return createBaseline('ci-auto');
        }
    }
    
    return false;
}

/**
 * Genera output per CI/CD
 */
function generateCIOutput(report) {
    const statusEmoji = {
        'ok': '✅',
        'warning': '⚠️',
        'critical': '🚨'
    };
    
    console.log(`\n${statusEmoji[report.status]} PERFORMANCE MONITORING REPORT`);
    console.log('='.repeat(50));
    
    console.log(`Status: ${report.status.toUpperCase()}`);
    console.log(`Bundle Size: ${formatBytes(report.metrics.totalGzipSize)} (gzip)`);
    console.log(`Chunks: ${report.metrics.chunkCount}`);
    console.log(`Alerts: ${report.alerts.summary.totalAlerts} (${report.alerts.summary.criticalCount} critical, ${report.alerts.summary.warningCount} warning)`);
    
    // Mostra alert critici
    if (report.alerts.critical.length > 0) {
        console.log('\n🚨 CRITICAL ALERTS:');
        report.alerts.critical.forEach(alert => {
            console.log(`  • ${alert.message}`);
        });
    }
    
    // Mostra warning principali
    if (report.alerts.warning.length > 0) {
        console.log('\n⚠️  WARNINGS:');
        report.alerts.warning.slice(0, 3).forEach(alert => {
            console.log(`  • ${alert.message}`);
        });
        if (report.alerts.warning.length > 3) {
            console.log(`  • ... e altri ${report.alerts.warning.length - 3} warning`);
        }
    }
    
    // Mostra raccomandazioni principali
    if (report.recommendations.length > 0) {
        console.log('\n💡 RACCOMANDAZIONI:');
        report.recommendations.slice(0, 2).forEach(rec => {
            console.log(`  • ${rec.message}`);
        });
    }
    
    console.log('\n' + '='.repeat(50));
    
    return report.exitCode;
}

/**
 * Funzione principale per il monitoraggio continuo
 */
function main() {
    const args = process.argv.slice(2);
    const isCI = args.includes('--ci') || process.env.CI === 'true';
    const verbose = args.includes('--verbose') || args.includes('-v');
    
    try {
        console.log('🔍 Avvio monitoraggio continuo performance...');
        
        // Estrai metriche correnti
        const currentMetrics = extractBundleMetrics();
        
        // Carica dati storici
        const historicalData = loadHistoricalMetrics();
        
        // Aggiungi metriche correnti alla storia
        historicalData.history.push(currentMetrics);
        saveHistoricalMetrics(historicalData);
        
        // Confronti
        const previousMetrics = historicalData.history.length > 1 ? 
            historicalData.history[historicalData.history.length - 2] : null;
        const previousComparison = compareWithPrevious(currentMetrics, previousMetrics);
        const baselineComparison = compareWithBaseline(currentMetrics);
        
        // Analisi trend
        const trendAnalysis = historicalData.history.length >= CONFIG.TREND_WINDOW ? 
            analyzeTrends(historicalData.history) : null;
        
        // Genera alert e raccomandazioni
        const alerts = generateContinuousAlerts(currentMetrics, previousComparison, baselineComparison, trendAnalysis);
        const recommendations = generateCIRecommendations(alerts, currentMetrics, trendAnalysis);
        
        // Auto-update baseline se appropriato
        if (!isCI) {
            autoUpdateBaseline(historicalData);
        }
        
        // Salva report CI
        const report = saveCIReport(currentMetrics, alerts, recommendations, {
            previous: previousComparison,
            baseline: baselineComparison
        }, trendAnalysis);
        
        // Output appropriato per l'ambiente
        const exitCode = isCI ? generateCIOutput(report) : 
                        verbose ? generateCIOutput(report) : 
                        report.exitCode;
        
        // Exit con codice appropriato
        if (exitCode === 2) {
            console.log('\n🚨 CRITICAL: Performance degradation detected');
            process.exit(2);
        } else if (exitCode === 1) {
            console.log('\n⚠️  WARNING: Performance issues detected');
            process.exit(1);
        } else {
            console.log('\n✅ Performance monitoring completed successfully');
            process.exit(0);
        }
        
    } catch (error) {
        console.error('❌ Errore durante il monitoraggio:', error.message);
        if (verbose) {
            console.error(error.stack);
        }
        process.exit(3);
    }
}

// Esegui solo se chiamato direttamente
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { 
    generateContinuousAlerts, 
    generateCIRecommendations, 
    compareWithPrevious,
    autoUpdateBaseline 
};