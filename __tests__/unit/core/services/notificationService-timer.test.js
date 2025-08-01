/**
 * Test per sistema di timer auto-close del NotificationService
 * Verifica durate differenziate, pausa/resume e progress bar
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { notificationService } from '../../../../src/core/services/notificationService.js';
import { stateService } from '../../../../src/core/services/stateService.js';

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
    });

    describe('Durate differenziate per tipo', () => {
        it('dovrebbe usare 4 secondi per notifiche success', () => {
            const id = notificationService.success('Test success');
            
            // Verifica che il timer sia impostato correttamente
            expect(notificationService.timers.has(id)).toBe(true);
            const timer = notificationService.timers.get(id);
            expect(timer.originalDuration).toBe(4000);
        });

        it('dovrebbe usare 5 secondi per notifiche info', () => {
            const id = notificationService.info('Test info');
            
            expect(notificationService.timers.has(id)).toBe(true);
            const timer = notificationService.timers.get(id);
            expect(timer.originalDuration).toBe(5000);
        });

        it('dovrebbe usare 6 secondi per notifiche warning', () => {
            const id = notificationService.warning('Test warning');
            
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
            const id = notificationService.success('Test custom', { duration: 10000 });
            
            expect(notificationService.timers.has(id)).toBe(true);
            const timer = notificationService.timers.get(id);
            expect(timer.originalDuration).toBe(10000);
        });
    });

    describe('Auto-close timer', () => {
        it('dovrebbe rimuovere automaticamente la notifica dopo il timeout', () => {
            const id = notificationService.success('Test auto-close');
            
            // Verifica che la notifica esista
            expect(stateService.getState('notifications')).toHaveLength(1);
            
            // Avanza il timer di 4 secondi
            vi.advanceTimersByTime(4000);
            
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
            const successId = notificationService.success('Success'); // 4s
            const infoId = notificationService.info('Info'); // 5s
            const warningId = notificationService.warning('Warning'); // 6s
            
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
            const id = notificationService.success('Test pause');
            
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
            const id = notificationService.success('Test resume');
            
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
            const id = notificationService.success('Test double pause');
            
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
            const id = notificationService.success('Test double resume');
            
            // Prova a riprendere senza aver mai pausato
            notificationService.resumeAutoCloseTimer(id);
            
            const timer = notificationService.timers.get(id);
            expect(timer.isPaused).toBe(false);
        });
    });

    describe('Progress bar integration', () => {
        beforeEach(() => {
            // Mock per querySelector
            const mockElement = {
                querySelector: vi.fn().mockReturnValue({
                    style: { setProperty: vi.fn() },
                    classList: {
                        add: vi.fn(),
                        remove: vi.fn(),
                        contains: vi.fn()
                    },
                    offsetHeight: 0
                })
            };

            notificationService.notificationContainer = {
                container: {
                    querySelector: vi.fn().mockReturnValue(mockElement)
                }
            };
        });

        it('dovrebbe avviare progress bar con durata corretta', () => {
            const id = notificationService.success('Test progress');
            
            // Verifica che startProgressBarAnimation sia stata chiamata
            const mockElement = notificationService.notificationContainer.container.querySelector();
            const mockProgressBar = mockElement.querySelector();
            
            expect(mockProgressBar.style.setProperty).toHaveBeenCalledWith('--progress-duration', '4000ms');
            expect(mockProgressBar.classList.add).toHaveBeenCalledWith('notification__progress--active');
        });

        it('dovrebbe pausare progress bar quando timer è in pausa', () => {
            const id = notificationService.success('Test progress pause');
            
            notificationService.pauseAutoCloseTimer(id);
            
            const mockElement = notificationService.notificationContainer.container.querySelector();
            const mockProgressBar = mockElement.querySelector();
            
            expect(mockProgressBar.classList.add).toHaveBeenCalledWith('notification__progress--paused');
        });

        it('dovrebbe riprendere progress bar con tempo rimanente', () => {
            const id = notificationService.success('Test progress resume');
            
            vi.advanceTimersByTime(2000);
            notificationService.pauseAutoCloseTimer(id);
            notificationService.resumeAutoCloseTimer(id);
            
            const mockElement = notificationService.notificationContainer.container.querySelector();
            const mockProgressBar = mockElement.querySelector();
            
            expect(mockProgressBar.style.setProperty).toHaveBeenCalledWith('--progress-duration', '2000ms');
            expect(mockProgressBar.classList.add).toHaveBeenCalledWith('notification__progress--resumed');
        });
    });

    describe('Cleanup e gestione memoria', () => {
        it('dovrebbe pulire timer quando notifica viene rimossa manualmente', () => {
            const id = notificationService.success('Test cleanup');
            
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
        });

        it('dovrebbe pulire timer per tipo specifico', () => {
            const successId = notificationService.success('Success');
            const infoId = notificationService.info('Info');
            
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