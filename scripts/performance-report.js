#!/usr/bin/env node

/**
 * Performance Monitoring and Reporting Tool
 * 
 * Script completo per il monitoraggio continuo delle performance del bundle:
 * - Confronta dimensioni bundle nel tempo
 * - Crea metriche di baseline per monitoraggio continuo
 * - Genera alert per aumenti significativi delle dimensioni
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { extractBundleMetrics, compareMetrics, formatBytes } from './bundle-monitor.js';
import { analyzeTrends, calculateTrend } from './performance-trend.js';
import { createBaseline, compareWithBaseline, loadBaseline } from './baseline-manager.js';
import { compareBuilds, findBuild } from './performance-compare.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurazione
const CONFIG = {
    METRICS_FILE: path.join(__dirname, '../.bundle-metrics.json'),
    BASELINE_FILE: path.join(__dirname, '../.bundle-baseline.json'),
    ALERT_THRESHOLDS: {
        WARNING: 10,    // 10% aumento = warning
        CRITICAL: 25,   // 25% aumento = critico
        SEVERE: 50      // 50% aumento = severo
    },
    TREND_ANALYSIS_WINDOW: 10,
    BASELINE_UPDATE_THRESHOLD: 5, // Aggiorna baseline se stabile per 5 build
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
 * Genera alert basati sui cambiamenti delle dimensioni
 */
function generateAlerts(currentMetrics, historicalData, baselineComparison) {
    const alerts = {
        critical: [],
        warning: [],
        info: [],
        summary: {
            totalAlerts: 0,
            criticalCount: 0,
            warningCount: 0,
            infoCount: 0
        }
    };

    // Alert basati sul confronto con la build precedente
    if (historicalData.history.length > 1) {
        const previousMetrics = historicalData.history[historicalData.history.length - 2];
        const comparison = compareMetrics(currentMetrics, previousMetrics);
        
        if (comparison) {
            // Alert per bundle totale
            if (comparison.totalSizeChange > CONFIG.ALERT_THRESHOLDS.SEVERE) {
                alerts.critical.push({
                    type: 'bundle_size_severe',
                    message: `Bundle totale aumentato del ${comparison.totalSizeChange.toFixed(1)}% rispetto alla build precedente`,
                    change: comparison.totalSizeChange,
                    threshold: CONFIG.ALERT_THRESHOLDS.SEVERE
                });
            } else if (comparison.totalSizeChange > CONFIG.ALERT_THRESHOLDS.CRITICAL) {
                alerts.critical.push({
                    type: 'bundle_size_critical',
                    message: `Bundle totale aumentato del ${comparison.totalSizeChange.toFixed(1)}% rispetto alla build precedente`,
                    change: comparison.totalSizeChange,
                    threshold: CONFIG.ALERT_THRESHOLDS.CRITICAL
                });
            } else if (comparison.totalSizeChange > CONFIG.ALERT_THRESHOLDS.WARNING) {
                alerts.warning.push({
                    type: 'bundle_size_warning',
                    message: `Bundle totale aumentato del ${comparison.totalSizeChange.toFixed(1)}% rispetto alla build precedente`,
                    change: comparison.totalSizeChange,
                    threshold: CONFIG.ALERT_THRESHOLDS.WARNING
                });
            }

            // Alert per chunk individuali
            Object.entries(comparison.chunkChanges).forEach(([chunkName, change]) => {
                if (change > CONFIG.ALERT_THRESHOLDS.CRITICAL) {
                    alerts.critical.push({
                        type: 'chunk_size_critical',
                        message: `Chunk "${chunkName}" aumentato del ${change.toFixed(1)}%`,
                        chunk: chunkName,
                        change: change,
                        threshold: CONFIG.ALERT_THRESHOLDS.CRITICAL
                    });
                } else if (change > CONFIG.ALERT_THRESHOLDS.WARNING) {
                    alerts.warning.push({
                        type: 'chunk_size_warning',
                        message: `Chunk "${chunkName}" aumentato del ${change.toFixed(1)}%`,
                        chunk: chunkName,
                        change: change,
                        threshold: CONFIG.ALERT_THRESHOLDS.WARNING
                    });
                }
            });
        }
    }

    // Alert basati sul confronto con baseline
    if (baselineComparison) {
        if (baselineComparison.totalSizeChange > CONFIG.ALERT_THRESHOLDS.CRITICAL) {
            alerts.warning.push({
                type: 'baseline_deviation',
                message: `Bundle ${baselineComparison.totalSizeChange.toFixed(1)}% più grande della baseline (${baselineComparison.baselineAge} giorni fa)`,
                change: baselineComparison.totalSizeChange,
                baselineAge: baselineComparison.baselineAge
            });
        }
    }

    // Alert per trend negativi
    if (historicalData.history.length >= CONFIG.TREND_ANALYSIS_WINDOW) {
        const trendAnalysis = analyzeTrends(historicalData.history);
        if (trendAnalysis.totalBundle && trendAnalysis.totalBundle.trend === 'increasing_significant') {
            alerts.warning.push({
                type: 'negative_trend',
                message: `Trend crescente significativo rilevato: +${trendAnalysis.totalBundle.percentageChange.toFixed(1)}% negli ultimi ${CONFIG.TREND_ANALYSIS_WINDOW} build`,
                trendChange: trendAnalysis.totalBundle.percentageChange,
                confidence: trendAnalysis.totalBundle.confidence
            });
        }
    }

    // Calcola summary
    alerts.summary.criticalCount = alerts.critical.length;
    alerts.summary.warningCount = alerts.warning.length;
    alerts.summary.infoCount = alerts.info.length;
    alerts.summary.totalAlerts = alerts.summary.criticalCount + alerts.summary.warningCount + alerts.summary.infoCount;

    return alerts;
}

/**
 * Genera raccomandazioni basate sui dati di performance
 */
function generateRecommendations(currentMetrics, historicalData, alerts) {
    const recommendations = [];

    // Raccomandazioni basate sui chunk più grandi
    const largestChunks = currentMetrics.largestChunks.slice(0, 3);
    largestChunks.forEach(chunk => {
        if (chunk.gzipSize > 100 * 1024) { // > 100KB
            recommendations.push({
                type: 'chunk_optimization',
                priority: 'medium',
                message: `Considera l'ottimizzazione del chunk "${chunk.name}" (${formatBytes(chunk.gzipSize)})`,
                suggestion: 'Verifica se può essere suddiviso o se contiene dipendenze non necessarie'
            });
        }
    });

    // Raccomandazioni basate sugli alert
    if (alerts.summary.criticalCount > 0) {
        recommendations.push({
            type: 'urgent_action',
            priority: 'high',
            message: 'Rilevati aumenti critici nelle dimensioni del bundle',
            suggestion: 'Analizza immediatamente le modifiche recenti e considera il rollback se necessario'
        });
    }

    // Raccomandazioni per baseline obsoleta
    const baseline = loadBaseline();
    if (baseline) {
        const baselineAge = Math.floor((new Date() - new Date(baseline.createdAt)) / (1000 * 60 * 60 * 24));
        if (baselineAge > 30) {
            recommendations.push({
                type: 'baseline_update',
                priority: 'low',
                message: `Baseline obsoleta (${baselineAge} giorni)`,
                suggestion: 'Considera l\'aggiornamento della baseline se le performance sono stabili'
            });
        }
    } else {
        recommendations.push({
            type: 'baseline_missing',
            priority: 'medium',
            message: 'Nessuna baseline configurata',
            suggestion: 'Crea una baseline per il monitoraggio continuo con "npm run baseline:create"'
        });
    }

    return recommendations;
}

/**
 * Genera il report completo delle performance
 */
function generateComprehensiveReport(currentMetrics, historicalData, alerts, recommendations) {
    const baseline = loadBaseline();
    const baselineComparison = compareWithBaseline(currentMetrics, baseline);
    
    console.log('\n🚀 REPORT COMPLETO PERFORMANCE BUNDLE');
    console.log('=' .repeat(70));
    
    // Sezione Status Generale
    console.log('\n📊 STATUS GENERALE:');
    const statusIcon = alerts.summary.criticalCount > 0 ? '🔴' : 
                      alerts.summary.warningCount > 0 ? '🟡' : '🟢';
    const statusText = alerts.summary.criticalCount > 0 ? 'CRITICO' :
                      alerts.summary.warningCount > 0 ? 'ATTENZIONE' : 'OK';
    
    console.log(`   Status: ${statusIcon} ${statusText}`);
    console.log(`   Bundle Totale: ${formatBytes(currentMetrics.totalGzipSize)} (gzip)`);
    console.log(`   Timestamp: ${new Date(currentMetrics.timestamp).toLocaleString()}`);
    console.log(`   Build Storiche: ${historicalData.history.length}`);

    // Sezione Alert
    if (alerts.summary.totalAlerts > 0) {
        console.log('\n🚨 ALERT:');
        
        alerts.critical.forEach(alert => {
            console.log(`   🔴 CRITICO: ${alert.message}`);
        });
        
        alerts.warning.forEach(alert => {
            console.log(`   🟡 WARNING: ${alert.message}`);
        });
        
        alerts.info.forEach(alert => {
            console.log(`   🔵 INFO: ${alert.message}`);
        });
    } else {
        console.log('\n✅ Nessun alert rilevato');
    }

    // Sezione Metriche Principali
    console.log('\n📈 METRICHE PRINCIPALI:');
    console.log(`   Bundle Raw: ${formatBytes(currentMetrics.totalSize)}`);
    console.log(`   Bundle Gzip: ${formatBytes(currentMetrics.totalGzipSize)}`);
    console.log(`   Bundle Brotli: ${formatBytes(currentMetrics.totalBrotliSize)}`);
    console.log(`   Numero Chunk: ${Object.keys(currentMetrics.chunks).length}`);

    // Top Chunk
    console.log('\n📦 TOP 5 CHUNK (gzip):');
    currentMetrics.largestChunks.slice(0, 5).forEach((chunk, index) => {
        console.log(`   ${index + 1}. ${chunk.name}: ${formatBytes(chunk.gzipSize)}`);
    });

    // Confronto con Baseline
    if (baselineComparison) {
        console.log('\n📏 CONFRONTO CON BASELINE:');
        console.log(`   Età baseline: ${baselineComparison.baselineAge} giorni`);
        const changeIcon = baselineComparison.totalSizeChange > 0 ? '📈' : 
                          baselineComparison.totalSizeChange < 0 ? '📉' : '➡️';
        console.log(`   Variazione totale: ${changeIcon} ${baselineComparison.totalSizeChange > 0 ? '+' : ''}${baselineComparison.totalSizeChange.toFixed(1)}%`);
    }

    // Trend Analysis
    if (historicalData.history.length >= 5) {
        console.log('\n📊 TREND ANALYSIS:');
        const recentSizes = historicalData.history.slice(-5).map(h => h.totalGzipSize);
        const trend = calculateTrend(recentSizes);
        const trendIcon = trend.trend === 'stable' ? '📊' :
                         trend.trend.includes('increasing') ? '📈' : '📉';
        console.log(`   Trend (5 build): ${trendIcon} ${trend.trend} (${trend.percentageChange > 0 ? '+' : ''}${trend.percentageChange.toFixed(1)}%)`);
        console.log(`   Confidenza: ${trend.confidence}`);
    }

    // Raccomandazioni
    if (recommendations.length > 0) {
        console.log('\n💡 RACCOMANDAZIONI:');
        recommendations.forEach((rec, index) => {
            const priorityIcon = rec.priority === 'high' ? '🔴' :
                               rec.priority === 'medium' ? '🟡' : '🟢';
            console.log(`   ${index + 1}. ${priorityIcon} ${rec.message}`);
            console.log(`      → ${rec.suggestion}`);
        });
    }

    console.log('\n' + '='.repeat(70));
}

/**
 * Salva il report in formato JSON per integrazione CI/CD
 */
function saveReportData(currentMetrics, alerts, recommendations) {
    const reportData = {
        timestamp: new Date().toISOString(),
        status: alerts.summary.criticalCount > 0 ? 'critical' :
               alerts.summary.warningCount > 0 ? 'warning' : 'ok',
        metrics: {
            totalSize: currentMetrics.totalSize,
            totalGzipSize: currentMetrics.totalGzipSize,
            totalBrotliSize: currentMetrics.totalBrotliSize,
            chunkCount: Object.keys(currentMetrics.chunks).length
        },
        alerts: alerts,
        recommendations: recommendations,
        exitCode: alerts.summary.criticalCount > 0 ? 2 :
                 alerts.summary.warningCount > 0 ? 1 : 0
    };

    try {
        const reportPath = path.join(__dirname, '../.performance-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
        console.log(`\n📄 Report salvato in: ${reportPath}`);
    } catch (error) {
        console.warn('Errore nel salvataggio del report:', error.message);
    }

    return reportData.exitCode;
}

/**
 * Aggiorna automaticamente la baseline se le condizioni sono soddisfatte
 */
function autoUpdateBaseline(historicalData) {
    if (historicalData.history.length < CONFIG.BASELINE_UPDATE_THRESHOLD) {
        return false;
    }

    // Verifica se le ultime build sono stabili
    const recentBuilds = historicalData.history.slice(-CONFIG.BASELINE_UPDATE_THRESHOLD);
    const sizes = recentBuilds.map(build => build.totalGzipSize);
    const maxVariation = Math.max(...sizes) - Math.min(...sizes);
    const avgSize = sizes.reduce((a, b) => a + b, 0) / sizes.length;
    const variationPercentage = (maxVariation / avgSize) * 100;

    if (variationPercentage <= 3) { // Variazione < 3%
        console.log('\n🔄 Build stabili rilevate, aggiornamento automatico baseline...');
        return createBaseline('auto');
    }

    return false;
}

/**
 * Funzione principale
 */
function main() {
    const args = process.argv.slice(2);
    const command = args[0] || 'full';

    console.log('🚀 Avvio monitoraggio performance completo...\n');

    try {
        // Carica dati
        const currentMetrics = extractBundleMetrics();
        const historicalData = loadHistoricalMetrics();
        const baseline = loadBaseline();
        const baselineComparison = compareWithBaseline(currentMetrics, baseline);

        // Genera alert e raccomandazioni
        const alerts = generateAlerts(currentMetrics, historicalData, baselineComparison);
        const recommendations = generateRecommendations(currentMetrics, historicalData, alerts);

        // Aggiorna baseline automaticamente se appropriato
        if (command !== 'no-baseline-update') {
            autoUpdateBaseline(historicalData);
        }

        // Genera report
        switch (command) {
            case 'alerts-only':
                if (alerts.summary.totalAlerts > 0) {
                    console.log('🚨 ALERT RILEVATI:');
                    alerts.critical.forEach(alert => console.log(`🔴 ${alert.message}`));
                    alerts.warning.forEach(alert => console.log(`🟡 ${alert.message}`));
                }
                break;
                
            case 'summary':
                console.log(`Status: ${alerts.summary.criticalCount > 0 ? '🔴 CRITICO' : alerts.summary.warningCount > 0 ? '🟡 WARNING' : '🟢 OK'}`);
                console.log(`Bundle: ${formatBytes(currentMetrics.totalGzipSize)} (gzip)`);
                console.log(`Alert: ${alerts.summary.totalAlerts}`);
                break;
                
            case 'full':
            default:
                generateComprehensiveReport(currentMetrics, historicalData, alerts, recommendations);
                break;
        }

        // Salva report per CI/CD
        const exitCode = saveReportData(currentMetrics, alerts, recommendations);

        // Exit con codice appropriato
        if (exitCode === 2) {
            console.log('\n🔴 ERRORI CRITICI RILEVATI - Build fallita');
            process.exit(2);
        } else if (exitCode === 1) {
            console.log('\n🟡 WARNING RILEVATI - Build completata con avvisi');
            process.exit(1);
        } else {
            console.log('\n🟢 Performance OK - Build completata con successo');
            process.exit(0);
        }

    } catch (error) {
        console.error('❌ Errore durante il monitoraggio performance:', error.message);
        process.exit(3);
    }
}

// Esegui solo se chiamato direttamente
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { generateAlerts, generateRecommendations, autoUpdateBaseline };