// src/core/services/notificationUtils.js
// Utility e metodi di convenienza per notifiche
import { stateService } from './stateService.js';

/** Restituisce tutte le notifiche attive */
export function getActiveNotifications() {
    return stateService.getState('notifications') || [];
}

/** Restituisce una notifica per id */
export function getNotificationById(id) {
    const notifications = getActiveNotifications();
    return notifications.find(n => n.id === id);
}

/** True se ci sono notifiche attive */
export function hasNotifications() {
    return getActiveNotifications().length > 0;
}

/** Numero di notifiche attive */
export function getNotificationCount() {
    return getActiveNotifications().length;
}

/** Notifiche filtrate per tipo */
export function getNotificationsByType(type) {
    return getActiveNotifications().filter(n => n.type === type);
}
