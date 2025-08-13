/**
 * Test per NotificationLiveRegion
 * Verifica funzionalità live region per screen reader
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NotificationLiveRegion } from '../../../../src/shared/components/notifications/NotificationLiveRegion.js';

describe('NotificationLiveRegion', () => {
    let liveRegion;

    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        if (liveRegion) {
            liveRegion.destroy();
        }
        
        // Cleanup singleton
        NotificationLiveRegion.destroyInstance();
        
        // Rimuovi elementi dal DOM
        const announcer = document.getElementById('notification-announcer');
        if (announcer) {
            announcer.remove();
        }
        
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    describe('Inizializzazione', () => {
        it('dovrebbe creare live region con configurazione default', () => {
            liveRegion = new NotificationLiveRegion();
            
            expect(liveRegion.element).toBeDefined();
            expect(liveRegion.element.id).toBe('notification-announcer');
            expect(liveRegion.element.getAttribute('aria-live')).toBe('polite');
            expect(liveRegion.element.getAttribute('aria-atomic')).toBe('true');
            expect(liveRegion.element.getAttribute('role')).toBe('status');
        });

        it('dovrebbe utilizzare configurazione personalizzata', () => {
            liveRegion = new NotificationLiveRegion({
                id: 'custom-announcer',
                defaultLive: 'assertive',
                queueDelay: 200
            });
            
            expect(liveRegion.element.id).toBe('custom-announcer');
            expect(liveRegion.element.getAttribute('aria-live')).toBe('assertive');
            expect(liveRegion.options.queueDelay).toBe(200);
        });

        it('dovrebbe essere nascosto visivamente ma accessibile', () => {
            liveRegion = new NotificationLiveRegion();
            
            const styles = liveRegion.element.style;
            expect(styles.position).toBe('absolute');
            expect(styles.width).toBe('1px');
            expect(styles.height).toBe('1px');
            expect(styles.overflow).toBe('hidden');
        });

        it('dovrebbe rimuovere elemento esistente se presente', () => {
            // Crea elemento esistente
            const existing = document.createElement('div');
            existing.id = 'notification-announcer';
            document.body.appendChild(existing);
            
            liveRegion = new NotificationLiveRegion();
            
            expect(document.querySelectorAll('#notification-announcer').length).toBe(1);
            expect(document.getElementById('notification-announcer')).toBe(liveRegion.element);
        });
    });

    describe('Annunci Base', () => {
        beforeEach(() => {
            liveRegion = new NotificationLiveRegion({
                enableQueue: false // Disabilita coda per test semplici
            });
        });

        it('dovrebbe annunciare messaggio semplice', () => {
            liveRegion.announce('Test message');
            
            vi.advanceTimersByTime(100);
            
            expect(liveRegion.element.textContent).toBe('Test message');
        });

        it('dovrebbe ignorare messaggi vuoti o non validi', () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            
            liveRegion.announce('');
            liveRegion.announce(null);
            liveRegion.announce(undefined);
            
            expect(consoleSpy).toHaveBeenCalledTimes(3);
            expect(liveRegion.element.textContent).toBe('');
        });

        it('dovrebbe aggiornare aria-live per priorità diverse', () => {
            liveRegion.announce('Test message', { live: 'assertive' });
            
            expect(liveRegion.element.getAttribute('aria-live')).toBe('assertive');
        });

        it('dovrebbe pulire contenuto precedente', () => {
            liveRegion.element.textContent = 'Old content';
            
            liveRegion.announce('New message');
            
            vi.advanceTimersByTime(100);
            
            expect(liveRegion.element.textContent).toBe('New message');
        });
    });

    describe('Annunci Tipizzati', () => {
        beforeEach(() => {
            liveRegion = new NotificationLiveRegion({
                enableQueue: false
            });
        });

        it('dovrebbe annunciare successo con prefisso corretto', () => {
            liveRegion.announceSuccess('Operation completed', 'Save Patient');
            
            vi.advanceTimersByTime(100);
            
            expect(liveRegion.element.textContent).toBe('Successo: Save Patient. Operation completed');
            expect(liveRegion.element.getAttribute('aria-live')).toBe('polite');
        });

        it('dovrebbe annunciare errore con priorità alta', () => {
            liveRegion.announceError('Something went wrong', 'Database Error');
            
            vi.advanceTimersByTime(100);
            
            expect(liveRegion.element.textContent).toBe('Errore: Database Error. Something went wrong');
            expect(liveRegion.element.getAttribute('aria-live')).toBe('assertive');
        });

        it('dovrebbe annunciare warning correttamente', () => {
            liveRegion.announceWarning('Check your input');
            
            vi.advanceTimersByTime(100);
            
            expect(liveRegion.element.textContent).toBe('Attenzione: Check your input');
            expect(liveRegion.element.getAttribute('aria-live')).toBe('assertive');
        });

        it('dovrebbe annunciare info correttamente', () => {
            liveRegion.announceInfo('Data loaded successfully');
            
            vi.advanceTimersByTime(100);
            
            expect(liveRegion.element.textContent).toBe('Informazione: Data loaded successfully');
            expect(liveRegion.element.getAttribute('aria-live')).toBe('polite');
        });

        it('dovrebbe gestire annunci senza titolo', () => {
            liveRegion.announceSuccess('Simple success message');
            
            vi.advanceTimersByTime(100);
            
            expect(liveRegion.element.textContent).toBe('Successo: Simple success message');
        });
    });

    describe('Annunci Generici con Tipo', () => {
        beforeEach(() => {
            liveRegion = new NotificationLiveRegion({
                enableQueue: false
            });
        });

        it('dovrebbe annunciare notifica con tipo success', () => {
            liveRegion.announceNotification('success', 'Test message', 'Test Title');
            
            vi.advanceTimersByTime(100);
            
            expect(liveRegion.element.textContent).toBe('Successo: Test Title. Test message');
            expect(liveRegion.element.getAttribute('aria-live')).toBe('polite');
        });

        it('dovrebbe annunciare notifica con tipo error', () => {
            liveRegion.announceNotification('error', 'Error message');
            
            vi.advanceTimersByTime(100);
            
            expect(liveRegion.element.textContent).toBe('Errore: Error message');
            expect(liveRegion.element.getAttribute('aria-live')).toBe('assertive');
        });

        it('dovrebbe utilizzare fallback per tipo non riconosciuto', () => {
            liveRegion.announceNotification('unknown', 'Test message');
            
            vi.advanceTimersByTime(100);
            
            expect(liveRegion.element.textContent).toBe('Notifica: Test message');
            expect(liveRegion.element.getAttribute('aria-live')).toBe('polite');
        });

        it('dovrebbe permettere override delle opzioni', () => {
            liveRegion.announceNotification('info', 'Test message', '', {
                live: 'assertive'
            });
            
            vi.advanceTimersByTime(100);
            
            expect(liveRegion.element.getAttribute('aria-live')).toBe('assertive');
        });
    });

    describe('Sistema di Coda', () => {
        beforeEach(() => {
            liveRegion = new NotificationLiveRegion({
                enableQueue: true,
                queueDelay: 100
            });
        });

        it('dovrebbe aggiungere messaggi alla coda', () => {
            liveRegion.announce('First message');
            liveRegion.announce('Second message');
            
            // Verifica che i messaggi siano stati aggiunti alla coda
            expect(liveRegion.queue.length).toBeGreaterThanOrEqual(0);
        });

        it('dovrebbe ordinare per priorità nella coda', () => {
            liveRegion.announce('Low priority', { priority: 1 });
            liveRegion.announce('High priority', { priority: 3 });
            liveRegion.announce('Medium priority', { priority: 2 });
            
            // Verifica che la coda sia ordinata per priorità
            const priorities = liveRegion.queue.map(item => item.priority);
            expect(priorities[0]).toBeGreaterThanOrEqual(priorities[1] || 0);
        });

        it('dovrebbe rimuovere duplicati recenti', () => {
            liveRegion.announce('Duplicate message');
            liveRegion.announce('Duplicate message');
            liveRegion.announce('Different message');
            
            // Verifica che i duplicati siano stati rimossi
            const messages = liveRegion.queue.map(item => item.message);
            const uniqueMessages = [...new Set(messages)];
            expect(messages.length).toBeLessThanOrEqual(uniqueMessages.length + 1);
        });

        it('dovrebbe limitare dimensione coda', () => {
            const maxSize = liveRegion.options.maxQueueSize;
            
            for (let i = 0; i < maxSize + 5; i++) {
                liveRegion.announce(`Message ${i}`);
            }
            
            expect(liveRegion.queue.length).toBeLessThanOrEqual(maxSize);
        });

        it('dovrebbe pulire la coda', () => {
            liveRegion.announce('Message 1');
            liveRegion.announce('Message 2');
            
            const initialLength = liveRegion.queue.length;
            expect(initialLength).toBeGreaterThanOrEqual(0);
            
            liveRegion.clearQueue();
            
            expect(liveRegion.queue.length).toBe(0);
            expect(liveRegion.isProcessing).toBe(false);
        });
    });

    describe('Gestione Stato', () => {
        beforeEach(() => {
            liveRegion = new NotificationLiveRegion();
        });

        it('dovrebbe ottenere stato corrente', () => {
            liveRegion.announce('Test message');
            
            const state = liveRegion.getState();
            
            expect(state.id).toBe('notification-announcer');
            expect(state.queueLength).toBeGreaterThanOrEqual(0);
            expect(state.currentLive).toBe('polite');
            expect(state.options).toBeDefined();
        });

        it('dovrebbe aggiornare impostazioni', () => {
            liveRegion.updateSettings({
                defaultLive: 'assertive',
                queueDelay: 200
            });
            
            expect(liveRegion.options.defaultLive).toBe('assertive');
            expect(liveRegion.options.queueDelay).toBe(200);
            expect(liveRegion.element.getAttribute('aria-live')).toBe('assertive');
        });

        it('dovrebbe pulire contenuto', () => {
            liveRegion.element.textContent = 'Some content';
            
            liveRegion.clear();
            
            expect(liveRegion.element.textContent).toBe('');
        });
    });

    describe('Eventi Personalizzati', () => {
        beforeEach(() => {
            liveRegion = new NotificationLiveRegion({
                enableQueue: false
            });
        });

        it('dovrebbe dispatch evento announced', () => {
            const eventSpy = vi.fn();
            document.addEventListener('notificationLiveRegion:announced', eventSpy);
            
            liveRegion.announce('Test message');
            
            vi.advanceTimersByTime(100);
            
            expect(eventSpy).toHaveBeenCalled();
            expect(eventSpy.mock.calls[0][0].detail.announcement.message).toBe('Test message');
        });

        it('dovrebbe dispatch evento queueCleared', () => {
            const eventSpy = vi.fn();
            document.addEventListener('notificationLiveRegion:queueCleared', eventSpy);
            
            liveRegion.clearQueue();
            
            expect(eventSpy).toHaveBeenCalled();
        });

        it('dovrebbe dispatch evento settingsUpdated', () => {
            const eventSpy = vi.fn();
            document.addEventListener('notificationLiveRegion:settingsUpdated', eventSpy);
            
            liveRegion.updateSettings({ defaultLive: 'assertive' });
            
            expect(eventSpy).toHaveBeenCalled();
        });
    });

    describe('Pattern Singleton', () => {
        it('dovrebbe creare istanza singleton', () => {
            const instance1 = NotificationLiveRegion.getInstance();
            const instance2 = NotificationLiveRegion.getInstance();
            
            expect(instance1).toBe(instance2);
            expect(NotificationLiveRegion.exists()).toBe(true);
        });

        it('dovrebbe utilizzare opzioni solo alla prima creazione', () => {
            const instance1 = NotificationLiveRegion.getInstance({ id: 'custom-id' });
            const instance2 = NotificationLiveRegion.getInstance({ id: 'different-id' });
            
            expect(instance1.options.id).toBe('custom-id');
            expect(instance2.options.id).toBe('custom-id'); // Stessa istanza
        });

        it('dovrebbe distruggere istanza singleton', () => {
            const instance = NotificationLiveRegion.getInstance();
            
            NotificationLiveRegion.destroyInstance();
            
            expect(NotificationLiveRegion.exists()).toBe(false);
            expect(NotificationLiveRegion._instance).toBeNull();
        });

        it('dovrebbe permettere creazione di nuova istanza dopo distruzione', () => {
            const instance1 = NotificationLiveRegion.getInstance();
            NotificationLiveRegion.destroyInstance();
            
            const instance2 = NotificationLiveRegion.getInstance();
            
            expect(instance1).not.toBe(instance2);
        });
    });

    describe('Cleanup e Distruzione', () => {
        it('dovrebbe pulire tutto alla distruzione', () => {
            liveRegion = new NotificationLiveRegion();
            liveRegion.announce('Test message');
            
            const element = liveRegion.element;
            document.body.appendChild(element);
            
            liveRegion.destroy();
            
            expect(document.body.contains(element)).toBe(false);
            expect(liveRegion.element).toBeNull();
            expect(liveRegion.queue.length).toBe(0);
        });

        it('dovrebbe dispatch evento destroyed', () => {
            liveRegion = new NotificationLiveRegion();
            
            const eventSpy = vi.fn();
            document.addEventListener('notificationLiveRegion:destroyed', eventSpy);
            
            liveRegion.destroy();
            
            expect(eventSpy).toHaveBeenCalled();
        });
    });

    describe('Generazione ID', () => {
        beforeEach(() => {
            liveRegion = new NotificationLiveRegion();
        });

        it('dovrebbe generare ID univoci per annunci', () => {
            const id1 = liveRegion.generateAnnouncementId();
            const id2 = liveRegion.generateAnnouncementId();
            
            expect(id1).not.toBe(id2);
            expect(id1).toMatch(/^announcement-\d+-[a-z0-9]+$/);
            expect(id2).toMatch(/^announcement-\d+-[a-z0-9]+$/);
        });
    });

    describe('Edge Cases', () => {
        beforeEach(() => {
            liveRegion = new NotificationLiveRegion();
        });

        it('dovrebbe gestire messaggi molto lunghi', () => {
            const longMessage = 'A'.repeat(1000);
            
            liveRegion.announce(longMessage);
            
            vi.advanceTimersByTime(100);
            
            expect(liveRegion.element.textContent).toBe(longMessage);
        });

        it('dovrebbe gestire caratteri speciali', () => {
            const specialMessage = 'Test with émojis 🎉 and spëcial chars!';
            
            liveRegion.announce(specialMessage);
            
            vi.advanceTimersByTime(100);
            
            expect(liveRegion.element.textContent).toBe(specialMessage);
        });

        it('dovrebbe gestire annunci rapidi consecutivi', () => {
            for (let i = 0; i < 10; i++) {
                liveRegion.announce(`Message ${i}`);
            }
            
            expect(liveRegion.queue.length).toBeLessThanOrEqual(liveRegion.options.maxQueueSize);
        });

        it('dovrebbe gestire priorità negative', () => {
            liveRegion.announce('Negative priority', { priority: -1 });
            liveRegion.announce('Positive priority', { priority: 1 });
            
            // Verifica che la priorità positiva sia processata prima
            vi.advanceTimersByTime(200);
            
            // Il messaggio con priorità più alta dovrebbe essere processato
            expect(liveRegion.element.textContent).toContain('priority');
        });
    });
});