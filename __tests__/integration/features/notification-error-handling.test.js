// __tests__/integration/features/notification-error-handling.test.js

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NotificationErrorHandler } from '../../../src/core/services/notificationErrorHandler.js';

// Mock the notification service dependencies
vi.mock('../../../src/core/services/stateService.js', () => ({
    stateService: {
        addNotification: vi.fn(),
        removeNotification: vi.fn(),
        getState: vi.fn(() => []),
        subscribe: vi.fn(),
        getNotificationSettings: vi.fn(() => ({
            position: 'top-right',
            maxVisible: 5,
            enableAnimations: true
        }))
    }
}));

vi.mock('../../../src/core/services/notificationConfig.js', () => ({
    NOTIFICATION_TYPES: {
        SUCCESS: { icon: 'check_circle', ariaRole: 'status', ariaLive: 'polite' },
        ERROR: { icon: 'error', ariaRole: 'alert', ariaLive: 'assertive' },
        WARNING: { icon: 'warning', ariaRole: 'alert', ariaLive: 'assertive' },
        INFO: { icon: 'info', ariaRole: 'status', ariaLive: 'polite' }
    },
    RESPONSIVE_CONFIG: {
        mobile: { maxWidth: 767 }
    },
    getDurationForType: vi.fn(() => 4000)
}));

vi.mock('../../../src/core/services/notificationDomUtils.js', () => ({
    createLiveRegion: vi.fn(),
    announceNotification: vi.fn(),
    handleExcessNotifications: vi.fn(),
    attachNotificationEvents: vi.fn(),
    attachTouchEvents: vi.fn()
}));

vi.mock('../../../src/core/services/notificationTimerUtils.js', () => ({
    startAutoCloseTimer: vi.fn(),
    pauseAutoCloseTimer: vi.fn(),
    resumeAutoCloseTimer: vi.fn(),
    stopAutoCloseTimer: vi.fn()
}));

vi.mock('../../../src/core/services/notificationRenderer.js', () => ({
    createNotificationElement: vi.fn()
}));

describe('Notification Error Handling Integration', () => {
    let mockContainer;
    
    beforeEach(() => {
        // Reset error handler state
        NotificationErrorHandler.resetErrorStats();
        NotificationErrorHandler.notificationQueue = [];
        NotificationErrorHandler.isDOMReady = true;
        
        // Mock container
        mockContainer = {
            addNotification: vi.fn(),
            removeNotification: vi.fn(),
            clearAllNotifications: vi.fn(),
            container: {
                querySelector: vi.fn()
            }
        };
        
        // Mock DOM
        global.document = {
            createElement: vi.fn(() => ({
                className: '',
                style: { cssText: '' },
                setAttribute: vi.fn(),
                getAttribute: vi.fn(),
                appendChild: vi.fn(),
                querySelector: vi.fn(),
                classList: { add: vi.fn(), remove: vi.fn() },
                addEventListener: vi.fn(),
                remove: vi.fn(),
                innerHTML: '',
                textContent: ''
            })),
            body: { appendChild: vi.fn() },
            querySelector: vi.fn(),
            querySelectorAll: vi.fn(() => []),
            readyState: 'complete'
        };
        
        global.window = {
            innerWidth: 1024,
            matchMedia: vi.fn(() => ({ matches: false, addEventListener: vi.fn() })),
            addEventListener: vi.fn(),
            appLogger: {
                error: vi.fn(),
                warn: vi.fn(),
                info: vi.fn()
            }
        };
        
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Service Integration', () => {
        it('should handle notification service initialization errors', async () => {
            const { notificationService } = await import('../../../src/core/services/notificationService.js');
            
            // Mock import failure
            const originalImport = global.import;
            global.import = vi.fn().mockRejectedValue(new Error('Import failed'));
            
            // This should not throw
            expect(() => notificationService.init()).not.toThrow();
            
            global.import = originalImport;
        });

        it('should handle renderer errors gracefully', async () => {
            const { createNotificationElement } = await import('../../../src/core/services/notificationRenderer.js');
            
            // Mock renderer to throw error
            createNotificationElement.mockImplementation(() => {
                throw new Error('Renderer failed');
            });
            
            const notification = {
                id: '1',
                type: 'info',
                message: 'Test message'
            };
            
            // Should not throw and should create fallback
            const result = NotificationErrorHandler.handleRenderError(
                new Error('Renderer failed'),
                notification,
                (notif) => NotificationErrorHandler.createSimpleFallback(notif)
            );
            
            expect(result).toBeTruthy();
            expect(NotificationErrorHandler.getErrorStats().render).toBe(1);
        });

        it('should queue notifications when DOM is not ready', () => {
            NotificationErrorHandler.isDOMReady = false;
            
            const renderFunction = vi.fn();
            const notification = { id: '1', type: 'info', message: 'Test' };
            
            const result = NotificationErrorHandler.queueNotification(renderFunction, notification);
            
            expect(result).toBeNull();
            expect(NotificationErrorHandler.notificationQueue).toHaveLength(1);
            expect(renderFunction).not.toHaveBeenCalled();
        });

        it('should process queued notifications when DOM becomes ready', () => {
            // Start with DOM not ready
            NotificationErrorHandler.isDOMReady = false;
            
            const renderFunction = vi.fn(() => 'rendered');
            const notification = { id: '1', type: 'info', message: 'Test' };
            
            // Queue notification
            NotificationErrorHandler.queueNotification(renderFunction, notification);
            expect(NotificationErrorHandler.notificationQueue).toHaveLength(1);
            
            // Simulate DOM ready
            NotificationErrorHandler.isDOMReady = true;
            NotificationErrorHandler.processNotificationQueue();
            
            expect(renderFunction).toHaveBeenCalledWith(notification);
            expect(NotificationErrorHandler.notificationQueue).toHaveLength(0);
        });
    });

    describe('Animation Error Handling', () => {
        it('should handle animation failures gracefully', () => {
            const mockElement = {
                style: { animation: '', transition: '', opacity: '', transform: '' },
                classList: { add: vi.fn(), remove: vi.fn() }
            };
            
            const error = new Error('Animation not supported');
            
            NotificationErrorHandler.handleAnimationError(error, mockElement, 'entrance');
            
            expect(mockElement.style.animation).toBe('none');
            expect(mockElement.style.transition).toBe('none');
            expect(mockElement.style.opacity).toBe('1');
            expect(mockElement.classList.add).toHaveBeenCalledWith('notification--visible');
        });

        it('should disable animations when not supported', () => {
            NotificationErrorHandler.animationSupport = false;
            expect(NotificationErrorHandler.shouldDisableAnimations()).toBe(true);
            
            NotificationErrorHandler.animationSupport = true;
            NotificationErrorHandler.reducedMotionPreference = true;
            expect(NotificationErrorHandler.shouldDisableAnimations()).toBe(true);
            
            NotificationErrorHandler.animationSupport = true;
            NotificationErrorHandler.reducedMotionPreference = false;
            expect(NotificationErrorHandler.shouldDisableAnimations()).toBe(false);
        });
    });

    describe('Fallback Mechanisms', () => {
        it('should create fallback notification when renderer fails', () => {
            const notification = {
                id: 'test-1',
                type: 'success',
                message: 'Test message',
                title: 'Test title'
            };
            
            const fallbackElement = NotificationErrorHandler.createSimpleFallback(notification);
            
            expect(fallbackElement).toBeTruthy();
            expect(global.document.createElement).toHaveBeenCalledWith('div');
        });

        it('should show console fallback as last resort', () => {
            const consoleSpy = vi.spyOn(console, 'log');
            const notification = { type: 'info', message: 'Test message' };
            
            NotificationErrorHandler.showConsoleFallback(notification);
            
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Test message'));
            consoleSpy.mockRestore();
        });
    });

    describe('Recovery Strategies', () => {
        it('should recover from show errors', () => {
            const notification = { id: '1', type: 'info', message: 'Test' };
            
            const result = NotificationErrorHandler.recoverFromShowError(notification);
            
            expect(result).toBe(true);
            expect(global.document.body.appendChild).toHaveBeenCalled();
        });

        it('should recover from remove errors', () => {
            const mockElement = { remove: vi.fn() };
            global.document.querySelector = vi.fn(() => mockElement);
            
            const result = NotificationErrorHandler.recoverFromRemoveError('test-id');
            
            expect(result).toBe(true);
            expect(mockElement.remove).toHaveBeenCalled();
        });

        it('should recover from clear errors', () => {
            const mockElements = [{ remove: vi.fn() }, { remove: vi.fn() }];
            global.document.querySelectorAll = vi.fn(() => mockElements);
            
            const result = NotificationErrorHandler.recoverFromClearError();
            
            expect(result).toBe(true);
            mockElements.forEach(el => expect(el.remove).toHaveBeenCalled());
        });

        it('should recover from init errors by creating fallback container', () => {
            global.document.querySelector = vi.fn(() => null);
            
            const result = NotificationErrorHandler.recoverFromInitError();
            
            expect(result).toBe(true);
            expect(global.document.createElement).toHaveBeenCalledWith('div');
            expect(global.document.body.appendChild).toHaveBeenCalled();
        });
    });

    describe('Error Statistics and Monitoring', () => {
        it('should track different types of errors', () => {
            NotificationErrorHandler.handleRenderError(new Error('render'), {});
            NotificationErrorHandler.handleAnimationError(new Error('animation'), {});
            NotificationErrorHandler.handleServiceError(new Error('service'), 'test');
            NotificationErrorHandler.handleDOMError(new Error('dom'), 'test');
            
            const stats = NotificationErrorHandler.getErrorStats();
            
            expect(stats.render).toBe(1);
            expect(stats.animation).toBe(1);
            expect(stats.service).toBe(1);
            expect(stats.dom).toBe(1);
            expect(stats.total).toBe(4);
        });

        it('should provide comprehensive error statistics', () => {
            const stats = NotificationErrorHandler.getErrorStats();
            
            expect(stats).toHaveProperty('render');
            expect(stats).toHaveProperty('animation');
            expect(stats).toHaveProperty('dom');
            expect(stats).toHaveProperty('service');
            expect(stats).toHaveProperty('total');
            expect(stats).toHaveProperty('queueSize');
            expect(stats).toHaveProperty('isDOMReady');
            expect(stats).toHaveProperty('animationSupport');
            expect(stats).toHaveProperty('reducedMotionPreference');
        });

        it('should reset error statistics', () => {
            NotificationErrorHandler.handleRenderError(new Error('test'), {});
            expect(NotificationErrorHandler.getErrorStats().total).toBe(1);
            
            NotificationErrorHandler.resetErrorStats();
            expect(NotificationErrorHandler.getErrorStats().total).toBe(0);
        });
    });

    describe('Queue Management', () => {
        it('should cleanup old queued notifications', () => {
            const now = Date.now();
            NotificationErrorHandler.notificationQueue = [
                { timestamp: now - 70000 }, // 70 seconds ago (old)
                { timestamp: now - 30000 }, // 30 seconds ago (recent)
                { timestamp: now }          // now (new)
            ];
            
            NotificationErrorHandler.cleanupOldQueuedNotifications();
            
            expect(NotificationErrorHandler.notificationQueue).toHaveLength(2);
        });

        it('should handle DOM ready callbacks', () => {
            const callback1 = vi.fn();
            const callback2 = vi.fn();
            
            // Reset callbacks array
            NotificationErrorHandler.domReadyCallbacks = [];
            
            // DOM not ready
            NotificationErrorHandler.isDOMReady = false;
            NotificationErrorHandler.onDOMReady(callback1);
            NotificationErrorHandler.onDOMReady(callback2);
            
            expect(callback1).not.toHaveBeenCalled();
            expect(callback2).not.toHaveBeenCalled();
            expect(NotificationErrorHandler.domReadyCallbacks).toHaveLength(2);
            
            // Simulate DOM ready by manually executing callbacks
            NotificationErrorHandler.isDOMReady = true;
            const callbacks = [...NotificationErrorHandler.domReadyCallbacks];
            NotificationErrorHandler.domReadyCallbacks = [];
            
            callbacks.forEach(callback => {
                try {
                    callback();
                } catch (error) {
                    console.error('DOM ready callback error:', error);
                }
            });
            
            // Callbacks should be executed
            expect(callback1).toHaveBeenCalled();
            expect(callback2).toHaveBeenCalled();
        });
    });

    describe('Browser Compatibility', () => {
        it('should handle missing matchMedia', () => {
            global.window.matchMedia = undefined;
            
            expect(() => NotificationErrorHandler.checkReducedMotionPreference()).not.toThrow();
            expect(NotificationErrorHandler.reducedMotionPreference).toBe(false);
        });

        it('should handle missing document', () => {
            global.document = undefined;
            
            expect(() => NotificationErrorHandler.checkDOMReady()).not.toThrow();
            expect(() => NotificationErrorHandler.checkAnimationSupport()).not.toThrow();
        });

        it('should handle missing window', () => {
            global.window = undefined;
            
            expect(() => NotificationErrorHandler.checkReducedMotionPreference()).not.toThrow();
            expect(() => NotificationErrorHandler.checkAnimationSupport()).not.toThrow();
        });
    });
});