// Utilità per le notifiche

export function getActiveNotifications() {
    return window.stateService?.getState('notifications') || [];
}

export function getNotificationById(id) {
    const notifications = getActiveNotifications();
    return notifications.find(n => n.id === id);
}

export function hasNotifications() {
    return getActiveNotifications().length > 0;
}

export function getNotificationCount() {
    return getActiveNotifications().length;
}

export function getNotificationsByType(type) {
    const notifications = getActiveNotifications();
    return notifications.filter(n => n.type === type);
}