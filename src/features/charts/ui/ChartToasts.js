/**
 * Gestione dei toast per i grafici
 */
class ChartToasts {
  /**
   * Inizializza il gestore dei toast
   */
  constructor() {
    this._ensureStylesLoaded();
    this.activeToasts = [];
  }

  /**
   * Styles are now included through SCSS compilation
   * No need to load CSS file separately
   * @private
   */
  _ensureStylesLoaded() {
    // Styles are now included in the main SCSS compilation
    // This method is kept for backward compatibility but no longer loads external CSS
  }

  /**
   * Mostra un toast
   * @param {string} message - Il messaggio da mostrare
   * @param {string} type - Il tipo di toast ('success', 'error', 'info', 'warning')
   * @param {string} device - Il tipo di dispositivo ('mobile', 'tablet', 'desktop')
   * @param {number} duration - La durata in millisecondi (default: 3000)
   * @returns {HTMLElement} - L'elemento toast creato
   */
  showToast(message, type = "info", device = "desktop", duration = 3000) {
    // Rimuovi toast esistenti dello stesso tipo
    this._removeExistingToasts(type);

    // Crea il toast
    const toast = document.createElement("div");
    const toastId = `chart-toast-${Date.now()}`;
    toast.id = toastId;
    toast.className = `chart-toast ${type} ${device}-chart-toast`;
    toast.setAttribute("role", "alert");
    toast.setAttribute("aria-live", "assertive");
    toast.textContent = message;

    // Aggiungi il toast al DOM
    document.body.appendChild(toast);

    // Tieni traccia del toast attivo
    this.activeToasts.push({
      id: toastId,
      element: toast,
      type: type,
      timer: null,
    });

    // Imposta il timer per la rimozione automatica
    const timer = setTimeout(() => {
      this._removeToast(toastId);
    }, duration);

    // Aggiorna il timer nell'array dei toast attivi
    const toastIndex = this.activeToasts.findIndex((t) => t.id === toastId);
    if (toastIndex !== -1) {
      this.activeToasts[toastIndex].timer = timer;
    }

    // Aggiungi event listener per la rimozione al click
    toast.addEventListener("click", () => {
      this._removeToast(toastId);
    });

    return toast;
  }

  /**
   * Mostra un toast di successo
   * @param {string} message - Il messaggio da mostrare
   * @param {string} device - Il tipo di dispositivo
   * @param {number} duration - La durata in millisecondi
   * @returns {HTMLElement} - L'elemento toast creato
   */
  showSuccessToast(message, device = "desktop", duration = 3000) {
    return this.showToast(message, "success", device, duration);
  }

  /**
   * Mostra un toast di errore
   * @param {string} message - Il messaggio da mostrare
   * @param {string} device - Il tipo di dispositivo
   * @param {number} duration - La durata in millisecondi
   * @returns {HTMLElement} - L'elemento toast creato
   */
  showErrorToast(message, device = "desktop", duration = 4000) {
    return this.showToast(message, "error", device, duration);
  }

  /**
   * Mostra un toast informativo
   * @param {string} message - Il messaggio da mostrare
   * @param {string} device - Il tipo di dispositivo
   * @param {number} duration - La durata in millisecondi
   * @returns {HTMLElement} - L'elemento toast creato
   */
  showInfoToast(message, device = "desktop", duration = 3000) {
    return this.showToast(message, "info", device, duration);
  }

  /**
   * Mostra un toast di avviso
   * @param {string} message - Il messaggio da mostrare
   * @param {string} device - Il tipo di dispositivo
   * @param {number} duration - La durata in millisecondi
   * @returns {HTMLElement} - L'elemento toast creato
   */
  showWarningToast(message, device = "desktop", duration = 4000) {
    return this.showToast(message, "warning", device, duration);
  }

  /**
   * Rimuove un toast specifico
   * @param {string} toastId - L'ID del toast da rimuovere
   * @private
   */
  _removeToast(toastId) {
    const toastIndex = this.activeToasts.findIndex((t) => t.id === toastId);
    if (toastIndex !== -1) {
      const toast = this.activeToasts[toastIndex];

      // Cancella il timer se esiste
      if (toast.timer) {
        clearTimeout(toast.timer);
      }

      // Anima la rimozione
      toast.element.style.animation = "toastFadeOut 0.3s ease-in forwards";

      // Rimuovi l'elemento dopo l'animazione
      setTimeout(() => {
        if (toast.element.parentNode) {
          toast.element.remove();
        }

        // Rimuovi dall'array dei toast attivi
        this.activeToasts.splice(toastIndex, 1);
      }, 300);
    }
  }

  /**
   * Rimuove i toast esistenti dello stesso tipo
   * @param {string} type - Il tipo di toast
   * @private
   */
  _removeExistingToasts(type) {
    const toastsToRemove = this.activeToasts.filter((t) => t.type === type);

    toastsToRemove.forEach((toast) => {
      this._removeToast(toast.id);
    });
  }

  /**
   * Rimuove tutti i toast attivi
   */
  removeAllToasts() {
    [...this.activeToasts].forEach((toast) => {
      this._removeToast(toast.id);
    });
  }
}

export default ChartToasts;
