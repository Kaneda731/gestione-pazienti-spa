/**
 * NotificationProgressBar - Gestione progress bar animate per notifiche
 * Implementa animazioni fluide usando requestAnimationFrame con best practices
 * Basato su: https://javascript.info/js-animation
 */

class NotificationProgressBar {
  constructor(element, duration = 4000, type = "success") {
    this.element = element;
    this.duration = duration;
    this.type = type;
    this.startTime = null;
    this.animationId = null;
    this.isPaused = false;
    this.pausedTime = 0;
    this.isDestroyed = false;

    // Timing function per animazione smooth (easing)
    this.timing = this.createEasingFunction("linear");

    this.init();
  }

  /**
   * Crea funzioni di easing per animazioni smooth
   * Basato su documentazione JavaScript.info
   */
  createEasingFunction(type = "linear") {
    const easingFunctions = {
      linear: (timeFraction) => timeFraction,
      easeOut: (timeFraction) => 1 - Math.pow(1 - timeFraction, 3),
      easeIn: (timeFraction) => Math.pow(timeFraction, 3),
      easeInOut: (timeFraction) => {
        if (timeFraction < 0.5) {
          return 4 * timeFraction * timeFraction * timeFraction;
        } else {
          return 1 - Math.pow(-2 * timeFraction + 2, 3) / 2;
        }
      },
    };

    return easingFunctions[type] || easingFunctions.linear;
  }

  init() {
    if (this.isDestroyed) return;

    // Find existing placeholder
    const placeholder = this.element.querySelector(
      ".notification__progress--js-placeholder"
    );

    if (placeholder) {
      // Replace placeholder with JavaScript progress bar
      this.replaceProgressBarPlaceholder(placeholder);
    } else {
      // Create progress bar if it doesn't exist
      if (!this.element.querySelector(".notification__progress")) {
        this.createProgressBar();
      }
    }

    this.progressBar = this.element.querySelector(".notification__progress");
    this.progressFill = this.element.querySelector(
      ".notification__progress-fill"
    );

    if (this.progressBar && this.progressFill) {
      this.start();
    }
  }

  replaceProgressBarPlaceholder(placeholder) {
    // Usa le stesse variabili CSS delle notifiche
    const colors = {
      success: "var(--notification-success-bg)",
      error: "var(--notification-error-bg)",
      warning: "var(--notification-warning-bg)",
      info: "var(--notification-info-bg)",
    };

    // Remove placeholder classes and add JavaScript classes
    placeholder.classList.remove("notification__progress--js-placeholder");
    placeholder.classList.add("notification__progress--js-controlled");

    // Aggiorna attributi
    placeholder.setAttribute("aria-valuenow", "100");

    // Applica stili per la progress bar JavaScript con colori armonizzati
    const backgroundColors = {
      success: "rgba(16, 185, 129, 0.2)",
      error: "rgba(239, 68, 68, 0.2)", 
      warning: "rgba(245, 158, 11, 0.2)",
      info: "rgba(6, 182, 212, 0.2)"
    };
    
    placeholder.style.cssText = `
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: ${backgroundColors[this.type] || backgroundColors.info};
            border-radius: 0 0 8px 8px;
            overflow: hidden;
            opacity: 1;
            z-index: 10;
            will-change: transform;
        `;

    // Crea il fill element
    const progressFill = document.createElement("div");
    progressFill.className = "notification__progress-fill";
    // Colori più eleganti e armonizzati per il fill
    const fillColors = {
      success: "linear-gradient(90deg, #10b981, #34d399)",
      error: "linear-gradient(90deg, #ef4444, #f87171)",
      warning: "linear-gradient(90deg, #f59e0b, #fbbf24)", 
      info: "linear-gradient(90deg, #06b6d4, #22d3ee)"
    };
    
    progressFill.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            width: 100%;
            background: ${fillColors[this.type] || fillColors.info};
            opacity: 0.9;
            transform-origin: left;
            transform: scaleX(1);
            transition: none;
            will-change: transform;
            box-shadow: 0 0 8px rgba(0, 0, 0, 0.1);
        `;

    // Clear placeholder and add fill
    placeholder.innerHTML = "";
    placeholder.appendChild(progressFill);
  }

  createProgressBar() {
    // Colori armonizzati per background
    const backgroundColors = {
      success: "rgba(16, 185, 129, 0.2)",
      error: "rgba(239, 68, 68, 0.2)", 
      warning: "rgba(245, 158, 11, 0.2)",
      info: "rgba(6, 182, 212, 0.2)"
    };
    
    // Colori eleganti per il fill
    const fillColors = {
      success: "linear-gradient(90deg, #10b981, #34d399)",
      error: "linear-gradient(90deg, #ef4444, #f87171)",
      warning: "linear-gradient(90deg, #f59e0b, #fbbf24)", 
      info: "linear-gradient(90deg, #06b6d4, #22d3ee)"
    };

    const progressBar = document.createElement("div");
    progressBar.className =
      "notification__progress notification__progress--js-controlled";
    progressBar.setAttribute("role", "progressbar");
    progressBar.setAttribute(
      "aria-label",
      "Tempo rimanente prima della chiusura automatica"
    );
    progressBar.setAttribute("aria-valuemin", "0");
    progressBar.setAttribute("aria-valuemax", "100");
    progressBar.setAttribute("aria-valuenow", "100");

    progressBar.style.cssText = `
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: ${backgroundColors[this.type] || backgroundColors.info};
            border-radius: 0 0 8px 8px;
            overflow: hidden;
            opacity: 1;
            z-index: 10;
            will-change: transform;
        `;

    const progressFill = document.createElement("div");
    progressFill.className = "notification__progress-fill";
    progressFill.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            width: 100%;
            background: ${fillColors[this.type] || fillColors.info};
            opacity: 0.9;
            transform-origin: left;
            transform: scaleX(1);
            transition: none;
            will-change: transform;
            box-shadow: 0 0 8px rgba(0, 0, 0, 0.1);
        `;

    progressBar.appendChild(progressFill);
    this.element.appendChild(progressBar);
  }

  /**
   * Avvia l'animazione usando la struttura consigliata da JavaScript.info
   */
  start() {
    if (this.isDestroyed) return;

    this.startTime = performance.now();
    this.lastLoggedProgress = -1;

    this.animate({
      timing: this.timing,
      draw: (progress) => this.draw(progress),
      duration: this.duration,
    });
  }

  /**
   * Funzione di animazione strutturata basata su JavaScript.info
   * https://javascript.info/js-animation#structured-animation
   */
  animate({ timing, draw, duration }) {
    if (this.isDestroyed) return;

    const start = this.startTime;

    const animateFrame = (time) => {
      if (this.isDestroyed) return;

      if (this.isPaused) {
        // Se in pausa, riprendi più tardi
        this.animationId = requestAnimationFrame(animateFrame);
        return;
      }

      // Calculate elapsed time fraction (0 to 1)
      let timeFraction = (time - start - this.pausedTime) / duration;
      if (timeFraction > 1) timeFraction = 1;
      if (timeFraction < 0) timeFraction = 0;

      // Calcola progresso dell'animazione usando timing function
      let progress = timing(timeFraction);

      // Disegna l'animazione
      draw(progress);

      // Aggiorna attributi accessibilità
      this.updateAccessibility(timeFraction);

      // Continua animazione se non completata
      if (timeFraction < 1) {
        this.animationId = requestAnimationFrame(animateFrame);
      } else {
        this.onComplete();
      }
    };

    this.animationId = requestAnimationFrame(animateFrame);
  }

  /**
   * Funzione di disegno per la progress bar
   * progress va da 1 (inizio) a 0 (fine) per countdown
   */
  draw(progress) {
    if (this.isDestroyed || !this.progressFill) return;

    // Inverti il progresso per countdown (da 1 a 0)
    const countdownProgress = 1 - progress;




    // Applica transform con GPU acceleration
    this.progressFill.style.transform = `scaleX(${countdownProgress})`;
  }

  /**
   * Aggiorna attributi per accessibilità
   */
  updateAccessibility(timeFraction) {
    if (this.progressBar) {
      const percentage = Math.round((1 - timeFraction) * 100);
      this.progressBar.setAttribute("aria-valuenow", percentage.toString());
    }
  }

  pause() {
    if (!this.isPaused && !this.isDestroyed) {
      this.isPaused = true;
      this.pauseStartTime = performance.now();
    }
  }

  resume() {
    if (this.isPaused && !this.isDestroyed) {
      this.isPaused = false;

      // Accumulate pause time
      if (this.pauseStartTime) {
        this.pausedTime += performance.now() - this.pauseStartTime;
        this.pauseStartTime = null;
      }
    }
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    if (this.progressFill && !this.isDestroyed) {
      this.progressFill.style.transform = "scaleX(0)";
    }
  }

  onComplete() {
    if (this.isDestroyed) return;

    // Dispatch evento personalizzato per notificare il completamento
    const event = new CustomEvent("progressComplete", {
      detail: {
        element: this.element,
        type: this.type,
        duration: this.duration,
      },
    });
    this.element.dispatchEvent(event);
  }

  destroy() {
    this.isDestroyed = true;
    this.stop();

    if (this.progressBar && this.progressBar.parentNode) {
      this.progressBar.parentNode.removeChild(this.progressBar);
    }

    // Cleanup references
    this.element = null;
    this.progressBar = null;
    this.progressFill = null;
  }
}

// Factory function per creare progress bar
export function createProgressBar(notificationElement, duration, type) {
  return new NotificationProgressBar(notificationElement, duration, type);
}

