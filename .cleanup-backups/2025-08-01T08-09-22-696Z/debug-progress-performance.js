/**
 * Debug utilities per monitorare le performance della progress bar
 * Basato sulle best practices di JavaScript.info per il monitoring delle animazioni
 */

class ProgressBarPerformanceMonitor {
    constructor() {
        this.metrics = {
            frameCount: 0,
            droppedFrames: 0,
            averageFPS: 0,
            animationDuration: 0,
            memoryUsage: 0,
            activeProgressBars: 0
        };
        
        this.isMonitoring = false;
        this.startTime = 0;
        this.lastFrameTime = 0;
        this.frameTimings = [];
        
        this.init();
    }
    
    init() {
        // Monitora le performance globali
        this.setupPerformanceObserver();
        
        // Esponi funzioni di debug globalmente
        window.progressBarDebug = {
            start: () => this.startMonitoring(),
            stop: () => this.stopMonitoring(),
            getMetrics: () => this.getMetrics(),
            reset: () => this.resetMetrics(),
            logReport: () => this.logPerformanceReport()
        };
        
        console.log('🔧 Progress Bar Performance Monitor initialized');
    }
    
    setupPerformanceObserver() {
        if ('PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        if (entry.name.includes('progress') || entry.name.includes('notification')) {
                            this.recordPerformanceEntry(entry);
                        }
                    });
                });
                
                observer.observe({ entryTypes: ['measure', 'navigation', 'resource'] });
            } catch (error) {
                console.warn('⚠️ PerformanceObserver not fully supported:', error);
            }
        }
    }
    
    startMonitoring() {
        if (this.isMonitoring) return;
        
        this.isMonitoring = true;
        this.startTime = performance.now();
        this.lastFrameTime = this.startTime;
        this.frameTimings = [];
        
        console.log('📊 Starting progress bar performance monitoring...');
        this.monitorFrame();
    }
    
    stopMonitoring() {
        this.isMonitoring = false;
        this.calculateMetrics();
        console.log('⏹️ Progress bar performance monitoring stopped');
    }
    
    monitorFrame() {
        if (!this.isMonitoring) return;
        
        const currentTime = performance.now();
        const frameDuration = currentTime - this.lastFrameTime;
        
        this.frameTimings.push(frameDuration);
        this.metrics.frameCount++;
        
        // Rileva frame droppati (> 16.67ms per 60fps)
        if (frameDuration > 16.67) {
            this.metrics.droppedFrames++;
        }
        
        this.lastFrameTime = currentTime;
        
        // Continua monitoring
        requestAnimationFrame(() => this.monitorFrame());
    }
    
    calculateMetrics() {
        if (this.frameTimings.length === 0) return;
        
        const totalDuration = performance.now() - this.startTime;
        this.metrics.animationDuration = totalDuration;
        
        // Calcola FPS medio
        this.metrics.averageFPS = (this.metrics.frameCount / totalDuration) * 1000;
        
        // Calcola memoria utilizzata (se disponibile)
        if (performance.memory) {
            this.metrics.memoryUsage = performance.memory.usedJSHeapSize;
        }
        
        // Conta progress bar attive
        this.metrics.activeProgressBars = document.querySelectorAll('.notification__progress').length;
    }
    
    recordPerformanceEntry(entry) {
        console.log('📈 Performance entry:', {
            name: entry.name,
            duration: entry.duration,
            startTime: entry.startTime
        });
    }
    
    getMetrics() {
        this.calculateMetrics();
        return { ...this.metrics };
    }
    
    resetMetrics() {
        this.metrics = {
            frameCount: 0,
            droppedFrames: 0,
            averageFPS: 0,
            animationDuration: 0,
            memoryUsage: 0,
            activeProgressBars: 0
        };
        
        this.frameTimings = [];
        console.log('🔄 Performance metrics reset');
    }
    
    logPerformanceReport() {
        const metrics = this.getMetrics();
        const dropRate = (metrics.droppedFrames / metrics.frameCount) * 100;
        
        console.group('📊 Progress Bar Performance Report');
        console.log(`⏱️  Total Duration: ${metrics.animationDuration.toFixed(2)}ms`);
        console.log(`🎬 Total Frames: ${metrics.frameCount}`);
        console.log(`📉 Dropped Frames: ${metrics.droppedFrames} (${dropRate.toFixed(2)}%)`);
        console.log(`🚀 Average FPS: ${metrics.averageFPS.toFixed(2)}`);
        console.log(`💾 Memory Usage: ${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB`);
        console.log(`📊 Active Progress Bars: ${metrics.activeProgressBars}`);
        
        // Valutazione performance
        let performance_rating = 'Excellent';
        if (dropRate > 5) performance_rating = 'Good';
        if (dropRate > 10) performance_rating = 'Fair';
        if (dropRate > 20) performance_rating = 'Poor';
        
        console.log(`⭐ Performance Rating: ${performance_rating}`);
        
        // Suggerimenti di ottimizzazione
        if (dropRate > 10) {
            console.warn('⚠️ High frame drop rate detected. Consider:');
            console.warn('   - Reducing number of simultaneous animations');
            console.warn('   - Using CSS animations for simple cases');
            console.warn('   - Enabling performance mode');
        }
        
        if (metrics.memoryUsage > 50 * 1024 * 1024) { // 50MB
            console.warn('⚠️ High memory usage detected. Consider:');
            console.warn('   - Implementing cleanup for old notifications');
            console.warn('   - Reducing notification history');
        }
        
        console.groupEnd();
        
        return {
            metrics,
            rating: performance_rating,
            recommendations: this.getRecommendations(metrics)
        };
    }
    
    getRecommendations(metrics) {
        const recommendations = [];
        const dropRate = (metrics.droppedFrames / metrics.frameCount) * 100;
        
        if (dropRate > 10) {
            recommendations.push('Consider using CSS animations for simple progress bars');
            recommendations.push('Reduce number of simultaneous animations');
        }
        
        if (metrics.activeProgressBars > 5) {
            recommendations.push('Implement virtual scrolling for many notifications');
            recommendations.push('Auto-remove old notifications');
        }
        
        if (metrics.memoryUsage > 50 * 1024 * 1024) {
            recommendations.push('Implement memory cleanup for progress bar instances');
            recommendations.push('Use object pooling for frequent animations');
        }
        
        return recommendations;
    }
}

// Utility per testare performance di una singola progress bar
class SingleProgressBarTester {
    constructor() {
        this.testResults = [];
    }
    
    async testProgressBar(element, duration, type) {
        console.log(`🧪 Testing progress bar: ${type}, ${duration}ms`);
        
        const startTime = performance.now();
        const startMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
        
        // Simula creazione progress bar
        const { createProgressBar } = await import('./src/core/services/notificationProgressBar.js');
        const progressBar = createProgressBar(element, duration, type);
        
        // Monitora per tutta la durata
        return new Promise((resolve) => {
            const monitor = setInterval(() => {
                const currentTime = performance.now();
                const elapsed = currentTime - startTime;
                
                if (elapsed >= duration) {
                    clearInterval(monitor);
                    
                    const endTime = performance.now();
                    const endMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
                    
                    const result = {
                        type,
                        duration,
                        actualDuration: endTime - startTime,
                        memoryDelta: endMemory - startMemory,
                        accuracy: Math.abs(duration - (endTime - startTime)) / duration * 100
                    };
                    
                    this.testResults.push(result);
                    console.log('✅ Test completed:', result);
                    resolve(result);
                }
            }, 16); // Check every frame
        });
    }
    
    getTestSummary() {
        if (this.testResults.length === 0) return null;
        
        const avgAccuracy = this.testResults.reduce((sum, r) => sum + r.accuracy, 0) / this.testResults.length;
        const totalMemory = this.testResults.reduce((sum, r) => sum + r.memoryDelta, 0);
        
        return {
            testsRun: this.testResults.length,
            averageAccuracy: avgAccuracy,
            totalMemoryUsed: totalMemory,
            results: this.testResults
        };
    }
}

// Inizializza monitor
const performanceMonitor = new ProgressBarPerformanceMonitor();
const progressBarTester = new SingleProgressBarTester();

// Esponi utilities globalmente
window.progressBarTester = progressBarTester;
window.progressBarDebug = performanceMonitor.isMonitoring ? {
    start: () => performanceMonitor.startMonitoring(),
    stop: () => performanceMonitor.stopMonitoring(),
    getMetrics: () => performanceMonitor.getMetrics(),
    reset: () => performanceMonitor.resetMetrics(),
    logReport: () => performanceMonitor.logPerformanceReport()
} : null;

// Assicurati che progressBarDebug sia sempre disponibile
if (!window.progressBarDebug) {
    window.progressBarDebug = {
        start: () => performanceMonitor.startMonitoring(),
        stop: () => performanceMonitor.stopMonitoring(),
        getMetrics: () => performanceMonitor.getMetrics(),
        reset: () => performanceMonitor.resetMetrics(),
        logReport: () => performanceMonitor.logPerformanceReport()
    };
}

// Auto-start monitoring se in modalità debug
if (localStorage.getItem('debug-progress-bar') === 'true') {
    performanceMonitor.startMonitoring();
    console.log('🔧 Auto-started progress bar performance monitoring');
}

export { ProgressBarPerformanceMonitor, SingleProgressBarTester };