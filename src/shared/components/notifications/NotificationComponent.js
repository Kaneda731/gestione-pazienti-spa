/**
 * NotificationComponent - Componente singola notifica con accessibilità completa
 * Gestisce rendering, interazioni, animazioni e supporto screen reader
 */

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

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

// ============================================================================
// NOTIFICATION COMPONENT CLASS
// ============================================================================

export class NotificationComponent {
    constructor(data, options = {}) {
        // Core properties
        this.id = data.id || this.generateId();
        this.type = data.type || 'info';
        this.message = data.message || '';
        this.title = data.title || '';
        this.timestamp = data.timestamp || new Date();
        
        // Options
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

        // DOM elements
        this.element = null;
        this.progressElement = null;
        this.closeButton = null;
        this.actionButtons = [];

        // State
        this.timer = null;
        this.progressTimer = null;
        this.isVisible = false;
        this.isRemoving = false;
        this.isPaused = false;
        this.focusableElements = [];
        this.currentFocusIndex = -1;

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
        this.swipeThreshold = 80;
        this.longPressDelay = 500;

        // Bind methods
        this.bindEventHandlers();

        this.init();
    }

    // ========================================================================
    // INITIALIZATION METHODS
    // ========================================================================

    init() {
        this.createElement();
        this.setupAccessibility();
        this.setupEventListeners();
        this.setupAutoClose();
        this.announceToScreenReader();
        
        setTimeout(() => {
            this.optimizeTouchTargets();
        }, 0);
    }

    bindEventHandlers() {
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
    }

    generateId() {
        return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    // ========================================================================
    // DOM CREATION METHODS
    // ========================================================================

    createElement() {
        const typeConfig = NOTIFICATION_TYPES[this.type.toUpperCase()] || NOTIFICATION_TYPES.INFO;
        
        this.element = document.createElement('div');
        this.element.className = `notification notification--${this.type}`;
        this.element.setAttribute('data-id', this.id);
        this.element.setAttribute('data-type', this.type);
        this.element.setAttribute('data-timestamp', this.timestamp.toISOString());
        
        this.element.innerHTML = this.createNotificationHTML(typeConfig);
        
        this.cacheElementReferences();
        this.updateFocusableElements();
    }

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

    cacheElementReferences() {
        this.closeButton = this.element.querySelector('.notification__close');
        this.progressElement = this.element.querySelector('.notification__progress');
        this.actionButtons = Array.from(this.element.querySelectorAll('.notification__action-btn'));
    }

    // ========================================================================
    // ACCESSIBILITY METHODS
    // ========================================================================

    setupAccessibility() {
        const typeConfig = NOTIFICATION_TYPES[this.type.toUpperCase()] || NOTIFICATION_TYPES.INFO;
        
        // Main ARIA attributes
        this.element.setAttribute('role', typeConfig.ariaRole);
        this.element.setAttribute('aria-live', typeConfig.ariaLive);
        this.element.setAttribute('aria-atomic', 'true');
        this.element.setAttribute('aria-labelledby', `${this.id}-message`);
        
        // Keyboard navigation
        if (this.options.enableKeyboardNavigation) {
            this.element.setAttribute('tabindex', '0');
        }

        // Message ID
        const messageElement = this.element.querySelector('.notification__message');
        if (messageElement) {
            messageElement.id = `${this.id}-message`;
        }

        // Progress bar accessibility
        if (this.progressElement) {
            this.progressElement.setAttribute('role', 'progressbar');
            this.progressElement.setAttribute('aria-hidden', 'true');
        }

        // High contrast support
        this.element.setAttribute('data-high-contrast', 'true');
    }

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

        if (this.element.hasAttribute('tabindex') && this.element.getAttribute('tabindex') !== '-1') {
            this.focusableElements.unshift(this.element);
        }
    }

    announceToScreenReader() {
        if (!this.options.enableScreenReader) return;

        let announcer = document.getElementById('notification-announcer');
        if (!announcer) {
            announcer = document.createElement('div');
            announcer.id = 'notification-announcer';
            announcer.className = 'notification__sr-only';
            announcer.setAttribute('aria-live', 'polite');
            announcer.setAttribute('aria-atomic', 'true');
            document.body.appendChild(announcer);
        }

        setTimeout(() => {
            announcer.textContent = this.createScreenReaderText();
        }, 100);
    }

    optimizeTouchTargets() {
        const buttons = this.element.querySelectorAll('button, [role="button"]');
        
        buttons.forEach(button => {
            const rect = button.getBoundingClientRect();
            
            if (rect.width < 44 || rect.height < 44) {
                button.classList.add('notification__touch-target--enhanced');
            }
        });
    }

    // ========================================================================
    // EVENT LISTENER SETUP
    // ========================================================================

    setupEventListeners() {
        this.setupKeyboardEvents();
        this.setupMouseEvents();
        this.setupTouchEvents();
        this.setupButtonEvents();
        this.setupAnimationEvents();
    }

    setupKeyboardEvents() {
        if (this.options.enableKeyboardNavigation) {
            this.element.addEventListener('keydown', this.handleKeyDown);
            this.element.addEventListener('focusin', this.handleFocusIn);
            this.element.addEventListener('focusout', this.handleFocusOut);
        }
    }

    setupMouseEvents() {
        this.element.addEventListener('mouseenter', this.handleMouseEnter);
        this.element.addEventListener('mouseleave', this.handleMouseLeave);
    }

    setupTouchEvents() {
        this.element.addEventListener('touchstart', this.handleTouchStart, { passive: false });
        this.element.addEventListener('touchmove', this.handleTouchMove, { passive: false });
        this.element.addEventListener('touchend', this.handleTouchEnd, { passive: false });
        this.element.addEventListener('touchcancel', this.handleTouchCancel, { passive: false });
    }

    setupButtonEvents() {
        if (this.closeButton) {
            this.closeButton.addEventListener('click', this.close);
        }

        this.actionButtons.forEach((button, index) => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleActionClick(index);
            });
        });
    }

    setupAnimationEvents() {
        if (this.options.enableAnimations) {
            this.element.addEventListener('animationend', (e) => {
                this.handleAnimationEnd(e);
            });
        }
    }

    // ========================================================================
    // KEYBOARD NAVIGATION METHODS
    // ========================================================================

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

    handleTabNavigation(e) {
        if (this.focusableElements.length <= 1) return;

        const currentIndex = this.focusableElements.indexOf(e.target);
        
        if (e.shiftKey) {
            if (currentIndex === 0) {
                e.preventDefault();
                this.focusElement(this.focusableElements.length - 1);
            }
        } else {
            if (currentIndex === this.focusableElements.length - 1) {
                e.preventDefault();
                this.focusElement(0);
            }
        }
    }

    handleArrowNavigation(isDown) {
        const currentIndex = this.focusableElements.indexOf(document.activeElement);
        let nextIndex;

        if (currentIndex === -1) {
            nextIndex = 0;
        } else if (isDown) {
            nextIndex = currentIndex < this.focusableElements.length - 1 ? currentIndex + 1 : 0;
        } else {
            nextIndex = currentIndex > 0 ? currentIndex - 1 : this.focusableElements.length - 1;
        }

        this.focusElement(nextIndex);
    }

    focusElement(index) {
        if (index >= 0 && index < this.focusableElements.length) {
            this.focusableElements[index].focus();
            this.currentFocusIndex = index;
        }
    }

    focusFirstFocusableElement() {
        if (this.focusableElements.length > 0) {
            this.focusElement(0);
        }
    }

    handleFocusIn(e) {
        this.element.classList.add('notification--focused');
        this.pauseAutoClose();
    }

    handleFocusOut(e) {
        if (!this.element.contains(e.relatedTarget)) {
            this.element.classList.remove('notification--focused');
            this.resumeAutoClose();
        }
    }

    // ========================================================================
    // MOUSE EVENT METHODS
    // ========================================================================

    handleMouseEnter() {
        this.pauseAutoClose();
    }

    handleMouseLeave() {
        this.resumeAutoClose();
    }

    // ========================================================================
    // TOUCH EVENT METHODS
    // ========================================================================

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
        
        this.pauseAutoClose();
        this.addTouchFeedback();
        this.startLongPressTimer();
        this.provideTactileFeedback('light');
    }

    handleTouchMove(e) {
        if (e.touches.length !== 1) return;
        
        const touch = e.touches[0];
        this.touchCurrentX = touch.clientX;
        this.touchCurrentY = touch.clientY;
        
        const deltaX = this.touchCurrentX - this.touchStartX;
        const deltaY = this.touchCurrentY - this.touchStartY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        if (distance > 10) {
            this.cancelLongPress();
            this.removeTouchFeedback();
        }
        
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 15) {
            this.handleSwipeMove(deltaX, e);
        }
    }

    handleSwipeMove(deltaX, e) {
        this.isSwiping = true;
        e.preventDefault();
        
        const progress = Math.min(Math.abs(deltaX) / this.swipeThreshold, 1);
        const opacity = 1 - progress * 0.6;
        const scale = 1 - progress * 0.05;
        
        const easedDeltaX = deltaX * (1 - Math.pow(progress, 2) * 0.3);
        this.element.style.transform = `translateX(${easedDeltaX}px) scale(${scale})`;
        this.element.style.opacity = opacity;
        
        if (progress >= 0.7 && !this.element.hasAttribute('data-swipe-threshold-reached')) {
            this.element.setAttribute('data-swipe-threshold-reached', 'true');
            this.provideTactileFeedback('medium');
            this.element.classList.add('notification--swipe-threshold');
        }
    }

    handleTouchEnd(e) {
        this.cancelLongPress();
        this.removeTouchFeedback();
        
        const deltaX = this.touchCurrentX - this.touchStartX;
        const deltaY = this.touchCurrentY - this.touchStartY;
        const touchDuration = Date.now() - this.touchStartTime;
        const velocity = Math.abs(deltaX) / touchDuration;
        
        if (!this.isSwiping && Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10 && touchDuration < 300) {
            this.handleTap(e);
            this.resumeAutoClose();
            return;
        }
        
        if (!this.isSwiping) {
            this.resumeAutoClose();
            return;
        }
        
        const shouldComplete = Math.abs(deltaX) > this.swipeThreshold || velocity > 0.5;
        
        if (shouldComplete) {
            this.completeSwipe(deltaX);
        } else {
            this.cancelSwipe();
        }
        
        this.isSwiping = false;
    }

    completeSwipe(deltaX) {
        this.element.classList.add('notification--swipe-closing');
        this.provideTactileFeedback('heavy');
        
        const direction = deltaX > 0 ? 1 : -1;
        this.element.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.3s ease-out';
        this.element.style.transform = `translateX(${direction * 100}%) scale(0.9)`;
        this.element.style.opacity = '0';
        
        setTimeout(() => {
            this.close();
        }, 300);
    }

    cancelSwipe() {
        this.element.style.transition = 'transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55), opacity 0.3s ease-out';
        this.element.style.transform = '';
        this.element.style.opacity = '';
        
        setTimeout(() => {
            this.element.classList.remove('notification--swipe-threshold');
            this.element.removeAttribute('data-swipe-threshold-reached');
            this.element.style.transition = '';
        }, 400);
        
        this.resumeAutoClose();
    }

    handleTouchCancel(e) {
        this.cancelLongPress();
        this.removeTouchFeedback();
        
        if (this.isSwiping) {
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

    handleTap(e) {
        if (e.target.closest('button, a, [role="button"]')) {
            return;
        }
        
        this.provideTactileFeedback('light');
        
        if (this.options.enableKeyboardNavigation) {
            this.element.focus();
        }
        
        this.dispatchEvent('tapped', { originalEvent: e });
    }

    // ========================================================================
    // LONG PRESS METHODS
    // ========================================================================

    startLongPressTimer() {
        this.cancelLongPress();
        
        this.longPressTimer = setTimeout(() => {
            if (!this.isSwiping) {
                this.handleLongPress();
            }
        }, this.longPressDelay);
    }

    cancelLongPress() {
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
        this.isLongPress = false;
    }

    handleLongPress() {
        this.isLongPress = true;
        this.provideTactileFeedback('heavy');
        
        this.element.classList.add('notification--long-pressed');
        
        if (this.options.actions && this.options.actions.length > 0) {
            this.showContextMenu();
        } else if (this.options.closable) {
            this.showQuickCloseHint();
        }
        
        this.dispatchEvent('longPressed');
    }

    showContextMenu() {
        this.element.classList.add('notification--context-menu-active');
        
        setTimeout(() => {
            this.element.classList.remove('notification--context-menu-active');
        }, 2000);
    }

    showQuickCloseHint() {
        this.element.classList.add('notification--quick-close-hint');
        
        setTimeout(() => {
            this.element.classList.remove('notification--quick-close-hint');
        }, 1500);
    }

    // ========================================================================
    // TOUCH FEEDBACK METHODS
    // ========================================================================

    addTouchFeedback() {
        this.element.classList.add('notification--touched');
        
        this.touchFeedbackTimer = setTimeout(() => {
            this.removeTouchFeedback();
        }, 150);
    }

    removeTouchFeedback() {
        if (this.touchFeedbackTimer) {
            clearTimeout(this.touchFeedbackTimer);
            this.touchFeedbackTimer = null;
        }
        
        this.element.classList.remove('notification--touched', 'notification--long-pressed');
    }

    provideTactileFeedback(intensity = 'light') {
        if (!navigator.vibrate || !this.isMobileDevice()) {
            return;
        }
        
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
            console.debug('Vibrazione non disponibile:', error);
        }
    }

    isMobileDevice() {
        const mobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);
        const isMobileScreen = window.innerWidth <= 767;
        
        return mobileUserAgent || (hasTouch && isMobileScreen);
    }

    // ========================================================================
    // AUTO-CLOSE TIMER METHODS
    // ========================================================================

    setupAutoClose() {
        const duration = this.getDuration();
        
        if (duration > 0 && !this.options.persistent) {
            this.startAutoCloseTimer(duration);
            
            if (this.options.enableProgressBar && this.progressElement) {
                this.startProgressBar(duration);
            }
        }
    }

    getDuration() {
        if (this.options.duration !== undefined) {
            return this.options.duration;
        }
        
        const typeConfig = NOTIFICATION_TYPES[this.type.toUpperCase()] || NOTIFICATION_TYPES.INFO;
        return typeConfig.defaultDuration;
    }

    startAutoCloseTimer(duration) {
        this.clearAutoCloseTimer();
        
        this.timer = setTimeout(() => {
            if (!this.isRemoving) {
                this.close();
            }
        }, duration);
    }

    clearAutoCloseTimer() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }

    pauseAutoClose() {
        if (this.isPaused) return;
        
        this.isPaused = true;
        this.clearAutoCloseTimer();
        this.pauseProgressBar();
        
        this.dispatchEvent('paused');
    }

    resumeAutoClose() {
        if (!this.isPaused) return;
        
        this.isPaused = false;
        
        const duration = this.getDuration();
        if (duration > 0 && !this.options.persistent && !this.isRemoving) {
            const remainingTime = this.calculateRemainingTime(duration);
            this.startAutoCloseTimer(remainingTime);
        }
        
        this.resumeProgressBar();
        this.dispatchEvent('resumed');
    }

    calculateRemainingTime(originalDuration) {
        if (!this.progressElement) return originalDuration;
        
        const computedStyle = window.getComputedStyle(this.progressElement, '::after');
        const transform = computedStyle.transform;
        
        return originalDuration * 0.5; // Conservative estimate
    }

    // ========================================================================
    // PROGRESS BAR METHODS
    // ========================================================================

    startProgressBar(duration) {
        if (!this.progressElement) return;
        
        this.progressElement.style.setProperty('--progress-duration', `${duration}ms`);
        this.progressElement.classList.add('notification__progress--active');
        
        this.progressElement.addEventListener('animationend', (e) => {
            if (e.animationName === 'progressCountdown') {
                this.progressElement.classList.remove('notification__progress--active');
            }
        }, { once: true });
    }

    pauseProgressBar() {
        if (this.progressElement) {
            this.progressElement.classList.add('notification__progress--paused');
            this.progressElement.classList.remove('notification__progress--resumed');
        }
    }

    resumeProgressBar() {
        if (this.progressElement) {
            this.progressElement.classList.remove('notification__progress--paused');
            this.progressElement.classList.add('notification__progress--resumed');
        }
    }

    stopProgressBar() {
        if (this.progressElement) {
            this.progressElement.classList.remove(
                'notification__progress--active',
                'notification__progress--paused',
                'notification__progress--resumed'
            );
        }
    }

    // ========================================================================
    // ACTION HANDLING METHODS
    // ========================================================================

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

    // ========================================================================
    // ANIMATION METHODS
    // ========================================================================

    handleAnimationEnd(e) {
        if (e.target !== this.element) return;
        
        const animationName = e.animationName;
        
        if (this.element.classList.contains('notification--exiting')) {
            if (animationName === 'slideOutRight' || 
                animationName === 'slideOutUp' || 
                animationName === 'fadeOut') {
                this.remove();
            }
        } else if (this.element.classList.contains('notification--entering')) {
            if (animationName === 'slideInRight' || 
                animationName === 'slideInDown') {
                this.element.classList.remove('notification--entering');
                this.isVisible = true;
                this.dispatchEvent('shown');
            }
        }
    }

    show() {
        if (this.isVisible) return;
        
        const prefersReducedMotion = this.prefersReducedMotion();
        
        this.dispatchEvent('showing');
        
        if (this.options.enableAnimations && !prefersReducedMotion) {
            this.showWithAnimation();
        } else {
            this.isVisible = true;
            this.dispatchEvent('shown');
        }
        
        this.focusIfNeeded(prefersReducedMotion);
    }

    showWithAnimation() {
        this.element.style.opacity = '0';
        this.element.style.transform = this.getInitialTransform();
        
        this.element.offsetHeight; // Force reflow
        
        this.element.classList.add('notification--entering');
        
        requestAnimationFrame(() => {
            this.element.style.opacity = '';
            this.element.style.transform = '';
        });
    }

    focusIfNeeded(prefersReducedMotion) {
        if (this.type === 'error' || this.type === 'warning') {
            setTimeout(() => {
                this.element.focus();
            }, this.options.enableAnimations && !prefersReducedMotion ? 350 : 100);
        }
    }

    getInitialTransform() {
        const isMobile = window.innerWidth <= 767;
        return isMobile ? 'translateY(-100%)' : 'translateX(100%)';
    }

    prefersReducedMotion() {
        try {
            return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        } catch (error) {
            return false;
        }
    }

    // ========================================================================
    // CLOSE AND REMOVE METHODS
    // ========================================================================

    close() {
        if (this.isRemoving) return;
        
        this.isRemoving = true;
        this.clearAutoCloseTimer();
        this.stopProgressBar();
        
        this.dispatchEvent('closing');
        
        const prefersReducedMotion = this.prefersReducedMotion();
        
        if (this.options.enableAnimations && !prefersReducedMotion) {
            this.closeWithAnimation();
        } else {
            this.remove();
        }
    }

    closeWithAnimation() {
        this.element.classList.remove('notification--entering');
        this.element.classList.add('notification--exiting');
        
        setTimeout(() => {
            if (this.isRemoving && this.element && this.element.parentNode) {
                this.remove();
            }
        }, 350);
    }

    remove() {
        this.cleanup();
        
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        
        this.dispatchEvent('removed');
    }

    // ========================================================================
    // CLEANUP METHODS
    // ========================================================================

    cleanup() {
        this.removeEventListeners();
        this.clearTimers();
        this.stopProgressBar();
    }

    removeEventListeners() {
        if (this.options.enableKeyboardNavigation) {
            this.element.removeEventListener('keydown', this.handleKeyDown);
            this.element.removeEventListener('focusin', this.handleFocusIn);
            this.element.removeEventListener('focusout', this.handleFocusOut);
        }
        
        this.element.removeEventListener('mouseenter', this.handleMouseEnter);
        this.element.removeEventListener('mouseleave', this.handleMouseLeave);
        
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
    }

    clearTimers() {
        this.clearAutoCloseTimer();
        this.cancelLongPress();
        this.removeTouchFeedback();
        
        if (this.progressTimer) {
            clearTimeout(this.progressTimer);
            this.progressTimer = null;
        }
    }

    // ========================================================================
    // UPDATE AND STATE METHODS
    // ========================================================================

    updateContent(newData) {
        if (newData.message !== undefined) {
            this.message = newData.message;
            const messageElement = this.element.querySelector('.notification__message');
            if (messageElement) {
                messageElement.textContent = this.message;
            }
        }
        
        if (newData.title !== undefined) {
            this.updateTitle(newData.title);
        }
        
        this.announceToScreenReader();
        this.dispatchEvent('updated', { newData });
    }

    updateTitle(newTitle) {
        this.title = newTitle;
        const titleElement = this.element.querySelector('.notification__title');
        
        if (titleElement) {
            titleElement.textContent = this.title;
        } else if (this.title) {
            const bodyElement = this.element.querySelector('.notification__body');
            const titleEl = document.createElement('div');
            titleEl.className = 'notification__title';
            titleEl.textContent = this.title;
            bodyElement.insertBefore(titleEl, bodyElement.firstChild);
        }
    }

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

    // ========================================================================
    // EVENT DISPATCH AND UTILITY METHODS
    // ========================================================================

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

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ========================================================================
    // STATIC FACTORY METHODS
    // ========================================================================

    static success(message, options = {}) {
        return new NotificationComponent({
            type: 'success',
            message,
            ...options
        });
    }

    static error(message, options = {}) {
        return new NotificationComponent({
            type: 'error',
            message,
            persistent: true,
            ...options
        });
    }

    static warning(message, options = {}) {
        return new NotificationComponent({
            type: 'warning',
            message,
            ...options
        });
    }

    static info(message, options = {}) {
        return new NotificationComponent({
            type: 'info',
            message,
            ...options
        });
    }

    static isValidType(type) {
        return Object.keys(NOTIFICATION_TYPES).includes(type.toUpperCase());
    }

    static getTypeConfig(type) {
        return NOTIFICATION_TYPES[type.toUpperCase()] || NOTIFICATION_TYPES.INFO;
    }

    static getSupportedTypes() {
        return Object.keys(NOTIFICATION_TYPES).map(key => key.toLowerCase());
    }
}

export default NotificationComponent;