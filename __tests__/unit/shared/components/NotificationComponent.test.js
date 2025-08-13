/**
 * Test per NotificationComponent
 * Verifica funzionalità, accessibilità e interazioni
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NotificationComponent } from '../../../../src/shared/components/notifications/NotificationComponent.js';

// Mock per Material Icons
Object.defineProperty(window, 'getComputedStyle', {
    value: () => ({
        transform: 'none',
        animationPlayState: 'running'
    })
});

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

describe('NotificationComponent', () => {
    let notification;
    let container;

    beforeEach(() => {
        // Setup DOM container
        container = document.createElement('div');
        document.body.appendChild(container);
        
        // Mock timers
        vi.useFakeTimers();
    });

    afterEach(() => {
        // Cleanup
        if (notification) {
            notification.remove();
        }
        
        if (container && container.parentNode) {
            container.parentNode.removeChild(container);
        }
        
        // Rimuovi live region se presente
        const announcer = document.getElementById('notification-announcer');
        if (announcer) {
            announcer.remove();
        }
        
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
        
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    describe('Inizializzazione', () => {
        it('dovrebbe creare una notifica con parametri di base', () => {
            notification = new NotificationComponent({
                type: 'success',
                message: 'Test message'
            });

            expect(notification.type).toBe('success');
            expect(notification.message).toBe('Test message');
            expect(notification.element).toBeDefined();
            expect(notification.element.classList.contains('notification')).toBe(true);
            expect(notification.element.classList.contains('notification--success')).toBe(true);
        });

        it('dovrebbe generare un ID univoco se non fornito', () => {
            notification = new NotificationComponent({
                message: 'Test'
            });

            expect(notification.id).toBeDefined();
            expect(notification.id).toMatch(/^notification-\d+-[a-z0-9]+$/);
        });

        it('dovrebbe utilizzare configurazioni di default per tipo non specificato', () => {
            notification = new NotificationComponent({
                message: 'Test'
            });

            expect(notification.type).toBe('info');
            expect(notification.element.classList.contains('notification--info')).toBe(true);
        });
    });

    describe('Struttura HTML e Semantica', () => {
        beforeEach(() => {
            notification = new NotificationComponent({
                type: 'success',
                title: 'Test Title',
                message: 'Test message'
            });
        });

        it('dovrebbe avere struttura HTML semantica corretta', () => {
            const element = notification.element;
            
            expect(element.querySelector('.notification__content')).toBeDefined();
            expect(element.querySelector('.notification__icon')).toBeDefined();
            expect(element.querySelector('.notification__body')).toBeDefined();
            expect(element.querySelector('.notification__title')).toBeDefined();
            expect(element.querySelector('.notification__message')).toBeDefined();
            expect(element.querySelector('.notification__actions')).toBeDefined();
        });

        it('dovrebbe mostrare icona corretta per tipo', () => {
            const icon = notification.element.querySelector('.notification__icon');
            expect(icon.textContent).toBe('check_circle');
        });

        it('dovrebbe mostrare titolo e messaggio correttamente', () => {
            const title = notification.element.querySelector('.notification__title');
            const message = notification.element.querySelector('.notification__message');
            
            expect(title.textContent).toBe('Test Title');
            expect(message.textContent).toBe('Test message');
        });

        it('dovrebbe nascondere titolo se non fornito', () => {
            const notificationNoTitle = new NotificationComponent({
                type: 'info',
                message: 'Solo messaggio'
            });

            const title = notificationNoTitle.element.querySelector('.notification__title');
            expect(title).toBeNull();
            
            notificationNoTitle.remove();
        });
    });

    describe('Attributi ARIA e Accessibilità', () => {
        it('dovrebbe avere attributi ARIA corretti per notifica di successo', () => {
            notification = new NotificationComponent({
                type: 'success',
                message: 'Test'
            });

            const element = notification.element;
            expect(element.getAttribute('role')).toBe('status');
            expect(element.getAttribute('aria-live')).toBe('polite');
            expect(element.getAttribute('aria-atomic')).toBe('true');
            expect(element.getAttribute('aria-labelledby')).toMatch(/notification-.*-message/);
        });

        it('dovrebbe avere attributi ARIA corretti per notifica di errore', () => {
            notification = new NotificationComponent({
                type: 'error',
                message: 'Test error'
            });

            const element = notification.element;
            expect(element.getAttribute('role')).toBe('alert');
            expect(element.getAttribute('aria-live')).toBe('assertive');
        });

        it('dovrebbe avere tabindex per navigazione keyboard', () => {
            notification = new NotificationComponent({
                type: 'info',
                message: 'Test',
                enableKeyboardNavigation: true
            });

            expect(notification.element.getAttribute('tabindex')).toBe('0');
        });

        it('dovrebbe avere ID corretto per il messaggio', () => {
            notification = new NotificationComponent({
                type: 'info',
                message: 'Test message'
            });

            const messageElement = notification.element.querySelector('.notification__message');
            expect(messageElement.id).toBe(`${notification.id}-message`);
        });

        it('dovrebbe avere pulsante chiusura con aria-label', () => {
            notification = new NotificationComponent({
                type: 'info',
                message: 'Test',
                closable: true
            });

            const closeButton = notification.element.querySelector('.notification__close');
            expect(closeButton.getAttribute('aria-label')).toBe('Chiudi notifica');
            expect(closeButton.getAttribute('aria-describedby')).toBe(`${notification.id}-message`);
        });
    });

    describe('Navigazione da Tastiera', () => {
        beforeEach(() => {
            notification = new NotificationComponent({
                type: 'info',
                message: 'Test',
                closable: true,
                enableKeyboardNavigation: true,
                actions: [
                    { label: 'Azione 1', action: vi.fn() },
                    { label: 'Azione 2', action: vi.fn() }
                ]
            });
        });

        it('dovrebbe chiudere con tasto Escape', () => {
            const closeSpy = vi.spyOn(notification, 'close');
            
            const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
            notification.element.dispatchEvent(escapeEvent);
            
            expect(closeSpy).toHaveBeenCalled();
        });

        it('dovrebbe focalizzare primo elemento con Enter', () => {
            const focusSpy = vi.spyOn(notification, 'focusFirstFocusableElement');
            
            const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
            Object.defineProperty(enterEvent, 'target', { value: notification.element });
            notification.element.dispatchEvent(enterEvent);
            
            expect(focusSpy).toHaveBeenCalled();
        });

        it('dovrebbe navigare con frecce tra elementi focusabili', () => {
            const focusSpy = vi.spyOn(notification, 'focusElement');
            
            // Mock document.activeElement per simulare focus su primo elemento
            const firstElement = notification.focusableElements[0];
            Object.defineProperty(document, 'activeElement', {
                value: firstElement,
                configurable: true
            });
            
            const arrowDownEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
            notification.element.dispatchEvent(arrowDownEvent);
            
            expect(focusSpy).toHaveBeenCalledWith(1);
        });

        it('dovrebbe gestire navigazione circolare con Tab', () => {
            const focusableElements = notification.focusableElements;
            expect(focusableElements.length).toBeGreaterThan(0);
            
            // Test navigazione Tab
            const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
            Object.defineProperty(tabEvent, 'target', { value: focusableElements[focusableElements.length - 1] });
            
            const focusSpy = vi.spyOn(notification, 'focusElement');
            notification.handleTabNavigation(tabEvent);
            
            expect(focusSpy).toHaveBeenCalledWith(0);
        });

        it('dovrebbe andare al primo elemento con Home', () => {
            const focusSpy = vi.spyOn(notification, 'focusElement');
            
            const homeEvent = new KeyboardEvent('keydown', { key: 'Home' });
            notification.element.dispatchEvent(homeEvent);
            
            expect(focusSpy).toHaveBeenCalledWith(0);
        });

        it('dovrebbe andare all\'ultimo elemento con End', () => {
            const focusSpy = vi.spyOn(notification, 'focusElement');
            
            const endEvent = new KeyboardEvent('keydown', { key: 'End' });
            notification.element.dispatchEvent(endEvent);
            
            expect(focusSpy).toHaveBeenCalledWith(notification.focusableElements.length - 1);
        });
    });

    describe('Gestione Focus', () => {
        beforeEach(() => {
            notification = new NotificationComponent({
                type: 'info',
                message: 'Test',
                closable: true,
                enableKeyboardNavigation: true
            });
        });

        it('dovrebbe aggiungere classe focused su focus in', () => {
            const focusEvent = new Event('focusin');
            notification.element.dispatchEvent(focusEvent);
            
            expect(notification.element.classList.contains('notification--focused')).toBe(true);
        });

        it('dovrebbe rimuovere classe focused su focus out', () => {
            notification.element.classList.add('notification--focused');
            
            const focusEvent = new Event('focusout');
            Object.defineProperty(focusEvent, 'relatedTarget', { value: document.body });
            notification.element.dispatchEvent(focusEvent);
            
            expect(notification.element.classList.contains('notification--focused')).toBe(false);
        });

        it('dovrebbe pausare auto-close su focus', () => {
            const pauseSpy = vi.spyOn(notification, 'pauseAutoClose');
            
            const focusEvent = new Event('focusin');
            notification.element.dispatchEvent(focusEvent);
            
            expect(pauseSpy).toHaveBeenCalled();
        });
    });

    describe('Auto-close e Timer', () => {
        it('dovrebbe auto-chiudere notifica di successo dopo 4 secondi', () => {
            notification = new NotificationComponent({
                type: 'success',
                message: 'Test'
            });

            const closeSpy = vi.spyOn(notification, 'close');
            
            vi.advanceTimersByTime(4000);
            
            expect(closeSpy).toHaveBeenCalled();
        });

        it('non dovrebbe auto-chiudere notifica di errore', () => {
            notification = new NotificationComponent({
                type: 'error',
                message: 'Test error'
            });

            const closeSpy = vi.spyOn(notification, 'close');
            
            vi.advanceTimersByTime(10000);
            
            expect(closeSpy).not.toHaveBeenCalled();
        });

        it('dovrebbe pausare timer su hover', () => {
            notification = new NotificationComponent({
                type: 'success',
                message: 'Test'
            });

            const pauseSpy = vi.spyOn(notification, 'pauseAutoClose');
            
            const mouseEnterEvent = new Event('mouseenter');
            notification.element.dispatchEvent(mouseEnterEvent);
            
            expect(pauseSpy).toHaveBeenCalled();
        });

        it('dovrebbe riprendere timer su mouse leave', () => {
            notification = new NotificationComponent({
                type: 'success',
                message: 'Test'
            });

            notification.isPaused = true;
            const resumeSpy = vi.spyOn(notification, 'resumeAutoClose');
            
            const mouseLeaveEvent = new Event('mouseleave');
            notification.element.dispatchEvent(mouseLeaveEvent);
            
            expect(resumeSpy).toHaveBeenCalled();
        });

        it('dovrebbe rispettare durata personalizzata', () => {
            notification = new NotificationComponent({
                type: 'info',
                message: 'Test',
                duration: 2000
            });

            const closeSpy = vi.spyOn(notification, 'close');
            
            vi.advanceTimersByTime(2000);
            
            expect(closeSpy).toHaveBeenCalled();
        });

        it('non dovrebbe auto-chiudere se persistent è true', () => {
            notification = new NotificationComponent({
                type: 'info',
                message: 'Test',
                persistent: true
            });

            const closeSpy = vi.spyOn(notification, 'close');
            
            vi.advanceTimersByTime(10000);
            
            expect(closeSpy).not.toHaveBeenCalled();
        });
    });

    describe('Progress Bar', () => {
        it('dovrebbe mostrare progress bar per notifiche con auto-close', () => {
            notification = new NotificationComponent({
                type: 'success',
                message: 'Test',
                enableProgressBar: true
            });

            const progressBar = notification.element.querySelector('.notification__progress');
            expect(progressBar).toBeDefined();
        });

        it('non dovrebbe mostrare progress bar per notifiche persistenti', () => {
            notification = new NotificationComponent({
                type: 'error',
                message: 'Test error',
                enableProgressBar: true
            });

            const progressBar = notification.element.querySelector('.notification__progress');
            expect(progressBar).toBeNull();
        });

        it('dovrebbe pausare progress bar su hover', () => {
            notification = new NotificationComponent({
                type: 'success',
                message: 'Test',
                enableProgressBar: true
            });

            const pauseSpy = vi.spyOn(notification, 'pauseProgressBar');
            
            const mouseEnterEvent = new Event('mouseenter');
            notification.element.dispatchEvent(mouseEnterEvent);
            
            expect(pauseSpy).toHaveBeenCalled();
        });
    });

    describe('Azioni Personalizzate', () => {
        it('dovrebbe creare pulsanti per azioni personalizzate', () => {
            const action1 = vi.fn();
            const action2 = vi.fn();

            notification = new NotificationComponent({
                type: 'info',
                message: 'Test',
                actions: [
                    { label: 'Azione 1', action: action1 },
                    { label: 'Azione 2', action: action2, style: 'primary' }
                ]
            });

            const actionButtons = notification.element.querySelectorAll('.notification__action-btn');
            expect(actionButtons.length).toBe(2);
            expect(actionButtons[0].textContent.trim()).toBe('Azione 1');
            expect(actionButtons[1].textContent.trim()).toBe('Azione 2');
            expect(actionButtons[1].classList.contains('notification__action-btn--primary')).toBe(true);
        });

        it('dovrebbe eseguire azione al click', () => {
            const actionSpy = vi.fn();

            notification = new NotificationComponent({
                type: 'info',
                message: 'Test',
                actions: [
                    { label: 'Test Action', action: actionSpy }
                ]
            });

            const actionButton = notification.element.querySelector('.notification__action-btn');
            actionButton.click();
            
            expect(actionSpy).toHaveBeenCalledWith(notification);
        });
    });

    describe('Screen Reader Support', () => {
        it('dovrebbe creare live region per annunci', () => {
            notification = new NotificationComponent({
                type: 'success',
                message: 'Test success',
                enableScreenReader: true
            });

            vi.advanceTimersByTime(200);

            const announcer = document.getElementById('notification-announcer');
            expect(announcer).toBeDefined();
            expect(announcer.getAttribute('aria-live')).toBe('polite');
        });

        it('dovrebbe annunciare contenuto corretto', () => {
            notification = new NotificationComponent({
                type: 'error',
                title: 'Test Title',
                message: 'Test error message',
                enableScreenReader: true
            });

            vi.advanceTimersByTime(200);

            const announcer = document.getElementById('notification-announcer');
            expect(announcer.textContent).toContain('Errore: Test Title. Test error message');
        });

        it('dovrebbe avere testo screen reader only', () => {
            notification = new NotificationComponent({
                type: 'info',
                message: 'Test'
            });

            const srElement = notification.element.querySelector('.notification__sr-only');
            expect(srElement).toBeDefined();
            expect(srElement.textContent).toContain('Informazione: Test');
        });
    });

    describe('Touch Gestures (Mobile)', () => {
        beforeEach(() => {
            // Mock mobile viewport
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: 500
            });

            notification = new NotificationComponent({
                type: 'info',
                message: 'Test mobile'
            });
        });

        it('dovrebbe inizializzare touch gesture listeners su mobile', () => {
            const element = notification.element;
            
            // Verifica che i listener siano stati aggiunti
            expect(notification.touchStartX).toBe(0);
            expect(notification.touchCurrentX).toBe(0);
            expect(notification.isSwiping).toBe(false);
        });

        it('dovrebbe gestire touch start', () => {
            const touchEvent = new TouchEvent('touchstart', {
                touches: [{ clientX: 100, clientY: 50 }]
            });

            notification.handleTouchStart(touchEvent);
            
            expect(notification.touchStartX).toBe(100);
            expect(notification.touchStartY).toBe(50);
        });

        it('dovrebbe chiudere notifica con swipe completo', () => {
            const closeSpy = vi.spyOn(notification, 'close');
            
            // Simula swipe
            notification.touchStartX = 0;
            notification.touchCurrentX = 150; // Oltre soglia
            notification.isSwiping = true;
            
            const touchEndEvent = new TouchEvent('touchend');
            notification.handleTouchEnd(touchEndEvent);
            
            expect(closeSpy).toHaveBeenCalled();
        });
    });

    describe('Animazioni', () => {
        it('dovrebbe aggiungere classe entering per animazione show', () => {
            notification = new NotificationComponent({
                type: 'info',
                message: 'Test',
                enableAnimations: true
            });

            notification.show();
            
            expect(notification.element.classList.contains('notification--entering')).toBe(true);
        });

        it('dovrebbe aggiungere classe exiting per animazione close', () => {
            notification = new NotificationComponent({
                type: 'info',
                message: 'Test',
                enableAnimations: true
            });

            notification.close();
            
            expect(notification.element.classList.contains('notification--exiting')).toBe(true);
        });

        it('dovrebbe rispettare prefers-reduced-motion', () => {
            // Mock prefers-reduced-motion
            mockMatchMedia.mockImplementation(query => ({
                matches: query === '(prefers-reduced-motion: reduce)',
                media: query,
                onchange: null,
                addListener: vi.fn(),
                removeListener: vi.fn(),
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                dispatchEvent: vi.fn(),
            }));

            notification = new NotificationComponent({
                type: 'info',
                message: 'Test',
                enableAnimations: true
            });

            notification.show();
            
            expect(notification.isVisible).toBe(true);
            expect(notification.element.classList.contains('notification--entering')).toBe(false);
        });
    });

    describe('Aggiornamento Contenuto', () => {
        beforeEach(() => {
            notification = new NotificationComponent({
                type: 'info',
                title: 'Original Title',
                message: 'Original message'
            });
        });

        it('dovrebbe aggiornare messaggio', () => {
            notification.updateContent({ message: 'New message' });
            
            const messageElement = notification.element.querySelector('.notification__message');
            expect(messageElement.textContent).toBe('New message');
            expect(notification.message).toBe('New message');
        });

        it('dovrebbe aggiornare titolo', () => {
            notification.updateContent({ title: 'New Title' });
            
            const titleElement = notification.element.querySelector('.notification__title');
            expect(titleElement.textContent).toBe('New Title');
            expect(notification.title).toBe('New Title');
        });

        it('dovrebbe aggiungere titolo se non esisteva', () => {
            const notificationNoTitle = new NotificationComponent({
                type: 'info',
                message: 'Test'
            });

            notificationNoTitle.updateContent({ title: 'Added Title' });
            
            const titleElement = notificationNoTitle.element.querySelector('.notification__title');
            expect(titleElement).toBeDefined();
            expect(titleElement.textContent).toBe('Added Title');
            
            notificationNoTitle.remove();
        });
    });

    describe('Eventi Personalizzati', () => {
        it('dovrebbe dispatch evento shown', () => {
            const eventSpy = vi.fn();
            document.addEventListener('notification:shown', eventSpy);

            notification = new NotificationComponent({
                type: 'info',
                message: 'Test',
                enableAnimations: false
            });

            notification.show();
            
            expect(eventSpy).toHaveBeenCalled();
            expect(eventSpy.mock.calls[0][0].detail.notification).toBe(notification);
        });

        it('dovrebbe dispatch evento closing', () => {
            const eventSpy = vi.fn();
            document.addEventListener('notification:closing', eventSpy);

            notification = new NotificationComponent({
                type: 'info',
                message: 'Test'
            });

            notification.close();
            
            expect(eventSpy).toHaveBeenCalled();
        });

        it('dovrebbe dispatch evento paused', () => {
            const eventSpy = vi.fn();
            document.addEventListener('notification:paused', eventSpy);

            notification = new NotificationComponent({
                type: 'success',
                message: 'Test'
            });

            notification.pauseAutoClose();
            
            expect(eventSpy).toHaveBeenCalled();
        });
    });

    describe('Metodi Statici', () => {
        it('dovrebbe creare notifica di successo', () => {
            const successNotification = NotificationComponent.success('Success message');
            
            expect(successNotification.type).toBe('success');
            expect(successNotification.message).toBe('Success message');
            
            successNotification.remove();
        });

        it('dovrebbe creare notifica di errore persistente', () => {
            const errorNotification = NotificationComponent.error('Error message');
            
            expect(errorNotification.type).toBe('error');
            expect(errorNotification.message).toBe('Error message');
            expect(errorNotification.options.persistent).toBe(true);
            
            errorNotification.remove();
        });

        it('dovrebbe verificare tipo valido', () => {
            expect(NotificationComponent.isValidType('success')).toBe(true);
            expect(NotificationComponent.isValidType('invalid')).toBe(false);
        });

        it('dovrebbe ottenere configurazione tipo', () => {
            const config = NotificationComponent.getTypeConfig('error');
            
            expect(config.type).toBe('error');
            expect(config.icon).toBe('error');
            expect(config.ariaRole).toBe('alert');
        });

        it('dovrebbe ottenere tipi supportati', () => {
            const types = NotificationComponent.getSupportedTypes();
            
            expect(types).toContain('success');
            expect(types).toContain('error');
            expect(types).toContain('warning');
            expect(types).toContain('info');
        });
    });

    describe('Sicurezza', () => {
        it('dovrebbe fare escape dell\'HTML nel messaggio', () => {
            notification = new NotificationComponent({
                type: 'info',
                message: '<script>alert("xss")</script>Test'
            });

            const messageElement = notification.element.querySelector('.notification__message');
            expect(messageElement.innerHTML).not.toContain('<script>');
            expect(messageElement.textContent).toContain('Test');
        });

        it('dovrebbe fare escape dell\'HTML nel titolo', () => {
            notification = new NotificationComponent({
                type: 'info',
                title: '<img src="x" onerror="alert(1)">Title',
                message: 'Test'
            });

            const titleElement = notification.element.querySelector('.notification__title');
            expect(titleElement.innerHTML).not.toContain('<img');
            expect(titleElement.textContent).toContain('Title');
        });
    });

    describe('Cleanup', () => {
        it('dovrebbe pulire event listeners e timer', () => {
            notification = new NotificationComponent({
                type: 'success',
                message: 'Test',
                closable: true,
                enableKeyboardNavigation: true
            });

            const cleanupSpy = vi.spyOn(notification, 'cleanup');
            
            notification.remove();
            
            expect(cleanupSpy).toHaveBeenCalled();
            expect(notification.timer).toBeNull();
        });

        it('dovrebbe rimuovere elemento dal DOM', () => {
            notification = new NotificationComponent({
                type: 'info',
                message: 'Test'
            });

            container.appendChild(notification.element);
            expect(container.contains(notification.element)).toBe(true);
            
            notification.remove();
            
            expect(container.contains(notification.element)).toBe(false);
        });
    });
});