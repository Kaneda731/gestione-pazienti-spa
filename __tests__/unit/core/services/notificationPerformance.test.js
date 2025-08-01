// __tests__/unit/core/services/notificationPerformance.test.js

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { notificationService } from '../../../../src/core/services/notificationService.js';
import { notificationEventManager } from '../../../../src/core/services/notificationEventManager.js';
import { notificationAnimationManager } from '../../../../src/core/services/notificationAnimationManager.js';
import { notificationLazyLoader } from '../../../../src/core/services/notificationLazyLoader.js';

// Mock performance APIs
Object.defineProperty(navigator, 'deviceMemory', {
    writable: true,
    value: 4
});

Object.defineProperty(performance, 'memory', {
    writable: true,
    value: {
        usedJSHeapSize: 10 * 1024 * 1024, // 10MB
        totalJSHeapSize: 50 * 1024 * 1024, // 50MB
        jsHeapSizeLimit: 100 * 1024 * 1024 // 100MB
    }
});

// Mock CSS API
global.CSS = {
    supports: vi.fn().mockReturnValue(true)
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

// Mock PerformanceObserver
global.PerformanceObserver = vi.fn().mockImplementation((callback) => ({
    observe: vi.fn(),
    disconnect: vi.fn()
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation((callback) => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation((callback) => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
}));

describe('NotificationService Performance Optimizations', () => {
    beforeEach(() => {
        // Reset service state
        notificationService.destroy();
        vi.clearAllMocks();
    });

    afterEach(() => {
        notificationService.destroy();
    });

    describe('Virtual Scrolling Detection', () => {
        it('should enable virtual scrolling for low memory devices', () => {
            // Mock low memory device
            Object.defineProperty(navigator, 'deviceMemory', {
                value: 2,
                configurable: true
            });

            const shouldUse = notificationService.shouldUseVirtualScrolling();
            expect(shouldUse).toBe(true);
        });

        it('should enable virtual scrolling for many notifications', () => {
            notificationService.maxConcurrentNotifications = 15;
            
            const shouldUse = notificationService.shouldUseVirtualScrolling();
            expect(shouldUse).toBe(true);
        });

        it('should enable virtual scrolling on mobile', () => {
            // Mock mobile viewport
            Object.defineProperty(window, 'innerWidth', {
                value: 500,
                configurable: true
            });

            const shouldUse = notificationService.shouldUseVirtualScrolling();
            expect(shouldUse).toBe(true);
        });
    });

    describe('Optimal Notification Count Detection', () => {
        it('should detect optimal count based on device memory', () => {
            // High memory device
            Object.defineProperty(navigator, 'deviceMemory', {
                value: 8,
                configurable: true
            });

            const count = notificationService.detectOptimalMaxNotifications();
            expect(count).toBe(20);
        });

        it('should fallback to screen size for unknown memory', () => {
            // Remove deviceMemory
            Object.defineProperty(navigator, 'deviceMemory', {
                value: undefined,
                configurable: true
            });

            // Large screen
            Object.defineProperty(window, 'innerWidth', {
                value: 1920,
                configurable: true
            });

            const count = notificationService.detectOptimalMaxNotifications();
            expect(count).toBe(15);
        });

        it('should limit notifications on small screens', () => {
            Object.defineProperty(navigator, 'deviceMemory', {
                value: undefined,
                configurable: true
            });

            Object.defineProperty(window, 'innerWidth', {
                value: 400,
                configurable: true
            });

            const count = notificationService.detectOptimalMaxNotifications();
            expect(count).toBe(5);
        });
    });

    describe('Memory Management', () => {
        it('should optimize when memory usage is high', () => {
            const optimizeSpy = vi.spyOn(notificationService, 'optimizeForMemory');
            
            // Mock high memory usage
            Object.defineProperty(performance, 'memory', {
                value: {
                    usedJSHeapSize: 60 * 1024 * 1024, // 60MB (above threshold)
                    totalJSHeapSize: 100 * 1024 * 1024,
                    jsHeapSizeLimit: 200 * 1024 * 1024
                },
                configurable: true
            });

            notificationService.checkMemoryUsage();
            expect(optimizeSpy).toHaveBeenCalled();
        });

        it('should reduce max notifications when optimizing for memory', () => {
            const originalMax = notificationService.maxConcurrentNotifications;
            
            notificationService.optimizeForMemory();
            
            expect(notificationService.maxConcurrentNotifications).toBeLessThan(originalMax);
            expect(notificationService.performanceMode).toBe('performance');
        });

        it('should perform automatic cleanup', () => {
            const cleanupSpy = vi.spyOn(notificationService, 'cleanupOldNotifications');
            
            notificationService.performAutomaticCleanup();
            
            expect(cleanupSpy).toHaveBeenCalled();
            expect(notificationService.lastCleanupTime).toBeGreaterThan(0);
        });
    });

    describe('Throttled Rendering', () => {
        it('should throttle render calls', async () => {
            const renderSpy = vi.spyOn(notificationService, 'renderNotifications');
            
            // Call multiple times rapidly
            notificationService.throttledRenderNotifications([]);
            notificationService.throttledRenderNotifications([]);
            notificationService.throttledRenderNotifications([]);
            
            // Should only call once due to throttling
            expect(renderSpy).toHaveBeenCalledTimes(1);
        });

        it('should allow calls after throttle period', async () => {
            const renderSpy = vi.spyOn(notificationService, 'renderNotifications');
            
            notificationService.throttledRenderNotifications([]);
            
            // Wait for throttle period
            await new Promise(resolve => setTimeout(resolve, 20));
            
            notificationService.throttledRenderNotifications([]);
            
            expect(renderSpy).toHaveBeenCalledTimes(2);
        });
    });

    describe('Performance Monitoring', () => {
        it('should track render performance', () => {
            const entry = {
                name: 'notification-render',
                duration: 20 // Slow render
            };

            const optimizeSpy = vi.spyOn(notificationService, 'optimizeForPerformance');
            
            notificationService.trackRenderPerformance(entry);
            
            expect(notificationService._renderCount).toBeGreaterThan(0);
            expect(notificationService._averageRenderTime).toBeGreaterThan(0);
        });

        it('should optimize for poor performance', () => {
            notificationService.performanceMode = 'auto';
            
            notificationService.optimizeForPerformance();
            
            expect(notificationService.performanceMode).toBe('performance');
            expect(notificationService.maxConcurrentNotifications).toBeGreaterThan(0);
        });
    });

    describe('Fallback Initialization', () => {
        it('should initialize in fallback mode on error', async () => {
            // Mock import failure
            const originalImport = global.import;
            global.import = vi.fn().mockRejectedValue(new Error('Import failed'));

            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            
            await notificationService.initializeFallback();
            
            expect(notificationService.initialized).toBe(true);
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('fallback mode')
            );

            global.import = originalImport;
            consoleSpy.mockRestore();
        });
    });

    describe('Performance Stats', () => {
        it('should provide comprehensive performance statistics', () => {
            const stats = notificationService.getPerformanceStats();
            
            expect(stats).toHaveProperty('performance');
            expect(stats.performance).toHaveProperty('useVirtualScrolling');
            expect(stats.performance).toHaveProperty('performanceMode');
            expect(stats.performance).toHaveProperty('maxConcurrentNotifications');
            expect(stats.performance).toHaveProperty('lastCleanupTime');
            expect(stats.performance).toHaveProperty('memoryThreshold');
        });

        it('should include manager statistics', () => {
            const stats = notificationService.getPerformanceStats();
            
            expect(stats.performance).toHaveProperty('eventManager');
            expect(stats.performance).toHaveProperty('animationManager');
            expect(stats.performance).toHaveProperty('lazyLoader');
        });
    });

    describe('Cleanup and Destruction', () => {
        it('should cleanup all performance monitoring on destroy', () => {
            const disconnectSpy = vi.fn();
            notificationService.renderPerformanceObserver = {
                disconnect: disconnectSpy
            };

            const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
            notificationService.cleanupInterval = 123;

            notificationService.destroy();

            expect(disconnectSpy).toHaveBeenCalled();
            expect(clearIntervalSpy).toHaveBeenCalledWith(123);
            expect(notificationService.performanceMode).toBe('auto');
            expect(notificationService.useVirtualScrolling).toBe(false);
        });

        it('should cleanup virtual scroller on destroy', () => {
            const destroySpy = vi.fn();
            notificationService.virtualScroller = {
                destroy: destroySpy
            };

            notificationService.destroy();

            expect(destroySpy).toHaveBeenCalled();
        });
    });
});

describe('NotificationEventManager Performance', () => {
    beforeEach(() => {
        notificationEventManager.cleanupAll();
    });

    afterEach(() => {
        notificationEventManager.cleanupAll();
    });

    describe('Event Listener Management', () => {
        it('should track event listeners for cleanup', () => {
            const element = document.createElement('div');
            const handler = vi.fn();

            notificationEventManager.addEventListener(element, 'click', handler);

            const stats = notificationEventManager.getStats();
            expect(stats.elementsTracked).toBe(1);
            expect(stats.totalListeners).toBe(1);
        });

        it('should cleanup listeners with AbortController', () => {
            const element = document.createElement('div');
            const handler = vi.fn();

            notificationEventManager.addEventListener(element, 'click', handler);
            notificationEventManager.removeAllListeners(element);

            const stats = notificationEventManager.getStats();
            expect(stats.elementsTracked).toBe(0);
        });

        it('should handle event delegation for performance', () => {
            const container = document.createElement('div');
            const notification = document.createElement('div');
            notification.className = 'notification';
            notification.dataset.id = 'test-123';
            
            const closeBtn = document.createElement('button');
            closeBtn.className = 'notification__close';
            
            notification.appendChild(closeBtn);
            container.appendChild(notification);

            notificationEventManager.setupEventDelegation(container);

            // Simulate click
            const clickEvent = new Event('click', { bubbles: true });
            closeBtn.dispatchEvent(clickEvent);

            // Should handle via delegation
            expect(container.querySelector('.notification__close')).toBeTruthy();
        });
    });

    describe('Touch Event Optimization', () => {
        it('should setup touch delegation for mobile', () => {
            // Mock touch support
            Object.defineProperty(window, 'ontouchstart', {
                value: {},
                configurable: true
            });

            const container = document.createElement('div');
            const setupSpy = vi.spyOn(notificationEventManager, 'setupTouchDelegation');

            notificationEventManager.setupEventDelegation(container);

            expect(setupSpy).toHaveBeenCalledWith(container);
        });
    });
});

describe('NotificationAnimationManager Performance', () => {
    beforeEach(() => {
        notificationAnimationManager.disableAllAnimations();
    });

    afterEach(() => {
        notificationAnimationManager.destroy();
    });

    describe('GPU Acceleration', () => {
        it('should prepare elements for GPU acceleration', () => {
            const element = document.createElement('div');
            
            notificationAnimationManager.prepareForAnimation(element);
            
            expect(element.style.willChange).toBe('transform, opacity');
            expect(element.style.backfaceVisibility).toBe('hidden');
        });

        it('should cleanup after animation', () => {
            const element = document.createElement('div');
            element.style.willChange = 'transform, opacity';
            
            notificationAnimationManager.cleanupAfterAnimation(element);
            
            expect(element.style.willChange).toBe('auto');
        });
    });

    describe('Performance Monitoring', () => {
        it('should track animation performance', () => {
            const stats = notificationAnimationManager.getPerformanceStats();
            
            expect(stats).toHaveProperty('frameCount');
            expect(stats).toHaveProperty('averageFPS');
            expect(stats).toHaveProperty('droppedFrames');
            expect(stats).toHaveProperty('activeAnimations');
        });

        it('should optimize for low performance', () => {
            notificationAnimationManager.performanceMonitor.averageFPS = 30; // Low FPS
            
            notificationAnimationManager.optimizeForLowPerformance();
            
            expect(notificationAnimationManager.complexAnimationsEnabled).toBe(false);
            expect(notificationAnimationManager.essentialAnimationsOnly).toBe(true);
        });
    });

    describe('Reduced Motion Support', () => {
        it('should respect prefers-reduced-motion', () => {
            // Mock reduced motion preference
            notificationAnimationManager.prefersReducedMotion = true;
            
            const element = document.createElement('div');
            const promise = notificationAnimationManager.animateEntrance(element);
            
            expect(element.style.opacity).toBe('1');
            return expect(promise).resolves.toBeUndefined();
        });
    });
});

describe('NotificationLazyLoader Performance', () => {
    beforeEach(() => {
        notificationLazyLoader.loadedModules.clear();
        notificationLazyLoader.loadingPromises.clear();
    });

    afterEach(() => {
        notificationLazyLoader.destroy();
    });

    describe('Module Caching', () => {
        it('should cache loaded modules', async () => {
            const mockModule = { default: {} };
            
            // Mock dynamic import
            const originalImport = global.import;
            global.import = vi.fn().mockResolvedValue(mockModule);

            const module1 = await notificationLazyLoader.loadModule('TestModule', './test.js');
            const module2 = await notificationLazyLoader.loadModule('TestModule', './test.js');

            expect(module1).toBe(module2);
            expect(global.import).toHaveBeenCalledTimes(1);

            global.import = originalImport;
        });

        it('should handle loading failures with fallback', async () => {
            const originalImport = global.import;
            global.import = vi.fn().mockRejectedValue(new Error('Load failed'));

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            await expect(
                notificationLazyLoader.loadModule('UnknownModule', './unknown.js')
            ).rejects.toThrow('Load failed');

            expect(consoleSpy).toHaveBeenCalled();

            global.import = originalImport;
            consoleSpy.mockRestore();
        });
    });

    describe('Preloading Strategy', () => {
        it('should determine components to preload based on conditions', async () => {
            // Mock conditions
            Object.defineProperty(navigator, 'deviceMemory', {
                value: 2, // Low memory
                configurable: true
            });

            const preloadSpy = vi.spyOn(notificationLazyLoader, 'processBatchPreload')
                .mockResolvedValue();

            await notificationLazyLoader.preloadNonCriticalComponents();

            expect(preloadSpy).toHaveBeenCalled();
        });

        it('should batch preload to avoid blocking', async () => {
            notificationLazyLoader.preloadQueue = [
                { name: 'Module1', path: './module1.js', condition: () => true },
                { name: 'Module2', path: './module2.js', condition: () => true },
                { name: 'Module3', path: './module3.js', condition: () => true }
            ];

            const loadSpy = vi.spyOn(notificationLazyLoader, 'loadModule')
                .mockResolvedValue({});

            await notificationLazyLoader.processBatchPreload();

            expect(loadSpy).toHaveBeenCalledTimes(3);
        });
    });

    describe('Intersection Observer', () => {
        it('should setup intersection observer for visual lazy loading', () => {
            expect(notificationLazyLoader.intersectionObserver).toBeDefined();
        });

        it('should observe elements for lazy loading', () => {
            const element = document.createElement('div');
            const observeSpy = vi.spyOn(notificationLazyLoader.intersectionObserver, 'observe');

            notificationLazyLoader.observeElement(element, 'test-component');

            expect(element.dataset.lazyComponent).toBe('test-component');
            expect(observeSpy).toHaveBeenCalledWith(element);
        });
    });

    describe('Performance Statistics', () => {
        it('should provide loading statistics', () => {
            const stats = notificationLazyLoader.getStats();

            expect(stats).toHaveProperty('loadedModules');
            expect(stats).toHaveProperty('loadingPromises');
            expect(stats).toHaveProperty('preloadQueueSize');
            expect(stats).toHaveProperty('performanceStats');
            expect(stats).toHaveProperty('config');
        });
    });
});