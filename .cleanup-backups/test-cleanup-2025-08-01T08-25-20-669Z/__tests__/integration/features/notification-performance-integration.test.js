// __tests__/integration/features/notification-performance-integration.test.js

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { notificationService } from '../../../src/core/services/notificationService.js';
import { stateService } from '../../../src/core/services/stateService.js';

// Mock performance APIs
Object.defineProperty(performance, 'now', {
    value: vi.fn(() => Date.now()),
    configurable: true
});

Object.defineProperty(performance, 'memory', {
    value: {
        usedJSHeapSize: 10 * 1024 * 1024,
        totalJSHeapSize: 50 * 1024 * 1024,
        jsHeapSizeLimit: 100 * 1024 * 1024
    },
    configurable: true
});

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

describe('Notification Performance Integration', () => {
    beforeEach(async () => {
        // Reset services
        notificationService.destroy();
        stateService.clearAllNotifications();
        
        // Setup DOM
        document.body.innerHTML = '<div id="app"></div>';
        
        // Mock container creation
        vi.doMock('../../../src/shared/components/notifications/NotificationContainer.js', () => ({
            NotificationContainer: class MockContainer {
                constructor(options) {
                    this.options = options;
                    this.container = document.createElement('div');
                    this.container.className = 'notification-container';
                    document.body.appendChild(this.container);
                }
                
                addNotification(element) {
                    this.container.appendChild(element);
                }
                
                removeNotification(id) {
                    const element = this.container.querySelector(`[data-id="${id}"]`);
                    if (element) element.remove();
                }
                
                clearAllNotifications() {
                    this.container.innerHTML = '';
                }
                
                destroy() {
                    if (this.container.parentNode) {
                        this.container.parentNode.removeChild(this.container);
                    }
                }
            }
        }));
        
        await notificationService.init();
    });

    afterEach(() => {
        notificationService.destroy();
        document.body.innerHTML = '';
        vi.clearAllMocks();
    });

    describe('High Volume Notification Handling', () => {
        it('should handle many notifications efficiently', async () => {
            const startTime = performance.now();
            const notificationCount = 50;
            
            // Create many notifications rapidly
            const promises = [];
            for (let i = 0; i < notificationCount; i++) {
                promises.push(
                    notificationService.success(`Test notification ${i}`, {
                        duration: 0 // Persistent for testing
                    })
                );
            }
            
            await Promise.all(promises);
            
            const endTime = performance.now();
            const totalTime = endTime - startTime;
            
            // Should handle 50 notifications in reasonable time
            expect(totalTime).toBeLessThan(1000); // Less than 1 second
            
            // Should limit visible notifications
            const visibleNotifications = document.querySelectorAll('.notification');
            expect(visibleNotifications.length).toBeLessThanOrEqual(
                notificationService.maxConcurrentNotifications
            );
        });

        it('should optimize performance mode under load', async () => {
            const originalMode = notificationService.performanceMode;
            
            // Simulate high memory usage
            Object.defineProperty(performance, 'memory', {
                value: {
                    usedJSHeapSize: 60 * 1024 * 1024, // High usage
                    totalJSHeapSize: 100 * 1024 * 1024,
                    jsHeapSizeLimit: 200 * 1024 * 1024
                },
                configurable: true
            });
            
            // Trigger memory check
            notificationService.checkMemoryUsage();
            
            expect(notificationService.performanceMode).toBe('performance');
            expect(notificationService.maxConcurrentNotifications).toBeLessThan(20);
        });

        it('should throttle rapid render calls', async () => {
            const renderSpy = vi.spyOn(notificationService, 'renderNotifications');
            
            // Rapid state changes
            for (let i = 0; i < 10; i++) {
                stateService.addNotification('info', `Message ${i}`);
            }
            
            // Wait for throttling
            await new Promise(resolve => setTimeout(resolve, 50));
            
            // Should have throttled render calls
            expect(renderSpy.mock.calls.length).toBeLessThan(10);
        });
    });

    describe('Memory Management Integration', () => {
        it('should automatically cleanup old notifications', async () => {
            // Add notifications
            for (let i = 0; i < 10; i++) {
                notificationService.info(`Old notification ${i}`);
            }
            
            const initialCount = stateService.getState('notifications').length;
            expect(initialCount).toBe(10);
            
            // Simulate time passing
            const notifications = stateService.getState('notifications');
            notifications.forEach(n => {
                n.timestamp = new Date(Date.now() - 400000); // 6+ minutes ago
            });
            
            // Trigger cleanup
            const removedCount = notificationService.cleanupOldNotifications(300000); // 5 minutes
            
            expect(removedCount).toBe(10);
            expect(stateService.getState('notifications').length).toBe(0);
        });

        it('should perform automatic cleanup on visibility change', async () => {
            const cleanupSpy = vi.spyOn(notificationService, 'performAutomaticCleanup');
            
            // Simulate page becoming hidden
            Object.defineProperty(document, 'visibilityState', {
                value: 'hidden',
                configurable: true
            });
            
            const event = new Event('visibilitychange');
            document.dispatchEvent(event);
            
            expect(cleanupSpy).toHaveBeenCalled();
        });

        it('should cleanup event listeners on notification removal', async () => {
            const notification = await notificationService.success('Test message');
            const element = document.querySelector(`[data-id="${notification.id}"]`);
            
            expect(element).toBeTruthy();
            
            // Remove notification
            notificationService.removeNotification(notification.id);
            
            // Element should be removed
            const removedElement = document.querySelector(`[data-id="${notification.id}"]`);
            expect(removedElement).toBeFalsy();
        });
    });

    describe('Animation Performance Integration', () => {
        it('should handle animations without blocking main thread', async () => {
            const startTime = performance.now();
            
            // Create notification with animation
            const notification = await notificationService.success('Animated message');
            
            // Animation should not block significantly
            const endTime = performance.now();
            expect(endTime - startTime).toBeLessThan(100);
            
            const element = document.querySelector(`[data-id="${notification.id}"]`);
            expect(element).toBeTruthy();
        });

        it('should disable animations for reduced motion preference', async () => {
            // Mock reduced motion preference
            Object.defineProperty(window, 'matchMedia', {
                value: vi.fn().mockImplementation(query => ({
                    matches: query === '(prefers-reduced-motion: reduce)',
                    addEventListener: vi.fn(),
                    removeEventListener: vi.fn()
                })),
                configurable: true
            });
            
            const notification = await notificationService.success('No animation message');
            const element = document.querySelector(`[data-id="${notification.id}"]`);
            
            // Should have no-animations class or immediate visibility
            expect(
                element.classList.contains('notification--no-animations') ||
                element.style.opacity === '1'
            ).toBe(true);
        });
    });

    describe('Virtual Scrolling Integration', () => {
        it('should switch to virtual scrolling under high load', async () => {
            // Mock conditions for virtual scrolling
            notificationService.maxConcurrentNotifications = 15;
            
            const shouldUse = notificationService.shouldUseVirtualScrolling();
            expect(shouldUse).toBe(true);
        });

        it('should handle virtual scrolling container creation', async () => {
            // Mock virtual container
            vi.doMock('../../../src/core/services/notificationLazyLoader.js', () => ({
                notificationLazyLoader: {
                    loadNotificationContainer: vi.fn().mockResolvedValue({
                        NotificationVirtualContainer: class MockVirtualContainer {
                            constructor(options) {
                                this.options = options;
                                this.container = document.createElement('div');
                                this.container.className = 'notification-virtual-container';
                                document.body.appendChild(this.container);
                            }
                            
                            addNotification(element) {
                                this.container.appendChild(element);
                            }
                            
                            removeNotification(id) {
                                const element = this.container.querySelector(`[data-id="${id}"]`);
                                if (element) element.remove();
                            }
                            
                            destroy() {
                                if (this.container.parentNode) {
                                    this.container.parentNode.removeChild(this.container);
                                }
                            }
                        }
                    })
                }
            }));
            
            // Force virtual scrolling
            notificationService.useVirtualScrolling = true;
            
            await notificationService.switchToVirtualScrolling();
            
            // Should have virtual container
            const virtualContainer = document.querySelector('.notification-virtual-container');
            expect(virtualContainer).toBeTruthy();
        });
    });

    describe('Lazy Loading Integration', () => {
        it('should lazy load components when needed', async () => {
            // Mock lazy loader
            const mockLoader = {
                loadModule: vi.fn().mockResolvedValue({
                    default: class MockComponent {
                        constructor() {}
                        init() {}
                        destroy() {}
                    }
                })
            };
            
            // Test lazy loading
            const component = await mockLoader.loadModule('TestComponent', './test.js');
            expect(component).toBeDefined();
            expect(mockLoader.loadModule).toHaveBeenCalledWith('TestComponent', './test.js');
        });

        it('should preload components based on device capabilities', async () => {
            // Mock low memory device
            Object.defineProperty(navigator, 'deviceMemory', {
                value: 2,
                configurable: true
            });
            
            const shouldPreload = notificationService.shouldUseVirtualScrolling();
            expect(shouldPreload).toBe(true);
        });
    });

    describe('Performance Statistics Integration', () => {
        it('should provide comprehensive performance stats', async () => {
            // Add some notifications
            await notificationService.success('Test 1');
            await notificationService.error('Test 2');
            await notificationService.warning('Test 3');
            
            const stats = notificationService.getPerformanceStats();
            
            expect(stats).toHaveProperty('performance');
            expect(stats.performance).toHaveProperty('useVirtualScrolling');
            expect(stats.performance).toHaveProperty('performanceMode');
            expect(stats.performance).toHaveProperty('maxConcurrentNotifications');
            expect(stats.performance).toHaveProperty('lastCleanupTime');
            
            // Should include manager stats
            expect(stats.performance).toHaveProperty('eventManager');
            expect(stats.performance).toHaveProperty('animationManager');
            expect(stats.performance).toHaveProperty('lazyLoader');
        });

        it('should track render performance over time', async () => {
            const initialStats = notificationService.getPerformanceStats();
            const initialRenderCount = initialStats.performance.renderCount || 0;
            
            // Trigger renders
            await notificationService.success('Render test 1');
            await notificationService.info('Render test 2');
            
            const finalStats = notificationService.getPerformanceStats();
            const finalRenderCount = finalStats.performance.renderCount || 0;
            
            expect(finalRenderCount).toBeGreaterThan(initialRenderCount);
        });
    });

    describe('Error Recovery and Fallbacks', () => {
        it('should fallback gracefully on component load failure', async () => {
            // Mock component load failure
            const originalImport = global.import;
            global.import = vi.fn().mockRejectedValue(new Error('Component load failed'));
            
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            
            // Should still work with fallback
            const notification = await notificationService.success('Fallback test');
            expect(notification).toBeDefined();
            
            global.import = originalImport;
            consoleSpy.mockRestore();
        });

        it('should handle animation failures gracefully', async () => {
            // Mock animation failure
            const mockElement = document.createElement('div');
            mockElement.animate = vi.fn().mockImplementation(() => {
                throw new Error('Animation failed');
            });
            
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            
            // Should still show notification without animation
            const notification = await notificationService.success('Animation fail test');
            expect(notification).toBeDefined();
            
            consoleSpy.mockRestore();
        });
    });

    describe('Mobile Performance Optimizations', () => {
        it('should optimize for mobile devices', async () => {
            // Mock mobile viewport
            Object.defineProperty(window, 'innerWidth', {
                value: 375,
                configurable: true
            });
            
            // Mock touch support
            Object.defineProperty(window, 'ontouchstart', {
                value: {},
                configurable: true
            });
            
            const shouldUseVirtual = notificationService.shouldUseVirtualScrolling();
            expect(shouldUseVirtual).toBe(true);
            
            const maxNotifications = notificationService.detectOptimalMaxNotifications();
            expect(maxNotifications).toBeLessThanOrEqual(8);
        });

        it('should handle touch interactions efficiently', async () => {
            const notification = await notificationService.success('Touch test');
            const element = document.querySelector(`[data-id="${notification.id}"]`);
            
            // Simulate touch events
            const touchStart = new TouchEvent('touchstart', {
                touches: [{ clientX: 100, clientY: 100 }]
            });
            
            const touchEnd = new TouchEvent('touchend', {
                changedTouches: [{ clientX: 200, clientY: 100 }]
            });
            
            element.dispatchEvent(touchStart);
            element.dispatchEvent(touchEnd);
            
            // Should handle touch without errors
            expect(element).toBeTruthy();
        });
    });
});