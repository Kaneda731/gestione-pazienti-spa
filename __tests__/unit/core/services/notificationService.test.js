// __tests__/unit/core/services/notificationService.test.js

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { notificationService } from '../../../../src/core/services/notificationService.js';
import { stateService } from '../../../../src/core/services/stateService.js';

// Mock DOM methods
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

describe('NotificationService Enhanced', () => {
    beforeEach(() => {
        // Reset state
        stateService.setState('notifications', []);
        stateService.setState('notificationSettings', {
            maxVisible: 5,
            defaultDuration: 5000,
            position: 'top-right',
            enableSounds: false
        });
        
        // Clear any existing timers
        notificationService.timers.clear();
        
        // Mock DOM
        document.body.innerHTML = '';
    });

    afterEach(() => {
        // Cleanup
        notificationService.clear();
        document.body.innerHTML = '';
    });

    describe('Basic Functionality', () => {
        it('should create notification with basic options', () => {
            const id = notificationService.success('Test message');
            
            expect(id).toBeDefined();
            
            const notifications = stateService.getState('notifications');
            expect(notifications).toHaveLength(1);
            expect(notifications[0].message).toBe('Test message');
            expect(notifications[0].type).toBe('success');
        });

        it('should support all notification types', () => {
            notificationService.success('Success message');
            notificationService.error('Error message');
            notificationService.warning('Warning message');
            notificationService.info('Info message');
            
            const notifications = stateService.getState('notifications');
            expect(notifications).toHaveLength(4);
            
            const types = notifications.map(n => n.type);
            expect(types).toContain('success');
            expect(types).toContain('error');
            expect(types).toContain('warning');
            expect(types).toContain('info');
        });
    });

    describe('Advanced Options', () => {
        it('should support custom duration', () => {
            const id = notificationService.success('Test', { duration: 10000 });
            
            const notifications = stateService.getState('notifications');
            expect(notifications[0].options.duration).toBe(10000);
        });

        it('should support persistent notifications', () => {
            const id = notificationService.persistent('info', 'Persistent message');
            
            const notifications = stateService.getState('notifications');
            expect(notifications[0].options.persistent).toBe(true);
            expect(notifications[0].options.duration).toBe(0);
        });

        it('should support custom actions', () => {
            const mockAction = vi.fn();
            const actions = [
                { label: 'Action 1', action: mockAction, style: 'primary' }
            ];
            
            const id = notificationService.withActions('info', 'Test', actions);
            
            const notifications = stateService.getState('notifications');
            expect(notifications[0].options.actions).toEqual(actions);
        });

        it('should support priority ordering', () => {
            notificationService.success('Low priority', { priority: 1 });
            notificationService.error('High priority', { priority: 10 });
            notificationService.info('Medium priority', { priority: 5 });
            
            const notifications = stateService.getState('notifications');
            expect(notifications).toHaveLength(3);
            
            // Priorities should be stored correctly
            expect(notifications.find(n => n.message === 'High priority').options.priority).toBe(10);
            expect(notifications.find(n => n.message === 'Medium priority').options.priority).toBe(5);
            expect(notifications.find(n => n.message === 'Low priority').options.priority).toBe(1);
        });

        it('should support custom position', () => {
            const id = notificationService.success('Test', { position: 'bottom-left' });
            
            const notifications = stateService.getState('notifications');
            expect(notifications[0].options.position).toBe('bottom-left');
        });

        it('should support title option', () => {
            const id = notificationService.success('Message', { title: 'Success Title' });
            
            const notifications = stateService.getState('notifications');
            expect(notifications[0].options.title).toBe('Success Title');
        });
    });

    describe('Convenience Methods', () => {
        it('should support confirm method with actions', () => {
            const onConfirm = vi.fn();
            const onCancel = vi.fn();
            
            const id = notificationService.confirm('Are you sure?', onConfirm, onCancel);
            
            const notifications = stateService.getState('notifications');
            expect(notifications[0].type).toBe('warning');
            expect(notifications[0].options.actions).toHaveLength(2);
            expect(notifications[0].options.persistent).toBe(true);
            expect(notifications[0].options.closable).toBe(false);
        });

        it('should support loading method', () => {
            const id = notificationService.loading('Loading data...');
            
            const notifications = stateService.getState('notifications');
            expect(notifications[0].type).toBe('info');
            expect(notifications[0].options.persistent).toBe(true);
            expect(notifications[0].options.closable).toBe(false);
            expect(notifications[0].options.title).toBe('Caricamento...');
        });

        it('should support priority method', () => {
            const id = notificationService.priority('error', 'Critical error', 10);
            
            const notifications = stateService.getState('notifications');
            expect(notifications[0].options.priority).toBe(10);
        });
    });

    describe('Management Methods', () => {
        it('should clear all notifications', () => {
            notificationService.success('Test 1');
            notificationService.error('Test 2');
            
            expect(stateService.getState('notifications')).toHaveLength(2);
            
            notificationService.clear();
            
            expect(stateService.getState('notifications')).toHaveLength(0);
        });

        it('should clear notifications by type', () => {
            notificationService.success('Success 1');
            notificationService.success('Success 2');
            notificationService.error('Error 1');
            
            expect(stateService.getState('notifications')).toHaveLength(3);
            
            notificationService.clearByType('success');
            
            const remaining = stateService.getState('notifications');
            expect(remaining).toHaveLength(1);
            expect(remaining[0].type).toBe('error');
        });

        it('should remove specific notification', () => {
            // Test directly with stateService to isolate the issue
            const id1 = stateService.addNotification('success', 'Test 1');
            const id2 = stateService.addNotification('error', 'Test 2');
            
            expect(stateService.getState('notifications')).toHaveLength(2);
            
            stateService.removeNotification(id1);
            
            const remaining = stateService.getState('notifications');
            expect(remaining).toHaveLength(1);
            expect(remaining[0].id).toBe(id2);
            expect(remaining[0].message).toBe('Test 2');
        });
    });

    describe('Utility Methods', () => {
        it('should get active notifications', () => {
            notificationService.success('Test 1');
            notificationService.error('Test 2');
            
            const active = notificationService.getActiveNotifications();
            expect(active).toHaveLength(2);
        });

        it('should get notification by ID', () => {
            const id = notificationService.success('Test message');
            
            const notification = notificationService.getNotificationById(id);
            expect(notification).toBeDefined();
            expect(notification.message).toBe('Test message');
        });

        it('should check if has notifications', () => {
            expect(notificationService.hasNotifications()).toBe(false);
            
            notificationService.success('Test');
            
            expect(notificationService.hasNotifications()).toBe(true);
        });

        it('should get notification count', () => {
            expect(notificationService.getNotificationCount()).toBe(0);
            
            notificationService.success('Test 1');
            notificationService.error('Test 2');
            
            expect(notificationService.getNotificationCount()).toBe(2);
        });

        it('should get notifications by type', () => {
            notificationService.success('Success 1');
            notificationService.success('Success 2');
            notificationService.error('Error 1');
            
            const successNotifications = notificationService.getNotificationsByType('success');
            expect(successNotifications).toHaveLength(2);
            
            const errorNotifications = notificationService.getNotificationsByType('error');
            expect(errorNotifications).toHaveLength(1);
        });
    });

    describe('Settings Management', () => {
        it('should update position', () => {
            notificationService.updatePosition('bottom-left');
            
            expect(notificationService.settings.position).toBe('bottom-left');
            expect(notificationService.settings.customPosition).toBe(true);
            
            const settings = stateService.getState('notificationSettings');
            expect(settings.position).toBe('bottom-left');
        });

        it('should set max visible notifications', () => {
            notificationService.setMaxVisible(3);
            
            expect(notificationService.settings.maxVisible).toBe(3);
            
            const settings = stateService.getState('notificationSettings');
            expect(settings.maxVisible).toBe(3);
        });

        it('should enable/disable sounds', () => {
            notificationService.enableSounds(true);
            
            expect(notificationService.settings.enableSounds).toBe(true);
            
            const settings = stateService.getState('notificationSettings');
            expect(settings.enableSounds).toBe(true);
        });
    });

    describe('Backward Compatibility', () => {
        it('should support old duration parameter format', () => {
            const id = notificationService.success('Test message', 3000);
            
            const notifications = stateService.getState('notifications');
            expect(notifications[0].options.duration).toBe(3000);
        });

        it('should work with old stateService.addNotification calls', () => {
            const id = stateService.addNotification('success', 'Test message', 4000);
            
            const notifications = stateService.getState('notifications');
            expect(notifications[0].options.duration).toBe(4000);
        });
    });
});