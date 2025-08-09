/**
 * NotificationVirtualContainer - Container virtuale per gestione efficiente di molte notifiche
 * Implementa virtual scrolling per ottimizzare performance con molte notifiche simultanee
 */

export class NotificationVirtualContainer {
  constructor(options = {}) {
    this.options = {
      position: "top-right",
      maxVisible: 5,
      itemHeight: 80,
      bufferSize: 2,
      ...options,
    };

    this.notifications = [];
    this.visibleRange = { start: 0, end: 0 };
    this.scrollTop = 0;
    this.containerHeight = 0;

    this.init();
  }

  init() {
    this.createContainer();
    this.setupEventListeners();
    this.updateVisibleRange();
  }

  createContainer() {
    // Rimuovi container esistente se presente
    const existingContainer = document.getElementById("notification-container");
    if (existingContainer) {
      existingContainer.remove();
    }

    // Crea il container principale
    this.container = document.createElement("div");
    this.container.id = "notification-container";
    this.container.className = `notification-container notification-container--${this.options.position}`;
    this.container.setAttribute("role", "region");
    this.container.setAttribute("aria-label", "Notifiche");
    this.container.setAttribute("aria-live", "polite");
    this.container.setAttribute("data-position", this.options.position);

    // Imposta stili di posizionamento base
    this.container.style.cssText = `
            position: fixed;
            z-index: 1050;
            pointer-events: auto;
            display: flex;
            flex-direction: column;
            gap: 12px;
            max-height: 100vh;
            overflow: hidden;
        `;

    // Applica posizionamento specifico
    this.applyPositionStyles();

    // Crea il viewport per virtual scrolling
    this.viewport = document.createElement("div");
    this.viewport.className = "notification-viewport";
    this.viewport.style.cssText = `
            min-height: 100px;
            height: auto;
            overflow-y: auto;
            position: relative;
            flex: 1;
        `;

    // Crea il contenuto virtuale
    this.virtualContent = document.createElement("div");
    this.virtualContent.className = "notification-virtual-content";

    // Crea il container visibile
    this.visibleContainer = document.createElement("div");
    this.visibleContainer.className = "notification-visible-container";
    this.visibleContainer.style.cssText = `
            position: relative;
            width: 100%;
            min-height: 50px;
        `;

    this.virtualContent.appendChild(this.visibleContainer);
    this.viewport.appendChild(this.virtualContent);
    this.container.appendChild(this.viewport);

    // Aggiungi al DOM
    document.body.appendChild(this.container);
  }

  applyPositionStyles() {
    const position = this.options.position;
    const padding =
      window.innerWidth >= 992
        ? "2rem"
        : window.innerWidth >= 768
        ? "1.5rem"
        : "1rem";
    const width =
      window.innerWidth >= 992
        ? "400px"
        : window.innerWidth >= 768
        ? "380px"
        : "calc(100vw - 2rem)";

    // Reset all position styles
    this.container.style.top = "";
    this.container.style.bottom = "";
    this.container.style.left = "";
    this.container.style.right = "";
    this.container.style.transform = "";

    switch (position) {
      case "top-right":
        this.container.style.top = padding;
        this.container.style.right = padding;
        this.container.style.width = width;
        break;
      case "top-left":
        this.container.style.top = padding;
        this.container.style.left = padding;
        this.container.style.width = width;
        break;
      case "top-center":
        this.container.style.top = padding;
        this.container.style.left = "50%";
        this.container.style.transform = "translateX(-50%)";
        this.container.style.width = width;
        break;
      case "bottom-right":
        this.container.style.bottom = padding;
        this.container.style.right = padding;
        this.container.style.width = width;
        this.container.style.flexDirection = "column-reverse";
        break;
      case "bottom-left":
        this.container.style.bottom = padding;
        this.container.style.left = padding;
        this.container.style.width = width;
        this.container.style.flexDirection = "column-reverse";
        break;
      case "bottom-center":
        this.container.style.bottom = padding;
        this.container.style.left = "50%";
        this.container.style.transform = "translateX(-50%)";
        this.container.style.width = width;
        this.container.style.flexDirection = "column-reverse";
        break;
      default:
        // Default to top-right
        this.container.style.top = padding;
        this.container.style.right = padding;
        this.container.style.width = width;
    }
  }

  setupEventListeners() {
    // Gestione scroll per virtual scrolling
    this.viewport.addEventListener("scroll", this.handleScroll.bind(this));

    // Gestione resize per responsive
    window.addEventListener("resize", this.handleResize.bind(this));

    // Gestione keyboard per accessibilità
    this.container.addEventListener("keydown", this.handleKeydown.bind(this));
  }

  handleScroll(event) {
    this.scrollTop = event.target.scrollTop;
    this.updateVisibleRange();
    this.renderVisibleNotifications();
  }

  handleResize() {
    this.applyPositionStyles();
    this.updateContainerHeight();
    this.updateVisibleRange();
    this.renderVisibleNotifications();
  }

  handleKeydown(event) {
    switch (event.key) {
      case "Escape":
        this.closeTopNotification();
        break;
      case "ArrowUp":
        this.focusPreviousNotification();
        event.preventDefault();
        break;
      case "ArrowDown":
        this.focusNextNotification();
        event.preventDefault();
        break;
    }
  }

  updateContainerHeight() {
    const maxHeight = window.innerHeight * 0.8; // Max 80% dell'altezza viewport
    const calculatedHeight = Math.min(
      this.notifications.length * this.options.itemHeight,
      maxHeight
    );

    this.containerHeight = calculatedHeight;
    this.viewport.style.height = `${calculatedHeight}px`;
  }

  updateVisibleRange() {
    const startIndex = Math.floor(this.scrollTop / this.options.itemHeight);
    const endIndex = Math.min(
      startIndex +
        Math.ceil(this.containerHeight / this.options.itemHeight) +
        this.options.bufferSize,
      this.notifications.length
    );

    this.visibleRange = {
      start: Math.max(0, startIndex - this.options.bufferSize),
      end: endIndex,
    };
  }

  addNotification(notificationOrElement) {
    // Gestisci sia elementi DOM che oggetti notifica
    if (notificationOrElement instanceof HTMLElement) {
      // Se è un elemento DOM, aggiungilo direttamente al container visibile
      this.visibleContainer.appendChild(notificationOrElement);

      // Assicurati che sia visibile
      notificationOrElement.style.pointerEvents = "auto";

      // Aggiungi event listeners per il pulsante chiudi
      const closeButton = notificationOrElement.querySelector(
        ".notification__close"
      );
      if (closeButton) {
        closeButton.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();

          // Rimuovi dal DOM
          if (notificationOrElement.parentNode) {
            notificationOrElement.parentNode.removeChild(notificationOrElement);
          }

          // Rimuovi anche dallo stato se ha un ID
          const notificationId = notificationOrElement.getAttribute("data-id");
          if (notificationId && window.notificationService) {
            window.notificationService.removeNotification(notificationId);
          }
        });
      }

      // Avvia timer di auto-close se necessario
      const progressBar = notificationOrElement.querySelector(
        ".notification__progress"
      );
      const notificationId = notificationOrElement.getAttribute("data-id");

      if (
        progressBar &&
        !notificationOrElement.classList.contains("notification--persistent")
      ) {
        // Attiva la progress bar
        progressBar.classList.add("notification__progress--active");

        // Determina il tipo di notifica per il colore
        const notificationType = notificationOrElement.classList.contains(
          "notification--success"
        )
          ? "success"
          : notificationOrElement.classList.contains("notification--error")
          ? "error"
          : notificationOrElement.classList.contains("notification--warning")
          ? "warning"
          : "info";

        const colors = {
          success: "#28a745",
          error: "#dc3545",
          warning: "#ffc107",
          info: "#17a2b8",
        };

        // Forza stili inline per assicurare visibilità - usa posizione relativa
        progressBar.style.cssText = `
          position: relative !important;
          width: 100% !important;
          height: 4px !important;
          background: rgba(255, 255, 255, 0.2) !important;
          border-radius: 2px !important;
          overflow: hidden !important;
          opacity: 1 !important;
          margin-top: 8px !important;
          margin-bottom: -4px !important;
        `;

        // Aggiungi l'elemento di riempimento con animazione
        const progressFill = document.createElement("div");
        progressFill.style.cssText = `
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          width: 100%;
          background: ${colors[notificationType]} !important;
          opacity: 0.8;
          transform-origin: left;
          transform: scaleX(1);
          transition: transform 0.1s ease-out;
        `;

        progressBar.appendChild(progressFill);

        // Avvia animazione JavaScript come fallback
        let startTime = Date.now();
        const animateProgress = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.max(0, 1 - elapsed / 4000); // 4 secondi
          progressFill.style.transform = `scaleX(${progress})`;

          if (progress > 0 && notificationOrElement.parentNode) {
            requestAnimationFrame(animateProgress);
          }
        };

        // Avvia animazione
        requestAnimationFrame(animateProgress);

        // Determina durata dal CSS custom property o default
        const duration =
          parseInt(progressBar.style.getPropertyValue("--progress-duration")) ||
          4000;

        // Avvia timer di auto-close
        const autoCloseTimer = setTimeout(() => {
          if (notificationOrElement.parentNode) {
            // Animazione di uscita
            notificationOrElement.style.transition =
              "opacity 0.3s ease-out, transform 0.3s ease-out";
            notificationOrElement.style.opacity = "0";
            notificationOrElement.style.transform = "translateX(100%)";

            setTimeout(() => {
              if (notificationOrElement.parentNode) {
                notificationOrElement.parentNode.removeChild(
                  notificationOrElement
                );
              }

              // Rimuovi dallo stato
              if (notificationId && window.notificationService) {
                window.notificationService.removeNotification(notificationId);
              }
            }, 300);
          }
        }, duration);

        // Salva timer ID per poterlo cancellare
        notificationOrElement.setAttribute("data-timer-id", autoCloseTimer);
      }

      // Gestisci hover per pausare timer
      let isPaused = false;
      notificationOrElement.addEventListener("mouseenter", () => {
        if (progressBar) {
          progressBar.style.animationPlayState = "paused";
          isPaused = true;
        }

        // Pausa anche il timer
        const timerId = notificationOrElement.getAttribute("data-timer-id");
        if (timerId) {
          clearTimeout(parseInt(timerId));
        }
      });

      notificationOrElement.addEventListener("mouseleave", () => {
        if (progressBar && isPaused) {
          progressBar.style.animationPlayState = "running";
          isPaused = false;
        }

        // Restart timer with remaining time (simplified - restart from beginning)
        if (
          !notificationOrElement.classList.contains("notification--persistent")
        ) {
          const duration =
            parseInt(
              progressBar?.style.getPropertyValue("--progress-duration")
            ) || 4000;

          const newTimer = setTimeout(() => {
            if (notificationOrElement.parentNode) {
              notificationOrElement.style.transition =
                "opacity 0.3s ease-out, transform 0.3s ease-out";
              notificationOrElement.style.opacity = "0";
              notificationOrElement.style.transform = "translateX(100%)";

              setTimeout(() => {
                if (notificationOrElement.parentNode) {
                  notificationOrElement.parentNode.removeChild(
                    notificationOrElement
                  );
                }

                if (notificationId && window.notificationService) {
                  window.notificationService.removeNotification(notificationId);
                }
              }, 300);
            }
          }, duration);

          notificationOrElement.setAttribute("data-timer-id", newTimer);
        }
      });
      return;
    }

    // Se è un oggetto notifica, usa il sistema virtuale
    const notification = notificationOrElement;

    // Aggiungi all'inizio per LIFO (Last In, First Out)
    this.notifications.unshift(notification);

    // Limita il numero massimo di notifiche in memoria
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(0, 100);
    }

    this.updateVirtualHeight();
    this.updateVisibleRange();
    this.renderVisibleNotifications();

    // Scroll automatico per mostrare nuova notifica
    this.scrollToTop();
  }

  removeNotification(notificationId) {
    const index = this.notifications.findIndex((n) => n.id === notificationId);
    if (index !== -1) {
      this.notifications.splice(index, 1);
      this.updateVirtualHeight();
      this.updateVisibleRange();
      this.renderVisibleNotifications();
    }
  }

  updateVirtualHeight() {
    const totalHeight = this.notifications.length * this.options.itemHeight;
    this.virtualContent.style.height = `${totalHeight}px`;
    this.updateContainerHeight();
  }

  renderVisibleNotifications() {
    // Pulisci container visibile
    this.visibleContainer.innerHTML = "";

    // Posiziona il container visibile
    const offsetTop = this.visibleRange.start * this.options.itemHeight;
    this.visibleContainer.style.transform = `translateY(${offsetTop}px)`;

    // Renderizza solo le notifiche visibili
    for (let i = this.visibleRange.start; i < this.visibleRange.end; i++) {
      if (this.notifications[i]) {
        const notificationElement = this.createNotificationElement(
          this.notifications[i]
        );
        this.visibleContainer.appendChild(notificationElement);
      }
    }
  }

  createNotificationElement(notification) {
    const element = document.createElement("div");
    element.className = `notification notification--${notification.type}`;
    element.setAttribute(
      "role",
      notification.type === "error" ? "alert" : "status"
    );
    element.setAttribute("aria-atomic", "true");
    element.setAttribute("data-notification-id", notification.id);
    element.style.height = `${this.options.itemHeight}px`;

    element.innerHTML = `
            <div class="notification__content">
                <span class="notification__icon material-icons">${this.getIconForType(
                  notification.type
                )}</span>
                <div class="notification__body">
                    <div class="notification__message">${this.escapeHtml(
                      notification.message
                    )}</div>
                    ${
                      notification.timestamp
                        ? `<div class="notification__timestamp">${this.formatTimestamp(
                            notification.timestamp
                          )}</div>`
                        : ""
                    }
                </div>
            </div>
            <div class="notification__actions">
                <button class="notification__close" aria-label="Chiudi notifica" data-action="close">
                    <span class="material-icons">close</span>
                </button>
            </div>
        `;

    // Aggiungi event listeners
    const closeButton = element.querySelector('[data-action="close"]');
    closeButton.addEventListener("click", () => {
      this.removeNotification(notification.id);
    });

    return element;
  }

  getIconForType(type) {
    const icons = {
      success: "check_circle",
      error: "error",
      warning: "warning",
      info: "info",
    };
    return icons[type] || "info";
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  formatTimestamp(timestamp) {
    return new Date(timestamp).toLocaleTimeString("it-IT", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  scrollToTop() {
    this.viewport.scrollTop = 0;
    this.scrollTop = 0;
    this.updateVisibleRange();
  }

  closeTopNotification() {
    if (this.notifications.length > 0) {
      this.removeNotification(this.notifications[0].id);
    }
  }

  focusPreviousNotification() {
    const currentFocus = document.activeElement;
    const notifications =
      this.visibleContainer.querySelectorAll(".notification");
    const currentIndex = Array.from(notifications).indexOf(
      currentFocus.closest(".notification")
    );

    if (currentIndex > 0) {
      notifications[currentIndex - 1]
        .querySelector(".notification__close")
        .focus();
    }
  }

  focusNextNotification() {
    const currentFocus = document.activeElement;
    const notifications =
      this.visibleContainer.querySelectorAll(".notification");
    const currentIndex = Array.from(notifications).indexOf(
      currentFocus.closest(".notification")
    );

    if (currentIndex < notifications.length - 1) {
      notifications[currentIndex + 1]
        .querySelector(".notification__close")
        .focus();
    }
  }

  clear() {
    this.notifications = [];
    this.visibleContainer.innerHTML = ""; // Pulisci anche elementi DOM diretti
    this.updateVirtualHeight();
    this.renderVisibleNotifications();
  }

  getNotifications() {
    return [...this.notifications];
  }

  getVisibleNotifications() {
    return this.notifications.slice(
      this.visibleRange.start,
      this.visibleRange.end
    );
  }

  destroy() {
    // Rimuovi event listeners
    this.viewport.removeEventListener("scroll", this.handleScroll.bind(this));
    window.removeEventListener("resize", this.handleResize.bind(this));
    this.container.removeEventListener(
      "keydown",
      this.handleKeydown.bind(this)
    );

    // Rimuovi dal DOM
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }

    // Pulisci riferimenti
    this.notifications = [];
    this.container = null;
    this.viewport = null;
    this.virtualContent = null;
    this.visibleContainer = null;
  }
}

export default NotificationVirtualContainer;
