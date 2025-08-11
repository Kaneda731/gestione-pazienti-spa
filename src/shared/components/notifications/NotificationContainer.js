// Container semplificato per le notifiche

export class NotificationContainer {
  constructor(options = {}) {
    this.options = {
      position: "top-right",
      maxVisible: 5,
      ...options,
    };
    // Alias compatibile con alcuni test/consumatori
    this.settings = this.options;
    this.container = this.createContainer();
    this.notifications = new Map();

    // Bind resize handler for cleanup
    this.handleResize = this.handleResize.bind(this);
    if (typeof window !== "undefined") {
      window.addEventListener("resize", this.handleResize);
    }
  }

  createContainer() {
    // SSR guard: se non c'è window o document, ritorna null
    if (typeof window === "undefined" || typeof document === "undefined") {
      return null;
    }

    // Rimuovi eventuale container precedente duplicato
    const existing = document.getElementById("notification-container");
    if (existing && existing.parentNode) {
      existing.parentNode.removeChild(existing);
    }

    const container = document.createElement("div");
    container.id = "notification-container";
    const position = this.options.position || "top-right";
    container.className = `notification-container notification-container--${position}`;
    container.setAttribute("role", "region");
    container.setAttribute("aria-label", "Notifiche di sistema");
    container.setAttribute("aria-live", "polite");
    container.setAttribute("data-position", position);
    container.style.cssText = `
            position: fixed;
            z-index: 1050;
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-width: 400px;
            pointer-events: auto;
        `;

    // Posizionamento di default basato sulla posizione
    this.applyPositionStyles(container, position);

    // Add keyboard event handling
    container.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        this.clearAllNotifications();
      }
    });

    if (document.body) {
      document.body.appendChild(container);
    }
    return container;
  }

  applyPositionStyles(container, position) {
    if (!container) return;
    // Reset
    container.style.top = "";
    container.style.right = "";
    container.style.bottom = "";
    container.style.left = "";
    container.style.transform = "";

    const padding = "20px";
    switch (position) {
      case "top-left":
        container.style.top = padding;
        container.style.left = padding;
        break;
      case "top-center":
        container.style.top = padding;
        container.style.left = "50%";
        container.style.transform = "translateX(-50%)";
        break;
      case "bottom-right":
        container.style.bottom = padding;
        container.style.right = padding;
        break;
      case "bottom-left":
        container.style.bottom = padding;
        container.style.left = padding;
        break;
      case "bottom-center":
        container.style.bottom = padding;
        container.style.left = "50%";
        container.style.transform = "translateX(-50%)";
        break;
      case "top-right":
      default:
        container.style.top = padding;
        container.style.right = padding;
        break;
    }
  }

  addNotification(element) {
    if (!element) return;

    const id = element.dataset.id;
    if (id && this.notifications.has(id)) {
      return; // Già presente
    }

    // Aggiungi al DOM
    this.container.appendChild(element);

    if (id) {
      this.notifications.set(id, element);
    }

    // Applica automaticamente il limite di visibilità
    this.enforceMaxVisible();
  }

  removeNotification(id) {
    const element = this.notifications.get(id);
    if (element && element.parentNode) {
      element.parentNode.removeChild(element);
      this.notifications.delete(id);
    }
  }

  clearAllNotifications() {
    this.notifications.forEach((element, id) => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    });
    this.notifications.clear();
  }

  // Alias richiesto da alcune API/test
  clear() {
    this.clearAllNotifications();
  }

  updateSettings(newSettings) {
    this.options = { ...this.options, ...newSettings };
    this.settings = this.options;

    if (newSettings.position) {
      const pos = newSettings.position;
      this.container.setAttribute("data-position", pos);
      // aggiorna classi modifier
      this.container.className = `notification-container notification-container--${pos}`;
      this.applyPositionStyles(this.container, pos);

      // Emit position change event
      if (typeof document !== "undefined") {
        const event = new CustomEvent("notificationContainer:positionChanged", {
          detail: { position: pos },
        });
        document.dispatchEvent(event);
      }
    }
  }

  // Compatibilità: aggiorna solo la posizione (alias di updateSettings)
  updatePosition(position) {
    // Validate position
    if (!NotificationContainer.isValidPosition(position)) {
      console.warn(
        `Posizione non supportata: ${position}. Posizioni valide: ${NotificationContainer.getSupportedPositions().join(
          ", "
        )}`
      );
      return;
    }

    this.updateSettings({ position });
  }

  // Compatibilità: restituisce lista notifiche correnti (elementi DOM)
  getNotifications() {
    return Array.from(this.notifications.values());
  }

  // Compatibilità: restituisce solo le notifiche visibili (non nascoste)
  getVisibleNotifications() {
    return Array.from(this.notifications.values()).filter(
      (element) =>
        !element.hasAttribute("data-hidden") &&
        !element.hasAttribute("aria-hidden")
    );
  }

  // Impone un limite massimo di notifiche visibili nascondendo le più vecchie
  enforceMaxVisible() {
    const max = this.options.maxVisible;
    if (!max || max <= 0) return;

    const allNotifications = Array.from(this.notifications.values());

    // Show the most recent notifications up to maxVisible
    allNotifications.forEach((element, index) => {
      if (index < max) {
        // Show notification
        element.removeAttribute("data-hidden");
        element.removeAttribute("aria-hidden");
        element.style.display = "";
      } else {
        // Hide notification
        element.setAttribute("data-hidden", "true");
        element.setAttribute("aria-hidden", "true");
        element.style.display = "none";
      }
    });
  }

  // Aggiorna maxVisible e applica subito il trimming
  updateMaxVisible(maxVisible) {
    this.options.maxVisible = maxVisible;
    this.settings.maxVisible = maxVisible;
    this.enforceMaxVisible();

    // Emit maxVisible change event
    if (typeof document !== "undefined") {
      const event = new CustomEvent("notificationContainer:maxVisibleChanged", {
        detail: { maxVisible },
      });
      document.dispatchEvent(event);
    }
  }

  // Per parità API con il container virtuale
  handleResize() {
    // opzionale nei test, no-op qui
  }

  // Rimuove container dal DOM e pulisce riferimenti
  destroy() {
    try {
      this.clearAllNotifications();

      // Remove event listeners
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", this.handleResize);
      }

      if (this.container && this.container.parentNode) {
        this.container.parentNode.removeChild(this.container);
      }
    } finally {
      this.notifications.clear();
      this.container = null;
    }
  }

  // Restituisce stato corrente del container
  getStatus() {
    const allNotifications = this.getNotifications();
    const visibleNotifications = this.getVisibleNotifications();

    return {
      totalNotifications: allNotifications.length,
      visibleNotifications: visibleNotifications.length,
      hiddenNotifications:
        allNotifications.length - visibleNotifications.length,
      position: this.options.position,
      maxVisible: this.options.maxVisible,
    };
  }

  // Metodi statici
  static createResponsive(options = {}) {
    return new NotificationContainer({
      enableResponsive: true,
      ...options,
    });
  }

  static createFixed(position, maxVisible = 5) {
    return new NotificationContainer({
      position,
      maxVisible,
      enableResponsive: false,
      customPosition: true,
    });
  }

  static isValidPosition(position) {
    const validPositions = [
      "top-right",
      "top-left",
      "top-center",
      "bottom-right",
      "bottom-left",
      "bottom-center",
    ];
    return validPositions.includes(position);
  }

  static getSupportedPositions() {
    return [
      "top-right",
      "top-left",
      "top-center",
      "bottom-right",
      "bottom-left",
      "bottom-center",
    ];
  }
}
