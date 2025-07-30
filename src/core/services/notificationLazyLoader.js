// src/core/services/notificationLazyLoader.js

/**
 * Lazy loading per componenti non critici del sistema notifiche
 * Ottimizza il caricamento iniziale e riduce bundle size
 */

export class NotificationLazyLoader {
    constructor() {
        this.loadedModules = new Map();
        this.loadingPromises = new Map();
        this.preloadQueue = [];
        this.criticalComponents = new Set([
            'NotificationService',
            'NotificationRenderer'
        ]);
        
        // Configurazione lazy loading
        this.config = {
            preloadDelay: 2000, // Preload dopo 2 secondi
            intersectionThreshold: 0.1,
            enablePreloading: true,
            enableIntersectionObserver: 'IntersectionObserver' in window
        };
        
        this.init();
    }
    
    init() {
        // Setup preloading automatico
        if (this.config.enablePreloading) {
            setTimeout(() => {
                this.preloadNonCriticalComponents();
            }, this.config.preloadDelay);
        }
        
        // Setup intersection observer per lazy loading visuale
        if (this.config.enableIntersectionObserver) {
            this.setupIntersectionObserver();
        }
    }
    
    /**
     * Carica modulo in modo lazy con caching
     */
    async loadModule(moduleName, importPath) {
        // Controlla cache
        if (this.loadedModules.has(moduleName)) {
            return this.loadedModules.get(moduleName);
        }
        
        // Controlla se già in caricamento
        if (this.loadingPromises.has(moduleName)) {
            return this.loadingPromises.get(moduleName);
        }
        
        // Avvia caricamento
        const loadingPromise = this.performModuleLoad(moduleName, importPath);
        this.loadingPromises.set(moduleName, loadingPromise);
        
        try {
            const module = await loadingPromise;
            this.loadedModules.set(moduleName, module);
            this.loadingPromises.delete(moduleName);
            return module;
        } catch (error) {
            this.loadingPromises.delete(moduleName);
            throw error;
        }
    }
    
    /**
     * Esegue il caricamento effettivo del modulo
     */
    async performModuleLoad(moduleName, importPath) {
        const startTime = performance.now();
        
        try {
            const module = await import(importPath);
            
            const loadTime = performance.now() - startTime;
            
            // Traccia performance
            this.trackLoadingPerformance(moduleName, loadTime);
            
            return module;
        } catch (error) {
            // Tenta fallback se disponibile
            return this.loadFallback(moduleName);
        }
    }
    
    /**
     * Carica componenti non critici in background
     */
    async preloadNonCriticalComponents() {
        const componentsToPreload = [
            {
                name: 'NotificationVirtualScroller',
                path: './notificationVirtualScroller.js',
                condition: () => this.shouldPreloadVirtualScroller()
            },
            {
                name: 'NotificationAnimationManager',
                path: './notificationAnimationManager.js',
                condition: () => !window.matchMedia('(prefers-reduced-motion: reduce)').matches
            },
            {
                name: 'NotificationEventManager',
                path: './notificationEventManager.js',
                condition: () => true
            },
            {
                name: 'NotificationSoundManager',
                path: './notificationSoundManager.js',
                condition: () => this.shouldPreloadSounds()
            },
            {
                name: 'NotificationPersistence',
                path: './notificationPersistence.js',
                condition: () => 'localStorage' in window
            }
        ];
        
        // Preload con priorità
        for (const component of componentsToPreload) {
            if (component.condition()) {
                this.preloadQueue.push(component);
            }
        }
        
        // Carica in batch per evitare sovraccarico
        await this.processBatchPreload();
    }
    
    /**
     * Processa preload in batch
     */
    async processBatchPreload() {
        const batchSize = 2;
        
        while (this.preloadQueue.length > 0) {
            const batch = this.preloadQueue.splice(0, batchSize);
            
            const promises = batch.map(component => 
                this.loadModule(component.name, component.path)
                    .catch(error => {
                        console.warn(`Preload failed for ${component.name}:`, error);
                        return null;
                    })
            );
            
            await Promise.all(promises);
            
            // Pausa tra batch per non bloccare main thread
            await this.sleep(100);
        }
    }
    
    /**
     * Setup intersection observer per lazy loading visuale
     */
    setupIntersectionObserver() {
        this.intersectionObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.handleElementVisible(entry.target);
                    }
                });
            },
            {
                threshold: this.config.intersectionThreshold,
                rootMargin: '50px'
            }
        );
    }
    
    /**
     * Gestisce elemento diventato visibile
     */
    async handleElementVisible(element) {
        const lazyComponent = element.dataset.lazyComponent;
        if (!lazyComponent) return;
        
        try {
            // Carica componente associato
            await this.loadComponentForElement(element, lazyComponent);
            
            // Stop observing
            this.intersectionObserver.unobserve(element);
        } catch (error) {
            console.error(`Failed to load component for visible element:`, error);
        }
    }
    
    /**
     * Carica componente per elemento specifico
     */
    async loadComponentForElement(element, componentName) {
        const componentMap = {
            'advanced-animations': {
                module: 'NotificationAnimationManager',
                path: './notificationAnimationManager.js'
            },
            'virtual-scroller': {
                module: 'NotificationVirtualScroller',
                path: './notificationVirtualScroller.js'
            },
            'sound-effects': {
                module: 'NotificationSoundManager',
                path: './notificationSoundManager.js'
            }
        };
        
        const config = componentMap[componentName];
        if (!config) return;
        
        const module = await this.loadModule(config.module, config.path);
        
        // Inizializza componente se necessario
        if (module && module.default && typeof module.default.init === 'function') {
            module.default.init(element);
        }
    }
    
    /**
     * Lazy loading condizionale per NotificationContainer
     */
    async loadNotificationContainer(options = {}) {
        // Determina quale versione caricare
        const containerType = this.determineContainerType(options);
        
        switch (containerType) {
            case 'virtual':
                return this.loadModule(
                    'NotificationVirtualContainer',
                    '../../shared/components/notifications/NotificationVirtualContainer.js'
                );
                
            case 'standard':
            default:
                return this.loadModule(
                    'NotificationContainer',
                    '../../shared/components/notifications/NotificationContainer.js'
                );
        }
    }
    
    /**
     * Determina tipo di container necessario
     */
    determineContainerType(options) {
        // Usa virtual scrolling se molte notifiche previste
        if (options.expectedNotifications > 10) {
            return 'virtual';
        }
        
        // Usa virtual scrolling su dispositivi con memoria limitata
        if (navigator.deviceMemory && navigator.deviceMemory < 4) {
            return 'virtual';
        }
        
        return 'standard';
    }
    
    /**
     * Carica renderer ottimizzato
     */
    async loadOptimizedRenderer(notificationCount = 0) {
        if (notificationCount > 20) {
            // Renderer per molte notifiche
            return this.loadModule(
                'NotificationBatchRenderer',
                './notificationBatchRenderer.js'
            );
        } else {
            // Renderer standard
            return this.loadModule(
                'NotificationRenderer',
                './notificationRenderer.js'
            );
        }
    }
    
    /**
     * Condizioni per preload
     */
    shouldPreloadVirtualScroller() {
        // Preload se dispositivo con poca memoria
        if (navigator.deviceMemory && navigator.deviceMemory < 4) {
            return true;
        }
        
        // Preload se molte notifiche nella storia
        const notificationHistory = localStorage.getItem('notification_history');
        if (notificationHistory) {
            try {
                const history = JSON.parse(notificationHistory);
                return history.length > 50;
            } catch (e) {
                return false;
            }
        }
        
        return false;
    }
    
    shouldPreloadSounds() {
        // Preload solo se audio supportato e non in modalità silenziosa
        return 'Audio' in window && 
               !navigator.userAgent.includes('Mobile') &&
               !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    
    /**
     * Fallback per moduli che falliscono il caricamento
     */
    async loadFallback(moduleName) {
        const fallbacks = {
            'NotificationAnimationManager': () => ({
                animateEntrance: (el) => { el.style.opacity = '1'; return Promise.resolve(); },
                animateExit: (el) => { el.style.opacity = '0'; return Promise.resolve(); },
                destroy: () => {}
            }),
            'NotificationVirtualScroller': () => ({
                setNotifications: () => {},
                destroy: () => {}
            }),
            'NotificationSoundManager': () => ({
                playSound: () => {},
                destroy: () => {}
            })
        };
        
        const fallback = fallbacks[moduleName];
        if (fallback) {
            console.warn(`Using fallback for ${moduleName}`);
            return { default: fallback() };
        }
        
        throw new Error(`No fallback available for ${moduleName}`);
    }
    
    /**
     * Traccia performance di caricamento
     */
    trackLoadingPerformance(moduleName, loadTime) {
        if (!this.performanceStats) {
            this.performanceStats = new Map();
        }
        
        this.performanceStats.set(moduleName, {
            loadTime,
            timestamp: Date.now(),
            cached: this.loadedModules.has(moduleName)
        });
    }
    
    /**
     * Osserva elemento per lazy loading
     */
    observeElement(element, componentName) {
        if (!this.intersectionObserver || !element) return;
        
        element.dataset.lazyComponent = componentName;
        this.intersectionObserver.observe(element);
    }
    
    /**
     * Stop osservazione elemento
     */
    unobserveElement(element) {
        if (this.intersectionObserver && element) {
            this.intersectionObserver.unobserve(element);
        }
    }
    
    /**
     * Preload specifico per feature
     */
    async preloadForFeature(featureName) {
        const featureModules = {
            'advanced-notifications': [
                'NotificationAnimationManager',
                'NotificationSoundManager'
            ],
            'bulk-notifications': [
                'NotificationVirtualScroller',
                'NotificationBatchRenderer'
            ],
            'persistent-notifications': [
                'NotificationPersistence',
                'NotificationStorage'
            ]
        };
        
        const modules = featureModules[featureName];
        if (!modules) return;
        
        const promises = modules.map(moduleName => 
            this.loadModule(moduleName, this.getModulePath(moduleName))
                .catch(error => {
                    console.warn(`Failed to preload ${moduleName} for ${featureName}:`, error);
                    return null;
                })
        );
        
        await Promise.all(promises);
    }
    
    /**
     * Ottiene path del modulo
     */
    getModulePath(moduleName) {
        const paths = {
            'NotificationAnimationManager': './notificationAnimationManager.js',
            'NotificationVirtualScroller': './notificationVirtualScroller.js',
            'NotificationSoundManager': './notificationSoundManager.js',
            'NotificationBatchRenderer': './notificationBatchRenderer.js',
            'NotificationPersistence': './notificationPersistence.js',
            'NotificationStorage': './notificationStorage.js'
        };
        
        return paths[moduleName] || `./${moduleName.toLowerCase()}.js`;
    }
    
    /**
     * Utility sleep
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Statistiche lazy loading
     */
    getStats() {
        return {
            loadedModules: Array.from(this.loadedModules.keys()),
            loadingPromises: Array.from(this.loadingPromises.keys()),
            preloadQueueSize: this.preloadQueue.length,
            performanceStats: this.performanceStats ? 
                Object.fromEntries(this.performanceStats) : {},
            config: this.config
        };
    }
    
    /**
     * Cleanup
     */
    destroy() {
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
        }
        
        // Cancella preload in corso
        this.preloadQueue = [];
        
        // Cleanup moduli caricati se necessario
        for (const [name, module] of this.loadedModules) {
            if (module.default && typeof module.default.destroy === 'function') {
                try {
                    module.default.destroy();
                } catch (error) {
                    console.warn(`Error destroying module ${name}:`, error);
                }
            }
        }
        
        this.loadedModules.clear();
        this.loadingPromises.clear();
    }
}

// Istanza singleton
export const notificationLazyLoader = new NotificationLazyLoader();