// __tests__/unit/core/services/stateService-notifications.test.js

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock window.matchMedia before importing stateService
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

import { stateService } from '../../../../src/core/services/stateService.js';

describe('StateService - Notification Integration', () => {
    beforeEach(() => {
        // Reset stato prima di ogni test
        stateService.clearState([]);
        vi.clearAllTimers();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        stateService.stopAutoCleanup();
    });

    describe('Notification Settings Management', () => {
        it('should have default notification settings', () => {
            const settings = stateService.getNotificationSettings();
            
            expect(settings).toEqual({
                maxVisible: 5,
                defaultDuration: 5000,
                position: 'top-right',
                enableSounds: false,
                enableAnimations: expect.any(Boolean),
                autoCleanupInterval: 300000,
                maxStoredNotifications: 50,
                persistentTypes: ['error'],
                soundVolume: 0.5,
                customDurations: {
                    success: 4000,
                    info: 5000,
                    warning: 6000,
                    error: 0
                }
            });
        });

        it('should update notification settings', () => {
            const newSettings = {
                maxVisible: 10,
                position: 'top-left',
                enableSounds: true
            };

            stateService.updateNotificationSettings(newSettings);
            const settings = stateService.getNotificationSettings();

            expect(settings.maxVisible).toBe(10);
            expect(settings.position).toBe('top-left');
            expect(settings.enableSounds).toBe(true);
        });

        it('should persist notification settings', () => {
            const newSettings = {
                maxVisible: 8,
                defaultDuration: 3000
            };

            stateService.updateNotificationSettings(newSettings);
            
            // Verifica che localStorage.setItem sia stato chiamato
            expect(localStorage.setItem).toHaveBeenCalledWith(
                'app_state_notificationSettings',
                expect.stringContaining('"maxVisible":8')
            );
            
            // Simula il caricamento da localStorage
            localStorage.getItem.mockReturnValue(JSON.stringify({
                ...stateService.getNotificationSettings(),
                maxVisible: 8,
                defaultDuration: 3000
            }));
            
            // Crea nuovo servizio che dovrebbe caricare da localStorage
            const newStateService = new (stateService.constructor)();
            const settings = newStateService.getNotificationSettings();

            expect(settings.maxVisible).toBe(8);
            expect(settings.defaultDuration).toBe(3000);
        });
    });

    describe('Enhanced Notification Management', () => {
        it('should add notification with custom duration based on type', () => {
            const id = stateService.addNotification('success', 'Test message');
            const notifications = stateService.getState('notifications');
            
            expect(notifications).toHaveLength(1);
            expect(notifications[0].options.duration).toBe(4000); // success default
            expect(notifications[0].type).toBe('success');
        });

        it('should respect persistent types', () => {
            const id = stateService.addNotification('error', 'Error message');
            const notifications = stateService.getState('notifications');
            
            expect(notifications[0].options.persistent).toBe(true);
            expect(notifications[0].options.duration).toBe(0);
        });

        it('should limit stored notifications', () => {
            // Imposta limite basso per test
            stateService.updateNotificationSettings({ maxStoredNotifications: 3 });

            // Aggiungi più notifiche del limite
            for (let i = 0; i < 5; i++) {
                stateService.addNotification('info', `Message ${i}`);
            }

            const notifications = stateService.getState('notifications');
            expect(notifications.length).toBeLessThanOrEqual(3);
        });

        it('should not remove persistent error notifications when limiting', () => {
            stateService.updateNotificationSettings({ maxStoredNotifications: 2 });

            // Aggiungi errore persistente
            stateService.addNotification('error', 'Critical error');
            
            // Aggiungi altre notifiche
            stateService.addNotification('info', 'Info 1');
            stateService.addNotification('info', 'Info 2');
            stateService.addNotification('info', 'Info 3');

            const notifications = stateService.getState('notifications');
            const errorNotifications = notifications.filter(n => n.type === 'error');
            
            expect(errorNotifications).toHaveLength(1);
            expect(errorNotifications[0].message).toBe('Critical error');
        });
    });

    describe('Notification Queries', () => {
        beforeEach(() => {
            stateService.addNotification('success', 'Success 1');
            stateService.addNotification('error', 'Error 1');
            stateService.addNotification('warning', 'Warning 1');
            stateService.addNotification('success', 'Success 2');
        });

        it('should get notifications by type', () => {
            const successNotifications = stateService.getNotificationsByType('success');
            const errorNotifications = stateService.getNotificationsByType('error');

            expect(successNotifications).toHaveLength(2);
            expect(errorNotifications).toHaveLength(1);
            expect(successNotifications[0].message).toBe('Success 1');
        });

        it('should count notifications by type', () => {
            expect(stateService.countNotificationsByType('success')).toBe(2);
            expect(stateService.countNotificationsByType('error')).toBe(1);
            expect(stateService.countNotificationsByType('info')).toBe(0);
        });

        it('should detect error notifications', () => {
            expect(stateService.hasErrorNotifications()).toBe(true);
            
            stateService.clearNotificationsByType('error');
            expect(stateService.hasErrorNotifications()).toBe(false);
        });

        it('should get visible notifications', () => {
            const notifications = stateService.getState('notifications');
            notifications[0].isRemoving = true; // Simula notifica in rimozione

            const visible = stateService.getVisibleNotifications();
            expect(visible).toHaveLength(3); // 4 totali - 1 in rimozione
        });
    });

    describe('Notification Cleanup', () => {
        it('should clear old notifications', () => {
            // Aggiungi notifiche con timestamp diversi
            const oldNotification = stateService.addNotification('info', 'Old message');
            const recentNotification = stateService.addNotification('info', 'Recent message');

            // Modifica timestamp per simulare notifica vecchia
            const notifications = stateService.getState('notifications');
            const updatedNotifications = notifications.map((n, index) => {
                if (index === 0) {
                    return { ...n, timestamp: new Date(Date.now() - 400000) }; // 6+ minuti fa
                }
                return n;
            });

            stateService.setState('notifications', updatedNotifications);

            const removed = stateService.clearOldNotifications(300000); // 5 minuti
            const remaining = stateService.getState('notifications');

            expect(removed).toBe(1);
            expect(remaining).toHaveLength(1);
            expect(remaining[0].message).toBe('Recent message');
        });

        it('should not remove persistent error notifications during cleanup', () => {
            const errorId = stateService.addNotification('error', 'Critical error');
            const infoId = stateService.addNotification('info', 'Old info');

            // Simula notifiche vecchie
            const notifications = stateService.getState('notifications');
            const updatedNotifications = notifications.map(n => ({
                ...n,
                timestamp: new Date(Date.now() - 400000)
            }));
            stateService.setState('notifications', updatedNotifications);

            const removed = stateService.clearOldNotifications(300000);
            const remaining = stateService.getState('notifications');

            expect(removed).toBe(1); // Solo info rimossa
            expect(remaining).toHaveLength(1);
            expect(remaining[0].type).toBe('error');
        });

        it('should start and stop auto cleanup', () => {
            const spy = vi.spyOn(stateService, 'clearOldNotifications');
            
            stateService.startAutoCleanup();
            
            // Avanza timer
            vi.advanceTimersByTime(300000);
            
            expect(spy).toHaveBeenCalled();
            
            stateService.stopAutoCleanup();
            spy.mockClear();
            
            // Avanza timer dopo stop
            vi.advanceTimersByTime(300000);
            
            expect(spy).not.toHaveBeenCalled();
        });
    });

    describe('Notification Statistics', () => {
        beforeEach(() => {
            stateService.addNotification('success', 'Success 1');
            stateService.addNotification('error', 'Error 1');
            stateService.addNotification('warning', 'Warning 1');
            stateService.addNotification('success', 'Success 2');
        });

        it('should provide notification statistics', () => {
            const stats = stateService.getNotificationStats();

            expect(stats.total).toBe(4);
            expect(stats.visible).toBe(4);
            expect(stats.byType.success).toBe(2);
            expect(stats.byType.error).toBe(1);
            expect(stats.byType.warning).toBe(1);
            expect(stats.byType.info).toBe(0);
            expect(stats.persistent).toBe(1); // Solo error è persistente
            expect(stats.oldest).toBeTypeOf('number');
            expect(stats.newest).toBeTypeOf('number');
        });

        it('should handle empty notifications in stats', () => {
            stateService.clearAllNotifications();
            const stats = stateService.getNotificationStats();

            expect(stats.total).toBe(0);
            expect(stats.visible).toBe(0);
            expect(stats.oldest).toBeNull();
            expect(stats.newest).toBeNull();
        });
    });

    describe('Settings Import/Export', () => {
        it('should export notification settings', () => {
            const exported = stateService.exportNotificationSettings();

            expect(exported).toHaveProperty('settings');
            expect(exported).toHaveProperty('timestamp');
            expect(exported).toHaveProperty('version', '1.0');
            expect(exported.settings).toEqual(stateService.getNotificationSettings());
        });

        it('should import notification settings', () => {
            const customSettings = {
                maxVisible: 8,
                position: 'bottom-right',
                enableSounds: true
            };

            const backup = {
                version: '1.0',
                settings: customSettings,
                timestamp: new Date().toISOString()
            };

            const success = stateService.importNotificationSettings(backup);
            expect(success).toBe(true);

            const settings = stateService.getNotificationSettings();
            expect(settings.maxVisible).toBe(8);
            expect(settings.position).toBe('bottom-right');
            expect(settings.enableSounds).toBe(true);
        });

        it('should reject invalid backup format', () => {
            const invalidBackup = {
                version: '2.0', // Versione non supportata
                settings: {}
            };

            const success = stateService.importNotificationSettings(invalidBackup);
            expect(success).toBe(false);
        });
    });

    describe('Cleanup on Destroy', () => {
        it('should cleanup resources on destroy', () => {
            const spy = vi.spyOn(stateService, 'stopAutoCleanup');
            
            stateService.destroy();
            
            expect(spy).toHaveBeenCalled();
            expect(stateService.subscribers.size).toBe(0);
        });
    });
});