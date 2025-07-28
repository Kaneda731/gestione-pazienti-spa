// src/js/services/stateService.js

import { logger } from './loggerService.js';

/**
 * Servizio centralizzato per la gestione dello stato dell'applicazione
 * Sostituisce l'uso frammentato di sessionStorage con un approccio più robusto
 * 
 * Principi:
 * - Single Source of Truth: Un'unica fonte per tutti i dati di stato
 * - Reattività: Notifica automatica ai subscriber quando lo stato cambia
 * - Persistenza: Backup automatico su localStorage per dati critici
 * - Type Safety: Validazione dei dati in ingresso
 */

class StateService {
    constructor() {
        // Stato interno dell'applicazione
        this.state = {
            // Navigazione e routing
            currentView: 'home',
            previousView: null,
            
            // Gestione pazienti
            editPazienteId: null,
            selectedPazienteId: null,
            
            // Filtri e ricerche
            listFilters: {
                reparto: '',
                diagnosi: '',
                stato: '',
                infetto: '',
                search: '',
                page: 0,
                sortColumn: 'data_ricovero',
                sortDirection: 'desc'
            },
            
            // Filtri eventi clinici
            eventiCliniciFilters: {
                paziente_search: '',
                tipo_evento: '',
                data_da: '',
                data_a: '',
                reparto: '',
                agente_patogeno: '',
                tipo_intervento: '',
                sortColumn: 'data_evento',
                sortDirection: 'desc'
            },
            
            // Formulari
            formData: {},
            
            // UI State
            isLoading: false,
            loadingMessage: '',
            errors: [],
            notifications: [],
            notificationSettings: {
                maxVisible: 5,
                defaultDuration: 5000,
                position: 'top-right',
                enableSounds: false
            },
            
            // Autenticazione
            user: null,
            isAuthenticated: false
        };

        // Subscribers per la reattività
        this.subscribers = new Map();
        
        // Chiavi che devono essere persistite su localStorage
        this.persistentKeys = ['listFilters', 'editPazienteId', 'formData', 'eventiCliniciFilters', 'notificationSettings'];
        
        // Inizializza lo stato da localStorage se disponibile
        this.loadPersistedState();
    }

    /**
     * Carica lo stato persistente da localStorage
     */
    loadPersistedState() {
        try {
            this.persistentKeys.forEach(key => {
                const storedValue = localStorage.getItem(`app_state_${key}`);
                if (storedValue) {
                    this.state[key] = JSON.parse(storedValue);
                }
            });
        } catch (error) {
            logger.warn('Errore durante il caricamento dello stato persistente:', error);
        }
    }

    /**
     * Salva le chiavi persistenti su localStorage
     */
    persistState() {
        try {
            this.persistentKeys.forEach(key => {
                if (this.state[key] !== null && this.state[key] !== undefined) {
                    localStorage.setItem(`app_state_${key}`, JSON.stringify(this.state[key]));
                }
            });
        } catch (error) {
            logger.warn('Errore durante il salvataggio dello stato persistente:', error);
        }
    }

    /**
     * Ottiene l'intero stato o una parte specifica
     * @param {string} [key] - Chiave specifica da ottenere
     * @returns {any} Lo stato richiesto
     */
    getState(key) {
        if (key) {
            return this.state[key];
        }
        return { ...this.state }; // Copia shallow per evitare mutazioni esterne
    }

    /**
     * Aggiorna lo stato e notifica i subscriber
     * @param {string|object} keyOrState - Chiave specifica o oggetto con multiple proprietà
     * @param {any} [value] - Valore da impostare (se keyOrState è una stringa)
     */
    setState(keyOrState, value) {
        const updates = typeof keyOrState === 'string' 
            ? { [keyOrState]: value }
            : keyOrState;

        // Applica gli aggiornamenti
        const oldState = { ...this.state };
        Object.assign(this.state, updates);

        // Persisti se necessario
        const changedKeys = Object.keys(updates);
        const shouldPersist = changedKeys.some(key => this.persistentKeys.includes(key));
        if (shouldPersist) {
            this.persistState();
        }

        // Notifica i subscriber interessati
        this.notifySubscribers(changedKeys, oldState);
    }

    /**
     * Sottoscrive ai cambiamenti di stato
     * @param {string|array} keys - Chiave/i di stato da monitorare
     * @param {function} callback - Funzione da chiamare quando lo stato cambia
     * @returns {function} Funzione per annullare la sottoscrizione
     */
    subscribe(keys, callback) {
        const keyArray = Array.isArray(keys) ? keys : [keys];
        const subscriberId = Symbol('subscriber');
        
        this.subscribers.set(subscriberId, {
            keys: keyArray,
            callback
        });

        // Restituisce funzione di cleanup
        return () => {
            this.subscribers.delete(subscriberId);
        };
    }

    /**
     * Notifica i subscriber interessati ai cambiamenti
     * @param {array} changedKeys - Chiavi che sono cambiate
     * @param {object} oldState - Stato precedente
     */
    notifySubscribers(changedKeys, oldState) {
        this.subscribers.forEach(({ keys, callback }) => {
            const isInterested = keys.some(key => changedKeys.includes(key));
            if (isInterested) {
                try {
                    callback(this.state, oldState, changedKeys);
                } catch (error) {
                    console.error('Errore in subscriber callback:', error);
                }
            }
        });
    }

    /**
     * Pulisce lo stato dell'applicazione
     * @param {array} [keysToKeep] - Chiavi da mantenere durante la pulizia
     */
    clearState(keysToKeep = ['user', 'isAuthenticated']) {
        const newState = {};
        keysToKeep.forEach(key => {
            if (this.state[key] !== undefined) {
                newState[key] = this.state[key];
            }
        });

        this.state = {
            ...this.constructor.prototype.constructor().state,
            ...newState
        };

        // Pulisci anche localStorage
        this.persistentKeys.forEach(key => {
            if (!keysToKeep.includes(key)) {
                localStorage.removeItem(`app_state_${key}`);
            }
        });
    }

    // === METODI DI CONVENIENZA ===

    /**
     * Gestione pazienti
     */
    setEditPatient(id) {
        this.setState('editPazienteId', id);
    }

    getEditPatientId() {
        return this.getState('editPazienteId');
    }

    clearEditPatient() {
        this.setState('editPazienteId', null);
    }

    /**
     * Gestione filtri
     */
    updateFilters(newFilters) {
        this.setState('listFilters', {
            ...this.getState('listFilters'),
            ...newFilters
        });
    }

    getFilters() {
        return this.getState('listFilters');
    }

    resetFilters() {
        this.setState('listFilters', {
            reparto: '',
            diagnosi: '',
            stato: '',
            infetto: '',
            search: '',
            page: 0,
            sortColumn: 'data_ricovero',
            sortDirection: 'desc'
        });
    }

    /**
     * Gestione form
     */
    setFormData(data) {
        this.setState('formData', data);
    }

    getFormData() {
        return this.getState('formData');
    }

    clearFormData() {
        this.setState('formData', {});
    }

    /**
     * Gestione UI state
     */
    setLoading(isLoading, message = '') {
        this.setState({
            isLoading,
            loadingMessage: message
        });
    }

    addNotification(type, message, options = {}) {
        // Se options è un numero (backward compatibility), trattalo come duration
        if (typeof options === 'number') {
            options = { duration: options };
        }

        const notification = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // ID più unico per evitare collisioni
            type, // 'success', 'error', 'warning', 'info'
            message,
            timestamp: new Date(),
            options: {
                duration: 5000,
                persistent: false,
                closable: true,
                position: 'top-right',
                priority: 0,
                ...options
            }
        };

        const notifications = [...this.getState('notifications'), notification];
        this.setState('notifications', notifications);

        return notification.id;
    }

    removeNotification(id) {
        const notifications = this.getState('notifications').filter(n => n.id !== id);
        this.setState('notifications', notifications);
    }

    /**
     * Gestione navigazione
     */
    setCurrentView(view, previousView = null) {
        this.setState({
            currentView: view,
            previousView: previousView || this.getState('currentView')
        });
    }

    getCurrentView() {
        return this.getState('currentView');
    }

    /**
     * Gestione autenticazione
     */
    setUser(user) {
        this.setState({
            user,
            isAuthenticated: !!user
        });
    }

    getUser() {
        return this.getState('user');
    }

    isAuthenticated() {
        return this.getState('isAuthenticated');
    }

    /**
     * Gestione filtri eventi clinici
     */
    updateEventiCliniciFilters(newFilters) {
        this.setState('eventiCliniciFilters', {
            ...this.getState('eventiCliniciFilters'),
            ...newFilters
        });
    }

    getEventiCliniciFilters() {
        return this.getState('eventiCliniciFilters');
    }

    resetEventiCliniciFilters() {
        this.setState('eventiCliniciFilters', {
            paziente_search: '',
            tipo_evento: '',
            data_da: '',
            data_a: '',
            reparto: '',
            agente_patogeno: '',
            tipo_intervento: '',
            sortColumn: 'data_evento',
            sortDirection: 'desc'
        });
    }
}

// Esporta istanza singleton
export const stateService = new StateService();

// Per debugging in sviluppo
if (import.meta.env.DEV) {
    window.stateService = stateService;
}
