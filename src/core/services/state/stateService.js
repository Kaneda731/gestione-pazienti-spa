// src/js/services/stateService.js

import { logger } from "../logger/loggerService.js";

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
  /**
   * Ottiene l'impostazione di default per le animazioni
   */
  getDefaultAnimationSetting() {
    try {
      return typeof window !== "undefined" && window.matchMedia
        ? !window.matchMedia("(prefers-reduced-motion: reduce)").matches
        : true;
    } catch (error) {
      return true; // Fallback sicuro
    }
  }

  constructor() {
    // Stato interno dell'applicazione
    this.state = {
      // Navigazione e routing
      currentView: "home",
      previousView: null,

      // Gestione pazienti
      editPazienteId: null,
      selectedPazienteId: null,

      // Filtri e ricerche
      listFilters: {
        reparto: "",
        diagnosi: "",
        stato: "",
        infetto: "",
        search: "",
        page: 0,
        sortColumn: "data_ricovero",
        sortDirection: "desc",
      },

      // Filtri eventi clinici
      eventiCliniciFilters: {
        paziente_search: "",
        tipo_evento: "",
        data_da: "",
        data_a: "",
        reparto: "",
        agente_patogeno: "",
        tipo_intervento: "",
        sortColumn: "data_evento",
        sortDirection: "desc",
      },

      // Formulari
      formData: {},

      // UI State
      isLoading: false,
      loadingMessage: "",
      errors: [],
      notifications: [],
      notificationSettings: {
        maxVisible: 5,
        defaultDuration: 5000,
        position: "top-right",
        enableSounds: false,
        enableAnimations: this.getDefaultAnimationSetting(),
        autoCleanupInterval: 300000, // 5 minuti in ms
        maxStoredNotifications: 50,
        persistentTypes: ["error"], // Tipi che rimangono persistenti di default
        soundVolume: 0.5,
        customDurations: {
          success: 4000,
          info: 5000,
          warning: 6000,
          error: 0, // persistente
        },
      },

      // Autenticazione
      user: null,
      isAuthenticated: false,
    };

    // Subscribers per la reattività
    this.subscribers = new Map();

    // Chiavi che devono essere persistite su localStorage
    this.persistentKeys = [
      "listFilters",
      "editPazienteId",
      "formData",
      "eventiCliniciFilters",
      "notificationSettings",
    ];

    // Timer per cleanup automatico delle notifiche vecchie
    this.cleanupTimer = null;

    // Inizializza lo stato da localStorage se disponibile
    this.loadPersistedState();

    // Avvia sistema di cleanup automatico
    this.startAutoCleanup();
  }

  /**
   * Carica lo stato persistente da localStorage
   */
  loadPersistedState() {
    try {
      this.persistentKeys.forEach((key) => {
        const storedValue = localStorage.getItem(`app_state_${key}`);
        if (storedValue) {
          this.state[key] = JSON.parse(storedValue);
        }
      });
    } catch (error) {
      logger.warn(
        "Errore durante il caricamento dello stato persistente:",
        error
      );
    }
  }

  /**
   * Salva le chiavi persistenti su localStorage
   */
  persistState() {
    try {
      this.persistentKeys.forEach((key) => {
        if (this.state[key] !== null && this.state[key] !== undefined) {
          localStorage.setItem(
            `app_state_${key}`,
            JSON.stringify(this.state[key])
          );
        }
      });
    } catch (error) {
      logger.warn(
        "Errore durante il salvataggio dello stato persistente:",
        error
      );
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
    const updates =
      typeof keyOrState === "string" ? { [keyOrState]: value } : keyOrState;

    // Applica gli aggiornamenti con validazione
    const oldState = { ...this.state };

    // Validazione speciale per notifications
    if (
      updates.notifications !== undefined &&
      !Array.isArray(updates.notifications)
    ) {
      console.warn(
        "⚠️ StateService: notifications must be an array, got:",
        typeof updates.notifications
      );
      updates.notifications = [];
    }

    Object.assign(this.state, updates);

    // Persisti se necessario
    const changedKeys = Object.keys(updates);
    const shouldPersist = changedKeys.some((key) =>
      this.persistentKeys.includes(key)
    );
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
    const subscriberId = Symbol("subscriber");

    this.subscribers.set(subscriberId, {
      keys: keyArray,
      callback,
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
    this.subscribers.forEach(({ keys, callback }, subscriberId) => {
      const isInterested = keys.some((key) => changedKeys.includes(key));
      if (isInterested) {
        try {
          const result = callback(this.state, oldState, changedKeys);
          if (result && typeof result.then === "function") {
            // Se la callback restituisce una Promise, gestisci errori async
            result.catch((error) => {
              const callbackName = callback.name || "(anonymous)";
              console.error(
                `Errore async in subscriber callback [${callbackName}] (subscriberId: ${String(
                  subscriberId
                )}):`,
                error,
                "\nchangedKeys:",
                changedKeys,
                "\nsubscriber keys:",
                keys,
                "\ncurrent state:",
                this.state,
                "\nold state:",
                oldState,
                "\ncallback:",
                callback.toString()
              );
            });
          }
        } catch (error) {
          const callbackName = callback.name || "(anonymous)";
          console.error(
            `Errore in subscriber callback [${callbackName}] (subscriberId: ${String(
              subscriberId
            )}):`,
            error,
            "\nchangedKeys:",
            changedKeys,
            "\nsubscriber keys:",
            keys,
            "\ncurrent state:",
            this.state,
            "\nold state:",
            oldState,
            "\ncallback:",
            callback.toString()
          );
        }
      }
    });
  }

  /**
   * Pulisce lo stato dell'applicazione
   * @param {array} [keysToKeep] - Chiavi da mantenere durante la pulizia
   */
  clearState(keysToKeep = ["user", "isAuthenticated"]) {
    // Ferma cleanup timer
    this.stopAutoCleanup();

    const newState = {};
    keysToKeep.forEach((key) => {
      if (this.state[key] !== undefined) {
        newState[key] = this.state[key];
      }
    });

    // Crea stato di default
    const defaultState = {
      currentView: "home",
      previousView: null,
      editPazienteId: null,
      selectedPazienteId: null,
      listFilters: {
        reparto: "",
        diagnosi: "",
        stato: "",
        infetto: "",
        search: "",
        page: 0,
        sortColumn: "data_ricovero",
        sortDirection: "desc",
      },
      eventiCliniciFilters: {
        paziente_search: "",
        tipo_evento: "",
        data_da: "",
        data_a: "",
        reparto: "",
        agente_patogeno: "",
        tipo_intervento: "",
        sortColumn: "data_evento",
        sortDirection: "desc",
      },
      formData: {},
      isLoading: false,
      loadingMessage: "",
      errors: [],
      notifications: [],
      notificationSettings: {
        maxVisible: 5,
        defaultDuration: 5000,
        position: "top-right",
        enableSounds: false,
        enableAnimations: this.getDefaultAnimationSetting(),
        autoCleanupInterval: 300000,
        maxStoredNotifications: 50,
        persistentTypes: ["error"],
        soundVolume: 0.5,
        customDurations: {
          success: 4000,
          info: 5000,
          warning: 6000,
          error: 0,
        },
      },
      user: null,
      isAuthenticated: false,
    };

    this.state = {
      ...defaultState,
      ...newState,
    };

    // Pulisci anche localStorage
    this.persistentKeys.forEach((key) => {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(`app_state_${key}`);
      }
    });

    // Riavvia cleanup se le impostazioni notifiche sono mantenute
    if (keysToKeep.includes("notificationSettings")) {
      this.startAutoCleanup();
    }
  }

  // === METODI DI CONVENIENZA ===

  /**
   * Gestione pazienti
   */
  setEditPatient(id) {
    this.setState("editPazienteId", id);
  }

  getEditPatientId() {
    return this.getState("editPazienteId");
  }

  clearEditPatient() {
    this.setState("editPazienteId", null);
  }

  /**
   * Gestione filtri
   */
  updateFilters(newFilters) {
    this.setState("listFilters", {
      ...this.getState("listFilters"),
      ...newFilters,
    });
  }

  getFilters() {
    return this.getState("listFilters");
  }

  resetFilters() {
    this.setState("listFilters", {
      reparto: "",
      diagnosi: "",
      stato: "",
      infetto: "",
      search: "",
      page: 0,
      sortColumn: "data_ricovero",
      sortDirection: "desc",
    });
  }

  /**
   * Gestione form
   */
  setFormData(data) {
    this.setState("formData", data);
  }

  getFormData() {
    return this.getState("formData");
  }

  clearFormData() {
    this.setState("formData", {});
  }

  /**
   * Gestione UI state
   */
  setLoading(isLoading, message = "") {
    this.setState({
      isLoading,
      loadingMessage: message,
    });
  }

  addNotification(type, message, options = {}) {
    // Se options è un numero (backward compatibility), trattalo come duration
    if (typeof options === "number") {
      options = { duration: options };
    }

    const rawSettings = this.getState("notificationSettings");

    // Merge con defaults per assicurarsi che tutte le proprietà esistano
    const defaultSettings = {
      maxVisible: 5,
      defaultDuration: 5000,
      position: "top-right",
      enableSounds: false,
      enableAnimations: true,
      autoCleanupInterval: 300000,
      maxStoredNotifications: 50,
      persistentTypes: ["error"],
      soundVolume: 0.5,
      customDurations: {
        success: 4000,
        info: 5000,
        warning: 6000,
        error: 0,
      },
    };

    const settings = { ...defaultSettings, ...rawSettings };

    const customDuration =
      settings.customDurations && settings.customDurations[type] !== undefined
        ? settings.customDurations[type]
        : settings.defaultDuration;

    const notification = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      message,
      timestamp: new Date(),
      isVisible: true,
      isRemoving: false,
      options: {
        duration: customDuration,
        persistent: settings.persistentTypes.includes(type),
        closable: true,
        position: settings.position,
        priority: 0,
        ...options,
      },
    };

    // Se persistent è true, forza duration a 0
    if (notification.options.persistent) {
      notification.options.duration = 0;
    }

    const currentNotifications = this.getState("notifications");
    logger.debug(
      `[StateService] Current notifications before adding: ${currentNotifications.length}`,
      currentNotifications
    );

    // Gestisci limite massimo notifiche
    let notifications = [...currentNotifications, notification];
    if (notifications.length > settings.maxStoredNotifications) {
      logger.warn(
        `[StateService] Max stored notifications (${settings.maxStoredNotifications}) exceeded. Trimming old notifications.`
      );
      // Rimuovi le notifiche più vecchie (eccetto errori persistenti)
      const sortedByAge = notifications.sort(
        (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
      );
      const toRemove = sortedByAge.slice(
        0,
        notifications.length - settings.maxStoredNotifications
      );

      notifications = notifications.filter(
        (n) =>
          !toRemove.includes(n) || (n.options.persistent && n.type === "error")
      );
      logger.debug(
        `[StateService] Notifications after trimming: ${notifications.length}`,
        notifications
      );
    }

    this.setState("notifications", notifications);
    logger.debug(
      `[StateService] Notification added. New notifications array length: ${
        this.getState("notifications").length
      }`,
      this.getState("notifications")
    );
    return notification.id;
  }

  removeNotification(id) {
    const before = this.getState("notifications");
    logger.debug("[StateService] Notifiche prima della rimozione:", before);
    const notifications = before.filter((n) => n.id !== id);
    this.setState("notifications", notifications);
    const after = this.getState("notifications");
    logger.debug("[StateService] Notifiche dopo la rimozione:", after);
  }

  /**
   * Gestione avanzata delle notifiche
   */

  /**
   * Aggiorna le impostazioni delle notifiche
   */
  updateNotificationSettings(newSettings) {
    const currentSettings = this.getState("notificationSettings");
    const updatedSettings = { ...currentSettings, ...newSettings };
    this.setState("notificationSettings", updatedSettings);

    // Riavvia cleanup se l'intervallo è cambiato
    if (newSettings.autoCleanupInterval !== undefined) {
      this.startAutoCleanup();
    }
  }

  /**
   * Ottiene le impostazioni delle notifiche
   */
  getNotificationSettings() {
    return this.getState("notificationSettings");
  }

  /**
   * Rimuove tutte le notifiche
   */
  clearAllNotifications() {
    this.setState("notifications", []);
  }

  /**
   * Rimuove notifiche per tipo
   */
  clearNotificationsByType(type) {
    const notifications = this.getState("notifications").filter(
      (n) => n.type !== type
    );
    this.setState("notifications", notifications);
  }

  /**
   * Rimuove notifiche più vecchie di un certo tempo
   */
  clearOldNotifications(maxAge = 300000) {
    // 5 minuti default
    const now = new Date();
    const originalNotifications = this.getState("notifications");
    const filteredNotifications = originalNotifications.filter(
      (notification) => {
        const age = now - new Date(notification.timestamp);
        // Non rimuovere notifiche persistenti di tipo error
        if (notification.options.persistent && notification.type === "error") {
          return true;
        }
        return age < maxAge;
      }
    );

    this.setState("notifications", filteredNotifications);
    return originalNotifications.length - filteredNotifications.length; // Numero di notifiche rimosse
  }

  /**
   * Marca una notifica come in fase di rimozione
   */
  markNotificationRemoving(id) {
    const notifications = this.getState("notifications").map((n) =>
      n.id === id ? { ...n, isRemoving: true } : n
    );
    this.setState("notifications", notifications);
  }

  /**
   * Ottiene notifiche per tipo
   */
  getNotificationsByType(type) {
    return this.getState("notifications").filter((n) => n.type === type);
  }

  /**
   * Ottiene notifiche visibili (non in fase di rimozione)
   */
  getVisibleNotifications() {
    return this.getState("notifications").filter(
      (n) => n.isVisible && !n.isRemoving
    );
  }

  /**
   * Conta notifiche per tipo
   */
  countNotificationsByType(type) {
    return this.getNotificationsByType(type).length;
  }

  /**
   * Verifica se ci sono notifiche di errore attive
   */
  hasErrorNotifications() {
    return this.countNotificationsByType("error") > 0;
  }

  /**
   * Sistema di cleanup automatico
   */
  startAutoCleanup() {
    // Pulisci timer esistente
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    const settings = this.getState("notificationSettings");

    // Avvia nuovo timer
    this.cleanupTimer = setInterval(() => {
      const removed = this.clearOldNotifications(settings.autoCleanupInterval);
      if (removed > 0) {
        logger.debug(
          `Cleanup automatico: rimosse ${removed} notifiche vecchie`
        );
      }
    }, settings.autoCleanupInterval);
  }

  /**
   * Ferma il cleanup automatico
   */
  stopAutoCleanup() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Ottiene statistiche sulle notifiche
   */
  getNotificationStats() {
    const notifications = this.getState("notifications");
    const stats = {
      total: notifications.length,
      visible: notifications.filter((n) => n.isVisible && !n.isRemoving).length,
      byType: {
        success: notifications.filter((n) => n.type === "success").length,
        error: notifications.filter((n) => n.type === "error").length,
        warning: notifications.filter((n) => n.type === "warning").length,
        info: notifications.filter((n) => n.type === "info").length,
      },
      persistent: notifications.filter((n) => n.options.persistent).length,
      oldest:
        notifications.length > 0
          ? Math.min(
              ...notifications.map((n) => new Date(n.timestamp).getTime())
            )
          : null,
      newest:
        notifications.length > 0
          ? Math.max(
              ...notifications.map((n) => new Date(n.timestamp).getTime())
            )
          : null,
    };

    return stats;
  }

  /**
   * Esporta configurazione notifiche per backup
   */
  exportNotificationSettings() {
    return {
      settings: this.getState("notificationSettings"),
      timestamp: new Date().toISOString(),
      version: "1.0",
    };
  }

  /**
   * Importa configurazione notifiche da backup
   */
  importNotificationSettings(backup) {
    try {
      if (backup.version === "1.0" && backup.settings) {
        this.updateNotificationSettings(backup.settings);
        return true;
      }
      return false;
    } catch (error) {
      logger.error(
        "Errore durante importazione impostazioni notifiche:",
        error
      );
      return false;
    }
  }

  /**
   * Gestione navigazione
   */
  setCurrentView(view, previousView = null) {
    this.setState({
      currentView: view,
      previousView: previousView || this.getState("currentView"),
    });
  }

  getCurrentView() {
    return this.getState("currentView");
  }

  /**
   * Gestione autenticazione
   */
  setUser(user) {
    this.setState({
      user,
      isAuthenticated: !!user,
    });
  }

  getUser() {
    return this.getState("user");
  }

  isAuthenticated() {
    return this.getState("isAuthenticated");
  }

  /**
   * Gestione filtri eventi clinici
   */
  updateEventiCliniciFilters(newFilters) {
    this.setState("eventiCliniciFilters", {
      ...this.getState("eventiCliniciFilters"),
      ...newFilters,
    });
  }

  getEventiCliniciFilters() {
    return this.getState("eventiCliniciFilters");
  }

  resetEventiCliniciFilters() {
    this.setState("eventiCliniciFilters", {
      paziente_search: "",
      tipo_evento: "",
      data_da: "",
      data_a: "",
      reparto: "",
      agente_patogeno: "",
      tipo_intervento: "",
      sortColumn: "data_evento",
      sortDirection: "desc",
    });
  }

  /**
   * Cleanup delle risorse quando il servizio viene distrutto
   */
  destroy() {
    this.stopAutoCleanup();
    this.subscribers.clear();

    // Pulisci localStorage se necessario
    this.persistentKeys.forEach((key) => {
      localStorage.removeItem(`app_state_${key}`);
    });
  }
}

// Esporta istanza singleton
export const stateService = new StateService();

// Expose for development debugging
if (import.meta.env.DEV) {
  window.stateService = stateService;
}
