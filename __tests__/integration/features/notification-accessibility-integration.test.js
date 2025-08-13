/**
 * Test di integrazione per accessibilità NotificationComponent
 * Verifica integrazione completa delle funzionalità di accessibilità
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NotificationComponent } from '../../../src/shared/components/notifications/NotificationComponent.js';
import { NotificationLiveRegion } from '../../../src/shared/components/notifications/NotificationLiveRegion.js';

// Mock per matchMedia
const mockMatchMedia = vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
}));

Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: mockMatchMedia,
});

describe('Integrazione Accessibilità Notifiche', () => {
    let notification;
    let liveRegion;
    let container;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
        
        vi.useFakeTimers();
        
        // Reset matchMedia mock
        mockMatchMedia.mockClear();
        mockMatchMedia.mockImplementation(query => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        }));
    });

    afterEach(() => {
        if (notification) {
            notification.remove();
        }
        
        if (liveRegion) {
            liveRegion.destroy();
        }
        
        if (container && container.parentNode) {
            container.parentNode.removeChild(container);
        }
        
        // Cleanup live region
        const announcer = document.getElementById('notification-announcer');
        if (announcer) {
            announcer.remove();
        }
        
        // Cleanup singleton
        NotificationLiveRegion.destroyInstance();
        
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    describe('Integrazione Screen Reader', () => {
        it('dovrebbe creare live region e annunciare notifica', () => {
            notification = new NotificationComponent({
                type: 'success',
                title: 'Operazione completata',
                message: 'Il paziente è stato salvato con successo',
                enableScreenReader: true
            });

            container.appendChild(notification.element);
            
            vi.advanceTimersByTime(200);
            
            const announcer = document.getElementById('notification-announcer');
            expect(announcer).toBeDefined();
            expect(announcer.textContent).toContain('Successo: Operazione completata. Il paziente è stato salvato con successo');
        });

        it('dovrebbe utilizzare live region singleton per multiple notifiche', () => {
            const notification1 = new NotificationComponent({
                type: 'info',
                message: 'Prima notifica',
                enableScreenReader: true
            });

            const notification2 = new NotificationComponent({
                type: 'warning',
                message: 'Seconda notifica',
                enableScreenReader: true
            });

            container.appendChild(notification1.element);
            container.appendChild(notification2.element);
            
            vi.advanceTimersByTime(200);
            
            const announcers = document.querySelectorAll('#notification-announcer');
            expect(announcers.length).toBe(1); // Solo una live region
            
            notification1.remove();
            notification2.remove();
        });
    });

    describe('Navigazione da Tastiera Completa', () => {
        it('dovrebbe gestire navigazione completa con azioni multiple', () => {
            const action1Spy = vi.fn();
            const action2Spy = vi.fn();

            notification = new NotificationComponent({
                type: 'warning',
                title: 'Conferma richiesta',
                message: 'Vuoi procedere con questa operazione?',
                closable: true,
                enableKeyboardNavigation: true,
                actions: [
                    { label: 'Conferma', action: action1Spy, style: 'primary' },
                    { label: 'Annulla', action: action2Spy, style: 'secondary' }
                ]
            });

            container.appendChild(notification.element);
            
            // Verifica elementi focusabili
            expect(notification.focusableElements.length).toBe(3); // notification + 2 actions + close
            
            // Test navigazione con Tab
            const firstElement = notification.focusableElements[0];
            firstElement.focus();
            
            const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
            Object.defineProperty(tabEvent, 'target', { value: notification.focusableElements[2] }); // Ultimo elemento
            
            notification.handleTabNavigation(tabEvent);
            
            // Dovrebbe tornare al primo elemento (navigazione circolare)
            expect(document.activeElement).toBe(notification.focusableElements[0]);
        });

        it('dovrebbe gestire Escape per chiusura', () => {
            notification = new NotificationComponent({
                type: 'error',
                message: 'Errore critico',
                closable: true,
                enableKeyboardNavigation: true
            });

            container.appendChild(notification.element);
            
            const closeSpy = vi.spyOn(notification, 'close');
            
            const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
            notification.element.dispatchEvent(escapeEvent);
            
            expect(closeSpy).toHaveBeenCalled();
        });

        it('dovrebbe gestire frecce per navigazione tra elementi', () => {
            notification = new NotificationComponent({
                type: 'info',
                message: 'Notifica con azioni',
                closable: true,
                enableKeyboardNavigation: true,
                actions: [
                    { label: 'Azione 1', action: vi.fn() },
                    { label: 'Azione 2', action: vi.fn() }
                ]
            });

            container.appendChild(notification.element);
            
            // Mock activeElement per primo elemento
            Object.defineProperty(document, 'activeElement', {
                value: notification.focusableElements[0],
                configurable: true
            });
            
            const focusSpy = vi.spyOn(notification, 'focusElement');
            
            const arrowDownEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
            notification.element.dispatchEvent(arrowDownEvent);
            
            expect(focusSpy).toHaveBeenCalledWith(1);
        });
    });

    describe('Attributi ARIA Completi', () => {
        it('dovrebbe avere tutti gli attributi ARIA per notifica di errore', () => {
            notification = new NotificationComponent({
                type: 'error',
                title: 'Errore di validazione',
                message: 'I dati inseriti non sono validi',
                closable: true,
                enableKeyboardNavigation: true
            });

            container.appendChild(notification.element);
            
            const element = notification.element;
            
            // Attributi principali
            expect(element.getAttribute('role')).toBe('alert');
            expect(element.getAttribute('aria-live')).toBe('assertive');
            expect(element.getAttribute('aria-atomic')).toBe('true');
            expect(element.getAttribute('aria-labelledby')).toBe(`${notification.id}-message`);
            expect(element.getAttribute('tabindex')).toBe('0');
            
            // Messaggio con ID corretto
            const messageElement = element.querySelector('.notification__message');
            expect(messageElement.id).toBe(`${notification.id}-message`);
            
            // Pulsante chiusura con aria-label
            const closeButton = element.querySelector('.notification__close');
            expect(closeButton.getAttribute('aria-label')).toBe('Chiudi notifica');
            expect(closeButton.getAttribute('aria-describedby')).toBe(`${notification.id}-message`);
        });

        it('dovrebbe avere attributi ARIA corretti per progress bar', () => {
            notification = new NotificationComponent({
                type: 'success',
                message: 'Operazione in corso',
                duration: 3000,
                enableProgressBar: true
            });

            container.appendChild(notification.element);
            
            const progressBar = notification.element.querySelector('.notification__progress');
            expect(progressBar).toBeDefined();
            expect(progressBar.getAttribute('role')).toBe('progressbar');
            expect(progressBar.getAttribute('aria-hidden')).toBe('true');
        });
    });

    describe('Focus Management', () => {
        it('dovrebbe gestire focus automatico per notifiche critiche', () => {
            notification = new NotificationComponent({
                type: 'error',
                message: 'Errore critico del sistema',
                enableKeyboardNavigation: true
            });

            container.appendChild(notification.element);
            
            const focusSpy = vi.spyOn(notification.element, 'focus');
            
            notification.show();
            
            vi.advanceTimersByTime(150);
            
            expect(focusSpy).toHaveBeenCalled();
        });

        it('dovrebbe pausare auto-close su focus', () => {
            notification = new NotificationComponent({
                type: 'success',
                message: 'Operazione completata',
                duration: 2000,
                enableKeyboardNavigation: true
            });

            container.appendChild(notification.element);
            
            const pauseSpy = vi.spyOn(notification, 'pauseAutoClose');
            
            const focusEvent = new Event('focusin');
            notification.element.dispatchEvent(focusEvent);
            
            expect(pauseSpy).toHaveBeenCalled();
            expect(notification.element.classList.contains('notification--focused')).toBe(true);
        });

        it('dovrebbe riprendere auto-close quando focus esce', () => {
            notification = new NotificationComponent({
                type: 'info',
                message: 'Informazione importante',
                duration: 2000,
                enableKeyboardNavigation: true
            });

            container.appendChild(notification.element);
            
            // Simula focus in
            notification.element.classList.add('notification--focused');
            notification.isPaused = true;
            
            const resumeSpy = vi.spyOn(notification, 'resumeAutoClose');
            
            const focusOutEvent = new Event('focusout');
            Object.defineProperty(focusOutEvent, 'relatedTarget', { value: document.body });
            notification.element.dispatchEvent(focusOutEvent);
            
            expect(resumeSpy).toHaveBeenCalled();
            expect(notification.element.classList.contains('notification--focused')).toBe(false);
        });
    });

    describe('Sicurezza e Sanitizzazione', () => {
        it('dovrebbe sanitizzare contenuto HTML pericoloso', () => {
            notification = new NotificationComponent({
                type: 'info',
                title: '<script>alert("xss")</script>Titolo Sicuro',
                message: '<img src="x" onerror="alert(1)">Messaggio sicuro',
                enableScreenReader: true
            });

            container.appendChild(notification.element);
            
            const titleElement = notification.element.querySelector('.notification__title');
            const messageElement = notification.element.querySelector('.notification__message');
            
            expect(titleElement.innerHTML).not.toContain('<script>');
            expect(titleElement.innerHTML).not.toContain('<img');
            expect(messageElement.innerHTML).not.toContain('<script>');
            expect(messageElement.innerHTML).not.toContain('<img');
            
            expect(titleElement.textContent).toContain('Titolo Sicuro');
            expect(messageElement.textContent).toContain('Messaggio sicuro');
        });
    });

    describe('Responsive e Mobile', () => {
        it('dovrebbe adattare comportamento per mobile', () => {
            // Mock mobile viewport
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: 500
            });

            notification = new NotificationComponent({
                type: 'warning',
                message: 'Notifica mobile',
                closable: true
            });

            container.appendChild(notification.element);
            
            // Verifica che touch listeners siano stati aggiunti
            expect(notification.touchStartX).toBe(0);
            expect(notification.touchCurrentX).toBe(0);
            expect(notification.isSwiping).toBe(false);
        });
    });

    describe('Eventi e Lifecycle', () => {
        it('dovrebbe emettere eventi di accessibilità', () => {
            const shownSpy = vi.fn();
            const pausedSpy = vi.fn();
            const closingSpy = vi.fn();

            document.addEventListener('notification:shown', shownSpy);
            document.addEventListener('notification:paused', pausedSpy);
            document.addEventListener('notification:closing', closingSpy);

            notification = new NotificationComponent({
                type: 'success',
                message: 'Test eventi',
                duration: 1000,
                enableAnimations: false
            });

            container.appendChild(notification.element);
            
            // Test evento shown
            notification.show();
            expect(shownSpy).toHaveBeenCalled();
            
            // Test evento paused
            notification.pauseAutoClose();
            expect(pausedSpy).toHaveBeenCalled();
            
            // Test evento closing
            notification.close();
            expect(closingSpy).toHaveBeenCalled();
            
            // Cleanup listeners
            document.removeEventListener('notification:shown', shownSpy);
            document.removeEventListener('notification:paused', pausedSpy);
            document.removeEventListener('notification:closing', closingSpy);
        });
    });
});