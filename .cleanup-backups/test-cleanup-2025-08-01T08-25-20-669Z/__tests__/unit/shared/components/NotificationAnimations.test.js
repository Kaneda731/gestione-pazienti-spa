/**
 * Test specifici per il sistema di animazioni delle notifiche
 * Verifica animazioni di entrata, uscita, progress bar e supporto reduced-motion
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NotificationComponent } from '../../../../src/shared/components/notifications/NotificationComponent.js';

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

// Mock per requestAnimationFrame
global.requestAnimationFrame = vi.fn(cb => setTimeout(cb, 16));

// Mock per AnimationEvent
global.AnimationEvent = class AnimationEvent extends Event {
    constructor(type, eventInitDict = {}) {
        super(type, eventInitDict);
        this.animationName = eventInitDict.animationName || '';
        this.elapsedTime = eventInitDict.elapsedTime || 0;
        this.pseudoElement = eventInitDict.pseudoElement || '';
    }
};

describe('NotificationAnimations', () => {
    let notification;
    let container;

    beforeEach(() => {
        // Setup DOM container
        container = document.createElement('div');
        document.body.appendChild(container);
        
        // Mock timers
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
        // Cleanup
        if (notification) {
            notification.remove();
        }
        
        if (container && container.parentNode) {
            container.parentNode.removeChild(container);
        }
        
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    describe('Animazioni di Entrata', () => {
        it('dovrebbe aggiungere classe entering per animazione show', () => {
            notification = new NotificationComponent({
                type: 'success',
                message: 'Test',
                enableAnimations: true
            });

            notification.show();
            
            expect(notification.element.classList.contains('notification--entering')).toBe(true);
        });

        it('dovrebbe impostare stili iniziali per animazione fluida', () => {
            notification = new NotificationComponent({
                type: 'info',
                message: 'Test',
                enableAnimations: true
            });

            notification.show();
            
            // Verifica che gli stili iniziali siano impostati
            expect(notification.element.style.opacity).toBe('0');
            expect(notification.element.style.transform).toBeTruthy();
        });

        it('dovrebbe ottenere trasformazione iniziale corretta per desktop', () => {
            // Mock desktop viewport
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: 1200
            });

            notification = new NotificationComponent({
                type: 'info',
                message: 'Test'
            });

            const transform = notification.getInitialTransform();
            expect(transform).toBe('translateX(100%)');
        });

        it('dovrebbe ottenere trasformazione iniziale corretta per mobile', () => {
            // Mock mobile viewport
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: 500
            });

            notification = new NotificationComponent({
                type: 'info',
                message: 'Test'
            });

            const transform = notification.getInitialTransform();
            expect(transform).toBe('translateY(-100%)');
        });

        it('dovrebbe dispatch evento showing', () => {
            const eventSpy = vi.fn();
            document.addEventListener('notification:showing', eventSpy);

            notification = new NotificationComponent({
                type: 'info',
                message: 'Test',
                enableAnimations: true
            });

            notification.show();
            
            expect(eventSpy).toHaveBeenCalled();
        });

        it('dovrebbe rimuovere classe entering dopo animazione', () => {
            notification = new NotificationComponent({
                type: 'info',
                message: 'Test',
                enableAnimations: true
            });

            notification.show();
            
            // Simula fine animazione slideInRight
            const animationEvent = new AnimationEvent('animationend', {
                animationName: 'slideInRight'
            });
            notification.element.dispatchEvent(animationEvent);
            
            expect(notification.element.classList.contains('notification--entering')).toBe(false);
            expect(notification.isVisible).toBe(true);
        });

        it('dovrebbe gestire animazione slideInDown per mobile', () => {
            notification = new NotificationComponent({
                type: 'info',
                message: 'Test',
                enableAnimations: true
            });

            notification.show();
            
            // Simula fine animazione slideInDown
            const animationEvent = new AnimationEvent('animationend', {
                animationName: 'slideInDown'
            });
            notification.element.dispatchEvent(animationEvent);
            
            expect(notification.element.classList.contains('notification--entering')).toBe(false);
            expect(notification.isVisible).toBe(true);
        });
    });

    describe('Animazioni di Uscita', () => {
        beforeEach(() => {
            notification = new NotificationComponent({
                type: 'info',
                message: 'Test',
                enableAnimations: true
            });
            notification.isVisible = true;
        });

        it('dovrebbe aggiungere classe exiting per animazione close', () => {
            notification.close();
            
            expect(notification.element.classList.contains('notification--exiting')).toBe(true);
        });

        it('dovrebbe rimuovere classe entering prima di aggiungere exiting', () => {
            notification.element.classList.add('notification--entering');
            
            notification.close();
            
            expect(notification.element.classList.contains('notification--entering')).toBe(false);
            expect(notification.element.classList.contains('notification--exiting')).toBe(true);
        });

        it('dovrebbe fermare progress bar durante chiusura', () => {
            const stopProgressSpy = vi.spyOn(notification, 'stopProgressBar');
            
            notification.close();
            
            expect(stopProgressSpy).toHaveBeenCalled();
        });

        it('dovrebbe rimuovere notifica dopo animazione slideOutRight', () => {
            const removeSpy = vi.spyOn(notification, 'remove');
            
            notification.close();
            
            // Simula fine animazione slideOutRight
            const animationEvent = new AnimationEvent('animationend', {
                animationName: 'slideOutRight'
            });
            notification.element.dispatchEvent(animationEvent);
            
            expect(removeSpy).toHaveBeenCalled();
        });

        it('dovrebbe rimuovere notifica dopo animazione slideOutUp', () => {
            const removeSpy = vi.spyOn(notification, 'remove');
            
            notification.close();
            
            // Simula fine animazione slideOutUp
            const animationEvent = new AnimationEvent('animationend', {
                animationName: 'slideOutUp'
            });
            notification.element.dispatchEvent(animationEvent);
            
            expect(removeSpy).toHaveBeenCalled();
        });

        it('dovrebbe rimuovere notifica dopo animazione fadeOut', () => {
            const removeSpy = vi.spyOn(notification, 'remove');
            
            notification.close();
            
            // Simula fine animazione fadeOut
            const animationEvent = new AnimationEvent('animationend', {
                animationName: 'fadeOut'
            });
            notification.element.dispatchEvent(animationEvent);
            
            expect(removeSpy).toHaveBeenCalled();
        });

        it('dovrebbe avere timeout fallback per animazioni', () => {
            const removeSpy = vi.spyOn(notification, 'remove');
            
            // Aggiungi elemento al DOM per simulare condizione reale
            container.appendChild(notification.element);
            
            notification.close();
            
            // Avanza timer oltre il timeout fallback
            vi.advanceTimersByTime(350);
            
            expect(removeSpy).toHaveBeenCalled();
        });
    });

    describe('Progress Bar Animazioni', () => {
        beforeEach(() => {
            notification = new NotificationComponent({
                type: 'success',
                message: 'Test',
                enableProgressBar: true,
                duration: 4000
            });
        });

        it('dovrebbe attivare progress bar con classe active', () => {
            notification.startProgressBar(4000);
            
            expect(notification.progressElement.classList.contains('notification__progress--active')).toBe(true);
        });

        it('dovrebbe impostare durata CSS per animazione', () => {
            notification.startProgressBar(3000);
            
            expect(notification.progressElement.style.getPropertyValue('--progress-duration')).toBe('3000ms');
        });

        it('dovrebbe pausare progress bar con classe paused', () => {
            notification.startProgressBar(4000);
            notification.pauseProgressBar();
            
            expect(notification.progressElement.classList.contains('notification__progress--paused')).toBe(true);
        });

        it('dovrebbe riprendere progress bar con classe resumed', () => {
            notification.startProgressBar(4000);
            notification.pauseProgressBar();
            notification.resumeProgressBar();
            
            expect(notification.progressElement.classList.contains('notification__progress--resumed')).toBe(true);
            expect(notification.progressElement.classList.contains('notification__progress--paused')).toBe(false);
        });

        it('dovrebbe fermare progress bar rimuovendo tutte le classi', () => {
            notification.startProgressBar(4000);
            notification.pauseProgressBar();
            notification.stopProgressBar();
            
            expect(notification.progressElement.classList.contains('notification__progress--active')).toBe(false);
            expect(notification.progressElement.classList.contains('notification__progress--paused')).toBe(false);
            expect(notification.progressElement.classList.contains('notification__progress--resumed')).toBe(false);
        });

        it('dovrebbe rimuovere classe active dopo fine animazione', () => {
            notification.startProgressBar(4000);
            
            // Simula fine animazione progress bar
            const animationEvent = new AnimationEvent('animationend', {
                animationName: 'progressCountdown'
            });
            notification.progressElement.dispatchEvent(animationEvent);
            
            expect(notification.progressElement.classList.contains('notification__progress--active')).toBe(false);
        });
    });

    describe('Supporto Reduced Motion', () => {
        beforeEach(() => {
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
        });

        it('dovrebbe saltare animazioni se prefers-reduced-motion è attivo', () => {
            notification = new NotificationComponent({
                type: 'info',
                message: 'Test',
                enableAnimations: true
            });

            notification.show();
            
            expect(notification.isVisible).toBe(true);
            expect(notification.element.classList.contains('notification--entering')).toBe(false);
        });

        it('dovrebbe rimuovere immediatamente se prefers-reduced-motion è attivo', () => {
            notification = new NotificationComponent({
                type: 'info',
                message: 'Test',
                enableAnimations: true
            });

            const removeSpy = vi.spyOn(notification, 'remove');
            
            notification.close();
            
            expect(removeSpy).toHaveBeenCalled();
        });

        it('dovrebbe gestire errore matchMedia gracefully', () => {
            // Mock matchMedia che lancia errore
            Object.defineProperty(window, 'matchMedia', {
                writable: true,
                value: () => { throw new Error('matchMedia not supported'); }
            });

            notification = new NotificationComponent({
                type: 'info',
                message: 'Test',
                enableAnimations: true
            });

            // Non dovrebbe lanciare errore
            expect(() => notification.show()).not.toThrow();
            expect(() => notification.close()).not.toThrow();
        });
    });

    describe('Focus e Animazioni', () => {
        it('dovrebbe ritardare focus per animazioni', () => {
            notification = new NotificationComponent({
                type: 'error',
                message: 'Test error',
                enableAnimations: true
            });

            const focusSpy = vi.spyOn(notification.element, 'focus');
            
            notification.show();
            
            // Focus non dovrebbe essere chiamato immediatamente
            expect(focusSpy).not.toHaveBeenCalled();
            
            // Avanza timer per il delay del focus
            vi.advanceTimersByTime(350);
            
            expect(focusSpy).toHaveBeenCalled();
        });

        it('dovrebbe usare delay più breve senza animazioni', () => {
            notification = new NotificationComponent({
                type: 'warning',
                message: 'Test warning',
                enableAnimations: false
            });

            const focusSpy = vi.spyOn(notification.element, 'focus');
            
            notification.show();
            
            // Avanza timer per il delay breve
            vi.advanceTimersByTime(100);
            
            expect(focusSpy).toHaveBeenCalled();
        });
    });

    describe('Coordinazione Animazioni', () => {
        it('dovrebbe ignorare eventi animationend da elementi figli', () => {
            notification = new NotificationComponent({
                type: 'info',
                message: 'Test',
                enableAnimations: true
            });

            const removeSpy = vi.spyOn(notification, 'remove');
            
            notification.close();
            
            // Simula evento da elemento figlio
            const childElement = notification.element.querySelector('.notification__icon');
            const animationEvent = new AnimationEvent('animationend', {
                animationName: 'slideOutRight'
            });
            Object.defineProperty(animationEvent, 'target', { value: childElement });
            
            notification.element.dispatchEvent(animationEvent);
            
            // Non dovrebbe rimuovere perché l'evento non viene dall'elemento principale
            expect(removeSpy).not.toHaveBeenCalled();
        });

        it('dovrebbe gestire animazioni multiple correttamente', () => {
            notification = new NotificationComponent({
                type: 'success',
                message: 'Test',
                enableAnimations: true,
                enableProgressBar: true
            });

            notification.show();
            
            // Simula animazione di entrata completata
            const enterEvent = new AnimationEvent('animationend', {
                animationName: 'slideInRight'
            });
            notification.element.dispatchEvent(enterEvent);
            
            expect(notification.isVisible).toBe(true);
            
            // Ora chiudi con animazione
            notification.close();
            
            // Simula animazione di uscita completata
            const exitEvent = new AnimationEvent('animationend', {
                animationName: 'slideOutRight'
            });
            notification.element.dispatchEvent(exitEvent);
            
            // Dovrebbe essere rimossa
            expect(notification.element.parentNode).toBeNull();
        });
    });

    describe('Performance Animazioni', () => {
        it('dovrebbe usare requestAnimationFrame per stili', () => {
            const rafSpy = vi.spyOn(global, 'requestAnimationFrame');
            
            notification = new NotificationComponent({
                type: 'info',
                message: 'Test',
                enableAnimations: true
            });

            notification.show();
            
            expect(rafSpy).toHaveBeenCalled();
        });

        it('dovrebbe forzare reflow per stili iniziali', () => {
            notification = new NotificationComponent({
                type: 'info',
                message: 'Test',
                enableAnimations: true
            });

            const offsetHeightSpy = vi.spyOn(notification.element, 'offsetHeight', 'get');
            
            notification.show();
            
            expect(offsetHeightSpy).toHaveBeenCalled();
        });
    });
});