import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Create spies/mocks using vi.hoisted to avoid hoisting issues
const stateSpies = vi.hoisted(() => ({
    addNotification: vi.fn((type, message, options) => ({ id: 'id-1', type, message, options })),
    removeNotification: vi.fn(),
    clearAllNotifications: vi.fn(),
    clearNotificationsByType: vi.fn(),
    updateNotificationSettings: vi.fn(),
    getNotificationSettings: vi.fn(() => ({ position: 'top-right', maxVisible: 5, customDurations: {}, enableAnimations: true })),
    getState: vi.fn((key) => (key === 'notifications' ? [] : {})),
    subscribe: vi.fn(),
    setState: vi.fn(),
    exportNotificationSettings: vi.fn(() => ({ version: '2.0', settings: { position: 'top-right', maxVisible: 5 } })),
    importNotificationSettings: vi.fn(() => true),
    getNotificationStats: vi.fn(() => ({ total: 0, visible: 0, byType: { success: 0, error: 0, warning: 0, info: 0 }, persistent: 0 })),
    getNotificationsByType: vi.fn(() => []),
    getVisibleNotifications: vi.fn(() => []),
    hasErrorNotifications: vi.fn(() => false)
}));

// Mock the exact module path used in the service
vi.mock('../../../../src/core/services/state/stateService.js', () => ({ stateService: stateSpies }));

// We'll import the service after mocks are set up
let notificationService;

describe('notificationService (characterization)', () => {
  beforeEach(async () => {
    vi.resetModules();
    // Reset DOM
    document.body.innerHTML = '';
    // Reset spies
    Object.values(stateSpies).forEach((fn) => fn.mockClear && fn.mockClear());
    // Import fresh module instance
    const mod = await import('../../../../src/core/services/notifications/notificationService.js');
    notificationService = mod.notificationService;
  });

  afterEach(() => {
    // Clean up any timers created by the service
    if (notificationService?.timers) {
      notificationService.timers.forEach((t) => clearTimeout(t));
      notificationService.timers.clear();
    }
  });

  it('show() delegates to stateService.addNotification with merged options', () => {
    const res = notificationService.show('success', 'Hello', { duration: 1234, title: 'T' });
    expect(stateSpies.addNotification).toHaveBeenCalledTimes(1);
    const [type, message, options] = stateSpies.addNotification.mock.calls[0];
    expect(type).toBe('success');
    expect(message).toBe('Hello');
    expect(options.duration).toBe(1234);
    expect(options.title).toBe('T');
    expect(res).toBeDefined();
  });

  it('convenience methods map numeric options to duration', () => {
    const spy = vi.spyOn(notificationService, 'show');
    notificationService.success('ok', 2000);
    notificationService.info('i', 3000);
    notificationService.warning('w', 4000);
    notificationService.error('e', 0);
    expect(spy).toHaveBeenCalledTimes(4);
    const durations = spy.mock.calls.map(([, , opts]) => opts.duration);
    expect(durations).toEqual([2000, 3000, 4000, 0]);
    spy.mockRestore();
  });

  it('removeNotification() removes from container and state', async () => {
    vi.useFakeTimers();
    // Prepare DOM element representing a notification
    const el = document.createElement('div');
    el.dataset.id = 'n1';
    el.className = 'notification';
    document.body.appendChild(el);

    // Fake container matching interface used by service
    const removed = [];
    notificationService.notificationContainer = {
      container: document.body,
      removeNotification: (id) => removed.push(id),
      clearAllNotifications: vi.fn()
    };

    // Simulate notification present in state
    stateSpies.getState.mockImplementation((key) => (key === 'notifications' ? [{ id: 'n1', type: 'info', options: {} }] : {}));

  notificationService.removeNotification('n1');
  // Wait for exit animation timeout (~300ms)
  vi.advanceTimersByTime(400);
  await Promise.resolve();
  expect(removed).toContain('n1');
  expect(stateSpies.removeNotification).toHaveBeenCalledWith('n1');
  vi.useRealTimers();
  });

  it('clear() clears timers, container and state', () => {
    // Add a fake timer
    notificationService.timers.set('x', setTimeout(() => {}, 50));
    // Provide container
    const clearSpy = vi.fn();
    notificationService.notificationContainer = { clearAllNotifications: clearSpy };

    notificationService.clear();
    expect(clearSpy).toHaveBeenCalled();
    expect(stateSpies.clearAllNotifications).toHaveBeenCalled();
    expect(notificationService.timers.size).toBe(0);
  });

  it('updateSettings() validates and updates container settings', () => {
    // Provide container with updateSettings
    const updateSpy = vi.fn();
    notificationService.notificationContainer = { updateSettings: updateSpy };

    // When stateService returns updated settings
    stateSpies.getNotificationSettings.mockReturnValue({ position: 'bottom-left', maxVisible: 7 });

    const ok = notificationService.updateSettings({ position: 'bottom-left', maxVisible: 7 });
    expect(ok).toBe(true);
    expect(stateSpies.updateNotificationSettings).toHaveBeenCalled();
    expect(updateSpy).toHaveBeenCalledWith({ position: 'bottom-left', maxVisible: 7 });
    expect(notificationService.settings.position).toBe('bottom-left');
  });
});