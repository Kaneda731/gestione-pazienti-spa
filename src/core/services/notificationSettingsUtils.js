// src/core/services/notificationSettingsUtils.js
// Utility per la gestione delle impostazioni delle notifiche
import { stateService } from './stateService.js';

export function setCustomDurations(durations) {
    const settings = stateService.getNotificationSettings();
    const updatedSettings = {
        ...settings,
        customDurations: { ...settings.customDurations, ...durations }
    };
    updateSettings(updatedSettings);
}

export function setPersistentTypes(types) {
    const settings = stateService.getNotificationSettings();
    const updatedSettings = {
        ...settings,
        persistentTypes: Array.isArray(types) ? types : [types]
    };
    updateSettings(updatedSettings);
}

export function setAutoCleanupInterval(interval) {
    const settings = stateService.getNotificationSettings();
    const updatedSettings = {
        ...settings,
        autoCleanupInterval: interval
    };
    updateSettings(updatedSettings);
}

export function updatePosition(position) {
    const settings = stateService.getNotificationSettings();
    const updatedSettings = {
        ...settings,
        position,
        customPosition: true
    };
    updateSettings(updatedSettings);
}

export function setMaxVisible(max) {
    const settings = stateService.getNotificationSettings();
    const updatedSettings = {
        ...settings,
        maxVisible: max
    };
    updateSettings(updatedSettings);
}

export function enableSounds(enabled = true) {
    const settings = stateService.getNotificationSettings();
    const updatedSettings = {
        ...settings,
        enableSounds: enabled
    };
    updateSettings(updatedSettings);
}

// Funzione di supporto per aggiornare le impostazioni
export function updateSettings(newSettings) {
    stateService.updateNotificationSettings(newSettings);
}
