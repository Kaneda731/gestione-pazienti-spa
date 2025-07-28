/**
 * Ottiene durata differenziata per tipo notifica
 */
export function getDurationForType(type, customDuration) {
    if (customDuration !== undefined) {
        return customDuration;
    }

    const typeConfig = NOTIFICATION_TYPES[type.toUpperCase()];
    return typeConfig ? typeConfig.defaultDuration : NOTIFICATION_TYPES.INFO.defaultDuration;
}
// Configurazioni e costanti per il sistema notifiche

export const NOTIFICATION_TYPES = {
    SUCCESS: {
        type: 'success',
        icon: 'check_circle',
        defaultDuration: 4000,
        ariaRole: 'status',
        ariaLive: 'polite'
    },
    ERROR: {
        type: 'error',
        icon: 'error',
        defaultDuration: 0, // Persistente
        ariaRole: 'alert',
        ariaLive: 'assertive'
    },
    WARNING: {
        type: 'warning',
        icon: 'warning',
        defaultDuration: 6000,
        ariaRole: 'alert',
        ariaLive: 'assertive'
    },
    INFO: {
        type: 'info',
        icon: 'info',
        defaultDuration: 5000,
        ariaRole: 'status',
        ariaLive: 'polite'
    }
};

export const RESPONSIVE_CONFIG = {
    mobile: {
        maxWidth: 767,
        position: 'top-center',
        maxVisible: 3,
        containerPadding: '1rem'
    },
    tablet: {
        maxWidth: 991,
        position: 'top-right',
        maxVisible: 4,
        containerPadding: '1.5rem'
    },
    desktop: {
        minWidth: 992,
        position: 'top-right',
        maxVisible: 5,
        containerPadding: '2rem'
    }
};
