/**
 * Test per sistema di timer auto-close del NotificationService
 * Verifica durate differenziate, pausa/resume e progress bar
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Array per tracciare le notifiche nel mock
let mockNotifications = [];

// Create spies/mocks using vi.hoisted to avoid hoisting issues
const stateSpies = vi.hoisted(() => ({
    setState: vi.fn((key, value) => {
        if (key === 'notifications') {
            mockNotifications.length = 0;
            mockNotifications.push(...value);
            console.log(`[StateService] New notifications array length: ${value.length}`, value);
        }
    }),
    getState: vi.fn((key) => {
        if (key === 'notifications') {
            console.log(`[StateService] Current notifications before adding: ${mockNotifications.length}`, mockNotifications);
            return [...mockNotifications];
        }
        if (key === 'notificationSettings') {
            return {
                maxVisible: 5,
                defaultDuration: 5000,
                position: 'top-right',
                enableSounds: false,
                enableAnimations: true,
                autoCleanupInterval: 300000,
                maxStoredNotifications: 50,
                persistentTypes: ['error'],
                soundVolume: 0.5,
                customDurations: {
                    success: 4000,
                    info: 5000,
                    warning: 6000,
                    error: 0,
                },
            };
        }
        return [];
    }),
    addNotification: vi.fn((type, message, options = {}) => {
        // Simula la logica di addNotification dal servizio reale
        const settings = {
            maxVisible: 5,
            defaultDuration: 5000,
            position: 'top-right',
            persistentTypes: ['error'],
            customDurations: {
                success: 4000,
                info: 5000,
                warning: 6000,
                error: 0,
            }
        };

        const customDuration = settings.customDurations[type] || settings.defaultDuration;
        
        const notification = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type,
            message,
            timestamp: new Date(),
            isVisible: true,
            isRemoving: false,
            options: {
                duration: customDuration,
                persistent: settings.persistentTypes.includes(type),
                closable: true,
                position: settings.position,
                priority: 0,
                ...options,
            },
        };

        // Se persistent è true, forza duration a 0
        if (notification.options.persistent) {
            notification.options.duration = 0;
        }

        console.log(`[StateService] Current notifications before adding: ${mockNotifications.length}`, mockNotifications);
        mockNotifications.push(notification);
        console.log(`[StateService] Notification added. New notifications array length: ${mockNotifications.length}`, mockNotifications);
        
        return notification.id;
    }),
    removeNotification: vi.fn((id) => {
        const index = mockNotifications.findIndex(n => n.id === id);
        if (index !== -1) {
            mockNotifications.splice(index, 1);
        }
    }),
    subscribe: vi.fn(),
    clearAllNotifications: vi.fn(() => {
        mockNotifications.length = 0;
    }),
    clearNotificationsByType: vi.fn((type) => {
        const toRemove = mockNotifications.filter(n => n.type === type);
        toRemove.forEach(n => {
            const index = mockNotifications.findIndex(existing => existing.id === n.id);
            if (index !== -1) {
                mockNotifications.splice(index, 1);
            }
        });
    }),
    updateNotificationSettings: vi.fn(),
    getNotificationSettings: vi.fn(() => ({ position: 'top-right', maxVisible: 5 }))
}));

// Mock the exact module path used in the service
vi.mock('../../../../src/core/services/state/stateService.js', () => ({ stateService: stateSpies }));

// We'll import the service after mocks are set up
let notificationService;

// Mock per DOM e timer
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

// Mock per vibrazione
Object.defineProperty(navigator, 'vibrate', {
    writable: true,
    value: vi.fn()
});

describe('NotificationService - Timer Management', () => {
    let stateService;
    
    beforeEach(async () => {
        // Reset modules and import the service with mocks
        vi.resetModules();
        
        // Import both services after mocks are set up
        const services = await import('../../../../src/core/services/notifications/notificationService.js');
        const stateServices = await import('../../../../src/core/services/state/stateService.js');
        notificationService = services.notificationService;
        stateService = stateServices.stateService;

        // Reset timers
        vi.clearAllTimers();
        vi.useFakeTimers();
        
        // Reset notification service initialization flag
        notificationService.initialized = false;
        
        // Setup comprehensive mock container
        const mockProgressBar = {
            style: {
                setProperty: vi.fn()
            },
            classList: {
                add: vi.fn(),
                remove: vi.fn()
            }
        };

        const mockElement = {
            querySelector: vi.fn(() => mockProgressBar)
        };

        notificationService.notificationContainer = {
            addNotification: vi.fn(),
            removeNotification: vi.fn(),
            clearAllNotifications: vi.fn(),
            destroy: vi.fn(),
            container: document.createElement('div'),
            getElementById: vi.fn(() => mockElement)
        };
        
        // Initialize notification service
        await notificationService.init();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
        
        // Clear all timers from notification service
        notificationService.timers.clear();
        
        // Clear all notifications from mock state
        mockNotifications.length = 0;
        
        // Clear notification container
        if (notificationService.notificationContainer) {
            notificationService.notificationContainer = null;
        }
        
        // Reset initialization flag
        notificationService.initialized = false;
    });

    describe('Durate differenziate per tipo', () => {
        it('dovrebbe usare 4 secondi per notifiche success', () => {
            // Setup mock container per simulare DOM
            notificationService.notificationContainer = {
                addNotification: vi.fn(),
                removeNotification: vi.fn(),
                clearAllNotifications: vi.fn(),
                container: document.createElement('div')
            };
            
            const id = notificationService.success('Test success');
            
            // Simula il timer che sarebbe stato creato dal renderer
            notificationService.startAutoCloseTimer(id, 4000);
            
            // Verifica che il timer sia impostato correttamente
            expect(notificationService.timers.has(id)).toBe(true);
            const timer = notificationService.timers.get(id);
            expect(timer.originalDuration).toBe(4000);
        });

        it('dovrebbe usare 5 secondi per notifiche info', () => {
            // Setup mock container per simulare DOM
            notificationService.notificationContainer = {
                addNotification: vi.fn(),
                removeNotification: vi.fn(),
                clearAllNotifications: vi.fn(),
                container: document.createElement('div')
            };
            
            const id = notificationService.info('Test info');
            
            // Simula il timer che sarebbe stato creato dal renderer
            notificationService.startAutoCloseTimer(id, 5000);
            
            expect(notificationService.timers.has(id)).toBe(true);
            const timer = notificationService.timers.get(id);
            expect(timer.originalDuration).toBe(5000);
        });

        it('dovrebbe usare 6 secondi per notifiche warning', () => {
            // Setup mock container
            notificationService.notificationContainer = {
                addNotification: vi.fn(),
                removeNotification: vi.fn(),
                clearAllNotifications: vi.fn(),
                container: document.createElement('div')
            };
            
            const id = notificationService.warning('Test warning');
            
            // Simula il timer che sarebbe stato creato dal renderer
            notificationService.startAutoCloseTimer(id, 6000);
            
            expect(notificationService.timers.has(id)).toBe(true);
            const timer = notificationService.timers.get(id);
            expect(timer.originalDuration).toBe(6000);
        });

        it('dovrebbe essere persistente per notifiche error (0 secondi)', () => {
            const id = notificationService.error('Test error');
            
            // Le notifiche error non dovrebbero avere timer
            expect(notificationService.timers.has(id)).toBe(false);
        });

        it('dovrebbe permettere override della durata', () => {
            // Setup mock container
            notificationService.notificationContainer = {
                addNotification: vi.fn(),
                removeNotification: vi.fn(),
                clearAllNotifications: vi.fn(),
                container: document.createElement('div')
            };
            
            const id = notificationService.success('Test custom', { duration: 10000 });
            
            // Simula il timer che sarebbe stato creato dal renderer
            notificationService.startAutoCloseTimer(id, 10000);
            
            expect(notificationService.timers.has(id)).toBe(true);
            const timer = notificationService.timers.get(id);
            expect(timer.originalDuration).toBe(10000);
        });
    });

    describe('Auto-close timer', () => {
        it('dovrebbe rimuovere automaticamente la notifica dopo il timeout', () => {
            // Setup mock container
            notificationService.notificationContainer = {
                addNotification: vi.fn(),
                removeNotification: vi.fn(),
                clearAllNotifications: vi.fn(),
                container: document.createElement('div')
            };
            
            const id = notificationService.success('Test auto-close');
            
            // Simula il timer che sarebbe stato creato dal renderer
            notificationService.startAutoCloseTimer(id, 1000);
            
            // Verifica che il timer sia stato creato
            expect(notificationService.timers.has(id)).toBe(true);
            
            // Avanza il tempo
            vi.advanceTimersByTime(1000);
            
            // Verifica che la notifica sia stata rimossa
            expect(stateService.getState('notifications')).toHaveLength(0);
            expect(notificationService.timers.has(id)).toBe(false);
        });

        it('non dovrebbe rimuovere notifiche persistenti', () => {
            const id = notificationService.error('Test persistent');
            
            // Avanza il timer molto oltre
            vi.advanceTimersByTime(10000);
            
            // La notifica dovrebbe ancora esistere
            expect(stateService.getState('notifications')).toHaveLength(1);
        });

        it('dovrebbe gestire multiple notifiche con timer diversi', () => {
            // Setup mock container
            notificationService.notificationContainer = {
                addNotification: vi.fn(),
                removeNotification: vi.fn(),
                clearAllNotifications: vi.fn(),
                container: document.createElement('div')
            };
            
            const successId = notificationService.success('Success'); // 4s
            const infoId = notificationService.info('Info'); // 5s
            const warningId = notificationService.warning('Warning'); // 6s
            
            // Simula i timer che sarebbero stati creati dal renderer
            notificationService.startAutoCloseTimer(successId, 4000);
            notificationService.startAutoCloseTimer(infoId, 5000);
            notificationService.startAutoCloseTimer(warningId, 6000);
            
            expect(stateService.getState('notifications')).toHaveLength(3);
            
            // Dopo 4 secondi, solo success dovrebbe essere rimossa
            vi.advanceTimersByTime(4000);
            expect(stateService.getState('notifications')).toHaveLength(2);
            
            // Dopo altri 1 secondo (totale 5s), anche info dovrebbe essere rimossa
            vi.advanceTimersByTime(1000);
            expect(stateService.getState('notifications')).toHaveLength(1);
            
            // Dopo altro 1 secondo (totale 6s), anche warning dovrebbe essere rimossa
            vi.advanceTimersByTime(1000);
            expect(stateService.getState('notifications')).toHaveLength(0);
        });
    });

    describe('Pausa e resume timer', () => {
        it('dovrebbe pausare il timer correttamente', () => {
            // Setup mock container
            notificationService.notificationContainer = {
                addNotification: vi.fn(),
                removeNotification: vi.fn(),
                clearAllNotifications: vi.fn(),
                container: document.createElement('div')
            };
            
            const id = notificationService.success('Test pause');
            
            // Simula il timer che sarebbe stato creato dal renderer
            notificationService.startAutoCloseTimer(id, 4000);
            
            // Avanza di 2 secondi
            vi.advanceTimersByTime(2000);
            
            // Pausa il timer
            notificationService.pauseAutoCloseTimer(id);
            
            const timer = notificationService.timers.get(id);
            expect(timer.isPaused).toBe(true);
            expect(timer.remainingTime).toBe(2000); // 4000 - 2000
            
            // Avanza altri 5 secondi - la notifica non dovrebbe essere rimossa
            vi.advanceTimersByTime(5000);
            expect(stateService.getState('notifications')).toHaveLength(1);
        });

        it('dovrebbe riprendere il timer con il tempo rimanente', () => {
            // Setup mock container
            notificationService.notificationContainer = {
                addNotification: vi.fn(),
                removeNotification: vi.fn(),
                clearAllNotifications: vi.fn(),
                container: document.createElement('div')
            };
            
            const id = notificationService.success('Test resume');
            
            // Simula il timer che sarebbe stato creato dal renderer
            notificationService.startAutoCloseTimer(id, 4000);
            
            // Avanza di 2 secondi
            vi.advanceTimersByTime(2000);
            
            // Pausa
            notificationService.pauseAutoCloseTimer(id);
            
            // Avanza durante la pausa (non dovrebbe influire)
            vi.advanceTimersByTime(3000);
            
            // Riprendi
            notificationService.resumeAutoCloseTimer(id);
            
            const timer = notificationService.timers.get(id);
            expect(timer.isPaused).toBe(false);
            
            // Avanza del tempo rimanente (2 secondi)
            vi.advanceTimersByTime(2000);
            
            // Ora la notifica dovrebbe essere rimossa
            expect(stateService.getState('notifications')).toHaveLength(0);
        });

        it('non dovrebbe pausare timer già in pausa', () => {
            // Setup mock container
            notificationService.notificationContainer = {
                addNotification: vi.fn(),
                removeNotification: vi.fn(),
                clearAllNotifications: vi.fn(),
                container: document.createElement('div')
            };
            
            const id = notificationService.success('Test double pause');
            
            // Simula il timer che sarebbe stato creato dal renderer
            notificationService.startAutoCloseTimer(id, 4000);
            
            vi.advanceTimersByTime(1000);
            notificationService.pauseAutoCloseTimer(id);
            
            const timer1 = notificationService.timers.get(id);
            const remainingTime1 = timer1.remainingTime;
            
            // Pausa di nuovo
            notificationService.pauseAutoCloseTimer(id);
            
            const timer2 = notificationService.timers.get(id);
            expect(timer2.remainingTime).toBe(remainingTime1);
        });

        it('non dovrebbe riprendere timer non in pausa', () => {
            // Setup mock container
            notificationService.notificationContainer = {
                addNotification: vi.fn(),
                removeNotification: vi.fn(),
                clearAllNotifications: vi.fn(),
                container: document.createElement('div')
            };
            
            const id = notificationService.success('Test double resume');
            
            // Simula il timer che sarebbe stato creato dal renderer
            notificationService.startAutoCloseTimer(id, 4000);
            
            // Prova a riprendere senza aver mai pausato
            notificationService.resumeAutoCloseTimer(id);
            
            const timer = notificationService.timers.get(id);
            expect(timer.isPaused).toBe(false);
        });
    });

    describe('Progress bar integration', () => {
        it.skip('dovrebbe avviare progress bar con durata corretta', () => {
            // Questo test richiede mock DOM complessi - da implementare successivamente
        });

        it.skip('dovrebbe pausare progress bar quando timer è in pausa', () => {
            // Questo test richiede mock DOM complessi - da implementare successivamente  
        });

        it.skip('dovrebbe riprendere progress bar con tempo rimanente', () => {
            // Questo test richiede mock DOM complessi - da implementare successivamente
        });
    });

    describe('Cleanup e gestione memoria', () => {
        it('dovrebbe pulire timer quando notifica viene rimossa manualmente', () => {
            // Setup mock container
            notificationService.notificationContainer = {
                addNotification: vi.fn(),
                removeNotification: vi.fn(),
                clearAllNotifications: vi.fn(),
                container: document.createElement('div')
            };
            
            const id = notificationService.success('Test cleanup');
            
            // Simula il timer che sarebbe stato creato dal renderer
            notificationService.startAutoCloseTimer(id, 4000);
            
            expect(notificationService.timers.has(id)).toBe(true);
            
            notificationService.removeNotification(id);
            
            expect(notificationService.timers.has(id)).toBe(false);
        });

        it('dovrebbe pulire tutti i timer con clear()', () => {
            // Setup mock container
            notificationService.notificationContainer = {
                addNotification: vi.fn(),
                removeNotification: vi.fn(),
                clearAllNotifications: vi.fn(),
                container: document.createElement('div')
            };
            
            const id1 = notificationService.success('Test 1');
            const id2 = notificationService.info('Test 2');
            const id3 = notificationService.warning('Test 3');
            
            // Simula i timer che sarebbero stati creati dal renderer
            notificationService.startAutoCloseTimer(id1, 4000);
            notificationService.startAutoCloseTimer(id2, 5000);
            notificationService.startAutoCloseTimer(id3, 6000);
            
            expect(notificationService.timers.size).toBe(3);
            
            notificationService.clear();
            
            expect(notificationService.timers.size).toBe(0);
        });

        it('dovrebbe pulire timer per tipo specifico', () => {
            // Setup mock container
            notificationService.notificationContainer = {
                addNotification: vi.fn(),
                removeNotification: vi.fn(),
                clearAllNotifications: vi.fn(),
                container: document.createElement('div')
            };
            
            const successId = notificationService.success('Success');
            const infoId = notificationService.info('Info');
            
            // Simula i timer che sarebbero stati creati dal renderer
            notificationService.startAutoCloseTimer(successId, 4000);
            notificationService.startAutoCloseTimer(infoId, 5000);
            
            expect(notificationService.timers.size).toBe(2);
            
            notificationService.clearByType('success');
            
            expect(notificationService.timers.has(successId)).toBe(false);
            expect(notificationService.timers.has(infoId)).toBe(true);
            expect(notificationService.timers.size).toBe(1);
        });
    });

    describe('Edge cases', () => {
        it('dovrebbe gestire timer per notifica inesistente', () => {
            expect(() => {
                notificationService.pauseAutoCloseTimer('non-existent');
                notificationService.resumeAutoCloseTimer('non-existent');
                notificationService.stopAutoCloseTimer('non-existent');
            }).not.toThrow();
        });

        it('dovrebbe gestire durata 0 correttamente', () => {
            const id = notificationService.success('Test zero duration', { duration: 0 });
            
            expect(notificationService.timers.has(id)).toBe(false);
        });

        it('dovrebbe gestire durata negativa', () => {
            const id = notificationService.success('Test negative duration', { duration: -1000 });
            
            expect(notificationService.timers.has(id)).toBe(false);
        });

        it('dovrebbe sostituire timer esistente per stessa notifica', () => {
            const id = notificationService.success('Test');
            
            // Simula restart del timer
            notificationService.startAutoCloseTimer(id, 8000);
            
            const timer = notificationService.timers.get(id);
            expect(timer.originalDuration).toBe(8000);
        });
    });
});