/**
 * Performance Monitor per tracciare le ottimizzazioni del database
 * Monitora le query lente e fornisce statistiche
 */

class PerformanceMonitor {
    constructor() {
        this.queryStats = new Map();
        this.isEnabled = process.env.NODE_ENV === 'development';
    }

    /**
     * Traccia una query per monitorare le performance
     * @param {string} queryName - Nome identificativo della query
     * @param {Function} queryFunction - Funzione che esegue la query
     * @returns {Promise} Risultato della query
     */
    async trackQuery(queryName, queryFunction) {
        if (!this.isEnabled) {
            return await queryFunction();
        }

        const startTime = performance.now();
        
        try {
            const result = await queryFunction();
            const endTime = performance.now();
            const duration = endTime - startTime;

            this.recordQuery(queryName, duration, true);
            
            // Log query lente (> 100ms)
            if (duration > 100) {
                console.warn(`🐌 Query lenta rilevata: ${queryName} (${duration.toFixed(2)}ms)`);
            }

            return result;
        } catch (error) {
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            this.recordQuery(queryName, duration, false);
            console.error(`❌ Query fallita: ${queryName} (${duration.toFixed(2)}ms)`, error);
            
            throw error;
        }
    }

    /**
     * Registra le statistiche di una query
     * @param {string} queryName - Nome della query
     * @param {number} duration - Durata in millisecondi
     * @param {boolean} success - Se la query è riuscita
     */
    recordQuery(queryName, duration, success) {
        if (!this.queryStats.has(queryName)) {
            this.queryStats.set(queryName, {
                count: 0,
                totalTime: 0,
                avgTime: 0,
                minTime: Infinity,
                maxTime: 0,
                errors: 0
            });
        }

        const stats = this.queryStats.get(queryName);
        stats.count++;
        
        if (success) {
            stats.totalTime += duration;
            stats.avgTime = stats.totalTime / stats.count;
            stats.minTime = Math.min(stats.minTime, duration);
            stats.maxTime = Math.max(stats.maxTime, duration);
        } else {
            stats.errors++;
        }
    }

    /**
     * Ottieni statistiche delle query
     * @returns {Object} Statistiche complete
     */
    getStats() {
        const stats = {};
        
        for (const [queryName, data] of this.queryStats) {
            stats[queryName] = {
                ...data,
                successRate: ((data.count - data.errors) / data.count * 100).toFixed(2) + '%'
            };
        }

        return stats;
    }

    /**
     * Stampa un report delle performance
     */
    printReport() {
        if (!this.isEnabled) return;

        console.group('📊 Performance Report');
        
        const stats = this.getStats();
        const sortedStats = Object.entries(stats)
            .sort(([,a], [,b]) => b.avgTime - a.avgTime);

        sortedStats.forEach(([queryName, data]) => {
            const color = data.avgTime > 100 ? '🔴' : data.avgTime > 50 ? '🟡' : '🟢';
            console.log(`${color} ${queryName}:`, {
                calls: data.count,
                avgTime: `${data.avgTime.toFixed(2)}ms`,
                minTime: `${data.minTime.toFixed(2)}ms`,
                maxTime: `${data.maxTime.toFixed(2)}ms`,
                successRate: data.successRate
            });
        });

        console.groupEnd();
    }

    /**
     * Reset delle statistiche
     */
    reset() {
        this.queryStats.clear();
    }
}

// Esporta un'istanza singleton
export const performanceMonitor = new PerformanceMonitor();

// Funzione helper per tracciare query Supabase
export function trackSupabaseQuery(queryName, queryFunction) {
    return performanceMonitor.trackQuery(`Supabase: ${queryName}`, queryFunction);
}

// Auto-report ogni 5 minuti in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    setInterval(() => {
        performanceMonitor.printReport();
    }, 5 * 60 * 1000);
}