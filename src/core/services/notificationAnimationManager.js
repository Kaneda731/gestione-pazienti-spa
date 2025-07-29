// src/core/services/notificationAnimationManager.js

/**
 * Gestione ottimizzata delle animazioni per notifiche
 * Utilizza GPU acceleration e requestAnimationFrame per 60fps
 */

export class NotificationAnimationManager {
  constructor() {
    this.activeAnimations = new Map(); // Map<element, AnimationData>
    this.animationQueue = [];
    this.isProcessing = false;
    this.rafId = null;
    this.performanceMonitor = {
      frameCount: 0,
      lastFrameTime: 0,
      averageFPS: 60,
      droppedFrames: 0,
    };

    // Rileva supporto per animazioni moderne
    this.supportsWebAnimations = "animate" in document.createElement("div");
    this.supportsWillChange =
      typeof CSS !== "undefined" &&
      CSS.supports &&
      CSS.supports("will-change", "transform");
    this.prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    this.init();
  }

  init() {
    // Monitora preferenze riduzione movimento
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    mediaQuery.addEventListener("change", (e) => {
      this.prefersReducedMotion = e.matches;
      if (e.matches) {
        this.disableAllAnimations();
      }
    });

    // Monitora performance
    this.startPerformanceMonitoring();
  }

  /**
   * Anima entrata notifica con GPU acceleration
   */
  animateEntrance(element, options = {}) {
    if (!element || this.prefersReducedMotion) {
      this.applyFinalState(element, "visible");
      return Promise.resolve();
    }

    const config = {
      duration: 300,
      easing: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      direction: options.direction || "right",
      ...options,
    };

    // Prepara elemento per animazione GPU-accelerated
    this.prepareForAnimation(element);

    if (this.supportsWebAnimations) {
      return this.animateWithWebAPI(element, "entrance", config);
    } else {
      return this.animateWithCSS(element, "entrance", config);
    }
  }

  /**
   * Anima uscita notifica
   */
  animateExit(element, options = {}) {
    if (!element) return Promise.resolve();

    if (this.prefersReducedMotion) {
      element.style.opacity = "0";
      return Promise.resolve();
    }

    const config = {
      duration: 300,
      easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      direction: options.direction || "right",
      ...options,
    };

    this.prepareForAnimation(element);

    if (this.supportsWebAnimations) {
      return this.animateWithWebAPI(element, "exit", config);
    } else {
      return this.animateWithCSS(element, "exit", config);
    }
  }

  /**
   * Anima spostamento nello stack
   */
  animateStackShift(element, fromY, toY, options = {}) {
    if (!element || this.prefersReducedMotion || fromY === toY) {
      element.style.transform = `translateY(${toY}px)`;
      return Promise.resolve();
    }

    const config = {
      duration: 200,
      easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      ...options,
    };

    this.prepareForAnimation(element);

    const keyframes = [
      { transform: `translateY(${fromY}px)` },
      { transform: `translateY(${toY}px)` },
    ];

    if (this.supportsWebAnimations) {
      return element.animate(keyframes, {
        duration: config.duration,
        easing: config.easing,
        fill: "forwards",
      }).finished;
    } else {
      return this.animateWithRAF(element, keyframes, config);
    }
  }

  /**
   * Prepara elemento per animazione GPU-accelerated
   */
  prepareForAnimation(element) {
    if (!element) return;

    // Forza layer compositing per GPU acceleration
    if (this.supportsWillChange) {
      element.style.willChange = "transform, opacity";
    } else {
      // Fallback per browser più vecchi
      element.style.transform = element.style.transform || "translateZ(0)";
    }

    // Ottimizza rendering
    element.style.backfaceVisibility = "hidden";
    element.style.perspective = "1000px";
  }

  /**
   * Cleanup dopo animazione
   */
  cleanupAfterAnimation(element) {
    if (!element) return;

    // Rimuovi ottimizzazioni GPU
    if (this.supportsWillChange) {
      element.style.willChange = "auto";
    }

    // Mantieni solo transform necessari
    const currentTransform = element.style.transform;
    if (currentTransform && !currentTransform.includes("translate")) {
      element.style.transform = "";
    }

    // Cleanup tracking
    this.activeAnimations.delete(element);
  }

  /**
   * Animazione con Web Animations API
   */
  animateWithWebAPI(element, type, config) {
    const keyframes = this.getKeyframes(type, config);

    const animation = element.animate(keyframes, {
      duration: config.duration,
      easing: config.easing,
      fill: "forwards",
    });

    // Traccia animazione
    this.activeAnimations.set(element, {
      animation,
      type,
      startTime: performance.now(),
    });

    // Cleanup automatico
    animation.addEventListener("finish", () => {
      this.cleanupAfterAnimation(element);
      if (type === "entrance") {
        this.applyFinalState(element, "visible");
      }
    });

    animation.addEventListener("cancel", () => {
      this.cleanupAfterAnimation(element);
    });

    return animation.finished;
  }

  /**
   * Animazione con CSS + monitoring
   */
  animateWithCSS(element, type, config) {
    return new Promise((resolve) => {
      const className = `notification--${
        type === "entrance" ? "entering" : "exiting"
      }`;

      // Applica classe animazione
      element.classList.add(className);

      // Traccia animazione
      this.activeAnimations.set(element, {
        type,
        startTime: performance.now(),
        className,
      });

      // Listener per fine animazione
      const handleAnimationEnd = (event) => {
        if (event.target === element) {
          element.removeEventListener("animationend", handleAnimationEnd);
          element.removeEventListener("animationcancel", handleAnimationEnd);

          element.classList.remove(className);
          this.cleanupAfterAnimation(element);

          if (type === "entrance") {
            this.applyFinalState(element, "visible");
          }

          resolve();
        }
      };

      element.addEventListener("animationend", handleAnimationEnd);
      element.addEventListener("animationcancel", handleAnimationEnd);

      // Timeout di sicurezza
      setTimeout(() => {
        if (this.activeAnimations.has(element)) {
          handleAnimationEnd({ target: element });
        }
      }, config.duration + 100);
    });
  }

  /**
   * Animazione con requestAnimationFrame
   */
  animateWithRAF(element, keyframes, config) {
    return new Promise((resolve) => {
      const startTime = performance.now();
      const startValues = this.parseKeyframe(keyframes[0]);
      const endValues = this.parseKeyframe(keyframes[keyframes.length - 1]);

      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / config.duration, 1);

        // Applica easing
        const easedProgress = this.applyEasing(progress, config.easing);

        // Interpola valori
        this.interpolateAndApply(
          element,
          startValues,
          endValues,
          easedProgress
        );

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          this.cleanupAfterAnimation(element);
          resolve();
        }
      };

      // Traccia animazione
      this.activeAnimations.set(element, {
        type: "raf",
        startTime,
        rafId: requestAnimationFrame(animate),
      });
    });
  }

  /**
   * Genera keyframes per tipo animazione
   */
  getKeyframes(type, config) {
    const isMobile = window.innerWidth <= 767;

    switch (type) {
      case "entrance":
        if (isMobile) {
          return [
            { transform: "translateY(-100%)", opacity: 0 },
            { transform: "translateY(0)", opacity: 1 },
          ];
        } else {
          const direction = config.direction === "left" ? "-100%" : "100%";
          return [
            { transform: `translateX(${direction})`, opacity: 0 },
            { transform: "translateX(0)", opacity: 1 },
          ];
        }

      case "exit":
        if (isMobile) {
          return [
            { transform: "translateY(0)", opacity: 1 },
            { transform: "translateY(-100%)", opacity: 0 },
          ];
        } else {
          const direction = config.direction === "left" ? "-100%" : "100%";
          return [
            { transform: "translateX(0)", opacity: 1 },
            { transform: `translateX(${direction})`, opacity: 0 },
          ];
        }

      default:
        return [{ opacity: 0 }, { opacity: 1 }];
    }
  }

  /**
   * Applica stato finale senza animazione
   */
  applyFinalState(element, state) {
    if (!element) return;

    switch (state) {
      case "visible":
        element.style.opacity = "1";
        element.style.transform = "translateX(0) translateY(0)";
        element.classList.add("notification--visible");
        element.classList.remove(
          "notification--entering",
          "notification--exiting"
        );
        break;

      case "hidden":
        element.style.opacity = "0";
        element.classList.remove(
          "notification--visible",
          "notification--entering"
        );
        element.classList.add("notification--exiting");
        break;
    }
  }

  /**
   * Disabilita tutte le animazioni attive
   */
  disableAllAnimations() {
    for (const [element, animationData] of this.activeAnimations) {
      if (animationData.animation && animationData.animation.cancel) {
        animationData.animation.cancel();
      }

      if (animationData.rafId) {
        cancelAnimationFrame(animationData.rafId);
      }

      if (animationData.className) {
        element.classList.remove(animationData.className);
      }

      this.applyFinalState(element, "visible");
    }

    this.activeAnimations.clear();
  }

  /**
   * Cancella animazione specifica
   */
  cancelAnimation(element) {
    if (!this.activeAnimations.has(element)) return;

    const animationData = this.activeAnimations.get(element);

    if (animationData.animation && animationData.animation.cancel) {
      animationData.animation.cancel();
    }

    if (animationData.rafId) {
      cancelAnimationFrame(animationData.rafId);
    }

    if (animationData.className) {
      element.classList.remove(animationData.className);
    }

    this.cleanupAfterAnimation(element);
  }

  /**
   * Monitoring delle performance
   */
  startPerformanceMonitoring() {
    let lastTime = performance.now();

    const monitor = (currentTime) => {
      const delta = currentTime - lastTime;
      const fps = 1000 / delta;

      this.performanceMonitor.frameCount++;
      this.performanceMonitor.lastFrameTime = currentTime;

      // Calcola FPS medio
      if (this.performanceMonitor.frameCount % 60 === 0) {
        this.performanceMonitor.averageFPS =
          (this.performanceMonitor.averageFPS + fps) / 2;

        // Rileva frame droppati
        if (fps < 50) {
          this.performanceMonitor.droppedFrames++;
        }

        // Ottimizza se performance scarse
        if (this.performanceMonitor.averageFPS < 45) {
          this.optimizeForLowPerformance();
        }
      }

      lastTime = currentTime;
      this.rafId = requestAnimationFrame(monitor);
    };

    this.rafId = requestAnimationFrame(monitor);
  }

  /**
   * Ottimizzazioni per dispositivi con performance scarse
   */
  optimizeForLowPerformance() {
    console.warn("Low animation performance detected, applying optimizations");

    // Riduci durata animazioni
    this.defaultDuration = Math.max(this.defaultDuration * 0.7, 150);

    // Disabilita animazioni complesse
    this.complexAnimationsEnabled = false;

    // Usa solo animazioni essenziali
    this.essentialAnimationsOnly = true;
  }

  /**
   * Utility per parsing keyframes
   */
  parseKeyframe(keyframe) {
    const parsed = {};

    if (keyframe.transform) {
      const transformMatch = keyframe.transform.match(
        /translate[XY]?\(([^)]+)\)/
      );
      if (transformMatch) {
        parsed.transform = transformMatch[1];
      }
    }

    if (keyframe.opacity !== undefined) {
      parsed.opacity = parseFloat(keyframe.opacity);
    }

    return parsed;
  }

  /**
   * Applica easing function
   */
  applyEasing(progress, easing) {
    if (typeof easing === "string" && easing.startsWith("cubic-bezier")) {
      // Semplificazione per cubic-bezier
      return progress; // Fallback lineare
    }

    switch (easing) {
      case "ease-in":
        return progress * progress;
      case "ease-out":
        return 1 - Math.pow(1 - progress, 2);
      case "ease-in-out":
        return progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      default:
        return progress;
    }
  }

  /**
   * Interpola e applica valori
   */
  interpolateAndApply(element, startValues, endValues, progress) {
    if (startValues.opacity !== undefined && endValues.opacity !== undefined) {
      const opacity =
        startValues.opacity +
        (endValues.opacity - startValues.opacity) * progress;
      element.style.opacity = opacity;
    }

    if (startValues.transform && endValues.transform) {
      // Semplificazione per transform
      element.style.transform = endValues.transform;
    }
  }

  /**
   * Statistiche performance
   */
  getPerformanceStats() {
    return {
      ...this.performanceMonitor,
      activeAnimations: this.activeAnimations.size,
      supportsWebAnimations: this.supportsWebAnimations,
      supportsWillChange: this.supportsWillChange,
      prefersReducedMotion: this.prefersReducedMotion,
    };
  }

  /**
   * Cleanup completo
   */
  destroy() {
    this.disableAllAnimations();

    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }

    this.activeAnimations.clear();
  }
}

// Istanza singleton
export const notificationAnimationManager = new NotificationAnimationManager();
