// __tests__/unit/core/services/notificationService-integration.test.js

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock window.matchMedia before importing services
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

// Mock performance API
Object.defineProperty(window, 'performance', {
  writable: true,
  value: {
    now: vi.fn(() => Date.now())
  }
});

import { notificationService } from '../../../../src/core/services/notificationService.js';
import { stateService } from '../../../../src/core/services/stateService.js';

describe('NotificationService - Integration Methods', () => {
    beforeEach(() => {
        // Reset stato prima di ogni test
        stateService.clearState([]);
        notificationService.timers.clear();
        notificationService._renderCount = 0;
        notificationService._totalRenderTime = 0;
        notificationService._averageRenderTime = null;
        vi.clearAllTimers();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        stateService.stopAutoCleanup();
    });

    describe('updateSettings', () => {
        it('should update notification settings successfully', () => {
            const newSettings = {
                maxVisible: 8,
                position: 'top-left',
                enableSounds: true,
                defaultDuration: 3000
            };

            const result = notificationService.updateSettings(newSettings);
            
            expect(result).toBe(true);
            expect(notificationService.settings.maxVisible).toBe(8);
            expect(notificationService.settings.position).toBe('top-left');
            expect(notificationService.settings.enableSounds).toBe(true);
            expect(notificationService.settings.defaultDuration).toBe(3000);
        });

        it('should validate settings before applying', () => {
            // Store original settings
            const originalMaxVisible = notificationService.settings.maxVisible;
            
            const invalidSettings = {
                maxVisible: -1, // Invalid
                position: 'invalid-position' // Invalid
            };

            const result = notificationService.updateSettings(invalidSettings);
            
            expect(result).toBe(false);
            // Settings should remain unchanged
            expect(notificationService.settings.maxVisible).toBe(originalMaxVisible);
        });

        it('should validate maxVisible range', () => {
            expect(notificationService.updateSettings({ maxVisible: 0 })).toBe(false);
            expect(notificationService.updateSettings({ maxVisible: 25 })).toBe(false);
            expect(notificationService.updateSettings({ maxVisible: 10 })).toBe(true);
        });

        it('should validate position values', () => {
            expect(notificationService.updateSettings({ position: 'invalid' })).toBe(false);
            expect(notificationService.updateSettings({ position: 'top-right' })).toBe(true);
            expect(notificationService.updateSettings({ position: 'bottom-left' })).toBe(true);
        });

        it('should validate customDurations', () => {
            const validDurations = {
                customDurations: {
                    success: 3000,
                    error: 0,
                    warning: 5000,
                    info: 4000
                }
            };

            const invalidDurations = {
                customDurations: {
                    success: -1, // Invalid
                    invalid_type: 1000 // Invalid type
                }
            };

            expect(notificationService.updateSettings(validDurations)).toBe(true);
            expect(notificationService.updateSettings(invalidDurations)).toBe(false);
        });
    });

    describe('getStats', () => {
        beforeEach(() => {
            // Add some test notifications
            stateService.addNotification('success', 'Success message');
            stateService.addNotification('error', 'Error message');
            stateService.addNotification('warning', 'Warning message');
        });

        it('should return comprehensive statistics', () => {
            const stats = notificationService.getStats();

            expect(stats).toHaveProperty('total', 3);
            expect(stats).toHaveProperty('visible', 3);
            expect(stats).toHaveProperty('byType');
            expect(stats.byType.success).toBe(1);
            expect(stats.byType.error).toBe(1);
            expect(stats.byType.warning).toBe(1);
            expect(stats).toHaveProperty('persistent', 1); // Error is persistent
            expect(stats).toHaveProperty('activeTimers');
            expect(stats).toHaveProperty('containerInitialized');
            expect(stats).toHaveProperty('serviceInitialized');
            expect(stats).toHaveProperty('settings');
            expect(stats).toHaveProperty('performance');
        });

        it('should include performance metrics', () => {
            // Simulate some renders
            notificationService._renderCount = 5;
            notificationService._totalRenderTime = 50;
            notificationService._averageRenderTime = 10;
            notificationService._lastRenderTime = 12;

            const stats = notificationService.getStats();

            expect(stats.performance.renderCount).toBe(5);
            expect(stats.performance.averageRenderTime).toBe(10);
            expect(stats.performance.lastRenderTime).toBe(12);
        });

        it('should handle errors gracefully', () => {
            // Mock stateService to throw error
            const originalGetStats = stateService.getNotificationStats;
            stateService.getNotificationStats = vi.fn(() => {
                throw new Error('Test error');
            });

            const stats = notificationService.getStats();

            expect(stats).toHaveProperty('error', 'Test error');
            expect(stats.total).toBe(0);

            // Restore original method
            stateService.getNotificationStats = originalGetStats;
        });
    });

    describe('exportSettings', () => {
        it('should export settings with metadata', () => {
            const exported = notificationService.exportSettings();

            expect(exported).toHaveProperty('settings');
            expect(exported).toHaveProperty('timestamp');
            expect(exported).toHaveProperty('version', '1.0');
            expect(exported).toHaveProperty('serviceMetadata');
            expect(exported.serviceMetadata).toHaveProperty('version', '2.0');
            expect(exported.serviceMetadata).toHaveProperty('exportedBy', 'NotificationService');
        });

        it('should handle export errors', () => {
            // Mock stateService to throw error
            const originalExport = stateService.exportNotificationSettings;
            stateService.exportNotificationSettings = vi.fn(() => {
                throw new Error('Export error');
            });

            const result = notificationService.exportSettings();

            expect(result).toBeNull();

            // Restore original method
            stateService.exportNotificationSettings = originalExport;
        });
    });

    describe('importSettings', () => {
        it('should import valid settings', () => {
            const backupData = {
                version: '1.0',
                settings: {
                    maxVisible: 7,
                    position: 'bottom-right',
                    enableSounds: true
                },
                timestamp: new Date().toISOString()
            };

            const result = notificationService.importSettings(backupData);

            expect(result).toBe(true);
            expect(notificationService.settings.maxVisible).toBe(7);
            expect(notificationService.settings.position).toBe('bottom-right');
            expect(notificationService.settings.enableSounds).toBe(true);
        });

        it('should reject invalid backup format', () => {
            const invalidBackup = null;
            const result = notificationService.importSettings(invalidBackup);
            expect(result).toBe(false);
        });

        it('should reject backup without settings', () => {
            const invalidBackup = {
                version: '1.0',
                timestamp: new Date().toISOString()
                // Missing settings
            };
            const result = notificationService.importSettings(invalidBackup);
            expect(result).toBe(false);
        });

        it('should warn about unsupported versions but still try import', () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            
            const backupData = {
                version: '3.0', // Unsupported
                settings: {
                    maxVisible: 6
                },
                timestamp: new Date().toISOString()
            };

            notificationService.importSettings(backupData);

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Versione backup non supportata: 3.0')
            );

            consoleSpy.mockRestore();
        });
    });

    describe('cleanupOldNotifications', () => {
        beforeEach(() => {
            // Add notifications with different timestamps
            const id1 = stateService.addNotification('info', 'Old message');
            const id2 = stateService.addNotification('success', 'Recent message');
            
            // Mock old timestamp for first notification
            const notifications = stateService.getState('notifications');
            const updatedNotifications = notifications.map((n, index) => {
                if (index === 0) {
                    return { ...n, timestamp: new Date(Date.now() - 400000) }; // 6+ minutes ago
                }
                return n;
            });
            stateService.setState('notifications', updatedNotifications);

            // Add some timers to test cleanup
            notificationService.timers.set(id1, { timer: 'mock-timer-1' });
            notificationService.timers.set(id2, { timer: 'mock-timer-2' });
            notificationService.timers.set('non-existent-id', { timer: 'mock-timer-3' });
        });

        it('should cleanup old notifications and associated timers', () => {
            const removedCount = notificationService.cleanupOldNotifications(300000); // 5 minutes

            expect(removedCount).toBe(1);
            
            const remaining = stateService.getState('notifications');
            expect(remaining).toHaveLength(1);
            expect(remaining[0].message).toBe('Recent message');

            // Should cleanup orphaned timers
            expect(notificationService.timers.has('non-existent-id')).toBe(false);
        });

        it('should handle cleanup errors gracefully', () => {
            // Mock stateService to throw error
            const originalClearOld = stateService.clearOldNotifications;
            stateService.clearOldNotifications = vi.fn(() => {
                throw new Error('Cleanup error');
            });

            const result = notificationService.cleanupOldNotifications();

            expect(result).toBe(0);

            // Restore original method
            stateService.clearOldNotifications = originalClearOld;
        });
    });

    describe('getNotificationsByType', () => {
        beforeEach(() => {
            stateService.addNotification('success', 'Success 1');
            stateService.addNotification('error', 'Error 1');
            stateService.addNotification('success', 'Success 2');
        });

        it('should return notifications by type', () => {
            const successNotifications = notificationService.getNotificationsByType('success');
            const errorNotifications = notificationService.getNotificationsByType('error');

            expect(successNotifications).toHaveLength(2);
            expect(errorNotifications).toHaveLength(1);
            expect(successNotifications[0].message).toBe('Success 1');
            expect(errorNotifications[0].message).toBe('Error 1');
        });

        it('should handle errors gracefully', () => {
            const originalMethod = stateService.getNotificationsByType;
            stateService.getNotificationsByType = vi.fn(() => {
                throw new Error('Query error');
            });

            const result = notificationService.getNotificationsByType('success');

            expect(result).toEqual([]);

            stateService.getNotificationsByType = originalMethod;
        });
    });

    describe('getVisibleNotifications', () => {
        beforeEach(() => {
            stateService.addNotification('success', 'Visible 1');
            stateService.addNotification('error', 'Visible 2');
            
            // Mark one as removing
            const notifications = stateService.getState('notifications');
            notifications[0].isRemoving = true;
            stateService.setState('notifications', notifications);
        });

        it('should return only visible notifications', () => {
            const visible = notificationService.getVisibleNotifications();

            expect(visible).toHaveLength(1);
            expect(visible[0].message).toBe('Visible 2');
        });

        it('should handle errors gracefully', () => {
            const originalMethod = stateService.getVisibleNotifications;
            stateService.getVisibleNotifications = vi.fn(() => {
                throw new Error('Query error');
            });

            const result = notificationService.getVisibleNotifications();

            expect(result).toEqual([]);

            stateService.getVisibleNotifications = originalMethod;
        });
    });

    describe('hasErrors', () => {
        it('should detect error notifications', () => {
            expect(notificationService.hasErrors()).toBe(false);

            stateService.addNotification('error', 'Test error');
            expect(notificationService.hasErrors()).toBe(true);

            stateService.clearNotificationsByType('error');
            expect(notificationService.hasErrors()).toBe(false);
        });

        it('should handle errors gracefully', () => {
            const originalMethod = stateService.hasErrorNotifications;
            stateService.hasErrorNotifications = vi.fn(() => {
                throw new Error('Query error');
            });

            const result = notificationService.hasErrors();

            expect(result).toBe(false);

            stateService.hasErrorNotifications = originalMethod;
        });
    });

    describe('Performance Tracking', () => {
        it('should track render performance', () => {
            // Mock performance.now to return predictable values
            let callCount = 0;
            const mockPerformanceNow = vi.fn(() => {
                callCount++;
                if (callCount === 1) return 100; // Start time
                if (callCount === 2) return 110; // End time (10ms)
                if (callCount === 3) return 200; // Start time 2
                if (callCount === 4) return 220; // End time 2 (20ms)
                return Date.now();
            });
            
            window.performance.now = mockPerformanceNow;

            // Mock notificationContainer to allow rendering
            notificationService.notificationContainer = {
                removeNotification: vi.fn(),
                addNotification: vi.fn()
            };

            // Simulate first render
            notificationService.renderNotifications([]);

            expect(notificationService._renderCount).toBe(1);
            expect(notificationService._lastRenderTime).toBe(10);
            expect(notificationService._averageRenderTime).toBe(10);

            // Simulate second render
            notificationService.renderNotifications([]);

            expect(notificationService._renderCount).toBe(2);
            expect(notificationService._lastRenderTime).toBe(20);
            expect(notificationService._averageRenderTime).toBe(15); // (10 + 20) / 2
        });
    });

    describe('Settings Validation', () => {
        it('should validate all setting types', () => {
            const service = notificationService;

            // Test all validation scenarios
            expect(service._validateSettings({ maxVisible: 5 })).toEqual({ maxVisible: 5 });
            expect(service._validateSettings({ defaultDuration: 3000 })).toEqual({ defaultDuration: 3000 });
            expect(service._validateSettings({ position: 'top-left' })).toEqual({ position: 'top-left' });
            expect(service._validateSettings({ enableSounds: true })).toEqual({ enableSounds: true });
            expect(service._validateSettings({ enableAnimations: false })).toEqual({ enableAnimations: false });
            expect(service._validateSettings({ autoCleanupInterval: 120000 })).toEqual({ autoCleanupInterval: 120000 });
            expect(service._validateSettings({ maxStoredNotifications: 100 })).toEqual({ maxStoredNotifications: 100 });
            expect(service._validateSettings({ persistentTypes: ['error', 'warning'] })).toEqual({ persistentTypes: ['error', 'warning'] });
            expect(service._validateSettings({ soundVolume: 0.8 })).toEqual({ soundVolume: 0.8 });
            expect(service._validateSettings({ customDurations: { success: 2000 } })).toEqual({ customDurations: { success: 2000 } });
        });

        it('should throw errors for invalid values', () => {
            const service = notificationService;

            expect(() => service._validateSettings({ maxVisible: 0 })).toThrow();
            expect(() => service._validateSettings({ defaultDuration: -1 })).toThrow();
            expect(() => service._validateSettings({ position: 'invalid' })).toThrow();
            expect(() => service._validateSettings({ autoCleanupInterval: 30000 })).toThrow(); // Less than 1 minute
            expect(() => service._validateSettings({ maxStoredNotifications: 5 })).toThrow(); // Less than 10
            expect(() => service._validateSettings({ persistentTypes: 'not-array' })).toThrow();
            expect(() => service._validateSettings({ soundVolume: 1.5 })).toThrow(); // Greater than 1
            expect(() => service._validateSettings({ customDurations: { invalid: 1000 } })).toThrow();
        });
    });
});