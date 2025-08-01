/**
 * Test di integrazione per sistema timer notifiche
 * Verifica il funzionamento completo del sistema timer in ambiente reale
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { notificationService } from '../../../src/core/services/notificationService.js';
import { stateService } from '../../../src/core/services/stateService.js';

// Mock per DOM
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

describe('Notification Timer Integration', () => {
    beforeEach(() => {
        // Reset DOM
        document.body.innerHTML = '';
        
        // Reset state
        stateService.setState('notifications', []);
        stateService.setState('notificationSettings', {
            maxVisible: 5,
            defaultDuration: 5000,
            position: 'top-right',
            enableSounds: false
        });

        // Reset timers
        vi.clearAllTimers();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
        
        // Cleanup service
        notificationService.clear();
    });

    describe('Durate differenziate', () => {
        it('dovrebbe applicare durate corrette per ogni tipo', async () => {
            // Test success (4s)
            const successId = notificationService.success('Test success');
            expect(notificationService.timers.has(successId)).toBe(true);
            expect(notificationService.timers.get(successId).originalDuration).toBe(4000);

            // Test info (5s)
            const infoId = notificationService.info('Test info');
            expect(notificationService.timers.has(infoId)).toBe(true);
            expect(notificationService.timers.get(infoId).originalDuration).toBe(5000);

            // Test warning (6s)
            const warningId = notificationService.warning('Test warning');
            expect(notificationService.timers.has(warningId)).toBe(true);
            expect(notificationService.timers.get(warningId).originalDuration).toBe(6000);

            // Test error (persistente)
            const errorId = notificationService.error('Test error');
            expect(notificationService.timers.has(errorId)).toBe(false);
        });

        it('dovrebbe permettere override delle durate', () => {
            const customId = notificationService.success('Custom duration', { duration: 10000 });
            expect(notificationService.timers.get(customId).originalDuration).toBe(10000);
        });
    });

    describe('Funzionamento timer', () => {
        it('dovrebbe rimuovere notifiche dopo timeout', () => {
            const id = notificationService.success('Auto close test');
            
            expect(stateService.getState('notifications')).toHaveLength(1);
            expect(notificationService.timers.has(id)).toBe(true);
            
            // Avanza timer
            vi.advanceTimersByTime(4000);
            
            // Attendi che l'animazione di rimozione completi
            vi.advanceTimersByTime(300);
            
            expect(stateService.getState('notifications')).toHaveLength(0);
            expect(notificationService.timers.has(id)).toBe(false);
        });

        it('dovrebbe gestire timer multipli correttamente', () => {
            const success1 = notificationService.success('Success 1'); // 4s
            const success2 = notificationService.success('Success 2'); // 4s
            const info1 = notificationService.info('Info 1'); // 5s
            
            expect(notificationService.timers.size).toBe(3);
            expect(stateService.getState('notifications')).toHaveLength(3);
            
            // Dopo 4 secondi, i success dovrebbero essere rimossi
            vi.advanceTimersByTime(4000);
            vi.advanceTimersByTime(300); // Animazione
            
            expect(notificationService.timers.size).toBe(1);
            expect(stateService.getState('notifications')).toHaveLength(1);
            
            // Dopo altro 1 secondo, anche info dovrebbe essere rimossa
            vi.advanceTimersByTime(1000);
            vi.advanceTimersByTime(300); // Animazione
            
            expect(notificationService.timers.size).toBe(0);
            expect(stateService.getState('notifications')).toHaveLength(0);
        });
    });

    describe('Pausa e resume', () => {
        it('dovrebbe pausare e riprendere timer correttamente', () => {
            const id = notificationService.success('Pause test');
            
            // Avanza di 2 secondi
            vi.advanceTimersByTime(2000);
            
            // Pausa
            notificationService.pauseAutoCloseTimer(id);
            const timer = notificationService.timers.get(id);
            expect(timer.isPaused).toBe(true);
            expect(timer.remainingTime).toBe(2000); // 4000 - 2000
            
            // Avanza durante pausa - non dovrebbe rimuovere
            vi.advanceTimersByTime(5000);
            expect(stateService.getState('notifications')).toHaveLength(1);
            
            // Riprendi
            notificationService.resumeAutoCloseTimer(id);
            expect(timer.isPaused).toBe(false);
            
            // Avanza del tempo rimanente
            vi.advanceTimersByTime(2000);
            vi.advanceTimersByTime(300); // Animazione
            
            expect(stateService.getState('notifications')).toHaveLength(0);
        });

        it('non dovrebbe pausare timer già in pausa', () => {
            const id = notificationService.success('Double pause test');
            
            vi.advanceTimersByTime(1000);
            notificationService.pauseAutoCloseTimer(id);
            
            const timer1 = notificationService.timers.get(id);
            const remainingTime1 = timer1.remainingTime;
            
            // Pausa di nuovo
            notificationService.pauseAutoCloseTimer(id);
            
            const timer2 = notificationService.timers.get(id);
            expect(timer2.remainingTime).toBe(remainingTime1);
        });
    });

    describe('Cleanup e gestione memoria', () => {
        it('dovrebbe pulire timer quando notifica viene rimossa', () => {
            const id = notificationService.success('Cleanup test');
            
            expect(notificationService.timers.has(id)).toBe(true);
            
            notificationService.removeNotification(id);
            
            expect(notificationService.timers.has(id)).toBe(false);
        });

        it('dovrebbe pulire tutti i timer con clear()', () => {
            notificationService.success('Test 1');
            notificationService.info('Test 2');
            notificationService.warning('Test 3');
            
            expect(notificationService.timers.size).toBe(3);
            
            notificationService.clear();
            
            expect(notificationService.timers.size).toBe(0);
            expect(stateService.getState('notifications')).toHaveLength(0);
        });
    });

    describe('Edge cases', () => {
        it('dovrebbe gestire durata 0 (persistente)', () => {
            const id = notificationService.success('Persistent', { duration: 0 });
            
            expect(notificationService.timers.has(id)).toBe(false);
            
            // Avanza molto tempo - dovrebbe rimanere
            vi.advanceTimersByTime(10000);
            expect(stateService.getState('notifications')).toHaveLength(1);
        });

        it('dovrebbe gestire durata negativa', () => {
            const id = notificationService.success('Negative duration', { duration: -1000 });
            
            expect(notificationService.timers.has(id)).toBe(false);
        });

        it('dovrebbe sostituire timer esistente', () => {
            const id = notificationService.success('Test');
            
            // Simula restart del timer
            notificationService.startAutoCloseTimer(id, 8000);
            
            const timer = notificationService.timers.get(id);
            expect(timer.originalDuration).toBe(8000);
        });
    });

    describe('Integrazione con DOM', () => {
        beforeEach(() => {
            // Mock per container DOM
            const mockContainer = document.createElement('div');
            mockContainer.className = 'notification-container';
            document.body.appendChild(mockContainer);
            
            // Mock per notificationContainer
            notificationService.notificationContainer = {
                container: mockContainer,
                addNotification: vi.fn(),
                removeNotification: vi.fn(),
                clearAllNotifications: vi.fn()
            };
        });

        it('dovrebbe creare progress bar con durata corretta', () => {
            const id = notificationService.success('Progress test');
            
            // Verifica che il DOM contenga progress bar
            const notifications = stateService.getState('notifications');
            expect(notifications).toHaveLength(1);
            expect(notifications[0].id).toBe(id);
        });

        it('dovrebbe gestire eventi hover per pausa timer', () => {
            const id = notificationService.success('Hover test');
            
            // Simula hover
            notificationService.pauseAutoCloseTimer(id);
            
            const timer = notificationService.timers.get(id);
            expect(timer.isPaused).toBe(true);
            
            // Simula mouse leave
            notificationService.resumeAutoCloseTimer(id);
            
            expect(timer.isPaused).toBe(false);
        });
    });
});