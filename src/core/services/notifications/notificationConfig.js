// Configurazione base per le notifiche

export const NOTIFICATION_TYPES = {
    SUCCESS: {
        icon: 'check_circle',
        ariaRole: 'status',
        ariaLive: 'polite',
        defaultDuration: 4000
    },
    ERROR: {
        icon: 'error',
        ariaRole: 'alert',
        ariaLive: 'assertive',
        defaultDuration: 0 // persistente
    },
    WARNING: {
        icon: 'warning',
        ariaRole: 'alert',
        ariaLive: 'assertive',
        defaultDuration: 6000
    },
    INFO: {
        icon: 'info',
        ariaRole: 'status',
        ariaLive: 'polite',
        defaultDuration: 5000
    }
};

export const RESPONSIVE_CONFIG = {
    mobile: {
        maxWidth: 768
    },
    tablet: {
        maxWidth: 992
    }
};

export function getDurationForType(type, customDuration) {
    if (customDuration !== undefined) {
        return customDuration;
    }
    
    const typeConfig = NOTIFICATION_TYPES[type.toUpperCase()];
    return typeConfig ? typeConfig.defaultDuration : 5000;
}