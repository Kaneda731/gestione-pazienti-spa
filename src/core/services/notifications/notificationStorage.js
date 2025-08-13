/**
 * NotificationStorage - Sistema di storage avanzato per notifiche
 * Gestisce storage multi-livello con fallback e sincronizzazione
 */

class NotificationStorage {
    constructor(options = {}) {
        this.options = {
            primaryStorage: 'localStorage',
            fallbackStorage: 'sessionStorage',
            memoryFallback: true,
            encryptionKey: null,
            compressionEnabled: false,
            syncEnabled: false,
            maxRetries: 3,
            ...options
        };
        
        this.storageEngines = new Map();
        this.activeEngine = null;
        this.memoryStore = new Map();
        this.syncQueue = [];
        
        this.init();
    }
    
    async init() {
        // Inizializza engines di storage disponibili
        await this.initializeStorageEngines();
        
        // Seleziona engine attivo
        this.selectActiveEngine();
        
        // Avvia sincronizzazione se abilitata
        if (this.options.syncEnabled) {
            this.startSyncProcess();
        }
        
        // Setup event listeners per storage events
        this.setupStorageEventListeners();
    }
    
    async initializeStorageEngines() {
        // LocalStorage
        if (this.isStorageAvailable('localStorage')) {
            this.storageEngines.set('localStorage', {
                type: 'localStorage',
                engine: localStorage,
                available: true,
                persistent: true,
                capacity: this.getStorageCapacity('localStorage')
            });
        }
        
        // SessionStorage
        if (this.isStorageAvailable('sessionStorage')) {
            this.storageEngines.set('sessionStorage', {
                type: 'sessionStorage',
                engine: sessionStorage,
                available: true,
                persistent: false,
                capacity: this.getStorageCapacity('sessionStorage')
            });
        }
        
        // IndexedDB (per storage avanzato)
        if (this.isIndexedDBAvailable()) {
            try {
                const idbEngine = await this.initializeIndexedDB();
                this.storageEngines.set('indexedDB', {
                    type: 'indexedDB',
                    engine: idbEngine,
                    available: true,
                    persistent: true,
                    capacity: Infinity // Praticamente illimitato
                });
            } catch (error) {
                console.warn('IndexedDB non disponibile:', error);
            }
        }
        
        // Memory storage (sempre disponibile come fallback)
        this.storageEngines.set('memory', {
            type: 'memory',
            engine: this.memoryStore,
            available: true,
            persistent: false,
            capacity: Infinity
        });
    }
    
    selectActiveEngine() {
        // Prova primary storage
        if (this.storageEngines.has(this.options.primaryStorage)) {
            this.activeEngine = this.storageEngines.get(this.options.primaryStorage);
            return;
        }
        
        // Prova fallback storage
        if (this.storageEngines.has(this.options.fallbackStorage)) {
            this.activeEngine = this.storageEngines.get(this.options.fallbackStorage);
            return;
        }
        
        // Usa memory come ultimo fallback
        if (this.options.memoryFallback) {
            this.activeEngine = this.storageEngines.get('memory');
            console.warn('Usando memory storage come fallback');
        }
    }
    
    isStorageAvailable(type) {
        try {
            const storage = window[type];
            const testKey = '__storage_test__';
            storage.setItem(testKey, 'test');
            storage.removeItem(testKey);
            return true;
        } catch (error) {
            return false;
        }
    }
    
    isIndexedDBAvailable() {
        return !!(window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB);
    }
    
    async initializeIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('NotificationStorage', 1);
            
            request.onerror = () => reject(request.error);
            
            request.onsuccess = () => {
                const db = request.result;
                resolve({
                    db,
                    get: (key) => this.idbGet(db, key),
                    set: (key, value) => this.idbSet(db, key, value),
                    remove: (key) => this.idbRemove(db, key),
                    clear: () => this.idbClear(db)
                });
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('notifications')) {
                    db.createObjectStore('notifications', { keyPath: 'key' });
                }
            };
        });
    }
    
    async idbGet(db, key) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['notifications'], 'readonly');
            const store = transaction.objectStore('notifications');
            const request = store.get(key);
            
            request.onsuccess = () => {
                resolve(request.result ? request.result.value : null);
            };
            request.onerror = () => reject(request.error);
        });
    }
    
    async idbSet(db, key, value) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['notifications'], 'readwrite');
            const store = transaction.objectStore('notifications');
            const request = store.put({ key, value, timestamp: Date.now() });
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
    
    async idbRemove(db, key) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['notifications'], 'readwrite');
            const store = transaction.objectStore('notifications');
            const request = store.delete(key);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
    
    async idbClear(db) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['notifications'], 'readwrite');
            const store = transaction.objectStore('notifications');
            const request = store.clear();
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
    
    getStorageCapacity(type) {
        try {
            const storage = window[type];
            let total = 0;
            for (let key in storage) {
                if (storage.hasOwnProperty(key)) {
                    total += storage[key].length + key.length;
                }
            }
            return total;
        } catch (error) {
            return 0;
        }
    }
    
    // API principale
    async set(key, value, options = {}) {
        const processedValue = await this.processValueForStorage(value, options);
        
        for (let retry = 0; retry < this.options.maxRetries; retry++) {
            try {
                await this.setWithEngine(this.activeEngine, key, processedValue);
                
                // Aggiungi alla coda di sync se abilitato
                if (this.options.syncEnabled) {
                    this.queueForSync('set', key, processedValue);
                }
                
                return true;
            } catch (error) {
                console.warn(`Tentativo ${retry + 1} fallito per set(${key}):`, error);
                
                if (retry === this.options.maxRetries - 1) {
                    // Ultimo tentativo fallito, prova fallback
                    return this.setWithFallback(key, processedValue);
                }
            }
        }
        
        return false;
    }
    
    async get(key, options = {}) {
        for (let retry = 0; retry < this.options.maxRetries; retry++) {
            try {
                const rawValue = await this.getWithEngine(this.activeEngine, key);
                if (rawValue !== null) {
                    return this.processValueFromStorage(rawValue, options);
                }
                return null;
            } catch (error) {
                console.warn(`Tentativo ${retry + 1} fallito per get(${key}):`, error);
                
                if (retry === this.options.maxRetries - 1) {
                    // Ultimo tentativo fallito, prova fallback
                    return this.getWithFallback(key, options);
                }
            }
        }
        
        return null;
    }
    
    async remove(key) {
        for (let retry = 0; retry < this.options.maxRetries; retry++) {
            try {
                await this.removeWithEngine(this.activeEngine, key);
                
                // Aggiungi alla coda di sync se abilitato
                if (this.options.syncEnabled) {
                    this.queueForSync('remove', key);
                }
                
                return true;
            } catch (error) {
                console.warn(`Tentativo ${retry + 1} fallito per remove(${key}):`, error);
                
                if (retry === this.options.maxRetries - 1) {
                    return this.removeWithFallback(key);
                }
            }
        }
        
        return false;
    }
    
    async clear() {
        try {
            await this.clearWithEngine(this.activeEngine);
            
            // Aggiungi alla coda di sync se abilitato
            if (this.options.syncEnabled) {
                this.queueForSync('clear');
            }
            
            return true;
        } catch (error) {
            console.error('Errore clear storage:', error);
            return false;
        }
    }
    
    // Operazioni con engine specifico
    async setWithEngine(engine, key, value) {
        if (engine.type === 'indexedDB') {
            return engine.engine.set(key, value);
        } else if (engine.type === 'memory') {
            engine.engine.set(key, value);
            return Promise.resolve();
        } else {
            engine.engine.setItem(key, JSON.stringify(value));
            return Promise.resolve();
        }
    }
    
    async getWithEngine(engine, key) {
        if (engine.type === 'indexedDB') {
            return engine.engine.get(key);
        } else if (engine.type === 'memory') {
            return Promise.resolve(engine.engine.get(key) || null);
        } else {
            const item = engine.engine.getItem(key);
            return Promise.resolve(item ? JSON.parse(item) : null);
        }
    }
    
    async removeWithEngine(engine, key) {
        if (engine.type === 'indexedDB') {
            return engine.engine.remove(key);
        } else if (engine.type === 'memory') {
            engine.engine.delete(key);
            return Promise.resolve();
        } else {
            engine.engine.removeItem(key);
            return Promise.resolve();
        }
    }
    
    async clearWithEngine(engine) {
        if (engine.type === 'indexedDB') {
            return engine.engine.clear();
        } else if (engine.type === 'memory') {
            engine.engine.clear();
            return Promise.resolve();
        } else {
            engine.engine.clear();
            return Promise.resolve();
        }
    }
    
    // Fallback operations
    async setWithFallback(key, value) {
        for (const [name, engine] of this.storageEngines) {
            if (engine !== this.activeEngine && engine.available) {
                try {
                    await this.setWithEngine(engine, key, value);
                    console.warn(`Fallback a ${name} per set(${key})`);
                    return true;
                } catch (error) {
                    continue;
                }
            }
        }
        return false;
    }
    
    async getWithFallback(key, options) {
        for (const [name, engine] of this.storageEngines) {
            if (engine !== this.activeEngine && engine.available) {
                try {
                    const rawValue = await this.getWithEngine(engine, key);
                    if (rawValue !== null) {
                        console.warn(`Fallback a ${name} per get(${key})`);
                        return this.processValueFromStorage(rawValue, options);
                    }
                } catch (error) {
                    continue;
                }
            }
        }
        return null;
    }
    
    async removeWithFallback(key) {
        for (const [name, engine] of this.storageEngines) {
            if (engine !== this.activeEngine && engine.available) {
                try {
                    await this.removeWithEngine(engine, key);
                    console.warn(`Fallback a ${name} per remove(${key})`);
                    return true;
                } catch (error) {
                    continue;
                }
            }
        }
        return false;
    }
    
    // Processamento valori
    async processValueForStorage(value, options) {
        let processed = {
            data: value,
            timestamp: Date.now(),
            version: '1.0'
        };
        
        // Compressione se abilitata
        if (this.options.compressionEnabled && options.compress !== false) {
            processed.compressed = true;
            processed.data = await this.compressData(processed.data);
        }
        
        // Crittografia se abilitata
        if (this.options.encryptionKey && options.encrypt !== false) {
            processed.encrypted = true;
            processed.data = await this.encryptData(processed.data);
        }
        
        return processed;
    }
    
    async processValueFromStorage(rawValue, options) {
        if (!rawValue || typeof rawValue !== 'object') {
            return rawValue;
        }
        
        let processed = rawValue.data;
        
        // Decrittografia se necessaria
        if (rawValue.encrypted && this.options.encryptionKey) {
            processed = await this.decryptData(processed);
        }
        
        // Decompressione se necessaria
        if (rawValue.compressed) {
            processed = await this.decompressData(processed);
        }
        
        return processed;
    }
    
    async compressData(data) {
        // Implementazione semplificata - in produzione usare libreria dedicata
        try {
            const jsonString = JSON.stringify(data);
            return btoa(jsonString); // Base64 encoding as placeholder
        } catch (error) {
            console.warn('Errore compressione:', error);
            return data;
        }
    }
    
    async decompressData(compressedData) {
        try {
            const jsonString = atob(compressedData);
            return JSON.parse(jsonString);
        } catch (error) {
            console.warn('Errore decompressione:', error);
            return compressedData;
        }
    }
    
    async encryptData(data) {
        // Placeholder implementation - use Web Crypto API in production
        console.warn('Crittografia non implementata in questa versione');
        return data;
    }
    
    async decryptData(encryptedData) {
        // Placeholder implementation
        console.warn('Decrittografia non implementata in questa versione');
        return encryptedData;
    }
    
    // Sincronizzazione
    queueForSync(operation, key, value = null) {
        this.syncQueue.push({
            operation,
            key,
            value,
            timestamp: Date.now()
        });
    }
    
    startSyncProcess() {
        setInterval(() => {
            this.processSyncQueue();
        }, 5000); // Sync ogni 5 secondi
    }
    
    async processSyncQueue() {
        if (this.syncQueue.length === 0) {
            return;
        }
        
        const batch = this.syncQueue.splice(0, 10); // Processa max 10 operazioni
        
        for (const operation of batch) {
            try {
                await this.syncOperation(operation);
            } catch (error) {
                console.warn('Errore sync operazione:', error);
                // Rimetti in coda per retry
                this.syncQueue.push(operation);
            }
        }
    }
    
    async syncOperation(operation) {
        // Sincronizza con tutti gli engines disponibili
        for (const [name, engine] of this.storageEngines) {
            if (engine.available && engine !== this.activeEngine) {
                try {
                    switch (operation.operation) {
                        case 'set':
                            await this.setWithEngine(engine, operation.key, operation.value);
                            break;
                        case 'remove':
                            await this.removeWithEngine(engine, operation.key);
                            break;
                        case 'clear':
                            await this.clearWithEngine(engine);
                            break;
                    }
                } catch (error) {
                    // Ignora errori di sync per engines secondari
                }
            }
        }
    }
    
    // Event listeners
    setupStorageEventListeners() {
        window.addEventListener('storage', (event) => {
            this.handleStorageEvent(event);
        });
        
        window.addEventListener('beforeunload', () => {
            this.handleBeforeUnload();
        });
    }
    
    handleStorageEvent(event) {
        // Gestisci cambiamenti storage da altre tab
        if (event.key && event.key.startsWith('notification-')) {
            const customEvent = new CustomEvent('notification-storage-changed', {
                detail: {
                    key: event.key,
                    oldValue: event.oldValue,
                    newValue: event.newValue,
                    storageArea: event.storageArea
                }
            });
            document.dispatchEvent(customEvent);
        }
    }
    
    handleBeforeUnload() {
        // Flush sync queue prima di chiudere
        if (this.syncQueue.length > 0) {
            this.processSyncQueue();
        }
    }
    
    // Utility e info
    getStorageInfo() {
        const info = {
            activeEngine: this.activeEngine?.type || 'none',
            availableEngines: [],
            syncQueueLength: this.syncQueue.length,
            totalCapacity: 0,
            usedCapacity: 0
        };
        
        for (const [name, engine] of this.storageEngines) {
            info.availableEngines.push({
                name,
                type: engine.type,
                available: engine.available,
                persistent: engine.persistent,
                capacity: engine.capacity
            });
            
            if (engine.available) {
                info.totalCapacity += engine.capacity;
            }
        }
        
        return info;
    }
    
    async getKeys() {
        try {
            if (this.activeEngine.type === 'memory') {
                return Array.from(this.activeEngine.engine.keys());
            } else if (this.activeEngine.type === 'indexedDB') {
                // IndexedDB implementation
                return []; // Placeholder
            } else {
                return Object.keys(this.activeEngine.engine);
            }
        } catch (error) {
            console.error('Errore recupero chiavi:', error);
            return [];
        }
    }
    
    async size() {
        const keys = await this.getKeys();
        return keys.length;
    }
    
    destroy() {
        // Cleanup
        this.syncQueue = [];
        this.storageEngines.clear();
        this.activeEngine = null;
        this.memoryStore.clear();
    }
}

// Istanza singleton
let storageInstance = null;

const getStorageManager = () => {
    if (!storageInstance) {
        storageInstance = new NotificationStorage();
    }
    return storageInstance;
};
