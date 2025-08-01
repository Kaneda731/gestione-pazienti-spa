/**
 * NotificationComponent - Componente singola notifica con accessibilità completa
 * Gestisce rendering, interazioni, animazioni e supporto screen reader
 */

// Configurazioni per tipi di notifica
const NOTIFICATION_TYPES = {
    SUCCESS: {
        type: 'success',
        icon: 'check_circle',
        color: 'var(--success-color)',
        defaultDuration: 4000,
        ariaRole: 'status',
        ariaLive: 'polite'
    },
    ERROR: {
        type: 'error',
        icon: 'error',
        color: 'var(--danger-color)',
        defaultDuration: 0, // Persistente
        ariaRole: 'alert',
        ariaLive: 'assertive'
    },
    WARNING: {
        type: 'warning',
        icon: 'warning',
        color: 'var(--warning-color)',
        defaultDuration: 6000,
        ariaRole: 'alert',
        ariaLive: 'assertive'
    },
    INFO: {
        type: 'info',
        icon: 'info',
        color: 'var(--info-color)',
        defaultDuration: 5000,
        ariaRole: 'status',
        ariaLive: 'polite'
    }
};

// Configurazione keyboard navigation
const KEYBOARD_KEYS = {
    ESCAPE: 'Escape',
    ENTER: 'Enter',
    SPACE: ' ',
    TAB: 'Tab',
    ARROW_UP: 'ArrowUp',
    ARROW_DOWN: 'ArrowDown',
    ARROW_LEFT: 'ArrowLeft',
    ARROW_RIGHT: 'ArrowRight',
    HOME: 'Home',
    END: 'End'
};

export class NotificationComponent {
    constructor(data, options = {}) {
        this.id = data.id || this.generateId();
        this.type = data.type || 'info';
        this.message = data.message || '';
        this.title = data.title || '';
        this.timestamp = data.timestamp || new Date();
        
        this.options = {
            duration: data.duration,
            persistent: data.persistent || false,
            closable: data.closable !== false,
            actions: data.actions || [],
            priority: data.priority || 0,
            enableProgressBar: data.enableProgressBar !== false,
            enableAnimations: data.enableAnimations !== false,
            enableKeyboardNavigation: data.enableKeyboardNavigation !== false,
            enableScreenReader: data.enableScreenReader !== false,
            ...options
        };

        // Stato interno
        this.element = null;
        this.progressElement = null;
        this.closeButton = null;
        this.actionButtons = [];
        this.timer = null;
        this.progressTimer = null;
        this.isVisible = false;
        this.isRemoving = false;
        this.isPaused = false;
        this.focusableElements = [];
        this.currentFocusIndex = -1;

        // Bind methods
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleFocusIn = this.handleFocusIn.bind(this);
        this.handleFocusOut = this.handleFocusOut.bind(this);
        this.handleMouseEnter = this.handleMouseEnter.bind(this);
        this.handleMouseLeave = this.handleMouseLeave.bind(this);
        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleTouchMove = this.handleTouchMove.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);
        this.handleTouchCancel = this.handleTouchCancel.bind(this);
        this.close = this.close.bind(this);

        // Touch gesture state
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchCurrentX = 0;
        this.touchCurrentY = 0;
        this.touchStartTime = 0;
        this.isSwiping = false;
        this.isLongPress = false;
        this.longPressTimer = null;
        this.touchFeedbackTimer = null;
        this.swipeThreshold = 80; // Soglia per swipe in px
        this.longPressDelay = 500; // Delay per long press in ms

        this.init();
    }

    /**
     * Inizializza il componente
     */
    init() {
        this.createElement();
        this.setupAccessibility();
        this.setupEventListeners();
        this.setupAutoClose();
        this.announceToScreenReader();
        
        // Ottimizza touch targets dopo che l'elemento è stato creato
        setTimeout(() => {
            this.optimizeTouchTargets();
        }, 0);
    }

    /**
     * Genera ID univoco per la notifica
     */
    generateId() {
        return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Crea l'elemento DOM della notifica
     */
    createElement() {
        const typeConfig = NOTIFICATION_TYPES[this.type.toUpperCase()] || NOTIFICATION_TYPES.INFO;
        
        // Container principale
        this.element = document.createElement('div');
        this.element.className = `notification notification--${this.type}`;
        this.element.setAttribute('data-id', this.id);
        this.element.setAttribute('data-type', this.type);
        this.element.setAttribute('data-timestamp', this.timestamp.toISOString());
        
        // Struttura HTML semantica
        this.element.innerHTML = this.createNotificationHTML(typeConfig);
        
        // Riferimenti agli elementi
        this.closeButton = this.element.querySelector('.notification__close');
        this.progressElement = this.element.querySelector('.notification__progress');
        this.actionButtons = Array.from(this.element.querySelectorAll('.notification__action-btn'));
        
        // Aggiorna elementi focusabili
        this.updateFocusableElements();
    }

    /**
     * Crea HTML della notifica
     */
    createNotificationHTML(typeConfig) {
        const hasTitle = this.title && this.title.trim();
        const hasActions = this.options.actions && this.options.actions.length > 0;
        const showProgressBar = this.options.enableProgressBar && !this.options.persistent && this.getDuration() > 0;
        
        return `
            <div class="notification__content">
                <span class="notification__icon material-icons" aria-hidden="true">${typeConfig.icon}</span>
                <div class="notification__body">
                    ${hasTitle ? `<div class="notification__title">${this.escapeHtml(this.title)}</div>` : ''}
                    <div class="notification__message">${this.escapeHtml(this.message)}</div>
                </div>
            </div>
            <div class="notification__actions">
                ${hasActions ? this.createActionButtons() : ''}
                ${this.options.closable ? this.createCloseButton() : ''}
            </div>
            ${showProgressBar ? '<div class="notification__progress" aria-hidden="true"></div>' : ''}
            <div class="notification__sr-only" aria-live="${typeConfig.ariaLive}" aria-atomic="true">
                ${this.createScreenReaderText()}
            </div>
        `;
    }

    /**
     * Crea pulsanti azione personalizzati
     */
    createActionButtons() {
        return this.options.actions.map((action, index) => {
            const style = action.style || 'secondary';
            return `
                <button class="notification__action-btn notification__action-btn--${style}" 
                        data-action-index="${index}"
                        type="button"
                        aria-describedby="${this.id}-message">
                    ${this.escapeHtml(action.label)}
                </button>
            `;
        }).join('');
    }

    /**
     * Crea pulsante di chiusura
     */
    createCloseButton() {
        return `
            <button class="notification__close" 
                    type="button"
                    aria-label="Chiudi notifica"
                    aria-describedby="${this.id}-message">
                <span class="material-icons" aria-hidden="true">close</span>
            </button>
        `;
    }

    /**
     * Crea testo per screen reader
     */
    createScreenReaderText() {
        const typeConfig = NOTIFICATION_TYPES[this.type.toUpperCase()] || NOTIFICATION_TYPES.INFO;
        const typeLabel = {
            success: 'Successo',
            error: 'Errore',
            warning: 'Attenzione',
            info: 'Informazione'
        }[this.type] || 'Notifica';

        const hasTitle = this.title && this.title.trim();
        const titleText = hasTitle ? `${this.title}. ` : '';
        const actionText = this.options.closable ? ' Premi Escape per chiudere.' : '';
        
        return `${typeLabel}: ${titleText}${this.message}${actionText}`;
    }

    /**
     * Configura accessibilità
     */
    setupAccessibility() {
        const typeConfig = NOTIFICATION_TYPES[this.type.toUpperCase()] || NOTIFICATION_TYPES.INFO;
        
        // Attributi ARIA principali
        this.element.setAttribute('role', typeConfig.ariaRole);
        this.element.setAttribute('aria-live', typeConfig.ariaLive);
        this.element.setAttribute('aria-atomic', 'true');
        this.element.setAttribute('aria-labelledby', `${this.id}-message`);
        
        // Tabindex per navigazione keyboard
        if (this.options.enableKeyboardNavigation) {
            this.element.setAttribute('tabindex', '0');
        }

        // ID per il messaggio
        const messageElement = this.element.querySelector('.notification__message');
        if (messageElement) {
            messageElement.id = `${this.id}-message`;
        }

        // Attributi per progress bar
        if (this.progressElement) {
            this.progressElement.setAttribute('role', 'progressbar');
            this.progressElement.setAttribute('aria-hidden', 'true');
        }

        // Supporto high contrast
        this.element.setAttribute('data-high-contrast', 'true');
    }

    /**
     * Configura event listeners
     */
    setupEventListeners() {
        // Keyboard navigation
        if (this.options.enableKeyboardNavigation) {
            this.element.addEventListener('keydown', this.handleKeyDown);
            this.element.addEventListener('focusin', this.handleFocusIn);
            this.element.addEventListener('focusout', this.handleFocusOut);
        }

        // Mouse events per pausa timer
        this.element.addEventListener('mouseenter', this.handleMouseEnter);
        this.element.addEventListener('mouseleave', this.handleMouseLeave);

        // Touch events per mobile gestures - sempre attivi per supporto dinamico
        this.element.addEventListener('touchstart', this.handleTouchStart, { passive: false });
        this.element.addEventListener('touchmove', this.handleTouchMove, { passive: false });
        this.element.addEventListener('touchend', this.handleTouchEnd, { passive: false });
        this.element.addEventListener('touchcancel', this.handleTouchCancel, { passive: false });

        // Pulsante chiusura
        if (this.closeButton) {
            this.closeButton.addEventListener('click', this.close);
        }

        // Pulsanti azione
        this.actionButtons.forEach((button, index) => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleActionClick(index);
            });
        });

        // Gestione animazioni
        if (this.options.enableAnimations) {
            this.element.addEventListener('animationend', (e) => {
                this.handleAnimationEnd(e);
            });
        }
    }

    /**
     * Configura auto-close timer
     */
    setupAutoClose() {
        const duration = this.getDuration();
        
        if (duration > 0 && !this.options.persistent) {
            this.startAutoCloseTimer(duration);
            
            if (this.options.enableProgressBar && this.progressElement) {
                this.startProgressBar(duration);
            }
        }
    }

    /**
     * Ottiene durata per auto-close
     */
    getDuration() {
        if (this.options.duration !== undefined) {
            return this.options.duration;
        }
        
        const typeConfig = NOTIFICATION_TYPES[this.type.toUpperCase()] || NOTIFICATION_TYPES.INFO;
        return typeConfig.defaultDuration;
    }

    /**
     * Avvia timer per auto-close
     */
    startAutoCloseTimer(duration) {
        this.clearAutoCloseTimer();
        
        this.timer = setTimeout(() => {
            if (!this.isRemoving) {
                this.close();
            }
        }, duration);
    }

    /**
     * Ferma timer auto-close
     */
    clearAutoCloseTimer() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }

    /**
     * Avvia progress bar animata
     */
    startProgressBar(duration) {
        if (!this.progressElement) return;
        
        // Imposta durata dell'animazione
        this.progressElement.style.setProperty('--progress-duration', `${duration}ms`);
        
        // Attiva progress bar con animazione
        this.progressElement.classList.add('notification__progress--active');
        
        // Gestisce fine animazione progress bar
        this.progressElement.addEventListener('animationend', (e) => {
            if (e.animationName === 'progressCountdown') {
                this.progressElement.classList.remove('notification__progress--active');
            }
        }, { once: true });
    }

    /**
     * Pausa progress bar
     */
    pauseProgressBar() {
        if (this.progressElement) {
            this.progressElement.classList.add('notification__progress--paused');
            this.progressElement.classList.remove('notification__progress--resumed');
        }
    }

    /**
     * Riprende progress bar
     */
    resumeProgressBar() {
        if (this.progressElement) {
            this.progressElement.classList.remove('notification__progress--paused');
            this.progressElement.classList.add('notification__progress--resumed');
        }
    }

    /**
     * Ferma progress bar
     */
    stopProgressBar() {
        if (this.progressElement) {
            this.progressElement.classList.remove(
                'notification__progress--active',
                'notification__progress--paused',
                'notification__progress--resumed'
            );
        }
    }

    /**
     * Annuncia notifica a screen reader
     */
    announceToScreenReader() {
        if (!this.options.enableScreenReader) return;

        // Crea o usa live region esistente
        let announcer = document.getElementById('notification-announcer');
        if (!announcer) {
            announcer = document.createElement('div');
            announcer.id = 'notification-announcer';
            announcer.className = 'notification__sr-only';
            announcer.setAttribute('aria-live', 'polite');
            announcer.setAttribute('aria-atomic', 'true');
            document.body.appendChild(announcer);
        }

        // Annuncia con delay per permettere al DOM di aggiornarsi
        setTimeout(() => {
            announcer.textContent = this.createScreenReaderText();
        }, 100);
    }

    /**
     * Aggiorna elementi focusabili
     */
    updateFocusableElements() {
        const focusableSelectors = [
            'button:not([disabled])',
            '[href]',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            '[tabindex]:not([tabindex="-1"])'
        ];

        this.focusableElements = Array.from(
            this.element.querySelectorAll(focusableSelectors.join(', '))
        );

        // Aggiungi l'elemento principale se ha tabindex
        if (this.element.hasAttribute('tabindex') && this.element.getAttribute('tabindex') !== '-1') {
            this.focusableElements.unshift(this.element);
        }
    }

    /**
     * Gestisce navigazione da tastiera
     */
    handleKeyDown(e) {
        switch (e.key) {
            case KEYBOARD_KEYS.ESCAPE:
                e.preventDefault();
                if (this.options.closable) {
                    this.close();
                }
                break;

            case KEYBOARD_KEYS.ENTER:
            case KEYBOARD_KEYS.SPACE:
                if (e.target === this.element) {
                    e.preventDefault();
                    this.focusFirstFocusableElement();
                }
                break;

            case KEYBOARD_KEYS.TAB:
                this.handleTabNavigation(e);
                break;

            case KEYBOARD_KEYS.ARROW_UP:
            case KEYBOARD_KEYS.ARROW_DOWN:
                if (this.focusableElements.length > 1) {
                    e.preventDefault();
                    this.handleArrowNavigation(e.key === KEYBOARD_KEYS.ARROW_DOWN);
                }
                break;

            case KEYBOARD_KEYS.HOME:
                if (this.focusableElements.length > 0) {
                    e.preventDefault();
                    this.focusElement(0);
                }
                break;

            case KEYBOARD_KEYS.END:
                if (this.focusableElements.length > 0) {
                    e.preventDefault();
                    this.focusElement(this.focusableElements.length - 1);
                }
                break;
        }
    }

    /**
     * Gestisce navigazione con Tab
     */
    handleTabNavigation(e) {
        if (this.focusableElements.length <= 1) return;

        const currentIndex = this.focusableElements.indexOf(e.target);
        
        if (e.shiftKey) {
            // Shift+Tab - vai indietro
            if (currentIndex === 0) {
                e.preventDefault();
                this.focusElement(this.focusableElements.length - 1);
            }
        } else {
            // Tab - vai avanti
            if (currentIndex === this.focusableElements.length - 1) {
                e.preventDefault();
                this.focusElement(0);
            }
        }
    }

    /**
     * Gestisce navigazione con frecce
     */
    handleArrowNavigation(isDown) {
        const currentIndex = this.focusableElements.indexOf(document.activeElement);
        let nextIndex;

        if (currentIndex === -1) {
            // Se nessun elemento è focusato, inizia dal primo
            nextIndex = 0;
        } else if (isDown) {
            nextIndex = currentIndex < this.focusableElements.length - 1 ? currentIndex + 1 : 0;
        } else {
            nextIndex = currentIndex > 0 ? currentIndex - 1 : this.focusableElements.length - 1;
        }

        this.focusElement(nextIndex);
    }

    /**
     * Focalizza elemento per indice
     */
    focusElement(index) {
        if (index >= 0 && index < this.focusableElements.length) {
            this.focusableElements[index].focus();
            this.currentFocusIndex = index;
        }
    }

    /**
     * Focalizza primo elemento focusabile
     */
    focusFirstFocusableElement() {
        if (this.focusableElements.length > 0) {
            this.focusElement(0);
        }
    }

    /**
     * Gestisce focus in entrata
     */
    handleFocusIn(e) {
        this.element.classList.add('notification--focused');
        this.pauseAutoClose();
    }

    /**
     * Gestisce focus in uscita
     */
    handleFocusOut(e) {
        // Verifica se il focus è ancora dentro la notifica
        if (!this.element.contains(e.relatedTarget)) {
            this.element.classList.remove('notification--focused');
            this.resumeAutoClose();
        }
    }

    /**
     * Gestisce mouse enter
     */
    handleMouseEnter() {
        this.pauseAutoClose();
    }

    /**
     * Gestisce mouse leave
     */
    handleMouseLeave() {
        this.resumeAutoClose();
    }

    /**
     * Pausa auto-close
     */
    pauseAutoClose() {
        if (this.isPaused) return;
        
        this.isPaused = true;
        this.clearAutoCloseTimer();
        this.pauseProgressBar();
        
        this.dispatchEvent('paused');
    }

    /**
     * Riprende auto-close
     */
    resumeAutoClose() {
        if (!this.isPaused) return;
        
        this.isPaused = false;
        
        const duration = this.getDuration();
        if (duration > 0 && !this.options.persistent && !this.isRemoving) {
            // Calcola tempo rimanente basato su progress bar
            const remainingTime = this.calculateRemainingTime(duration);
            this.startAutoCloseTimer(remainingTime);
        }
        
        this.resumeProgressBar();
        this.dispatchEvent('resumed');
    }

    /**
     * Calcola tempo rimanente per auto-close
     */
    calculateRemainingTime(originalDuration) {
        if (!this.progressElement) return originalDuration;
        
        // Stima basata su CSS animation progress (approssimativa)
        const computedStyle = window.getComputedStyle(this.progressElement, '::after');
        const transform = computedStyle.transform;
        
        // Fallback al tempo originale se non riusciamo a calcolare
        return originalDuration * 0.5; // Stima conservativa
    }

    /**
     * Gestisce touch start per swipe gesture e feedback tattile
     */
    handleTouchStart(e) {
        if (e.touches.length !== 1) return;
        
        const touch = e.touches[0];
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
        this.touchCurrentX = touch.clientX;
        this.touchCurrentY = touch.clientY;
        this.touchStartTime = Date.now();
        this.isSwiping = false;
        this.isLongPress = false;
        
        // Pausa auto-close durante interazione touch
        this.pauseAutoClose();
        
        // Feedback visivo immediato per touch
        this.addTouchFeedback();
        
        // Avvia timer per long press
        this.startLongPressTimer();
        
        // Vibrazione tattile se supportata (solo su dispositivi mobili)
        this.provideTactileFeedback('light');
    }

    /**
     * Gestisce touch move per swipe gesture con feedback visivo migliorato
     */
    handleTouchMove(e) {
        if (e.touches.length !== 1) return;
        
        const touch = e.touches[0];
        this.touchCurrentX = touch.clientX;
        this.touchCurrentY = touch.clientY;
        
        const deltaX = this.touchCurrentX - this.touchStartX;
        const deltaY = this.touchCurrentY - this.touchStartY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // Cancella long press se c'è movimento significativo
        if (distance > 10) {
            this.cancelLongPress();
            this.removeTouchFeedback();
        }
        
        // Determina se è uno swipe orizzontale
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 15) {
            this.isSwiping = true;
            e.preventDefault();
            
            // Calcola progress e feedback visivo migliorato
            const progress = Math.min(Math.abs(deltaX) / this.swipeThreshold, 1);
            const opacity = 1 - progress * 0.6;
            const scale = 1 - progress * 0.05;
            
            // Applica trasformazione con easing
            const easedDeltaX = deltaX * (1 - Math.pow(progress, 2) * 0.3);
            this.element.style.transform = `translateX(${easedDeltaX}px) scale(${scale})`;
            this.element.style.opacity = opacity;
            
            // Feedback tattile quando si raggiunge la soglia
            if (progress >= 0.7 && !this.element.hasAttribute('data-swipe-threshold-reached')) {
                this.element.setAttribute('data-swipe-threshold-reached', 'true');
                this.provideTactileFeedback('medium');
                this.element.classList.add('notification--swipe-threshold');
            }
        }
    }

    /**
     * Gestisce touch end per swipe gesture con animazioni fluide
     */
    handleTouchEnd(e) {
        this.cancelLongPress();
        this.removeTouchFeedback();
        
        const deltaX = this.touchCurrentX - this.touchStartX;
        const deltaY = this.touchCurrentY - this.touchStartY;
        const touchDuration = Date.now() - this.touchStartTime;
        const velocity = Math.abs(deltaX) / touchDuration; // px/ms
        
        // Gestione tap semplice
        if (!this.isSwiping && Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10 && touchDuration < 300) {
            this.handleTap(e);
            this.resumeAutoClose();
            return;
        }
        
        if (!this.isSwiping) {
            this.resumeAutoClose();
            return;
        }
        
        // Calcola se il swipe deve essere completato
        const shouldComplete = Math.abs(deltaX) > this.swipeThreshold || velocity > 0.5;
        
        if (shouldComplete) {
            // Swipe completato - chiudi notifica con animazione
            this.element.classList.add('notification--swipe-closing');
            this.provideTactileFeedback('heavy');
            
            // Animazione di chiusura fluida
            const direction = deltaX > 0 ? 1 : -1;
            this.element.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.3s ease-out';
            this.element.style.transform = `translateX(${direction * 100}%) scale(0.9)`;
            this.element.style.opacity = '0';
            
            setTimeout(() => {
                this.close();
            }, 300);
        } else {
            // Swipe incompleto - ripristina posizione con animazione elastica
            this.element.style.transition = 'transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55), opacity 0.3s ease-out';
            this.element.style.transform = '';
            this.element.style.opacity = '';
            
            // Rimuovi classe threshold dopo animazione
            setTimeout(() => {
                this.element.classList.remove('notification--swipe-threshold');
                this.element.removeAttribute('data-swipe-threshold-reached');
                this.element.style.transition = '';
            }, 400);
            
            this.resumeAutoClose();
        }
        
        this.isSwiping = false;
    }

    /**
     * Gestisce touch cancel (interruzione touch)
     */
    handleTouchCancel(e) {
        this.cancelLongPress();
        this.removeTouchFeedback();
        
        if (this.isSwiping) {
            // Ripristina posizione se touch viene cancellato durante swipe
            this.element.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
            this.element.style.transform = '';
            this.element.style.opacity = '';
            
            setTimeout(() => {
                this.element.classList.remove('notification--swipe-threshold');
                this.element.removeAttribute('data-swipe-threshold-reached');
                this.element.style.transition = '';
            }, 300);
        }
        
        this.isSwiping = false;
        this.resumeAutoClose();
    }

    /**
     * Gestisce tap semplice su notifica
     */
    handleTap(e) {
        // Se il tap è su un elemento interattivo, non fare nulla
        if (e.target.closest('button, a, [role="button"]')) {
            return;
        }
        
        // Feedback tattile per tap
        this.provideTactileFeedback('light');
        
        // Focus sulla notifica per accessibilità
        if (this.options.enableKeyboardNavigation) {
            this.element.focus();
        }
        
        this.dispatchEvent('tapped', { originalEvent: e });
    }

    /**
     * Avvia timer per long press
     */
    startLongPressTimer() {
        this.cancelLongPress();
        
        this.longPressTimer = setTimeout(() => {
            if (!this.isSwiping) {
                this.handleLongPress();
            }
        }, this.longPressDelay);
    }

    /**
     * Cancella timer long press
     */
    cancelLongPress() {
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
        this.isLongPress = false;
    }

    /**
     * Gestisce long press
     */
    handleLongPress() {
        this.isLongPress = true;
        this.provideTactileFeedback('heavy');
        
        // Aggiungi classe per feedback visivo
        this.element.classList.add('notification--long-pressed');
        
        // Mostra menu contestuale o azioni aggiuntive se disponibili
        if (this.options.actions && this.options.actions.length > 0) {
            this.showContextMenu();
        } else if (this.options.closable) {
            // Se non ci sono azioni, offri chiusura rapida
            this.showQuickCloseHint();
        }
        
        this.dispatchEvent('longPressed');
    }

    /**
     * Mostra menu contestuale per azioni
     */
    showContextMenu() {
        // Implementazione base - può essere estesa
        this.element.classList.add('notification--context-menu-active');
        
        // Rimuovi dopo 2 secondi se non c'è interazione
        setTimeout(() => {
            this.element.classList.remove('notification--context-menu-active');
        }, 2000);
    }

    /**
     * Mostra hint per chiusura rapida
     */
    showQuickCloseHint() {
        this.element.classList.add('notification--quick-close-hint');
        
        setTimeout(() => {
            this.element.classList.remove('notification--quick-close-hint');
        }, 1500);
    }

    /**
     * Aggiunge feedback visivo per touch
     */
    addTouchFeedback() {
        this.element.classList.add('notification--touched');
        
        // Rimuovi automaticamente dopo breve delay
        this.touchFeedbackTimer = setTimeout(() => {
            this.removeTouchFeedback();
        }, 150);
    }

    /**
     * Rimuove feedback visivo per touch
     */
    removeTouchFeedback() {
        if (this.touchFeedbackTimer) {
            clearTimeout(this.touchFeedbackTimer);
            this.touchFeedbackTimer = null;
        }
        
        this.element.classList.remove('notification--touched', 'notification--long-pressed');
    }

    /**
     * Fornisce feedback tattile se supportato
     */
    provideTactileFeedback(intensity = 'light') {
        // Verifica supporto vibrazione e che sia un dispositivo mobile
        if (!navigator.vibrate || !this.isMobileDevice()) {
            return;
        }
        
        // Pattern di vibrazione basati sull'intensità
        const patterns = {
            light: [10],
            medium: [20],
            heavy: [30],
            success: [10, 50, 10],
            error: [50, 100, 50]
        };
        
        const pattern = patterns[intensity] || patterns.light;
        
        try {
            navigator.vibrate(pattern);
        } catch (error) {
            // Ignora errori di vibrazione
            console.debug('Vibrazione non disponibile:', error);
        }
    }

    /**
     * Verifica se è un dispositivo mobile
     */
    isMobileDevice() {
        // Verifica user agent per dispositivi mobili noti
        const mobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // Verifica supporto touch
        const hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);
        
        // Verifica dimensioni schermo (mobile tipicamente < 768px)
        const isMobileScreen = window.innerWidth <= 767;
        
        // È mobile se ha user agent mobile O (ha touch E schermo piccolo)
        return mobileUserAgent || (hasTouch && isMobileScreen);
    }

    /**
     * Ottimizza touch targets per accessibilità
     */
    optimizeTouchTargets() {
        // Assicura che tutti i pulsanti abbiano dimensioni minime adeguate
        const buttons = this.element.querySelectorAll('button, [role="button"]');
        
        buttons.forEach(button => {
            const rect = button.getBoundingClientRect();
            
            // Se il target è troppo piccolo, aggiungi padding
            if (rect.width < 44 || rect.height < 44) {
                button.classList.add('notification__touch-target--enhanced');
            }
        });
    }

    /**
     * Gestisce click su azione personalizzata
     */
    handleActionClick(actionIndex) {
        const action = this.options.actions[actionIndex];
        if (action && typeof action.action === 'function') {
            try {
                action.action(this);
                this.dispatchEvent('actionClicked', { actionIndex, action });
            } catch (error) {
                console.error('Errore nell\'esecuzione dell\'azione:', error);
            }
        }
    }

    /**
     * Gestisce fine animazione
     */
    handleAnimationEnd(e) {
        if (e.target !== this.element) return;
        
        const animationName = e.animationName;
        
        // Gestisce fine animazione di uscita
        if (this.element.classList.contains('notification--exiting')) {
            if (animationName === 'slideOutRight' || 
                animationName === 'slideOutUp' || 
                animationName === 'fadeOut') {
                this.remove();
            }
        } 
        // Gestisce fine animazione di entrata
        else if (this.element.classList.contains('notification--entering')) {
            if (animationName === 'slideInRight' || 
                animationName === 'slideInDown') {
                this.element.classList.remove('notification--entering');
                this.isVisible = true;
                this.dispatchEvent('shown');
            }
        }
    }

    /**
     * Mostra la notifica con animazione
     */
    show() {
        if (this.isVisible) return;
        
        let prefersReducedMotion = false;
        try {
            prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        } catch (error) {
            // Fallback se matchMedia non è disponibile
            prefersReducedMotion = false;
        }
        
        this.dispatchEvent('showing');
        
        if (this.options.enableAnimations && !prefersReducedMotion) {
            // Assicurati che l'elemento sia inizialmente nascosto
            this.element.style.opacity = '0';
            this.element.style.transform = this.getInitialTransform();
            
            // Forza reflow per assicurare che gli stili iniziali siano applicati
            this.element.offsetHeight;
            
            // Avvia animazione di entrata
            this.element.classList.add('notification--entering');
            
            // Rimuovi stili inline per permettere all'animazione CSS di funzionare
            requestAnimationFrame(() => {
                this.element.style.opacity = '';
                this.element.style.transform = '';
            });
        } else {
            this.isVisible = true;
            this.dispatchEvent('shown');
        }
        
        // Focus automatico se richiesto
        if (this.type === 'error' || this.type === 'warning') {
            setTimeout(() => {
                this.element.focus();
            }, this.options.enableAnimations && !prefersReducedMotion ? 350 : 100);
        }
    }

    /**
     * Ottiene trasformazione iniziale per animazione di entrata
     */
    getInitialTransform() {
        const isMobile = window.innerWidth <= 767;
        return isMobile ? 'translateY(-100%)' : 'translateX(100%)';
    }

    /**
     * Chiude la notifica
     */
    close() {
        if (this.isRemoving) return;
        
        this.isRemoving = true;
        this.clearAutoCloseTimer();
        this.stopProgressBar();
        
        this.dispatchEvent('closing');
        
        let prefersReducedMotion = false;
        try {
            prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        } catch (error) {
            // Fallback se matchMedia non è disponibile
            prefersReducedMotion = false;
        }
        
        if (this.options.enableAnimations && !prefersReducedMotion) {
            // Rimuovi classe entering se presente
            this.element.classList.remove('notification--entering');
            
            // Aggiungi classe exiting per animazione di uscita
            this.element.classList.add('notification--exiting');
            
            // Fallback timeout nel caso l'evento animationend non venga triggerato
            setTimeout(() => {
                if (this.isRemoving && this.element && this.element.parentNode) {
                    this.remove();
                }
            }, 350); // Leggermente più lungo della durata dell'animazione (0.3s)
        } else {
            this.remove();
        }
    }

    /**
     * Rimuove la notifica dal DOM
     */
    remove() {
        this.cleanup();
        
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        
        this.dispatchEvent('removed');
    }

    /**
     * Pulisce event listeners e timer
     */
    cleanup() {
        // Rimuovi event listeners
        if (this.options.enableKeyboardNavigation) {
            this.element.removeEventListener('keydown', this.handleKeyDown);
            this.element.removeEventListener('focusin', this.handleFocusIn);
            this.element.removeEventListener('focusout', this.handleFocusOut);
        }
        
        this.element.removeEventListener('mouseenter', this.handleMouseEnter);
        this.element.removeEventListener('mouseleave', this.handleMouseLeave);
        
        // Rimuovi touch event listeners
        this.element.removeEventListener('touchstart', this.handleTouchStart);
        this.element.removeEventListener('touchmove', this.handleTouchMove);
        this.element.removeEventListener('touchend', this.handleTouchEnd);
        this.element.removeEventListener('touchcancel', this.handleTouchCancel);
        
        if (this.closeButton) {
            this.closeButton.removeEventListener('click', this.close);
        }
        
        this.actionButtons.forEach((button, index) => {
            button.removeEventListener('click', this.handleActionClick);
        });
        
        // Pulisci timer
        this.clearAutoCloseTimer();
        this.cancelLongPress();
        this.removeTouchFeedback();
        
        if (this.progressTimer) {
            clearTimeout(this.progressTimer);
            this.progressTimer = null;
        }

        // Ferma progress bar
        this.stopProgressBar();
    }

    /**
     * Aggiorna contenuto della notifica
     */
    updateContent(newData) {
        if (newData.message !== undefined) {
            this.message = newData.message;
            const messageElement = this.element.querySelector('.notification__message');
            if (messageElement) {
                messageElement.textContent = this.message;
            }
        }
        
        if (newData.title !== undefined) {
            this.title = newData.title;
            const titleElement = this.element.querySelector('.notification__title');
            if (titleElement) {
                titleElement.textContent = this.title;
            } else if (this.title) {
                // Aggiungi titolo se non esisteva
                const bodyElement = this.element.querySelector('.notification__body');
                const titleEl = document.createElement('div');
                titleEl.className = 'notification__title';
                titleEl.textContent = this.title;
                bodyElement.insertBefore(titleEl, bodyElement.firstChild);
            }
        }
        
        // Aggiorna screen reader
        this.announceToScreenReader();
        this.dispatchEvent('updated', { newData });
    }

    /**
     * Ottiene stato della notifica
     */
    getState() {
        return {
            id: this.id,
            type: this.type,
            message: this.message,
            title: this.title,
            timestamp: this.timestamp,
            isVisible: this.isVisible,
            isRemoving: this.isRemoving,
            isPaused: this.isPaused,
            options: { ...this.options }
        };
    }

    /**
     * Dispatch eventi personalizzati
     */
    dispatchEvent(eventName, detail = {}) {
        const event = new CustomEvent(`notification:${eventName}`, {
            detail: {
                notification: this,
                id: this.id,
                type: this.type,
                ...detail
            }
        });
        
        if (this.element) {
            this.element.dispatchEvent(event);
        }
        
        document.dispatchEvent(event);
    }

    /**
     * Escape HTML per sicurezza
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Metodi statici di utilità
     */
    
    /**
     * Crea notifica di successo
     */
    static success(message, options = {}) {
        return new NotificationComponent({
            type: 'success',
            message,
            ...options
        });
    }

    /**
     * Crea notifica di errore
     */
    static error(message, options = {}) {
        return new NotificationComponent({
            type: 'error',
            message,
            persistent: true,
            ...options
        });
    }

    /**
     * Crea notifica di warning
     */
    static warning(message, options = {}) {
        return new NotificationComponent({
            type: 'warning',
            message,
            ...options
        });
    }

    /**
     * Crea notifica informativa
     */
    static info(message, options = {}) {
        return new NotificationComponent({
            type: 'info',
            message,
            ...options
        });
    }

    /**
     * Verifica se il tipo è valido
     */
    static isValidType(type) {
        return Object.keys(NOTIFICATION_TYPES).includes(type.toUpperCase());
    }

    /**
     * Ottiene configurazione per tipo
     */
    static getTypeConfig(type) {
        return NOTIFICATION_TYPES[type.toUpperCase()] || NOTIFICATION_TYPES.INFO;
    }

    /**
     * Ottiene tutti i tipi supportati
     */
    static getSupportedTypes() {
        return Object.keys(NOTIFICATION_TYPES).map(key => key.toLowerCase());
    }
}

export default NotificationComponent;