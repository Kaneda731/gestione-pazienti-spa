/**
 * Test per NotificationVirtualContainer
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NotificationVirtualContainer } from '../../../../src/shared/components/notifications/NotificationVirtualContainer.js';

// Mock DOM
Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: 1024,
});

// Mock document.body
const mockBody = {
    appendChild: vi.fn(),
    removeChild: vi.fn()
};

Object.defineProperty(document, 'body', {
    value: mockBody,
    writable: true
});

describe('NotificationVirtualContainer', () => {
    let container;
    
    beforeEach(() => {
        vi.clearAllMocks();
        
        // Mock createElement
        global.document.createElement = vi.fn((tagName) => {
            const element = {
                tagName: tagName.toUpperCase(),
                className: '',
                style: {},
                innerHTML: '',
                appendChild: vi.fn(),
                removeChild: vi.fn(),
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                setAttribute: vi.fn(),
                getAttribute: vi.fn(),
                querySelector: vi.fn(),
                querySelectorAll: vi.fn(() => []),
                offsetHeight: 80,
                parentNode: null
            };
            
            // Mock specific elements
            if (tagName === 'div') {
                element.scrollTop = 0;
            }
            
            return element;
        });
        
        // Mock window methods
        global.window.addEventListener = vi.fn();
        global.window.removeEventListener = vi.fn();
    });
    
    afterEach(() => {
        if (container) {
            container.destroy();
            container = null;
        }
    });
    
    it('dovrebbe creare container con opzioni default', () => {
        container = new NotificationVirtualContainer();
        
        expect(container.options.position).toBe('top-right');
        expect(container.options.maxVisible).toBe(5);
        expect(container.options.itemHeight).toBe(80);
        expect(container.notifications).toEqual([]);
    });
    
    it('dovrebbe creare container con opzioni personalizzate', () => {
        const customOptions = {
            position: 'top-left',
            maxVisible: 10,
            itemHeight: 100
        };
        
        container = new NotificationVirtualContainer(customOptions);
        
        expect(container.options.position).toBe('top-left');
        expect(container.options.maxVisible).toBe(10);
        expect(container.options.itemHeight).toBe(100);
    });
    
    it('dovrebbe aggiungere notifica correttamente', () => {
        container = new NotificationVirtualContainer();
        
        const notification = {
            id: 'test-1',
            type: 'success',
            message: 'Test message',
            timestamp: new Date()
        };
        
        container.addNotification(notification);
        
        expect(container.notifications).toHaveLength(1);
        expect(container.notifications[0]).toEqual(notification);
    });
    
    it('dovrebbe rimuovere notifica correttamente', () => {
        container = new NotificationVirtualContainer();
        
        const notification = {
            id: 'test-1',
            type: 'success',
            message: 'Test message'
        };
        
        container.addNotification(notification);
        expect(container.notifications).toHaveLength(1);
        
        container.removeNotification('test-1');
        expect(container.notifications).toHaveLength(0);
    });
    
    it('dovrebbe limitare il numero di notifiche in memoria', () => {
        container = new NotificationVirtualContainer();
        
        // Aggiungi più di 100 notifiche
        for (let i = 0; i < 150; i++) {
            container.addNotification({
                id: `test-${i}`,
                type: 'info',
                message: `Message ${i}`
            });
        }
        
        expect(container.notifications).toHaveLength(100);
    });
    
    it('dovrebbe calcolare range visibile correttamente', () => {
        container = new NotificationVirtualContainer({
            itemHeight: 80,
            bufferSize: 2
        });
        
        container.containerHeight = 400; // 5 items visibili
        container.scrollTop = 160; // Scroll di 2 items
        
        container.updateVisibleRange();
        
        expect(container.visibleRange.start).toBe(0); // 2 - 2 (buffer) = 0
        expect(container.visibleRange.end).toBeGreaterThan(container.visibleRange.start);
    });
    
    it('dovrebbe generare HTML corretto per notifica', () => {
        container = new NotificationVirtualContainer();
        
        const notification = {
            id: 'test-1',
            type: 'success',
            message: 'Test message',
            timestamp: new Date()
        };
        
        const element = container.createNotificationElement(notification);
        
        expect(element.className).toContain('notification--success');
        expect(element.getAttribute('data-notification-id')).toBe('test-1');
        expect(element.getAttribute('role')).toBe('status');
    });
    
    it('dovrebbe gestire escape HTML correttamente', () => {
        container = new NotificationVirtualContainer();
        
        const maliciousText = '<script>alert("xss")</script>';
        const escaped = container.escapeHtml(maliciousText);
        
        expect(escaped).not.toContain('<script>');
        expect(escaped).toContain('&lt;script&gt;');
    });
    
    it('dovrebbe formattare timestamp correttamente', () => {
        container = new NotificationVirtualContainer();
        
        const timestamp = new Date('2024-01-01T12:30:00');
        const formatted = container.formatTimestamp(timestamp);
        
        expect(formatted).toMatch(/\d{2}:\d{2}/);
    });
    
    it('dovrebbe pulire risorse alla distruzione', () => {
        container = new NotificationVirtualContainer();
        
        const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
        
        container.destroy();
        
        expect(removeEventListenerSpy).toHaveBeenCalled();
        expect(container.notifications).toEqual([]);
        expect(container.container).toBeNull();
    });
    
    it('dovrebbe gestire icone per diversi tipi', () => {
        container = new NotificationVirtualContainer();
        
        expect(container.getIconForType('success')).toBe('check_circle');
        expect(container.getIconForType('error')).toBe('error');
        expect(container.getIconForType('warning')).toBe('warning');
        expect(container.getIconForType('info')).toBe('info');
        expect(container.getIconForType('unknown')).toBe('info');
    });
    
    it('dovrebbe restituire notifiche visibili correttamente', () => {
        container = new NotificationVirtualContainer();
        
        // Aggiungi alcune notifiche
        for (let i = 0; i < 10; i++) {
            container.addNotification({
                id: `test-${i}`,
                type: 'info',
                message: `Message ${i}`
            });
        }
        
        container.visibleRange = { start: 2, end: 5 };
        const visible = container.getVisibleNotifications();
        
        expect(visible).toHaveLength(3);
        expect(visible[0].id).toBe('test-2');
        expect(visible[2].id).toBe('test-4');
    });
});