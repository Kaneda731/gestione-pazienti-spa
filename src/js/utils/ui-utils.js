// src/js/utils/ui-utils.js
// Utility functions per la gestione dell'interfaccia utente

/**
 * Imposta stato loading per pulsante
 */
export function setButtonLoading(button, text = 'Caricamento...') {
    if (!button) return;
    
    button.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span>${text}`;
    button.disabled = true;
    button.setAttribute('data-original-text', button.textContent);
}

/**
 * Ripristina pulsante normale
 */
export function resetButton(button, text = null) {
    if (!button) return;
    
    const originalText = text || button.getAttribute('data-original-text') || 'Invia';
    button.innerHTML = originalText;
    button.disabled = false;
    button.removeAttribute('data-original-text');
}

/**
 * Mostra messaggio in un contenitore specifico
 */
export function showMessage(container, message, type = 'info', icon = null) {
    if (!container) return;
    
    const alertType = type === 'error' ? 'danger' : type;
    const iconMap = {
        success: 'check_circle',
        error: 'error',
        warning: 'warning',
        info: 'info',
        danger: 'error'
    };
    
    const messageIcon = icon || iconMap[type] || 'info';
    
    // Crea alert container se non esiste
    let alertContainer = container.querySelector('.alert-container');
    if (!alertContainer) {
        alertContainer = document.createElement('div');
        alertContainer.className = 'alert-container';
        alertContainer.setAttribute('aria-live', type === 'danger' || type === 'error' ? 'assertive' : 'polite');
        alertContainer.setAttribute('aria-atomic', 'true');
        container.insertBefore(alertContainer, container.firstChild);
    }
    
    alertContainer.innerHTML = `
        <div class="alert alert-${alertType} d-flex align-items-center alert-dismissible" role="alert">
            <i class="material-icons me-2" aria-hidden="true">${messageIcon}</i>
            <div>${message}</div>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Chiudi messaggio"></button>
        </div>
    `;
    
    // Auto-rimuovi dopo 5 secondi per messaggi di successo
    if (type === 'success') {
        setTimeout(() => {
            const alert = alertContainer.querySelector('.alert');
            if (alert) {
                alert.remove();
            }
        }, 5000);
    }
}

/**
 * Rimuove tutti i messaggi da un contenitore
 */
export function clearMessages(container) {
    if (!container) return;
    
    const alerts = container.querySelectorAll('.alert-container, .alert');
    alerts.forEach(alert => alert.remove());
}

/**
 * Crea un elemento con attributi e classi
 */
export function createElement(tag, attributes = {}, classes = [], textContent = '') {
    const element = document.createElement(tag);
    
    // Aggiungi attributi
    Object.entries(attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
    });
    
    // Aggiungi classi
    if (classes.length > 0) {
        element.classList.add(...classes);
    }
    
    // Aggiungi contenuto testuale
    if (textContent) {
        element.textContent = textContent;
    }
    
    return element;
}

/**
 * Debounce function per limitare le chiamate di funzione
 */
export function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

/**
 * Gestisce lo stato di loading di un form
 */
export function setFormLoading(form, isLoading = true) {
    if (!form) return;
    
    const inputs = form.querySelectorAll('input, select, textarea');
    const buttons = form.querySelectorAll('button');
    
    inputs.forEach(input => {
        input.disabled = isLoading;
    });
    
    buttons.forEach(button => {
        if (isLoading) {
            setButtonLoading(button);
        } else {
            resetButton(button);
        }
    });
}

/**
 * Valida se un elemento è visibile nel viewport
 */
export function isElementInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

/**
 * Scroll smooth verso un elemento
 */
export function scrollToElement(element, offset = 0) {
    if (!element) return;
    
    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
    const offsetPosition = elementPosition - offset;
    
    window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
    });
}
