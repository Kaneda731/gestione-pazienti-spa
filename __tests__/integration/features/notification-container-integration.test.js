/**
 * Test di integrazione per NotificationContainer con NotificationService
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { notificationService } from '../../../src/core/services/notificationService.js';

// Mock per ResizeObserver e MutationObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

global.MutationObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    disconnect: vi.fn(),
}));

describe('NotificationContainer Integration', () => {
    beforeEach(() => {
        // Pulisci DOM
        document.body.innerHTML = '';
        
        // Mock per window properties
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: 1024,
        });

        Object.defineProperty(window, 'innerHeight', {
            writable: true,
            configurable: true,
            value: 768,
        });

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
    });

    afterEach(() => {
        // Pulisci notifiche
        notificationService.clear();
        document.body.innerHTML = '';
    });

    describe('Integrazione con NotificationService', () => {
        it('dovrebbe creare il container quando il servizio viene inizializzato', () => {
            // Il servizio dovrebbe aver creato il container
            const container = document.getElementById('notification-container');
            expect(container).toBeTruthy();
            expect(container.classList.contains('notification-container')).toBe(true);
        });

        it('dovrebbe posizionare le notifiche nel container', () => {
            // Aggiungi una notifica
            const notificationId = notificationService.success('Test notification');
            
            // Verifica che la notifica sia nel container
            const container = document.getElementById('notification-container');
            const notifications = container.querySelectorAll('.notification');
            
            expect(notifications).toHaveLength(1);
            expect(notifications[0].dataset.id).toBe(notificationId);
        });

        it('dovrebbe supportare diverse posizioni', () => {
            // Cambia posizione
            notificationService.updatePosition('bottom-left');
            
            const container = document.getElementById('notification-container');
            expect(container.getAttribute('data-position')).toBe('bottom-left');
        });

        it('dovrebbe gestire multiple notifiche', () => {
            // Aggiungi multiple notifiche
            notificationService.success('Notification 1');
            notificationService.error('Notification 2');
            notificationService.warning('Notification 3');
            
            const container = document.getElementById('notification-container');
            const notifications = container.querySelectorAll('.notification');
            
            expect(notifications).toHaveLength(3);
        });

        it('dovrebbe rimuovere notifiche dal container', () => {
            // Aggiungi notifica
            const notificationId = notificationService.info('Test notification');
            
            let container = document.getElementById('notification-container');
            expect(container.querySelectorAll('.notification')).toHaveLength(1);
            
            // Rimuovi notifica
            notificationService.removeNotification(notificationId);
            
            // Attendi che la rimozione sia completata
            setTimeout(() => {
                container = document.getElementById('notification-container');
                expect(container.querySelectorAll('.notification')).toHaveLength(0);
            }, 100);
        });

        it('dovrebbe pulire tutte le notifiche', () => {
            // Aggiungi multiple notifiche
            notificationService.success('Notification 1');
            notificationService.error('Notification 2');
            notificationService.warning('Notification 3');
            
            let container = document.getElementById('notification-container');
            expect(container.querySelectorAll('.notification')).toHaveLength(3);
            
            // Pulisci tutte
            notificationService.clear();
            
            container = document.getElementById('notification-container');
            expect(container.querySelectorAll('.notification')).toHaveLength(0);
        });

        it('dovrebbe aggiornare il numero massimo di notifiche visibili', () => {
            // Imposta limite
            notificationService.setMaxVisible(2);
            
            // Aggiungi 4 notifiche
            notificationService.success('Notification 1');
            notificationService.error('Notification 2');
            notificationService.warning('Notification 3');
            notificationService.info('Notification 4');
            
            const container = document.getElementById('notification-container');
            const allNotifications = container.querySelectorAll('.notification');
            
            expect(allNotifications).toHaveLength(4);
            
            // Verifica che il container gestisca il limite
            expect(notificationService.notificationContainer.settings.maxVisible).toBe(2);
        });
    });

    describe('Comportamento responsive', () => {
        it('dovrebbe adattarsi a viewport mobile', () => {
            // Simula viewport mobile
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: 600,
            });

            // Trigger resize
            window.dispatchEvent(new Event('resize'));
            
            // Il container dovrebbe adattarsi (se responsive è abilitato)
            const container = document.getElementById('notification-container');
            expect(container).toBeTruthy();
        });

        it('dovrebbe mantenere posizione personalizzata', () => {
            // Imposta posizione personalizzata
            notificationService.updatePosition('top-left');
            
            // Simula resize
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: 600,
            });
            window.dispatchEvent(new Event('resize'));
            
            const container = document.getElementById('notification-container');
            expect(container.getAttribute('data-position')).toBe('top-left');
        });
    });

    describe('Accessibilità', () => {
        it('dovrebbe avere attributi ARIA corretti', () => {
            const container = document.getElementById('notification-container');
            
            expect(container.getAttribute('role')).toBe('region');
            expect(container.getAttribute('aria-label')).toBe('Notifiche di sistema');
            expect(container.getAttribute('aria-live')).toBe('polite');
        });

        it('dovrebbe creare live region per screen reader', () => {
            const announcer = document.getElementById('notification-announcer');
            
            expect(announcer).toBeTruthy();
            expect(announcer.getAttribute('aria-live')).toBe('polite');
            expect(announcer.getAttribute('aria-atomic')).toBe('true');
        });
    });
});