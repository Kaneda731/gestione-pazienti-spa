// __tests__/unit/core/services/notificationErrorHandler.test.js

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NotificationErrorHandler } from '../../../../src/core/services/notificationErrorHandler.js';

// Mock DOM environment
const createMockElement = () => ({
    style: { cssText: '', animation: '' },
    classList: { add: vi.fn(), remove: vi.fn() },
    setAttribute: vi.fn(),
    getAttribute: vi.fn((attr) => {
        if (attr === 'data-id') return '1';
        if (attr === 'role') return 'status';
        return null;
    }),
    appendChild: vi.fn(),
    remove: vi.fn(),
    addEventListener: vi.fn(),
    onclick: null,
    textContent: '',
    innerHTML: '',
    className: 'notification notification--success notification--fallback',
    querySelector: vi.fn((selector) => {
        if (selector === '.notification__close') {
            return {
                onclick: vi.fn(),
                addEventListener: vi.fn()
            };
        }
        return null;
    }),
    querySelectorAll: vi.fn(() => [])
});

const mockDocument = {
    readyState: 'loading',
    createElement: vi.fn(() => createMockElement()),
    body: {
        appendChild: vi.fn()
    },
    querySelector: vi.fn(),
    querySelectorAll: vi.fn(() => []),
    addEventListener: vi.fn()
};

const mockWindow = {
    matchMedia: vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn()
    })),
    addEventListener: vi.fn(),
    innerWidth: 1024,
    appLogger: {
        error: vi.fn(),
        warn: vi.fn(),
        info: vi.fn()
    }
};

describe('NotificationErrorHandler', () => {
    beforeEach(() => {
        // Reset error counts
        NotificationErrorHandler.resetErrorStats();
        NotificationErrorHandler.notificationQueue = [];
        NotificationErrorHandler.isDOMReady = false;
        NotificationErrorHandler.domReadyCallbacks = [];
        
        // Mock globals
        global.document = mockDocument;
        global.window = mockWindow;
        
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Initialization', () => {
        it('should initialize without errors', () => {
            expect(() => NotificationErrorHandler.init()).not.toThrow();
        });

        it('should check DOM ready state', () => {
            NotificationErrorHandler.checkDOMReady();
            expect(mockDocument.addEventListener).toHaveBeenCalledWith('DOMContentLoaded', expect.any(Function));
        });

        it('should check animation support', () => {
            NotificationErrorHandler.checkAnimationSupport();
            expect(NotificationErrorHandler.animationSupport).toBeDefined();
        });

        it('should check reduced motion preference', () => {
            NotificationErrorHandler.checkReducedMotionPreference();
            expect(mockWindow.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
        });
    });

    describe('Error Handling', () => {
        it('should handle render errors', () => {
            const error = new Error('Render failed');
            const notification = { id: '1', type: 'info', message: 'Test' };
            
            const result = NotificationErrorHandler.handleRenderError(error, notification);
            
            expect(NotificationErrorHandler.getErrorStats().render).toBe(1);
            expect(NotificationErrorHandler.getErrorStats().total).toBe(1);
            expect(result).toBeTruthy(); // Should return fallback element
        });

        it('should handle animation errors', () => {
            const error = new Error('Animation failed');
            const mockElement = {
                style: { animation: '', transition: '', opacity: '', transform: '' },
                classList: { add: vi.fn(), remove: vi.fn() }
            };
            
            NotificationErrorHandler.handleAnimationError(error, mockElement, 'entrance');
            
            expect(NotificationErrorHandler.getErrorStats().animation).toBe(1);
            expect(mockElement.style.animation).toBe('none');
            expect(mockElement.style.opacity).toBe('1');
        });

        it('should handle service errors', () => {
            const error = new Error('Service failed');
            
            NotificationErrorHandler.handleServiceError(error, 'show', { type: 'info', message: 'Test' });
            
            expect(NotificationErrorHandler.getErrorStats().service).toBe(1);
            expect(mockWindow.appLogger.error).toHaveBeenCalled();
        });

        it('should handle DOM errors', () => {
            const error = new Error('DOM failed');
            
            const result = NotificationErrorHandler.handleDOMError(error, 'render');
            
            expect(NotificationErrorHandler.getErrorStats().dom).toBe(1);
            expect(result).toBe(false); // Should indicate queuing when DOM not ready
        });
    });

    describe('Notification Queue', () => {
        it('should queue notifications when DOM not ready', () => {
            const renderFunction = vi.fn();
            const notification = { id: '1', type: 'info', message: 'Test' };
            
            NotificationErrorHandler.isDOMReady = false;
            const result = NotificationErrorHandler.queueNotification(renderFunction, notification);
            
            expect(result).toBeNull();
            expect(NotificationErrorHandler.notificationQueue).toHaveLength(1);
            expect(renderFunction).not.toHaveBeenCalled();
        });

        it('should execute immediately when DOM ready', () => {
            const renderFunction = vi.fn(() => 'rendered');
            const notification = { id: '1', type: 'info', message: 'Test' };
            
            NotificationErrorHandler.isDOMReady = true;
            const result = NotificationErrorHandler.queueNotification(renderFunction, notification);
            
            expect(result).toBe('rendered');
            expect(NotificationErrorHandler.notificationQueue).toHaveLength(0);
            expect(renderFunction).toHaveBeenCalledWith(notification);
        });

        it('should process queued notifications when DOM becomes ready', () => {
            const renderFunction = vi.fn();
            const notification = { id: '1', type: 'info', message: 'Test' };
            
            // Queue notification
            NotificationErrorHandler.isDOMReady = false;
            NotificationErrorHandler.queueNotification(renderFunction, notification);
            
            // Simulate DOM ready
            NotificationErrorHandler.isDOMReady = true;
            NotificationErrorHandler.processNotificationQueue();
            
            expect(renderFunction).toHaveBeenCalledWith(notification);
            expect(NotificationErrorHandler.notificationQueue).toHaveLength(0);
        });

        it('should skip old queued notifications', () => {
            const renderFunction = vi.fn();
            const notification = { id: '1', type: 'info', message: 'Test' };
            
            // Add old notification to queue
            NotificationErrorHandler.notificationQueue.push({
                renderFunction,
                notification,
                timestamp: Date.now() - 40000 // 40 seconds ago
            });
            
            NotificationErrorHandler.isDOMReady = true;
            NotificationErrorHandler.processNotificationQueue();
            
            expect(renderFunction).not.toHaveBeenCalled();
        });
    });

    describe('Fallback Creation', () => {
        it('should create simple fallback notification', () => {
            const notification = {
                id: '1',
                type: 'success',
                message: 'Test message',
                title: 'Test title'
            };
            
            const element = NotificationErrorHandler.createSimpleFallback(notification);
            
            expect(element).toBeTruthy();
            expect(element.className).toContain('notification--success');
            expect(element.getAttribute('data-id')).toBe('1');
            expect(element.getAttribute('role')).toBe('status');
        });

        it('should handle fallback without title', () => {
            const notification = {
                id: '2',
                type: 'error',
                message: 'Error message'
            };
            
            const element = NotificationErrorHandler.createSimpleFallback(notification);
            
            expect(element).toBeTruthy();
            expect(element.className).toContain('notification--error');
        });

        it('should add close button functionality', () => {
            const notification = { id: '3', type: 'info', message: 'Test' };
            const element = NotificationErrorHandler.createSimpleFallback(notification);
            
            // Simulate close button click
            const closeBtn = element.querySelector('.notification__close');
            expect(closeBtn).toBeTruthy();
            expect(closeBtn.onclick).toBeTruthy();
        });
    });

    describe('Console Fallback', () => {
        it('should show console fallback for different types', () => {
            const consoleSpy = vi.spyOn(console, 'log');
            const consoleErrorSpy = vi.spyOn(console, 'error');
            const consoleWarnSpy = vi.spyOn(console, 'warn');
            
            NotificationErrorHandler.showConsoleFallback({ type: 'info', message: 'Info test' });
            NotificationErrorHandler.showConsoleFallback({ type: 'error', message: 'Error test' });
            NotificationErrorHandler.showConsoleFallback({ type: 'warning', message: 'Warning test' });
            
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Info test'));
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Error test'));
            expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Warning test'));
            
            consoleSpy.mockRestore();
            consoleErrorSpy.mockRestore();
            consoleWarnSpy.mockRestore();
        });
    });

    describe('Animation Support Detection', () => {
        it('should detect animation support', () => {
            NotificationErrorHandler.checkAnimationSupport();
            expect(NotificationErrorHandler.animationSupport).toBeDefined();
        });

        it('should determine if animations should be disabled', () => {
            NotificationErrorHandler.animationSupport = true;
            NotificationErrorHandler.reducedMotionPreference = false;
            expect(NotificationErrorHandler.shouldDisableAnimations()).toBe(false);
            
            NotificationErrorHandler.animationSupport = false;
            expect(NotificationErrorHandler.shouldDisableAnimations()).toBe(true);
            
            NotificationErrorHandler.animationSupport = true;
            NotificationErrorHandler.reducedMotionPreference = true;
            expect(NotificationErrorHandler.shouldDisableAnimations()).toBe(true);
        });
    });

    describe('Recovery Strategies', () => {
        it('should recover from show error', () => {
            const notification = { id: '1', type: 'info', message: 'Test' };
            mockDocument.body = { appendChild: vi.fn() };
            
            const result = NotificationErrorHandler.recoverFromShowError(notification);
            
            expect(mockDocument.body.appendChild).toHaveBeenCalled();
            expect(result).toBe(true);
        });

        it('should recover from remove error', () => {
            const mockElement = { remove: vi.fn() };
            mockDocument.querySelector = vi.fn(() => mockElement);
            
            const result = NotificationErrorHandler.recoverFromRemoveError('test-id');
            
            expect(mockDocument.querySelector).toHaveBeenCalledWith('[data-id="test-id"]');
            expect(mockElement.remove).toHaveBeenCalled();
            expect(result).toBe(true);
        });

        it('should recover from clear error', () => {
            const mockElements = [
                { remove: vi.fn() },
                { remove: vi.fn() }
            ];
            mockDocument.querySelectorAll = vi.fn(() => mockElements);
            
            const result = NotificationErrorHandler.recoverFromClearError();
            
            expect(mockDocument.querySelectorAll).toHaveBeenCalledWith('.notification, [class*="notification"]');
            mockElements.forEach(el => expect(el.remove).toHaveBeenCalled());
            expect(result).toBe(true);
        });

        it('should recover from init error', () => {
            mockDocument.querySelector = vi.fn(() => null);
            mockDocument.createElement = vi.fn(() => ({
                className: '',
                style: { cssText: '' }
            }));
            
            const result = NotificationErrorHandler.recoverFromInitError();
            
            expect(mockDocument.createElement).toHaveBeenCalledWith('div');
            expect(mockDocument.body.appendChild).toHaveBeenCalled();
            expect(result).toBe(true);
        });
    });

    describe('Statistics and Cleanup', () => {
        it('should track error statistics', () => {
            NotificationErrorHandler.handleRenderError(new Error('test'), {});
            NotificationErrorHandler.handleAnimationError(new Error('test'), {});
            
            const stats = NotificationErrorHandler.getErrorStats();
            expect(stats.render).toBe(1);
            expect(stats.animation).toBe(1);
            expect(stats.total).toBe(2);
        });

        it('should reset error statistics', () => {
            NotificationErrorHandler.handleRenderError(new Error('test'), {});
            NotificationErrorHandler.resetErrorStats();
            
            const stats = NotificationErrorHandler.getErrorStats();
            expect(stats.total).toBe(0);
        });

        it('should cleanup old queued notifications', () => {
            // Add old and new notifications
            NotificationErrorHandler.notificationQueue = [
                { timestamp: Date.now() - 70000 }, // Old
                { timestamp: Date.now() - 30000 }, // Recent
                { timestamp: Date.now() }          // New
            ];
            
            NotificationErrorHandler.cleanupOldQueuedNotifications();
            
            expect(NotificationErrorHandler.notificationQueue).toHaveLength(2);
        });
    });

    describe('DOM Ready Callbacks', () => {
        it('should execute callback immediately if DOM ready', () => {
            const callback = vi.fn();
            NotificationErrorHandler.isDOMReady = true;
            
            NotificationErrorHandler.onDOMReady(callback);
            
            expect(callback).toHaveBeenCalled();
        });

        it('should queue callback if DOM not ready', () => {
            const callback = vi.fn();
            NotificationErrorHandler.isDOMReady = false;
            
            NotificationErrorHandler.onDOMReady(callback);
            
            expect(callback).not.toHaveBeenCalled();
            expect(NotificationErrorHandler.domReadyCallbacks).toContain(callback);
        });
    });
});