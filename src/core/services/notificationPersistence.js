/**
 * NotificationPersistence - Gestione persistenza notifiche
 * Salva e recupera notifiche importanti, impostazioni utente e statistiche
 */

export class NotificationPersistence {
    constructor(options = {}) {
        this.options = {
            storageKey: 'notification-data',
            settingsKey: 'notification-settings',
            statsKey: 'notification-stats',
            maxStoredNotifications: 50,
            retentionDays: 7,
            enableStats: true,
            ...options
        };
        
        this.storage = this.getStorageEngine();
        this.isAvailable = !!this.storage;
        
        if (this.isAvailable) {
            this.init();
        }
    }
    
    init() {
        // Pulisci notifiche vecchie all'avvio
        this.cleanupOldNotifications();
        
        // Inizializza statistiche se abilitate
        if (this.options.enableStats) {
            this.initializeStats();
        }
    }
    
    getStorageEngine() {
        // Prova localStorage prima
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('test', 'test');
                localStorage.removeItem('test');
                return localStorage;
            }
        } catch (error) {
            console.warn('localStorage non disponibile:', error);
        }
        
        // Fallback a sessionStorage
        try {
            if (typeof sessionStorage !== 'undefined') {
                sessionStorage.setItem('test', 'test');
                sessionStorage.removeItem('test');
                return sessionStorage;
            }
        } catch (error) {
            console.warn('sessionStorage non disponibile:', error);
        }
        
        // Fallback a memoria (non persistente)
        console.warn('Storage non disponibile, usando memoria temporanea');
        return new Map();
    }
    
    // Gestione notifiche persistenti
    saveNotification(notification) {
        if (!this.isAvailable || !notification.persistent) {
            return false;
        }
        
        try {
            const stored = this.getStoredNotifications();
            
            // Aggiungi timestamp se mancante
            const notificationWithTimestamp = {
                ...notification,
                savedAt: new Date().toISOString(),
                id: notification.id || this.generateId()
            };
            
            // Aggiungi all'inizio dell'array
            stored.unshift(notificationWithTimestamp);
            
            // Limita il numero di notifiche salvate
            if (stored.length > this.options.maxStoredNotifications) {
                stored.splice(this.options.maxStoredNotifications);
            }
            
            this.setItem(this.options.storageKey, JSON.stringify(stored));
            
            // Aggiorna statistiche
            if (this.options.enableStats) {
                this.updateStats('saved', notification.type);
            }
            
            return true;
        } catch (error) {
            console.error('Errore salvataggio notifica:', error);
            return false;
        }
    }
    
    getStoredNotifications() {
        try {
            const data = this.getItem(this.options.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Errore recupero notifiche salvate:', error);
            return [];
        }
    }
    
    removeStoredNotification(notificationId) {
        if (!this.isAvailable) {
            return false;
        }
        
        try {
            const stored = this.getStoredNotifications();
            const filtered = stored.filter(n => n.id !== notificationId);
            
            if (filtered.length !== stored.length) {
                this.setItem(this.options.storageKey, JSON.stringify(filtered));
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Errore rimozione notifica salvata:', error);
            return false;
        }
    }
    
    clearStoredNotifications() {
        if (!this.isAvailable) {
            return false;
        }
        
        try {
            this.removeItem(this.options.storageKey);
            return true;
        } catch (error) {
            console.error('Errore pulizia notifiche salvate:', error);
            return false;
        }
    }
    
    // Gestione impostazioni utente
    saveSettings(settings) {
        if (!this.isAvailable) {
            return false;
        }
        
        try {
            const currentSettings = this.getSettings();
            const mergedSettings = {
                ...currentSettings,
                ...settings,
                updatedAt: new Date().toISOString()
            };
            
            this.setItem(this.options.settingsKey, JSON.stringify(mergedSettings));
            return true;
        } catch (error) {
            console.error('Errore salvataggio impostazioni:', error);
            return false;
        }
    }
    
    getSettings() {
        try {
            const data = this.getItem(this.options.settingsKey);
            return data ? JSON.parse(data) : this.getDefaultSettings();
        } catch (error) {
            console.error('Errore recupero impostazioni:', error);
            return this.getDefaultSettings();
        }
    }
    
    getDefaultSettings() {
        return {
            position: 'top-right',
            maxVisible: 5,
            enableSounds: true,
            soundVolume: 0.5,
            enableAnimations: true,
            autoClose: {
                success: 4000,
                info: 5000,
                warning: 6000,
                error: 0 // Non auto-chiude
            },
            theme: 'auto', // 'light', 'dark', 'auto'
            createdAt: new Date().toISOString()
        };
    }
    
    resetSettings() {
        if (!this.isAvailable) {
            return false;
        }
        
        try {
            this.removeItem(this.options.settingsKey);
            return true;
        } catch (error) {
            console.error('Errore reset impostazioni:', error);
            return false;
        }
    }
    
    // Gestione statistiche
    initializeStats() {
        const stats = this.getStats();
        if (!stats.createdAt) {
            this.saveStats({
                ...stats,
                createdAt: new Date().toISOString()
            });
        }
    }
    
    updateStats(action, type = null) {
        if (!this.options.enableStats || !this.isAvailable) {
            return;
        }
        
        try {
            const stats = this.getStats();
            const today = new Date().toISOString().split('T')[0];
            
            // Inizializza strutture se necessarie
            if (!stats.daily) stats.daily = {};
            if (!stats.daily[today]) stats.daily[today] = {};
            if (!stats.total) stats.total = {};
            if (!stats.byType) stats.byType = {};
            
            // Aggiorna contatori
            stats.daily[today][action] = (stats.daily[today][action] || 0) + 1;
            stats.total[action] = (stats.total[action] || 0) + 1;
            
            if (type) {
                if (!stats.byType[type]) stats.byType[type] = {};
                stats.byType[type][action] = (stats.byType[type][action] || 0) + 1;
            }
            
            stats.lastUpdated = new Date().toISOString();
            
            this.saveStats(stats);
        } catch (error) {
            console.error('Errore aggiornamento statistiche:', error);
        }
    }
    
    getStats() {
        try {
            const data = this.getItem(this.options.statsKey);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('Errore recupero statistiche:', error);
            return {};
        }
    }
    
    saveStats(stats) {
        if (!this.isAvailable) {
            return false;
        }
        
        try {
            this.setItem(this.options.statsKey, JSON.stringify(stats));
            return true;
        } catch (error) {
            console.error('Errore salvataggio statistiche:', error);
            return false;
        }
    }
    
    getStatsReport() {
        const stats = this.getStats();
        const report = {
            totalNotifications: stats.total?.shown || 0,
            totalSaved: stats.total?.saved || 0,
            totalDismissed: stats.total?.dismissed || 0,
            byType: stats.byType || {},
            dailyAverage: 0,
            createdAt: stats.createdAt,
            lastUpdated: stats.lastUpdated
        };
        
        // Calcola media giornaliera
        if (stats.daily && Object.keys(stats.daily).length > 0) {
            const totalDays = Object.keys(stats.daily).length;
            const totalShown = Object.values(stats.daily)
                .reduce((sum, day) => sum + (day.shown || 0), 0);
            report.dailyAverage = Math.round(totalShown / totalDays);
        }
        
        return report;
    }
    
    // Utility per pulizia
    cleanupOldNotifications() {
        if (!this.isAvailable) {
            return;
        }
        
        try {
            const stored = this.getStoredNotifications();
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - this.options.retentionDays);
            
            const filtered = stored.filter(notification => {
                const savedAt = new Date(notification.savedAt);
                return savedAt > cutoffDate;
            });
            
            if (filtered.length !== stored.length) {
                this.setItem(this.options.storageKey, JSON.stringify(filtered));
                console.log(`Rimosse ${stored.length - filtered.length} notifiche vecchie`);
            }
        } catch (error) {
            console.error('Errore pulizia notifiche vecchie:', error);
        }
    }
    
    cleanupOldStats() {
        if (!this.isAvailable || !this.options.enableStats) {
            return;
        }
        
        try {
            const stats = this.getStats();
            if (!stats.daily) return;
            
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - 30); // Mantieni 30 giorni
            const cutoffString = cutoffDate.toISOString().split('T')[0];
            
            const filteredDaily = {};
            Object.keys(stats.daily).forEach(date => {
                if (date >= cutoffString) {
                    filteredDaily[date] = stats.daily[date];
                }
            });
            
            stats.daily = filteredDaily;
            this.saveStats(stats);
        } catch (error) {
            console.error('Errore pulizia statistiche vecchie:', error);
        }
    }
    
    // Export/Import per backup
    exportData() {
        if (!this.isAvailable) {
            return null;
        }
        
        try {
            return {
                notifications: this.getStoredNotifications(),
                settings: this.getSettings(),
                stats: this.getStats(),
                exportedAt: new Date().toISOString(),
                version: '1.0'
            };
        } catch (error) {
            console.error('Errore export dati:', error);
            return null;
        }
    }
    
    importData(data) {
        if (!this.isAvailable || !data) {
            return false;
        }
        
        try {
            if (data.notifications) {
                this.setItem(this.options.storageKey, JSON.stringify(data.notifications));
            }
            
            if (data.settings) {
                this.setItem(this.options.settingsKey, JSON.stringify(data.settings));
            }
            
            if (data.stats && this.options.enableStats) {
                this.setItem(this.options.statsKey, JSON.stringify(data.stats));
            }
            
            return true;
        } catch (error) {
            console.error('Errore import dati:', error);
            return false;
        }
    }
    
    // Utility per storage
    setItem(key, value) {
        if (this.storage instanceof Map) {
            this.storage.set(key, value);
        } else {
            this.storage.setItem(key, value);
        }
    }
    
    getItem(key) {
        if (this.storage instanceof Map) {
            return this.storage.get(key);
        } else {
            return this.storage.getItem(key);
        }
    }
    
    removeItem(key) {
        if (this.storage instanceof Map) {
            this.storage.delete(key);
        } else {
            this.storage.removeItem(key);
        }
    }
    
    generateId() {
        return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Informazioni sistema
    getStorageInfo() {
        if (!this.isAvailable) {
            return { available: false };
        }
        
        try {
            const notifications = this.getStoredNotifications();
            const settings = this.getSettings();
            const stats = this.getStats();
            
            return {
                available: true,
                storageType: this.storage instanceof Map ? 'memory' : 'localStorage',
                notificationsCount: notifications.length,
                hasSettings: Object.keys(settings).length > 0,
                hasStats: Object.keys(stats).length > 0,
                lastCleanup: new Date().toISOString()
            };
        } catch (error) {
            return { available: false, error: error.message };
        }
    }
    
    destroy() {
        // Non rimuoviamo i dati salvati, solo puliamo i riferimenti
        this.storage = null;
        this.isAvailable = false;
    }
}

// Istanza singleton
let persistenceInstance = null;

export const getPersistenceManager = () => {
    if (!persistenceInstance) {
        persistenceInstance = new NotificationPersistence();
    }
    return persistenceInstance;
};

export default NotificationPersistence;